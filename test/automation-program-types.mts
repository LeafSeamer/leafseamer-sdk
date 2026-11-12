import {validateAutomationModel,type AutomationModels,contractSelection} from '@leafseamer/sdk/automation-program';
const value:unknown={kind:'literal',value:true};
validateAutomationModel('Condition',value);
const condition:AutomationModels['Condition']=value;
const contract:string=contractSelection.contract_id;
void condition;void contract;
// @ts-expect-error 模型名必须来自固定模型集合。
validateAutomationModel('UnknownProgram',{});
// @ts-expect-error Condition字面量只接受布尔值。
const invalid:AutomationModels['Condition']={kind:'literal',value:1};
void invalid;
const draft:unknown={};validateAutomationModel('LifecycleDraftContent',draft);
const selections:AutomationModels['LifecycleDraftContent']['selections']=draft.selections;
void selections;
