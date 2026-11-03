// app/components/Appsidebar.tsx
"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  ClipboardList,
  CalendarCheck,
  Settings,
  Palette,
  Dumbbell,
  PanelLeftClose,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { motion, useReducedMotion } from "framer-motion";
import { CyberStyles, Frame, HudLabel } from "@/app/components/Cyber";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/plan", label: "My 6-Month Plan", icon: ClipboardList },
  { href: "/check-in", label: "Monthly Check-in", icon: CalendarCheck },
  { href: "/inspirations", label: "Inspirations", icon: Sparkles },
  { href: "/settings", label: "My Profile", icon: Settings },
  { href: "/appearance", label: "Appearance", icon: Palette },
];

/* Sidebar-only CSS. Shared .cp-* classes come from <CyberStyles />. */
const SIDEBAR_CSS = `
.cp-sidebar{background:var(--cp-bg);position:relative;overflow:hidden}
.cp-sidebar .cp-nav{position:relative;height:2.6rem;border-radius:0;
clip-path:polygon(0 0,calc(100% - 10px) 0,100% 10px,100% 100%,10px 100%,0 calc(100% - 10px));
background:var(--cp-tint);box-shadow:inset 0 0 0 1px var(--cp-line);
color:var(--cp-muted);transition:color .2s,box-shadow .2s,background .2s,padding-left .2s}
.cp-sidebar .cp-nav:hover{color:var(--cp-fg);background:color-mix(in oklab,var(--c2) 8%,transparent);
box-shadow:inset 0 0 0 1px var(--c2);padding-left:1rem}
.cp-sidebar .cp-nav[data-active="true"]{color:var(--c1);
background:color-mix(in oklab,var(--c1) 14%,transparent);
box-shadow:inset 0 0 0 1px var(--c1)}
.cp-sidebar .cp-nav:hover svg{filter:drop-shadow(0 0 6px var(--c2))}
.cp-sidebar .cp-nav[data-active="true"] svg{filter:drop-shadow(0 0 6px var(--c1))}
.cps-spin{transform-box:fill-box;transform-origin:center;animation:cps-spin 9s linear infinite}
.cps-spin-r{transform-box:fill-box;transform-origin:center;animation:cps-spin 14s linear infinite reverse}
.cps-logo:hover .cps-spin{animation-duration:2.2s}
.cps-logo:hover .cps-spin-r{animation-duration:3.5s}
.cps-pulse{animation:cps-pulse 3s ease-in-out infinite}
.cps-sweep{background:linear-gradient(90deg,transparent,var(--c2),var(--c1),transparent);
background-size:50% 100%;background-repeat:no-repeat;animation:cps-sweep 3.2s ease-in-out infinite}
.cps-bob{animation:cps-bob 2.6s ease-in-out infinite}
@keyframes cps-spin{to{transform:rotate(360deg)}}
@keyframes cps-pulse{0%,100%{filter:drop-shadow(0 0 4px color-mix(in oklab,var(--c1) 50%,transparent))}
50%{filter:drop-shadow(0 0 14px color-mix(in oklab,var(--c2) 80%,transparent))}}
@keyframes cps-sweep{0%{background-position:-60% 0}100%{background-position:160% 0}}
@keyframes cps-bob{0%,100%{transform:translateY(0) rotate(-8deg)}50%{transform:translateY(-1.5px) rotate(8deg)}}
`;

function Logo() {
  return (
    <Link
      href="/"
      aria-label="Fit Coach home"
      className="cps-logo group flex items-center gap-3 min-w-0"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.4, rotate: -90 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 160, damping: 14 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        className="cps-pulse relative h-14 w-14 shrink-0"
      >
        <svg viewBox="0 0 56 56" className="h-full w-full" aria-hidden>
          <defs>
            <linearGradient id="cps-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" style={{ stopColor: "var(--c1)" }} />
              <stop offset="100%" style={{ stopColor: "var(--c2)" }} />
            </linearGradient>
          </defs>
          <polygon
            points="28,2 50.5,15 50.5,41 28,54 5.5,41 5.5,15"
            fill="var(--cp-tint)"
            stroke="url(#cps-grad)"
            strokeWidth="1.5"
          />
          <g className="cps-spin">
            <circle
              cx="28"
              cy="28"
              r="21"
              fill="none"
              stroke="url(#cps-grad)"
              strokeWidth="1"
              strokeDasharray="3 5"
              opacity=".8"
            />
          </g>
          <g className="cps-spin-r">
            <circle
              cx="28"
              cy="28"
              r="16"
              fill="none"
              style={{ stroke: "var(--c3)" }}
              strokeWidth=".8"
              strokeDasharray="1 7"
              opacity=".8"
            />
          </g>
        </svg>
        <span
          className="cps-bob absolute inset-0 flex items-center justify-center"
          style={{ color: "var(--c1)" }}
        >
          <Dumbbell size={22} strokeWidth={2.4} />
        </span>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="min-w-0"
      >
        <p className="text-lg font-black uppercase leading-none tracking-tight">
          <span className="cp-glitch text-[color:var(--c1)]" data-text="FIT">
            FIT
          </span>{" "}
          <span
            className="cp-glitch text-[color:var(--cp-fg)]"
            data-text="COACH"
          >
            COACH
          </span>
        </p>
        <p className="mt-1.5 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.25em] text-[color:var(--c2)]">
          <span
            className="h-1.5 w-1.5 rounded-full bg-[color:var(--c1)]"
            style={{ animation: "cp-blink 1.4s infinite" }}
          />
          AI//LIFE COACH
        </p>
      </motion.div>
    </Link>
  );
}

export function AppSidebar() {
  const { user } = useUser();
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const { toggleSidebar } = useSidebar();

  // Navbar is h-14 and sits above the sidebar, so the desktop sidebar starts below it.
  return (
    <Sidebar
      collapsible="offcanvas"
      className="border-r border-[color:var(--cp-line)] md:top-14 md:h-[calc(100svh-3.5rem)] [&_[data-sidebar=sidebar]]:bg-[var(--cp-bg)]"
    >
      <div className="cp cp-sidebar flex h-full min-h-0 flex-col text-[color:var(--cp-fg)]">
        <CyberStyles />
        <style>{SIDEBAR_CSS}</style>

        {/* ambient glow + scanlines */}
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute -left-24 -top-24 h-64 w-64 rounded-full opacity-10 dark:opacity-25 blur-[80px]"
            style={{ background: "var(--c1)" }}
          />
          <div
            className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full opacity-10 dark:opacity-20 blur-[80px]"
            style={{ background: "var(--c3)" }}
          />
          <div className="cp-scan absolute inset-0" />
        </div>

        <SidebarHeader className="relative z-10 p-0">
          <div className="flex items-center justify-between gap-2 px-4 pb-3 pt-4">
            <Logo />
            <button
              type="button"
              onClick={toggleSidebar}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm text-[color:var(--c2)] transition-colors hover:text-[color:var(--c1)] hover:bg-[color:var(--c2)]/10"
              aria-label="Close sidebar"
            >
              <PanelLeftClose size={18} />
            </button>
          </div>
          <div className="relative h-px w-full bg-[var(--cp-line)]">
            {!reduce && <div className="cps-sweep absolute inset-0" />}
          </div>
        </SidebarHeader>

        <SidebarContent className="relative z-10">
          <SidebarGroup className="px-3 py-4">
            <div className="mb-3 px-1">
              <HudLabel>{"// NAVIGATION"}</HudLabel>
            </div>
            <SidebarMenu className="gap-2">
              {NAV_ITEMS.map(({ href, label, icon: Icon }, i) => {
                const active = pathname === href;
                return (
                  <motion.div
                    key={href}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + i * 0.07, duration: 0.4 }}
                  >
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        className="cp-nav"
                      >
                        <Link
                          href={href}
                          className="flex items-center gap-3 px-3"
                        >
                          {active && (
                            <motion.span
                              layoutId="cps-active-bar"
                              className="absolute inset-y-0 left-0 w-[3px]"
                              style={{
                                background:
                                  "linear-gradient(180deg,var(--c1),var(--c2))",
                                boxShadow: "0 0 12px var(--c1)",
                              }}
                              transition={{
                                type: "spring",
                                stiffness: 400,
                                damping: 32,
                              }}
                            />
                          )}
                          <Icon size={16} />
                          <span className="flex-1 truncate font-mono text-[11px] font-bold uppercase tracking-[0.14em]">
                            {label}
                          </span>
                          <span className="font-mono text-[9px] tracking-widest text-[color:var(--cp-faint)]">
                            0{i + 1}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </motion.div>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="relative z-10 gap-3 p-3">
          {user && (
            <Frame>
              <div className="flex items-center gap-3 p-3">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden bg-[color:var(--c1)]/15 text-base"
                  style={{
                    clipPath:
                      "polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%)",
                    boxShadow: "inset 0 0 0 1px var(--c1)",
                  }}
                >
                  {user.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.imageUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    "🥗"
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-[color:var(--cp-fg)]">
                    {user.fullName ?? user.username}
                  </p>
                  <p className="truncate font-mono text-[10px] text-[color:var(--cp-faint)]">
                    {user.primaryEmailAddress?.emailAddress}
                  </p>
                </div>
              </div>
            </Frame>
          )}
          <div className="border-t border-[color:var(--cp-line)] pt-3">
            <HudLabel>{"// NOTICE"}</HudLabel>
            <p className="mt-1.5 text-[10px] leading-snug text-[color:var(--cp-faint)]">
              AI coaching is general guidance, not medical advice. Check with a
              doctor before starting a new diet or exercise programme.
            </p>
          </div>
        </SidebarFooter>
      </div>
    </Sidebar>
  );
}
