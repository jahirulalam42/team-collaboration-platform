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
import { Settings, UserMinus, UserCog } from "lucide-react";
import { toast } from "sonner";

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

      <InviteMemberModal
        open={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        workspaceId={workspaceId as string}
        workspaceName={workspace.name}
      />
    </div>
  );
}
