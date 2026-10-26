"""设计验收用的选择、Context绑定和单次票据关系模型；无网络和真实认证实现。"""
import copy
import hashlib
import re
from jsonschema import Draft202012Validator
from referencing import Registry, Resource

ID = re.compile(r'[A-Za-z0-9._-]{1,128}')
DIGEST = re.compile(r'sha256:[0-9a-f]{64}')
SECRET = re.compile(r'[A-Za-z0-9_-]{16,4096}')


class Rejected(ValueError):
    def __init__(self, code):
        super().__init__(code)
        self.code = code
        self.http_status = 400 if code == 'CONTRACT_SELECTION_INVALID' else 409


class AuthorityRejected(ValueError):
    """保留原认证提供者的拒绝；不能把认证失败伪装为契约选择409。"""


def require(ok, code='CONTRACT_BINDING_MISMATCH'):
    if not ok:
        raise Rejected(code)


def shape(selection):
    require(isinstance(selection, dict) and set(selection) == {'contract_id', 'contract_digest'}, 'CONTRACT_SELECTION_INVALID')
    require(isinstance(selection['contract_id'], str) and ID.fullmatch(selection['contract_id']) and
            isinstance(selection['contract_digest'], str) and DIGEST.fullmatch(selection['contract_digest']),
            'CONTRACT_SELECTION_INVALID')


class Catalogue:
    """只路由已由部署证明就绪的精确组合；不因存在广告就装载或执行新代码。"""
    def __init__(self, selections):
        require(isinstance(selections, list) and 1 <= len(selections) <= 8, 'CONTRACT_SELECTION_INVALID')
        self.selections = {}
        for item in selections:
            shape(item)
            require(item['contract_id'] not in self.selections, 'CONTRACT_SELECTION_INVALID')
            self.selections[item['contract_id']] = copy.deepcopy(item)

    def choose(self, selection):
        shape(selection)
        require(self.selections.get(selection['contract_id']) == selection, 'CONTRACT_NOT_SUPPORTED')
        return copy.deepcopy(selection)

    def http(self, headers):
        values = {}
        for name, value in headers:
            if name.lower() not in ('x-leafseamer-contract', 'x-leafseamer-contract-digest'):
                continue
            require(name.lower() not in values and isinstance(value, str) and '\r' not in value and '\n' not in value,
                    'CONTRACT_SELECTION_INVALID')
            values[name.lower()] = value.strip(' \t')
        require(set(values) == {'x-leafseamer-contract', 'x-leafseamer-contract-digest'}, 'CONTRACT_SELECTION_INVALID')
        return self.choose(dict(contract_id=values['x-leafseamer-contract'], contract_digest=values['x-leafseamer-contract-digest']))

    def websocket(self, protocols):
        require(isinstance(protocols, list) and len(protocols) == 2 and all(isinstance(p, str) for p in protocols),
                'CONTRACT_SELECTION_INVALID')
        selected = [p for p in protocols if p.startswith('leafseamer.contract.')]
        tickets = [p for p in protocols if p.startswith('leafseamer.ticket.')]
        require(len(selected) == len(tickets) == 1, 'CONTRACT_SELECTION_INVALID')
        raw = selected[0].removeprefix('leafseamer.contract.')
        require('.' in raw, 'CONTRACT_SELECTION_INVALID')
        identity, checksum = raw.rsplit('.', 1)
        secret = tickets[0].removeprefix('leafseamer.ticket.')
        require(SECRET.fullmatch(secret), 'CONTRACT_SELECTION_INVALID')
        return self.choose(dict(contract_id=identity, contract_digest='sha256:' + checksum)), secret


def token(selection):
    shape(selection)
    return 'leafseamer.contract.' + selection['contract_id'] + '.' + selection['contract_digest'][7:]


def response_headers(selection):
    shape(selection)
    return [('X-LeafSeamer-Contract', selection['contract_id']), ('X-LeafSeamer-Contract-Digest', selection['contract_digest'])]


def verify_response(selection, headers):
    require(Catalogue([selection]).http(headers) == selection)
    return 'response_selection_matches'


def selected_input(name, request, selection, schemas):
    require(name in ('baseline__RequestContextRequest', 'baseline__WsTicketRequest'))
    schemas.validate(name, request)
    require(request['selection'] == selection)
    return 'input_selection_matches'


def response_body(name, body, selection, headers, schemas):
    """name来自固定操作映射，不允许客户端用任意类型代替实际响应类型。"""
    verify_response(selection, headers)
    schemas.validate(name, body)
    if name.startswith('baseline__') and name.endswith('Response'):
        require(body['selection'] == selection and body['protocol_version'] == selection['contract_id'])
    if name in ('baseline__MetaResponse', 'baseline__RequestContextResponse', 'baseline__WsTicketBindingResponse'):
        require(body['data']['selection'] == selection)
    if name == 'baseline__WsTicketResultResponse':
        require(body['data']['binding']['selection'] == selection)
    return 'response_shape_and_selection_match'


def use_context(context, selection, current):
    """current为可信提供者的合成输出；这里不实现认证、时钟或授权存储。"""
    shape(selection)
    if current['valid'] is not True:
        raise AuthorityRejected('当前认证、期限或授权条件不成立')
    require(context['selection'] == selection)
    for field in ('service_id', 'principal_id', 'issuer_id', 'issuer_epoch', 'audience', 'context_epoch'):
        require(context[field] == current[field])
    require(current['operation'] in context['operations'])
    return 'context_selection_matches'


class Schemas:
    def __init__(self, models):
        self.id = models['$id']
        self.registry = Registry().with_resource(self.id, Resource.from_contents(models))

    def validate(self, name, value):
        Draft202012Validator({'$ref': self.id + '#/$defs/' + name}, registry=self.registry).validate(value)


class TicketClaim:
    """串行离线单次消费模型，不是生产票据库或并发原子性证明。"""
    def __init__(self, secret, binding, schemas):
        require(isinstance(secret, str) and SECRET.fullmatch(secret), 'CONTRACT_SELECTION_INVALID')
        schemas.validate('baseline__WsTicketBinding', binding)
        self.binding = copy.deepcopy(binding)
        self.secret_digest = hashlib.sha256(secret.encode('ascii')).digest()

    def consume(self, catalogue, protocols, current):
        selection, secret = catalogue.websocket(protocols)
        b = self.binding
        if current['valid'] is not True:
            raise AuthorityRejected('当前票据身份、期限或权限不成立')
        require(b['consumed'] is False and b['selection'] == selection)
        require(hashlib.sha256(secret.encode('ascii')).digest() == self.secret_digest)
        for key in ('session_id', 'issuer_epoch', 'audience', 'origin', 'client_instance_id', 'scope_digest', 'service_boot_id'):
            require(b[key] == current[key])
        # 模拟提交点：后续101或Ready丢失不回退；真实writer必须原子裁决上述条件。
        b['consumed'] = True
        ready = dict(type='contract.ready', selection=copy.deepcopy(selection), binding_id=b['binding_id'],
                     service_id=b['audience'], service_boot_id=b['service_boot_id'])
        return token(selection), ready


class Connection:
    def __init__(self, selection, binding, echoed_protocol, schemas, deadline_tick):
        require(echoed_protocol == token(selection) and binding['selection'] == selection)
        self.selection = copy.deepcopy(selection)
        self.binding = copy.deepcopy(binding)
        self.schemas = schemas
        self.deadline = deadline_tick
        self.state = 'await_ready'

    def receive(self, frame, now_tick):
        try:
            require(self.state != 'closed')
            if self.state == 'await_ready':
                require(now_tick < self.deadline)
                self.schemas.validate('negotiation__WsReady', frame)
                require(frame['selection'] == self.selection and frame['binding_id'] == self.binding['binding_id'] and
                        frame['service_id'] == self.binding['audience'] and frame['service_boot_id'] == self.binding['service_boot_id'])
                self.state = 'ready'
                return 'transport_ready_only'
            self.schemas.validate('negotiation__WsData', frame)
            return 'data_shape_valid_only'
        except (ValueError, KeyError):
            self.state = 'closed'
            raise
        except Exception:
            # Schema拒绝同样永久关闭本连接；不尝试旧协议解码。
            self.state = 'closed'
            raise
