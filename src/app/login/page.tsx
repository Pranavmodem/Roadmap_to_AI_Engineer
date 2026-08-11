"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabase, getLoginEmail, authEnabled } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState(""); // email OR username
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!authEnabled) {
    return (
      <div className="page" style={{ maxWidth: 480 }}>
        <h1 style={{ marginBottom: "var(--space-3)" }}>Log in</h1>
        <p className="text-muted">
          Accounts aren't configured on this deployment — progress is saved in your browser.
          To enable login and cross-device sync, set <code className="mono">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code className="mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> (see the README's auth section).
        </p>
        <Link href="/dashboard" className="btn btn-primary">Back to the dashboard</Link>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const sb = getSupabase();
    if (!sb) return setError("Login isn't available right now.");
    setLoading(true);
    try {
      let email = identifier.trim();
      if (!email.includes("@")) {
        const resolved = await getLoginEmail(email);
        if (!resolved) {
          setError("No account found with that username.");
          return;
        }
        email = resolved;
      }
      const { error: err } = await sb.auth.signInWithPassword({ email, password });
      if (err) return setError(err.message);
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page" style={{ maxWidth: 440 }}>
      <div className="kicker" style={{ marginBottom: 4 }}>Welcome back</div>
      <h1 style={{ marginBottom: "var(--space-6)" }}>Log in</h1>
      <form onSubmit={submit} className="blueprint" style={{ padding: "var(--space-6)", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />
        <div className="field">
          <label>Email or username</label>
          <input className="input" required value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="you@example.com — or just your username" autoComplete="username" />
        </div>
        <div className="field">
          <label>Password</label>
          <input className="input" required type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        </div>
        {error && <p style={{ color: "var(--color-accent-700)", fontSize: 13, margin: 0 }}>{error}</p>}
        <button className="btn btn-primary btn-block" disabled={loading}>
          {loading ? "Logging in…" : "Log in"}
        </button>
        <p className="text-muted" style={{ fontSize: 12.5, textAlign: "center", margin: 0 }}>
          New here? <Link href="/signup">Create a free account</Link>
        </p>
      </form>
    </div>
  );
}
