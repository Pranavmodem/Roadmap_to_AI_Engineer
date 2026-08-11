"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { allDays, phases } from "@/lib/curriculum";
import { useJourney } from "@/lib/store";

/**
 * SVG dependency map. Days are dots laid out on a week grid (26 columns);
 * prerequisite edges draw as curves. Hovering a day lights its upstream
 * (prereq) and downstream (unlocked) neighborhoods.
 */

const PHASE_HUES = ["#5980a6", "#728fab", "#8a6fa6", "#a66f8a", "#6fa687", "#a6905f", "#5f8aa6", "#a65f5f", "#6f7ba6"];

export default function DependencyMap() {
  const router = useRouter();
  const [hover, setHover] = useState<number | null>(null);
  const hydrated = useJourney((s) => s.hasHydrated);
  const completedDays = useJourney((s) => s.completedDays);
  const done = useMemo(() => new Set(hydrated ? completedDays : []), [hydrated, completedDays]);

  const W = 1240, ROWH = 34, TOP = 46, LEFT = 60;
  const COLW = (W - LEFT - 20) / 26;

  const pos = useMemo(() => {
    const m = new Map<number, { x: number; y: number }>();
    for (const d of allDays) {
      const col = d.week - 1;
      const row = (d.day - 1) % 7;
      m.set(d.day, { x: LEFT + col * COLW + COLW / 2, y: TOP + row * ROWH + ROWH / 2 });
    }
    return m;
  }, [COLW]);

  const edges = useMemo(
    () => allDays.flatMap((d) => d.prereqs.map((p) => ({ from: p.day, to: d.day }))),
    []
  );

  const upstream = useMemo(() => {
    if (hover == null) return new Set<number>();
    const s = new Set<number>();
    const walk = (n: number) => {
      const d = allDays.find((x) => x.day === n);
      d?.prereqs.forEach((p) => {
        if (!s.has(p.day)) { s.add(p.day); walk(p.day); }
      });
    };
    walk(hover);
    return s;
  }, [hover]);

  const downstream = useMemo(() => {
    if (hover == null) return new Set<number>();
    return new Set(edges.filter((e) => e.from === hover).map((e) => e.to));
  }, [hover, edges]);

  const H = TOP + 7 * ROWH + 20;
  const hoverDay = hover != null ? allDays.find((d) => d.day === hover) : null;

  return (
    <div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: "var(--space-3)" }}>
        {phases.map((p, i) => (
          <span key={p.id} className="text-muted" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5 }}>
            <i style={{ width: 10, height: 10, borderRadius: "50%", background: PHASE_HUES[i], display: "inline-block" }} />
            {p.name}
          </span>
        ))}
      </div>
      <div style={{ overflowX: "auto", border: "1px solid var(--color-divider)", background: "var(--color-surface)" }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ minWidth: 900, width: "100%" }} role="img" aria-label="Curriculum dependency map">
          {/* week headers */}
          {Array.from({ length: 26 }, (_, i) => (
            <text key={i} x={LEFT + i * COLW + COLW / 2} y={22} textAnchor="middle" fontSize="9" fontFamily="ui-monospace,monospace" fill="var(--color-neutral-600)">
              w{i + 1}
            </text>
          ))}
          {/* edges */}
          {edges.map((e, i) => {
            const a = pos.get(e.from), b = pos.get(e.to);
            if (!a || !b) return null;
            const active = hover != null && (e.to === hover || e.from === hover || (upstream.has(e.from) && (upstream.has(e.to) || e.to === hover)));
            const isDown = hover != null && e.from === hover;
            if (hover != null && !active && !isDown) return null; // declutter on hover
            const mx = (a.x + b.x) / 2;
            const bend = Math.min(60, Math.abs(b.x - a.x) / 4) * (a.y < b.y ? 1 : -1);
            return (
              <path
                key={i}
                d={`M${a.x},${a.y} Q${mx},${(a.y + b.y) / 2 + bend} ${b.x},${b.y}`}
                fill="none"
                stroke={active || isDown ? "var(--color-accent)" : "color-mix(in srgb, var(--color-text) 10%, transparent)"}
                strokeWidth={active || isDown ? 1.8 : 0.7}
                strokeDasharray={isDown ? "4 3" : undefined}
              />
            );
          })}
          {/* nodes */}
          {allDays.map((d) => {
            const p = pos.get(d.day)!;
            const phaseIdx = phases.findIndex((ph) => d.day >= ph.days[0] && d.day <= ph.days[1]);
            const isHover = hover === d.day;
            const lit = hover == null || isHover || upstream.has(d.day) || downstream.has(d.day);
            return (
              <g
                key={d.id}
                onMouseEnter={() => setHover(d.day)}
                onMouseLeave={() => setHover(null)}
                onClick={() => router.push(`/day/${d.id}`)}
                style={{ cursor: "pointer" }}
              >
                <circle
                  cx={p.x} cy={p.y}
                  r={isHover ? 9 : d.kind === "review" ? 6.5 : 5.5}
                  fill={done.has(d.id) ? PHASE_HUES[phaseIdx] : "var(--color-bg)"}
                  stroke={PHASE_HUES[phaseIdx]}
                  strokeWidth={isHover ? 2.5 : d.kind === "review" ? 2 : 1.3}
                  opacity={lit ? 1 : 0.18}
                />
                {isHover && (
                  <text x={p.x} y={p.y - 14} textAnchor="middle" fontSize="10" fontWeight="600" fill="var(--color-text)">
                    D{d.day}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <div style={{ minHeight: 44, marginTop: "var(--space-3)" }}>
        {hoverDay ? (
          <p style={{ fontSize: 13.5, margin: 0 }}>
            <b>Day {hoverDay.day}: {hoverDay.title}</b>
            <span className="text-muted"> — {hoverDay.analogy}. Builds on {hoverDay.prereqs.length ? hoverDay.prereqs.map((p) => `D${p.day}`).join(", ") : "nothing (entry point)"}; unlocks {downstream.size} later day{downstream.size === 1 ? "" : "s"} directly. Click to open.</span>
          </p>
        ) : (
          <p className="text-muted" style={{ fontSize: 13, margin: 0 }}>Hover any dot. Larger ringed dots are weekly reviews; filled dots are days you've completed.</p>
        )}
      </div>
    </div>
  );
}
