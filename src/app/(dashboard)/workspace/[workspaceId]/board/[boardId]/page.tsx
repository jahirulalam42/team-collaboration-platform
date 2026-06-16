"use client";
import { useState } from "react";
import { use } from "react";
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
import { motion } from "framer-motion";
import { Column } from "@/components/kanban/Column";
import { TaskCard } from "@/components/kanban/TaskCard";
import { useBoardData } from "@/hooks/useBoardData";
import { Skeleton } from "@/components/ui/skeleton";

export default function BoardPage({
  params,
}: {
  params: Promise<{ workspaceId: string; boardId: string }>;
}) {
  const { workspaceId, boardId } = use(params);
  const queryClient = useQueryClient();
  const { data: board, isLoading, refetch } = useBoardData(boardId);
  const [activeTask, setActiveTask] = useState<any>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

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

  if (isLoading) {
    return (
      <div className="flex gap-6 p-6 overflow-x-auto h-full">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="w-72 shrink-0 space-y-4">
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-6 p-6 overflow-x-auto h-full items-start">
        {board?.columns.map((column: any, index: number) => (
          <motion.div
            key={column.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Column column={column} boardId={boardId} />
          </motion.div>
        ))}
      </div>
      <DragOverlay dropAnimation={null}>
        {activeTask ? <TaskCard task={activeTask} isOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}
