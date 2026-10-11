import { NextRequest, NextResponse } from 'next/server';
import { uploadFileAction } from '@/actions/upload-actions';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const result = await uploadFileAction(formData);

    if (!result.success) {
      const isForbidden = result.error?.includes('quyền');
      return NextResponse.json({ error: result.error }, { status: isForbidden ? 403 : 400 });
    }

    return NextResponse.json({
      url: result.url,
      fileName: result.fileName,
      fileSize: result.fileSize,
      mimeType: result.mimeType,
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Lỗi xử lý tệp tin tải lên.' }, { status: 500 });
  }
}
