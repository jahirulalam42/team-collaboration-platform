"use client";

import { z } from "zod";
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
import { useState } from "react";
import { generateSlug } from "@/lib/utils";

export default function WorkspaceSettingsPage() {
  const { workspaceId } = useParams();
  const router = useRouter();
  const { data, isLoading } = useWorkspace(workspaceId as string);
  const updateWorkspace = useUpdateWorkspace(workspaceId as string);
  const deleteWorkspace = useDeleteWorkspace();
  const [isDeleting, setIsDeleting] = useState(false);

  type UpdateWorkspaceForm = z.infer<typeof updateWorkspaceSchema>;
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UpdateWorkspaceForm>({
    resolver: zodResolver(updateWorkspaceSchema),
    defaultValues: data?.workspace,
  });

  const name = watch("name");
  const slug = watch("slug");

  if (isLoading)
    return <div className="flex justify-center p-8">Loading...</div>;
  if (!data) return <div>Not found</div>;

  const onSubmit = async (values: any) => {
    await updateWorkspace.mutateAsync(values);
  };

  const handleDelete = async () => {
    if (
      confirm(
        "Are you sure? This will permanently delete the workspace and all its data."
      )
    ) {
      setIsDeleting(true);
      await deleteWorkspace.mutateAsync(workspaceId as string);
      router.push("/dashboard");
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
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
              <Input
                id="name"
                {...register("name")}
                onChange={(e) => {
                  setValue("name", e.target.value);
                  if (!slug) setValue("slug", generateSlug(e.target.value));
                }}
              />
              {errors.name && (
                <p className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug (URL)</Label>
              <div className="flex">
                <span className="inline-flex items-center rounded-l-md border border-r-0 bg-muted px-3 text-sm">
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
              <Button type="submit" disabled={updateWorkspace.isPending}>
                Save changes
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                Delete workspace
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
