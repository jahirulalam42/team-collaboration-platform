"use client";
import { useState } from "react";
import { use } from "react";
import { motion } from "framer-motion";
import {
  DndContext,
  closestCorners,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useSensor,
  useSensors,
  PointerSensor,
  UniqueIdentifier,
} from "@dnd-kit/core";
import { useQueryClient } from "@tanstack/react-query";
import { Column } from "@/components/kanban/Column";
import { TaskCard } from "@/components/kanban/TaskCard";
import { useBoardData } from "@/hooks/useBoardData";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, LayoutGrid, Columns } from "lucide-react";
import Link from "next/link";

export default function BoardPage({
  params,
}: {
  params: Promise<{ workspaceId: string; boardId: string }>;
}) {
  const { workspaceId, boardId } = use(params);
  const queryClient = useQueryClient();
  const { data: board, refetch, isLoading } = useBoardData(boardId);
  const [activeTask, setActiveTask] = useState<any>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // Helper to find which column a task or column ID belongs to
  const findColumn = (id: UniqueIdentifier) => {
    if (!board) return null;
    if (board.columns.some((col: any) => col.id === id)) {
      return board.columns.find((col: any) => col.id === id);
    }
    return board.columns.find((col: any) =>
      col.tasks.some((t: any) => t.id === id)
    );
  };

  function handleDragStart(event: DragStartEvent) {
    setActiveTask(event.active.data.current?.task);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTask(null);

    if (!over || !board || active.id === over.id) return;

    const activeColumn = findColumn(active.id);
    const overColumn = findColumn(over.id);

    if (!activeColumn || !overColumn) return;

    const activeTaskIndex = activeColumn.tasks.findIndex(
      (t: any) => t.id === active.id
    );
    if (activeTaskIndex === -1) return;
    const activeTask = activeColumn.tasks[activeTaskIndex];

    const overTaskIndex = overColumn.tasks.findIndex(
      (t: any) => t.id === over.id
    );
    const insertIndex =
      overTaskIndex === -1 ? overColumn.tasks.length : overTaskIndex;

    if (activeColumn.id === overColumn.id && activeTaskIndex === insertIndex) {
      return;
    }

    const updatedColumns = board.columns.map((col: any) => {
      if (col.id === activeColumn.id && col.id === overColumn.id) {
        const newTasks = [...col.tasks];
        newTasks.splice(activeTaskIndex, 1);
        newTasks.splice(
          insertIndex > activeTaskIndex ? insertIndex - 1 : insertIndex,
          0,
          activeTask
        );
        return { ...col, tasks: newTasks };
      } else if (col.id === activeColumn.id) {
        return {
          ...col,
          tasks: col.tasks.filter((t: any) => t.id !== active.id),
        };
      } else if (col.id === overColumn.id) {
        const newTasks = [...col.tasks];
        newTasks.splice(insertIndex, 0, activeTask);
        return { ...col, tasks: newTasks };
      }
      return col;
    });

    const optimisticBoard = { ...board, columns: updatedColumns };
    const originalBoard = board;

    queryClient.setQueryData(["board", boardId], optimisticBoard);

    try {
      const res = await fetch("/api/tasks/move", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: active.id,
          newColumnId: overColumn.id,
          newOrder:
            insertIndex > activeTaskIndex && activeColumn.id === overColumn.id
              ? insertIndex - 1
              : insertIndex,
          oldColumnId: activeColumn.id,
        }),
      });
      if (!res.ok) throw new Error("Failed to move task");
    } catch (error) {
      queryClient.setQueryData(["board", boardId], originalBoard);
      console.error("Drag drop error:", error);
    }
  }

  // Improved Loading State matching Dashboard
  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32 rounded-lg" />
          <Skeleton className="h-9 w-64 rounded-lg" />
          <Skeleton className="h-4 w-96 rounded-lg" />
        </div>
        <div className="flex gap-6 overflow-x-auto pb-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="w-72 shrink-0 space-y-4 bg-muted/30 rounded-xl p-4 border border-border/50"
            >
              <Skeleton className="h-6 w-24 rounded-md" />
              {[...Array(3)].map((_, j) => (
                <Skeleton key={j} className="h-24 w-full rounded-lg" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    // flex-1 and h-full ensure the kanban board takes up the maximum available vertical space
    <div className="flex flex-col h-full">
      {/* Header Section matching Dashboard & Workspace */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 shrink-0"
      >
        <div>
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="mb-2 text-muted-foreground hover:text-foreground px-0 gap-1"
          >
            <Link href={`/workspace/${workspaceId}`}>
              <ArrowLeft className="h-4 w-4" />
              Back to Workspace
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent flex items-center gap-3">
            <LayoutGrid className="h-8 w-8 text-primary" />
            {board?.title || "Board"}
          </h1>
          {board?.description && (
            <p className="text-muted-foreground mt-1 max-w-xl">
              {board.description}
            </p>
          )}
        </div>
      </motion.div>

      {/* DnD Kanban Area */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* flex-1 allows it to fill remaining height, overflow-x-auto handles horizontal scrolling for many columns */}
        <div className="flex gap-6 overflow-x-auto pb-4 flex-1 items-start">
          {board?.columns.map((column: any) => (
            <Column key={column.id} column={column} boardId={boardId} />
          ))}

          {/* Empty State for Columns */}
          {board?.columns.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-xl text-muted-foreground bg-muted/20"
            >
              <div className="rounded-full bg-primary/10 p-4 mb-4">
                <Columns className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-1">No columns yet</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm text-center">
                Add columns to your board to start organizing tasks.
              </p>
            </motion.div>
          )}
        </div>
        <DragOverlay dropAnimation={null}>
          {activeTask ? <TaskCard task={activeTask} isOverlay /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
