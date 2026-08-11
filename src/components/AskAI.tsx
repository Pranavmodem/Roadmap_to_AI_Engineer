"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useJourney } from "@/lib/store";

/**
 * Floating AI teacher. Sends the question + tutor mode + explanation style +
 * page/day context to /api/ask, which proxies an LLM using server-side env
 * vars. Four tutor modes: explain, hint (never full solutions), mock
 * interview, and customer simulation (FDE practice).
 */

type TutorMode = "explain" | "hint" | "interview" | "customer";

const TUTOR_MODES: { id: TutorMode; label: string; hint: string }[] = [
  { id: "explain", label: "Explain", hint: "Explains any concept at your level" },
  { id: "hint", label: "Hint", hint: "Nudges you forward without giving the solution away" },
  { id: "interview", label: "Interview", hint: "Asks you interview questions and grades your answers" },
  { id: "customer", label: "Customer", hint: "Role-plays a customer for FDE discovery practice" },
];

function renderInline(text: string) {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("`") && part.endsWith("`"))
      return (
        <code key={i} className="mono" style={{ background: "color-mix(in srgb, var(--color-text) 8%, transparent)", padding: "0 4px", fontSize: "0.92em" }}>
          {part.slice(1, -1)}
        </code>
      );
    return part;
  });
}

function Answer({ text }: { text: string }) {
  return (
    <>
      {text.split(/\n/).map((line, i) => {
        const heading = line.match(/^#{1,4}\s+(.*)$/);
        const bullet = line.match(/^\s*[-*•]\s+(.*)$/);
        const numbered = line.match(/^\s*(\d+)[.)]\s+(.*)$/);
        if (heading) return <div key={i} style={{ fontWeight: 700, margin: "8px 0 2px" }}>{renderInline(heading[1])}</div>;
        if (bullet) return <div key={i} style={{ paddingLeft: 16, margin: "2px 0" }}>• {renderInline(bullet[1])}</div>;
        if (numbered) return <div key={i} style={{ paddingLeft: 16, margin: "2px 0" }}>{numbered[1]}. {renderInline(numbered[2])}</div>;
        if (!line.trim()) return <div key={i} style={{ height: 8 }} />;
        return <div key={i}>{renderInline(line)}</div>;
      })}
    </>
  );
}

interface Turn {
  role: "user" | "assistant";
  content: string;
}

export default function AskAI() {
  const [open, setOpen] = useState(false);
  const [tutorMode, setTutorMode] = useState<TutorMode>("explain");
  const [question, setQuestion] = useState("");
  const [history, setHistory] = useState<Turn[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const mode = useJourney((s) => s.mode);
  const setMode = useJourney((s) => s.setMode);
  const pathname = usePathname();

  const ask = async () => {
    const q = question.trim();
    if (!q || loading) return;
    setLoading(true);
    setError("");
    const newHistory: Turn[] = [...history, { role: "user", content: q }];
    setHistory(newHistory);
    setQuestion("");
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newHistory.slice(-8),
          style: mode,
          tutorMode,
          page: pathname,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setHistory([...newHistory, { role: "assistant", content: data.answer }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setHistory(history); // roll back the optimistic user turn
      setQuestion(q);
    } finally {
      setLoading(false);
    }
  };

  const activeHint = TUTOR_MODES.find((m) => m.id === tutorMode)?.hint;

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close the AI teacher" : "Open the AI teacher"}
        className="btn btn-primary"
        style={{ position: "fixed", bottom: 22, right: 22, zIndex: 50, width: 52, height: 52, borderRadius: "50%", fontSize: 22, boxShadow: "var(--shadow-lg)", padding: 0 }}
      >
        {open ? "✕" : "🎓"}
      </button>

      {open && (
        <div
          className="blueprint"
          role="dialog"
          aria-label="AI teacher"
          style={{ position: "fixed", bottom: 86, right: 22, zIndex: 50, width: "min(94vw, 420px)", background: "var(--color-bg)", boxShadow: "var(--shadow-lg)", padding: "var(--space-4)", display: "flex", flexDirection: "column", maxHeight: "min(72vh, 620px)" }}
        >
          <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span className="kicker">AI teacher</span>
            <div className="seg" role="tablist" aria-label="Answer style" style={{ marginLeft: "auto" }}>
              {(["eli5", "tech"] as const).map((m) => (
                <label
                  key={m}
                  className="seg-opt"
                  style={{ padding: "4px 9px", fontSize: 11.5, background: mode === m ? "var(--color-accent)" : "transparent", color: mode === m ? "var(--color-bg)" : "inherit", cursor: "pointer" }}
                >
                  <input type="radio" name="teacher-style" checked={mode === m} onChange={() => setMode(m)} />
                  {m === "eli5" ? "🧸 ELI5" : "⚙ Tech"}
                </label>
              ))}
            </div>
          </div>

          <div className="seg" role="tablist" aria-label="Tutor mode" style={{ marginBottom: 6, alignSelf: "flex-start" }}>
            {TUTOR_MODES.map((m) => (
              <label
                key={m.id}
                className="seg-opt"
                style={{ padding: "4px 9px", fontSize: 11.5, background: tutorMode === m.id ? "var(--color-accent)" : "transparent", color: tutorMode === m.id ? "var(--color-bg)" : "inherit", cursor: "pointer" }}
                title={m.hint}
              >
                <input type="radio" name="tutor-mode" checked={tutorMode === m.id} onChange={() => { setTutorMode(m.id); setHistory([]); }} />
                {m.label}
              </label>
            ))}
          </div>
          <p className="text-muted" style={{ fontSize: 11.5, marginBottom: "var(--space-2)" }}>{activeHint}</p>

          {history.length > 0 && (
            <div style={{ flex: 1, overflowY: "auto", border: "1px solid var(--color-divider)", background: "var(--color-surface)", padding: "var(--space-3)", fontSize: 13.5, lineHeight: 1.55, marginBottom: 8, display: "flex", flexDirection: "column", gap: 10 }}>
              {history.map((t, i) => (
                <div key={i}>
                  <div className="kicker" style={{ fontSize: 9, marginBottom: 2 }}>{t.role === "user" ? "you" : "teacher"}</div>
                  {t.role === "assistant" ? <Answer text={t.content} /> : <div>{t.content}</div>}
                </div>
              ))}
              {loading && <div className="text-muted" style={{ fontSize: 12 }}>Thinking…</div>}
            </div>
          )}

          <textarea
            className="input"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                ask();
              }
            }}
            rows={2}
            placeholder={
              tutorMode === "interview" ? 'e.g. "Ask me a RAG system-design question"'
              : tutorMode === "customer" ? 'e.g. "Play a skeptical ops director at a logistics firm"'
              : tutorMode === "hint" ? 'Paste your code or describe where you\'re stuck'
              : "e.g. Why does attention need a causal mask?"
            }
            style={{ marginBottom: 8 }}
            aria-label="Your message to the AI teacher"
          />
          <div style={{ display: "flex", gap: 8 }}>
            {history.length > 0 && (
              <button className="btn btn-secondary" onClick={() => { setHistory([]); setError(""); }} style={{ fontSize: 12 }}>
                clear
              </button>
            )}
            <button className="btn btn-primary" onClick={ask} disabled={loading || !question.trim()} style={{ flex: 1 }}>
              {loading ? "Thinking…" : "Send"}
            </button>
          </div>
          {error && <p style={{ color: "var(--color-accent-700)", fontSize: 12, marginTop: 8 }}>{error}</p>}
        </div>
      )}
    </>
  );
}
