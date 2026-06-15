"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateWorkspaceSchema } from "@/lib/validations/workspace";
import {
  useWorkspace,
  useUpdateWorkspace,
  useDeleteWorkspace,
} from "@/hooks/useWorkspace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { generateSlug } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce"; // create if missing

export default function WorkspaceSettingsPage() {
  const { workspaceId } = useParams();
  const router = useRouter();
  const { data, isLoading } = useWorkspace(workspaceId as string);
  const updateWorkspace = useUpdateWorkspace(workspaceId as string);
  const deleteWorkspace = useDeleteWorkspace();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty, isSubmitting },
  } = useForm({
    resolver: zodResolver(updateWorkspaceSchema),
    defaultValues: data?.workspace,
  });

  const name = watch("name");
  const slug = watch("slug");
  const debouncedName = useDebounce(name, 300);

  // Auto-generate slug if slug field hasn't been manually edited
  useEffect(() => {
    if (debouncedName && !slug) {
      setValue("slug", generateSlug(debouncedName), { shouldValidate: true });
    }
  }, [debouncedName, slug, setValue]);

  const onSubmit = async (values: any) => {
    try {
      await updateWorkspace.mutateAsync(values);
      toast.success("Workspace updated");
    } catch {
      toast.error("Failed to update workspace");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteWorkspace.mutateAsync(workspaceId as string);
      toast.success("Workspace deleted");
      router.push("/dashboard");
    } catch {
      toast.error("Failed to delete workspace");
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl py-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!data) return <div>Workspace not found</div>;
  const { workspace, currentUserRole } = data;
  const isOwner = currentUserRole === "OWNER";

  if (!isOwner) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>
            Only workspace owners can access settings.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-2xl py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Workspace Settings</CardTitle>
          <CardDescription>
            Update your workspace name, slug, or description.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...register("name")} />
              {errors.name && (
                <p className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug (URL)</Label>
              <div className="flex">
                <span className="inline-flex items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">
                  syncspace.app/
                </span>
                <Input
                  id="slug"
                  className="rounded-l-none"
                  {...register("slug")}
                />
              </div>
              {errors.slug && (
                <p className="text-sm text-destructive">
                  {errors.slug.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Used in your workspace URL. Only lowercase letters, numbers, and
                hyphens.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={3}
                {...register("description")}
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={!isDirty || isSubmitting}>
                {isSubmitting ? "Saving..." : "Save changes"}
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => setDeleteDialogOpen(true)}
              >
                Delete workspace
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete workspace</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              workspace "{workspace.name}" and all its boards, tasks, and member
              associations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
