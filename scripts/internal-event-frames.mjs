// 内部来源交付保留原发布者的 Origin；首次观察及年龄证据由接收服务产生。
export function addInternalEventFrames(apis, graph) {
  function install(defs, prefix) {
    const ref = name => ({$ref: prefix + name});
    const delta = structuredClone(defs.snapshot__DeltaPayload);
    const source = delta.oneOf.find(branch => branch.properties.entry_kind.const === 'source.event');
    source.properties.payload = {
      type: 'object',
      properties: {origin: ref('ingress__Origin'), origin_digest: ref('lifecycle__Digest')},
      required: ['origin', 'origin_digest'],
      additionalProperties: false
    };
    const data = structuredClone(defs.snapshot__Data);
    data.properties.entry = ref('internalEvent__Delta');
    const server = structuredClone(defs.channel__ServerFrame);
    const dataBranch = server.oneOf.find(branch => branch.$ref === prefix + 'snapshot__Data');
    dataBranch.$ref = prefix + 'internalEvent__Data';
    Object.assign(defs, {internalEvent__Delta: delta, internalEvent__Data: data, internalEvent__ServerFrame: server});
  }
  install(graph.$defs, '#/$defs/');
  for (const api of Object.values(apis)) {
    install(api.components.schemas, '#/components/schemas/');
    api.paths['/internal/events'].get['x-server-frame-schema'] = '#/components/schemas/internalEvent__ServerFrame';
  }
  return ['internalEvent__Delta', 'internalEvent__Data', 'internalEvent__ServerFrame'];
}
