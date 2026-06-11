// app/(auth)/login/page.tsx
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { authClient } from "../../../../lib/auth-client";
import { auth } from "../../../../lib/auth";
import { headers } from "next/headers";

export const metadata = { title: "Sign in — SyncSpace" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string };
}) {
  const session = await auth.api.getSession({
    query: {
      disableCookieCache: true,
    },
    headers: await headers(),
  });
  if (session) redirect("/");

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <LoginForm callbackUrl={searchParams.callbackUrl ?? "/"} />
    </div>
  );
}
