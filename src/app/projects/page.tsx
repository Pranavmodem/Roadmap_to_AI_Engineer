"use client";

import Link from "next/link";
import { allDays, phases } from "@/lib/curriculum";
import { useJourney } from "@/lib/store";

/**
 * Project workspaces: every project & review-checkpoint build in one place,
 * with rubric progress pulled from the store. The capstone thread gets its
 * own rail.
 */

const CAPSTONE_DAYS = [119, 133, 140, 147, 154, 161, 176, 177, 178, 180];

export default function ProjectsPage() {
  const hydrated = useJourney((s) => s.hasHydrated);
  const projectChecks = useJourney((s) => s.projectChecks);
  const completedDays = useJourney((s) => s.completedDays);
  const done = new Set(hydrated ? completedDays : []);

  const buildDays = allDays.filter((d) => d.kind !== "lesson");
  const capstone = allDays.filter((d) => CAPSTONE_DAYS.includes(d.day));

  const rubricPct = (dayId: string, total: number) => {
    const checks = (hydrated && projectChecks[dayId]) || [];
    return total ? Math.round((checks.length / total) * 100) : 0;
  };

  return (
    <div className="page" style={{ maxWidth: 1100 }}>
      <div className="kicker" style={{ marginBottom: "var(--space-2)" }}>project workspaces</div>
      <h1 style={{ marginBottom: "var(--space-2)" }}>Everything you ship</h1>
      <p className="text-muted" style={{ maxWidth: "70ch", marginBottom: "var(--space-6)" }}>
        {buildDays.length} build checkpoints across 26 weeks — weekly mini-projects, phase projects, FDE
        simulations, and the capstone. Rubric progress is tracked per project; a project is "shipped"
        when every rubric line is checked on its day page.
      </p>

      {/* capstone rail */}
      <section style={{ marginBottom: "var(--space-8)" }}>
        <h2 style={{ marginBottom: "var(--space-2)" }}>⭐ The capstone — Docs-QA, production-grade</h2>
        <p className="text-muted" style={{ fontSize: 13.5, maxWidth: "72ch", marginBottom: "var(--space-4)" }}>
          One system, built like a real engagement: grounded RAG service with hybrid retrieval and
          citations (D119) → red-teamed guardrails (D133) → eval harness with golden set and CIs (D140) →
          full observability (D147) → staging CI/CD (D154) → production cutover with monitoring and
          runbook (D161) → hardening, quality gates, ship (D176–178) → Demo Day (D180).
        </p>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          {capstone.map((d, i) => (
            <span key={d.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Link
                href={`/day/${d.id}`}
                className="zh-cell"
                title={d.title}
                style={{
                  textDecoration: "none", color: done.has(d.id) ? "var(--color-bg)" : "inherit",
                  border: "1px solid var(--color-divider)", padding: "8px 12px", fontSize: 12.5,
                  background: done.has(d.id) ? "var(--color-accent)" : "var(--color-surface)",
                  display: "inline-flex", flexDirection: "column", alignItems: "center", minWidth: 74,
                }}
              >
                <span className="mono" style={{ fontSize: 10, opacity: 0.75 }}>D{d.day}</span>
                <span style={{ fontWeight: 500 }}>{d.day === 119 ? "kickoff" : d.day === 133 ? "red team" : d.day === 140 ? "evals" : d.day === 147 ? "observability" : d.day === 154 ? "staging" : d.day === 161 ? "production" : d.day === 176 ? "hardening" : d.day === 177 ? "gates" : d.day === 178 ? "ship" : "demo day"}</span>
              </Link>
              {i < capstone.length - 1 && <span className="mono text-muted">→</span>}
            </span>
          ))}
        </div>
      </section>

      {/* all build days by phase */}
      {phases.map((p) => {
        const builds = buildDays.filter((d) => d.day >= p.days[0] && d.day <= p.days[1]);
        if (!builds.length) return null;
        return (
          <section key={p.id} style={{ marginBottom: "var(--space-6)" }}>
            <h3 style={{ marginBottom: "var(--space-3)" }}>{p.n} — {p.name}</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "var(--space-3)" }}>
              {builds.map((d) => {
                const pct = rubricPct(d.id, d.project.rubric.length);
                return (
                  <Link key={d.id} href={`/day/${d.id}`} className="blueprint zh-cell" style={{ padding: "var(--space-4)", textDecoration: "none", color: "inherit", display: "block" }}>
                    <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                      <span className="kicker" style={{ fontSize: 10 }}>day {d.day} · {d.kind === "review" ? "weekly checkpoint" : "project day"}</span>
                      <span className="mono text-muted" style={{ fontSize: 10 }}>{done.has(d.id) ? "✓ done" : `rubric ${pct}%`}</span>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4, fontFamily: "var(--font-heading)" }}>{d.project.title}</div>
                    <p className="text-muted" style={{ fontSize: 12.5, margin: 0, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {d.project.brief.replace(/[`*~#]/g, "").slice(0, 220)}
                    </p>
                    <div style={{ height: 4, background: "var(--color-neutral-200)", marginTop: 10 }}>
                      <i style={{ display: "block", height: "100%", width: `${done.has(d.id) ? 100 : pct}%`, background: "var(--color-accent)" }} />
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
