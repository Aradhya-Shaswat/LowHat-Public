import { auth } from "@/lib/auth-server";
import { NextRequest, NextResponse } from "next/server";

const MAX_RETRIES = 2;
const RETRY_DELAY = 300;

async function withRetry(fn: () => Promise<Response>): Promise<Response> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fn();
      if (res.status !== 502 || attempt === MAX_RETRIES) return res;
      await new Promise((r) => setTimeout(r, RETRY_DELAY));
    } catch (e) {
      if (attempt === MAX_RETRIES) throw e;
      await new Promise((r) => setTimeout(r, RETRY_DELAY));
    }
  }
  return NextResponse.json({ error: "Service unavailable" }, { status: 502 });
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return withRetry(() => auth.handler().GET(request.clone() as NextRequest, { params }));
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return withRetry(() => auth.handler().POST(request.clone() as NextRequest, { params }));
}
