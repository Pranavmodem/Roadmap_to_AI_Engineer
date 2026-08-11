"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useJourney } from "@/lib/store";
import { getSupabase, authEnabled } from "@/lib/supabase";
import { summarizeProgress } from "@/lib/progress";

export default function AccountPage() {
  const router = useRouter();
  const authUser = useJourney((s) => s.authUser);
  const authReady = useJourney((s) => s.authReady);
  const hydrated = useJourney((s) => s.hasHydrated);
  const completedDays = useJourney((s) => s.completedDays);
  const quizScores = useJourney((s) => s.quizScores);
  const startDate = useJourney((s) => s.startDate);
  const activityDates = useJourney((s) => s.activityDates);
  const srs = useJourney((s) => s.srs);
  const resetProgress = useJourney((s) => s.resetProgress);

  const [newPassword, setNewPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);

  if (!authEnabled) {
    return (
      <div className="page" style={{ maxWidth: 520 }}>
        <h1>Account</h1>
        <p className="text-muted">Accounts aren't configured on this deployment — see the README's auth section.</p>
      </div>
    );
  }
  if (authReady && !authUser) {
    return (
      <div className="page" style={{ maxWidth: 520 }}>
        <h1 style={{ marginBottom: "var(--space-3)" }}>Account</h1>
        <p className="text-muted" style={{ marginBottom: "var(--space-4)" }}>You're browsing as a guest.</p>
        <span style={{ display: "flex", gap: 8 }}>
          <Link href="/login" className="btn btn-secondary">Log in</Link>
          <Link href="/signup" className="btn btn-primary">Create account</Link>
        </span>
      </div>
    );
  }

  const s = summarizeProgress(
    hydrated ? completedDays : [], hydrated ? quizScores : {}, hydrated ? startDate : null,
    hydrated ? activityDates : [], hydrated ? srs : {}
  );

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(""); setErr("");
    if (newPassword.length < 8) return setErr("Password needs at least 8 characters.");
    const sb = getSupabase();
    if (!sb) return;
    const { error } = await sb.auth.updateUser({ password: newPassword });
    if (error) setErr(error.message);
    else { setMsg("Password updated."); setNewPassword(""); }
  };

  const signOut = async () => {
    await getSupabase()?.auth.signOut();
    router.push("/");
  };

  return (
    <div className="page" style={{ maxWidth: 560 }}>
      <div className="kicker" style={{ marginBottom: 4 }}>your account</div>
      <h1 style={{ marginBottom: "var(--space-6)" }}>@{authUser?.username ?? "…"}</h1>

      <section className="blueprint" style={{ padding: "var(--space-6)", marginBottom: "var(--space-4)" }}>
        <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />
        <div className="kicker" style={{ marginBottom: "var(--space-3)" }}>Profile & progress</div>
        <table className="table" style={{ fontSize: 13.5 }}>
          <tbody>
            <tr><td className="text-muted">Email</td><td>{authUser?.email}</td></tr>
            <tr><td className="text-muted">Days complete</td><td>{s.completedCount} / {s.totalDays}</td></tr>
            <tr><td className="text-muted">Program mastery</td><td>{s.programMastery}%</td></tr>
            <tr><td className="text-muted">Streak</td><td>{s.streak} days · {s.xp} XP</td></tr>
            <tr><td className="text-muted">Sync</td><td>✓ progress syncs to your account across devices</td></tr>
          </tbody>
        </table>
      </section>

      <section className="blueprint" style={{ padding: "var(--space-6)", marginBottom: "var(--space-4)" }}>
        <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />
        <div className="kicker" style={{ marginBottom: "var(--space-3)" }}>Change password</div>
        <form onSubmit={changePassword} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input className="input" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password (8+ characters)" autoComplete="new-password" style={{ flex: "1 1 220px" }} />
          <button className="btn btn-primary">Update</button>
        </form>
        {msg && <p style={{ color: "var(--color-accent-700)", fontSize: 13, marginTop: 8, marginBottom: 0 }}>✓ {msg}</p>}
        {err && <p style={{ color: "var(--color-accent-700)", fontSize: 13, marginTop: 8, marginBottom: 0 }}>{err}</p>}
      </section>

      <section style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <button className="btn btn-secondary" onClick={signOut}>Sign out</button>
        {confirmReset ? (
          <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span className="text-muted" style={{ fontSize: 13 }}>Wipe local progress on this device?</span>
            <button className="btn btn-primary" onClick={() => { resetProgress(); setConfirmReset(false); }}>Yes, reset</button>
            <button className="btn btn-ghost" onClick={() => setConfirmReset(false)}>Cancel</button>
          </span>
        ) : (
          <button className="btn btn-ghost" onClick={() => setConfirmReset(true)} style={{ fontSize: 13 }}>
            Reset local progress…
          </button>
        )}
      </section>
    </div>
  );
}
