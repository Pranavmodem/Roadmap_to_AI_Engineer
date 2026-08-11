// @ts-ignore untyped data module
import { RESOURCE_LIBRARY } from "@/data/resources";

export const metadata = { title: "Resource library — AI Engineer / 180" };

interface Item { label: string; url: string; type: string; time: string }
interface Area { area: string; items: Item[] }

export default function ResourcesPage() {
  const lib = RESOURCE_LIBRARY as Area[];
  const total = lib.reduce((s, a) => s + a.items.length, 0);
  return (
    <div className="page" style={{ maxWidth: 1000 }}>
      <div className="kicker" style={{ marginBottom: "var(--space-2)" }}>the verified library</div>
      <h1 style={{ marginBottom: "var(--space-2)" }}>Resource library</h1>
      <p className="text-muted" style={{ maxWidth: "70ch", marginBottom: "var(--space-6)" }}>
        {total} sources behind the curriculum — official documentation, university courses, open
        textbooks, key papers, and respected engineering blogs. Every URL was fetched and verified
        live before inclusion; everything is legally free (paid books link only to official pages).
        Each day's lesson cites the exact chapters and videos it uses.
      </p>
      {lib.map((a) => (
        <section key={a.area} style={{ marginBottom: "var(--space-6)" }}>
          <h3 style={{ borderBottom: "1px solid var(--color-divider)", paddingBottom: "var(--space-2)", marginBottom: "var(--space-2)" }}>{a.area}</h3>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {a.items.map((r) => (
              <a
                key={r.url + r.label}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="zh-row"
                style={{ display: "flex", gap: 12, alignItems: "baseline", padding: "7px 8px", textDecoration: "none", color: "inherit", borderBottom: "1px solid color-mix(in srgb, var(--color-divider) 45%, transparent)" }}
              >
                <span className="tag tag-neutral mono" style={{ fontSize: 9.5, minWidth: 52, justifyContent: "center" }}>{r.type}</span>
                <span style={{ fontSize: 14, fontWeight: 500, color: "var(--color-accent)" }}>{r.label} ↗</span>
                <span className="mono text-muted" style={{ marginLeft: "auto", fontSize: 11, whiteSpace: "nowrap" }}>{r.time}</span>
              </a>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
