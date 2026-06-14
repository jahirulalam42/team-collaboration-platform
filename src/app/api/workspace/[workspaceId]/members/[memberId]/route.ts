import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { z } from "zod";

type Params = { params: { workspaceId: string; memberId: string } };

// Helper: get requester's role in workspace
async function getRequesterRole(workspaceId: string, userId: string) {
  const m = await db.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
  return m?.role ?? null;
}

// PATCH /api/workspace/[workspaceId]/members/[memberId] — update role
export async function PATCH(req: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const requesterRole = await getRequesterRole(params.workspaceId, session.user.id);
    if (!requesterRole || requesterRole === "MEMBER") {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await req.json();
    const { role } = z.object({ role: z.enum(["ADMIN", "MEMBER"]) }).parse(body);

    // Find the target member
    const target = await db.workspaceMember.findUnique({
      where: { id: params.memberId },
    });

    if (!target || target.workspaceId !== params.workspaceId) {
      return NextResponse.json({ success: false, error: "Member not found" }, { status: 404 });
    }

    // Only OWNER can modify admins
    if (target.role === "OWNER" || (target.role === "ADMIN" && requesterRole !== "OWNER")) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });
    }

    const updated = await db.workspaceMember.update({
      where: { id: params.memberId },
      data: { role },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[MEMBER_PATCH]", error);
    return NextResponse.json({ success: false, error: "Something went wrong." }, { status: 500 });
  }
}

// DELETE /api/workspace/[workspaceId]/members/[memberId] — remove member
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const requesterRole = await getRequesterRole(params.workspaceId, session.user.id);

    const target = await db.workspaceMember.findUnique({
      where: { id: params.memberId },
    });

    if (!target || target.workspaceId !== params.workspaceId) {
      return NextResponse.json({ success: false, error: "Member not found" }, { status: 404 });
    }

    const isSelf = target.userId === session.user.id;
    const canRemove =
      isSelf || // Anyone can leave
      requesterRole === "OWNER" ||
      (requesterRole === "ADMIN" && target.role === "MEMBER");

    if (!canRemove) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });
    }

    if (target.role === "OWNER") {
      return NextResponse.json(
        { success: false, error: "Workspace owner cannot be removed. Transfer ownership first." },
        { status: 400 }
      );
    }

    await db.workspaceMember.delete({ where: { id: params.memberId } });

    return NextResponse.json({ success: true, message: "Member removed" });
  } catch (error) {
    console.error("[MEMBER_DELETE]", error);
    return NextResponse.json({ success: false, error: "Something went wrong." }, { status: 500 });
  }
}
