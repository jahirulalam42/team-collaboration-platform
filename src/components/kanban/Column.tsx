"use client";

import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useQueryClient } from "@tanstack/react-query";
import { SortableTask } from "./SortableTask";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, X, LayoutList } from "lucide-react";
import { toast } from "sonner";

export function Column({
  column,
  boardId,
  members,
  onAssign,
  onTaskClick,
}: any) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { type: "Column", columnId: column.id },
  });

  const [isAdding, setIsAdding] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const queryClient = useQueryClient();

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) return;
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTaskTitle,
          columnId: column.id,
          boardId,
        }),
      });
      if (!res.ok) throw new Error();
      await queryClient.invalidateQueries({ queryKey: ["board", boardId] });
      setNewTaskTitle("");
      setIsAdding(false);
      toast.success("Task created");
    } catch {
      toast.error("Failed to create task");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      await queryClient.invalidateQueries({ queryKey: ["board", boardId] });
      toast.success("Task deleted");
    } catch {
      toast.error("Failed to delete task");
    }
  };

  return (
    <Card
      ref={setNodeRef}
      className={`w-72 shrink-0 flex flex-col max-h-[calc(100vh-160px)] min-h-[280px] bg-muted/30 border-muted transition-colors overflow-hidden ${
        isOver ? "border-primary/40 bg-primary/5" : ""
      }`}
    >
      <CardHeader className="pb-2 pt-3 px-3 flex-row items-center justify-between space-y-0 bg-muted/50 border-b border-muted">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-semibold tracking-tight">
            {column.title}
          </CardTitle>
          <Badge
            variant="secondary"
            className="h-5 text-[11px] font-medium rounded-md"
          >
            {column.tasks?.length || 0}
          </Badge>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setIsAdding(!isAdding)}
          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
        >
          {isAdding ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </Button>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto px-3 pb-3 pt-2">
        <SortableContext
          items={column.tasks?.map((t: any) => t.id) || []}
          strategy={verticalListSortingStrategy}
        >
          {column.tasks?.map((task: any) => (
            <SortableTask
              key={task.id}
              task={task}
              onDelete={handleDeleteTask}
              members={members}
              onAssign={onAssign}
              onClick={onTaskClick}
            />
          ))}
        </SortableContext>

        {column.tasks?.length === 0 && !isAdding && (
          <div className="flex flex-col items-center justify-center h-full text-xs text-muted-foreground/60 py-8 border border-dashed border-muted-foreground/20 rounded-md mt-2">
            <LayoutList className="h-6 w-6 mb-2 text-muted-foreground/40" />
            Drop tasks here
          </div>
        )}

        {isAdding && (
          <div className="mt-2 space-y-2 bg-background p-2 rounded-md border border-primary/20 shadow-sm">
            <Input
              autoFocus
              placeholder="Task title..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateTask();
                if (e.key === "Escape") setIsAdding(false);
              }}
              className="h-8 text-sm"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                className="h-7 text-xs shadow-sm gap-1"
                onClick={handleCreateTask}
              >
                <Plus className="h-3 w-3" /> Add
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                onClick={() => setIsAdding(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
