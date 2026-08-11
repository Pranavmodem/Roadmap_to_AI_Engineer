import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * AI teacher proxy. The API key lives ONLY in server env vars — never shipped
 * to the browser. Works with any OpenAI-compatible chat endpoint.
 *
 * Env (set in your host, e.g. Vercel):
 *   AI_API_KEY  (required)
 *   AI_API_URL  (default https://openrouter.ai/api)
 *   AI_MODEL    (default anthropic/claude-sonnet-5)
 *   AI_FALLBACK_MODEL (optional second try)
 */

const DEFAULT_MODEL = "anthropic/claude-sonnet-5";

// Naive per-IP rate limit (best-effort per serverless instance): 10 req/min.
const hits = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const windowStart = now - 60_000;
  const list = (hits.get(ip) ?? []).filter((t) => t > windowStart);
  if (list.length >= 10) return true;
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return false;
}

const STYLE = {
  eli5: "Explain like the learner is five: one vivid real-world analogy first, then connect it to the technical idea. No jargon without immediately translating it. Reuse the program's standing analogies where natural (LLM = polymath, system prompt = briefing memo, RAG = open-book exam, agent = intern with a to-do list, embeddings = map of meaning, evals = the exam written before the student exists, tracing = flight recorder, git = time machine, gradient descent = rolling downhill in fog).",
  tech: "Answer precisely with correct technical terminology, like a senior engineer mentoring a junior. Short code snippets when they sharpen the point.",
};

const TUTOR = {
  explain:
    "Role: patient teacher. Answer the learner's question at the requested style level. End with one short check-for-understanding question.",
  hint:
    "Role: Socratic coach. NEVER give the full solution or complete corrected code. Diagnose where they are, then give ONE next-step hint (two at most), phrased as a question or a pointer. If they paste code, point at the suspicious line rather than fixing it. If they ask for the full answer, offer a bigger hint instead and remind them the struggle is the learning.",
  interview:
    "Role: technical interviewer for AI Engineer / Forward-Deployed Engineer roles. Ask ONE question at a time (rotate: LLM fundamentals, RAG/agents/evals system design, coding reasoning, behavioral). After the candidate answers, grade it 1–5 with specific feedback (what a strong answer includes), then ask the next question or a follow-up probe. Stay in character.",
  customer:
    "Role: customer in an FDE discovery/delivery simulation. Play a realistic, slightly busy stakeholder (invent a plausible company and pain unless the learner specifies one). Be concrete about workflows, constraints, and politics; volunteer nothing important unless asked good questions; push back on vague or leading questions the way The Mom Test warns about. If the learner says 'debrief', break character and grade their discovery technique with specific improvements.",
};

interface Turn {
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: Request) {
  const apiKey = process.env.AI_API_KEY;
  const baseUrl = (process.env.AI_API_URL ?? "https://openrouter.ai/api").replace(/\/$/, "");
  const model = process.env.AI_MODEL ?? DEFAULT_MODEL;
  const fallback = process.env.AI_FALLBACK_MODEL;

  if (!apiKey) {
    return NextResponse.json(
      { error: "The AI teacher isn't configured yet. Set AI_API_KEY (and optionally AI_API_URL / AI_MODEL) in your server env — see README." },
      { status: 503 }
    );
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: "That's a lot of questions at once — give it a minute and try again." },
      { status: 429 }
    );
  }

  let body: { messages?: Turn[]; style?: string; tutorMode?: string; page?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const messages = (body.messages ?? [])
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-8)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));
  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return NextResponse.json({ error: "Ask a question first!" }, { status: 400 });
  }

  const style = STYLE[body.style === "tech" ? "tech" : "eli5"];
  const tutor = TUTOR[(body.tutorMode as keyof typeof TUTOR) ?? "explain"] ?? TUTOR.explain;
  const page = (body.page ?? "/").slice(0, 100);

  const system = `You are the AI teacher inside "AI ENGINEER / 180", an interactive 180-day program taking a beginner to job-ready AI Engineer and Forward-Deployed Engineer. The curriculum: Phase 1 Code Foundations (Python, git, testing, D1–21), Phase 2 CS Core (DSA, SQL, OS, networking, security, system design, D22–49), Phase 3 Math for ML (D50–63), Phase 4 Data & ML (D64–84), Phase 5 Deep Learning & Transformers (D85–105), Phase 6 AI Engineering (APIs, prompting, RAG, agents, MCP, fine-tuning, security, D106–133), Phase 7 Evals & Observability (D134–147), Phase 8 Production & MLOps (D148–161), Phase 9 FDE & Capstone (D162–180). The learner is on page ${page} (day pages are /day/dNNN — infer their progress and pitch accordingly; assume only earlier days are known).

${tutor}

Style: ${style}

Keep responses under 300 words. Format with short paragraphs, **bold** key terms, backticked code identifiers, numbered steps where helpful — no tables, no heading syntax.`;

  const callModel = async (m: string) => {
    const res = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: m,
        max_tokens: 900,
        messages: [{ role: "system", content: system }, ...messages],
      }),
      signal: AbortSignal.timeout(45_000),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`upstream ${res.status}: ${text.slice(0, 200)}`);
    }
    const data = await res.json();
    const answer: string | undefined = data?.choices?.[0]?.message?.content;
    if (!answer) throw new Error("empty answer");
    return answer;
  };

  try {
    return NextResponse.json({ answer: await callModel(model) });
  } catch (e) {
    console.error(`AI model ${model} failed:`, e);
    if (fallback && fallback !== model) {
      try {
        return NextResponse.json({ answer: await callModel(fallback) });
      } catch (e2) {
        console.error(`AI fallback ${fallback} failed:`, e2);
      }
    }
    return NextResponse.json(
      { error: "The AI teacher is briefly unavailable (busy or rate-limited). Try again in a minute." },
      { status: 502 }
    );
  }
}
