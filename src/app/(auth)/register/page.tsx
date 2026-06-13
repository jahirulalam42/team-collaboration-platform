// app/(auth)/register/page.tsx
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export const metadata = { title: "Create account — SyncSpace" };

export default async function RegisterPage() {
  const session = await auth.api.getSession({
    query: {
      disableCookieCache: true,
    },
    headers: await headers(), // headers containing the user's session token
  });
  // if (session) redirect("/dashboard");

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <RegisterForm />
    </div>
  );
}
