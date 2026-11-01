// // app/page.tsx — marketing landing page
// "use client";

// import { motion } from "framer-motion";
// import { Button } from "@/components/ui/button";
// import Link from "next/link";
// import { useUser, SignInButton } from "@clerk/nextjs";
// import { useRouter } from "next/navigation";
// import { useEffect } from "react";

// interface Feature {
//   title: string;
//   description: string;
//   icon: string;
// }
// interface Pillar {
//   emoji: string;
//   label: string;
//   color: string;
//   rotate: number;
//   x: number;
//   y: number;
// }

// const FEATURES: Feature[] = [
//   {
//     icon: "🧠",
//     title: "A plan built around you",
//     description:
//       "Tell your coach your body stats, goal and what you really eat. Get a full 6-month plan, not a generic template.",
//   },
//   {
//     icon: "🥗",
//     title: "Know what to eat & avoid",
//     description:
//       "Daily calories, macros, the foods that will move you forward and the ones holding you back — matched to your diet.",
//   },
//   {
//     icon: "🏋️",
//     title: "Workouts that fit your week",
//     description:
//       "Exactly how many minutes per session and per week, progressing month by month, for your equipment and experience.",
//   },
//   {
//     icon: "📈",
//     title: "Monthly check-ins",
//     description:
//       "Log your weight and how you felt. Your coach reviews the numbers and tells you what to adjust next.",
//   },
// ];

// const STEPS: { n: string; title: string; text: string }[] = [
//   {
//     n: "1",
//     title: "Tell us about you",
//     text: "Height, weight, goal, habits and what a normal day of eating looks like.",
//   },
//   {
//     n: "2",
//     title: "Get your 6-month plan",
//     text: "Food, workouts and weekly time targets, generated in under a minute.",
//   },
//   {
//     n: "3",
//     title: "Check in every month",
//     text: "Track progress and get personal coaching feedback to keep you on course.",
//   },
// ];

// const PILLARS: Pillar[] = [
//   {
//     emoji: "🥗",
//     label: "EAT",
//     color: "bg-emerald-600",
//     rotate: -14,
//     x: -90,
//     y: 8,
//   },
//   {
//     emoji: "🏋️",
//     label: "TRAIN",
//     color: "bg-teal-600",
//     rotate: -4,
//     x: -30,
//     y: -10,
//   },
//   { emoji: "📈", label: "TRACK", color: "bg-cyan-600", rotate: 6, x: 30, y: 4 },
//   {
//     emoji: "🧠",
//     label: "ADAPT",
//     color: "bg-gradient-to-br from-lime-400 via-emerald-500 to-teal-600",
//     rotate: 16,
//     x: 90,
//     y: -6,
//   },
// ];

// export default function Home() {
//   const { isSignedIn } = useUser();
//   const router = useRouter();

//   useEffect(() => {
//     if (isSignedIn) router.prefetch("/dashboard");
//   }, [isSignedIn, router]);

//   return (
//     <main className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center overflow-hidden bg-white dark:bg-gray-950">
//       <div className="hidden dark:block absolute inset-0 overflow-hidden pointer-events-none">
//         <motion.div
//           className="absolute top-[-250px] left-[-250px] w-[700px] h-[700px] rounded-full bg-emerald-900 opacity-30"
//           animate={{ scale: [1, 1.3, 1], x: [0, 120, 0], y: [0, -80, 0] }}
//           transition={{ duration: 25, repeat: Infinity, repeatType: "mirror" }}
//         />
//         <motion.div
//           className="absolute bottom-[-300px] right-[-300px] w-[800px] h-[800px] rounded-full bg-teal-950 opacity-30"
//           animate={{ scale: [1, 1.25, 1], x: [0, -100, 0], y: [0, 100, 0] }}
//           transition={{ duration: 30, repeat: Infinity, repeatType: "mirror" }}
//         />
//       </div>

//       <div className="relative h-52 w-full max-w-sm mb-10 mt-16">
//         {PILLARS.map((p, i) => (
//           <motion.div
//             key={p.label}
//             className={`absolute w-16 h-24 rounded-2xl ${p.color} shadow-xl border-2 border-white/30 flex flex-col items-center justify-center gap-1`}
//             style={{
//               left: "50%",
//               top: "50%",
//               marginLeft: p.x - 32,
//               marginTop: p.y - 48,
//               rotate: p.rotate,
//               zIndex: i,
//             }}
//             animate={{ y: [0, -12, 0] }}
//             transition={{
//               duration: 3,
//               delay: i * 0.4,
//               repeat: Infinity,
//               ease: "easeInOut",
//             }}
//           >
//             <span className="text-2xl">{p.emoji}</span>
//             <span className="text-white text-[8px] font-black tracking-widest">
//               {p.label}
//             </span>
//           </motion.div>
//         ))}
//       </div>

//       <motion.h1
//         className="text-5xl md:text-7xl font-black text-black dark:text-white tracking-tight relative z-10"
//         initial={{ opacity: 0, y: 30 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.7 }}
//       >
//         <span className="text-emerald-500">FIT</span>{" "}
//         <span className="text-teal-500">COACH</span>
//       </motion.h1>
//       <motion.p
//         className="mt-5 text-gray-600 dark:text-gray-300 text-lg max-w-xl relative z-10"
//         initial={{ opacity: 0, y: 30 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ delay: 0.2, duration: 0.7 }}
//       >
//         Your AI fitness life coach. Share your goals and eating habits, get a
//         personalised 6-month plan for food and training, then check in monthly
//         to stay on track.
//       </motion.p>

//       <motion.div
//         className="mt-8 flex flex-wrap gap-4 justify-center relative z-10"
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ delay: 0.4, duration: 0.7 }}
//       >
//         {isSignedIn ? (
//           <Button
//             size="lg"
//             className="text-lg px-10 py-6 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg"
//             onClick={() => router.push("/dashboard")}
//           >
//             Go to my dashboard →
//           </Button>
//         ) : (
//           <>
//             <SignInButton mode="modal" forceRedirectUrl="/dashboard">
//               <Button
//                 size="lg"
//                 className="text-lg px-10 py-6 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg"
//               >
//                 Sign in to start
//               </Button>
//             </SignInButton>
//             <Link href="/sign-up">
//               <Button
//                 variant="outline"
//                 size="lg"
//                 className="text-lg px-10 py-6 border-teal-500 text-teal-600 dark:text-teal-400"
//               >
//                 Create free account
//               </Button>
//             </Link>
//           </>
//         )}
//       </motion.div>

//       <motion.div
//         className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-20 max-w-6xl w-full relative z-10"
//         initial="hidden"
//         whileInView="visible"
//         viewport={{ once: true }}
//         variants={{
//           hidden: {},
//           visible: { transition: { staggerChildren: 0.2 } },
//         }}
//       >
//         {FEATURES.map((f) => (
//           <motion.div
//             key={f.title}
//             className="p-6 rounded-2xl border border-emerald-200 dark:border-emerald-900/40 bg-white/70 dark:bg-gray-900/50 shadow-lg backdrop-blur-sm text-left"
//             variants={{
//               hidden: { opacity: 0, y: 40 },
//               visible: { opacity: 1, y: 0 },
//             }}
//             transition={{ duration: 0.7 }}
//           >
//             <div className="text-4xl mb-3">{f.icon}</div>
//             <h3 className="text-lg font-semibold mb-2 text-emerald-700 dark:text-emerald-300">
//               {f.title}
//             </h3>
//             <p className="text-sm text-gray-600 dark:text-gray-300">
//               {f.description}
//             </p>
//           </motion.div>
//         ))}
//       </motion.div>

//       <section className="mt-24 max-w-4xl w-full relative z-10">
//         <h2 className="text-3xl font-bold mb-8 text-black dark:text-white">
//           How it works
//         </h2>
//         <div className="grid md:grid-cols-3 gap-6 text-left">
//           {STEPS.map((s) => (
//             <div
//               key={s.n}
//               className="rounded-2xl border border-gray-200 dark:border-gray-800 p-5"
//             >
//               <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 font-black text-white">
//                 {s.n}
//               </div>
//               <h3 className="font-semibold text-black dark:text-white">
//                 {s.title}
//               </h3>
//               <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
//                 {s.text}
//               </p>
//             </div>
//           ))}
//         </div>
//       </section>

//       <motion.div
//         className="mt-20 mb-6 relative z-10"
//         initial={{ opacity: 0, y: 20 }}
//         whileInView={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.8 }}
//       >
//         <h2 className="text-3xl font-bold mb-4 text-black dark:text-white">
//           Ready to meet your coach?
//         </h2>
//         <Link href={isSignedIn ? "/dashboard" : "/sign-up"}>
//           <Button
//             size="lg"
//             className="bg-emerald-600 hover:bg-emerald-500 text-white px-12 py-6 text-lg shadow-xl"
//           >
//             Start my plan →
//           </Button>
//         </Link>
//       </motion.div>
//       <p className="mb-10 max-w-xl text-xs text-gray-400 relative z-10">
//         Fit Coach provides general fitness and nutrition guidance and is not
//         medical advice. Talk to a doctor before changing your diet or starting a
//         new exercise programme. For adults 18+.
//       </p>
//     </main>
//   );
// }

// app/page.tsx — cyberpunk marketing landing page
"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser, SignInButton } from "@clerk/nextjs";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type PanInfo,
} from "framer-motion";
import {
  Activity,
  Apple,
  ArrowRight,
  Brain,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Flame,
  HeartPulse,
  LineChart,
  Trophy,
  type LucideIcon,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/*  PHOTOS                                                                    */
/*  Drop your own images into /public and they replace the neon artwork:      */
/*    public/hero/hero-1.jpg … hero-4.jpg      (landscape, ~1600×1200)        */
/*    public/gallery/g-1.jpg … g-6.jpg         (portrait, ~900×1200)          */
/*    public/showcase/s-1.jpg … s-5.jpg        (wide, ~1600×1000)             */
/*  Until a file exists, a neon placeholder is shown automatically.           */
/* -------------------------------------------------------------------------- */

interface Slide {
  src: string;
  tag: string;
  title: string;
  line: string;
  icon: LucideIcon;
  tint: string;
}

const HERO_SLIDES: Slide[] = [
  {
    src: "/hero/hero-1.jpg",
    tag: "MODULE 01",
    title: "STRENGTH",
    line: "Build muscle, lose fat and get stronger every month.",
    icon: Dumbbell,
    tint: "#34d399",
  },
  {
    src: "/hero/hero-2.jpg",
    tag: "MODULE 02",
    title: "CARDIO",
    line: "Train your heart and fit it around your week.",
    icon: HeartPulse,
    tint: "#00e5ff",
  },
  {
    src: "/hero/hero-3.jpg",
    tag: "MODULE 03",
    title: "HIIT",
    line: "Short, hard sessions that fit a busy day.",
    icon: Flame,
    tint: "#ff2e97",
  },
  {
    src: "/hero/hero-4.jpg",
    tag: "MODULE 04",
    title: "RESULTS",
    line: "Check in monthly and watch the numbers move.",
    icon: Trophy,
    tint: "#facc15",
  },
];

const GALLERY: Slide[] = [
  {
    src: "/gallery/g-1.jpg",
    tag: "GYM",
    title: "Lift with purpose",
    line: "Progressive workouts for your equipment.",
    icon: Dumbbell,
    tint: "#34d399",
  },
  {
    src: "/gallery/g-2.jpg",
    tag: "HIIT",
    title: "Burn it down",
    line: "High-intensity blocks, built into your week.",
    icon: Flame,
    tint: "#ff2e97",
  },
  {
    src: "/gallery/g-3.jpg",
    tag: "CARDIO",
    title: "Go the distance",
    line: "Runs, rides and walks that build stamina.",
    icon: HeartPulse,
    tint: "#00e5ff",
  },
  {
    src: "/gallery/g-4.jpg",
    tag: "MOBILITY",
    title: "Move better",
    line: "Stretch, recover and stay injury-free.",
    icon: Activity,
    tint: "#a78bfa",
  },
  {
    src: "/gallery/g-5.jpg",
    tag: "NUTRITION",
    title: "Fuel the machine",
    line: "Calories, macros and meals that fit your diet.",
    icon: Apple,
    tint: "#a3e635",
  },
  {
    src: "/gallery/g-6.jpg",
    tag: "PROGRESS",
    title: "Level up monthly",
    line: "Check in, adjust and keep climbing.",
    icon: Trophy,
    tint: "#facc15",
  },
];

const SHOWCASE: Slide[] = [
  {
    src: "/showcase/s-1.jpg",
    tag: "HOME",
    title: "Train at home",
    line: "No gym? Your plan adapts to what you own.",
    icon: Dumbbell,
    tint: "#34d399",
  },
  {
    src: "/showcase/s-2.jpg",
    tag: "OUTDOORS",
    title: "Hit the trail",
    line: "Runs, hikes and rides that fit your week.",
    icon: HeartPulse,
    tint: "#00e5ff",
  },
  {
    src: "/showcase/s-3.jpg",
    tag: "STRENGTH",
    title: "Own the gym",
    line: "Progressive overload, planned month by month.",
    icon: Flame,
    tint: "#ff2e97",
  },
  {
    src: "/showcase/s-4.jpg",
    tag: "MEAL PREP",
    title: "Prep like a pro",
    line: "Meals and macros matched to how you eat.",
    icon: Apple,
    tint: "#a3e635",
  },
  {
    src: "/showcase/s-5.jpg",
    tag: "RECOVERY",
    title: "Rest and rebuild",
    line: "Sleep, stretch and come back stronger.",
    icon: Activity,
    tint: "#a78bfa",
  },
];

interface Feature {
  title: string;
  description: string;
  icon: LucideIcon;
  code: string;
}

const FEATURES: Feature[] = [
  {
    code: "01",
    icon: Brain,
    title: "A plan built around you",
    description:
      "Tell your coach your body stats, goal and what you really eat. Get a full 6-month plan, not a generic template.",
  },
  {
    code: "02",
    icon: Apple,
    title: "Know what to eat & avoid",
    description:
      "Daily calories, macros, the foods that will move you forward and the ones holding you back, matched to your diet.",
  },
  {
    code: "03",
    icon: Dumbbell,
    title: "Workouts that fit your week",
    description:
      "Exactly how many minutes per session and per week, progressing month by month, for your equipment and experience.",
  },
  {
    code: "04",
    icon: LineChart,
    title: "Monthly check-ins",
    description:
      "Log your weight and how you felt. Your coach reviews the numbers and tells you what to adjust next.",
  },
];

const STEPS = [
  {
    n: "01",
    icon: Activity,
    title: "Tell us about you",
    text: "Height, weight, goal, habits and what a normal day of eating looks like.",
  },
  {
    n: "02",
    icon: Brain,
    title: "Get your 6-month plan",
    text: "Food, workouts and weekly time targets, generated in under a minute.",
  },
  {
    n: "03",
    icon: CalendarCheck,
    title: "Check in every month",
    text: "Track progress and get personal coaching feedback to keep you on course.",
  },
];

const STATS = [
  { value: "6 MO", label: "Full plan" },
  { value: "<60s", label: "To generate" },
  { value: "1×", label: "Monthly check-in" },
  { value: "18+", label: "Adults only" },
];

const TICKER = [
  "CALORIES",
  "MACROS",
  "6-MONTH PLAN",
  "WORKOUTS",
  "MONTHLY CHECK-INS",
  "AI COACH",
  "EAT",
  "TRAIN",
  "TRACK",
  "ADAPT",
];

/* -------------------------------------------------------------------------- */
/*  Styles (keyframes + clipped-corner frames). Colors follow the accent      */
/*  chosen on the Appearance page via --accent-400.                           */
/* -------------------------------------------------------------------------- */

const CSS = `
.cp{--c1:var(--accent-400,#34d399);--c2:#00e5ff;--c3:#ff2e97}
.cp-cut{clip-path:polygon(0 0,calc(100% - 16px) 0,100% 16px,100% 100%,16px 100%,0 calc(100% - 16px))}
.cp-frame{background:linear-gradient(135deg,var(--c1),rgba(255,255,255,.04) 45%,var(--c2));padding:1px;
  clip-path:polygon(0 0,calc(100% - 16px) 0,100% 16px,100% 100%,16px 100%,0 calc(100% - 16px))}
.cp-inner{background:#070a11;
  clip-path:polygon(0 0,calc(100% - 15px) 0,100% 15px,100% 100%,15px 100%,0 calc(100% - 15px))}
.cp-glow{filter:drop-shadow(0 0 14px color-mix(in oklab,var(--c1) 55%,transparent))}
.cp-glow-c{filter:drop-shadow(0 0 14px color-mix(in oklab,var(--c2) 55%,transparent))}
.cp-btn{clip-path:polygon(0 0,calc(100% - 12px) 0,100% 12px,100% 100%,12px 100%,0 calc(100% - 12px));
  background:linear-gradient(90deg,var(--c1),var(--c2));color:#021014;font-weight:900;letter-spacing:.12em;
  text-transform:uppercase;transition:filter .2s,transform .2s}
.cp-btn:hover{filter:brightness(1.15);transform:translateY(-1px)}
.cp-btn-ghost{clip-path:polygon(0 0,calc(100% - 12px) 0,100% 12px,100% 100%,12px 100%,0 calc(100% - 12px));
  background:rgba(255,255,255,.04);box-shadow:inset 0 0 0 1px var(--c2);color:var(--c2);font-weight:800;
  letter-spacing:.12em;text-transform:uppercase;transition:background .2s}
.cp-btn-ghost:hover{background:rgba(0,229,255,.12)}
.cp-scan{background:repeating-linear-gradient(0deg,rgba(255,255,255,.035) 0,rgba(255,255,255,.035) 1px,transparent 1px,transparent 3px)}
.cp-floor{background-image:linear-gradient(var(--c1) 1px,transparent 1px),linear-gradient(90deg,var(--c1) 1px,transparent 1px);
  background-size:64px 64px;transform:perspective(420px) rotateX(62deg);transform-origin:center top;
  animation:cp-grid 2.2s linear infinite;
  -webkit-mask-image:linear-gradient(to bottom,transparent,#000 35%,#000);mask-image:linear-gradient(to bottom,transparent,#000 35%,#000)}
.cp-glitch{position:relative;display:inline-block;text-shadow:0 0 22px color-mix(in oklab,var(--c1) 55%,transparent)}
.cp-glitch::before,.cp-glitch::after{content:attr(data-text);position:absolute;inset:0;pointer-events:none}
.cp-glitch::before{color:var(--c2);animation:cp-glitch-a 5s infinite steps(1);mix-blend-mode:screen}
.cp-glitch::after{color:var(--c3);animation:cp-glitch-b 5s infinite steps(1);mix-blend-mode:screen}
.cp-noscroll{scrollbar-width:none}
.cp-noscroll::-webkit-scrollbar{display:none}
@keyframes cp-grid{from{background-position:0 0}to{background-position:0 64px}}
@keyframes cp-marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}
@keyframes cp-kenburns{from{transform:scale(1.03)}to{transform:scale(1.14)}}
@keyframes cp-fill{from{width:0}to{width:100%}}
@keyframes cp-blink{0%,100%{opacity:1}50%{opacity:.2}}
@keyframes cp-glitch-a{0%,90%,100%{transform:translate(0);clip-path:inset(0 0 0 0)}
  91%{transform:translate(-5px,1px);clip-path:inset(8% 0 58% 0)}93%{transform:translate(4px,-1px);clip-path:inset(62% 0 6% 0)}
  96%{transform:translate(-3px,0);clip-path:inset(30% 0 42% 0)}}
@keyframes cp-glitch-b{0%,88%,100%{transform:translate(0);clip-path:inset(0 0 0 0)}
  89%{transform:translate(5px,-1px);clip-path:inset(50% 0 20% 0)}92%{transform:translate(-4px,1px);clip-path:inset(12% 0 64% 0)}
  95%{transform:translate(3px,0);clip-path:inset(72% 0 4% 0)}}
@media (prefers-reduced-motion:reduce){.cp *,.cp *::before,.cp *::after{animation:none!important}}
`;

/* -------------------------------------------------------------------------- */
/*  Small building blocks                                                     */
/* -------------------------------------------------------------------------- */

/** Photo if /public has it, otherwise a neon placeholder. */
function SlideArt({
  slide,
  active,
  kenBurns,
}: {
  slide: Slide;
  active: boolean;
  kenBurns: boolean;
}): React.JSX.Element {
  const [loaded, setLoaded] = useState(false);
  const Icon = slide.icon;

  useEffect(() => {
    const img = new window.Image();
    img.onload = () => setLoaded(true);
    img.onerror = () => setLoaded(false);
    img.src = slide.src;
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [slide.src]);

  if (loaded) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={slide.src}
        alt=""
        draggable={false}
        className="absolute inset-0 h-full w-full select-none object-cover"
        style={{
          animation:
            active && kenBurns ? "cp-kenburns 9s ease-out forwards" : undefined,
          filter: "saturate(1.15) contrast(1.05)",
        }}
      />
    );
  }

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{
        background: `radial-gradient(circle at 30% 18%, ${slide.tint}55, transparent 55%), radial-gradient(circle at 80% 85%, ${slide.tint}33, transparent 50%), linear-gradient(145deg,#0b1220,#05060a)`,
      }}
    >
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `linear-gradient(${slide.tint}33 1px,transparent 1px),linear-gradient(90deg,${slide.tint}33 1px,transparent 1px)`,
          backgroundSize: "36px 36px",
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <Icon
          className="h-1/3 w-1/3 max-h-40 max-w-40"
          strokeWidth={1.2}
          style={{
            color: slide.tint,
            filter: `drop-shadow(0 0 18px ${slide.tint})`,
          }}
        />
      </div>
    </div>
  );
}

function HudLabel({ children }: { children: ReactNode }): React.JSX.Element {
  return (
    <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-[color:var(--c2)]">
      {children}
    </p>
  );
}

function SectionHead({
  code,
  title,
}: {
  code: string;
  title: string;
}): React.JSX.Element {
  return (
    <div className="mb-8 text-left">
      <HudLabel>{`// ${code}`}</HudLabel>
      <h2 className="mt-2 text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">
        {title}
      </h2>
      <div
        className="mt-3 h-px w-24"
        style={{ background: "linear-gradient(90deg,var(--c1),transparent)" }}
      />
    </div>
  );
}

function Frame({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}): React.JSX.Element {
  return (
    <div className={`cp-frame ${className}`}>
      <div className="cp-inner h-full">{children}</div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Hero carousel                                                             */
/* -------------------------------------------------------------------------- */

const HERO_MS = 5500;

function HeroCarousel(): React.JSX.Element {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = HERO_SLIDES.length;
  const autoplay = !reduceMotion && !paused;

  const next = useCallback(() => setIndex((i) => (i + 1) % count), [count]);
  const prev = useCallback(
    () => setIndex((i) => (i - 1 + count) % count),
    [count],
  );

  useEffect(() => {
    if (!autoplay) return;
    const id = setTimeout(next, HERO_MS);
    return () => clearTimeout(id);
  }, [index, autoplay, next]);

  function onPanEnd(_: unknown, info: PanInfo): void {
    if (info.offset.x < -60) next();
    else if (info.offset.x > 60) prev();
  }

  const slide = HERO_SLIDES[index];

  return (
    <div
      className="cp-glow-c relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <Frame>
        <motion.div
          onPanEnd={onPanEnd}
          style={{ touchAction: "pan-y" }}
          className="relative aspect-[4/5] w-full overflow-hidden sm:aspect-[5/4] lg:aspect-[4/5]"
          role="group"
          aria-roledescription="carousel"
          aria-label="Training styles"
        >
          {HERO_SLIDES.map((s, i) => (
            <div
              key={s.src}
              className="absolute inset-0 transition-opacity duration-700"
              style={{ opacity: i === index ? 1 : 0 }}
              aria-hidden={i !== index}
            >
              <SlideArt
                slide={s}
                active={i === index}
                kenBurns={!reduceMotion}
              />
            </div>
          ))}

          {/* readability + HUD overlays */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#05060a] via-[#05060a]/30 to-transparent" />
          <div className="cp-scan pointer-events-none absolute inset-0" />

          <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-white/80">
            <span
              className="h-2 w-2 rounded-full bg-red-500"
              style={{ animation: "cp-blink 1.4s infinite" }}
            />
            CAM_0{index + 1} · LIVE
          </div>
          <div className="pointer-events-none absolute right-4 top-4 font-mono text-[10px] tracking-widest text-white/80">
            {String(index + 1).padStart(2, "0")} /{" "}
            {String(count).padStart(2, "0")}
          </div>

          {/* caption */}
          <div className="absolute inset-x-0 bottom-0 p-5 pb-12 text-left sm:p-6 sm:pb-14">
            <AnimatePresence mode="wait">
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35 }}
              >
                <p
                  className="font-mono text-[11px] uppercase tracking-[0.3em]"
                  style={{ color: slide.tint }}
                >
                  {slide.tag}
                </p>
                <p className="mt-1 text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">
                  {slide.title}
                </p>
                <p className="mt-1 max-w-xs text-sm text-stone-300">
                  {slide.line}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* controls */}
          <div className="absolute inset-x-4 bottom-4 flex items-center gap-3">
            <div className="flex flex-1 gap-1.5">
              {HERO_SLIDES.map((s, i) => (
                <button
                  key={s.src}
                  type="button"
                  aria-label={`Go to slide ${i + 1}: ${s.title}`}
                  aria-current={i === index}
                  onClick={() => setIndex(i)}
                  className="relative h-1.5 flex-1 overflow-hidden bg-white/15"
                >
                  {i === index && (
                    <span
                      key={`${index}-${autoplay}`}
                      className="absolute inset-y-0 left-0 block"
                      style={{
                        background: "var(--c1)",
                        width: autoplay ? undefined : "100%",
                        animation: autoplay
                          ? `cp-fill ${HERO_MS}ms linear forwards`
                          : undefined,
                      }}
                    />
                  )}
                </button>
              ))}
            </div>
            <button
              type="button"
              aria-label="Previous slide"
              onClick={prev}
              className="flex h-8 w-8 items-center justify-center border border-white/20 text-white transition-colors hover:border-[color:var(--c1)] hover:text-[color:var(--c1)]"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Next slide"
              onClick={next}
              className="flex h-8 w-8 items-center justify-center border border-white/20 text-white transition-colors hover:border-[color:var(--c1)] hover:text-[color:var(--c1)]"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      </Frame>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Reusable image carousel (scroll-snap)                                     */
/* -------------------------------------------------------------------------- */

function ImageCarousel({
  slides,
  label,
  itemClass,
  aspectClass,
  intervalMs = 4000,
}: {
  slides: Slide[];
  label: string;
  itemClass: string;
  aspectClass: string;
  intervalMs?: number;
}): React.JSX.Element {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const reduceMotion = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const autoplay = !reduceMotion && !paused;

  /** Scroll one card forward/back; wraps around at either end. */
  const step = useCallback((dir: 1 | -1): void => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.firstElementChild as HTMLElement | null;
    const amount = card ? card.offsetWidth + 20 : el.clientWidth * 0.8;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8;
    const atStart = el.scrollLeft <= 8;
    if (dir === 1 && atEnd) {
      el.scrollTo({ left: 0, behavior: "smooth" });
    } else if (dir === -1 && atStart) {
      el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
    } else {
      el.scrollBy({ left: dir * amount, behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    if (!autoplay) return;
    const id = setInterval(() => step(1), intervalMs);
    return () => clearInterval(id);
  }, [autoplay, intervalMs, step]);

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setTimeout(() => setPaused(false), 4000)}
    >
      <div className="mb-4 flex items-center justify-end gap-2">
        <button
          type="button"
          aria-label="Scroll left"
          onClick={() => step(-1)}
          className="flex h-9 w-9 items-center justify-center border border-white/20 text-white transition-colors hover:border-[color:var(--c1)] hover:text-[color:var(--c1)]"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Scroll right"
          onClick={() => step(1)}
          className="flex h-9 w-9 items-center justify-center border border-white/20 text-white transition-colors hover:border-[color:var(--c1)] hover:text-[color:var(--c1)]"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div
        ref={trackRef}
        className="cp-noscroll -mx-6 flex snap-x snap-mandatory gap-5 overflow-x-auto px-6 pb-4"
        role="group"
        aria-roledescription="carousel"
        aria-label={label}
        tabIndex={0}
      >
        {slides.map((g, i) => (
          <motion.article
            key={g.src}
            className={`group shrink-0 snap-start ${itemClass}`}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay: Math.min(i, 3) * 0.08 }}
          >
            <Frame className="transition-transform duration-300 group-hover:-translate-y-1.5">
              <div
                className={`relative overflow-hidden text-left ${aspectClass}`}
              >
                <SlideArt slide={g} active={false} kenBurns={false} />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#05060a] via-[#05060a]/20 to-transparent" />
                <div className="cp-scan pointer-events-none absolute inset-0" />
                <span
                  className="absolute left-3 top-3 border px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest backdrop-blur-sm"
                  style={{ borderColor: g.tint, color: g.tint }}
                >
                  {g.tag}
                </span>
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <p className="text-xl font-black uppercase leading-tight tracking-tight text-white">
                    {g.title}
                  </p>
                  <p className="mt-1 text-xs text-stone-300">{g.line}</p>
                </div>
              </div>
            </Frame>
          </motion.article>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function Home(): React.JSX.Element {
  const { isSignedIn } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isSignedIn) router.prefetch("/dashboard");
  }, [isSignedIn, router]);

  const ticker = [...TICKER, ...TICKER];

  return (
    <main className="cp relative -m-4 min-h-screen overflow-hidden bg-[#05060a] text-stone-100 lg:-m-6">
      <style>{CSS}</style>

      {/* ambient background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -left-40 -top-40 h-[560px] w-[560px] rounded-full opacity-25 blur-[120px]"
          style={{ background: "var(--c1)" }}
        />
        <div
          className="absolute -right-48 top-1/4 h-[520px] w-[520px] rounded-full opacity-20 blur-[120px]"
          style={{ background: "var(--c3)" }}
        />
        <div
          className="absolute bottom-0 left-1/3 h-[420px] w-[420px] rounded-full opacity-15 blur-[120px]"
          style={{ background: "var(--c2)" }}
        />
        <div className="absolute inset-x-0 top-[38rem] h-[26rem] overflow-hidden opacity-[0.22]">
          <div className="cp-floor h-[160%] w-full" />
        </div>
        <div className="cp-scan absolute inset-0" />
      </div>

      {/* ------------------------------- HERO -------------------------------- */}
      <section className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 px-6 pb-16 pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:pt-24">
        <div className="text-left">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-5 inline-flex items-center gap-2 border border-[color:var(--c2)]/40 bg-[color:var(--c2)]/5 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.3em] text-[color:var(--c2)]"
          >
            <span
              className="h-1.5 w-1.5 rounded-full bg-[color:var(--c1)]"
              style={{ animation: "cp-blink 1.4s infinite" }}
            />
            SYS//ONLINE · AI COACH
          </motion.div>

          <motion.h1
            className="text-6xl font-black uppercase leading-[0.95] tracking-tight sm:text-7xl lg:text-8xl"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <span className="cp-glitch text-[color:var(--c1)]" data-text="FIT">
              FIT
            </span>
            <br />
            <span className="cp-glitch text-white" data-text="COACH">
              COACH
            </span>
          </motion.h1>

          <motion.p
            className="mt-6 max-w-xl text-base text-stone-300 sm:text-lg"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7 }}
          >
            Your AI fitness life coach. Share your goals and eating habits, get
            a personalised 6-month plan for food and training, then check in
            monthly to stay on track.
          </motion.p>

          <motion.div
            className="mt-8 flex flex-wrap items-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.7 }}
          >
            {isSignedIn ? (
              <span className="cp-glow">
                <button
                  type="button"
                  onClick={() => router.push("/dashboard")}
                  className="cp-btn inline-flex items-center gap-2 px-8 py-4 text-sm"
                >
                  Go to my dashboard <ArrowRight className="h-4 w-4" />
                </button>
              </span>
            ) : (
              <>
                <span className="cp-glow">
                  <SignInButton mode="modal" forceRedirectUrl="/dashboard">
                    <button
                      type="button"
                      className="cp-btn inline-flex items-center gap-2 px-8 py-4 text-sm"
                    >
                      Sign in to start <ArrowRight className="h-4 w-4" />
                    </button>
                  </SignInButton>
                </span>
                <Link
                  href="/sign-up"
                  className="cp-btn-ghost inline-flex items-center px-8 py-4 text-sm"
                >
                  Create free account
                </Link>
              </>
            )}
          </motion.div>

          <motion.div
            className="mt-10 grid max-w-md grid-cols-4 gap-3"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: {
                transition: { staggerChildren: 0.1, delayChildren: 0.6 },
              },
            }}
          >
            {STATS.map((s) => (
              <motion.div
                key={s.label}
                className="border-l-2 border-[color:var(--c1)] pl-3"
                variants={{
                  hidden: { opacity: 0, y: 12 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                <p className="font-mono text-xl font-bold text-white">
                  {s.value}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-stone-400">
                  {s.label}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.7 }}
        >
          <HeroCarousel />
        </motion.div>
      </section>

      {/* ------------------------------ TICKER ------------------------------- */}
      <div
        className="relative z-10 overflow-hidden border-y py-3"
        style={{
          borderColor: "color-mix(in oklab,var(--c1) 40%,transparent)",
          background: "color-mix(in oklab,var(--c1) 8%,#05060a)",
        }}
        aria-hidden="true"
      >
        <div
          className="flex w-max gap-10 whitespace-nowrap font-mono text-sm font-bold uppercase tracking-[0.3em]"
          style={{ animation: "cp-marquee 28s linear infinite" }}
        >
          {ticker.map((t, i) => (
            <span key={i} className="flex items-center gap-10">
              <span
                className={
                  i % 2 === 0 ? "text-[color:var(--c1)]" : "text-white/80"
                }
              >
                {t}
              </span>
              <span className="text-[color:var(--c3)]">◆</span>
            </span>
          ))}
        </div>
      </div>

      {/* ----------------------------- FEATURES ------------------------------ */}
      <section className="relative z-10 mx-auto mt-24 max-w-6xl px-6">
        <SectionHead code="01 · CAPABILITIES" title="What your coach does" />
        <motion.div
          className="grid gap-5 md:grid-cols-2 lg:grid-cols-4"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.12 } },
          }}
        >
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                className="group text-left"
                variants={{
                  hidden: { opacity: 0, y: 36 },
                  visible: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.6 }}
              >
                <Frame className="h-full transition-transform duration-300 group-hover:-translate-y-1.5">
                  <div className="flex h-full flex-col p-6">
                    <div className="mb-5 flex items-center justify-between">
                      <span
                        className="flex h-11 w-11 items-center justify-center border"
                        style={{
                          borderColor: "var(--c1)",
                          boxShadow:
                            "0 0 18px -4px var(--c1), inset 0 0 12px -6px var(--c1)",
                        }}
                      >
                        <Icon className="h-5 w-5 text-[color:var(--c1)]" />
                      </span>
                      <span className="font-mono text-xs tracking-widest text-stone-500">
                        {f.code}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold leading-snug text-white">
                      {f.title}
                    </h3>
                    <p className="mt-2 text-sm text-stone-400">
                      {f.description}
                    </p>
                  </div>
                </Frame>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* ------------------------------ GALLERY ------------------------------ */}
      <section className="relative z-10 mx-auto mt-24 max-w-6xl px-6">
        <SectionHead code="02 · TRAINING MODES" title="Train your way" />
        <ImageCarousel
          slides={GALLERY}
          label="Workout styles"
          itemClass="w-[72%] sm:w-[44%] lg:w-[28%]"
          aspectClass="aspect-[3/4]"
        />
      </section>

      {/* ----------------------------- HOW IT WORKS -------------------------- */}
      <section className="relative z-10 mx-auto mt-24 max-w-5xl px-6">
        <SectionHead code="03 · PROTOCOL" title="How it works" />
        <div className="relative mt-12 grid gap-5 md:grid-cols-3">
          <div
            className="pointer-events-none absolute left-0 right-0 top-0 hidden h-px md:block"
            style={{
              background:
                "linear-gradient(90deg,transparent,var(--c1),var(--c2),transparent)",
              opacity: 0.5,
            }}
          />
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.n}
                className="relative text-left"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.12 }}
              >
                <Frame className="h-full">
                  <div className="p-6 pt-12">
                    <Icon className="mb-3 h-5 w-5 text-[color:var(--c2)]" />
                    <h3 className="font-bold text-white">{s.title}</h3>
                    <p className="mt-1 text-sm text-stone-400">{s.text}</p>
                  </div>
                </Frame>
                {/* badge lives OUTSIDE the clipped Frame so it isn't cut off */}
                <div
                  className="absolute left-6 top-0 z-10 flex h-[72px] w-[72px] -translate-y-1/2 items-center justify-center border bg-[#05060a] font-mono text-2xl font-black text-[color:var(--c1)]"
                  style={{
                    borderColor: "var(--c1)",
                    boxShadow: "0 0 24px -6px var(--c1)",
                  }}
                >
                  {s.n}
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ----------------------------- SHOWCASE ------------------------------ */}
      <section className="relative z-10 mx-auto mt-24 max-w-6xl px-6">
        <SectionHead code="04 · IN THE FIELD" title="Train anywhere" />
        <ImageCarousel
          slides={SHOWCASE}
          label="Train anywhere"
          itemClass="w-[88%] sm:w-[60%] lg:w-[46%]"
          aspectClass="aspect-[16/10]"
          intervalMs={4800}
        />
      </section>

      {/* -------------------------------- CTA -------------------------------- */}
      <section className="relative z-10 mx-auto mt-28 max-w-4xl px-6 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <Frame className="cp-glow">
            <div className="relative overflow-hidden px-6 py-14 text-center">
              <div
                className="pointer-events-none absolute inset-0 opacity-40"
                style={{
                  background:
                    "radial-gradient(circle at 50% 0%, color-mix(in oklab,var(--c1) 35%,transparent), transparent 60%)",
                }}
              />
              <HudLabel>{"// READY TO MEET YOUR COACH"}</HudLabel>
              <h2 className="relative mt-3 text-3xl font-black uppercase tracking-tight text-white sm:text-5xl">
                Ready to meet your coach?
              </h2>
              <div className="relative mt-8">
                <span className="cp-glow inline-block">
                  <Link
                    href={isSignedIn ? "/dashboard" : "/sign-up"}
                    className="cp-btn inline-flex items-center gap-2 px-10 py-4 text-sm"
                  >
                    Start my plan <ArrowRight className="h-4 w-4" />
                  </Link>
                </span>
              </div>
            </div>
          </Frame>
        </motion.div>

        <p className="mx-auto mt-8 max-w-xl pb-10 text-center text-xs text-stone-500">
          Fit Coach provides general fitness and nutrition guidance and is not
          medical advice. Talk to a doctor before changing your diet or starting
          a new exercise programme. For adults 18+.
        </p>
      </section>
    </main>
  );
}
