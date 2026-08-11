"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useJourney } from "@/lib/store";
import { getDay, nextDay, prevDay, phaseOfDay, unlocks, dayId, Day } from "@/lib/curriculum";
import { vizForKey } from "@/lib/viz";
import VizPlayer from "./VizPlayer";
import Markdownish from "./Markdownish";
import CodeRunner from "./CodeRunner";
import QuizBlock from "./QuizBlock";
import GuestNudge from "./GuestNudge";

const KIND_LABEL = { lesson: "Lesson", review: "Review & checkpoint", project: "Project day" } as const;

export default function DayView({ id }: { id: string }) {
  const day = getDay(id);
  const hydrated = useJourney((s) => s.hasHydrated);
  const mode = useJourney((s) => s.mode);
  const setMode = useJourney((s) => s.setMode);
  const completedDays = useJourney((s) => s.completedDays);
  const completeDay = useJourney((s) => s.completeDay);
  const uncompleteDay = useJourney((s) => s.uncompleteDay);
  const bookmarks = useJourney((s) => s.bookmarks);
  const toggleBookmark = useJourney((s) => s.toggleBookmark);
  const notes = useJourney((s) => s.notes);
  const setNote = useJourney((s) => s.setNote);
  const projectChecks = useJourney((s) => s.projectChecks);
  const toggleProjectCheck = useJourney((s) => s.toggleProjectCheck);

  const viz = useMemo(() => (day ? vizForKey(day.viz) : null), [day]);
  const [noteOpen, setNoteOpen] = useState(false);

  if (!day) return null;
  const phase = phaseOfDay(day.day);
  const activeMode = hydrated ? mode : "eli5";
  const isComplete = hydrated && completedDays.includes(day.id);
  const isBookmarked = hydrated && bookmarks.includes(day.id);
  const next = nextDay(id);
  const prev = prevDay(id);
  const forward = unlocks(day.day).slice(0, 4);
  const checks = (hydrated && projectChecks[day.id]) || [];
  const totalMin = day.schedule.reduce((s, a) => s + a.minutes, 0);

  return (
    <article className="page" style={{ maxWidth: 1160, display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      <GuestNudge />
      {/* breadcrumb */}
      <nav style={{ display: "flex", gap: 8, alignItems: "baseline", fontSize: 12, flexWrap: "wrap" }} className="text-muted" aria-label="Breadcrumb">
        <Link href="/dashboard">Dashboard</Link>
        <span>/</span>
        <Link href={`/curriculum#${phase.id}`}>{phase.n} — {phase.name}</Link>
        <span>/</span>
        <span>Day {day.day}</span>
        <span style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center" }}>
          <span className="tag tag-outline mono" style={{ fontSize: 10 }}>week {day.week}</span>
          <span className="tag tag-neutral mono" style={{ fontSize: 10 }}>{KIND_LABEL[day.kind]}</span>
          <button
            className="btn btn-ghost"
            onClick={() => toggleBookmark(day.id)}
            title={isBookmarked ? "Remove bookmark" : "Bookmark this day"}
            aria-pressed={isBookmarked}
            style={{ fontSize: 14, padding: "2px 6px" }}
          >
            {isBookmarked ? "★" : "☆"}
          </button>
        </span>
      </nav>

      {/* header */}
      <header>
        <div className="kicker" style={{ marginBottom: 4 }}>Day {day.day} · {day.analogy}</div>
        <h1 className="h-page" style={{ margin: "0 0 var(--space-3)" }}>{day.title}</h1>

        <div style={{ display: "flex", gap: "var(--space-6)", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 340px" }}>
            <div className="kicker" style={{ fontSize: 10, marginBottom: 6 }}>You will be able to</div>
            <ul style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 4, fontSize: 14, lineHeight: 1.5 }}>
              {day.objectives.map((o, i) => <li key={i}>{o}</li>)}
            </ul>
          </div>
          <div style={{ flex: "0 1 300px" }}>
            <div className="kicker" style={{ fontSize: 10, marginBottom: 6 }}>Today's ~{totalMin} minutes</div>
            <table className="table" style={{ fontSize: 12.5 }}>
              <tbody>
                {day.schedule.map((s, i) => (
                  <tr key={i}>
                    <td style={{ padding: "3px 6px" }}>{s.activity}</td>
                    <td className="mono text-muted" style={{ padding: "3px 6px", textAlign: "right", whiteSpace: "nowrap" }}>{s.minutes} min</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {day.prereqs.length > 0 && (
          <p className="text-muted" style={{ fontSize: 12.5, marginTop: "var(--space-3)", marginBottom: 0 }}>
            Builds on:{" "}
            {day.prereqs.map((p, i) => (
              <span key={p.day}>
                {i > 0 && " · "}
                <Link href={`/day/${dayId(p.day)}`}>Day {p.day} — {p.label}</Link>
              </span>
            ))}
          </p>
        )}
      </header>

      {/* explanation with ELI5/Tech toggle */}
      <section className="blueprint" style={{ padding: "var(--space-6)" }}>
        <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-4)", flexWrap: "wrap" }}>
          <span className="kicker">{activeMode === "eli5" ? "The analogy" : "The technical picture"}</span>
          <div className="seg" role="tablist" aria-label="Explanation mode" style={{ marginLeft: "auto" }}>
            {(["eli5", "tech"] as const).map((m) => (
              <label
                key={m}
                className="seg-opt"
                style={{ background: activeMode === m ? "var(--color-accent)" : "transparent", color: activeMode === m ? "var(--color-bg)" : "inherit", cursor: "pointer" }}
              >
                <input type="radio" name="day-mode" checked={activeMode === m} onChange={() => setMode(m)} />
                {m === "eli5" ? "🧸 ELI5" : "⚙ Tech"}
              </label>
            ))}
          </div>
        </div>
        <Markdownish text={activeMode === "eli5" ? day.eli5 : day.tech} size={activeMode === "eli5" ? 16 : 14.5} />
      </section>

      {/* why it matters */}
      <section style={{ borderLeft: "3px solid var(--color-accent)", padding: "var(--space-2) var(--space-4)" }}>
        <div className="kicker" style={{ fontSize: 10, marginBottom: 4 }}>Why this matters on the job</div>
        <Markdownish text={day.why} runnable={false} size={14} />
      </section>

      {/* visualizer */}
      {viz && <VizPlayer key={day.id} viz={viz} />}

      {/* guided exercises */}
      {day.guided.length > 0 && (
        <section>
          <h3 style={{ marginBottom: "var(--space-3)" }}>Guided practice</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            {day.guided.map((g, i) => (
              <div key={i} className="blueprint" style={{ padding: "var(--space-4)" }}>
                <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: "var(--space-3)" }}>
                  <span className="kicker" style={{ fontSize: 10 }}>guided {i + 1}</span>
                  <h4 style={{ margin: 0 }}>{g.title}</h4>
                  <span className="mono text-muted" style={{ marginLeft: "auto", fontSize: 11 }}>{g.minutes} min</span>
                </div>
                <Markdownish text={g.body} />
                {g.code && (
                  <div style={{ marginTop: "var(--space-3)" }}>
                    <CodeRunner initialCode={g.code} lang="python" dayId={day.id} title={`Day ${day.day} — ${g.title}`} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* independent practice */}
      {day.practice.length > 0 && (
        <section>
          <h3 style={{ marginBottom: "var(--space-3)" }}>On your own</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            {day.practice.map((p, i) => (
              <div key={i} style={{ border: "1px dashed var(--color-divider)", padding: "var(--space-4)" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: "var(--space-2)" }}>
                  <h4 style={{ margin: 0 }}>{p.title}</h4>
                  <span className="mono text-muted" style={{ marginLeft: "auto", fontSize: 11 }}>{p.minutes} min</span>
                </div>
                <Markdownish text={p.body} />
                {p.code && (
                  <div style={{ marginTop: "var(--space-3)" }}>
                    <CodeRunner initialCode={p.code} lang="python" dayId={day.id} title={`Day ${day.day} — ${p.title}`} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* project */}
      <section className="blueprint" style={{ padding: "var(--space-6)" }}>
        <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />
        <div className="kicker" style={{ marginBottom: 4 }}>{day.kind === "project" ? "Today's build" : "Ship before you stop"}</div>
        <h3 style={{ marginBottom: "var(--space-2)" }}>{day.project.title}</h3>
        <Markdownish text={day.project.brief} />
        <div className="kicker" style={{ fontSize: 10, margin: "var(--space-4) 0 6px" }}>Rubric — check what you completed ({checks.length}/{day.project.rubric.length})</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {day.project.rubric.map((r, i) => (
            <label key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13.5, cursor: "pointer", lineHeight: 1.5 }}>
              <input
                type="checkbox"
                checked={checks.includes(i)}
                onChange={() => toggleProjectCheck(day.id, i)}
                style={{ accentColor: "var(--color-accent)", marginTop: 3 }}
              />
              <span style={{ textDecoration: checks.includes(i) ? "line-through" : "none", opacity: checks.includes(i) ? 0.65 : 1 }}>{r}</span>
            </label>
          ))}
        </div>
      </section>

      {/* mistakes */}
      <section>
        <h3 style={{ marginBottom: "var(--space-3)" }}>Common mistakes & misconceptions</h3>
        <ul style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8, fontSize: 14, lineHeight: 1.6, color: "var(--color-neutral-800)" }}>
          {day.mistakes.map((m, i) => <li key={i}>{m}</li>)}
        </ul>
      </section>

      {/* quiz */}
      <QuizBlock key={day.id} day={day} />

      {/* resources */}
      <section>
        <h3 style={{ marginBottom: "var(--space-3)" }}>Go deeper — curated resources</h3>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {day.resources.map((r, i) => (
            <a
              key={i}
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="zh-row"
              style={{ display: "flex", gap: 12, alignItems: "baseline", padding: "8px 8px", textDecoration: "none", color: "inherit", borderBottom: "1px solid color-mix(in srgb, var(--color-divider) 50%, transparent)" }}
            >
              <span className="tag tag-neutral mono" style={{ fontSize: 9.5, minWidth: 52, justifyContent: "center" }}>{r.type}</span>
              <span style={{ fontSize: 14, fontWeight: 500, color: "var(--color-accent)" }}>{r.label} ↗</span>
              <span className="mono text-muted" style={{ marginLeft: "auto", fontSize: 11, whiteSpace: "nowrap" }}>{r.time}</span>
            </a>
          ))}
        </div>
        {day.deepDive && day.deepDive.length > 0 && (
          <div style={{ marginTop: "var(--space-3)" }}>
            <div className="kicker" style={{ fontSize: 10, marginBottom: 6 }}>If you have a third hour</div>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, display: "flex", flexDirection: "column", gap: 4 }} className="text-muted">
              {day.deepDive.map((d, i) => (
                <li key={i}>
                  {d.url ? <a href={d.url} target="_blank" rel="noopener noreferrer">{d.label} ↗</a> : <b>{d.label}</b>}
                  {d.note && <> — {d.note}</>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* completion + connections */}
      <section className="cols-2" style={{ gap: "var(--space-4)" }}>
        <div style={{ border: "1px solid var(--color-divider)", padding: "var(--space-4)" }}>
          <div className="kicker" style={{ fontSize: 10, marginBottom: 8 }}>Done means</div>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13.5, display: "flex", flexDirection: "column", gap: 5 }}>
            {day.completion.map((c, i) => <li key={i}>{c}</li>)}
          </ul>
        </div>
        <div style={{ border: "1px solid var(--color-divider)", padding: "var(--space-4)" }}>
          <div className="kicker" style={{ fontSize: 10, marginBottom: 8 }}>How this connects</div>
          <p style={{ fontSize: 13.5, marginBottom: 8 }}><b>← Back:</b> {day.connections.back}</p>
          <p style={{ fontSize: 13.5, marginBottom: forward.length ? 8 : 0 }}><b>Forward →:</b> {day.connections.forward}</p>
          {forward.length > 0 && (
            <p className="text-muted" style={{ fontSize: 12, margin: 0 }}>
              Unlocks:{" "}
              {forward.map((f, i) => (
                <span key={f.id}>
                  {i > 0 && " · "}
                  <Link href={`/day/${f.id}`}>D{f.day} {f.title}</Link>
                </span>
              ))}
            </p>
          )}
        </div>
      </section>

      {/* notes */}
      <section style={{ border: "1px dashed var(--color-divider)", padding: "var(--space-4)" }}>
        <button
          className="btn btn-ghost"
          onClick={() => setNoteOpen(!noteOpen)}
          aria-expanded={noteOpen}
          style={{ padding: 0, fontSize: 13 }}
        >
          📝 {noteOpen ? "Hide" : (hydrated && notes[day.id]) ? "Edit your notes" : "Add a note for this day"}
        </button>
        {noteOpen && (
          <textarea
            className="input"
            value={(hydrated && notes[day.id]) || ""}
            onChange={(e) => setNote(day.id, e.target.value)}
            placeholder="What clicked? What's still fuzzy? Notes save automatically and appear on the Notes page."
            rows={5}
            style={{ marginTop: 10, fontFamily: "var(--font-body)" }}
            aria-label={`Notes for day ${day.day}`}
          />
        )}
      </section>

      {/* footer nav */}
      <footer style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", borderTop: "1px solid var(--color-divider)", paddingTop: "var(--space-4)" }}>
        {prev && <Link href={`/day/${prev.id}`} className="btn btn-secondary">← D{prev.day}: {prev.title}</Link>}
        <button
          className={isComplete ? "btn btn-secondary" : "btn btn-primary"}
          onClick={() => (isComplete ? uncompleteDay(day.id) : completeDay(day.id))}
          style={{ marginLeft: "auto" }}
        >
          {isComplete ? "✓ Completed — undo" : "Mark day complete (+50 XP)"}
        </button>
        {next && <Link href={`/day/${next.id}`} className="btn btn-secondary">D{next.day}: {next.title} →</Link>}
      </footer>
    </article>
  );
}
