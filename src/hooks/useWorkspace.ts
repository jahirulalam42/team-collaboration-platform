// hooks/useWorkspace.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const API_BASE = "/api/workspace";

// Types
export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  createdAt: string;
  updatedAt: string;
  role?: "OWNER" | "ADMIN" | "MEMBER";
  joinedAt?: string;
  _count?: { members: number };
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
    bio?: string;
  };
}

// Fetch user's workspaces
export const useWorkspaces = () => {
  return useQuery({
    queryKey: ["workspaces"],
    queryFn: async () => {
      const res = await fetch(API_BASE);
      if (!res.ok) throw new Error("Failed to fetch workspaces");
      const data = await res.json();
      return data.workspaces as Workspace[];
    },
  });
};

// Fetch single workspace with members
export const useWorkspace = (workspaceId: string) => {
  return useQuery({
    queryKey: ["workspace", workspaceId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/${workspaceId}`);
      if (!res.ok) throw new Error("Failed to fetch workspace");
      const data = await res.json();
      return {
        workspace: data.workspace as Workspace,
        currentUserRole: data.currentUserRole as string,
      };
    },
    enabled: !!workspaceId,
  });
};

// Create workspace
export const useCreateWorkspace = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      slug?: string;
      description?: string;
    }) => {
      const res = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create workspace");
      }
      const result = await res.json();
      return result.workspace as Workspace;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      toast.success("Workspace created");
    },
    onError: (error: Error) => toast.error(error.message),
  });
};

// Update workspace
export const useUpdateWorkspace = (workspaceId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Workspace>) => {
      const res = await fetch(`${API_BASE}/${workspaceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Update failed");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace", workspaceId] });
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      toast.success("Workspace updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });
};

// Delete workspace
export const useDeleteWorkspace = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (workspaceId: string) => {
      const res = await fetch(`${API_BASE}/${workspaceId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Delete failed");
      }
    },
    onSuccess: (_, workspaceId) => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      queryClient.removeQueries({ queryKey: ["workspace", workspaceId] });
      toast.success("Workspace deleted");
    },
    onError: (error: Error) => toast.error(error.message),
  });
};

// Invite member
export const useInviteMember = (workspaceId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { email: string; role: "ADMIN" | "MEMBER" }) => {
      const res = await fetch(`${API_BASE}/${workspaceId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Invite failed");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace", workspaceId] });
      toast.success("Invite sent");
    },
    onError: (error: Error) => toast.error(error.message),
  });
};

// Fetch workspace members
export const useWorkspaceMembers = (workspaceId: string) => {
  return useQuery({
    queryKey: ["workspace-members", workspaceId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/${workspaceId}/members`);
      if (!res.ok) throw new Error("Failed to fetch members");
      const data = await res.json();
      return data.members as WorkspaceMember[];
    },
    enabled: !!workspaceId,
  });
};

// Update member role
export const useUpdateMemberRole = (workspaceId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      role,
    }: {
      userId: string;
      role: "ADMIN" | "MEMBER";
    }) => {
      const res = await fetch(
        `${API_BASE}/${workspaceId}/members?userId=${userId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role }),
        }
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Role update failed");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["workspace-members", workspaceId],
      });
      queryClient.invalidateQueries({ queryKey: ["workspace", workspaceId] });
      toast.success("Role updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });
};

// Remove member (or leave)
export const useRemoveMember = (workspaceId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(
        `${API_BASE}/${workspaceId}/members?userId=${userId}`,
        {
          method: "DELETE",
        }
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Removal failed");
      }
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({
        queryKey: ["workspace-members", workspaceId],
      });
      queryClient.invalidateQueries({ queryKey: ["workspace", workspaceId] });
      queryClient.invalidateQueries({ queryKey: ["workspaces"] }); // in case user left
      toast.success(userId === "self" ? "Left workspace" : "Member removed");
    },
    onError: (error: Error) => toast.error(error.message),
  });
};

// Accept invite (call from page)
export const acceptInvite = async (workspaceId: string, token: string) => {
  const res = await fetch(`${API_BASE}/${workspaceId}/invite?token=${token}`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to accept invite");
  }
  return res.json();
};
