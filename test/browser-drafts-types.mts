import {createBrowserSessionClient,prepareDraftChange,type DraftChangeInput,type Inputs,type BrowserDraftClient} from '../dist/index.mjs';
const draft:BrowserDraftClient=createBrowserSessionClient({baseUrl:'https://controller.invalid'}).createDraftClient({baseUrl:'https://seamer.invalid',audience:'seamer'});
declare const create:Inputs['seamer']['createDefinition']['body'];
declare const update:Inputs['seamer']['updateDraft']['body'];
declare const metadata:Inputs['seamer']['updateDefinitionMetadata']['body'];
await draft.issueToken(['definition.edit','definition.read','request.create']);
await draft.createRequestContext({operations:['createDefinition'],ttl_ms:1000,max_unique_requests:1});
await draft.createDefinition(create);await draft.getDraft('definition');await draft.updateDraft('definition',update);await draft.updateDefinitionMetadata('definition',metadata);
declare const context:DraftChangeInput['context'];
const prepared=await prepareDraftChange({operation:'createDefinition',definition_id:null,scope:{authority_service_id:'seamer',database_instance_id:'database'},context,body:create});
await draft.lookupAutomationRequest(prepared.lookup);
// @ts-expect-error 创建定义不能自报服务端分配的定义标识。
await prepareDraftChange({operation:'createDefinition',definition_id:'chosen',scope:{authority_service_id:'seamer',database_instance_id:'database'},context,body:create});
// @ts-expect-error 草稿写入要求显式CAS修订。
await draft.updateDraft('definition',{context:update.context,content:update.content});
// @ts-expect-error 目标在创建客户端时固定，不随请求切换。
await draft.createRequestContext({audience:'other',operations:['createDefinition'],ttl_ms:1000,max_unique_requests:1});

declare const publish:Inputs['seamer']['publishDefinition']['body'];
const publication=await prepareDraftChange({operation:'publishDefinition',definition_id:'definition',scope:{authority_service_id:'seamer',database_instance_id:'database'},context,body:publish});
if(publication.operation==='publishDefinition')await draft.publishDefinition(publication.definition_id,publication.body);
// @ts-expect-error 发布不能省略固定定义标识。
await prepareDraftChange({operation:'publishDefinition',definition_id:null,scope:{authority_service_id:'seamer',database_instance_id:'database'},context,body:publish});
await draft.publishDefinition('definition',publish);await draft.getPublishedArtifact('definition','1');await draft.getCompiledProgram('definition','1');await draft.getIndependenceProof('definition','proof','1');
// @ts-expect-error 发布必须固定内容与选择摘要。
await draft.publishDefinition('definition',{context:publish.context,expected_draft_revision:'1'});

declare const candidate:Inputs['seamer']['queryBindingCandidate']['body'];
declare const approval:Inputs['seamer']['approveDefinitionBindings']['body'];
declare const revocation:Inputs['seamer']['revokeBindingApproval']['body'];
await draft.queryBindingCandidate('definition',candidate);await draft.approveDefinitionBindings('definition',approval);
await draft.getBindingApproval('definition','approval');await draft.revokeBindingApproval('definition','approval',revocation);
await draft.lookupBindingApproval('definition',{request_id:'request',request_digest:'sha256:digest'});
// @ts-expect-error 候选不能自报绑定原件。
await draft.queryBindingCandidate('definition',{...candidate,bundle:{}});
// @ts-expect-error 批准必须固定原审阅摘要。
await draft.approveDefinitionBindings('definition',{context:approval.context,source:candidate,request_id:'request',approval_id:'approval'});
