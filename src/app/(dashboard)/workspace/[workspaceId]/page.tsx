// app/(dashboard)/workspace/[workspaceId]/page.tsx
"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import {
  useWorkspace,
  useWorkspaceMembers,
  useRemoveMember,
  useUpdateMemberRole,
} from "@/hooks/useWorkspace";
import { InviteMemberModal } from "@/components/workspace/InviteMemberModal";
import { Button } from "@/components/ui/button";
import {
  Settings,
  UserMinus,
  ShieldCheck,
  Shield,
  UserRound,
  Plus,
  FolderKanban,
  Trash2,
  MoreHorizontal,
  LayoutGrid,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import {
  useCreateBoard,
  useDeleteBoard,
  useWorkspaceBoards,
} from "@/hooks/useWorkspaceBoards";
import { CreateBoardModal } from "@/components/workspace/CreateBoardModal";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function WorkspacePage() {
  const { workspaceId } = useParams();
  const { data: workspaceData, isLoading: workspaceLoading } = useWorkspace(
    workspaceId as string
  );
  const {
    data: members,
    isLoading: membersLoading,
    refetch,
  } = useWorkspaceMembers(workspaceId as string);

  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const removeMember = useRemoveMember(workspaceId as string);
  const updateRole = useUpdateMemberRole(workspaceId as string);

  const [boardModalOpen, setBoardModalOpen] = useState(false);
  const { data: boards, isLoading: boardsLoading } = useWorkspaceBoards(
    workspaceId as string
  );
  const createBoard = useCreateBoard(workspaceId as string);
  const deleteBoard = useDeleteBoard(workspaceId as string);

  // Improved Loading State
  if (workspaceLoading || membersLoading) {
    return (
      <div className="container max-w-6xl py-8 space-y-8">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-28" />
          </div>
        </div>
        <Skeleton className="h-64 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!workspaceData?.workspace) {
    return (
      <div className="container max-w-6xl py-8 text-center text-muted-foreground">
        Workspace not found.
      </div>
    );
  }

  const { workspace, currentUserRole } = workspaceData;
  const canManage = currentUserRole === "OWNER" || currentUserRole === "ADMIN";

  const handleRemove = async (userId: string, userName: string) => {
    if (confirm(`Remove ${userName} from this workspace?`)) {
      try {
        await removeMember.mutateAsync(userId);
        toast.success(`${userName} removed`);
        refetch();
      } catch {
        toast.error("Failed to remove member");
      }
    }
  };

  const handleRoleChange = async (
    userId: string,
    newRole: "ADMIN" | "MEMBER"
  ) => {
    try {
      await updateRole.mutateAsync({ userId, role: newRole });
      toast.success("Role updated");
      refetch();
    } catch {
      toast.error("Failed to update role");
    }
  };

  const handleCreateBoard = async (name: string, description?: string) => {
    try {
      await createBoard.mutateAsync({
        name,
        description,
        workspaceId: workspaceId as string,
      });
      toast.success("Board created");
      setBoardModalOpen(false);
    } catch {
      toast.error("Failed to create board");
    }
  };

  const handleDeleteBoard = async (boardId: string, boardTitle: string) => {
    if (
      confirm(
        `Delete board "${boardTitle}"? All tasks will be permanently removed.`
      )
    ) {
      try {
        await deleteBoard.mutateAsync(boardId);
        toast.success("Board deleted");
      } catch {
        toast.error("Failed to delete board");
      }
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "OWNER":
        return <ShieldCheck className="h-3 w-3 mr-1" />;
      case "ADMIN":
        return <Shield className="h-3 w-3 mr-1" />;
      default:
        return <UserRound className="h-3 w-3 mr-1" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "OWNER":
        return "default";
      case "ADMIN":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div className="container max-w-6xl py-8 px-4 md:px-8 space-y-10">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {workspace.name}
          </h1>
          <p className="text-muted-foreground mt-1">
            {workspace.description || "Manage your workspace and team"}
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {canManage && (
            <Button
              onClick={() => setInviteModalOpen(true)}
              className="flex-1 sm:flex-none"
            >
              <Users className="h-4 w-4 mr-2" />
              Invite
            </Button>
          )}
          <Link
            href={`/workspace/${workspaceId}/settings`}
            className="flex-1 sm:flex-none"
          >
            <Button variant="outline" className="w-full sm:w-auto">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </Link>
        </div>
      </div>

      {/* Members Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-xl font-semibold">Team Members</h2>
          <Badge variant="secondary">{members?.length || 0}</Badge>
        </div>

        <Card>
          <div className="divide-y">
            {members?.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No members found.
              </div>
            ) : (
              members?.map((member: any) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage
                        src={member.user.image}
                        alt={member.user.name}
                      />
                      <AvatarFallback className="bg-primary/10 text-sm">
                        {member.user.name?.[0] || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium leading-none">
                        {member.user.name}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {member.user.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant={getRoleBadgeVariant(member.role)}
                      className="capitalize font-normal"
                    >
                      {getRoleIcon(member.role)}
                      {member.role.toLowerCase()}
                    </Badge>

                    {canManage && member.role !== "OWNER" && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {member.role !== "ADMIN" && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleRoleChange(member.userId, "ADMIN")
                              }
                            >
                              <Shield className="mr-2 h-4 w-4" />
                              Promote to Admin
                            </DropdownMenuItem>
                          )}
                          {member.role !== "MEMBER" && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleRoleChange(member.userId, "MEMBER")
                              }
                            >
                              <UserRound className="mr-2 h-4 w-4" />
                              Demote to Member
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() =>
                              handleRemove(member.userId, member.user.name)
                            }
                          >
                            <UserMinus className="mr-2 h-4 w-4" />
                            Remove Member
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Boards Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">Boards</h2>
            <Badge variant="secondary">{boards?.length || 0}</Badge>
          </div>
          {canManage && (
            <Button onClick={() => setBoardModalOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-1" /> New Board
            </Button>
          )}
        </div>

        {boardsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-36 w-full" />
            ))}
          </div>
        ) : boards?.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="bg-muted rounded-full p-4 mb-4">
                <LayoutGrid className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-1">No boards yet</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-xs">
                Create your first board to start managing tasks and projects.
              </p>
              {canManage && (
                <Button size="sm" onClick={() => setBoardModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" /> Create Board
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {boards?.map((board: any) => (
              <Link
                key={board.id}
                href={`/workspace/${workspaceId}/board/${String(board.id)}`}
                className="block group"
              >
                <Card className="hover:border-primary/50 hover:shadow-md transition-all relative overflow-hidden h-full">
                  {/* Decorative top bar for visual interest */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/80 to-primary/20" />
                  <CardHeader className="pb-2 pr-10">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FolderKanban className="h-4 w-4 text-primary" />
                      {board.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {board.description || "No description"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground font-medium">
                      {board._count?.tasks || 0} tasks
                    </p>
                  </CardContent>
                  {/* Delete button */}
                  {canManage && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDeleteBoard(board.id, board.title);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      <CreateBoardModal
        open={boardModalOpen}
        onClose={() => setBoardModalOpen(false)}
        onCreate={handleCreateBoard}
      />

      <InviteMemberModal
        open={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        workspaceId={workspaceId as string}
        workspaceName={workspace.name}
      />
    </div>
  );
}
