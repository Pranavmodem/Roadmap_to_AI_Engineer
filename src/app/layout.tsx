import type { Metadata } from "next";
import "./design.css";
import "./globals.css";
import NavBar from "@/components/NavBar";
import AskAI from "@/components/AskAI";
import AuthProvider from "@/components/AuthProvider";
import SyncProvider from "@/components/SyncProvider";

export const metadata: Metadata = {
  title: "AI Engineer / 180 — from zero to forward-deployed",
  description:
    "180 days, 2 hours a day: a complete, interactive path from beginner to job-ready AI Engineer and Forward-Deployed Engineer. Runnable code, step visualizers, spaced repetition, evals, and a production capstone.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <AuthProvider>
          <SyncProvider>
            <NavBar />
            <main style={{ flex: 1, width: "100%" }}>{children}</main>
            <AskAI />
          </SyncProvider>
        </AuthProvider>
        <footer
          className="text-muted"
          style={{ borderTop: "1px solid var(--color-divider)", padding: "var(--space-6) var(--space-8)", fontSize: 12, textAlign: "center" }}
        >
          AI ENGINEER / 180 · 26 weeks — 2 hours a day — beginner to forward-deployed · progress lives in your browser
        </footer>
      </body>
    </html>
  );
}
