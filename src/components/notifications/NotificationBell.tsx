"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import {
  selectUnreadCount,
  fetchNotifications,
  markAsRead,
  markAllAsRead,
} from "@/app/store/slices/notificationSlice";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

export function NotificationBell() {
  const dispatch = useAppDispatch();
  const unreadCount = useAppSelector(selectUnreadCount);
  const notifications = useAppSelector((state) => state.notifications.items);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchNotifications(30));
  }, [dispatch]);

  const handleMarkAsRead = (id: string) => {
    dispatch(markAsRead(id));
  };

  const handleMarkAllRead = () => {
    dispatch(markAllAsRead());
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b px-4 py-2">
          <span className="font-semibold">Notifications</span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No notifications
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`flex items-start gap-3 px-4 py-2 hover:bg-muted/50 border-b last:border-0 ${
                  !notif.read ? "bg-primary/5" : ""
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{notif.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {notif.message}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(notif.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                  {notif.link && (
                    <Link
                      href={notif.link}
                      className="text-xs text-primary hover:underline"
                      onClick={() => {
                        if (!notif.read) handleMarkAsRead(notif.id);
                        setOpen(false);
                      }}
                    >
                      View →
                    </Link>
                  )}
                </div>
                {!notif.read && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 shrink-0"
                    onClick={() => handleMarkAsRead(notif.id)}
                  >
                    <span className="h-2 w-2 rounded-full bg-primary" />
                  </Button>
                )}
              </div>
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
