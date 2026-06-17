"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Paperclip, Download, Trash } from "lucide-react";

export function TaskAttachments({ taskId }: { taskId: string }) {
  const queryClient = useQueryClient();
  const { data: attachments, isLoading } = useQuery({
    queryKey: ["attachments", taskId],
    queryFn: async () => {
      const res = await fetch(`/api/attachments?taskId=${taskId}`);
      if (!res.ok) throw new Error("Failed to fetch attachments");
      return res.json();
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("taskId", taskId);
      const res = await fetch("/api/attachments", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attachments", taskId] });
      toast.success("File uploaded");
    },
    onError: () => toast.error("Upload failed"),
  });

  if (isLoading) return <div>Loading attachments...</div>;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Input
          type="file"
          onChange={(e) => {
            if (e.target.files?.[0]) uploadMutation.mutate(e.target.files[0]);
            e.target.value = "";
          }}
        />
      </div>
      <div className="space-y-1">
        {attachments?.map((att: any) => (
          <div
            key={att.id}
            className="flex items-center justify-between text-sm p-2 border rounded"
          >
            <span className="truncate">{att.filename}</span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => window.open(att.fileUrl)}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        {!attachments?.length && (
          <p className="text-muted-foreground text-sm">No attachments</p>
        )}
      </div>
    </div>
  );
}
