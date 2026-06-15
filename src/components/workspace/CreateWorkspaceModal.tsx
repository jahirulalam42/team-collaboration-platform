"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Users, Globe, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  createWorkspaceSchema,
  type CreateWorkspaceInput,
} from "@/lib/validations/workspace";
import { useCreateWorkspace } from "@/hooks/useWorkspace";
import { generateSlug } from "@/lib/utils";

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
    formState: { errors, isDirty },
  } = useForm<CreateWorkspaceInput>({
    resolver: zodResolver(createWorkspaceSchema),
    defaultValues: { name: "", slug: "", description: "" },
  });

  const name = watch("name");

  useEffect(() => {
    if (name && !isDirty) {
      setValue("slug", generateSlug(name), { shouldValidate: true });
    }
  }, [name, setValue, isDirty]);

  const onSubmit = async (data: CreateWorkspaceInput) => {
    const workspace = await mutateAsync(data);
    reset();
    onSuccess?.(workspace.id);
    onClose();
  };

  // Reset on close
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      reset();
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Users className="h-5 w-5 text-primary" />
            Create a new workspace
          </DialogTitle>
          <DialogDescription>
            A workspace is where your team collaborates on projects, tasks, and
            documents.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Name field */}
          <div className="space-y-2">
            <Label htmlFor="name">Workspace name</Label>
            <Input
              id="name"
              placeholder="e.g., Acme Engineering"
              autoFocus
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Choose a name that represents your team or project.
            </p>
          </div>

          {/* Slug field */}
          <div className="space-y-2">
            <Label htmlFor="slug">URL slug</Label>
            <div className="flex">
              <span className="inline-flex items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">
                syncspace.app/
              </span>
              <Input
                id="slug"
                className="rounded-l-none"
                placeholder="acme-engineering"
                {...register("slug")}
              />
            </div>
            {errors.slug && (
              <p className="text-sm text-destructive">{errors.slug.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Used in your workspace URL. Only lowercase letters, numbers, and
              hyphens.
            </p>
          </div>

          {/* Description field */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              rows={3}
              placeholder="What is this workspace for?"
              {...register("description")}
            />
          </div>

          {/* Info box */}
          <div className="rounded-lg bg-muted/50 p-3 flex items-start gap-2 text-xs text-muted-foreground">
            <Info className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              You'll be the{" "}
              <Badge variant="secondary" className="mx-1 text-[10px]">
                Owner
              </Badge>{" "}
              of this workspace.
            </span>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="min-w-[100px]"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Globe className="mr-2 h-4 w-4" />
                  Create workspace
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
