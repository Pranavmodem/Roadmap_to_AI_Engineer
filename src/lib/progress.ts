import { allDays, phases, getDayByNumber, PROGRAM_DAYS, HOURS_PER_DAY, Day, Phase } from "./curriculum";
import type { QuizResult } from "./store";
import { CardState, isDue } from "./srs";

export interface PhaseMastery {
  phase: Phase;
  completedCount: number;
  totalDays: number;
  completionPct: number; // 0–100
  quizPct: number | null; // null when no quizzes taken yet
  /** 60% completion + 40% quiz accuracy (completion-only until a quiz exists) */
  mastery: number;
  unlocked: boolean;
}

export interface Revision {
  day: Day;
  reason: string;
}

export interface ProgressSummary {
  completedCount: number;
  totalDays: number;
  programPct: number;
  /** Calendar day of the journey, 1-based; 0 if not started */
  calendarDay: number;
  streak: number;
  xp: number;
  level: number;
  hoursLogged: number;
  programMastery: number;
  phaseMastery: PhaseMastery[];
  dueCards: number;
  revisions: Revision[];
}

const XP_PER_DAY = 50;
const XP_QUIZ_PERFECT = 15;

export function summarizeProgress(
  completedDays: string[],
  quizScores: Record<string, QuizResult>,
  startDate: string | null,
  activityDates: string[] = [],
  srs: Record<string, CardState> = {},
  now: Date = new Date()
): ProgressSummary {
  const done = new Set(completedDays);
  const completedCount = allDays.filter((d) => done.has(d.id)).length;

  let xp = completedCount * XP_PER_DAY;
  for (const r of Object.values(quizScores)) {
    if (r.total > 0 && r.correct === r.total) xp += XP_QUIZ_PERFECT;
  }
  const level = Math.floor(xp / 300) + 1;

  let calendarDay = 0;
  if (startDate) {
    const ms = now.getTime() - new Date(startDate).getTime();
    calendarDay = Math.max(1, Math.min(PROGRAM_DAYS, Math.floor(ms / 86_400_000) + 1));
  }

  // streak: consecutive days ending today or yesterday
  const days = new Set(activityDates);
  let streak = 0;
  const cursor = new Date(now);
  const key = (d: Date) => d.toISOString().slice(0, 10);
  if (!days.has(key(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (days.has(key(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  const phaseMastery: PhaseMastery[] = phases.map((p, i) => {
    const inPhase = allDays.filter((d) => d.day >= p.days[0] && d.day <= p.days[1]);
    const completed = inPhase.filter((d) => done.has(d.id));
    const completionPct = inPhase.length ? (completed.length / inPhase.length) * 100 : 0;
    const scores = inPhase.map((d) => quizScores[d.id]).filter(Boolean) as QuizResult[];
    const quizPct = scores.length
      ? (scores.reduce((s, r) => s + r.correct, 0) / Math.max(1, scores.reduce((s, r) => s + r.total, 0))) * 100
      : null;
    const mastery = quizPct == null ? completionPct * 0.6 : completionPct * 0.6 + quizPct * 0.4;
    return {
      phase: p,
      completedCount: completed.length,
      totalDays: inPhase.length,
      completionPct: Math.round(completionPct),
      quizPct: quizPct == null ? null : Math.round(quizPct),
      mastery: Math.round(mastery),
      unlocked: isPhaseUnlocked(i, completedDays),
    };
  });

  const weights = phases.map((p) => p.days[1] - p.days[0] + 1);
  const programMastery = Math.round(
    phaseMastery.reduce((s, pm, i) => s + pm.mastery * weights[i], 0) /
      weights.reduce((a, b) => a + b, 0)
  );

  const todayStr = key(now);
  let dueCards = 0;
  for (const d of allDays) {
    if (!done.has(d.id)) continue; // only completed days feed the deck
    d.flashcards.forEach((_, i) => {
      if (isDue(srs[`${d.id}:${i}`], todayStr)) dueCards++;
    });
  }

  return {
    completedCount,
    totalDays: allDays.length,
    programPct: Math.round((completedCount / Math.max(1, allDays.length)) * 100),
    calendarDay,
    streak,
    xp,
    level,
    hoursLogged: completedCount * HOURS_PER_DAY,
    programMastery,
    phaseMastery,
    dueCards,
    revisions: recommendRevisions(completedDays, quizScores),
  };
}

/** A phase unlocks when ≥70% of the previous phase's days are complete. */
export function isPhaseUnlocked(phaseIndex: number, completedDays: string[]): boolean {
  if (phaseIndex === 0) return true;
  const prev = phases[phaseIndex - 1];
  const done = new Set(completedDays);
  const inPrev = allDays.filter((d) => d.day >= prev.days[0] && d.day <= prev.days[1]);
  const count = inPrev.filter((d) => done.has(d.id)).length;
  return count >= Math.ceil(inPrev.length * 0.7);
}

/**
 * Targeted revision queue: every missed quiz question points at the day to
 * restudy. Sorted by how often a day was missed, capped at 6.
 */
export function recommendRevisions(
  completedDays: string[],
  quizScores: Record<string, QuizResult>
): Revision[] {
  const done = new Set(completedDays);
  const missCount = new Map<number, number>();
  for (const [dayId, r] of Object.entries(quizScores)) {
    for (const revisitDay of r.missed) {
      missCount.set(revisitDay, (missCount.get(revisitDay) ?? 0) + 1);
    }
    // low score on the day itself
    if (r.total > 0 && r.correct / r.total < 0.67) {
      const d = allDays.find((x) => x.id === dayId);
      if (d) missCount.set(d.day, (missCount.get(d.day) ?? 0) + 1);
    }
  }
  return Array.from(missCount.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([dayNum, n]) => {
      const day = getDayByNumber(dayNum);
      if (!day) return null;
      return {
        day,
        reason: done.has(day.id)
          ? `Missed ${n} quiz question${n > 1 ? "s" : ""} tied to this day — review the concept and retake the quiz.`
          : `Quiz questions point here and it isn't complete yet — study this day.`,
      };
    })
    .filter(Boolean)
    .slice(0, 6) as Revision[];
}
