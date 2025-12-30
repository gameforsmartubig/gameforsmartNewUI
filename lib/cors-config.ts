import { NextRequest, NextResponse } from "next/server";

/* ======================================================
  CONFIG
====================================================== */

// 🔐 Daftar origin yang diizinkan
const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",

  // Production (ganti sesuai domain kamu)
  "https://gameforsmart.com",
  "https://www.gameforsmart.com"
];

// Method yang diizinkan
const ALLOWED_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"];

// Header yang diizinkan
const ALLOWED_HEADERS = ["Authorization", "Content-Type", "X-Requested-With", "Accept"];

// Header yang boleh di-expose ke client
const EXPOSED_HEADERS = ["X-Request-ID", "X-Timestamp"];

/* ======================================================
  HELPERS
====================================================== */

function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;
  return ALLOWED_ORIGINS.includes(origin);
}

/* ======================================================
  CORS HANDLER
====================================================== */

export const corsHandler = {
  /**
   * Handle preflight (OPTIONS)
   */
  handleCors(request: NextRequest): NextResponse | null {
    const origin = request.headers.get("origin");

    // Preflight request
    if (request.method === "OPTIONS") {
      if (!isOriginAllowed(origin)) {
        return new NextResponse(null, { status: 403 });
      }

      return new NextResponse(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": origin!,
          "Access-Control-Allow-Methods": ALLOWED_METHODS.join(", "),
          "Access-Control-Allow-Headers": ALLOWED_HEADERS.join(", "),
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Max-Age": "86400" // 24 jam
        }
      });
    }

    return null;
  },

  /**
   * Tambahkan header CORS ke response normal
   */
  addCorsHeaders(response: NextResponse, origin: string | null) {
    if (!isOriginAllowed(origin)) return;

    response.headers.set("Access-Control-Allow-Origin", origin!);
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set("Access-Control-Expose-Headers", EXPOSED_HEADERS.join(", "));
  }
};
