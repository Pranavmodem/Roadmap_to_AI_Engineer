# Architecture

## Overview

Next.js 14 (App Router) + TypeScript + Tailwind (utility classes only; the design
system is plain CSS custom properties ported from ELI5Code). No database: the app
is local-first. All 180 day pages are statically generated at build time from the
data modules; interactivity (progress, quizzes, SRS, notes, code execution, AI
teacher) is client-side, with one serverless route (`/api/ask`) proxying the LLM.

```
┌────────────── build time ──────────────┐   ┌───────────── runtime ─────────────┐
│ src/data/days-*.js  ──┐                │   │ zustand + localStorage             │
│ src/data/phases.js   ─┼→ curriculum.ts │   │   progress · quiz scores · SRS ·   │
│ src/data/visualizers ─┘   (typed API)  │   │   notes · snippets · bookmarks     │
│        │                               │   │ Pyodide (CDN, lazy) → CodeRunner   │
│        └→ SSG: 180 day pages + indexes │   │ /api/ask → OpenAI-compatible LLM   │
└────────────────────────────────────────┘   └────────────────────────────────────┘
```

## Data model

`src/lib/curriculum.ts` defines the single `Day` interface (see
`docs/authoring-guide.md` for the authoring spec): identity (`id`, `day`, `week`,
`phase`, `kind`), pedagogy (`objectives`, `prereqs`, `eli5`, `why`, `tech`,
`viz`), practice (`guided`, `practice`, `project.rubric`), assessment (`quiz` with
per-question `revisit` day pointers), retention (`flashcards`), logistics
(`schedule`, `completion`, `resources`, `connections`, `deepDive`).

Content ships in 13 batch files (`days-001-014.js` … `days-169-180.js`) merged and
validated by `validateCurriculum()` and the `tests/` suite (day count, id/week/
phase integrity, review cadence, schedule sums ≈120 min, quiz answer ranges,
backward-only prereqs, viz-key resolution, minimum content lengths).

### Learner state (zustand, persisted to localStorage)

| Slice | Shape | Feeds |
| --- | --- | --- |
| `completedDays` | `string[]` | mastery, XP, streak, deck membership |
| `quizScores` | `{[dayId]: {correct,total,missed[],ts}}` | mastery (40%), revision recommendations |
| `srs` | `{[dayId:cardIdx]: {ease,interval,due,reps}}` | Review page scheduling (SM-2-lite) |
| `notes`, `snippets`, `bookmarks` | maps/arrays | Notes page, search page |
| `projectChecks` | `{[dayId]: number[]}` | project rubric progress |
| `mode`, `theme`, `startDate`, `activityDates` | scalars | ELI5⇄Tech, theming, streaks |

### Mastery math (`src/lib/progress.ts`)

- Phase mastery = `0.6 × completion% + 0.4 × quizAccuracy%` (quiz term omitted
  until a quiz exists; retakes overwrite — latest counts, so revision pays off).
- Program mastery = day-count-weighted mean of phase masteries.
- Phases unlock at ≥70% completion of the previous phase (self-paced, not calendar-locked).
- Revision queue: each missed quiz question carries a `revisit` day; misses are
  tallied per target day and surfaced on the Dashboard and Review pages.

### Spaced repetition (`src/lib/srs.ts`)

SM-2-lite: grade 0 (again) → ease −0.2, due tomorrow; grade 1 → interval 1 → 3 →
interval×ease; grade 2 (easy) → ease +0.1 and a 1.3× stretch; intervals cap at 60
days. Only cards from *completed* days enter the deck, so Day 1 learners aren't
drowned.

## The visual flow system

`VizPlayer` renders step-scripts (arrays of frames) through 12 shared families:
`bars, cells, nodes, vstack, hqueue, buckets, graph, matrix, panels, chart, flow`.
`flow` is new relative to ELI5Code: pipeline stages with an active-stage
highlight and a payload ribbon — used for the RAG pipeline, tool-use loop, eval
loop, CI/CD, and system-design walkthroughs. Frames can embed `predict`
challenges that pause playback until the learner commits. Where an external
visualization is genuinely better (3Blue1Brown, VisuAlgo, Seeing Theory,
Immersive Linear Algebra), lessons link out with attribution instead of
re-implementing — same policy as Manim-style animation: interactive step-scripts
in-house, canonical animations linked.

## In-browser code interpreter

`CodeRunner` lazy-loads Pyodide (CPython → WebAssembly) from the jsDelivr CDN on
first run and caches the promise on `window`. Python fences in lesson bodies
(`~~~python`) automatically become editable run-boxes; stdout/stderr are captured
via an IO redirect; `loadPackagesFromImports` pulls numpy/pandas/scikit-learn on
demand. JS fences run in a sandboxed `Function` with a console shim. Torch,
network calls, and OS-level work are flagged in lesson text as local-run
(the curriculum teaches real local tooling from Day 1, so this is a feature, not
a gap). Learners can save any editor state to their snippets library.

## AI teacher

`AskAI` (client) ⇄ `/api/ask` (server). The route holds the only secret
(`AI_API_KEY`), rate-limits per IP, and builds a system prompt from: curriculum
summary + the learner's current page (day inference) + tutor mode + style.

Modes: **explain** (teacher), **hint** (Socratic — hard rule against full
solutions), **interview** (one question at a time, 1–5 grading, rotates
fundamentals/design/behavioral), **customer** (Mom-Test-aware stakeholder
role-play with a `debrief` escape hatch). Multi-turn history (last 8 turns) is
kept client-side and replayed — the server stays stateless.

### Voice conversation (phase 2 — designed, not yet built)

The architecture keeps voice as a pure add-on:

1. **STT**: browser `MediaRecorder` → `/api/transcribe` (Whisper-class model via
   the same OpenAI-compatible gateway). The transcript enters the existing
   `messages` array — no changes to tutor logic.
2. **TTS**: teacher responses already stream as text; a `/api/speak` route
   returns audio (provider TTS), played via an `<audio>` queue with barge-in
   (recorder pause on playback start).
3. **State**: conversation state is already client-held and serializable; a voice
   session is the same `Turn[]` with an input/output modality flag.
4. **Curriculum grounding**: Day 131 (audio & voice agents) teaches exactly this
   stack, so the feature doubles as course material.

Endpoints stay OpenAI-compatible so a self-hosted stack (faster-whisper + Piper)
can replace hosted APIs without UI changes.

## Accessibility & responsiveness

Semantic landmarks, aria labels on interactive controls (viz player, quiz
options, flashcards, code runners), `:focus-visible` outlines from the design
system, color pairs drawn from the ELI5Code OKLCH ramps (AA on both themes),
keyboard operation for the flashcard flip (space/enter) and code run (⌘/Ctrl+Enter),
`prefers` behavior via explicit theme toggle stamped on `<html>`, and layout
grids that collapse (`hero-grid`, `cols-2`, wrapping day grid) down to ~360 px.

## Testing

- `npm test` — node:test suite validating all 180 days' structural integrity
  (the same invariants the authoring agents ran per batch).
- `npm run build` — typechecks the app and statically renders every route; a
  broken day file fails the build, so content errors can't ship silently.
- Manual flow checklist in the final section of this doc's companion (README).
