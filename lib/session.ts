import "server-only";
import { auth } from "./auth-server";
import { db } from "./db";
import { users } from "./db/schema";
import { eq } from "drizzle-orm";

export async function verifySession() {
  let session = null;
  
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      session = await auth.getSession();
      if (session && typeof session === 'object' && 'error' in session && session.error) {
         if (attempt === 2) throw new Error(String((session as any).error));
         await new Promise(r => setTimeout(r, 500));
         continue;
      }
      break;
    } catch (e: any) {
      if (attempt === 2) throw e;
      await new Promise(r => setTimeout(r, 500));
    }
  }

  const authSession = session && 'data' in session ? session.data : session;

  if (!authSession?.user) return null;

  const [dbUser] = await db.select().from(users).where(eq(users.email, authSession.user.email)).limit(1);

  return {
    isAuth: true,
    userId: dbUser?.id || authSession.user.id,
    role: dbUser?.role || "client",
  };
}
