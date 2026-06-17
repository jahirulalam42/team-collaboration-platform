"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

interface SearchDialogProps {
  open: boolean;
  onClose: () => void;
  workspaceId: string;
}

export function SearchDialog({
  open,
  onClose,
  workspaceId,
}: SearchDialogProps) {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ["search", query, workspaceId],
    queryFn: async () => {
      if (!query.trim()) return null;
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(query)}&workspaceId=${workspaceId}`
      );
      if (!res.ok) throw new Error("Search failed");
      return res.json();
    },
    enabled: open && query.trim().length > 0,
    staleTime: 30000,
  });

  const handleSelect = (type: string, id: string) => {
    onClose();
    if (type === "task") {
      // navigate to board with task highlight
      // simplified: go to workspace board
      router.push(`/workspace/${workspaceId}?task=${id}`);
    } else if (type === "board") {
      router.push(`/workspace/${workspaceId}/board/${id}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Search</DialogTitle>
        </DialogHeader>
        <Input
          placeholder="Search tasks, boards, comments, members..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        <ScrollArea className="max-h-[60vh]">
          {isLoading && (
            <p className="text-muted-foreground text-sm">Searching...</p>
          )}
          {data && (
            <div className="space-y-4">
              {data.tasks?.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Tasks</h4>
                  {data.tasks.map((task: any) => (
                    <div
                      key={task.id}
                      className="p-2 hover:bg-muted rounded cursor-pointer"
                      onClick={() => handleSelect("task", task.id)}
                    >
                      <p className="text-sm">{task.title}</p>
                      <p className="text-xs text-muted-foreground">
                        in {task.board.title}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              {/* Similar for boards, comments, members */}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
