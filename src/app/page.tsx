import { headers } from "next/headers";
import { auth } from "../../lib/auth";
import { authClient } from "../../lib/auth-client";
import prisma from "../../lib/prisma";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const users = await prisma.user.findMany();
  const session = await auth.api.getSession({
    query: {
      disableCookieCache: true,
    },
    headers: await headers(), // headers containing the user's session token
  });
  console.log("Session", session);
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center -mt-16">
      <div className="flex min-h-svh items-center justify-center">
        <Button variant={"secondary"} size={"lg"}>
          Click me
        </Button>
      </div>
    </div>
  );
}
