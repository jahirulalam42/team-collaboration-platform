"use client";

import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

interface ActivityFeedProps {
  workspaceId: string;
  boardId?: string;
  limit?: number;
}

export function ActivityFeed({
  workspaceId,
  boardId,
  limit = 50,
}: ActivityFeedProps) {
  const { data: activities, isLoading } = useQuery({
    queryKey: ["activities", workspaceId, boardId, limit],
    queryFn: async () => {
      const params = new URLSearchParams({ workspaceId, limit: String(limit) });
      if (boardId) params.append("boardId", boardId);
      const res = await fetch(`/api/activities?${params}`);
      if (!res.ok) throw new Error("Failed to fetch activities");
      return res.json();
    },
    refetchInterval: 30000, // refresh every 30s (or use WebSocket for real-time)
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!activities?.length) {
    return <p className="text-muted-foreground text-sm">No activity yet.</p>;
  }

  return (
    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
      {activities.map((activity: any) => (
        <div key={activity.id} className="flex items-start gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={activity.user.image} />
            <AvatarFallback>{activity.user.name?.[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm">{activity.description}</p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(activity.createdAt), {
                addSuffix: true,
              })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
