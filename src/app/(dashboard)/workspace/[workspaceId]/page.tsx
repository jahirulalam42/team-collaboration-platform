// app/(dashboard)/workspace/[workspaceId]/page.tsx
"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
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
  ArrowRight,
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
import { selectOnlineUsers } from "@/app/store/slices/onlineUsersSlice";
import { useAppSelector } from "@/app/store/hooks";

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

  const onlineUserIds = useAppSelector((state) =>
    selectOnlineUsers(state, workspaceId as string)
  );

  // Improved Loading State matching Dashboard
  if (workspaceLoading || membersLoading) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32 rounded-lg" />
            <Skeleton className="h-10 w-28 rounded-lg" />
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-6 w-24" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-36 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!workspaceData?.workspace) {
    return (
      <Card className="border-destructive/20 bg-destructive/5">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-destructive mb-2">Workspace not found.</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Try again
          </Button>
        </CardContent>
      </Card>
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
    <div className="space-y-8">
      {/* Header Section - Gradient Text matching Dashboard */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
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
              className="flex-1 sm:flex-none shadow-sm gap-2 transition-all hover:shadow-md"
            >
              <Users className="h-4 w-4" />
              Invite
            </Button>
          )}
          <Link
            href={`/workspace/${workspaceId}/settings`}
            className="flex-1 sm:flex-none"
          >
            <Button variant="outline" className="w-full sm:w-auto gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Members Section - Animated List */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold tracking-tight">Team Members</h2>
          <Badge variant="secondary">{members?.length || 0}</Badge>
        </div>

        <Card className="border-0 bg-gradient-to-br from-primary/5 via-background to-background shadow-sm overflow-hidden">
          <CardContent className="p-0 divide-y">
            {members?.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No members found.
              </div>
            ) : (
              <AnimatePresence>
                {members?.map((member: any, index: number) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 ring-2 ring-primary/10">
                        <AvatarImage
                          src={member.user.image}
                          alt={member.user.name}
                        />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {member.user.name?.[0]?.toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium leading-none flex items-center gap-2">
                          {member.user.name}
                          {onlineUserIds.includes(member.userId) && (
                            <span className="inline-block h-2 w-2 rounded-full bg-green-500 ml-1" />
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
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
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
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
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Boards Section - Staggered Cards matching Dashboard Workspace Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold tracking-tight">Boards</h2>
            <Badge variant="secondary">{boards?.length || 0}</Badge>
          </div>
          {canManage && (
            <Button
              onClick={() => setBoardModalOpen(true)}
              size="sm"
              className="gap-2"
            >
              <Plus className="h-4 w-4" /> New Board
            </Button>
          )}
        </div>

        {boardsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-36 w-full rounded-xl" />
            ))}
          </div>
        ) : boards?.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="border-dashed border-2 bg-muted/20">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="rounded-full bg-primary/10 p-4 mb-4">
                  <LayoutGrid className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-1">No boards yet</h3>
                <p className="text-muted-foreground text-sm mb-6 max-w-sm">
                  Create your first board to start managing tasks and projects.
                </p>
                {canManage && (
                  <Button
                    onClick={() => setBoardModalOpen(true)}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" /> Create Board
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {boards?.map((board: any, index: number) => (
                <motion.div
                  key={board.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -4 }}
                >
                  <Link
                    href={`/workspace/${workspaceId}/board/${String(board.id)}`}
                    className="block group"
                  >
                    <Card className="h-full transition-all duration-200 hover:shadow-lg hover:border-primary/30 cursor-pointer overflow-hidden relative">
                      {/* Decorative top bar */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/80 to-primary/20" />
                      <CardHeader className="pb-2 pr-10">
                        <CardTitle className="text-base flex items-center gap-2 group-hover:text-primary transition-colors flex flex-row justify-between">
                          <div className="flex flex-row gap-2 items-center">
                            <FolderKanban className="h-4 w-4 text-primary" />
                            {board.title}
                          </div>

                          <Badge variant="outline" className="text-xs">
                            {onlineUserIds.length} online
                          </Badge>
                        </CardTitle>
                        <CardDescription className="line-clamp-2 ">
                          {board.description || "No description"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground font-medium">
                          {board._count?.tasks || 0} tasks
                        </p>
                        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                      </CardContent>
                      {/* Delete button */}
                      {canManage && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-3 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10"
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
                </motion.div>
              ))}
            </AnimatePresence>
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
