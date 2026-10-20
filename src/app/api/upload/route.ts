import { NextRequest, NextResponse } from 'next/server';
import { uploadFileAction } from '@/actions/upload-actions';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const result = await uploadFileAction(formData);

    if (!result.success) {
      const status =
        result.code === 'UNAUTHORIZED'
          ? 403
          : result.code === 'UPLOAD_FAILED'
          ? 500
          : 400;
      return NextResponse.json({ error: result.error, code: result.code }, { status });
    }

    return NextResponse.json({
      url: result.url,
      fileName: result.fileName,
      fileSize: result.fileSize,
      mimeType: result.mimeType,
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Lỗi xử lý tệp tin tải lên.', code: 'UPLOAD_FAILED' }, { status: 500 });
  }
}
