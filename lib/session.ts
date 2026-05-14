import "server-only";
import { headers } from "next/headers";
import { auth } from "./auth-server";

export async function verifySession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) return null;

  return {
    isAuth: true,
    userId: session.user.id,
    role: (session.user as any).role || "client",
  };
}
