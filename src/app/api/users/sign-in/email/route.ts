import { auth } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json();

  const result = await auth.api.signInEmail({
    body: {
      email: body.email, // required
      password: body.password, // required
      rememberMe: true,
      callbackURL: "/",
    },
    // This endpoint requires session cookies.
    // headers: await headers(),
  });

  return Response.json(result, {
    status: 201,
  });
}
