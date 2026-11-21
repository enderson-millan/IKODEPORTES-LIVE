/* eslint-disable prettier/prettier */
import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Supabase not configured yet — skip auth gating so the preview keeps working.
  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet: { name: string; value: string; options?: object }[]) => {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // getUser() verifies the session with the auth server (more secure than getSession())
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Protected routes: redirect to /login if not authenticated
  const isProtectedRoute = pathname === "/bracket" || pathname === "/ranking";
  if (isProtectedRoute && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // /login: redirect to /bracket if already authenticated
  if (pathname === "/login" && user) {
    return NextResponse.redirect(new URL("/bracket", request.url));
  }

  // Admin routes: only accessible by the designated admin email
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "";
  if (pathname.startsWith("/admin")) {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (user.email !== ADMIN_EMAIL) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/", "/login", "/bracket", "/ranking", "/admin/:path*", "/auth/callback"],
};
