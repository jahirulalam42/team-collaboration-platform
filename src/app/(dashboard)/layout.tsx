"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, LayoutDashboard, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { fetchSession, logout } from "@/app/store/slices/sessionSlice";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { data: session, loading } = useAppSelector((state) => state.session);

  // Fetch session on mount
  useEffect(() => {
    dispatch(fetchSession());
  }, [dispatch]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !session) {
      router.push("/login");
    }
  }, [session, loading, router]);

  const handleLogout = async () => {
    await dispatch(logout());
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!session) return null;

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Profile", href: "/profile", icon: User },
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform bg-card border-r transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-14 items-center justify-between px-4 border-b">
            <Link href="/dashboard" className="font-bold text-xl">
              SyncSpace
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <nav className="flex-1 space-y-1 p-3">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            ))}
          </nav>
          <div className="border-t p-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={session.user?.image ?? undefined} />
                <AvatarFallback>
                  {session.user?.name?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 truncate">
                <p className="text-sm font-medium">{session.user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {session.user?.email}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b px-4 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Link href="/dashboard" className="font-bold text-lg">
            SyncSpace
          </Link>
          <div className="w-8" />
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
