import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  // Strategy: Check Cookie First -> Then Query Param -> Default
  const cookieStore = await cookies();
  const redirectCookie = cookieStore.get("auth-redirect");
  let next = redirectCookie?.value ? decodeURIComponent(redirectCookie.value) : (searchParams.get("next") ?? "/dashboard");

  console.log("🔄 Auth Callback Hit:", {
    url: request.url,
    code: code ? "Present" : "MISSING",
    cookieRedirect: redirectCookie?.value,
    finalNext: next
  });

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          }
        }
      }
    );
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const targetUrl = next.startsWith("http") ? next : `${origin}${next}`;

      const response = NextResponse.redirect(targetUrl);

      // Clear the redirect cookie if it existed
      if (redirectCookie) {
        response.cookies.delete("auth-redirect");
      }

      return response;
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
