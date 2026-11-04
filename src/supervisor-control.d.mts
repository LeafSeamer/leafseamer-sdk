import type {components} from './supervisor-control/models.js';
export type SupervisorFrame = components['schemas']['frame'];
export type SupervisorScope = components['schemas']['supervisor_Scope'];
export type LaunchKey = components['schemas']['supervisor_LaunchKey'];
export type JournalView = components['schemas']['supervisor_JournalView'];
export const supervisorControlVersion: 'supervisor-control/0.1.0-draft.1';
export class SupervisorWireError extends Error { readonly stage: string; readonly reason: string; public(): {stage: string; reason_code: string; byte_offset?: number}; }
export function decodeSupervisorControl<T extends SupervisorFrame['type']>(bytes: Uint8Array, type: T): Promise<Extract<SupervisorFrame, {type: T}>>;
