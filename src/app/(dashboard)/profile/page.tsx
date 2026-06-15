"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Calendar,
  Save,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const profileFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name is too long"),
  bio: z.string().max(500, "Bio must be 500 characters or less").optional(),
  image: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userSince, setUserSince] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { name: "", bio: "", image: "" },
  });

  useEffect(() => {
    fetch("/api/users/profile")
      .then((res) => res.json())
      .then((data) => {
        reset({
          name: data.user.name || "",
          bio: data.user.bio || "",
          image: data.user.image || "",
        });
        setUserEmail(data.user.email);
        setUserSince(data.user.createdAt);
      })
      .catch(() => toast.error("Could not load profile"))
      .finally(() => setLoading(false));
  }, [reset]);

  const onSubmit = async (values: ProfileFormValues) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success("Profile updated successfully");
      reset(values); // Reset dirty state
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-1" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const avatarUrl = watch("image");
  const nameValue = watch("name");

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-auto max-w-3xl space-y-6"
    >
      <Card className="border-0 shadow-sm">
        <CardHeader className="border-b bg-gradient-to-r from-primary/5 via-transparent to-transparent">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Profile Settings</CardTitle>
              <CardDescription className="mt-1">
                Manage your personal information and how others see you
              </CardDescription>
            </div>
            <Badge variant="outline" className="gap-1">
              <User className="h-3 w-3" />
              Member
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-8 pt-6">
          {/* Avatar section with real-time preview */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pb-4 border-b">
            <div className="relative">
              <Avatar className="h-24 w-24 ring-4 ring-primary/10 shadow-md transition-all group-hover:ring-primary/20">
                <AvatarImage
                  src={avatarUrl}
                  alt={nameValue}
                  className="object-cover"
                />
                <AvatarFallback className="text-3xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary">
                  {nameValue?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 rounded-full bg-primary p-1 shadow-sm">
                <Camera className="h-3 w-3 text-primary-foreground" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium">Profile picture</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Enter a public image URL (e.g., from Gravatar, GitHub, or Imgur)
              </p>
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 mt-1 text-xs"
                onClick={() =>
                  window.open(
                    "https://en.gravatar.com/support/what-is-gravatar/",
                    "_blank"
                  )
                }
              >
                What's a good avatar URL?
                <ExternalLink className="ml-1 h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* User info metadata */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Email:</span>
              <span className="font-medium">{userEmail}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Member since:</span>
              <span className="font-medium">
                {userSince ? new Date(userSince).toLocaleDateString() : "—"}
              </span>
            </div>
          </div>

          <Separator />

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-semibold">
                Full name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                {...register("name")}
                className={errors.name ? "border-destructive" : ""}
                placeholder="Your display name"
              />
              {errors.name && (
                <p className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio" className="text-sm font-semibold">
                Bio
              </Label>
              <Textarea
                id="bio"
                rows={4}
                {...register("bio")}
                placeholder="Tell your team a bit about yourself..."
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Brief description visible to your team members. Max 500
                characters.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image" className="text-sm font-semibold">
                Avatar URL
              </Label>
              <div className="flex gap-2">
                <Input
                  id="image"
                  placeholder="https://example.com/avatar.jpg"
                  {...register("image")}
                  className={errors.image ? "border-destructive" : ""}
                />
                {avatarUrl && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => window.open(avatarUrl, "_blank")}
                    className="shrink-0"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {errors.image && (
                <p className="text-sm text-destructive">
                  {errors.image.message}
                </p>
              )}
            </div>

            <CardFooter className="px-0 pb-0 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => reset()}
                disabled={!isDirty || submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting || !isDirty}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save changes
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Missing Camera icon (add if not imported)
const Camera = (props: any) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
    <circle cx="12" cy="13" r="3" />
  </svg>
);
