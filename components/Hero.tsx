"use client";

import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { ArrowRight, GraduationCap, ShieldCheck, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Fallback numbers shown until the homepage passes real platform stats.
const DEFAULT_STATS = [
  { value: "500+", label: "Verified Mentors" },
  { value: "1,200+", label: "Tuitions Posted" },
  { value: "64", label: "Districts Covered" },
];

export type HeroStat = { value: string; label: string };

const highlights = [
  { icon: Search, text: "Easy search" },
  { icon: ShieldCheck, text: "Admin-approved posts" },
  { icon: GraduationCap, text: "Qualified mentors" },
];

export function Hero({ stats = DEFAULT_STATS }: { stats?: HeroStat[] }) {
  const reduce = useReducedMotion();

  // Staggered fade-up animation; disabled if the user prefers reduced motion.
  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: reduce ? 0 : 0.12 } },
  };
  const item: Variants = {
    hidden: { opacity: reduce ? 1 : 0, y: reduce ? 0 : 24 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  return (
    <section className="relative isolate overflow-hidden">
      {/* Decorative background */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/10 via-background to-background"
      />
      <div
        aria-hidden="true"
        className="absolute -top-24 left-1/2 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl sm:h-96 sm:w-96"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_1px_1px,hsl(var(--muted-foreground)/0.15)_1px,transparent_0)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"
      />

      <div className="container mx-auto px-4 py-20 sm:py-28 lg:py-36">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="mx-auto max-w-3xl text-center"
        >
          <motion.div variants={item}>
            <Badge variant="secondary" className="rounded-full px-4 py-1 text-sm">
              Bangladesh&apos;s tuition marketplace
            </Badge>
          </motion.div>

          <motion.h1
            variants={item}
            className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
          >
            Find Your{" "}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Perfect Tuition
            </span>
          </motion.h1>

          <motion.p
            variants={item}
            className="mx-auto mt-6 max-w-xl text-base text-muted-foreground sm:text-lg"
          >
            Browse admin-approved tuition posts, connect with qualified mentors,
            and start learning with the right guidance, all in one place.
          </motion.p>

          <motion.div
            variants={item}
            className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Button
              render={<Link href="/tuitions" />}
              nativeButton={false}
              size="lg"
              className="w-full sm:w-auto"
            >
              Browse Tuitions
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              render={<Link href="/pricing" />}
              nativeButton={false}
              size="lg"
              variant="outline"
              className="w-full sm:w-auto"
            >
              View Pricing
            </Button>
          </motion.div>

          <motion.ul
            variants={item}
            className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground"
          >
            {highlights.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-primary" />
                {text}
              </li>
            ))}
          </motion.ul>
        </motion.div>

        {/* Stats */}
        <motion.dl
          variants={container}
          initial="hidden"
          animate="show"
          className="mx-auto mt-16 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3"
        >
          {stats.map((s) => (
            <motion.div
              key={s.label}
              variants={item}
              className="rounded-xl border bg-card/60 p-6 text-center backdrop-blur"
            >
              <dt className="text-sm text-muted-foreground">{s.label}</dt>
              <dd className="mt-1 text-3xl font-bold tracking-tight">
                {s.value}
              </dd>
            </motion.div>
          ))}
        </motion.dl>
      </div>
    </section>
  );
}

export default Hero;