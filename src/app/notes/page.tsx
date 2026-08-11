"use client";

import Link from "next/link";
import { getDay } from "@/lib/curriculum";
import { useJourney } from "@/lib/store";

/** All notes and saved code snippets, in one place. */
export default function NotesPage() {
  const hydrated = useJourney((s) => s.hasHydrated);
  const notes = useJourney((s) => s.notes);
  const snippets = useJourney((s) => s.snippets);
  const removeSnippet = useJourney((s) => s.removeSnippet);
  const bookmarks = useJourney((s) => s.bookmarks);

  const noteEntries = hydrated ? Object.entries(notes).sort() : [];
  const snips = hydrated ? snippets : [];
  const marks = hydrated ? bookmarks : [];

  return (
    <div className="page" style={{ maxWidth: 1000 }}>
      <div className="kicker" style={{ marginBottom: "var(--space-2)" }}>your notebook</div>
      <h1 style={{ marginBottom: "var(--space-2)" }}>Notes & snippets</h1>
      <p className="text-muted" style={{ maxWidth: "64ch", marginBottom: "var(--space-6)" }}>
        Day notes save automatically from each lesson page; code snippets arrive here via the
        “save” button on any code runner. Everything lives in your browser's storage.
      </p>

      {marks.length > 0 && (
        <section style={{ marginBottom: "var(--space-6)" }}>
          <h3 style={{ marginBottom: "var(--space-2)" }}>★ Bookmarked days</h3>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {marks.map((id) => {
              const d = getDay(id);
              return d ? (
                <Link key={id} href={`/day/${id}`} className="tag tag-accent" style={{ textDecoration: "none" }}>
                  D{d.day} · {d.title}
                </Link>
              ) : null;
            })}
          </div>
        </section>
      )}

      <section style={{ marginBottom: "var(--space-8)" }}>
        <h3 style={{ marginBottom: "var(--space-3)" }}>📝 Day notes {noteEntries.length > 0 && <span className="text-muted mono" style={{ fontSize: 12 }}>({noteEntries.length})</span>}</h3>
        {noteEntries.length === 0 ? (
          <p className="text-muted" style={{ fontSize: 13.5 }}>
            No notes yet — open any day and use “Add a note for this day”.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            {noteEntries.map(([dayId, text]) => {
              const d = getDay(dayId);
              return (
                <div key={dayId} className="blueprint" style={{ padding: "var(--space-4)" }}>
                  <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />
                  <div style={{ display: "flex", gap: 10, alignItems: "baseline", marginBottom: 6 }}>
                    {d ? (
                      <Link href={`/day/${dayId}`} className="kicker" style={{ textDecoration: "none" }}>Day {d.day} — {d.title}</Link>
                    ) : (
                      <span className="kicker">{dayId}</span>
                    )}
                  </div>
                  <p style={{ fontSize: 14, whiteSpace: "pre-wrap", margin: 0, lineHeight: 1.6 }}>{text}</p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h3 style={{ marginBottom: "var(--space-3)" }}>💾 Saved snippets {snips.length > 0 && <span className="text-muted mono" style={{ fontSize: 12 }}>({snips.length})</span>}</h3>
        {snips.length === 0 ? (
          <p className="text-muted" style={{ fontSize: 13.5 }}>
            Nothing saved yet — hit “save” on any code runner to keep a copy of your work here.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            {snips.map((s) => (
              <figure key={s.id} className="blueprint" style={{ margin: 0 }}>
                <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "var(--space-2) var(--space-3)", borderBottom: "1px solid var(--color-divider)" }}>
                  <span className="kicker" style={{ fontSize: 10 }}>{s.title}</span>
                  {s.dayId && getDay(s.dayId) && (
                    <Link href={`/day/${s.dayId}`} className="mono text-muted" style={{ fontSize: 10 }}>
                      D{getDay(s.dayId)!.day} ↗
                    </Link>
                  )}
                  <span className="mono text-muted" style={{ marginLeft: "auto", fontSize: 10 }}>{new Date(s.ts).toLocaleDateString()}</span>
                  <button className="btn btn-ghost" style={{ fontSize: 11, padding: "2px 6px" }} onClick={() => removeSnippet(s.id)} aria-label={`Delete snippet ${s.title}`}>
                    delete
                  </button>
                </div>
                <pre className="codeblock" style={{ margin: 0, border: "none", maxHeight: 300 }}>{s.code}</pre>
              </figure>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
