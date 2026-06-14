// lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generates a URL-friendly slug from a string
 * Example: "My Workspace!" -> "my-workspace"
 */
export function generateSlug(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

/**
 * Returns a Date object for invite expiration (7 days from now)
 */
export function getInviteExpiry(): Date {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 7);
  return expiry;
}

/**
 * Determines if an actor can manage (change role/remove) a target member.
 * Role hierarchy: OWNER > ADMIN > MEMBER.
 * Returns true only if actor has strictly higher role than target.
 */
export function canManage(actorRole: string, targetRole: string): boolean {
  const hierarchy: Record<string, number> = { OWNER: 3, ADMIN: 2, MEMBER: 1 };
  return (hierarchy[actorRole] || 0) > (hierarchy[targetRole] || 0);
}
