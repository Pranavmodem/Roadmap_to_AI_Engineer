"use client";

import { useEffect, useRef, useState } from "react";
import { useJourney } from "@/lib/store";

/**
 * In-browser code interpreter. Python runs on Pyodide (CPython compiled to
 * WebAssembly, loaded once from the jsDelivr CDN and cached); JavaScript runs
 * in a sandboxed Function with console capture. Common scientific packages
 * (numpy, pandas, scikit-learn…) are auto-loaded from imports on first use.
 */

const PYODIDE_URL = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js";

declare global {
  interface Window {
    loadPyodide?: (opts: { indexURL: string }) => Promise<any>;
    __pyodidePromise?: Promise<any>;
  }
}

function getPyodide(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject(new Error("SSR"));
  if (!window.__pyodidePromise) {
    window.__pyodidePromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = PYODIDE_URL;
      script.onload = () => {
        window
          .loadPyodide!({ indexURL: PYODIDE_URL.replace(/\/pyodide\.js$/, "/") })
          .then(resolve, reject);
      };
      script.onerror = () => reject(new Error("Failed to load Pyodide from CDN — check your connection."));
      document.head.appendChild(script);
    });
  }
  return window.__pyodidePromise;
}

export default function CodeRunner({
  initialCode,
  lang = "python",
  dayId,
  title,
}: {
  initialCode: string;
  lang?: "python" | "javascript";
  dayId?: string;
  title?: string;
}) {
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "running" | "done" | "error">("idle");
  const [saved, setSaved] = useState(false);
  const addSnippet = useJourney((s) => s.addSnippet);
  const taRef = useRef<HTMLTextAreaElement>(null);

  // auto-grow the editor with content
  useEffect(() => {
    const ta = taRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = Math.min(480, ta.scrollHeight + 2) + "px";
    }
  }, [code]);

  const runPython = async () => {
    setStatus("loading");
    setOutput("Loading Python runtime (first run downloads ~10 MB, then it's cached)…");
    try {
      const py = await getPyodide();
      setStatus("running");
      setOutput("Running…");
      await py.loadPackagesFromImports(code).catch(() => {});
      const result = await py.runPythonAsync(
        `import sys, io\n_buf = io.StringIO()\n_old_out, _old_err = sys.stdout, sys.stderr\nsys.stdout = sys.stderr = _buf\ntry:\n    exec(compile(${JSON.stringify(code)}, "<lesson>", "exec"), {"__name__": "__main__"})\nfinally:\n    sys.stdout, sys.stderr = _old_out, _old_err\n_buf.getvalue()`
      );
      setOutput((result as string) || "(no output — add a print() to see results)");
      setStatus("done");
    } catch (e) {
      setOutput(String(e).replace(/^PythonError:\s*/, ""));
      setStatus("error");
    }
  };

  const runJs = () => {
    setStatus("running");
    const logs: string[] = [];
    const fakeConsole = {
      log: (...a: unknown[]) => logs.push(a.map((x) => (typeof x === "object" ? JSON.stringify(x) : String(x))).join(" ")),
      error: (...a: unknown[]) => logs.push("ERROR: " + a.map(String).join(" ")),
      warn: (...a: unknown[]) => logs.push("WARN: " + a.map(String).join(" ")),
    };
    try {
      // eslint-disable-next-line no-new-func
      const fn = new Function("console", code);
      const ret = fn(fakeConsole);
      if (ret !== undefined) logs.push("→ " + String(ret));
      setOutput(logs.join("\n") || "(no output — add a console.log to see results)");
      setStatus("done");
    } catch (e) {
      setOutput(String(e));
      setStatus("error");
    }
  };

  const run = () => (lang === "python" ? runPython() : runJs());

  const save = () => {
    addSnippet({ title: title ?? `${lang} snippet`, lang, code, dayId });
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  };

  return (
    <figure className="blueprint" style={{ margin: 0, background: "var(--color-bg)" }}>
      <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "var(--space-2) var(--space-3)", borderBottom: "1px solid var(--color-divider)" }}>
        <span className="kicker" style={{ fontSize: 10 }}>{lang === "python" ? "🐍 python — editable, runs in your browser" : "js — editable, runs in your browser"}</span>
        <span style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          <button className="btn btn-ghost" style={{ fontSize: 12, padding: "3px 8px" }} onClick={() => { setCode(initialCode); setOutput(null); setStatus("idle"); }} title="Reset to the original code">
            ↺ reset
          </button>
          <button className="btn btn-ghost" style={{ fontSize: 12, padding: "3px 8px" }} onClick={save} title="Save to your snippets library">
            {saved ? "✓ saved" : "save"}
          </button>
          <button className="btn btn-primary" style={{ fontSize: 12, padding: "3px 12px" }} onClick={run} disabled={status === "loading" || status === "running"}>
            {status === "loading" ? "loading…" : status === "running" ? "running…" : "▶ Run"}
          </button>
        </span>
      </div>
      <textarea
        ref={taRef}
        value={code}
        onChange={(e) => setCode(e.target.value)}
        spellCheck={false}
        aria-label="Code editor"
        onKeyDown={(e) => {
          if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); run(); }
          if (e.key === "Tab") {
            e.preventDefault();
            const ta = e.currentTarget;
            const { selectionStart: s, selectionEnd: end } = ta;
            setCode(code.slice(0, s) + "    " + code.slice(end));
            requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = s + 4; });
          }
        }}
        style={{
          width: "100%", border: "none", outline: "none", resize: "none", display: "block",
          background: "color-mix(in srgb, var(--color-text) 5%, transparent)",
          color: "var(--color-text)", caretColor: "var(--color-accent)",
          fontFamily: "ui-monospace, Menlo, monospace", fontSize: 12.5, lineHeight: 1.6,
          padding: "var(--space-3)", minHeight: 60,
        }}
      />
      {output != null && (
        <pre
          className="mono"
          style={{
            margin: 0, padding: "var(--space-3)", borderTop: "1px solid var(--color-divider)",
            fontSize: 12, lineHeight: 1.55, whiteSpace: "pre-wrap", maxHeight: 260, overflowY: "auto",
            color: status === "error" ? "var(--color-accent-700)" : "var(--color-neutral-800)",
            background: "color-mix(in srgb, var(--color-accent) 5%, transparent)",
          }}
        >
          {output}
        </pre>
      )}
      <figcaption style={{ padding: "4px var(--space-3)", fontSize: 10 }} className="text-muted">
        Ctrl/⌘+Enter runs · Tab indents · numpy/pandas/sklearn auto-load on import (torch and network calls need a local run)
      </figcaption>
    </figure>
  );
}
