// app/(dashboard)/profile/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

// Form schema (matches updateProfileSchema on backend)
const profileFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  bio: z.string().optional(),
  image: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: "",
      bio: "",
      image: "",
    },
  });

  // Fetch current profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/users/profile`);
        if (!res.ok) throw new Error("Failed to load profile");
        const data = await res.json();
        reset({
          name: data.user.name || "",
          bio: data.user.bio || "",
          image: data.user.image || "",
        });
      } catch (error) {
        toast.error("Could not load profile data.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [reset]);

  // Submit updated profile
  const onSubmit = async (values: ProfileFormValues) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      toast.success("Profile updated successfully.");
      reset(values);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground">Loading profile...</div>
      </div>
    );
  }

  const avatarUrl = watch("image");

  return (
    <div className="container max-w-2xl py-10">
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="flex flex-col space-y-1.5 p-6">
          <h3 className="text-2xl font-semibold leading-none tracking-tight">
            Profile Settings
          </h3>
          <p className="text-sm text-muted-foreground">
            Update your personal information and avatar.
          </p>
        </div>
        <div className="p-6 pt-0">
          <div className="flex items-center gap-6 mb-6">
            <div className="relative h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt={watch("name") || "Avatar"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-2xl font-bold text-primary">
                  {watch("name")?.charAt(0)?.toUpperCase() || "U"}
                </span>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Profile picture</p>
              <p className="text-xs text-muted-foreground">
                Enter a URL for your avatar image.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                Name
              </label>
              <input
                id="name"
                type="text"
                {...register("name")}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              {errors.name && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="bio" className="block text-sm font-medium mb-1">
                Bio
              </label>
              <textarea
                id="bio"
                rows={4}
                {...register("bio")}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                placeholder="Tell us a little about yourself"
              />
              {errors.bio && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.bio.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="image" className="block text-sm font-medium mb-1">
                Avatar URL
              </label>
              <input
                id="image"
                type="url"
                {...register("image")}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="https://example.com/avatar.jpg"
              />
              {errors.image && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.image.message}
                </p>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              >
                {submitting ? "Saving..." : "Save changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
