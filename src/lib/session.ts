// lib/session.ts — Server-side session helper for API routes

import { auth } from "@/lib/auth";
import { ApiError } from "@/lib/errors";
import { headers } from "next/headers";
import prisma from "./prisma";

/** Get the current session or throw 401 */
export async function requireSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user?.id) {
    throw new ApiError(401, "You must be signed in");
  }
  return session;
}

/** Get the current user's membership in a workspace or throw 403 */
export async function requireWorkspaceMember(
  workspaceId: string,
  userId: string,
  allowedRoles?: Array<"OWNER" | "ADMIN" | "MEMBER">
) {
  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
    include: { workspace: true },
  });

  if (!member) {
    throw new ApiError(403, "You are not a member of this workspace");
  }

  if (allowedRoles && !allowedRoles.includes(member.role)) {
    throw new ApiError(403, "You do not have permission to do this");
  }

  return member;
}
