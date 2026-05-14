import { auth } from "@/lib/auth-server";

import { NextResponse } from "next/server";
import type { NextRequest, NextFetchEvent } from "next/server";

const defaultMiddleware = auth.middleware({ loginUrl: "/login" });

export default async function middleware(req: NextRequest, ev: NextFetchEvent) {
  if (req.method === "POST" && req.headers.has("next-action")) {
    return NextResponse.next();
  }

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await defaultMiddleware(req);

      if (response && response.status === 502) {
        if (attempt === 2) break;
        await new Promise(r => setTimeout(r, 500));
        continue;
      }
      return response;
    } catch (err: any) {
      console.warn(`[middleware] Auth check failed (attempt ${attempt + 1}/3):`, err.message || err);
      if (attempt === 2) break;
      await new Promise(r => setTimeout(r, 500));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login|signup|verify).*)"],
};
