// app/(dashboard)/dashboard/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Users,
  Activity,
  Sparkles,
  FolderOpen,
  ArrowRight,
  Zap,
  Circle,
} from "lucide-react";
import { useWorkspaces } from "@/hooks/useWorkspace";
import { useAppSelector } from "@/app/store/hooks";
import { CreateWorkspaceModal } from "@/components/workspace/CreateWorkspaceModal";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useUniqueMembers } from "@/hooks/useUniqueMembers";

interface Workspace {
  id: string;
  name: string;
  role?: string;
  description?: string | null;
  _count?: { members: number };
}

// Generates a stable hue from a string so each user gets a consistent color
function colorFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 60%, 45%)`;
}

// Stacked presence avatars with overflow count
function PresenceStack({
  onlineCount,
  totalMembers,
  workspaceId,
}: {
  onlineCount: number;
  totalMembers: number;
  workspaceId: string;
}) {
  const MAX_SHOWN = 4;
  const overflow = Math.max(0, onlineCount - MAX_SHOWN);
  const shown = Math.min(onlineCount, MAX_SHOWN);

  if (onlineCount === 0) {
    return (
      <span className="text-xs text-muted-foreground flex items-center gap-1.5">
        <Users className="h-3.5 w-3.5" />
        {totalMembers} member{totalMembers !== 1 ? "s" : ""}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* Avatar stack */}
      <div className="flex -space-x-2">
        {[...Array(shown)].map((_, i) => {
          const letter = String.fromCharCode(
            65 + ((i * 7 + workspaceId.charCodeAt(0)) % 26)
          );
          const bg = colorFromName(workspaceId + i);
          return (
            <div
              key={i}
              className="h-6 w-6 rounded-full ring-2 ring-background flex items-center justify-center text-[10px] font-semibold text-white"
              style={{ backgroundColor: bg }}
            >
              {letter}
            </div>
          );
        })}
        {overflow > 0 && (
          <div className="h-6 w-6 rounded-full ring-2 ring-background bg-muted flex items-center justify-center text-[9px] font-semibold text-muted-foreground">
            +{overflow}
          </div>
        )}
      </div>
      <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
        {onlineCount} online
      </span>
    </div>
  );
}

export default function DashboardPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const { data: workspaces, isLoading, error } = useWorkspaces();
  const { data: uniqueMemberCount } = useUniqueMembers();
  // onlineUsersSlice shape: Record<workspaceId, string[]>
  const onlineUsersMap = useAppSelector((state) => state.onlineUsers);
  const allOnlineUserIds = new Set<string>();
  Object.values(onlineUsersMap).forEach((userIds) => {
    userIds.forEach((id) => allOnlineUserIds.add(id));
  });
  const totalOnline = allOnlineUserIds.size;

  // Count online users per workspace from Redux store
  const onlineByWorkspace: Record<string, number> = {};
  if (onlineUsersMap) {
    for (const [wsId, userIds] of Object.entries(onlineUsersMap)) {
      onlineByWorkspace[wsId] = (userIds as string[]).length;
    }
  }

  // const totalOnline = Object.values(onlineByWorkspace).reduce(
  //   (a, b) => a + b,
  //   0
  // );

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-5 w-64" />
          </div>
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-52 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/20 bg-destructive/5">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-destructive mb-2">Failed to load workspaces</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Try again
          </Button>
        </CardContent>
      </Card>
    );
  }

  const hasWorkspaces = workspaces && workspaces.length > 0;

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! You are a member of{" "}
            <span className="font-semibold text-foreground">
              {workspaces?.length || 0}
            </span>{" "}
            workspace{(workspaces?.length || 0) !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          onClick={() => setModalOpen(true)}
          className="shadow-sm gap-2 transition-all hover:shadow-md"
        >
          <Plus className="h-4 w-4" />
          New workspace
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-0 bg-gradient-to-br from-primary/5 via-background to-background shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Members
              </CardTitle>
              <div className="rounded-md bg-primary/10 p-2">
                <Users className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {uniqueMemberCount ?? "—"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                across all workspaces
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-0 bg-gradient-to-br from-primary/5 via-background to-background shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Workspaces
              </CardTitle>
              <div className="rounded-md bg-primary/10 p-2">
                <Activity className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {workspaces?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {workspaces?.length === 1 ? "workspace" : "workspaces"} active
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Live presence stat — the hero card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-0 shadow-sm overflow-hidden relative bg-gradient-to-br from-emerald-500/10 via-background to-background">
            {/* Subtle animated ring to signal "live" */}
            <span className="absolute top-3 right-3 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
            </span>
            <CardHeader className="flex flex-row items-center justify-between pb-2 pr-8">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Online Now
              </CardTitle>
              <div className="rounded-md bg-emerald-500/10 p-2">
                <Zap className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                {totalOnline}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                member{totalOnline !== 1 ? "s" : ""} active right now
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Workspace grid */}
      {!hasWorkspaces ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-dashed border-2 bg-muted/20">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-primary/10 p-4 mb-4">
                <FolderOpen className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-1">No workspaces yet</h3>
              <p className="text-muted-foreground text-sm mb-6 max-w-sm">
                Create your first workspace to start collaborating with your
                team in real-time
              </p>
              <Button onClick={() => setModalOpen(true)} className="gap-2">
                <Sparkles className="h-4 w-4" />
                Create your first workspace
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight">
              Your workspaces
            </h2>
            <Badge variant="secondary" className="gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {totalOnline} online
            </Badge>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {workspaces?.map((ws: Workspace, index: number) => {
                const onlineCount = onlineByWorkspace[ws.id] || 0;
                const hasActivity = onlineCount > 0;

                return (
                  <motion.div
                    key={ws.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ y: -3 }}
                  >
                    <Link href={`/workspace/${ws.id}`}>
                      <Card className="h-full transition-all duration-200 hover:shadow-lg hover:border-primary/30 group cursor-pointer overflow-hidden relative">
                        {/* Top accent bar — green if people are online */}
                        <div
                          className={`absolute top-0 left-0 right-0 h-[3px] transition-all duration-300 bg-gradient-to-r from-primary/70 to-primary/20
                          `}
                        />

                        <CardHeader className="flex flex-row items-start gap-3 pb-3 pt-5">
                          <Avatar className="h-11 w-11 bg-gradient-to-br from-primary/20 to-primary/5 shadow-sm shrink-0">
                            <AvatarFallback className="text-primary font-semibold text-base">
                              {ws?.name[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-base group-hover:text-primary transition-colors truncate">
                                {ws.name}
                              </CardTitle>
                              {hasActivity && (
                                <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                              )}
                            </div>
                            <CardDescription className="flex items-center gap-1 mt-1">
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1.5 capitalize"
                              >
                                {ws.role?.toLowerCase()}
                              </Badge>
                            </CardDescription>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
                        </CardHeader>

                        <CardContent className="pt-0 space-y-3">
                          {ws.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {ws.description}
                            </p>
                          )}

                          {/* Presence footer */}
                          <div className="flex items-center justify-between pt-1 border-t border-border/50">
                            <PresenceStack
                              onlineCount={onlineCount}
                              totalMembers={ws._count?.members || 0}
                              workspaceId={ws.id}
                            />
                            <span className="text-[10px] text-muted-foreground">
                              {ws._count?.members} member
                              {ws._count?.members !== 1 ? "s" : ""}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}

      <CreateWorkspaceModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
