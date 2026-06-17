import { useQuery } from "@tanstack/react-query";

export function useUniqueMembers() {
  return useQuery({
    queryKey: ["unique-members"],
    queryFn: async () => {
      const res = await fetch("/api/workspace/unique-members");
      if (!res.ok) throw new Error("Failed to fetch unique members");
      const data = await res.json();
      return data.count as number;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
