import { headers } from "next/headers";
import { auth } from "@/lib/auth";

import { Button } from "@/components/ui/button";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function Home() {
  const users = await prisma.user.findMany();
  const session = await auth.api.getSession({
    query: {
      disableCookieCache: true,
    },
    headers: await headers(),
  });
  if (session) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
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
