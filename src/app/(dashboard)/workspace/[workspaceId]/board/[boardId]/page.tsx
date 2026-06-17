"use client";
import { useState, useEffect } from "react";
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
import { TaskModal } from "@/components/tasks/TaskModal";
import { useBoardData } from "@/hooks/useBoardData";
import { useSocket } from "@/hooks/useSocket";
import { OnlineUsers } from "@/components/workspace/OnlineUsers";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useAppSelector } from "@/app/store/hooks";
import { useRouter } from "next/navigation";
import { useWorkspaceMembers } from "@/hooks/useWorkspace";

export default function BoardPage({
  params,
}: {
  params: Promise<{ workspaceId: string; boardId: string }>;
}) {
  const { workspaceId, boardId } = use(params);
  const router = useRouter();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const { data: session, loading: sessionLoading } = useAppSelector(
    (state) => state.session
  );
  const userId = session?.user?.id;

  const queryClient = useQueryClient();
  const {
    data: board,
    isLoading: boardLoading,
    refetch,
  } = useBoardData(boardId);
  const [activeTask, setActiveTask] = useState<any>(null);

  const socket = useSocket(workspaceId, userId);
  const { data: members, isLoading: membersLoading } =
    useWorkspaceMembers(workspaceId);

  // ---------- Live task move ----------
  useEffect(() => {
    if (!socket || !boardId) return;

    const handleTaskMoved = (data: {
      taskId: string;
      newColumnId: string;
      newOrder: number;
      oldColumnId: string;
      userId: string;
    }) => {
      if (data.userId === userId) return;

      queryClient.setQueryData(["board", boardId], (oldBoard: any) => {
        if (!oldBoard) return oldBoard;

        const oldColumn = oldBoard.columns.find((col: any) =>
          col.tasks.some((t: any) => t.id === data.taskId)
        );
        if (!oldColumn) return oldBoard;

        const taskIndex = oldColumn.tasks.findIndex(
          (t: any) => t.id === data.taskId
        );
        if (taskIndex === -1) return oldBoard;

        const task = oldColumn.tasks[taskIndex];

        const newColumns = oldBoard.columns.map((col: any) => {
          if (col.id === oldColumn.id) {
            return {
              ...col,
              tasks: col.tasks.filter((t: any) => t.id !== data.taskId),
            };
          }
          return col;
        });

        const targetColumn = newColumns.find(
          (col: any) => col.id === data.newColumnId
        );
        if (!targetColumn) return oldBoard;

        const finalColumns = newColumns.map((col: any) => {
          if (col.id === data.newColumnId) {
            const updatedTasks = [...col.tasks];
            updatedTasks.splice(data.newOrder, 0, {
              ...task,
              columnId: data.newColumnId,
            });
            return { ...col, tasks: updatedTasks };
          }
          return col;
        });

        return { ...oldBoard, columns: finalColumns };
      });
    };

    socket.on("task:moved", handleTaskMoved);

    return () => {
      socket.off("task:moved", handleTaskMoved);
    };
  }, [socket, boardId, userId, queryClient]);

  // ---------- Live comment/attachment updates ----------
  useEffect(() => {
    if (!socket) return;

    const handleCommentAdded = ({ taskId }: { taskId: string }) => {
      // If the modal is open for this task, refetch comments
      if (selectedTaskId === taskId) {
        queryClient.invalidateQueries({ queryKey: ["comments", taskId] });
      }
    };

    const handleAttachmentAdded = ({ taskId }: { taskId: string }) => {
      if (selectedTaskId === taskId) {
        queryClient.invalidateQueries({ queryKey: ["attachments", taskId] });
      }
    };

    socket.on("comment:added", handleCommentAdded);
    socket.on("attachment:added", handleAttachmentAdded);

    return () => {
      socket.off("comment:added", handleCommentAdded);
      socket.off("attachment:added", handleAttachmentAdded);
    };
  }, [socket, selectedTaskId, queryClient]);

  // ---------- Drag & Drop ----------
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

    const newOrder =
      insertIndex > activeTaskIndex && activeColumn.id === overColumn.id
        ? insertIndex - 1
        : insertIndex;

    const movePayload = {
      taskId: active.id,
      newColumnId: overColumn.id,
      newOrder,
      oldColumnId: activeColumn.id,
    };

    try {
      const res = await fetch("/api/tasks/move", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(movePayload),
      });
      if (!res.ok) throw new Error("Failed to move task");

      if (socket && socket.connected) {
        socket.emit("task:move", movePayload);
      } else {
        console.warn("Socket not connected, skipping emit");
      }
    } catch (error) {
      queryClient.setQueryData(["board", boardId], originalBoard);
      toast.error("Failed to move task");
      console.error("Drag drop error:", error);
    }
  }

  // ---------- Task deletion ----------
  const handleDeleteTask = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      await queryClient.invalidateQueries({ queryKey: ["board", boardId] });
      toast.success("Task deleted");
      // If the modal is open for this task, close it
      if (selectedTaskId === taskId) setSelectedTaskId(null);
    } catch {
      toast.error("Failed to delete task");
    }
  };

  // ---------- Task assignment ----------
  const handleAssign = async (taskId: string, assigneeId: string | null) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigneeId }),
      });
      if (!res.ok) throw new Error("Failed to assign task");
      await queryClient.invalidateQueries({ queryKey: ["board", boardId] });
      toast.success(assigneeId ? "Task assigned" : "Task unassigned");
    } catch {
      toast.error("Failed to assign task");
    }
  };

  // ---------- Loading states ----------
  if (sessionLoading || boardLoading) {
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

  if (!userId) {
    return <div className="p-6">Please log in to view this board.</div>;
  }

  return (
    <>
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-2 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {board?.title || "Board"}
        </div>
        <OnlineUsers workspaceId={workspaceId} userId={userId} />
      </div>

      {/* Board */}
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
              <Column
                column={column}
                boardId={boardId}
                members={members}
                onAssign={handleAssign}
                onTaskClick={(taskId: string) => setSelectedTaskId(taskId)}
                onDeleteTask={handleDeleteTask}
              />
            </motion.div>
          ))}
        </div>
        <DragOverlay dropAnimation={null}>
          {activeTask && (
            <TaskCard
              task={activeTask}
              isOverlay
              members={members}
              onAssign={handleAssign}
              onDelete={() => handleDeleteTask(activeTask.id)}
              onClick={() => setSelectedTaskId(activeTask.id)}
            />
          )}
        </DragOverlay>
      </DndContext>

      {/* Task Modal */}
      <TaskModal
        taskId={selectedTaskId}
        open={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        workspaceId={workspaceId}
        onDelete={handleDeleteTask}
        onAssign={handleAssign}
        members={members}
      />
    </>
  );
}
