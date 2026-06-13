import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  // For example, fetch data from your DB here

  const users = await prisma.user.findMany();

  return new Response(JSON.stringify(users), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(request: Request) {
  const body = await request.json();

  const result = await auth.api.signUpEmail({
    body: {
      name: body.name,
      email: body.email,
      password: body.password,
      callbackURL: "/",
    },
  });

  return Response.json(result, {
    status: 201,
  });
}
