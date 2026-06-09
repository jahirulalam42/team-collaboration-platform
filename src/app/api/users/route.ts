import prisma from "../../../../lib/prisma";

export async function GET(request: Request) {
  // For example, fetch data from your DB here

  const users = await prisma.user.findMany();

  return new Response(JSON.stringify(users), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(request: Request) {
  // Parse the request body
  const body = await request.json();
  const { name, email } = body;

  // e.g. Insert new user into your DB
  const newUser = await prisma.user.create({
    data: {
      email,
      name,
    },
  });

  return new Response(JSON.stringify(newUser), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
}
