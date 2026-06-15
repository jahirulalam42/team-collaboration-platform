"use client";
import { Key, useState } from "react";
import { use } from "react"; // 👈 Import React's `use` hook
import {
  DndContext,
  closestCorners,
  DragEndEvent,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  UniqueIdentifier,
} from "@dnd-kit/core";
import { useQueryClient } from "@tanstack/react-query";
import { Column } from "@/components/kanban/Column";
import { TaskCard } from "@/components/kanban/TaskCard";
import { useBoardData } from "@/hooks/useBoardData";

export default function BoardPage({
  params,
}: {
  params: Promise<{ workspaceId: string; boardId: string }>; // 👈 params is a Promise
}) {
  // 👇 Unwrap the Promise to get the actual values
  const { workspaceId, boardId } = use(params);

  const queryClient = useQueryClient();
  const { data: board, refetch } = useBoardData(boardId);
  const [activeTask, setActiveTask] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || !board) return;

    const activeTaskId = active.id;
    const overColumnId = over.data.current?.columnId;
    const newIndex = over.data.current?.sortable?.index;

    // Find old column & task from current board state
    const oldColumn = board.columns.find((col: { tasks: any[] }) =>
      col.tasks.some((t) => t.id === activeTaskId)
    );
    const oldTask = oldColumn?.tasks.find(
      (t: { id: UniqueIdentifier }) => t.id === activeTaskId
    );

    if (!oldTask || oldTask.columnId === overColumnId) return;

    // Create optimistic updated columns
    const updatedColumns = board.columns.map(
      (col: { id: any; tasks: any[] }) => {
        if (col.id === oldTask.columnId) {
          return {
            ...col,
            tasks: col.tasks.filter((t) => t.id !== activeTaskId),
          };
        }
        if (col.id === overColumnId) {
          const newTasks = [...col.tasks];
          newTasks.splice(newIndex, 0, oldTask);
          return { ...col, tasks: newTasks };
        }
        return col;
      }
    );

    const optimisticBoard = { ...board, columns: updatedColumns };

    // Save original board for rollback
    const originalBoard = board;

    // Optimistically update React Query cache
    queryClient.setQueryData(["board", boardId], optimisticBoard);

    // Call API to persist move
    try {
      const res = await fetch("/api/tasks/move", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: activeTaskId,
          newColumnId: overColumnId,
          newOrder: newIndex,
          oldColumnId: oldTask.columnId,
        }),
      });
      if (!res.ok) throw new Error("Failed to move task");
      // Optionally refetch to ensure consistency
      await refetch();
    } catch (error) {
      // Rollback on error
      queryClient.setQueryData(["board", boardId], originalBoard);
      console.error("Drag drop error:", error);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={({ active }) => setActiveTask(active.data.current?.task)}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 p-4 overflow-x-auto">
        {board?.columns.map((column: { id: Key | null | undefined }) => (
          <Column key={column.id} column={column} boardId={boardId} />
        ))}
      </div>
      <DragOverlay>
        {activeTask ? <TaskCard task={activeTask} isOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}
