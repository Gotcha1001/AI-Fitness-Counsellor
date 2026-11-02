// app/components/Navbar.tsx
"use client";

import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Dumbbell } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";

import { ThemeToggle } from "./ThemeToggle";
import { CyberStyles } from "./Cyber";

const NAV_CSS = `
.cpn-bar{background:linear-gradient(90deg,color-mix(in oklab,var(--cp-bg) 92%,transparent),color-mix(in oklab,var(--cp-surface) 92%,transparent));backdrop-filter:blur(12px)}
.cpn-sweep{background:linear-gradient(90deg,transparent,var(--c2),var(--c1),transparent);
  background-size:40% 100%;background-repeat:no-repeat;animation:cpn-sweep 4s ease-in-out infinite}
.cpn-hex{clip-path:polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%);
  background:linear-gradient(135deg,var(--c1),var(--c2));color:var(--cp-btn-fg);transition:transform .4s,filter .2s}
.cpn-logo:hover .cpn-hex{transform:rotate(180deg);filter:brightness(1.2) drop-shadow(0 0 8px var(--c1))}
.cpn-trigger{clip-path:polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,8px 100%,0 calc(100% - 8px));
  background:var(--cp-tint)!important;box-shadow:inset 0 0 0 1px var(--c2);color:var(--c2)!important;border-radius:0!important}
.cpn-trigger:hover{background:color-mix(in oklab,var(--c2) 12%,transparent)!important}
@keyframes cpn-sweep{0%{background-position:-50% 0}100%{background-position:150% 0}}
`;

export default function Navbar() {
  const reduce = useReducedMotion();

  return (
    <motion.nav
      className="cp cpn-bar sticky top-0 z-30 grid h-14 grid-cols-[1fr_auto_1fr] items-center px-4 text-[color:var(--cp-fg)] sm:px-6"
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45 }}
    >
      <CyberStyles />
      <style>{NAV_CSS}</style>

      <div className="flex items-center justify-self-start">
        <SidebarTrigger className="cpn-trigger md:hidden" />
      </div>

      <div className="justify-self-center">
        <Link href="/" className="cpn-logo flex items-center gap-2.5">
          <span className="cpn-hex flex h-8 w-8 items-center justify-center">
            <Dumbbell size={15} strokeWidth={2.6} />
          </span>
          <span className="text-xl font-black uppercase tracking-tight">
            <span className="cp-glitch text-[color:var(--c1)]" data-text="FIT">
              FIT
            </span>{" "}
            <span
              className="cp-glitch text-[color:var(--cp-fg)]"
              data-text="COACH"
            >
              COACH
            </span>
          </span>
          <span className="hidden items-center gap-1.5 border border-[color:var(--c2)]/40 bg-[color:var(--c2)]/5 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.25em] text-[color:var(--c2)] sm:inline-flex">
            <span
              className="h-1.5 w-1.5 rounded-full bg-[color:var(--c1)]"
              style={{ animation: "cp-blink 1.4s infinite" }}
            />
            ONLINE
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-3 justify-self-end">
        <SignedOut>
          <Link
            href="/sign-in"
            className="cp-btn-ghost inline-flex items-center px-5 py-2 text-xs"
          >
            Sign In
          </Link>
          <span className="cp-glow inline-block">
            <Link
              href="/sign-up"
              className="cp-btn inline-flex items-center px-5 py-2 text-xs"
            >
              Sign Up
            </Link>
          </span>
        </SignedOut>
        <SignedIn>
          <ThemeToggle />
          {/* Fixed square size + overflow so the gradient ring stays perfectly circular */}
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full p-[2px] shadow-[0_0_12px_color-mix(in_oklab,var(--c1)_55%,transparent)] [background:linear-gradient(135deg,var(--c1),var(--c2))]">
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "h-8 w-8 rounded-full",
                  userButtonAvatarBox: "h-8 w-8 rounded-full",
                },
              }}
            />
          </div>
        </SignedIn>
      </div>

      {/* bottom edge */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-[var(--cp-line)]">
        {!reduce && <div className="cpn-sweep absolute inset-0" />}
      </div>
    </motion.nav>
  );
}
