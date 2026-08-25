"use client";

import Image from "next/image";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, User } from "lucide-react";
import { NotificationBell } from "@/components/notifications/notification-bell";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/leads": "Leads",
  "/dashboard/customers": "Customers",
  "/dashboard/bookings": "Bookings",
  "/dashboard/payments": "Payments",
  "/dashboard/campaigns": "Campaigns",
  "/dashboard/messages": "Messages",
  "/dashboard/reports": "Reports",
  "/dashboard/users": "Users",
  "/dashboard/settings": "Settings",
  "/dashboard/follow-ups": "Follow-ups",
  "/dashboard/audit": "Audit Log",
  "/dashboard/roles": "Roles",
};

interface HeaderProps {
  user?: {
    name?: string | null;
    email?: string | null;
  } | null;
  onMobileMenuToggle?: () => void;
}

export function Header({ user, onMobileMenuToggle }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const title = pageTitles[pathname] || "Bayview Village";

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "U";

  return (
    <header className="glass-strong sticky top-0 z-30 flex h-[68px] items-center justify-between border-b border-zinc-200/60 px-4 sm:px-6 dark:border-white/5">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden h-8 w-8 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-white/5"
          onClick={onMobileMenuToggle}
          aria-label="Toggle navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="lg:hidden flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="Bayview Village Logo"
            width={100}
            height={32}
            className="h-7 w-auto object-contain"
          />
        </div>
        <h1 className="text-[15px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-2">
        <NotificationBell />
        <DropdownMenu>
          <DropdownMenuTrigger className="focus:outline-none">
            <div className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition-colors hover:bg-zinc-100 dark:hover:bg-white/5">
              <Avatar className="h-8 w-8 border-2 border-amber-400/40 shadow-sm">
                <AvatarFallback className="bg-gradient-to-br from-amber-400 to-amber-600 text-white font-bold text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:flex flex-col items-start">
                <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100 leading-tight">{user?.name || "User"}</span>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-tight">{user?.email}</span>
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 border-zinc-200/80 dark:border-white/10 shadow-elevated">
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{user?.name || "User"}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-zinc-200/60 dark:bg-white/10" />
              <DropdownMenuItem
                className="cursor-pointer rounded-lg px-2 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-white/5"
                onClick={() => router.push("/dashboard/settings")}
              >
                <User className="mr-2 h-4 w-4 text-zinc-500" />
                Profile & Settings
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-zinc-200/60 dark:bg-white/10" />
              <DropdownMenuItem
                className="cursor-pointer rounded-lg px-2 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50"
                onClick={() => signOut({ callbackUrl: "/auth/login" })}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}


