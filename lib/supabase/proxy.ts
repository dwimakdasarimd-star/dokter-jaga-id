import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, { cookies: {
    getAll() { return request.cookies.getAll(); },
    setAll(cookiesToSet) {
      cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
      response = NextResponse.next({ request });
      cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
    },
  } });

  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;
  const publicRoute = pathname === '/login' || pathname.startsWith('/auth');
  if (!user && !publicRoute) return NextResponse.redirect(new URL('/login', request.url));
  return response;
}
