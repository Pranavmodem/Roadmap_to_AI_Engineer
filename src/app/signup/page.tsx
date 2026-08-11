"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabase, isUsernameAvailable, authEnabled } from "@/lib/supabase";

const ROLES = ["Student", "Working professional", "Career switcher", "Educator", "Other"];
const EXPERIENCE = ["Total beginner", "Know some basics", "Some coding, new to AI", "Returning after a break"];

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    username: "",
    password: "",
    role: ROLES[0],
    experience: EXPERIENCE[0],
    goal: "",
  });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  if (!authEnabled) {
    return (
      <div className="page" style={{ maxWidth: 480 }}>
        <h1 style={{ marginBottom: "var(--space-3)" }}>Create your account</h1>
        <p className="text-muted">
          Accounts aren't configured on this deployment — progress is saved in your browser.
          To enable signup and cross-device sync, set the Supabase env vars (see the README's auth section).
        </p>
        <Link href="/dashboard" className="btn btn-primary">Back to the dashboard</Link>
      </div>
    );
  }

  const set =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm({ ...form, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const sb = getSupabase();
    if (!sb) return setError("Signup isn't available right now.");
    if (form.username.trim().length < 3) return setError("Username needs at least 3 characters.");
    if (form.password.length < 8) return setError("Password needs at least 8 characters.");
    setLoading(true);
    try {
      if (!(await isUsernameAvailable(form.username.trim()))) {
        setError("That username is taken — try another.");
        return;
      }
      const { data, error: err } = await sb.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/login` : undefined,
          data: {
            username: form.username.trim(),
            role: form.role,
            experience: form.experience,
            goal: form.goal.trim(),
          },
        },
      });
      if (err) return setError(err.message);
      if (data.session) router.push("/dashboard");
      else setNotice("Almost there — check your email for a confirmation link, then log in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page" style={{ maxWidth: 500 }}>
      <div className="kicker" style={{ marginBottom: 4 }}>Free forever</div>
      <h1 style={{ marginBottom: "var(--space-2)" }}>Create your account</h1>
      <p className="text-muted" style={{ fontSize: 13.5, marginBottom: "var(--space-6)" }}>
        Your 180-day progress, quiz mastery, flashcard schedule, notes and snippets sync across
        devices — and guest progress on this device merges in automatically.
      </p>

      {notice ? (
        <div className="blueprint" style={{ padding: "var(--space-6)" }}>
          <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />
          <p style={{ margin: 0, color: "var(--color-accent-700)" }}>✓ {notice}</p>
        </div>
      ) : (
        <form onSubmit={submit} className="blueprint" style={{ padding: "var(--space-6)", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />
          <div className="field">
            <label>Email</label>
            <input className="input" required type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" />
          </div>
          <div className="field">
            <label>Username</label>
            <input className="input" required value={form.username} onChange={set("username")} placeholder="future_fde" minLength={3} maxLength={24} />
          </div>
          <div className="field">
            <label>Password</label>
            <input className="input" required type="password" value={form.password} onChange={set("password")} placeholder="At least 8 characters" minLength={8} autoComplete="new-password" />
          </div>
          <div className="cols-2">
            <div className="field">
              <label>I am a…</label>
              <select className="input" value={form.role} onChange={set("role")}>
                {ROLES.map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Experience</label>
              <select className="input" value={form.experience} onChange={set("experience")}>
                {EXPERIENCE.map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div className="field">
            <label>Your goal (optional)</label>
            <input className="input" value={form.goal} onChange={set("goal")} placeholder="e.g. land an AI engineer role by summer" />
          </div>
          {error && <p style={{ color: "var(--color-accent-700)", fontSize: 13, margin: 0 }}>{error}</p>}
          <button className="btn btn-primary btn-block" disabled={loading}>
            {loading ? "Creating account…" : "Start my 180 days"}
          </button>
          <p className="text-muted" style={{ fontSize: 12.5, textAlign: "center", margin: 0 }}>
            Already have an account? <Link href="/login">Log in</Link> · <Link href="/day/d001">Try Day 1 first</Link>
          </p>
        </form>
      )}
    </div>
  );
}
