// app/api/user/profile/route.ts — GET & PATCH current user profile

import { NextRequest } from "next/server";
import { updateProfileSchema } from "@/lib/validations/user";
import { createErrorResponse, ApiError } from "@/lib/errors";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      query: {
        disableCookieCache: true,
      },
      headers: await headers(),
    });

    // Check if session exists (user is authenticated)
    if (!session) {
      return createErrorResponse(new ApiError(401, "Unauthorized"));
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        bio: true,
        createdAt: true,
      },
    });

    if (!user) throw new ApiError(404, "User not found");
    return Response.json({ user });
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    // Check if session exists (user is authenticated)
    if (!session) {
      return createErrorResponse(new ApiError(401, "Unauthorized"));
    }

    const body = await req.json();
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success)
      throw new ApiError(422, parsed.error.issues[0].message);

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: parsed.data,
      select: { id: true, name: true, email: true, image: true, bio: true },
    });

    return Response.json({ user });
  } catch (error) {
    return createErrorResponse(error);
  }
}
