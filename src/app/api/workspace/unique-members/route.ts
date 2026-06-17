import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      query: { disableCookieCache: true },
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // 1. Get all workspace IDs where the user is a member
    const userWorkspaces = await prisma.workspaceMember.findMany({
      where: { userId },
      select: { workspaceId: true },
    });

    const workspaceIds = userWorkspaces.map((wm) => wm.workspaceId);

    if (workspaceIds.length === 0) {
      return NextResponse.json({ count: 0 });
    }

    // 2. Count distinct user IDs across all these workspaces
    const uniqueMembers = await prisma.workspaceMember.groupBy({
      by: ["userId"],
      where: {
        workspaceId: { in: workspaceIds },
      },
    });

    const count = uniqueMembers.length;

    return NextResponse.json({ count });
  } catch (error) {
    console.error("Error fetching unique members:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
