// SM-2-lite spaced repetition. Cards are keyed `${dayId}:${index}` into that
// day's flashcards array. Grades: 0 = again, 1 = good, 2 = easy.

export interface CardState {
  ease: number; // growth factor, starts 2.5, floor 1.3
  interval: number; // days until next review
  due: string; // yyyy-mm-dd
  reps: number;
}

export const todayKey = (d: Date = new Date()) => d.toISOString().slice(0, 10);

function plusDays(n: number, from: Date = new Date()): string {
  const d = new Date(from);
  d.setDate(d.getDate() + Math.round(n));
  return todayKey(d);
}

export function initialCard(): CardState {
  return { ease: 2.5, interval: 0, due: todayKey(), reps: 0 };
}

export function gradeCard(card: CardState, grade: 0 | 1 | 2): CardState {
  if (grade === 0) {
    // lapse: shrink ease, see it again tomorrow
    return { ease: Math.max(1.3, card.ease - 0.2), interval: 1, due: plusDays(1), reps: card.reps + 1 };
  }
  const ease = grade === 2 ? card.ease + 0.1 : card.ease;
  const interval =
    card.reps === 0 ? 1 :
    card.reps === 1 ? 3 :
    Math.min(60, card.interval * ease * (grade === 2 ? 1.3 : 1));
  return { ease, interval, due: plusDays(interval), reps: card.reps + 1 };
}

export function isDue(card: CardState | undefined, on: string = todayKey()): boolean {
  return !card || card.due <= on;
}
