import { Trash2, Calendar, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    description?: string | null;
    dueDate?: string | null;
    assignee?: { name: string; image?: string } | null;
  };
  isOverlay?: boolean;
  onDelete?: (taskId: string) => void;
}

export function TaskCard({ task, isOverlay = false, onDelete }: TaskCardProps) {
  return (
    <Card
      className={`
        group cursor-grab active:cursor-grabbing
        ${isOverlay ? "shadow-lg rotate-1 scale-105" : "hover:shadow-md"}
        transition-all
      `}
    >
      <CardContent className="p-3">
        <div className="flex justify-between items-start gap-2">
          <h4 className="font-medium text-sm flex-1">{task.title}</h4>
          {!isOverlay && onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(task.id);
              }}
            >
              <Trash2 className="h-3 w-3 text-destructive" />
            </Button>
          )}
        </div>

        {task.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {task.description}
          </p>
        )}

        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
          {task.dueDate && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{new Date(task.dueDate).toLocaleDateString()}</span>
            </div>
          )}
          {task.assignee && (
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>{task.assignee.name}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
