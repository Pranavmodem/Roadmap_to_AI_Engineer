"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useJourney } from "@/lib/store";
import { summarizeProgress } from "@/lib/progress";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/curriculum", label: "Curriculum" },
  { href: "/today", label: "Today" },
  { href: "/review", label: "Review" },
  { href: "/projects", label: "Projects" },
  { href: "/notes", label: "Notes" },
];

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const hydrated = useJourney((s) => s.hasHydrated);
  const completedDays = useJourney((s) => s.completedDays);
  const quizScores = useJourney((s) => s.quizScores);
  const startDate = useJourney((s) => s.startDate);
  const activityDates = useJourney((s) => s.activityDates);
  const srs = useJourney((s) => s.srs);
  const theme = useJourney((s) => s.theme);
  const toggleTheme = useJourney((s) => s.toggleTheme);
  const [q, setQ] = useState("");

  // apply theme to <html> so every page (and portals) inherit tokens
  useEffect(() => {
    if (hydrated) document.documentElement.dataset.theme = theme;
  }, [hydrated, theme]);

  const s = summarizeProgress(
    hydrated ? completedDays : [],
    hydrated ? quizScores : {},
    hydrated ? startDate : null,
    hydrated ? activityDates : [],
    hydrated ? srs : {}
  );

  return (
    <header
      className="nav site-nav"
      style={{
        display: "flex",
        alignItems: "center",
        padding: "var(--space-3) var(--space-8)",
        borderBottom: "1px solid var(--color-divider)",
        gap: "var(--space-4)",
        position: "sticky",
        top: 0,
        background: "var(--color-bg)",
        zIndex: 20,
      }}
    >
      <Link
        href="/"
        className="nav-brand"
        style={{ letterSpacing: "0.03em", textDecoration: "none", color: "inherit", fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 18, whiteSpace: "nowrap" }}
      >
        AI&nbsp;ENGINEER&nbsp;/&nbsp;180
      </Link>
      <nav style={{ display: "flex", gap: "var(--space-4)", marginRight: "auto", flexWrap: "wrap" }}>
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            aria-current={pathname === l.href ? "page" : undefined}
            style={{
              textDecoration: "none",
              color: pathname === l.href ? "var(--color-accent-700)" : "inherit",
              fontSize: 14,
              fontWeight: pathname === l.href ? 600 : 400,
            }}
          >
            {l.label}
          </Link>
        ))}
      </nav>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (q.trim()) {
            router.push(`/search?q=${encodeURIComponent(q.trim())}`);
            setQ("");
          }
        }}
        role="search"
      >
        <input
          className="input"
          type="search"
          placeholder="Search lessons…"
          aria-label="Search lessons"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ width: 150, minHeight: 32, fontSize: 13 }}
        />
      </form>

      <div className="hidden md:flex" style={{ alignItems: "center", gap: "var(--space-2)" }}>
        <span className="tag tag-neutral" title="Consecutive days with activity">🔥 {s.streak}d</span>
        <span className="tag tag-neutral">{s.xp} XP</span>
        <span className="tag tag-outline" title="Program mastery: 60% completion + 40% quiz accuracy">mastery {s.programMastery}%</span>
        {s.dueCards > 0 && (
          <Link href="/review" className="tag tag-accent" style={{ textDecoration: "none" }} title="Flashcards due for review">
            {s.dueCards} due
          </Link>
        )}
      </div>

      <button
        className="btn btn-icon btn-secondary"
        onClick={toggleTheme}
        title={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
        aria-label="Toggle theme"
      >
        {hydrated && theme === "dark" ? "☀️" : "🌙"}
      </button>
    </header>
  );
}
