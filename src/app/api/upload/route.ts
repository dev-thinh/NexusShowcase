import { uploadFileAction } from '@/features/assets/server/actions';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const result = await uploadFileAction(formData);

    if (!result.success) {
      const status =
        result.code === 'UNAUTHORIZED' || result.code === 'FORBIDDEN'
          ? 403
          : result.code === 'INTERNAL'
          ? 500
          : 400;
      return NextResponse.json({ error: result.error, code: result.code }, { status });
    }

    return NextResponse.json(result.data);
  } catch {
    return NextResponse.json({ error: 'Lỗi xử lý tệp tin tải lên.', code: 'UPLOAD_FAILED' }, { status: 500 });
  }
}
