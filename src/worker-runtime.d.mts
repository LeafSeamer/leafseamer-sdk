import type {components} from './worker-runtime/models.js';
export type WorkerIntent = components['schemas']['installation2_ExtensionLaunchIntent'];
export type LaunchAuthorization = components['schemas']['installation2_LaunchAuthorization'];
export type WorkerControlFrame = components['schemas']['ControlFrame'];
export type SourceWorkerFrame = components['schemas']['SourceFrame'];
export type SourceRuntimeBinding = components['schemas']['SourceRuntimeBinding'];
export type SourceBinding = components['schemas']['SourceBinding'];
export type SourceBindingRef = components['schemas']['SourceBindingRef'];
export type ObjectScope = components['schemas']['ObjectScope'];
export const workerControlVersion: 'supervisor-control/0.4.0-draft.1';
export const sourceWorkerProtocol: 'source-worker/1';
export const workerRuntimeSelection: Readonly<{contract_id: 'leafseamer.worker-runtime.3'; contract_digest: string; control_version: typeof workerControlVersion; source_protocol: typeof sourceWorkerProtocol}>;
export class WorkerRuntimeWireError extends Error { readonly stage: string; readonly reason: string; public(): {stage: string; reason_code: string; byte_offset?: number}; }
export function decodeWorkerIntent(bytes: Uint8Array, context: Readonly<{authority: 'controller' | 'seamer'; service_id: string; database_instance_id: string}>): Promise<WorkerIntent>;
export function decodeLaunchAuthorization(bytes: Uint8Array): Promise<LaunchAuthorization>;
export function decodeWorkerControl<T extends WorkerControlFrame['type']>(bytes: Uint8Array, type: T): Promise<Extract<WorkerControlFrame, {type: T}>>;
export function decodeSourceWorker<T extends SourceWorkerFrame['type']>(bytes: Uint8Array, type: T): Promise<Extract<SourceWorkerFrame, {type: T}>>;
export function decodeSourceRuntimeBinding(bytes: Uint8Array): Promise<SourceRuntimeBinding>;
export function decodeSourceBinding(bytes: Uint8Array): Promise<SourceBinding>;

export type WorkerLoadMaterials=components['schemas']['WorkerLoadMaterials'];
export function decodeWorkerLoadMaterials(bytes:Uint8Array):Promise<WorkerLoadMaterials>;
