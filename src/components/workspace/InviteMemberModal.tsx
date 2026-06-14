// components/workspace/InviteMemberModal.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Loader2, Mail } from "lucide-react";
import { inviteMemberSchema, type InviteMemberInput } from "@/lib/validations/workspace";
import { useInviteMember } from "@/hooks/useWorkspace";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  workspaceId: string;
  workspaceName: string;
}

export function InviteMemberModal({ open, onClose, workspaceId, workspaceName }: Props) {
  const { mutateAsync, isPending } = useInviteMember(workspaceId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteMemberInput>({ resolver: zodResolver(inviteMemberSchema) });

  const onSubmit = async (data: InviteMemberInput) => {
    await mutateAsync(data);
    reset();
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-semibold">Invite member</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Invite someone to <span className="font-medium text-foreground">{workspaceName}</span>
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Email address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="email"
                placeholder="colleague@company.com"
                autoFocus
                className={cn(
                  "flex h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:ring-2 focus:ring-ring",
                  errors.email ? "border-destructive" : "border-border"
                )}
                {...register("email")}
              />
            </div>
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Role</label>
            <select
              className="flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition-colors focus:ring-2 focus:ring-ring"
              {...register("role")}
            >
              <option value="MEMBER">Member — can view and edit boards</option>
              <option value="ADMIN">Admin — can manage members and settings</option>
            </select>
          </div>

          <div className="rounded-lg bg-muted/50 px-4 py-3 text-xs text-muted-foreground">
            The invite link expires in <span className="font-medium text-foreground">7 days</span>.
            The recipient must have or create a SyncSpace account.
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex h-10 flex-1 items-center justify-center rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isPending} className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors">
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isPending ? "Sending…" : "Send invite"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
