import type {components} from './release-manifest/models.js';
export type ReleaseManifest = components['schemas']['ReleaseManifest'];
export type ReleaseRevocations = components['schemas']['ReleaseRevocations'];
export type ReleaseExtensionBinding = components['schemas']['ReleaseExtensionBinding'];
export type ReleaseArtifact = components['schemas']['Artifact'];
export type ReleaseDeploymentProfile = components['schemas']['DeploymentProfile'];
export const releaseManifestSelection: Readonly<{contract_id: 'leafseamer.release-manifest.1'; contract_digest: string; manifest_version: 'native-release/0.2.0-draft.1'}>;
export class ReleaseWireError extends Error {readonly stage: string; readonly reason: string; public(): {stage: string; reason_code: string; byte_offset?: number};}
export function decodeReleaseManifest(bytes: Uint8Array): Promise<ReleaseManifest>;
export function decodeReleaseRevocations(bytes: Uint8Array): Promise<ReleaseRevocations>;
export function decodeReleaseExtensionBinding(bytes: Uint8Array): Promise<ReleaseExtensionBinding>;
