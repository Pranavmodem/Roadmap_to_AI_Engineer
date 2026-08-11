"use client";

import React from "react";
import CodeRunner from "./CodeRunner";

/**
 * Renders the curriculum's markdown-lite dialect:
 * paragraphs (blank-line separated), `### ` mini-headings, `- ` bullets,
 * `1. ` numbered lists, **bold**, `inline code`, and ~~~lang fenced blocks
 * (``` also accepted). Python fences become runnable in-browser via CodeRunner.
 */

function renderInline(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2)
      return (
        <code
          key={i}
          className="mono"
          style={{ background: "color-mix(in srgb, var(--color-text) 8%, transparent)", padding: "0 4px", fontSize: "0.92em" }}
        >
          {part.slice(1, -1)}
        </code>
      );
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

interface Block {
  type: "p" | "h" | "ul" | "ol" | "code";
  text?: string;
  items?: string[];
  lang?: string;
}

function parse(src: string): Block[] {
  const lines = src.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const fence = line.match(/^(~~~|```)(\w*)\s*$/);
    if (fence) {
      const close = fence[1];
      const lang = fence[2] || "text";
      const buf: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith(close)) {
        buf.push(lines[i]);
        i++;
      }
      i++; // skip closing fence
      blocks.push({ type: "code", text: buf.join("\n"), lang });
      continue;
    }
    if (/^###\s+/.test(line)) {
      blocks.push({ type: "h", text: line.replace(/^###\s+/, "") });
      i++;
      continue;
    }
    if (/^\s*[-•]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-•]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-•]\s+/, ""));
        i++;
      }
      blocks.push({ type: "ul", items });
      continue;
    }
    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && (/^\s*\d+[.)]\s+/.test(lines[i]) || (lines[i].trim() && /^\s{2,}/.test(lines[i])))) {
        if (/^\s*\d+[.)]\s+/.test(lines[i])) items.push(lines[i].replace(/^\s*\d+[.)]\s+/, ""));
        else items[items.length - 1] += " " + lines[i].trim();
        i++;
      }
      blocks.push({ type: "ol", items });
      continue;
    }
    if (!line.trim()) {
      i++;
      continue;
    }
    // paragraph: accumulate until blank line or structural line
    const buf: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(~~~|```|###\s|\s*[-•]\s|\s*\d+[.)]\s)/.test(lines[i])) {
      buf.push(lines[i]);
      i++;
    }
    blocks.push({ type: "p", text: buf.join(" ") });
  }
  return blocks;
}

export default function Markdownish({
  text,
  runnable = true,
  size = 14.5,
}: {
  text: string;
  runnable?: boolean;
  size?: number;
}) {
  const blocks = React.useMemo(() => parse(text), [text]);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", fontSize: size, lineHeight: 1.65, color: "var(--color-neutral-800)" }}>
      {blocks.map((b, i) => {
        switch (b.type) {
          case "h":
            return (
              <div key={i} className="kicker" style={{ marginTop: "var(--space-2)", fontSize: 12 }}>
                {b.text}
              </div>
            );
          case "ul":
            return (
              <ul key={i} style={{ margin: 0, paddingLeft: 22, display: "flex", flexDirection: "column", gap: 6 }}>
                {b.items!.map((it, j) => (
                  <li key={j}>{renderInline(it)}</li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={i} style={{ margin: 0, paddingLeft: 22, display: "flex", flexDirection: "column", gap: 6 }}>
                {b.items!.map((it, j) => (
                  <li key={j}>{renderInline(it)}</li>
                ))}
              </ol>
            );
          case "code":
            if (runnable && (b.lang === "python" || b.lang === "py")) {
              return <CodeRunner key={i} initialCode={b.text ?? ""} lang="python" />;
            }
            if (runnable && (b.lang === "js" || b.lang === "javascript")) {
              return <CodeRunner key={i} initialCode={b.text ?? ""} lang="javascript" />;
            }
            return (
              <pre key={i} className="codeblock" data-lang={b.lang}>
                {b.text}
              </pre>
            );
          default:
            return <p key={i} style={{ margin: 0, maxWidth: "76ch" }}>{renderInline(b.text ?? "")}</p>;
        }
      })}
    </div>
  );
}
