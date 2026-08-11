import { notFound } from "next/navigation";
import { allDays, getDay } from "@/lib/curriculum";
import DayView from "@/components/DayView";

export function generateStaticParams() {
  return allDays.map((d) => ({ dayId: d.id }));
}

export function generateMetadata({ params }: { params: { dayId: string } }) {
  const d = getDay(params.dayId);
  return { title: d ? `Day ${d.day}: ${d.title} — AI Engineer / 180` : "Day" };
}

export default function DayPage({ params }: { params: { dayId: string } }) {
  if (!getDay(params.dayId)) notFound();
  return <DayView id={params.dayId} />;
}
