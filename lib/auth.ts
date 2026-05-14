import { createAuthClient } from "better-auth/react";
import { emailOTPClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_NEON_AUTH_BASE_URL,
  plugins: [emailOTPClient()],
});

export const { signIn, signUp, useSession, signOut } = authClient;
