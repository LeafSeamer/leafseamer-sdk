import type {components} from './automation-program/models.js';
export {contractSelection} from './index.mjs';
export type AutomationModels=components['schemas'];
export class AutomationModelError extends Error {readonly code:string;readonly path:string;}
export function validateAutomationModel<Name extends keyof AutomationModels>(name:Name,value:unknown):asserts value is AutomationModels[Name];

/** 有界JSON的JCS摘要，不授予内容来源或执行资格。 */
export function digestAutomationValue(value:unknown):Promise<string>;
