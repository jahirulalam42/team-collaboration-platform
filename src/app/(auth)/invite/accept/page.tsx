// app/(auth)/invite/accept/page.tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{
    workspaceId?: string;
    token?: string;
    error?: string;
  }>;
}) {
  const { workspaceId, token, error } = await searchParams;

  // If error param exists, show error card
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Invite failed</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!workspaceId || !token) redirect("/dashboard?error=invalid_invite");

  // Check if user is logged in
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    const redirectTo = encodeURIComponent(
      `/invite/accept?workspaceId=${workspaceId}&token=${token}`
    );
    redirect(`/login?redirect=${redirectTo}`);
  }

  // Call the internal API to accept the invite
  const baseUrl = process.env.BETTER_AUTH_URL;
  const res = await fetch(
    `${baseUrl}/api/workspace/${workspaceId}/invite?token=${token}`,
    {
      headers: { Cookie: (await headers()).get("cookie") || "" },
    }
  );

  if (res.ok) {
    const data = await res.json();
    redirect(`/workspace/${data.workspaceId}`);
  } else {
    const errData = await res.json();
    redirect(
      `/invite/accept?error=${encodeURIComponent(
        errData.error || "Failed to accept invite"
      )}`
    );
  }
}
