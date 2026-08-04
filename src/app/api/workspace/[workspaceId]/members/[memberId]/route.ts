import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server"; // import NextRequest
import { z } from "zod";

// Params type: params is a Promise
type Params = {
  params: Promise<{ workspaceId: string; memberId: string }>;
};

// Helper: get requester's role in workspace
async function getRequesterRole(workspaceId: string, userId: string) {
  const m = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
  return m?.role ?? null;
}

// PATCH /api/workspace/[workspaceId]/members/[memberId] — update role
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { workspaceId, memberId } = await params; // await the promise
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const requesterRole = await getRequesterRole(workspaceId, session.user.id);
    if (!requesterRole || requesterRole === "MEMBER") {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { role } = z
      .object({ role: z.enum(["ADMIN", "MEMBER"]) })
      .parse(body);

    // Find the target member
    const target = await prisma.workspaceMember.findUnique({
      where: { id: memberId },
    });

    if (!target || target.workspaceId !== workspaceId) {
      return NextResponse.json(
        { success: false, error: "Member not found" },
        { status: 404 }
      );
    }

    // Only OWNER can modify admins
    if (
      target.role === "OWNER" ||
      (target.role === "ADMIN" && requesterRole !== "OWNER")
    ) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const updated = await prisma.workspaceMember.update({
      where: { id: memberId },
      data: { role },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[MEMBER_PATCH]", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong." },
      { status: 500 }
    );
  }
}

// DELETE /api/workspace/[workspaceId]/members/[memberId] — remove member
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { workspaceId, memberId } = await params;
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const requesterRole = await getRequesterRole(workspaceId, session.user.id);

    const target = await prisma.workspaceMember.findUnique({
      where: { id: memberId },
    });

    if (!target || target.workspaceId !== workspaceId) {
      return NextResponse.json(
        { success: false, error: "Member not found" },
        { status: 404 }
      );
    }

    const isSelf = target.userId === session.user.id;
    const canRemove =
      isSelf ||
      requesterRole === "OWNER" ||
      (requesterRole === "ADMIN" && target.role === "MEMBER");

    if (!canRemove) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    if (target.role === "OWNER") {
      return NextResponse.json(
        {
          success: false,
          error: "Workspace owner cannot be removed. Transfer ownership first.",
        },
        { status: 400 }
      );
    }

    await prisma.workspaceMember.delete({ where: { id: memberId } });

    return NextResponse.json({ success: true, message: "Member removed" });
  } catch (error) {
    console.error("[MEMBER_DELETE]", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong." },
      { status: 500 }
    );
  }
}
