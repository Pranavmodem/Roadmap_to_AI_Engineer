// Curriculum wrapper — merges the thirteen day-content modules (180 days total)
// into one typed API. Day content lives in src/data/days-*.js; phase metadata
// in src/data/phases.js.
// @ts-ignore untyped data module
import { DAYS_001_014 } from "@/data/days-001-014";
// @ts-ignore untyped data module
import { DAYS_015_028 } from "@/data/days-015-028";
// @ts-ignore untyped data module
import { DAYS_029_042 } from "@/data/days-029-042";
// @ts-ignore untyped data module
import { DAYS_043_056 } from "@/data/days-043-056";
// @ts-ignore untyped data module
import { DAYS_057_070 } from "@/data/days-057-070";
// @ts-ignore untyped data module
import { DAYS_071_084 } from "@/data/days-071-084";
// @ts-ignore untyped data module
import { DAYS_085_098 } from "@/data/days-085-098";
// @ts-ignore untyped data module
import { DAYS_099_112 } from "@/data/days-099-112";
// @ts-ignore untyped data module
import { DAYS_113_126 } from "@/data/days-113-126";
// @ts-ignore untyped data module
import { DAYS_127_140 } from "@/data/days-127-140";
// @ts-ignore untyped data module
import { DAYS_141_154 } from "@/data/days-141-154";
// @ts-ignore untyped data module
import { DAYS_155_168 } from "@/data/days-155-168";
// @ts-ignore untyped data module
import { DAYS_169_180 } from "@/data/days-169-180";
// @ts-ignore untyped data module
import { PHASES } from "@/data/phases";

export interface QuizQ {
  q: string;
  o: string[];
  x: number; // index of the correct option
  w: string; // why — shown after answering
  revisit?: number; // day to revisit when this question is missed
}

export interface Resource {
  label: string;
  url: string;
  type: "docs" | "course" | "video" | "paper" | "book" | "article" | "repo" | "tool";
  time: string; // e.g. "20 min", "1 h"
}

export interface Exercise {
  title: string;
  minutes: number;
  body: string; // instructions — may contain fenced ``` code blocks
  code?: string; // starter or reference code
}

export interface DayProject {
  title: string;
  brief: string;
  rubric: string[]; // measurable acceptance criteria
}

export interface Flashcard {
  f: string; // front
  b: string; // back
}

export interface Day {
  id: string; // "d001".."d180"
  day: number; // 1..180
  week: number; // 1..26 (26 = the 5-day finale)
  phase: number; // 1..9
  kind: "lesson" | "review" | "project";
  title: string;
  analogy: string; // the anchor analogy label, reused across the program
  objectives: string[];
  prereqs: { day: number; label: string }[]; // dependency map edges
  eli5: string; // beginner-friendly conceptual explanation (analogy first)
  why: string; // why this matters — tied to a real AI/FDE use case
  tech: string; // deeper technical explanation ("\n\n" paragraphs, markdown-lite)
  viz: string | null; // visualizer key (src/data/visualizers.js)
  guided: Exercise[]; // guided coding exercises
  practice: Exercise[]; // independent practice
  project: DayProject; // the day's practical task / mini-project
  mistakes: string[]; // common mistakes & misconceptions
  quiz: QuizQ[]; // knowledge check (3 questions)
  resources: Resource[];
  schedule: { activity: string; minutes: number }[]; // ≈120 min total
  completion: string[]; // completion criteria
  connections: { back: string; forward: string };
  flashcards: Flashcard[]; // feed the spaced-repetition deck
  deepDive?: { label: string; url?: string; note?: string }[]; // optional extensions
}

export interface Phase {
  id: string; // "p1".."p9"
  n: string; // "Phase 1"
  name: string;
  blurb: string;
  days: [number, number];
  weeks: [number, number];
  skills: string[]; // mastery-tracking skill labels
}

export const phases: Phase[] = PHASES as Phase[];

export const allDays: Day[] = [
  ...(DAYS_001_014 as Day[]),
  ...(DAYS_015_028 as Day[]),
  ...(DAYS_029_042 as Day[]),
  ...(DAYS_043_056 as Day[]),
  ...(DAYS_057_070 as Day[]),
  ...(DAYS_071_084 as Day[]),
  ...(DAYS_085_098 as Day[]),
  ...(DAYS_099_112 as Day[]),
  ...(DAYS_113_126 as Day[]),
  ...(DAYS_127_140 as Day[]),
  ...(DAYS_141_154 as Day[]),
  ...(DAYS_155_168 as Day[]),
  ...(DAYS_169_180 as Day[]),
].sort((a, b) => a.day - b.day);

export const PROGRAM_DAYS = 180;
export const HOURS_PER_DAY = 2;

const byId = new Map<string, Day>(allDays.map((d) => [d.id, d]));
const byNumber = new Map<number, Day>(allDays.map((d) => [d.day, d]));

export const dayId = (n: number) => `d${String(n).padStart(3, "0")}`;

export function getDay(id: string): Day | undefined {
  return byId.get(id);
}

export function getDayByNumber(n: number): Day | undefined {
  return byNumber.get(n);
}

export function phaseOfDay(n: number): Phase {
  return phases.find((p) => n >= p.days[0] && n <= p.days[1]) ?? phases[phases.length - 1];
}

export function nextDay(id: string): Day | undefined {
  const d = byId.get(id);
  return d ? byNumber.get(d.day + 1) : undefined;
}

export function prevDay(id: string): Day | undefined {
  const d = byId.get(id);
  return d ? byNumber.get(d.day - 1) : undefined;
}

/** Days that list `day` as a prerequisite — forward edges of the dependency map. */
export function unlocks(day: number): Day[] {
  return allDays.filter((d) => d.prereqs.some((p) => p.day === day));
}

/** Case-insensitive full-text search over titles, objectives, and bodies. */
export function searchDays(query: string): { day: Day; hit: string }[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const out: { day: Day; hit: string }[] = [];
  for (const d of allDays) {
    const hay: [string, string][] = [
      [d.title, "title"],
      [d.analogy, "analogy"],
      [d.objectives.join(" • "), "objectives"],
      [d.eli5, "ELI5"],
      [d.tech, "tech"],
      [d.why, "why it matters"],
      [d.mistakes.join(" • "), "mistakes"],
      [d.resources.map((r) => r.label).join(" • "), "resources"],
    ];
    for (const [text, where] of hay) {
      const i = text.toLowerCase().indexOf(q);
      if (i >= 0) {
        const start = Math.max(0, i - 40);
        out.push({
          day: d,
          hit: `${where}: …${text.slice(start, i + q.length + 60)}…`,
        });
        break;
      }
    }
  }
  return out.slice(0, 30);
}

/** Sanity-check the data set (used by tests and the build). */
export function validateCurriculum(): string[] {
  const problems: string[] = [];
  if (allDays.length !== PROGRAM_DAYS) {
    problems.push(`expected ${PROGRAM_DAYS} days, found ${allDays.length}`);
  }
  for (let n = 1; n <= PROGRAM_DAYS; n++) {
    const d = byNumber.get(n);
    if (!d) {
      problems.push(`day ${n} missing`);
      continue;
    }
    if (d.id !== dayId(n)) problems.push(`day ${n} has id ${d.id}`);
    if (!d.quiz?.length) problems.push(`day ${n} has no quiz`);
    if (!d.resources?.length) problems.push(`day ${n} has no resources`);
    if (!d.schedule?.length) problems.push(`day ${n} has no schedule`);
    const total = d.schedule.reduce((s, a) => s + a.minutes, 0);
    if (total < 100 || total > 140) problems.push(`day ${n} schedule sums to ${total} min`);
    for (const p of d.prereqs) {
      if (p.day >= n) problems.push(`day ${n} lists prereq day ${p.day} (not earlier)`);
    }
    for (const q of d.quiz) {
      if (q.x < 0 || q.x >= q.o.length) problems.push(`day ${n} quiz answer index out of range`);
    }
  }
  return problems;
}
