"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  LayoutDashboard,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Home,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { fetchSession, logout } from "@/app/store/slices/sessionSlice";
import { Skeleton } from "@/components/ui/skeleton";
import { NotificationListener } from "@/components/notifications/NotificationListener";
import { GlobalOnlineProvider } from "@/components/sockets/GlobalOnlineProvider";
import { SearchDialog } from "@/components/search/SearchDialog";

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { data: session, loading } = useAppSelector((state) => state.session);
  // onlineUsersSlice shape: Record<workspaceId, string[]>
  const onlineUsersMap = useAppSelector((state) => state.onlineUsers);
  const allOnlineUserIds = new Set<string>();
  Object.values(onlineUsersMap).forEach((userIds) => {
    userIds.forEach((id) => allOnlineUserIds.add(id));
  });
  const totalOnline = allOnlineUserIds.size;

  const match = pathname.match(/^\/workspace\/([^\/]+)/);
  const workspaceId = match ? match[1] : "";

  useEffect(() => {
    dispatch(fetchSession());
  }, [dispatch]);

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
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Profile", href: "/profile", icon: User },
  ];

  const NavLinks = ({ collapsed = false, onItemClick = () => {} }) => (
    <nav className="flex-1 space-y-1 p-3">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <TooltipProvider key={item.href} delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  onClick={onItemClick}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary/10 text-primary shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    collapsed && "justify-center px-2"
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-5 w-5 shrink-0",
                      isActive && "text-primary"
                    )}
                  />
                  {!collapsed && <span>{item.name}</span>}
                </Link>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right" className="text-xs">
                  {item.name}
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </nav>
  );

  const UserSection = ({ collapsed = false }) => (
    <div className={cn("border-t p-3", collapsed && "p-2")}>
      <div
        className={cn("flex items-center gap-3", collapsed && "justify-center")}
      >
        {/* Avatar with online indicator ring */}
        <div className="relative shrink-0">
          <Avatar className="h-8 w-8 ring-2 ring-primary/10">
            <AvatarImage src={session.user?.image ?? undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {session.user?.name?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          {/* Online dot */}
          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
        </div>
        {!collapsed && (
          <div className="flex-1 truncate">
            <p className="text-sm font-medium leading-none">
              {session.user?.name}
            </p>
            <p className="mt-1 text-xs text-muted-foreground truncate">
              {session.user?.email}
            </p>
          </div>
        )}
        {!collapsed && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Sign out</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );

  // Online presence pill shown in sidebar footer (expanded only)
  const OnlinePill = ({ collapsed = false }) => {
    if (collapsed || totalOnline === 0) return null;
    return (
      <div className="px-3 pb-2">
        <div className="flex items-center gap-2 rounded-lg bg-emerald-500/8 border border-emerald-500/15 px-3 py-2">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
            {totalOnline} member{totalOnline !== 1 ? "s" : ""} online
          </span>
        </div>
      </div>
    );
  };

  const currentPageName =
    navItems.find((item) => item.href === pathname)?.name || "Dashboard";

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex lg:flex-col border-r bg-card/50 backdrop-blur-sm transition-all duration-300",
          sidebarCollapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo row */}
        <div className="flex h-14 items-center justify-between px-3 border-b shrink-0">
          {!sidebarCollapsed && (
            <Link
              href="/dashboard"
              className="font-bold text-xl bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent"
            >
              SyncSpace
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "ml-auto h-8 w-8 shrink-0",
              sidebarCollapsed && "mx-auto"
            )}
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        <NavLinks collapsed={sidebarCollapsed} />
        <OnlinePill collapsed={sidebarCollapsed} />
        <UserSection collapsed={sidebarCollapsed} />
      </aside>

      {/* Mobile Sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden fixed left-4 top-3 z-50 h-9 w-9"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <div className="flex h-full flex-col">
            <div className="flex h-14 items-center border-b px-4">
              <Link href="/dashboard" className="font-bold text-xl">
                SyncSpace
              </Link>
            </div>
            <NavLinks onItemClick={() => setMobileOpen(false)} />
            {/* Online pill in mobile sheet */}
            {totalOnline > 0 && (
              <div className="px-3 pb-2">
                <div className="flex items-center gap-2 rounded-lg bg-emerald-500/8 border border-emerald-500/15 px-3 py-2">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                    {totalOnline} member{totalOnline !== 1 ? "s" : ""} online
                  </span>
                </div>
              </div>
            )}
            <UserSection />
          </div>
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:px-6 shrink-0">
          <div className="flex items-center gap-2">
            {/* Spacer for mobile hamburger */}
            <div className="lg:hidden w-9" />
            <h1 className="text-sm font-semibold text-muted-foreground">
              {currentPageName}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {/* Live presence chip in header */}
            {totalOnline > 0 && (
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-500/10 rounded-full px-3 py-1">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                </span>
                {totalOnline} online
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
              asChild
            >
              <Link href="/dashboard">
                <Home className="h-4 w-4" />
              </Link>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
        <NotificationListener />
        <GlobalOnlineProvider />
        <SearchDialog
          open={searchOpen}
          onClose={() => setSearchOpen(false)}
          workspaceId={workspaceId}
        />
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayoutInner>{children}</DashboardLayoutInner>;
}
