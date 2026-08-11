import DependencyMap from "@/components/DependencyMap";

export const metadata = { title: "Dependency map — AI Engineer / 180" };

export default function MapPage() {
  return (
    <div className="page" style={{ maxWidth: 1300 }}>
      <div className="kicker" style={{ marginBottom: "var(--space-2)" }}>topic dependency map</div>
      <h1 style={{ marginBottom: "var(--space-2)" }}>What builds on what</h1>
      <p className="text-muted" style={{ maxWidth: "70ch", marginBottom: "var(--space-6)" }}>
        Every day declares its prerequisites; this map draws them. Hover a day to highlight what it
        builds on (upstream, solid) and what it unlocks (downstream, dashed). Click to open the lesson.
        Days are columns per week; color = phase.
      </p>
      <DependencyMap />
    </div>
  );
}
