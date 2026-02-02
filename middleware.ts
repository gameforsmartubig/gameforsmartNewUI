import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { detectSuspiciousActivity } from "@/lib/security-validation";
import { corsHandler } from "@/lib/cors-config";

// Protected routes that require account status check
const protectedRoutes = ["/dashboard", "/host", "/create", "/learn", "/tryout", "/edit", "/join"];

// API routes that need extra security
const sensitiveApiRoutes = ["/api/admin", "/api/ai", "/api/reports"];

export async function middleware(request: NextRequest) {
  // 1. Initialize Response
  // Create an unmodified response object that acts as the canvas for all subsequent modifications
  let response = NextResponse.next({
    request: {
      headers: request.headers
    }
  });

  // 2. Setup Supabase Client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // This handles setting/updating cookies on the request and response
          // which is crucial for session token refreshing
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        }
      }
    }
  );

  // 3. Get User Session
  // This will refresh the session if needed using the cookies configured above
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  try {
    const pathname = request.nextUrl.pathname;

    // Security headers untuk semua requests
    response.headers.set("X-Request-ID", crypto.randomUUID());
    response.headers.set("X-Timestamp", Date.now().toString());

    // Detect suspicious activity
    const suspiciousCheck = detectSuspiciousActivity(request);
    if (suspiciousCheck.isSuspicious) {
      console.warn("Suspicious activity detected:", {
        ip: (request as any).ip,
        pathname,
        userAgent: request.headers.get("user-agent"),
        reasons: suspiciousCheck.reasons
      });

      // Block obviously malicious requests
      if (suspiciousCheck.reasons.includes("Suspicious user agent detected")) {
        return new NextResponse(JSON.stringify({ error: "Access denied" }), {
          status: 403,
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    // Handle CORS for API routes
    if (pathname.startsWith("/api/")) {
      const corsResponse = corsHandler.handleCors(request);
      if (corsResponse) {
        return corsResponse;
      }
      // Block requests without proper headers for sensitive endpoints
      const isSensitiveApi = sensitiveApiRoutes.some((route) => pathname.startsWith(route));

      if (isSensitiveApi) {
        const authHeader = request.headers.get("authorization");
        const contentType = request.headers.get("content-type");

        // Require authorization for sensitive APIs
        if (!authHeader && request.method !== "GET") {
          return new NextResponse(JSON.stringify({ error: "Authorization required" }), {
            status: 401,
            headers: { "Content-Type": "application/json" }
          });
        }

        // Validate content type for POST/PUT requests
        if (["POST", "PUT", "PATCH"].includes(request.method)) {
          if (!contentType || !contentType.includes("application/json")) {
            return new NextResponse(JSON.stringify({ error: "Invalid content type" }), {
              status: 400,
              headers: { "Content-Type": "application/json" }
            });
          }
        }
      }

      // Add security headers for API responses
      response.headers.set("X-Content-Type-Options", "nosniff");
      response.headers.set("X-Frame-Options", "DENY");
      response.headers.set("Cache-Control", "no-store");

      // Add CORS headers to response
      const origin = request.headers.get("origin");
      corsHandler.addCorsHeaders(response, origin);
    }

    // Check if this is a protected route
    const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

    if (isProtectedRoute) {
      // Enforce Authentication
      if (!user) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        // Add redirect param so we can send them back after login
        url.searchParams.set("redirect", pathname);
        return NextResponse.redirect(url);
      }

      // Add security headers for protected pages
      response.headers.set("X-Frame-Options", "SAMEORIGIN");
      response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    }

    // Redirect authenticated users from landing page to dashboard
    // TEMPORARILY DISABLED so you can check the Landing Page UI
    // if (pathname === "/" && user) {
    //   return NextResponse.redirect(new URL("/dashboard", request.url));
    // }

    // Protect admin routes - require admin role
    if (pathname.startsWith("/admin")) {
      // Note: Client-side protection will be handled by the admin page itself
      // This middleware only ensures basic route protection
      // Additional role check will be done in the admin page component
      response.headers.set("X-Admin-Route", "true");
    }

    // Block common attack paths
    const attackPaths = [
      "/wp-admin",
      "/phpmyadmin",
      "/.env",
      "/config",
      "/.git",
      "/backup",
      "/wp-content",
      "/xmlrpc.php"
    ];

    if (attackPaths.some((path) => pathname.startsWith(path))) {
      return new NextResponse(null, { status: 404 });
    }

    return response;
  } catch (error) {
    console.error("Middleware error:", error);

    // Return secure error response
    return new NextResponse(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

export const config = {
  matcher: [
    // Root path (to handle redirect for auth users)
    "/",

    // API routes (for CORS & security)
    "/api/:path*",

    // Protected pages
    "/dashboard/:path*",
    "/host/:path*",
    "/create/:path*",
    "/learn/:path*",
    "/tryout/:path*",
    "/edit/:path*",
    "/join/:path*"
  ]
};
