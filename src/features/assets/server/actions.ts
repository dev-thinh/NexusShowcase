'use server';
import { getActor } from '@/features/identity/server/actor';
import { commandFailure } from '@/server/db/command-error';
import type { UploadResult } from '../model/contracts';
import { uploadAsset } from './upload-command';
export type { UploadResult } from '../model/contracts';
export async function uploadFileAction(formData: FormData): Promise<UploadResult> {
  const actor = await getActor(['CORE_MEMBER', 'ADMIN']);
  if (!actor) return { success: false, code: 'UNAUTHORIZED', error: 'Chỉ thành viên nòng cốt và Admin được tải tệp.' };
  if (!(formData instanceof FormData)) return { success: false, code: 'VALIDATION', error: 'Dữ liệu tải lên không hợp lệ.' };
  const file = formData.get('file');
  const kind = formData.get('type');
  if (!file || typeof file === 'string' || !['thumbnail', 'pdf', 'resource'].includes(String(kind))) return { success: false, code: 'VALIDATION', error: 'Vui lòng chọn tệp và loại tệp hợp lệ.' };
  try { return await uploadAsset(file, kind as 'thumbnail' | 'pdf' | 'resource', actor.id); } catch (error) { return commandFailure('asset.upload', error, { actorId: actor.id }); }
}
