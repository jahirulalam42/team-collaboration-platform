// components/kanban/Column.tsx
import { Key, useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableTask } from "./SortableTask";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";

export function Column({ column, boardId }: any) {
  const { setNodeRef } = useDroppable({
    id: column.id,
    data: { columnId: column.id },
  });
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) return;

    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newTaskTitle,
        columnId: column.id,
        boardId: boardId,
      }),
    });

    if (res.ok) {
      setNewTaskTitle("");
      setIsAdding(false);
      // Refetch board data (or update cache optimistically)
      window.location.reload(); // quick refresh; later use React Query cache update
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (confirm("Delete this task?")) {
      const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      if (res.ok) {
        // Refetch board data or update cache
        window.location.reload(); // quick demo; later use React Query invalidate
      }
    }
  };

  return (
    <div ref={setNodeRef} className="w-80 bg-gray-100 rounded p-3">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold">{column.title}</h3>
        <Button size="sm" variant="ghost" onClick={() => setIsAdding(true)}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <SortableContext
        items={column.tasks?.map((t: { id: any }) => t.id) || []}
        strategy={verticalListSortingStrategy}
      >
        {column.tasks?.map((task: any) => (
          <SortableTask key={task.id} task={task} onDelete={handleDeleteTask} />
        ))}
      </SortableContext>

      {isAdding && (
        <div className="mt-2">
          <Input
            autoFocus
            placeholder="Task title..."
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreateTask();
              if (e.key === "Escape") setIsAdding(false);
            }}
            className="mb-2"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleCreateTask}>
              Add
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsAdding(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
