import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TaskCardProps {
  task: { id: string; title: string; description?: string | null };
  isOverlay?: boolean;
  onDelete?: (taskId: string) => void;
}

export function TaskCard({ task, isOverlay = false, onDelete }: TaskCardProps) {
  return (
    <div
      className={`
        bg-white p-3 rounded shadow-sm border border-gray-200 
        ${isOverlay ? "shadow-lg rotate-2 scale-105" : "hover:shadow-md"}
        cursor-grab active:cursor-grabbing group
      `}
    >
      <div className="flex justify-between items-start">
        <h4 className="font-medium text-sm flex-1">{task.title}</h4>
        {!isOverlay && onDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation(); // prevent drag from triggering
              onDelete(task.id);
            }}
          >
            <Trash2 className="h-3 w-3 text-red-500" />
          </Button>
        )}
      </div>
      {task.description && (
        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
          {task.description}
        </p>
      )}
    </div>
  );
}
