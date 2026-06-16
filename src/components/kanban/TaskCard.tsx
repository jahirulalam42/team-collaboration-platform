"use client";

import { Trash2, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
        w-full group cursor-grab active:cursor-grabbing
        ${
          isOverlay
            ? "shadow-2xl ring-2 ring-primary/20 scale-[1.02] rotate-1"
            : "hover:shadow-md hover:border-primary/30"
        }
        transition-all duration-200 bg-background
      `}
    >
      <CardContent className="p-3">
        <div className="flex justify-between items-start gap-2">
          <h4 className="font-medium text-sm flex-1 leading-tight">
            {task.title}
          </h4>
          {!isOverlay && onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(task.id);
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {task.description && (
          <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
            {task.description}
          </p>
        )}

        {(task.dueDate || task.assignee) && (
          <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
            {task.dueDate && (
              <Badge
                variant="outline"
                className="font-normal gap-1.5 text-[11px] px-1.5 py-0"
              >
                <Calendar className="h-3 w-3" />
                {new Date(task.dueDate).toLocaleDateString()}
              </Badge>
            )}

            {task.assignee && (
              <div className="flex items-center gap-1.5 ml-auto">
                <span className="text-[11px] font-medium">
                  {task.assignee.name}
                </span>
                <Avatar className="h-5 w-5 ring-1 ring-background">
                  <AvatarImage
                    src={task.assignee.image}
                    alt={task.assignee.name}
                  />
                  <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                    {task.assignee.name?.[0]?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
