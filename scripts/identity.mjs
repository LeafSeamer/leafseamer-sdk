// DF06 IL02：只撤当前Cookie会话；新的开发接受集保留全部原有操作。
export function addIdentity(documents, graph) {
  const ref = name => ({$ref: '#/components/schemas/' + name});
  const object = properties => ({type: 'object', properties, required: Object.keys(properties), additionalProperties: false});
  const controller = documents.controller, base = controller.components.schemas;
  const propagation = structuredClone(base.baseline__RevocationRecord);
  // 对齐实际session账本上限；不截断固定目标，也不生成假的pending receipt。
  propagation.properties.target_service_ids.maxItems = 4096;
  propagation.properties.receipts.maxItems = 4096;
  const definitions = {
    identity__LogoutOperationRef: object({authority_service_id: ref('baseline__Id'), database_instance_id: ref('baseline__Id'),
      kind: {const: 'session_revocation'}, id: ref('baseline__Id'), revision: ref('baseline__Revision')}),
    identity__SessionRevocationRecord: propagation,
    identity__LogoutResult: object({operation_ref: ref('identity__LogoutOperationRef'), local_session_state: {const: 'revoked'},
      propagation: ref('identity__SessionRevocationRecord')}),
    identity__LogoutResponse: {...structuredClone(base.baseline__SessionResponse), properties: {
      ...structuredClone(base.baseline__SessionResponse.properties), data: ref('identity__LogoutResult')}},
  };
  const local = node => {
    if (Array.isArray(node)) return node.map(local);
    if (!node || typeof node !== 'object') return node;
    return Object.fromEntries(Object.entries(node).map(([k, v]) => [k, k === '$ref' ? v.replace('#/components/schemas/', '#/$defs/') : local(v)]));
  };
  for (const doc of Object.values(documents)) Object.assign(doc.components.schemas, structuredClone(definitions));
  Object.assign(graph.$defs, local(definitions));
  const route = structuredClone(controller.paths['/auth/sessions/refresh'].post);
  route.operationId = 'logoutSession'; route.summary = '退出当前人员会话';
  route['x-permission'] = 'session.self'; route['x-principal-kind'] = 'human';
  delete route.requestBody;
  const accepted = route.responses['200']; delete route.responses['200'];
  accepted.content['application/json'].schema = ref('identity__LogoutResponse');
  delete accepted.headers['X-CSRF-Token'];
  accepted.headers['Set-Cookie'].description = '清除当前Cookie；不证明传播已完成。';
  route.responses['202'] = accepted;
  controller.paths['/auth/sessions/current'] = {delete: route};
}
