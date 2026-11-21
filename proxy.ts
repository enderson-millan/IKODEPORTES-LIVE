import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

/**
 * Auth is optional for the public tracker: viewers do not need an account.
 * Only `/admin/*` is gated, plus the login bounce for already signed-in users.
 */
export async function proxy(request: NextRequest): Promise<NextResponse> {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Supabase not configured yet — skip auth gating so local preview keeps working.
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

  // getUser() verifies the session with the auth server (more secure than getSession()).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    const adminEmail = process.env.ADMIN_EMAIL ?? "";
    // Fail closed: with no admin configured, nobody is an admin.
    if (!adminEmail || user.email !== adminEmail) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  if (pathname === "/login" && user) {
    return NextResponse.redirect(new URL("/games", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/login", "/admin/:path*", "/auth/callback"],
};
