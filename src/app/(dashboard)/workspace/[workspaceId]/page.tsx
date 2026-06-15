// app/(dashboard)/workspace/[workspaceId]/page.tsx
"use client";

import { useParams } from "next/navigation";
import {
  JSXElementConstructor,
  Key,
  ReactElement,
  ReactNode,
  ReactPortal,
  useState,
} from "react";
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
  UserCog,
  Plus,
  CircuitBoard,
  FolderKanban,
  Trash2,
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

  if (workspaceLoading || membersLoading) return <div>Loading...</div>;
  if (!workspaceData?.workspace) return <div>Workspace not found</div>;

  const { workspace, currentUserRole } = workspaceData;
  const canManage = currentUserRole === "OWNER" || currentUserRole === "ADMIN";

  const handleRemove = async (userId: string, userName: string) => {
    if (confirm(`Remove ${userName}?`)) {
      await removeMember.mutateAsync(userId);
      refetch();
    }
  };

  const handleRoleChange = async (
    userId: string,
    newRole: "ADMIN" | "MEMBER"
  ) => {
    await updateRole.mutateAsync({ userId, role: newRole });
    refetch();
  };

  const handleCreateBoard = async (name: string, description?: string) => {
    await createBoard.mutateAsync({
      name,
      description,
      workspaceId: workspaceId as string,
    });
    setBoardModalOpen(false);
  };

  const handleDeleteBoard = async (boardId: string, boardTitle: string) => {
    if (
      confirm(
        `Delete board "${boardTitle}"? All tasks will be permanently removed.`
      )
    ) {
      await deleteBoard.mutateAsync(boardId);
    }
  };

  return (
    <div className="container max-w-5xl py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{workspace.name}</h1>
          <p className="text-muted-foreground">
            {workspace.description || "No description"}
          </p>
        </div>
        <div className="flex gap-2">
          {canManage && (
            <Button onClick={() => setInviteModalOpen(true)}>
              Invite member
            </Button>
          )}
          <Link href={`/workspace/${workspaceId}/settings`}>
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </Link>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">
          Members ({members?.length})
        </h2>
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-3">User</th>
                <th className="text-left p-3">Role</th>
                <th className="text-left p-3">Joined</th>
                {canManage && <th className="text-right p-3">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {members?.map((member: any) => (
                <tr key={member.id} className="border-t">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {member.user.image ? (
                        <img
                          src={member.user.image}
                          alt=""
                          className="h-6 w-6 rounded-full"
                        />
                      ) : (
                        <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-xs">
                          {member.user.name?.[0] || "?"}
                        </div>
                      )}
                      <div>
                        <div className="font-medium">{member.user.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {member.user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    {canManage && member.role !== "OWNER" ? (
                      <select
                        value={member.role}
                        onChange={(e) =>
                          handleRoleChange(
                            member.userId,
                            e.target.value as "ADMIN" | "MEMBER"
                          )
                        }
                        className="border rounded px-2 py-1 text-sm bg-background"
                      >
                        <option value="ADMIN">Admin</option>
                        <option value="MEMBER">Member</option>
                      </select>
                    ) : (
                      <span className="capitalize">
                        {member.role.toLowerCase()}
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {new Date(member.joinedAt).toLocaleDateString()}
                  </td>
                  {canManage && member.role !== "OWNER" && (
                    <td className="p-3 text-right">
                      <button
                        onClick={() =>
                          handleRemove(member.userId, member.user.name)
                        }
                        className="text-destructive hover:underline"
                      >
                        <UserMinus className="h-4 w-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Boards Section */}
      <div className="mt-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Boards</h2>
          {canManage && (
            <Button onClick={() => setBoardModalOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-1" /> New Board
            </Button>
          )}
        </div>
        {boardsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-28 w-full" />
            ))}
          </div>
        ) : boards?.length === 0 ? (
          <div className="text-center py-12 border rounded-lg text-muted-foreground">
            No boards yet. Create one to start managing tasks.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {boards?.map((board: any) => (
              <Link
                key={board.id}
                href={`/workspace/${workspaceId}/board/${String(board.id)}`}
                className="block"
              >
                <Card className="hover:border-primary/50 transition-all relative group">
                  <CardHeader className="pb-2 pr-8">
                    {" "}
                    {/* Add padding right for delete button */}
                    <CardTitle className="text-base flex items-center gap-2">
                      <FolderKanban className="h-4 w-4 text-muted-foreground" />
                      {board.title}
                    </CardTitle>
                    <CardDescription>
                      {board.description || "No description"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      {board._count?.tasks || 0} tasks
                    </p>
                  </CardContent>
                  {/* Delete button - visible on hover */}
                  {canManage && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.preventDefault(); // Prevent Link navigation
                        e.stopPropagation();
                        handleDeleteBoard(board.id, board.title);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
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
