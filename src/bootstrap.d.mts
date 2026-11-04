import type {components} from './bootstrap/models.js';
export type BootstrapAssignment = components['schemas']['supervisor_BootstrapAssignment'];
export type BootstrapProof = components['schemas']['supervisor_BootstrapProof'];
export type AdmissionReceipt = components['schemas']['supervisor_AdmissionReceipt'];
export type ProtectedLaunchIntent = components['schemas']['supervisor_ProtectedLaunchIntent'];
export type BootstrapFrame = components['schemas']['frame'];
export type BootstrapType = BootstrapFrame['type'];
export const bootstrapVersion: 'bootstrap/0.1.0-draft.1';
export class BootstrapWireError extends Error { readonly stage: string; readonly reason: string; public(): {stage: string; reason_code: string; byte_offset?: number}; }
export function decodeBootstrap<T extends BootstrapType>(bytes: Uint8Array, type: T): Promise<Extract<BootstrapFrame, {type: T}>>;
export function decodeProtectedLaunchIntent(bytes: Uint8Array): Promise<ProtectedLaunchIntent>;
