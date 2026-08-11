"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useJourney } from "@/lib/store";
import { allDays } from "@/lib/curriculum";

/** Jumps to the learner's next incomplete day (self-paced "today"). */
export default function TodayPage() {
  const router = useRouter();
  const hydrated = useJourney((s) => s.hasHydrated);
  const completedDays = useJourney((s) => s.completedDays);
  const startJourney = useJourney((s) => s.startJourney);

  useEffect(() => {
    if (!hydrated) return;
    startJourney();
    const done = new Set(completedDays);
    const next = allDays.find((d) => !done.has(d.id)) ?? allDays[allDays.length - 1];
    router.replace(`/day/${next.id}`);
  }, [hydrated, completedDays, router, startJourney]);

  return (
    <div style={{ padding: "var(--space-8)", textAlign: "center" }} className="text-muted">
      Finding today's session…
    </div>
  );
}
