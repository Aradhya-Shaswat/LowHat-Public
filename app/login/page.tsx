import { verifySession } from "@/lib/session";
import { redirect } from "next/navigation";
import LoginFormWrapper from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await verifySession();
  if (session?.isAuth) {
    redirect("/");
  }

  return <LoginFormWrapper />;
}