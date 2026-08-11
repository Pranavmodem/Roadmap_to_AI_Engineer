"use client";

import Link from "next/link";
import { useJourney } from "@/lib/store";
import { allDays, phases, getDayByNumber, PROGRAM_DAYS, dayId } from "@/lib/curriculum";
import { summarizeProgress } from "@/lib/progress";
import { authEnabled } from "@/lib/supabase";

export default function Dashboard() {
  const hydrated = useJourney((s) => s.hasHydrated);
  const completedDays = useJourney((s) => s.completedDays);
  const quizScores = useJourney((s) => s.quizScores);
  const startDate = useJourney((s) => s.startDate);
  const activityDates = useJourney((s) => s.activityDates);
  const srs = useJourney((s) => s.srs);
  const startJourney = useJourney((s) => s.startJourney);
  const authUser = useJourney((s) => s.authUser);
  const authReady = useJourney((s) => s.authReady);

  const completed = hydrated ? completedDays : [];
  const done = new Set(completed);
  const s = summarizeProgress(completed, hydrated ? quizScores : {}, hydrated ? startDate : null, hydrated ? activityDates : [], hydrated ? srs : {});

  // "current" day = first incomplete day (self-paced), capped by calendar
  const firstIncomplete = allDays.find((d) => !done.has(d.id))?.day ?? PROGRAM_DAYS;
  const today = getDayByNumber(firstIncomplete)!;

  return (
    <div className="page" style={{ display: "flex", flexDirection: "column", gap: "var(--space-8)", maxWidth: 1560 }}>
      {authEnabled && authReady && !authUser && (
        <div className="blueprint" style={{ padding: "var(--space-4) var(--space-6)", display: "flex", alignItems: "center", gap: "var(--space-4)", flexWrap: "wrap" }}>
          <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />
          <span style={{ fontSize: 14 }}>
            You're browsing as a <b>guest</b> — progress saves to this browser only. A free account syncs
            your 180 days, quiz mastery, flashcard schedule, and notes across devices (and merges what
            you've done here).
          </span>
          <span style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
            <Link href="/signup" className="btn btn-primary">Create account</Link>
            <Link href="/login" className="btn btn-secondary">Log in</Link>
          </span>
        </div>
      )}

      {/* hero */}
      <section className="hero-grid">
        <div>
          <div className="kicker" style={{ marginBottom: "var(--space-3)" }}>
            180 days — 2 hours a day — beginner → AI Engineer & FDE
          </div>
          <h1 className="h-display" style={{ lineHeight: 0.95, margin: "0 0 var(--space-4)" }}>
            DAY {today.day} <span style={{ color: "var(--color-neutral-500)" }}>/ {PROGRAM_DAYS}</span>
          </h1>
          <p style={{ fontSize: 17, lineHeight: 1.55, maxWidth: "54ch", margin: "0 0 var(--space-6)", color: "var(--color-neutral-800)" }}>
            {startDate ? (
              <>Up next: <b>{today.title}</b> — {today.analogy}. {s.dueCards > 0 && <>Plus <b>{s.dueCards} flashcards</b> due for review.</>}</>
            ) : (
              "Your 180-day run from zero to forward-deployed hasn't started yet. Day 1 is one click away — two focused hours, runnable code, one shipped artifact."
            )}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", maxWidth: 660 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--font-heading)", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-neutral-700)" }}>
              <span>Program mastery — completion + quiz accuracy</span>
              <span>{s.programMastery}%</span>
            </div>
            <div style={{ position: "relative", height: 12, background: "var(--color-neutral-200)", border: "1px solid var(--color-divider)" }}>
              <i style={{ position: "absolute", inset: "0 auto 0 0", width: `${s.programMastery}%`, background: "var(--color-accent)", transition: "width .4s" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: "var(--space-2)" }}>
              <Stat v={`${s.streak}d`} l="streak" />
              <Stat v={`${s.xp}`} l="XP" />
              <Stat v={`${s.hoursLogged}h`} l="hours logged" />
              <Stat v={`${s.completedCount}/${s.totalDays}`} l="days done" />
              <Stat v={`${s.dueCards}`} l="cards due" />
            </div>
          </div>

          <div style={{ marginTop: "var(--space-6)", display: "flex", gap: "var(--space-3)", flexWrap: "wrap" }}>
            {startDate ? (
              <Link href={`/day/${today.id}`} className="btn btn-primary" style={{ fontSize: 15, padding: "10px 22px" }}>
                Start Day {today.day} →
              </Link>
            ) : (
              <Link href={`/day/${dayId(1)}`} className="btn btn-primary" style={{ fontSize: 15, padding: "10px 22px" }} onClick={() => startJourney()}>
                Begin Day 1
              </Link>
            )}
            {s.dueCards > 0 && <Link href="/review" className="btn btn-secondary" style={{ fontSize: 15 }}>Review {s.dueCards} cards</Link>}
            <Link href="/curriculum" className="btn btn-secondary" style={{ fontSize: 15 }}>Browse curriculum</Link>
          </div>

          {/* revision recommendations */}
          {s.revisions.length > 0 && (
            <div className="blueprint" style={{ marginTop: "var(--space-6)", padding: "var(--space-4)" }}>
              <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />
              <div className="kicker" style={{ marginBottom: 8 }}>Recommended revision — your quizzes point here</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {s.revisions.map((r) => (
                  <Link key={r.day.id} href={`/day/${r.day.id}`} className="zh-row" style={{ display: "flex", gap: 10, padding: "4px 6px", textDecoration: "none", color: "inherit", fontSize: 13 }}>
                    <span className="mono tag tag-outline" style={{ fontSize: 10 }}>D{r.day.day}</span>
                    <span style={{ fontWeight: 500 }}>{r.day.title}</span>
                    <span className="text-muted" style={{ fontSize: 12 }}>— {r.reason}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 180-day grid */}
        <figure className="blueprint" style={{ margin: 0, padding: "var(--space-6)" }}>
          <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />
          <div className="kicker" style={{ marginBottom: "var(--space-3)" }}>The {PROGRAM_DAYS} days</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(14, 1fr)", gap: 3 }}>
            {allDays.map((d) => {
              const isDone = done.has(d.id);
              const isCurrent = startDate && d.day === today.day;
              return (
                <Link
                  key={d.id}
                  href={`/day/${d.id}`}
                  title={`Day ${d.day}: ${d.title}${d.kind !== "lesson" ? ` (${d.kind})` : ""}`}
                  className="zh-cell"
                  style={{
                    aspectRatio: "1", display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 8.5, fontFamily: "ui-monospace,monospace", textDecoration: "none",
                    border: d.kind === "review" ? "1px dashed var(--color-accent-600)" : "1px solid var(--color-divider)",
                    background: isDone ? "var(--color-accent)" : isCurrent ? "var(--color-accent-300)" : d.kind === "project" ? "color-mix(in srgb, var(--color-accent) 10%, var(--color-surface))" : "var(--color-surface)",
                    color: isDone ? "var(--color-bg)" : "var(--color-text)",
                    outline: isCurrent ? "2px solid var(--color-accent-700)" : "none",
                  }}
                >
                  {d.day}
                </Link>
              );
            })}
          </div>
          <figcaption style={{ marginTop: "var(--space-3)" }}>
            filled = complete · outlined = up next · dashed border = weekly review · tinted = project day
          </figcaption>
        </figure>
      </section>

      {/* phases */}
      <section>
        <h2 style={{ marginBottom: "var(--space-4)" }}>Nine phases, one arc</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(330px, 1fr))", gap: "var(--space-4)" }}>
          {s.phaseMastery.map((pm) => {
            const p = pm.phase;
            const inPhase = allDays.filter((d) => d.day >= p.days[0] && d.day <= p.days[1]);
            return (
              <div key={p.id} className="blueprint" style={{ padding: "var(--space-4)", opacity: pm.unlocked ? 1 : 0.55 }}>
                <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span className="kicker">{p.n} · days {p.days[0]}–{p.days[1]}</span>
                  <span className="tag tag-outline mono" style={{ fontSize: 10 }} title="Phase mastery: 60% completion + 40% quiz accuracy">{pm.mastery}%</span>
                </div>
                <h4 style={{ margin: "4px 0 4px" }}>{pm.unlocked ? "" : "🔒 "}{p.name}</h4>
                <p className="text-muted" style={{ fontSize: 12.5, marginBottom: "var(--space-2)" }}>{p.blurb}</p>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: "var(--space-3)" }}>
                  {p.skills.map((sk) => <span key={sk} className="tag tag-neutral" style={{ fontSize: 10 }}>{sk}</span>)}
                </div>
                <div style={{ height: 6, background: "var(--color-neutral-200)", border: "1px solid var(--color-divider)", marginBottom: 4 }}>
                  <i style={{ display: "block", height: "100%", width: `${pm.completionPct}%`, background: "var(--color-accent)" }} />
                </div>
                <div className="text-muted mono" style={{ fontSize: 10, marginBottom: "var(--space-3)" }}>
                  {pm.completedCount}/{pm.totalDays} days · quiz {pm.quizPct == null ? "—" : `${pm.quizPct}%`}
                </div>
                <div style={{ display: "flex", flexDirection: "column", maxHeight: 210, overflowY: "auto" }}>
                  {inPhase.map((d) => (
                    pm.unlocked ? (
                      <Link key={d.id} href={`/day/${d.id}`} className="zh-row" style={{ display: "flex", gap: 8, padding: "3px 6px", textDecoration: "none", color: "inherit", fontSize: 12.5 }}>
                        <span className="mono text-muted" style={{ fontSize: 10, width: 30, flexShrink: 0 }}>{d.day}</span>
                        <span style={{ textDecoration: done.has(d.id) ? "line-through" : "none", color: done.has(d.id) ? "var(--color-neutral-500)" : "inherit", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {done.has(d.id) ? "■" : d.kind === "review" ? "◪" : "□"} {d.title}
                        </span>
                      </Link>
                    ) : (
                      <span key={d.id} className="text-muted" style={{ display: "flex", gap: 8, padding: "3px 6px", fontSize: 12.5 }}>
                        <span className="mono" style={{ fontSize: 10, width: 30, flexShrink: 0 }}>{d.day}</span>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>□ {d.title}</span>
                      </span>
                    )
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Stat({ v, l }: { v: string; l: string }) {
  return (
    <div style={{ border: "1px solid var(--color-divider)", background: "var(--color-surface)", padding: "var(--space-2) var(--space-3)" }}>
      <div style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 20 }}>{v}</div>
      <div className="text-muted" style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>{l}</div>
    </div>
  );
}
