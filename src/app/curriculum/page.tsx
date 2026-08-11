import Link from "next/link";
import { phases, allDays, PROGRAM_DAYS } from "@/lib/curriculum";

export const metadata = { title: "Curriculum — AI Engineer / 180" };

const KIND_ICON = { lesson: "", review: " ◪", project: " ⚒" } as const;

export default function CurriculumPage() {
  return (
    <div className="page" style={{ maxWidth: 1100 }}>
      <div className="kicker" style={{ marginBottom: "var(--space-2)" }}>
        9 phases · 26 weeks · {PROGRAM_DAYS} days · ◪ weekly review · ⚒ project day
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-4)", flexWrap: "wrap" }}>
        <h1 style={{ marginBottom: "var(--space-2)" }}>The curriculum</h1>
        <Link href="/map" className="btn btn-secondary" style={{ fontSize: 13 }}>View the dependency map →</Link>
      </div>
      <p className="text-muted" style={{ maxWidth: "70ch", marginBottom: "var(--space-6)" }}>
        Sequenced so nothing is assumed before it's taught. Every 7th day is a review checkpoint with
        spaced repetition and a shipped mini-project; the capstone thread starts on Day 119 and runs to
        Demo Day. Full design rationale lives in the repo's <code className="mono">docs/curriculum-outline.md</code>.
      </p>
      {phases.map((p) => {
        const days = allDays.filter((d) => d.day >= p.days[0] && d.day <= p.days[1]);
        return (
          <section key={p.id} id={p.id} style={{ marginBottom: "var(--space-8)", scrollMarginTop: 80 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-3)", borderBottom: "1px solid var(--color-divider)", paddingBottom: "var(--space-2)", marginBottom: "var(--space-2)" }}>
              <span className="kicker">{p.n}</span>
              <h3 style={{ margin: 0 }}>{p.name}</h3>
              <span className="text-muted mono" style={{ marginLeft: "auto", fontSize: 11 }}>days {p.days[0]}–{p.days[1]} · weeks {p.weeks[0]}–{p.weeks[1]}</span>
            </div>
            <p className="text-muted" style={{ fontSize: 13.5, marginBottom: "var(--space-3)" }}>{p.blurb}</p>
            <div>
              {days.map((d) => (
                <Link key={d.id} href={`/day/${d.id}`} className="zh-row" style={{ display: "flex", gap: "var(--space-4)", alignItems: "baseline", padding: "7px 8px", textDecoration: "none", color: "inherit", borderBottom: "1px solid color-mix(in srgb, var(--color-divider) 50%, transparent)" }}>
                  <span className="mono text-muted" style={{ fontSize: 11, width: 34, flexShrink: 0 }}>D{d.day}</span>
                  <span style={{ fontSize: 14.5, fontWeight: 500 }}>
                    {d.title}
                    <span className="text-muted">{KIND_ICON[d.kind]}</span>
                  </span>
                  <span className="text-muted" style={{ fontSize: 12.5, marginLeft: "auto", textAlign: "right" }}>{d.analogy}</span>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
