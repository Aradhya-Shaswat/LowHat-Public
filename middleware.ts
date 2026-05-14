import { auth } from "@/lib/auth-server";

import { NextResponse } from "next/server";
import type { NextRequest, NextFetchEvent } from "next/server";

const defaultMiddleware = auth.middleware({ loginUrl: "/login" });

export default async function middleware(req: NextRequest, ev: NextFetchEvent) {
  // bypassing server actions btw ig bro
  if (req.method === "POST" && req.headers.has("next-action")) {
    return NextResponse.next();
  }

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await defaultMiddleware(req);
  
      if (response && response.status === 502) {
        if (attempt === 2) return response;
        await new Promise(r => setTimeout(r, 500));
        continue;
      }
      return response;
    } catch (err: any) {
      if (attempt === 2) throw err;
      await new Promise(r => setTimeout(r, 500));
    }
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login|signup|verify).*)"],
};
