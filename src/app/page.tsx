import Link from "next/link";
import { phases, allDays, PROGRAM_DAYS } from "@/lib/curriculum";

export default function Landing() {
  const lessonCount = allDays.filter((d) => d.kind === "lesson").length;
  const reviewCount = allDays.filter((d) => d.kind === "review").length;
  const projectCount = allDays.filter((d) => d.kind === "project").length;
  return (
    <div className="page" style={{ maxWidth: 1160 }}>
      <section className="hero-grid" style={{ marginBottom: "var(--space-8)", alignItems: "center" }}>
        <div>
          <div className="kicker" style={{ marginBottom: "var(--space-3)" }}>
            {PROGRAM_DAYS} days · 2 hours a day · zero assumed knowledge
          </div>
          <h1 className="h-hero" style={{ lineHeight: 1.02, margin: "0 0 var(--space-4)" }}>
            Beginner to job-ready<br />AI Engineer <span style={{ color: "var(--color-neutral-500)" }}>&</span> Forward-Deployed Engineer
          </h1>
          <p style={{ fontSize: 17, lineHeight: 1.6, maxWidth: "56ch", color: "var(--color-neutral-800)", marginBottom: "var(--space-6)" }}>
            Not a link list. A guided, sequenced bootcamp: every day has an analogy-first explanation you
            can flip to full technical depth, code that runs <b>in your browser</b>, a step-through
            visualizer where a picture beats prose, a shipped artifact, a quiz that tracks mastery, and
            flashcards on a spaced-repetition schedule. It ends with a production RAG capstone,
            customer-simulation training, and interview prep.
          </p>
          <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap" }}>
            <Link href="/day/d001" className="btn btn-primary" style={{ fontSize: 15, padding: "10px 22px" }}>Begin Day 1</Link>
            <Link href="/dashboard" className="btn btn-secondary" style={{ fontSize: 15 }}>Open the dashboard</Link>
            <Link href="/curriculum" className="btn btn-secondary" style={{ fontSize: 15 }}>See all {PROGRAM_DAYS} days</Link>
          </div>
        </div>
        <figure className="blueprint" style={{ margin: 0, padding: "var(--space-6)" }}>
          <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />
          <div className="kicker" style={{ marginBottom: "var(--space-3)" }}>What's inside</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
            <Fact n={String(lessonCount)} l="deep lessons" />
            <Fact n={String(reviewCount)} l="review checkpoints" />
            <Fact n={String(projectCount) } l="dedicated project days" />
            <Fact n="1" l="production capstone" />
            <Fact n="540+" l="quiz questions" />
            <Fact n="900+" l="flashcards, spaced" />
          </div>
          <figcaption style={{ marginTop: "var(--space-3)" }}>
            plus an AI teacher with explain / hint / mock-interview / customer-sim modes
          </figcaption>
        </figure>
      </section>

      <section style={{ marginBottom: "var(--space-8)" }}>
        <h2 style={{ marginBottom: "var(--space-4)" }}>The arc — nine phases</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "var(--space-3)" }}>
          {phases.map((p) => (
            <Link key={p.id} href={`/curriculum#${p.id}`} className="card zh-cell" style={{ textDecoration: "none", color: "inherit" }}>
              <span className="card-kicker">{p.n} · days {p.days[0]}–{p.days[1]}</span>
              <span className="card-title">{p.name}</span>
              <span className="card-body">{p.blurb}</span>
            </Link>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: "var(--space-8)" }}>
        <h2 style={{ marginBottom: "var(--space-4)" }}>How every day works</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "var(--space-3)" }}>
          <Step n="1" t="The analogy" d="Every concept lands as a picture first — arrays are bookshelves, RAG is an open-book exam, evals are the exam you write before the student exists." />
          <Step n="2" t="Flip to Tech" d="One toggle swaps the whole explanation for the precise version: invariants, complexity, trade-offs, correct terminology." />
          <Step n="3" t="Watch it happen" d="Step-through visualizers animate the algorithm, the pipeline, or the attack — play, pause, and predict what happens next." />
          <Step n="4" t="Run the code" d="Guided exercises execute right on the page (Python via WebAssembly). Edit, break, fix, re-run." />
          <Step n="5" t="Ship something" d="Every day ends with an artifact against a measurable rubric — files, repos, services. Your portfolio builds itself." />
          <Step n="6" t="Prove it & retain it" d="A 3-question mastery quiz routes misses to the exact day to revisit; flashcards return on a spaced-repetition schedule." />
        </div>
      </section>

      <section>
        <h2 style={{ marginBottom: "var(--space-3)" }}>Built for the 2026 job market</h2>
        <p style={{ maxWidth: "70ch", fontSize: 15, lineHeight: 1.65, color: "var(--color-neutral-800)" }}>
          The curriculum is weighted the way hiring is: RAG, agents, tool use, and <b>evaluation</b> get four
          full weeks; production engineering (Docker, CI/CD, serving, observability, cost) gets two; and the
          forward-deployed skillset — customer discovery, specs from ambiguity, prototypes, demos, enterprise
          integration — gets two more, with rubric-graded customer simulations. Interview training runs
          throughout and culminates in a full mock loop.{" "}
          <Link href="/resources">Every resource is legally free and verified.</Link>
        </p>
      </section>
    </div>
  );
}

function Fact({ n, l }: { n: string; l: string }) {
  return (
    <div style={{ border: "1px solid var(--color-divider)", padding: "var(--space-3)" }}>
      <div style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 26 }}>{n}</div>
      <div className="text-muted" style={{ fontSize: 11 }}>{l}</div>
    </div>
  );
}

function Step({ n, t, d }: { n: string; t: string; d: string }) {
  return (
    <div className="blueprint" style={{ padding: "var(--space-4)" }}>
      <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />
      <div className="kicker" style={{ marginBottom: 4 }}>step {n}</div>
      <h4 style={{ marginBottom: 6 }}>{t}</h4>
      <p className="text-muted" style={{ fontSize: 13, margin: 0, lineHeight: 1.55 }}>{d}</p>
    </div>
  );
}
