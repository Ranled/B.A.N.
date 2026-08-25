import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // Check for CD TRACK Access Code in cookies
  const accessCookie = request.cookies.get('ban_access')?.value?.toUpperCase();
  const isCodeAuth = ['CD01', 'CDADMIN01', 'MASTER'].includes(accessCookie || '');

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key',
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Check Supabase session if not already code-authenticated
  let user = null;
  if (!isCodeAuth) {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  }

  const isAuthenticated = isCodeAuth || !!user;

  // Route protection
  const url = request.nextUrl.clone();
  const isAuthRoute = url.pathname.startsWith('/login') || url.pathname.startsWith('/auth');
  const isApiRoute = url.pathname.startsWith('/api');

  if (!isAuthenticated && !isAuthRoute && !isApiRoute) {
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (isAuthenticated && isAuthRoute) {
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
