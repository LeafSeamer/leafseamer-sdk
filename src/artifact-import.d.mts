import type {components} from './artifact-import/models.js';
export type ArtifactManifest = components['schemas']['artifact_Manifest'];
export type FileInventory = components['schemas']['artifact_FileInventory'];
export type ImportIdentity = components['schemas']['artifact_ImportIdentity'];
export type ImportBegin = components['schemas']['artifact_ImportBegin'];
export type ImportStatus = components['schemas']['artifact_ImportStatus'];
export type ArtifactIntakeReceipt = components['schemas']['artifact_ArtifactIntakeReceipt'];
export type IntakeQuery = components['schemas']['artifact_IntakeQuery'];
export type IntakeResult = components['schemas']['artifact_IntakeResult'];
export type VerifyMaterialization = components['schemas']['artifact_VerifyMaterialization'];
export type MaterializationResult = components['schemas']['artifact_MaterializationResult'];
export type RoleResolution = components['schemas']['artifact_RoleResolution'];
export type ResolvedReview = components['schemas']['artifact_ResolvedReview'];
export type ArtifactImportFrame = components['schemas']['ImportFrame'];
export type ArtifactDocuments = {
  Manifest: ArtifactManifest; FileInventory: FileInventory; ImportIdentity: ImportIdentity; ImportBegin: ImportBegin; ImportStatus: ImportStatus;
  IntakeQuery: components['schemas']['artifact_IntakeQuery']; IntakeResult: components['schemas']['artifact_IntakeResult'];
  VerifyMaterialization: components['schemas']['artifact_VerifyMaterialization']; MaterializationResult: components['schemas']['artifact_MaterializationResult'];
  RoleResolution: components['schemas']['artifact_RoleResolution']; ResolvedReview: components['schemas']['artifact_ResolvedReview'];
};
export const artifactImportVersion: 'extension-import/0.1.0-draft.1';
export const artifactImportSelection: Readonly<{contract_id: 'leafseamer.artifact-import.1'; contract_digest: string; ipc_version: typeof artifactImportVersion}>;
export class ArtifactImportWireError extends Error { readonly stage: string; readonly reason: string; public(): {stage: string; reason_code: string; byte_offset?: number}; }
export function decodeArtifactDocument<K extends keyof ArtifactDocuments>(bytes: Uint8Array, kind: K): Promise<ArtifactDocuments[K]>;
export function decodeImportFrame<T extends ArtifactImportFrame['type']>(bytes: Uint8Array, type: T): Promise<Extract<ArtifactImportFrame, {type: T}>>;
