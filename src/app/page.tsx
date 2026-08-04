import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

// Prevent static generation – always server‑render
export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await auth.api.getSession({
    query: { disableCookieCache: true },
    headers: await headers(),
  });

  if (session) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}
