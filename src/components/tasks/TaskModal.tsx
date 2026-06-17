"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TaskComments } from "@/components/tasks/TaskComments";
import { TaskAttachments } from "@/components/tasks/TaskAttachments";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, FileText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface TaskModalProps {
  taskId: string | null;
  open: boolean;
  onClose: () => void;
  workspaceId: string; // ✅ add this
  onDelete?: (taskId: string) => void;
  onAssign?: (taskId: string, assigneeId: string | null) => void;
  members?: any[];
}

export function TaskModal({
  taskId,
  open,
  onClose,
  workspaceId,
  onDelete,
  onAssign,
  members,
}: TaskModalProps) {
  const { data: task, isLoading } = useQuery({
    queryKey: ["task", taskId],
    queryFn: async () => {
      if (!taskId) return null;
      const res = await fetch(`/api/tasks/${taskId}`);
      if (!res.ok) throw new Error("Failed to fetch task");
      return res.json();
    },
    enabled: !!taskId && open,
  });

  if (!taskId) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{task?.title || "Loading..."}</span>
            {onDelete && taskId && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => {
                  onDelete(taskId);
                  onClose();
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div>Loading task details...</div>
        ) : (
          <div className="space-y-4">
            {/* Task details */}
            <div className="flex flex-wrap gap-2">
              {task?.assignee && (
                <Badge variant="outline" className="gap-1">
                  <User className="h-3 w-3" /> {task.assignee.name}
                </Badge>
              )}
              {task?.dueDate && (
                <Badge variant="outline" className="gap-1">
                  <Calendar className="h-3 w-3" />{" "}
                  {new Date(task.dueDate).toLocaleDateString()}
                </Badge>
              )}
            </div>
            {task?.description && (
              <div className="text-sm whitespace-pre-wrap">
                {task.description}
              </div>
            )}

            {/* Attachments */}
            <TaskAttachments taskId={taskId} />

            {/* Comments */}
            <div>
              <h4 className="font-semibold mb-2">Comments</h4>
              <TaskComments taskId={taskId} />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
