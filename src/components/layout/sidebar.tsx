"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Settings,
  ChevronLeft,
  UserPlus,
  CalendarCheck,
  CreditCard,
  Megaphone,
  MessageSquare,
  UserCog,
  Clock,
  Shield,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavItem {
  title: string;
  href: string;
  icon: typeof LayoutDashboard;
  permission: string;
}

const topNavItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, permission: "" },
];

const crmNavItems: NavItem[] = [
  { title: "Leads", href: "/dashboard/leads", icon: UserPlus, permission: "leads.view" },
  { title: "Customers", href: "/dashboard/customers", icon: Users, permission: "customers.view" },
  { title: "Follow-ups", href: "/dashboard/follow-ups", icon: Clock, permission: "followUps.view" },
  { title: "Bookings", href: "/dashboard/bookings", icon: CalendarCheck, permission: "bookings.view" },
  { title: "Payments", href: "/dashboard/payments", icon: CreditCard, permission: "payments.view" },
];

const marketingNavItems: NavItem[] = [
  { title: "Campaigns", href: "/dashboard/campaigns", icon: Megaphone, permission: "campaigns.view" },
  { title: "Messages", href: "/dashboard/messages", icon: MessageSquare, permission: "messages.view" },
  { title: "Bulk Message", href: "/dashboard/messages/bulk", icon: Send, permission: "messages.create" },
];

const systemNavItems: NavItem[] = [
  { title: "Reports", href: "/dashboard/reports", icon: BarChart3, permission: "reports.view" },
  { title: "Audit Log", href: "/dashboard/audit", icon: Shield, permission: "audit.view" },
  { title: "Users", href: "/dashboard/users", icon: UserCog, permission: "users.view" },
  { title: "Roles", href: "/dashboard/roles", icon: Shield, permission: "roles.view" },
  { title: "Settings", href: "/dashboard/settings", icon: Settings, permission: "settings.view" },
];

interface SidebarNavGroupProps {
  items: NavItem[];
  pathname: string;
  collapsed: boolean;
  permissions: string[];
}

function SidebarNavGroup({ items, pathname, collapsed, permissions }: SidebarNavGroupProps) {
  const visibleItems = items.filter(
    (item) => !item.permission || permissions.includes(item.permission)
  );

  if (visibleItems.length === 0) return null;

  return (
    <div className="space-y-0.5">
      {visibleItems.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-gradient-to-r from-amber-500/15 to-amber-500/5 text-amber-800 dark:from-amber-400/20 dark:to-amber-400/5 dark:text-amber-200 font-semibold"
                : "text-zinc-500 hover:bg-zinc-100/80 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-zinc-100"
            )}
            title={collapsed ? item.title : undefined}
          >
            {isActive && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-gradient-to-b from-amber-400 to-amber-600" />
            )}
            <item.icon
              className={cn(
                "h-[18px] w-[18px] shrink-0 transition-colors duration-200",
                isActive
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300"
              )}
            />
            {!collapsed && <span>{item.title}</span>}
          </Link>
        );
      })}
    </div>
  );
}

function SectionLabel({ collapsed, children }: { collapsed: boolean; children: React.ReactNode }) {
  if (collapsed) return null;
  return (
    <p className="px-3 pt-5 pb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500">
      {children}
    </p>
  );
}

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
  permissions?: string[];
}

export function Sidebar({ collapsed = false, onToggle, permissions = [] }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-zinc-200/80 bg-white/60 dark:bg-zinc-950/60 dark:border-white/5 transition-all duration-300 ease-in-out",
        collapsed ? "w-[68px]" : "w-[260px]"
      )}
    >
      <div className="flex h-[68px] items-center justify-between border-b border-zinc-200/80 dark:border-white/5 px-4">
        {!collapsed ? (
          <Link href="/dashboard" className="flex items-center gap-2.5 overflow-hidden py-1 transition-opacity hover:opacity-80">
            <Image
              src="/logo.png"
              alt="Bayview Village Logo"
              width={140}
              height={44}
              className="h-10 w-auto object-contain shrink-0"
              priority
            />
          </Link>
        ) : (
          <Link href="/dashboard" className="mx-auto py-1 transition-opacity hover:opacity-80">
            <Image
              src="/logo.png"
              alt="Bayview Village Logo"
              width={36}
              height={36}
              className="h-8 w-8 object-contain"
              priority
            />
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className={cn(
            "h-7 w-7 shrink-0 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:text-zinc-300 dark:hover:bg-white/5 transition-all duration-200",
            collapsed && "mx-auto"
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft
            className={cn(
              "h-4 w-4 transition-transform duration-300",
              collapsed && "rotate-180"
            )}
          />
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <SidebarNavGroup items={topNavItems} pathname={pathname} collapsed={collapsed} permissions={permissions} />

        <SectionLabel collapsed={collapsed}>CRM</SectionLabel>
        <SidebarNavGroup items={crmNavItems} pathname={pathname} collapsed={collapsed} permissions={permissions} />

        <SectionLabel collapsed={collapsed}>Marketing</SectionLabel>
        <SidebarNavGroup items={marketingNavItems} pathname={pathname} collapsed={collapsed} permissions={permissions} />

        <SectionLabel collapsed={collapsed}>System</SectionLabel>
        <SidebarNavGroup items={systemNavItems} pathname={pathname} collapsed={collapsed} permissions={permissions} />
      </nav>

      {!collapsed && (
        <div className="border-t border-zinc-200/80 dark:border-white/5 p-4">
          <div className="rounded-xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent p-3 dark:from-amber-400/10 dark:via-amber-400/5">
            <p className="text-xs font-medium text-amber-800 dark:text-amber-200">Bayview Village</p>
            <p className="text-[10px] text-amber-600/70 dark:text-amber-400/60 mt-0.5">Hotel & Hospitality CRM</p>
          </div>
        </div>
      )}
    </aside>
  );
}
