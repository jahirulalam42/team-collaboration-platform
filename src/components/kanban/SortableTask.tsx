"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TaskCard } from "./TaskCard";

interface SortableTaskProps {
  task: any;
  onDelete: (taskId: string) => void;
  members?: any[];
  onAssign?: (taskId: string, assigneeId: string | null) => void;
  onClick?: (taskId: string) => void;
}

export function SortableTask({
  task,
  onDelete,
  members,
  onAssign,
  onClick,
}: SortableTaskProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: "Task",
      task,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="mt-2 w-full" // Ensures full width and consistent spacing
    >
      <TaskCard
        task={task}
        onDelete={onDelete}
        members={members}
        onAssign={onAssign}
        onClick={onClick}
      />
    </div>
  );
}
