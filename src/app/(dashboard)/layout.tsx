// app/(dashboard)/layout.tsx — protected layout, redirects if unauthenticated
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
// import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  return <>{children}</>;
}
