"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { searchDays } from "@/lib/curriculum";
import { useJourney } from "@/lib/store";

function SearchInner() {
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const hydrated = useJourney((s) => s.hasHydrated);
  const bookmarks = useJourney((s) => s.bookmarks);
  const results = useMemo(() => searchDays(q), [q]);

  return (
    <div className="page" style={{ maxWidth: 900 }}>
      <div className="kicker" style={{ marginBottom: "var(--space-2)" }}>full-text search over all 180 days</div>
      <h1 style={{ marginBottom: "var(--space-4)" }}>Search</h1>
      <input
        className="input"
        type="search"
        autoFocus
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder='Try "backprop", "prompt injection", "confidence interval", "SAML"…'
        aria-label="Search the curriculum"
        style={{ fontSize: 15, marginBottom: "var(--space-4)" }}
      />
      {q.trim().length >= 2 && (
        <p className="text-muted" style={{ fontSize: 12.5, marginBottom: "var(--space-3)" }}>
          {results.length === 0 ? "No matches — try a broader term." : `${results.length} matching day${results.length === 1 ? "" : "s"}`}
        </p>
      )}
      <div style={{ display: "flex", flexDirection: "column" }}>
        {results.map(({ day, hit }) => (
          <Link key={day.id} href={`/day/${day.id}`} className="zh-row" style={{ display: "flex", flexDirection: "column", gap: 3, padding: "10px 8px", textDecoration: "none", color: "inherit", borderBottom: "1px solid color-mix(in srgb, var(--color-divider) 50%, transparent)" }}>
            <span style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
              <span className="mono tag tag-outline" style={{ fontSize: 10 }}>D{day.day}</span>
              <span style={{ fontWeight: 600, fontSize: 15 }}>{day.title}</span>
              <span className="text-muted" style={{ fontSize: 12 }}>{day.analogy}</span>
            </span>
            <span className="text-muted" style={{ fontSize: 12.5, paddingLeft: 2 }}>{hit}</span>
          </Link>
        ))}
      </div>

      {hydrated && bookmarks.length > 0 && !q.trim() && (
        <section style={{ marginTop: "var(--space-6)" }}>
          <h3 style={{ marginBottom: "var(--space-3)" }}>★ Your bookmarks</h3>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {bookmarks.map((id) => (
              <Link key={id} href={`/day/${id}`} className="tag tag-accent" style={{ textDecoration: "none" }}>
                {id.replace("d", "Day ").replace(/^Day 0+/, "Day ")}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="page text-muted">Loading search…</div>}>
      <SearchInner />
    </Suspense>
  );
}
