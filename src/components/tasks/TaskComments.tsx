"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAppSelector } from "@/app/store/hooks";

export function TaskComments({ taskId }: { taskId: string }) {
  const [content, setContent] = useState("");
  const queryClient = useQueryClient();
  const { data: session } = useAppSelector((state) => state.session);
  const userId = session?.user?.id;

  const { data: comments, isLoading } = useQuery({
    queryKey: ["comments", taskId],
    queryFn: async () => {
      const res = await fetch(`/api/comments?taskId=${taskId}`);
      if (!res.ok) throw new Error("Failed to fetch comments");
      return res.json();
    },
  });

  const createComment = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, taskId }),
      });
      if (!res.ok) throw new Error("Failed to post comment");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", taskId] });
      setContent("");
      toast.success("Comment added");
    },
    onError: () => toast.error("Failed to add comment"),
  });

  if (isLoading) return <div>Loading comments...</div>;

  return (
    <div className="space-y-4">
      <div className="space-y-4 max-h-60 overflow-y-auto">
        {comments?.map((comment: any) => (
          <div key={comment.id} className="flex items-start gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={comment.user.image} />
              <AvatarFallback>{comment.user.name?.[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{comment.user.name}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
              {/* Replies would go here */}
            </div>
          </div>
        ))}
        {!comments?.length && (
          <p className="text-muted-foreground text-sm">No comments yet.</p>
        )}
      </div>

      <div className="flex gap-2 items-start">
        <Textarea
          placeholder="Write a comment..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="flex-1"
        />
        <Button
          onClick={() => createComment.mutate(content)}
          disabled={!content.trim() || createComment.isPending}
        >
          Post
        </Button>
      </div>
    </div>
  );
}
