// components/providers/SessionProvider.tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";

type Session = {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
} | null;

const SessionContext = createContext<{ session: Session; isLoading: boolean }>({
  session: null,
  isLoading: true,
});

export const useSession = () => useContext(SessionContext);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    authClient.getSession().then(({ data }: any) => {
      setSession(data);
      setIsLoading(false);
    });
  }, []);

  return (
    <SessionContext.Provider value={{ session, isLoading }}>
      {children}
    </SessionContext.Provider>
  );
}
