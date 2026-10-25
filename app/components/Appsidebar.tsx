// app/components/Appsidebar.tsx
"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  ClipboardList,
  CalendarCheck,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/plan", label: "My 6-Month Plan", icon: ClipboardList },
  { href: "/check-in", label: "Monthly Check-in", icon: CalendarCheck },
  { href: "/settings", label: "My Profile", icon: Settings },
];

export function AppSidebar() {
  const { user } = useUser();
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-3 py-3">
          <span className="text-2xl">💪</span>
          <div>
            <p className="text-sm font-black text-black dark:text-white">
              <span className="text-emerald-500">FIT</span>{" "}
              <span className="text-teal-500">COACH</span>
            </p>
            <p className="text-[10px] text-gray-400">Your AI life coach</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarMenu>
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
              <SidebarMenuItem key={href}>
                <SidebarMenuButton asChild isActive={pathname === href}>
                  <Link href={href} className="flex items-center gap-2">
                    <Icon size={16} />
                    <span>{label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <p className="px-3 text-[10px] leading-snug text-gray-400">
          AI coaching is general guidance, not medical advice. Check with a
          doctor before starting a new diet or exercise programme.
        </p>
        {user && (
          <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-sm">
                🥗
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-black dark:text-white truncate">
                  {user.fullName ?? user.username}
                </p>
                <p className="text-[10px] text-gray-400 truncate">
                  {user.primaryEmailAddress?.emailAddress}
                </p>
              </div>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
