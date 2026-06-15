import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useWorkspaceBoards(workspaceId: string) {
  return useQuery({
    queryKey: ["workspace-boards", workspaceId],
    queryFn: async () => {
      const res = await fetch(`/api/boards?workspaceId=${workspaceId}`);
      if (!res.ok) throw new Error("Failed to fetch boards");
      return res.json();
    },
    enabled: !!workspaceId,
  });
}

export function useCreateBoard(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      workspaceId: string;
    }) => {
      const res = await fetch("/api/boards", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Failed to create board");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["workspace-boards", workspaceId],
      });
    },
  });
}

export function useDeleteBoard(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (boardId: string) => {
      const res = await fetch(`/api/boards/${boardId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete board");
      return res.json();
    },
    onSuccess: () => {
      // Invalidate and refetch boards list
      queryClient.invalidateQueries({
        queryKey: ["workspace-boards", workspaceId],
      });
    },
  });
}
