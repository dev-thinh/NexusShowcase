import { handlers } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  if (url.pathname === '/api/auth/signin') {
    const callbackUrl = url.searchParams.get('callbackUrl');
    const redirectUrl = new URL('/login', req.url);
    if (callbackUrl) {
      redirectUrl.searchParams.set('callbackUrl', callbackUrl);
    }
    return NextResponse.redirect(redirectUrl);
  }
  return handlers.GET(req);
}

export const POST = handlers.POST;
