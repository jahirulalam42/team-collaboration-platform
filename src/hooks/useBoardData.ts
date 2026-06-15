// hooks/useBoardData.ts
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

interface Board {
  id: string;
  title: string;
  columns: Column[];
}

interface Column {
  id: string;
  title: string;
  order: number;
  tasks: Task[];
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  order: number;
  columnId: string;
  assignee?: { id: string; name: string } | null;
  // ... other fields
}

export function useBoardData(boardId: string) {
  return useQuery({
    queryKey: ["board", boardId],
    queryFn: async () => {
      const res = await fetch(`/api/boards/${boardId}`);
      if (!res.ok) throw new Error("Failed to fetch board");
      return res.json();
    },
    enabled: !!boardId,
  });
}
