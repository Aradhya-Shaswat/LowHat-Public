import "server-only";
import { cache } from "react";
import { auth } from "./auth-server";
import { db } from "./db";
import { users } from "./db/schema";
import { eq } from "drizzle-orm";

/**
 * verifySession — memoized per request via React cache().
 * 
 * Key fixes for session stability:
 * 1. Wrapped in React cache() so it runs once per server request, no matter
 *    how many components call it — prevents hammering the NeonDB Auth endpoint.
 * 2. All 3 retry attempts must fail before we give up. A single transient JWKS
 *    fetch error no longer causes an immediate logout.
 * 3. If getSession() resolves but returns null/empty (not an error), we return
 *    null cleanly — no throw, so Next.js won't show an error page.
 * 4. DB lookup is guarded: if the user row doesn't exist yet (race condition
 *    on first sign-up), we still return isAuth=true with the auth-provided role.
 */
export const verifySession = cache(async () => {
  let rawSession: any = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      rawSession = await auth.getSession();

      if (rawSession && typeof rawSession === "object" && "error" in rawSession && rawSession.error) {
        if (attempt < 2) {
          await new Promise(r => setTimeout(r, 300 * (attempt + 1)));
          continue;
        }
        return null;
      }

      break;
    } catch (e: any) {
      if (attempt < 2) {
        await new Promise(r => setTimeout(r, 300 * (attempt + 1)));
        continue;
      }
      console.error("[verifySession] Auth check failed after 3 attempts:", e?.message ?? e);
      return null;
    }
  }

  const authSession = rawSession && "data" in rawSession ? rawSession.data : rawSession;

  if (!authSession?.user) return null;

  try {
    const [dbUser] = await db
      .select({ 
        id: users.id, 
        role: users.role, 
        emailVerified: users.emailVerified 
      })
      .from(users)
      .where(eq(users.email, authSession.user.email))
      .limit(1);

    const authVerified = !!authSession.user.emailVerified;
    if (dbUser && dbUser.emailVerified !== authVerified) {
      await db.update(users)
        .set({ emailVerified: authVerified })
        .where(eq(users.id, dbUser.id));
    }

    return {
      isAuth: true as const,
      userId: dbUser?.id ?? authSession.user.id,
      role: (dbUser?.role ?? authSession.user.role ?? "client") as string,
    };
  } catch (dbErr: any) {
    console.error("[verifySession] DB lookup failed, using auth-provided role:", dbErr?.message);
    return {
      isAuth: true as const,
      userId: authSession.user.id,
      role: (authSession.user.role ?? "client") as string,
    };
  }
});
