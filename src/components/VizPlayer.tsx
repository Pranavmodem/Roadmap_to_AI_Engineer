"use client";

import { useEffect, useRef, useState } from "react";
import { LessonViz, Frame, Predict } from "@/lib/viz";

/**
 * Plays a lesson's step-script. Twelve render families share one player:
 * bars, cells, nodes, vstack, hqueue, buckets, graph, matrix, panels,
 * objects, chart, flow. Frames may carry a predict challenge {q,a,b,t} —
 * playback pauses there until the learner commits an answer.
 */
export default function VizPlayer({ viz }: { viz: LessonViz }) {
  const frames = viz.frames;
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [predictMode, setPredictMode] = useState(false);
  const [answered, setAnswered] = useState<Record<number, "right" | "wrong">>({});
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const frame = frames[Math.min(idx, frames.length - 1)] as Frame;
  const predict = frame.predict as Predict | undefined;
  const needsAnswer = predictMode && !!predict && !answered[idx];

  useEffect(() => {
    if (!playing) return;
    timer.current = setInterval(() => {
      setIdx((i) => {
        const f = frames[i] as Frame;
        if (predictMode && f.predict && !answered[i]) {
          setPlaying(false);
          return i;
        }
        if (i >= frames.length - 1) {
          setPlaying(false);
          return i;
        }
        return i + 1;
      });
    }, 1600 / speed);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [playing, speed, frames, answered, predictMode]);

  const goto = (i: number) => {
    setPlaying(false);
    setIdx(Math.max(0, Math.min(frames.length - 1, i)));
  };

  const answer = (first: boolean) => {
    if (!predict) return;
    setAnswered((a) => ({ ...a, [idx]: first === predict.t ? "right" : "wrong" }));
  };

  return (
    <figure className="blueprint" style={{ margin: 0, background: "var(--color-bg)" }}>
      <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />
      <div style={{ padding: "var(--space-4) var(--space-6)", borderBottom: "1px solid var(--color-divider)", display: "flex", alignItems: "baseline", gap: "var(--space-3)" }}>
        <span className="kicker">Watch it happen</span>
        <h4 style={{ margin: 0 }}>{viz.title}</h4>
        <span className="text-muted mono" style={{ marginLeft: "auto", fontSize: 11 }}>
          step {idx + 1} / {frames.length}
        </span>
      </div>

      <div className="viz-stage">
        <FamilyRenderer family={viz.family} frame={frame} />
      </div>

      <div style={{ padding: "var(--space-3) var(--space-6)", borderTop: "1px solid var(--color-divider)" }}>
        <p className="viz-msg" style={{ margin: 0 }}>
          {frame.msg}
          {frame.caption && (
            <span className="text-muted mono" style={{ display: "block", fontSize: 11, marginTop: 4 }}>
              {frame.caption as string}
            </span>
          )}
        </p>
      </div>

      {predictMode && predict && (
        <div style={{ padding: "var(--space-3) var(--space-6)", borderTop: "1px dashed var(--color-divider)", display: "flex", alignItems: "center", gap: "var(--space-3)", flexWrap: "wrap", background: "color-mix(in srgb, var(--color-accent) 6%, transparent)" }}>
          <span className="kicker">Predict</span>
          <span style={{ fontSize: 13.5 }}>{predict.q}</span>
          {answered[idx] ? (
            <span className={`tag ${answered[idx] === "right" ? "tag-accent" : "tag-neutral"}`}>
              {answered[idx] === "right" ? "✓ Called it" : `✗ It's: ${predict.t ? predict.a : predict.b}`}
            </span>
          ) : (
            <span style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-secondary" onClick={() => answer(true)}>{predict.a}</button>
              <button className="btn btn-secondary" onClick={() => answer(false)}>{predict.b}</button>
            </span>
          )}
        </div>
      )}

      <div style={{ padding: "var(--space-3) var(--space-6)", borderTop: "1px solid var(--color-divider)", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <button className="btn btn-secondary" onClick={() => goto(0)} aria-label="Reset">⏮</button>
        <button className="btn btn-secondary" onClick={() => goto(idx - 1)} disabled={idx === 0} aria-label="Step back">◀</button>
        {playing ? (
          <button className="btn btn-primary" onClick={() => setPlaying(false)}>Pause</button>
        ) : (
          <button
            className="btn btn-primary"
            onClick={() => { if (idx >= frames.length - 1) setIdx(0); setPlaying(true); }}
            disabled={needsAnswer}
            title={needsAnswer ? "Answer the prediction first" : undefined}
          >
            Play
          </button>
        )}
        <button className="btn btn-secondary" onClick={() => goto(idx + 1)} disabled={idx >= frames.length - 1 || needsAnswer} aria-label="Step forward">▶</button>
        <label
          style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, fontSize: 12, cursor: "pointer" }}
          className="text-muted"
          title="Pause at challenge points and call what happens next"
        >
          <input type="checkbox" checked={predictMode} onChange={(e) => setPredictMode(e.target.checked)} style={{ accentColor: "var(--color-accent)" }} />
          🎯 Predict mode
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }} className="text-muted">
          speed
          <input type="range" min={0.5} max={3} step={0.5} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} style={{ accentColor: "var(--color-accent)", width: 90 }} />
          <span className="mono">{speed}×</span>
        </label>
      </div>
    </figure>
  );
}

/* ───────────────────────── family renderers ───────────────────────── */

function FamilyRenderer({ family, frame }: { family: string; frame: Frame }) {
  switch (family) {
    case "bars": return <Bars f={frame} />;
    case "cells": return <Cells f={frame} />;
    case "nodes": return <NodesChain f={frame} />;
    case "vstack": return <VStack f={frame} />;
    case "hqueue": return <HQueue f={frame} />;
    case "buckets": return <Buckets f={frame} />;
    case "graph": return <Graph f={frame} />;
    case "matrix": return <Matrix f={frame} />;
    case "panels": return <Panels f={frame} />;
    case "chart": return <Chart f={frame} />;
    case "flow": return <Flow f={frame} />;
    default: return <div className="text-muted" style={{ textAlign: "center" }}>—</div>;
  }
}

const box: React.CSSProperties = {
  border: "1px solid var(--color-divider)",
  background: "var(--color-bg)",
  fontFamily: "ui-monospace, Menlo, monospace",
  transition: "all .25s",
};

function Bars({ f }: { f: Frame }) {
  const arr = (f.arr as number[]) ?? [];
  const hi = (f.hi as number[]) ?? [];
  const lock = new Set((f.lock as number[]) ?? []);
  const act = !!f.act;
  const pivot = f.pivot as number | null | undefined;
  const max = Math.max(1, ...arr);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 6, height: 220 }}>
      {arr.map((v, i) => {
        const state = lock.has(i) ? "lock" : hi.includes(i) ? (act ? "swap" : "cmp") : "idle";
        const bg =
          state === "lock" ? "var(--color-accent-700)"
          : state === "swap" ? "var(--color-accent)"
          : state === "cmp" ? "var(--color-accent-300)"
          : "var(--color-neutral-300)";
        return (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, width: 34 }}>
            {pivot === i && <span style={{ fontSize: 10 }}>▼</span>}
            <div style={{ width: "100%", height: Math.round((v / max) * 170), background: bg, transition: "height .25s, background .25s" }} />
            <span className="mono" style={{ fontSize: 11, color: state === "idle" ? "var(--color-neutral-700)" : "var(--color-text)" }}>{v}</span>
          </div>
        );
      })}
    </div>
  );
}

function Cells({ f }: { f: Frame }) {
  const cells = (f.cells as { v: unknown; i?: string | number; tag?: string; s?: string }[]) ?? [];
  return (
    <div style={{ display: "flex", justifyContent: "center", gap: 4, flexWrap: "wrap" }}>
      {cells.map((c, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
          <span className="kicker" style={{ fontSize: 9, minHeight: 12, color: "var(--color-accent)" }}>{c.tag ?? ""}</span>
          <div
            style={{
              ...box,
              minWidth: 44,
              padding: "10px 6px",
              textAlign: "center",
              fontSize: 13,
              opacity: c.s === "off" ? 0.3 : 1,
              background: c.s === "hot" ? "var(--color-accent)" : c.s === "on" ? "color-mix(in srgb, var(--color-accent) 16%, var(--color-bg))" : "var(--color-bg)",
              color: c.s === "hot" ? "var(--color-bg)" : "var(--color-text)",
              borderColor: c.s === "hot" ? "var(--color-accent)" : "var(--color-divider)",
            }}
          >
            {String(c.v)}
          </div>
          <span className="mono text-muted" style={{ fontSize: 9 }}>{c.i ?? i}</span>
        </div>
      ))}
    </div>
  );
}

function NodesChain({ f }: { f: Frame }) {
  const nodes = (f.nodes as (string | number)[]) ?? [];
  const hi = (f.hi as number[]) ?? [];
  const back = !!f.back;
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, flexWrap: "wrap" }}>
      <span className="tag tag-outline mono">head</span>
      <Arrow back={back} />
      {nodes.map((v, i) => (
        <span key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              ...box,
              padding: "8px 12px",
              fontSize: 13,
              background: hi.includes(i) ? "var(--color-accent)" : "var(--color-bg)",
              color: hi.includes(i) ? "var(--color-bg)" : "var(--color-text)",
            }}
          >
            {String(v)}
          </span>
          <Arrow back={back} />
        </span>
      ))}
      <span className="mono text-muted" style={{ fontSize: 12 }}>null</span>
    </div>
  );
}

function Arrow({ back }: { back: boolean }) {
  return <span className="mono text-muted" style={{ fontSize: 12 }}>{back ? "⇄" : "→"}</span>;
}

function VStack({ f }: { f: Frame }) {
  const items = (f.items as (string | number)[]) ?? [];
  const hi = f.hi as number;
  return (
    <div style={{ display: "flex", flexDirection: "column-reverse", alignItems: "center", gap: 4, minHeight: 200, justifyContent: "flex-start" }}>
      <span className="kicker" style={{ fontSize: 9 }}>bottom</span>
      {items.map((v, i) => (
        <div
          key={i}
          style={{
            ...box,
            width: 170,
            padding: "8px 12px",
            textAlign: "center",
            fontSize: 13,
            background: i === hi ? "var(--color-accent)" : "var(--color-bg)",
            color: i === hi ? "var(--color-bg)" : "var(--color-text)",
          }}
        >
          {String(v)} {i === items.length - 1 && <span style={{ fontSize: 9, opacity: 0.75 }}>← top</span>}
        </div>
      ))}
    </div>
  );
}

function HQueue({ f }: { f: Frame }) {
  const items = (f.items as (string | number)[]) ?? [];
  const hi = f.hi as number;
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center", justifyContent: "center", minHeight: 44, flexWrap: "wrap" }}>
      <span className="kicker" style={{ fontSize: 9 }}>front</span>
      {items.length === 0 && <span className="text-muted" style={{ fontSize: 12 }}>empty</span>}
      {items.map((v, i) => (
        <div
          key={i}
          style={{
            ...box,
            padding: "8px 14px",
            fontSize: 13,
            background: i === hi ? "var(--color-accent)" : "var(--color-bg)",
            color: i === hi ? "var(--color-bg)" : "var(--color-text)",
          }}
        >
          {String(v)}
        </div>
      ))}
      <span className="kicker" style={{ fontSize: 9 }}>back</span>
    </div>
  );
}

function Buckets({ f }: { f: Frame }) {
  const buckets = (f.buckets as string[][]) ?? [];
  const hi = f.hi as number;
  return (
    <div style={{ display: "flex", gap: 6, justifyContent: "center", alignItems: "flex-start", flexWrap: "wrap" }}>
      {buckets.map((b, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "center", minWidth: 62 }}>
          <div
            style={{
              ...box,
              width: "100%",
              minHeight: 120,
              padding: 4,
              display: "flex",
              flexDirection: "column",
              gap: 3,
              borderColor: i === hi ? "var(--color-accent)" : "var(--color-divider)",
              borderWidth: i === hi ? 2 : 1,
            }}
          >
            {b.map((k, j) => (
              <span key={j} style={{ background: "color-mix(in srgb, var(--color-accent) 18%, transparent)", fontSize: 11, textAlign: "center", padding: "3px 4px" }}>
                {k}
              </span>
            ))}
          </div>
          <span className="mono text-muted" style={{ fontSize: 9 }}>[{i}]</span>
        </div>
      ))}
    </div>
  );
}

function Graph({ f }: { f: Frame }) {
  const g = f.g as { nodes: [string, number, number][]; adj: Record<string, (string | [string, number])[]> } | undefined;
  if (!g?.nodes) return <div className="text-muted">—</div>;
  const visited = new Set((f.visited as string[]) ?? []);
  const front = new Set((f.front as string[]) ?? []);
  const cur = f.cur as string | null;
  const pos = new Map(g.nodes.map(([n, x, y]) => [n, { x, y }]));
  const maxX = Math.max(...g.nodes.map((n) => n[1])) + 80;
  const maxY = Math.max(...g.nodes.map((n) => n[2])) + 60;
  const edges: { a: string; b: string; w?: number }[] = [];
  Object.entries(g.adj ?? {}).forEach(([a, tos]) =>
    (tos ?? []).forEach((t) => {
      const b = Array.isArray(t) ? t[0] : t;
      const w = Array.isArray(t) ? (t[1] as number) : undefined;
      edges.push({ a, b, w });
    })
  );
  return (
    <svg viewBox={`0 0 ${maxX} ${maxY}`} style={{ width: "100%", maxHeight: 300 }} role="img" aria-label="graph visualization">
      {edges.map(({ a, b, w }, i) => {
        const pa = pos.get(a); const pb = pos.get(b);
        if (!pa || !pb) return null;
        const lit = visited.has(a) && visited.has(b);
        return (
          <g key={i}>
            <line x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
              stroke={lit ? "var(--color-accent)" : "var(--color-neutral-400)"} strokeWidth={lit ? 2 : 1.2} />
            {w != null && (
              <text x={(pa.x + pb.x) / 2} y={(pa.y + pb.y) / 2 - 4} textAnchor="middle" fontSize="10"
                fontFamily="ui-monospace,monospace" fill="var(--color-neutral-700)">{w}</text>
            )}
          </g>
        );
      })}
      {g.nodes.map(([n, x, y]) => {
        const isCur = cur === n;
        const isSeen = visited.has(n);
        const isFront = front.has(n);
        const wide = n.length > 2;
        return (
          <g key={n}>
            {wide ? (
              <rect x={x - 44} y={y - 14} width={88} height={28}
                fill={isCur ? "var(--color-accent)" : isSeen ? "color-mix(in srgb, var(--color-accent) 25%, var(--color-bg))" : "var(--color-bg)"}
                stroke={isCur || isFront ? "var(--color-accent)" : "var(--color-divider)"} strokeWidth={isCur ? 2 : 1.4} />
            ) : (
              <circle cx={x} cy={y} r={16}
                fill={isCur ? "var(--color-accent)" : isSeen ? "color-mix(in srgb, var(--color-accent) 25%, var(--color-bg))" : "var(--color-bg)"}
                stroke={isCur || isFront ? "var(--color-accent)" : "var(--color-divider)"} strokeWidth={isCur ? 2 : 1.4} />
            )}
            <text x={x} y={y + 4} textAnchor="middle" fontSize={wide ? 11 : 12} fontFamily="ui-monospace,monospace"
              fill={isCur ? "var(--color-bg)" : "var(--color-text)"}>{n}</text>
          </g>
        );
      })}
    </svg>
  );
}

function Matrix({ f }: { f: Frame }) {
  const cols = (f.cols as string[]) ?? [];
  const rows = (f.rows as { label: string; cells: { t: string; s?: string }[] }[]) ?? [];
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ borderCollapse: "collapse", margin: "0 auto", fontSize: 12.5 }}>
        {cols.length > 0 && (
          <thead>
            <tr>
              <th />
              {cols.map((c) => (
                <th key={c} className="mono text-muted" style={{ padding: "4px 10px", fontWeight: 500, fontSize: 11 }}>{c}</th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td className="mono" style={{ padding: "4px 10px", fontSize: 11, color: "var(--color-neutral-700)" }}>{r.label}</td>
              {(r.cells ?? []).map((c, j) => (
                <td key={j} className="mono" style={{
                  ...box,
                  padding: "6px 12px",
                  textAlign: "center",
                  opacity: c.s === "off" ? 0.3 : 1,
                  background: c.s === "hot" ? "var(--color-accent)" : c.s === "on" ? "color-mix(in srgb, var(--color-accent) 14%, var(--color-bg))" : "var(--color-bg)",
                  color: c.s === "hot" ? "var(--color-bg)" : "var(--color-text)",
                }}>{c.t}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Panels({ f }: { f: Frame }) {
  const panels = (f.panels as { title: string; rows: { t: string; s?: string }[] }[]) ?? [];
  const log = (f.log as string[]) ?? [];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(170px, 1fr))`, gap: "var(--space-4)" }}>
        {panels.map((p, i) => (
          <div key={i} style={{ ...box, fontFamily: "inherit", padding: "var(--space-3)" }}>
            <div className="kicker" style={{ marginBottom: 8 }}>{p.title}</div>
            {(p.rows ?? []).map((r, j) => (
              <div key={j} className="mono" style={{
                fontSize: 12,
                padding: "5px 8px",
                marginBottom: 3,
                background: r.s === "hot" ? "color-mix(in srgb, var(--color-accent) 22%, transparent)" : "color-mix(in srgb, var(--color-text) 4%, transparent)",
                opacity: r.s === "off" ? 0.35 : 1,
              }}>{r.t}</div>
            ))}
          </div>
        ))}
      </div>
      {log.length > 0 && (
        <div className="mono text-muted" style={{ fontSize: 11, lineHeight: 1.7 }}>
          {log.map((l, i) => <div key={i}>» {l}</div>)}
        </div>
      )}
    </div>
  );
}

const CHART_FN: Record<string, (x: number) => number> = {
  "1": () => 1,
  logn: (x) => Math.max(1, Math.log2(x)),
  n: (x) => x,
  nlogn: (x) => Math.max(1, x * Math.log2(x)),
  n2: (x) => x * x,
  exp: (x) => Math.pow(1.4, x),
  sqrt: (x) => Math.sqrt(x),
  inv: (x) => 100 / x,
};

function Chart({ f }: { f: Frame }) {
  // Two modes: series of named growth functions, or explicit points [[x,y],…]
  const series = (f.series as { k?: string; pts?: [number, number][]; mul?: number; name: string; c: string }[]) ?? [];
  const n = (f.n as number) ?? 64;
  const log = f.logScale !== false;
  const W = 560, H = 230, L = 44, B = 26;
  const val = (s: { k?: string; mul?: number }, x: number) => (CHART_FN[s.k ?? "n"] ?? CHART_FN.n)(x) * (s.mul ?? 1);
  const allYs = series.flatMap((s) => (s.pts ? s.pts.map((p) => p[1]) : [val(s, n)]));
  const allXs = series.flatMap((s) => (s.pts ? s.pts.map((p) => p[0]) : [n]));
  const maxY = Math.max(10, ...allYs);
  const maxX = Math.max(4, ...allXs);
  const px = (x: number) => L + (x / maxX) * (W - L - 10);
  const py = (y: number) =>
    log
      ? (H - B) - (Math.log10(1 + Math.max(0, y)) / Math.log10(1 + maxY)) * (H - B - 12)
      : (H - B) - (Math.max(0, y) / maxY) * (H - B - 12);
  const marker = f.marker as [number, number] | undefined;
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxHeight: 240 }} role="img" aria-label="chart">
        <line x1={L} y1={H - B} x2={W - 8} y2={H - B} stroke="var(--color-divider)" />
        <line x1={L} y1={8} x2={L} y2={H - B} stroke="var(--color-divider)" />
        <text x={W - 10} y={H - 8} textAnchor="end" fontSize="10" fill="var(--color-neutral-600)">{(f.xlabel as string) ?? `n = ${maxX}`}</text>
        <text x={10} y={16} fontSize="10" fill="var(--color-neutral-600)">{(f.ylabel as string) ?? (log ? "steps (log scale)" : "value")}</text>
        {series.map((s, si) => {
          let d = "";
          if (s.pts) {
            s.pts.forEach((p, i) => { d += `${i === 0 ? "M" : "L"}${px(p[0]).toFixed(1)},${py(p[1]).toFixed(1)}`; });
          } else {
            for (let x = 1; x <= maxX; x++) d += `${x === 1 ? "M" : "L"}${px(x).toFixed(1)},${py(val(s, x)).toFixed(1)}`;
          }
          return <path key={si} d={d} fill="none" stroke={s.c || "var(--color-accent)"} strokeWidth="2" />;
        })}
        {marker && <circle cx={px(marker[0])} cy={py(marker[1])} r={5} fill="var(--color-accent)" stroke="var(--color-bg)" strokeWidth={1.5} />}
      </svg>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center", marginTop: 6 }}>
        {series.map((s, i) => (
          <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5 }} className="text-muted">
            <i style={{ width: 14, height: 2.5, background: s.c || "var(--color-accent)", display: "inline-block" }} />
            {s.name}
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * flow — pipeline/architecture diagrams with a highlighted active stage.
 * Frame: { stages: [{id, label, sub?}], active?: id, done?: [ids], payload?: string, branch?: {from, to, label}[] }
 * Stages render as a wrapping horizontal chain with arrows; `payload` shows
 * what's flowing between stages at this step.
 */
function Flow({ f }: { f: Frame }) {
  const stages = (f.stages as { id: string; label: string; sub?: string }[]) ?? [];
  const active = f.active as string | undefined;
  const done = new Set((f.done as string[]) ?? []);
  const payload = f.payload as string | undefined;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", alignItems: "center" }}>
      <div style={{ display: "flex", alignItems: "stretch", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
        {stages.map((s, i) => {
          const isActive = s.id === active;
          const isDone = done.has(s.id);
          return (
            <span key={s.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  ...box,
                  fontFamily: "inherit",
                  padding: "10px 14px",
                  minWidth: 90,
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  background: isActive ? "var(--color-accent)" : isDone ? "color-mix(in srgb, var(--color-accent) 18%, var(--color-bg))" : "var(--color-bg)",
                  color: isActive ? "var(--color-bg)" : "var(--color-text)",
                  borderColor: isActive || isDone ? "var(--color-accent)" : "var(--color-divider)",
                  borderWidth: isActive ? 2 : 1,
                }}
              >
                <span style={{ fontSize: 13, fontWeight: isActive ? 600 : 400 }}>{s.label}</span>
                {s.sub && <span className="mono" style={{ fontSize: 9.5, opacity: 0.75 }}>{s.sub}</span>}
              </span>
              {i < stages.length - 1 && (
                <span className="mono" style={{ fontSize: 14, color: isDone ? "var(--color-accent)" : "var(--color-neutral-500)" }}>→</span>
              )}
            </span>
          );
        })}
      </div>
      {payload && (
        <div className="mono" style={{ fontSize: 11.5, padding: "6px 12px", border: "1px dashed var(--color-accent)", color: "var(--color-accent-700)", maxWidth: 560, textAlign: "center" }}>
          ✉ {payload}
        </div>
      )}
    </div>
  );
}
