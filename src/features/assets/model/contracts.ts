import type { ActionResult } from '@/shared/lib/action-result';
export type UploadedAsset = { url: string; fileName: string; fileSize: number; mimeType: string };
export type UploadResult = ActionResult<UploadedAsset>;
export type UploadKind = 'resource' | 'thumbnail' | 'pdf';
