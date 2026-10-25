// app/page.tsx — marketing landing page
"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useUser, SignInButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface Feature {
  title: string;
  description: string;
  icon: string;
}
interface Pillar {
  emoji: string;
  label: string;
  color: string;
  rotate: number;
  x: number;
  y: number;
}

const FEATURES: Feature[] = [
  {
    icon: "🧠",
    title: "A plan built around you",
    description:
      "Tell your coach your body stats, goal and what you really eat. Get a full 6-month plan, not a generic template.",
  },
  {
    icon: "🥗",
    title: "Know what to eat & avoid",
    description:
      "Daily calories, macros, the foods that will move you forward and the ones holding you back — matched to your diet.",
  },
  {
    icon: "🏋️",
    title: "Workouts that fit your week",
    description:
      "Exactly how many minutes per session and per week, progressing month by month, for your equipment and experience.",
  },
  {
    icon: "📈",
    title: "Monthly check-ins",
    description:
      "Log your weight and how you felt. Your coach reviews the numbers and tells you what to adjust next.",
  },
];

const STEPS: { n: string; title: string; text: string }[] = [
  {
    n: "1",
    title: "Tell us about you",
    text: "Height, weight, goal, habits and what a normal day of eating looks like.",
  },
  {
    n: "2",
    title: "Get your 6-month plan",
    text: "Food, workouts and weekly time targets, generated in under a minute.",
  },
  {
    n: "3",
    title: "Check in every month",
    text: "Track progress and get personal coaching feedback to keep you on course.",
  },
];

const PILLARS: Pillar[] = [
  {
    emoji: "🥗",
    label: "EAT",
    color: "bg-emerald-600",
    rotate: -14,
    x: -90,
    y: 8,
  },
  {
    emoji: "🏋️",
    label: "TRAIN",
    color: "bg-teal-600",
    rotate: -4,
    x: -30,
    y: -10,
  },
  { emoji: "📈", label: "TRACK", color: "bg-cyan-600", rotate: 6, x: 30, y: 4 },
  {
    emoji: "🧠",
    label: "ADAPT",
    color: "bg-gradient-to-br from-lime-400 via-emerald-500 to-teal-600",
    rotate: 16,
    x: 90,
    y: -6,
  },
];

export default function Home() {
  const { isSignedIn } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isSignedIn) router.prefetch("/dashboard");
  }, [isSignedIn, router]);

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center overflow-hidden bg-white dark:bg-gray-950">
      <div className="hidden dark:block absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-[-250px] left-[-250px] w-[700px] h-[700px] rounded-full bg-emerald-900 opacity-30"
          animate={{ scale: [1, 1.3, 1], x: [0, 120, 0], y: [0, -80, 0] }}
          transition={{ duration: 25, repeat: Infinity, repeatType: "mirror" }}
        />
        <motion.div
          className="absolute bottom-[-300px] right-[-300px] w-[800px] h-[800px] rounded-full bg-teal-950 opacity-30"
          animate={{ scale: [1, 1.25, 1], x: [0, -100, 0], y: [0, 100, 0] }}
          transition={{ duration: 30, repeat: Infinity, repeatType: "mirror" }}
        />
      </div>

      <div className="relative h-52 w-full max-w-sm mb-10 mt-16">
        {PILLARS.map((p, i) => (
          <motion.div
            key={p.label}
            className={`absolute w-16 h-24 rounded-2xl ${p.color} shadow-xl border-2 border-white/30 flex flex-col items-center justify-center gap-1`}
            style={{
              left: "50%",
              top: "50%",
              marginLeft: p.x - 32,
              marginTop: p.y - 48,
              rotate: p.rotate,
              zIndex: i,
            }}
            animate={{ y: [0, -12, 0] }}
            transition={{
              duration: 3,
              delay: i * 0.4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <span className="text-2xl">{p.emoji}</span>
            <span className="text-white text-[8px] font-black tracking-widest">
              {p.label}
            </span>
          </motion.div>
        ))}
      </div>

      <motion.h1
        className="text-5xl md:text-7xl font-black text-black dark:text-white tracking-tight relative z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        <span className="text-emerald-500">FIT</span>{" "}
        <span className="text-teal-500">COACH</span>
      </motion.h1>
      <motion.p
        className="mt-5 text-gray-600 dark:text-gray-300 text-lg max-w-xl relative z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.7 }}
      >
        Your AI fitness life coach. Share your goals and eating habits, get a
        personalised 6-month plan for food and training, then check in monthly
        to stay on track.
      </motion.p>

      <motion.div
        className="mt-8 flex flex-wrap gap-4 justify-center relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.7 }}
      >
        {isSignedIn ? (
          <Button
            size="lg"
            className="text-lg px-10 py-6 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg"
            onClick={() => router.push("/dashboard")}
          >
            Go to my dashboard →
          </Button>
        ) : (
          <>
            <SignInButton mode="modal" forceRedirectUrl="/dashboard">
              <Button
                size="lg"
                className="text-lg px-10 py-6 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg"
              >
                Sign in to start
              </Button>
            </SignInButton>
            <Link href="/sign-up">
              <Button
                variant="outline"
                size="lg"
                className="text-lg px-10 py-6 border-teal-500 text-teal-600 dark:text-teal-400"
              >
                Create free account
              </Button>
            </Link>
          </>
        )}
      </motion.div>

      <motion.div
        className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-20 max-w-6xl w-full relative z-10"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.2 } },
        }}
      >
        {FEATURES.map((f) => (
          <motion.div
            key={f.title}
            className="p-6 rounded-2xl border border-emerald-200 dark:border-emerald-900/40 bg-white/70 dark:bg-gray-900/50 shadow-lg backdrop-blur-sm text-left"
            variants={{
              hidden: { opacity: 0, y: 40 },
              visible: { opacity: 1, y: 0 },
            }}
            transition={{ duration: 0.7 }}
          >
            <div className="text-4xl mb-3">{f.icon}</div>
            <h3 className="text-lg font-semibold mb-2 text-emerald-700 dark:text-emerald-300">
              {f.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {f.description}
            </p>
          </motion.div>
        ))}
      </motion.div>

      <section className="mt-24 max-w-4xl w-full relative z-10">
        <h2 className="text-3xl font-bold mb-8 text-black dark:text-white">
          How it works
        </h2>
        <div className="grid md:grid-cols-3 gap-6 text-left">
          {STEPS.map((s) => (
            <div
              key={s.n}
              className="rounded-2xl border border-gray-200 dark:border-gray-800 p-5"
            >
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 font-black text-white">
                {s.n}
              </div>
              <h3 className="font-semibold text-black dark:text-white">
                {s.title}
              </h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                {s.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      <motion.div
        className="mt-20 mb-6 relative z-10"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h2 className="text-3xl font-bold mb-4 text-black dark:text-white">
          Ready to meet your coach?
        </h2>
        <Link href={isSignedIn ? "/dashboard" : "/sign-up"}>
          <Button
            size="lg"
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-12 py-6 text-lg shadow-xl"
          >
            Start my plan →
          </Button>
        </Link>
      </motion.div>
      <p className="mb-10 max-w-xl text-xs text-gray-400 relative z-10">
        Fit Coach provides general fitness and nutrition guidance and is not
        medical advice. Talk to a doctor before changing your diet or starting a
        new exercise programme. For adults 18+.
      </p>
    </main>
  );
}
