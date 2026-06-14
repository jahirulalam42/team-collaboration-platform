"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import {
  useWorkspaceMembers,
  useUpdateMemberRole,
  useRemoveMember,
  useWorkspace,
} from "@/hooks/useWorkspace";
import { InviteMemberModal } from "@/components/workspace/InviteMemberModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MoreHorizontal, UserMinus, UserCog, Search } from "lucide-react";

export default function WorkspaceMembersPage() {
  const { workspaceId } = useParams();
  const { data: workspaceData } = useWorkspace(workspaceId as string);
  const {
    data: members,
    isLoading,
    refetch,
  } = useWorkspaceMembers(workspaceId as string);
  const updateRole = useUpdateMemberRole(workspaceId as string);
  const removeMember = useRemoveMember(workspaceId as string);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [search, setSearch] = useState("");

  const currentUserRole = workspaceData?.currentUserRole;
  const canManage = currentUserRole === "OWNER" || currentUserRole === "ADMIN";
  const isOwner = currentUserRole === "OWNER";

  const filteredMembers = members?.filter(
    (m) =>
      m.user.name.toLowerCase().includes(search.toLowerCase()) ||
      m.user.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleRoleChange = async (
    userId: string,
    newRole: "ADMIN" | "MEMBER"
  ) => {
    await updateRole.mutateAsync({ userId, role: newRole });
    refetch();
  };

  const handleRemove = async (userId: string, userName: string) => {
    if (confirm(`Remove ${userName} from workspace?`)) {
      await removeMember.mutateAsync(userId);
      refetch();
    }
  };

  if (isLoading)
    return <div className="flex justify-center p-8">Loading members...</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Workspace Members</CardTitle>
              <CardDescription>Manage members and their roles.</CardDescription>
            </div>
            {canManage && (
              <Button onClick={() => setInviteModalOpen(false)}>
                Invite Member
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search members..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  {canManage && <TableHead className="w-[50px]"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers?.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={member.user.image || ""} />
                          <AvatarFallback>
                            {member.user.name?.charAt(0) ||
                              member.user.email.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{member.user.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {member.user.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          member.role === "OWNER"
                            ? "default"
                            : member.role === "ADMIN"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {member.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(member.joinedAt).toLocaleDateString()}
                    </TableCell>
                    {canManage && (
                      <TableCell>
                        {member.role !== "OWNER" && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  handleRoleChange(
                                    member.userId,
                                    member.role === "ADMIN" ? "MEMBER" : "ADMIN"
                                  )
                                }
                              >
                                <UserCog className="mr-2 h-4 w-4" />
                                Set as{" "}
                                {member.role === "ADMIN" ? "Member" : "Admin"}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleRemove(member.userId, member.user.name)
                                }
                                className="text-destructive"
                              >
                                <UserMinus className="mr-2 h-4 w-4" />
                                Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                        {member.role === "OWNER" && isOwner && (
                          <span className="text-xs text-muted-foreground">
                            You
                          </span>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <InviteMemberModal
        open={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        workspaceId={workspaceId as string}
        workspaceName={workspaceData?.workspace.name || ""}
      />
    </div>
  );
}
