import { verifySession } from "@/lib/session";
import { redirect } from "next/navigation";
import SignupForm from "./signup-form";

export const dynamic = "force-dynamic";

export default async function SignupPage() {
  const session = await verifySession();
  if (session?.isAuth) {
    redirect("/");
  }

  return <SignupForm />;
}
