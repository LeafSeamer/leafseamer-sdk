import type {components} from './capability-template/models.js';
export type CapabilityTemplate=components['schemas']['CapabilityTemplate'];
export const capabilityTemplateSelection:Readonly<{contract_id:'leafseamer.capability-template.1';contract_digest:string}>;
export class CapabilityTemplateWireError extends Error {readonly stage:string;readonly reason:string;public():{stage:string;reason_code:string;byte_offset?:number};}
export function decodeCapabilityTemplate(bytes:Uint8Array):Promise<CapabilityTemplate>;
