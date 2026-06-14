// components/workspace/CreateWorkspaceModal.tsx
"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Loader2 } from "lucide-react";
import { createWorkspaceSchema, type CreateWorkspaceInput } from "@/lib/validations/workspace";
import { useCreateWorkspace } from "@/hooks/useWorkspace";
import { generateSlug, cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess?: (workspaceId: string) => void;
}

export function CreateWorkspaceModal({ open, onClose, onSuccess }: Props) {
  const { mutateAsync, isPending } = useCreateWorkspace();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateWorkspaceInput>({ resolver: zodResolver(createWorkspaceSchema) });

  const name = watch("name", "");

  // Auto-populate slug from name
  useEffect(() => {
    if (name) setValue("slug", generateSlug(name));
  }, [name, setValue]);

  const onSubmit = async (data: CreateWorkspaceInput) => {
    const workspace = await mutateAsync(data);
    reset();
    onSuccess?.(workspace.id);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-semibold">Create workspace</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              A workspace is a shared space for your team
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Workspace name</label>
            <input
              type="text"
              placeholder="Acme Engineering"
              autoFocus
              className={cn(
                "flex h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:ring-2 focus:ring-ring",
                errors.name ? "border-destructive" : "border-border"
              )}
              {...register("name")}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">URL slug</label>
            <div className="flex items-center gap-0">
              <span className="flex h-10 items-center rounded-l-lg border border-r-0 border-border bg-muted px-3 text-sm text-muted-foreground">
                syncspace.app/
              </span>
              <input
                type="text"
                placeholder="acme-engineering"
                className={cn(
                  "flex h-10 flex-1 rounded-r-lg border bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:ring-2 focus:ring-ring",
                  errors.slug ? "border-destructive" : "border-border"
                )}
                {...register("slug")}
              />
            </div>
            {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Description{" "}
              <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="What does this workspace do?"
              className="flex w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:ring-2 focus:ring-ring resize-none"
              {...register("description")}
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 flex-1 items-center justify-center rounded-lg border border-border text-sm font-medium transition-colors hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isPending ? "Creating…" : "Create workspace"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
