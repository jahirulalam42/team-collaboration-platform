// lib/validations/user.ts
import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be under 50 characters")
    .optional(),
  bio: z.string().max(160, "Bio must be under 160 characters").optional(),
  image: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
