// app/(dashboard)/dashboard/page.tsx
// import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/auth";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export const metadata = { title: "Dashboard — SyncSpace" };

export default async function DashboardPage() {
  // const session = await getServerSession(authOptions);

  const session = await auth.api.getSession({ headers: await headers() });

  const memberships = await prisma.workspaceMember.findMany({
    where: { userId: session!.user.id },
    include: {
      workspace: { include: { _count: { select: { members: true } } } },
    },
    orderBy: { joinedAt: "desc" },
  });

  console.log("Memberships", memberships);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome back, {session!.user.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            You are a member of {memberships.length} workspace
            {memberships.length !== 1 ? "s" : ""}
          </p>
        </div>

        {memberships.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center">
            <p className="text-muted-foreground mb-4">
              You don't have any workspaces yet.
            </p>
            <Link
              href="/workspace/new"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Create your first workspace
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {memberships.map((m: any) => (
              <Link
                key={m.workspace.id}
                href={`/workspace/${m.workspace.id}`}
                className="group rounded-xl border border-border bg-background p-5 transition-all hover:border-primary/40 hover:shadow-sm"
              >
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                    {m.workspace.name[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-sm leading-tight">
                      {m.workspace.name}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {m.role.toLowerCase()}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {m.workspace._count.members} member
                  {m.workspace._count.members !== 1 ? "s" : ""}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
