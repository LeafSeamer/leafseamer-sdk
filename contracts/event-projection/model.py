"""人工可信读取上下文中的离线投影模型；不实现鉴权或事务。"""
import copy
from dataclasses import dataclass
import hashlib
from functools import lru_cache
import rfc8785
from jsonschema import Draft202012Validator, FormatChecker
import build as B


def need(ok, reason):
    if not ok: raise ValueError(reason)


def digest(value): return 'sha256:' + hashlib.sha256(rfc8785.dumps(value)).hexdigest()


def source_ref(record):
    return dict(kind='command', scope=copy.deepcopy(record['scope']), object_id=record['command_id'],
                revision=record['revision'], digest=record['record_digest'])


@lru_cache(maxsize=1)
def validators():
    source=B.load(B.ROOT.parent/'negotiation/preview/models.schema.json')['$defs']
    target=B.build()['models.schema.json']['$defs']
    return (Draft202012Validator({'$ref':B.P+'command__CommandRecord','$defs':source},format_checker=FormatChecker()),
            Draft202012Validator({'$ref':B.P+'snapshot__Record','$defs':target},format_checker=FormatChecker()))


@dataclass(frozen=True)
class TrustedRead:
    """合成提供者的可信输入，不能作为请求body或客户端授权声明。"""
    record_ref: dict
    device_id: str
    entity_epoch: str
    subject_kind: str
    permissions: frozenset
    current_authorization: bool
    current_generation: bool
    source_publishable: bool
    origin_owned: bool
    paired: bool


def project(record, context):
    validators()[0].validate(record)
    need(context.current_authorization and context.current_generation and context.source_publishable, '释放资格无效')
    need('command.read' in context.permissions, '缺命令读取权')
    need(context.subject_kind == 'human' or (context.subject_kind == 'service' and context.paired and
         context.origin_owned and record['origin']=='automation'), '主体或服务来源不符')
    need(record['target']['device_id']==context.device_id and source_ref(record)==context.record_ref, '可信来源不符')
    need(record['record_digest']==digest({k:v for k,v in record.items() if k!='record_digest'}), '记录摘要错误')
    s=record['state']
    need(s['scope']==record['scope'] and s['command_id']==record['command_id'] and s['revision']==record['revision'], 'State身份错配')
    need(record['state_ref']==dict(id=s['command_id'],revision=s['revision'],digest=digest(s)), 'State摘要错误')
    need(record['request_identity']['key']['target_scope']==record['scope'], '请求权威错配')
    need(record['initial_command_ref']['scope']==record['scope'] and record['initial_command_ref']['object_id']==record['command_id']
         and record['initial_command_ref']['revision']=='1', '受理引用错配')
    need(record['completion']['evidence_refs']==s['completion_evidence_refs'], '完成证据错配')
    need(record['completion']['required']==record['policy']['required_completion'] and
         record['completion']['policy_ref']==record['policy']['completion_policy_ref'], '完成政策错配')
    need([a['attempt_id'] for a in record['attempts']]==s['attempt_ids'], '尝试集合错配')
    need(s['terminal_revision'] is None or int(s['terminal_revision'])<=int(s['revision']), '终态修订越界')
    need(s['phase']!='finished' or s['resource_status']!='held', '终态资源仍占用')
    if s['outcome']=='succeeded':
        levels=['sent','acknowledged','effect_verified']; cp=record['completion']
        need(cp['achieved'] in levels and cp['evidence_refs'] and levels.index(cp['achieved'])>=levels.index(cp['required']), '成功证据不足')
    view={k:copy.deepcopy(record[k]) for k in B.DIRECT}
    view['source_record_ref']=source_ref(record)
    view['state']={k:copy.deepcopy(s[k]) for k in B.STATE}
    for src,dst in zip(B.COUNTS,('completion_evidence_count','resource_evidence_count','attempt_count')):
        view['state'][dst]=len(s[src])
    view['completion']={k:copy.deepcopy(record['completion'][k]) for k in ('required','achieved','policy_ref')}
    view['completion']['evidence_count']=len(record['completion']['evidence_refs'])
    result=dict(entity_kind='commands',entity_id=record['command_id'],entity_epoch=context.entity_epoch,
                entity_revision=record['revision'],view=view)
    validators()[1].validate(result)
    return result


def check_binding(projected, context, record):
    """释放时再次评估当前上下文；旧投影即使重新hash也不得改变来源。"""
    need(projected==project(record,context), '投影与可信原件不符')
    return True
