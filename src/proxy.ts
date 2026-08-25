import { updateSession } from '@/lib/supabase/middleware';
import { type NextRequest } from 'next/server';

// Next.js 16: file renamed from middleware.ts to proxy.ts
// Function must be named "proxy" (not "middleware")
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
