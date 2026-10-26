"""设计阶段纯函数：验证worker帧方向及握手关系，不维护运行态、不开放闸门。"""
from dataclasses import dataclass
from jsonschema import Draft202012Validator
from referencing import Registry, Resource


@dataclass(frozen=True)
class Channel:
    """由监督器提供的独立期望，不允许从待验证消息反推可信身份。"""
    ipc_session_id: str
    controller_boot_id: str
    worker_boot_id: str
    clock_domain_id: str
    descriptor_digest: str


class Contract:
    def __init__(self, models, ipc, catalogue):
        self.models = models
        self.catalogue = catalogue
        self.messages = {m['type']: m for m in catalogue['messages']}
        self.registry = Registry().with_resources([
            (models['$id'], Resource.from_contents(models)),
            (ipc['$id'], Resource.from_contents(ipc))])

    def frame(self, value, direction, channel):
        """单帧结构和可信通道投影；不代替共享日志去重、序号和业务守卫。"""
        if not isinstance(value, dict):
            raise ValueError('消息必须为对象')
        kind = value.get('type')
        if kind not in self.messages or self.messages[kind]['direction'] != direction:
            raise ValueError('未知消息或发送方向不符')
        Draft202012Validator({'$ref': self.messages[kind]['schema_ref']},
                             registry=self.registry).validate(value)
        for key in Channel.__dataclass_fields__:
            if value[key] != getattr(channel, key):
                raise ValueError('可信通道身份不符: ' + key)
        return 'frame_shape_and_channel_valid'

    def reply(self, request, response, request_direction, channel):
        self.frame(request, request_direction, channel)
        self.frame(response, {'c2w': 'w2c', 'w2c': 'c2w'}[request_direction], channel)
        if request['type'] not in self.messages[response['type']]['reply_to_types']:
            raise ValueError('回复类型不对应请求')
        if response['reply_to'] != request['message_id'] or response['message_id'] == request['message_id']:
            raise ValueError('回复关联不符')
        return 'reply_envelope_valid'

    def negotiate(self, hello, ack, channel, trusted_descriptor):
        """仅关系检查。描述符自身摘要、来源和平台批准由独立监督器先行证明。"""
        if hello.get('type') != 'HELLO' or ack.get('type') != 'HELLO_ACK':
            raise ValueError('握手类型不符')
        self.reply(hello, ack, 'w2c', channel)
        for frame in (hello, ack):
            body = frame['body']
            if body['clock_domain_descriptor'] != trusted_descriptor:
                raise ValueError('受监督运行域原件不符')
            for key in ('clock_domain_id', 'descriptor_digest'):
                if body[key] != getattr(channel, key) or trusted_descriptor[key] != getattr(channel, key):
                    raise ValueError('运行域内外绑定不一致')
        h, a = hello['body'], ack['body']
        if a['selected_ipc_version'] not in h['supported_ipc_versions']:
            raise ValueError('选择了未提供的协议')
        if not set(a['selected_features']) <= set(h['supported_features']):
            raise ValueError('选择了未提供的能力')
        return dict(state='wire_compatible_closed', gate_state='closed',
                    send_authorized=False, full_bundle_negotiated=False)
