import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CardState, gradeCard, initialCard } from "./srs";

export type Mode = "eli5" | "tech";
export type Theme = "light" | "dark";

export interface QuizResult {
  correct: number;
  total: number;
  /** revisit-day numbers of missed questions (deduped) */
  missed: number[];
  ts: string;
}

export interface Snippet {
  id: string;
  title: string;
  lang: string;
  code: string;
  dayId?: string;
  ts: string;
}

interface JourneyState {
  /** Global explanation mode: ELI5 analogies vs technical depth */
  mode: Mode;
  theme: Theme;
  /** ISO date the learner started the 180-day journey */
  startDate: string | null;
  /** yyyy-mm-dd days with activity — drives the streak */
  activityDates: string[];
  /** Day ids marked complete ("d001"…) */
  completedDays: string[];
  /** Latest quiz result per day id (retakes overwrite — mastery tracks latest) */
  quizScores: Record<string, QuizResult>;
  /** Bookmarked day ids */
  bookmarks: string[];
  /** Notes per day id */
  notes: Record<string, string>;
  /** Saved code snippets */
  snippets: Snippet[];
  /** Spaced-repetition card state, keyed `${dayId}:${cardIndex}` */
  srs: Record<string, CardState>;
  /** Checked rubric items per day id (project tracking) */
  projectChecks: Record<string, number[]>;
  hasHydrated: boolean;

  setMode: (m: Mode) => void;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  startJourney: () => void;
  touchActivity: () => void;
  completeDay: (dayId: string) => void;
  uncompleteDay: (dayId: string) => void;
  recordQuiz: (dayId: string, result: QuizResult) => void;
  toggleBookmark: (dayId: string) => void;
  setNote: (dayId: string, text: string) => void;
  addSnippet: (s: Omit<Snippet, "id" | "ts">) => void;
  removeSnippet: (id: string) => void;
  reviewCard: (cardKey: string, grade: 0 | 1 | 2) => void;
  toggleProjectCheck: (dayId: string, index: number) => void;
  resetProgress: () => void;
  setHasHydrated: (v: boolean) => void;
}

const today = () => new Date().toISOString().slice(0, 10);

export const useJourney = create<JourneyState>()(
  persist(
    (set, get) => ({
      mode: "eli5",
      theme: "light",
      startDate: null,
      activityDates: [],
      completedDays: [],
      quizScores: {},
      bookmarks: [],
      notes: {},
      snippets: [],
      srs: {},
      projectChecks: {},
      hasHydrated: false,

      setMode: (mode) => set({ mode }),
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set({ theme: get().theme === "light" ? "dark" : "light" }),

      startJourney: () => {
        if (!get().startDate) set({ startDate: new Date().toISOString() });
      },

      touchActivity: () => {
        const t = today();
        const { activityDates } = get();
        if (!activityDates.includes(t)) set({ activityDates: [...activityDates, t] });
      },

      completeDay: (dayId) => {
        const { completedDays, startDate } = get();
        get().touchActivity();
        if (completedDays.includes(dayId)) return;
        set({
          completedDays: [...completedDays, dayId],
          startDate: startDate ?? new Date().toISOString(),
        });
      },

      uncompleteDay: (dayId) =>
        set({ completedDays: get().completedDays.filter((id) => id !== dayId) }),

      recordQuiz: (dayId, result) => {
        get().touchActivity();
        set({ quizScores: { ...get().quizScores, [dayId]: result } });
      },

      toggleBookmark: (dayId) => {
        const { bookmarks } = get();
        set({
          bookmarks: bookmarks.includes(dayId)
            ? bookmarks.filter((b) => b !== dayId)
            : [...bookmarks, dayId],
        });
      },

      setNote: (dayId, text) => {
        const notes = { ...get().notes };
        if (text.trim()) notes[dayId] = text;
        else delete notes[dayId];
        set({ notes });
      },

      addSnippet: (s) =>
        set({
          snippets: [
            { ...s, id: crypto.randomUUID(), ts: new Date().toISOString() },
            ...get().snippets,
          ].slice(0, 500),
        }),

      removeSnippet: (id) => set({ snippets: get().snippets.filter((s) => s.id !== id) }),

      reviewCard: (cardKey, grade) => {
        get().touchActivity();
        const cur = get().srs[cardKey] ?? initialCard();
        set({ srs: { ...get().srs, [cardKey]: gradeCard(cur, grade) } });
      },

      toggleProjectCheck: (dayId, index) => {
        const cur = get().projectChecks[dayId] ?? [];
        const next = cur.includes(index) ? cur.filter((i) => i !== index) : [...cur, index];
        set({ projectChecks: { ...get().projectChecks, [dayId]: next } });
      },

      resetProgress: () =>
        set({
          startDate: null,
          activityDates: [],
          completedDays: [],
          quizScores: {},
          srs: {},
          projectChecks: {},
        }),

      setHasHydrated: (v) => set({ hasHydrated: v }),
    }),
    {
      name: "ai-engineer-180-journey",
      partialize: (s) => ({
        mode: s.mode,
        theme: s.theme,
        startDate: s.startDate,
        activityDates: s.activityDates,
        completedDays: s.completedDays,
        quizScores: s.quizScores,
        bookmarks: s.bookmarks,
        notes: s.notes,
        snippets: s.snippets,
        srs: s.srs,
        projectChecks: s.projectChecks,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
