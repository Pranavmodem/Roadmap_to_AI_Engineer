# AI ENGINEER / 180

**180 days, 2 hours a day: a complete, interactive path from absolute beginner to
job-ready AI Engineer and Forward-Deployed Engineer.**

Built on the ELI5Code design system ("Industry" light / "Nocturne" dark), this is
not a roadmap of links — it's a full bootcamp in a website:

- **180 sequenced days** across 9 phases and 26 weeks — Python → CS core → math →
  ML → deep learning & transformers → AI engineering (RAG, agents, MCP, security) →
  evals & observability → production/MLOps → FDE craft & capstone.
- **Every day**: objectives, prerequisites, an analogy-first ELI5 explanation with a
  one-click flip to full technical depth, why-it-matters on the job, guided
  exercises with **code that runs in your browser** (Python via Pyodide/WebAssembly),
  independent practice, a rubric-graded project, common mistakes, a 3-question
  mastery quiz, verified resources with time estimates, a ~120-minute schedule,
  completion criteria, and connections backward/forward.
- **Visual flow system**: step-through visualizers (play/pause/step/predict) for
  algorithms, math, and AI pipelines — growth curves, binary search, dot products,
  gradient descent, attention heatmaps, tokenization, the RAG pipeline, the tool-use
  loop, the agent loop, eval loops, prompt-injection defense, Docker layers, and
  AI system design.
- **Mastery tracking**: phase mastery = 60% completion + 40% quiz accuracy. Missed
  quiz questions generate targeted revision recommendations pointing at the exact
  day to restudy.
- **Spaced repetition**: every day emits flashcards; an SM-2-lite scheduler brings
  them back right before you'd forget (Review page). Weekly review days re-quiz the
  week cumulatively.
- **AI teacher** (floating 🎓): explain / hint (never spoils solutions) / mock
  interviewer / **customer simulator** for FDE discovery practice — honoring the
  same ELI5⇄Tech toggle.
- **Project workspaces**: 30+ build checkpoints and a production capstone (docs-QA
  RAG service with hybrid retrieval, guardrails, eval harness + CI gate, tracing,
  Docker deploy, monitoring, cost analysis, runbook, demo).
- **Search, bookmarks, notes, snippets, dependency map, streaks & XP** — all local-first.

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
```

That's it. Progress, notes, snippets, and the flashcard scheduler live in your
browser's localStorage — no account, no database.

### Enable the AI teacher (optional)

Copy `.env.example` to `.env.local` and set `AI_API_KEY` (plus optionally
`AI_API_URL` / `AI_MODEL` — any OpenAI-compatible chat endpoint works; OpenRouter
is the easy default). The key stays server-side; without it, the teacher panel
shows a setup message and everything else still works.

### Build, test, deploy

```bash
npm test           # data-integrity tests over all 180 days
npm run build      # production build (statically generates all 180 day pages)
npm start
```

Deploys anywhere Next.js 14 runs (Vercel is zero-config: set the env vars in the
dashboard).

## Repository map

```
src/
  app/            # routes: / dashboard curriculum day/[dayId] today review
                  #         projects search notes resources map api/ask
  components/     # DayView, Dashboard, VizPlayer (12 render families),
                  # CodeRunner (Pyodide), QuizBlock, DependencyMap, AskAI, …
  lib/            # curriculum.ts (types+API), progress.ts (mastery/streaks/
                  # revision), srs.ts (SM-2-lite), store.ts (zustand), viz.ts
  data/           # phases.js, days-*.js (13 batches = 180 days),
                  # visualizers.js (step-scripts), resources.js
docs/
  curriculum-outline.md   # the master 180-day design + rationale + sources
  authoring-guide.md      # day schema, voice rules, and the exemplar day
  resource-pool.md        # the verified-link library
  architecture.md         # system design, data model, voice-tutor roadmap
tests/            # node --test data-integrity suite
```

## Content principles

- **No pirated material.** Every cited resource is legally free (official docs,
  open textbooks, OCW, arXiv) or an official purchase page. All URLs verified live.
- **Nothing assumed before it's taught.** Prereqs are explicit per day and drawn as
  a dependency map (`/map`).
- **Consistent analogies** carried through 180 days: the LLM is a *polymath*, the
  system prompt a *briefing memo*, RAG an *open-book exam*, an agent an *intern
  with a to-do list*, evals *the exam you write before the student exists*, git a
  *time machine*, gradient descent *rolling downhill in fog*.
- **Ship daily.** Every day ends with an artifact against a measurable rubric; the
  capstone is a real, deployable system and the repo doubles as a portfolio.

See `docs/architecture.md` for the data model, mastery math, and the phase-2 plan
for voice conversation with the AI teacher.
