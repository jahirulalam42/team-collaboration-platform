"use client";

import {
  JSXElementConstructor,
  Key,
  ReactElement,
  ReactNode,
  ReactPortal,
  useState,
} from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Users,
  Calendar,
  Activity,
  Sparkles,
  FolderOpen,
  ArrowRight,
} from "lucide-react";
import { useWorkspaces } from "@/hooks/useWorkspace";
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
import { Progress } from "@/components/ui/progress";

export default function DashboardPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const { data: workspaces, isLoading, error } = useWorkspaces();

  // Calculate total members across all workspaces
  const totalMembers =
    workspaces?.reduce(
      (sum: any, ws: { _count: { members: any } }) =>
        sum + (ws._count?.members || 0),
      0
    ) || 0;

  if (isLoading) {
    return (
      <div className="space-y-8">
        {/* Welcome skeleton */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-5 w-64" />
          </div>
          <Skeleton className="h-10 w-36" />
        </div>
        {/* Stats skeleton */}
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
        {/* Workspaces skeleton */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-36 w-full rounded-xl" />
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
      {/* Welcome header with gradient */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Dashboard
          </h1>
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

      {/* Stats cards with icons and animations */}
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
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalMembers}</div>
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
              <Activity className="h-4 w-4 text-primary" />
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-0 bg-gradient-to-br from-primary/5 via-background to-background shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Completion Rate
              </CardTitle>
              <Calendar className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">—</div>
              <Progress value={0} className="mt-2 h-1" />
              <p className="text-xs text-muted-foreground mt-2">
                Track tasks to see stats
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Workspace grid with empty state */}
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
                team
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
            <Badge variant="secondary" className="gap-1">
              <Users className="h-3 w-3" />
              {totalMembers} total members
            </Badge>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {workspaces?.map(
                (
                  ws: {
                    id: Key | null | undefined;
                    name: string;
                    role: string;
                    _count: {
                      members:
                        | string
                        | number
                        | bigint
                        | boolean
                        | ReactElement<
                            unknown,
                            string | JSXElementConstructor<any>
                          >
                        | Iterable<ReactNode>
                        | Promise<
                            | string
                            | number
                            | bigint
                            | boolean
                            | ReactPortal
                            | ReactElement<
                                unknown,
                                string | JSXElementConstructor<any>
                              >
                            | Iterable<ReactNode>
                            | null
                            | undefined
                          >
                        | null
                        | undefined;
                    };
                    description:
                      | string
                      | number
                      | bigint
                      | boolean
                      | ReactElement<
                          unknown,
                          string | JSXElementConstructor<any>
                        >
                      | Iterable<ReactNode>
                      | ReactPortal
                      | Promise<
                          | string
                          | number
                          | bigint
                          | boolean
                          | ReactPortal
                          | ReactElement<
                              unknown,
                              string | JSXElementConstructor<any>
                            >
                          | Iterable<ReactNode>
                          | null
                          | undefined
                        >
                      | null
                      | undefined;
                  },
                  index: number
                ) => (
                  <motion.div
                    key={ws.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ y: -4 }}
                  >
                    <Link href={`/workspace/${String(ws.id)}`}>
                      <Card className="h-full transition-all duration-200 hover:shadow-lg hover:border-primary/30 group cursor-pointer">
                        <CardHeader className="flex flex-row items-center gap-3 pb-3">
                          <Avatar className="h-12 w-12 bg-gradient-to-br from-primary/20 to-primary/5 shadow-sm">
                            <AvatarFallback className="text-primary font-semibold text-lg">
                              {ws?.name[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <CardTitle className="text-base group-hover:text-primary transition-colors">
                              {ws.name}
                            </CardTitle>
                            <CardDescription className="capitalize text-xs flex items-center gap-1 mt-0.5">
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1.5"
                              >
                                {ws.role?.toLowerCase()}
                              </Badge>
                            </CardDescription>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <Users className="h-3.5 w-3.5" />
                              <span>
                                {ws._count?.members} member
                                {ws._count?.members !== 1 ? "s" : ""}
                              </span>
                            </div>
                            {ws.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1 max-w-[60%]">
                                {ws.description}
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                )
              )}
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
