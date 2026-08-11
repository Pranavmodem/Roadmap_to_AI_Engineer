// Days 155–168: Phase 8 Week 23 (serving, reliability, AI system design) and
// Phase 9 Week 24 (forward-deployed craft I). Authored per docs/authoring-guide.md.
export const DAYS_155_168 = [
  {
    id: 'd155', day: 155, week: 23, phase: 8, kind: 'lesson',
    title: 'Serving & Inference Optimization',
    analogy: 'The drive-through window',
    objectives: [
      'Decompose LLM latency into TTFT, tokens/sec, and total time, and measure each',
      'Explain why continuous batching beats static batching for LLM serving',
      'Describe what the KV cache stores and why it makes generation memory-bound',
      'Compare self-hosted (vLLM-class) serving against hosted APIs on cost, control, and ops burden',
      'Produce a written latency budget for your capstone with p50/p95 numbers',
    ],
    prereqs: [
      { day: 95, label: 'The Transformer — causal masking & per-token generation' },
      { day: 107, label: 'LLM APIs II — streaming, retries & cost' },
      { day: 151, label: 'Deploy Lab — container to cloud URL' },
    ],
    eli5: `Watch a drive-through at lunch rush. The metric customers feel first is not "how long until my whole order is ready" — it is "how long until someone talks to me at the speaker." A drive-through that greets you in five seconds and hands out food steadily feels fast even when the full order takes three minutes. One that leaves you in silence for ninety seconds feels broken no matter how quickly the food appears afterward.

LLM serving is that window. Time-to-first-token (TTFT) is the greeting: how long before the first word streams back. Tokens-per-second is how steadily the food comes out. Total latency is the whole order. Users forgive a long order far more than a long silence, which is why streaming exists. And the kitchen trick that makes the whole thing scale is batching: instead of cooking one order start-to-finish before touching the next, the kitchen interleaves — a new burger joins the grill the moment a spot opens, without waiting for the current batch of orders to all finish. That is continuous batching, and it is the single biggest reason modern LLM servers serve many users on one GPU.`,
    why: `Every serious deployment conversation you will have as an AI engineer or FDE lands here within ten minutes: "it feels slow," "the GPU bill is huge," "can we handle 200 concurrent users?" If you can decompose latency into TTFT vs generation rate, explain KV-cache memory pressure, and say when self-hosting on vLLM beats a hosted API (and when it absolutely does not), you sound like someone who has shipped. On Day 160's system-design interviews and on Day 161's production cutover, the latency budget you write today is the artifact you defend.`,
    tech: `An LLM request has two phases with different bottlenecks. **Prefill** processes the whole prompt in one highly parallel pass — compute-bound, and it determines TTFT along with queueing time. **Decode** then generates one token per forward pass, each pass reading the attention keys and values of every previous token. Recomputing those every step would be quadratic waste, so servers store them in the **KV cache**: per-token, per-layer key/value tensors kept in GPU memory. Decode therefore does little math but enormous memory reading — it is memory-bandwidth-bound, and KV-cache size (which grows with batch size × context length) is what limits concurrency, not FLOPs.

### Batching: static vs continuous

Static batching pads requests into a fixed batch and runs them lockstep; the whole batch waits for its longest member, and a finished request's slot sits idle. **Continuous batching** schedules at the iteration level: every decode step, finished sequences exit and queued requests join immediately. Throughput improves several-fold at high concurrency because the GPU never idles on padding. vLLM adds **PagedAttention** — KV cache managed in fixed-size blocks like virtual-memory pages — so memory fragmentation stops capping batch size.

### The numbers that matter

Report latency as distributions, never averages (Day 58's heavy tails: production latency is log-normal-ish, and p95 is what users complain about). Track TTFT p50/p95, output tokens/sec, and total request time separately — they have different causes and different fixes. Queueing shows up in TTFT; long outputs show up in total time; fix the one you actually measured.

### Build vs rent

Hosted APIs give you frontier quality, zero ops, and per-token pricing — ideal at low or spiky volume. Self-hosting an open model on vLLM gives you data control, latency control, and a flat GPU cost that wins only when utilization is high: a rented GPU at 5% utilization is the most expensive inference on earth. The honest comparison is cost per million tokens at YOUR traffic shape, plus the engineering payroll to keep it up. Most capstone-scale products should rent; you must still be able to defend that choice with numbers.`,
    viz: 'batching-q',
    guided: [
      {
        title: 'Measure TTFT vs total latency on a real endpoint',
        minutes: 20,
        body: `1. Create \`latency_probe.py\` from the starter code. Point it at your capstone's streaming endpoint (or any streaming LLM API you have a key for).
2. Run 20 requests with a short prompt and 20 with a long prompt (paste ~2 pages of text). Record TTFT and total time for each.
3. Compute p50 and p95 for both metrics in both conditions. Notice: the long prompt moves TTFT (prefill work) far more than it moves tokens/sec.
4. Now request a long OUTPUT ("write 500 words…"). Notice the opposite: TTFT barely moves, total time balloons. You have just separated prefill cost from decode cost empirically.
5. Write four sentences: which metric moved, in which condition, and why.`,
        code: `import time, statistics, httpx

URL = "http://localhost:8000/ask"  # your capstone streaming endpoint

def probe(question: str) -> tuple[float, float]:
    t0 = time.perf_counter()
    ttft = None
    with httpx.stream("POST", URL, json={"q": question}, timeout=120) as r:
        for chunk in r.iter_text():
            if chunk and ttft is None:
                ttft = time.perf_counter() - t0
    total = time.perf_counter() - t0
    return ttft, total

def pctl(xs, p):
    xs = sorted(xs)
    return xs[min(len(xs) - 1, int(p / 100 * len(xs)))]

for label, q in [("short", "What is the vacation policy?"),
                 ("long-out", "Explain every section of the handbook in 500 words.")]:
    ttfts, totals = [], []
    for _ in range(10):
        a, b = probe(q)
        ttfts.append(a); totals.append(b)
    print(f"{label:9s} TTFT p50={pctl(ttfts,50):.2f}s p95={pctl(ttfts,95):.2f}s"
          f"  total p50={pctl(totals,50):.2f}s p95={pctl(totals,95):.2f}s")`,
      },
      {
        title: 'Simulate static vs continuous batching',
        minutes: 20,
        body: `1. Run the starter simulation. It models a GPU that decodes one token per "tick" for every sequence in the batch (max batch 8), with requests of random output lengths arriving in a queue.
2. Static mode: the batch is loaded, runs until EVERY member finishes, then reloads. Continuous mode: a finished sequence's slot is refilled from the queue on the very next tick.
3. Compare the two printed numbers: mean wait time and total ticks to drain 60 requests. Continuous should win clearly — explain where the win comes from (idle slots).
4. Set all output lengths equal and re-run. The gap nearly vanishes. Write one sentence on why variance in output length is what continuous batching exploits.`,
        code: `import random
random.seed(7)
JOBS = [random.randint(10, 200) for _ in range(60)]  # output lengths
BATCH = 8

def simulate(continuous: bool):
    queue = [[n, None] for n in JOBS]  # [tokens_left, start_tick]
    active, done, tick = [], [], 0
    while queue or active:
        if continuous or not active:          # refill rule
            while queue and len(active) < BATCH:
                job = queue.pop(0); job[1] = tick; active.append(job)
        tick += 1
        for job in active:
            job[0] -= 1
        finished = [j for j in active if j[0] <= 0]
        for j in finished:
            done.append(tick - j[1]); active.remove(j)
    return tick, sum(done) / len(done)

for mode, cont in [("static", False), ("continuous", True)]:
    ticks, mean_lat = simulate(cont)
    print(f"{mode:11s} drained in {ticks:5d} ticks, mean latency {mean_lat:7.1f}")`,
      },
    ],
    practice: [
      {
        title: 'The latency budget worksheet',
        minutes: 20,
        body: `Write \`latency_budget.md\` for your capstone. Target: a user-perceived answer start under 1.5s at p95.

Break the request into stages — auth/routing, retrieval (embed query + vector search + rerank), prefill, decode — and assign each a measured or estimated p50 and p95 using today's probe data plus Day 142's traces. The stage budgets must sum to your target. Then name, for the single worst stage, one concrete optimization (smaller reranker? shorter context? streaming earlier?) and what it would cost you in quality.

Hints (only if stuck): retrieval is usually 100–400ms; prefill scales with context tokens; the biggest lever is almost always "send fewer tokens."`,
      },
    ],
    project: {
      title: 'Capstone latency report',
      brief: `Produce \`docs/latency_report.md\` in the capstone repo: (1) a table of TTFT and total latency p50/p95 from at least 30 real requests against your staging deployment (Day 154), split by short vs long questions; (2) the stage-by-stage budget from practice; (3) one implemented improvement — e.g. start streaming before citations are assembled, cap max output tokens, or trim retrieved context — with before/after p95 numbers; (4) a five-line build-vs-rent paragraph: at your traffic, would self-hosting on vLLM ever pay? Show the arithmetic.`,
      rubric: [
        'Report contains p50 AND p95 for TTFT and total time from ≥30 real staging requests',
        'Stage budget sums to the stated target and identifies the dominant stage correctly',
        'One optimization is implemented and shows a measured p95 improvement',
        'Build-vs-rent paragraph includes cost-per-million-token arithmetic at stated traffic',
        'Committed to the capstone repo and linked from the README',
      ],
    },
    mistakes: [
      'Reporting average latency. Production latencies are heavy-tailed (Day 58); p95 is what users feel and what SLOs (Day 157) are written against. Always report percentiles.',
      'Optimizing tokens/sec when the complaint is "it hangs before answering." That is TTFT — queueing plus prefill — and the fixes (streaming, shorter context, more capacity) are different.',
      'Believing generation is compute-bound. Decode is memory-bandwidth-bound; the KV cache, not FLOPs, caps concurrency. This is why quantization and paged KV memory help so much.',
      'Assuming self-hosting is cheaper because the per-token price disappears. A GPU billed 24/7 at low utilization costs far more per token than an API; do the utilization math first.',
      'Static-batching mental model: "batch of 8 means 8× throughput." The batch runs at the speed of its slowest member; continuous batching exists precisely to fix this.',
      'Testing latency only against localhost. Network, TLS, and cold starts belong in the number — measure against the deployed staging URL from Day 154.',
    ],
    quiz: [
      {
        q: 'Users say your assistant "freezes for 4 seconds, then the answer pours out fast." Which metric is broken, and which phase causes it?',
        o: [
          'Tokens/sec — the decode phase',
          'TTFT — queueing plus the prefill phase',
          'Total latency — the network layer',
          'Throughput — the KV cache is full',
        ],
        x: 1,
        w: 'A long silence before the first token is a TTFT problem: time in queue plus prompt prefill. Fast pouring afterwards means decode throughput is fine.',
        revisit: 155,
      },
      {
        q: 'Why does continuous batching beat static batching most when output lengths vary a lot?',
        o: [
          'It compresses the KV cache',
          'Static batches idle finished slots until the longest sequence ends; continuous refills them every step',
          'It skips the prefill phase',
          'It uses lower precision arithmetic',
        ],
        x: 1,
        w: 'The win is reclaimed idle capacity. With equal lengths there is nothing to reclaim — you saw this in the simulation.',
        revisit: 155,
      },
      {
        q: 'The KV cache exists so that…',
        o: [
          'identical prompts can skip the model entirely',
          'each decode step avoids recomputing attention keys/values for all previous tokens',
          'the GPU can store multiple model copies',
          'responses can be replayed after a crash',
        ],
        x: 1,
        w: 'Without it, generating token n would recompute K/V for all n−1 predecessors — quadratic waste. Skipping identical prompts is response caching, tomorrow\'s topic.',
        revisit: 155,
      },
    ],
    resources: [
      { label: 'vLLM docs — serving, continuous batching & PagedAttention', url: 'https://docs.vllm.ai/en/latest/', type: 'docs', time: '30 min' },
      { label: 'Chip Huyen — blog (inference optimization posts)', url: 'https://huyenchip.com/blog/', type: 'article', time: '25 min' },
      { label: 'Hugging Face LLM Course — deployment chapters', url: 'https://huggingface.co/learn/llm-course/chapter1/1', type: 'course', time: '20 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: due cards from Week 22 (Docker, CI/CD, IaC)', minutes: 10 },
      { activity: 'ELI5 + tech read; sketch the prefill/decode split from memory', minutes: 20 },
      { activity: 'Guided: latency probe + batching simulation', minutes: 40 },
      { activity: 'Practice: latency budget worksheet', minutes: 20 },
      { activity: 'Project: capstone latency report with one shipped improvement', minutes: 20 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'Probe run against the deployed staging URL; percentiles recorded',
      'Batching simulation run in both modes with the variance experiment',
      'latency_report.md committed with a measured before/after improvement',
      'Quiz ≥ 2/3',
    ],
    connections: {
      back: 'Day 95 taught the per-token generation loop the KV cache accelerates; Day 107 gave you streaming and cost math; Day 151/154 gave you the deployed URL you measured today.',
      forward: 'Tomorrow (Day 156) attacks the cost side of the same numbers. Day 157 turns today\'s percentiles into SLOs, and Day 160\'s system-design answers lean on the quality/latency/cost reasoning you started here.',
    },
    flashcards: [
      { f: 'TTFT vs tokens/sec — which phase drives each?', b: 'TTFT: queueing + prefill (compute-bound). Tokens/sec: decode (memory-bandwidth-bound).' },
      { f: 'What does the KV cache store and what does it cap?', b: 'Per-token, per-layer attention keys/values in GPU memory; its size caps batch size/concurrency.' },
      { f: 'Continuous batching in one sentence?', b: 'Scheduling per decode step: finished sequences exit and queued ones join immediately — no idle padded slots.' },
      { f: 'When does self-hosting beat a hosted API?', b: 'High sustained utilization + data/latency control needs; at low/spiky volume the idle GPU loses.' },
      { f: 'Why report p95, not mean latency?', b: 'Latency is heavy-tailed; p95 is what users feel and what SLOs are written against.' },
    ],
    deepDive: [
      { label: 'PagedAttention — the vLLM paper idea in the docs', url: 'https://docs.vllm.ai/en/latest/', note: 'KV cache managed as fixed-size blocks like virtual-memory pages; fragmentation stops capping batch size. Connects back to Day 39\'s virtual-memory mental model.' },
    ],
  },
  {
    id: 'd156', day: 156, week: 23, phase: 8, kind: 'lesson',
    title: 'Caching, Batching & Cost Engineering',
    analogy: 'The pantry, again — at scale',
    objectives: [
      'Implement exact and semantic response caching and measure hit rate vs staleness risk',
      'Explain prompt-prefix caching and structure prompts to exploit it',
      'Control output length deliberately, since output tokens usually cost several times input tokens',
      'Route requests between a cheap and an expensive model by difficulty, with an escalation rule',
      'Account cost per request and per feature, and cut your capstone\'s cost measurably',
    ],
    prereqs: [
      { day: 47, label: 'Caching & queues — cache-aside, TTL, invalidation' },
      { day: 107, label: 'LLM APIs II — cost math per feature' },
      { day: 129, label: 'Model selection — cascades & routers' },
      { day: 155, label: 'Serving & inference optimization' },
    ],
    eli5: `On Day 47 the pantry was a metaphor for keeping popular ingredients within arm's reach. Now imagine the restaurant discovers that 30% of orders are literally the same dish — "the usual" — and starts plating those from a warming shelf instead of cooking from scratch. That is response caching. Then the chef notices something subtler: hundreds of different orders all start with the same base — the same stock, the same sauce. So the kitchen pre-makes the base once and only cooks the part that differs. That is prompt-prefix caching: your system prompt and few-shot examples are the stock; the provider charges you a fraction to reuse the already-processed prefix.

The last trick is staffing. You do not put the executive chef on grilled-cheese orders. A router looks at each ticket and sends easy ones to the line cook (small, cheap model) and genuinely hard ones to the executive chef (frontier model) — with a rule that a line-cook failure escalates rather than ships. Caching, prefix reuse, shorter outputs, and routing are the four levers that routinely cut LLM bills by half or more without touching quality where it matters.`,
    why: `Cost is where AI projects die quietly. A demo that costs $0.04/request is charming at 100 requests/day and a budget crisis at 100k. FDEs get asked "what will this cost at scale?" in the first customer meeting, and "why did the bill triple?" in month two. Engineers who can show a cost-per-request breakdown and then cut it 40% with caching and routing — while proving quality held via the Day 140 eval harness — are the ones trusted with production. Day 173 turns this skill into customer-facing ROI math.`,
    tech: `Start from the bill's anatomy: cost = requests × (input tokens × input price + output tokens × output price), and output tokens typically cost 3–5× input. That ordering tells you the levers.

### Lever 1 — response caching

**Exact caching** keys on a normalized request (model + prompt + parameters, hashed) and returns a stored response. Hit rates are modest for free-text chat but high for templated features. **Semantic caching** embeds the query and returns a cached answer when cosine similarity to a previous query exceeds a threshold — hit rates rise, and so does the risk of serving a subtly wrong answer ("what's the leave policy in Germany?" hitting the cached France answer). Treat the similarity threshold as a precision/recall dial, keep TTLs short for volatile knowledge, and — critically for RAG — invalidate on corpus updates, because a cached answer built on stale chunks is a groundedness bug (Day 136) users will screenshot.

### Lever 2 — prompt-prefix caching

Providers cache the internal prefill state of a prompt's prefix and charge heavily discounted rates on reuse. To exploit it, order your prompt from stable to volatile: system prompt and tool definitions first, few-shot examples next, retrieved context after, and the user's fresh question last. One prompt refactor here often outsaves weeks of clever routing.

### Lever 3 — output discipline

Set explicit max-token limits per feature, instruct for brevity in the contract ("answer in at most 120 words, then citations"), and prefer structured outputs (Day 110) over essays. Because output is the expensive direction, "stop writing sooner" is the cheapest optimization in the book.

### Lever 4 — routing by difficulty

A router (heuristics, a classifier, or a cheap-model first pass) sends easy traffic to a small model and hard traffic to a large one; a cascade instead always tries cheap-first and escalates on low confidence or failed validation. Both need the Day 140 golden set re-run per route — a router that silently degrades quality is a cost cut you will refund with interest. Log cost per request with route, cache-hit, and token counts as structured fields (Day 143) so the finance conversation is a query, not an archaeology dig.`,
    viz: 'cache-flow',
    guided: [
      {
        title: 'Build a two-tier cache wrapper',
        minutes: 25,
        body: `1. Create \`llm_cache.py\` from the starter. Tier 1 is an exact cache keyed on a hash of (model, normalized prompt, params). Tier 2 is a semantic cache using sentence-transformers embeddings with a cosine threshold.
2. Wire it in front of your capstone's answer function (cache-aside, Day 47 pattern): check exact → check semantic → call model → store.
3. Replay 30 questions from your Day 140 golden set, then replay 15 paraphrases of them (write them or generate them). Record: exact hits, semantic hits, misses.
4. Lower the semantic threshold from 0.92 to 0.80 and replay again. Find a paraphrase pair where the cache now returns a WRONG answer — that is the staleness/precision trade made visible.
5. Write down your chosen threshold and TTL, with one sentence of justification each.`,
        code: `import hashlib, json, time
from sentence_transformers import SentenceTransformer
import numpy as np

_embedder = SentenceTransformer("all-MiniLM-L6-v2")

class LLMCache:
    def __init__(self, sim_threshold=0.92, ttl_s=3600):
        self.exact, self.entries = {}, []   # entries: (vec, answer, ts)
        self.t, self.ttl = sim_threshold, ttl_s

    def _key(self, model, prompt, params):
        blob = json.dumps({"m": model, "p": prompt.strip().lower(), "x": params},
                          sort_keys=True)
        return hashlib.sha256(blob.encode()).hexdigest()

    def get(self, model, prompt, params):
        k = self._key(model, prompt, params)
        if k in self.exact and time.time() - self.exact[k][1] < self.ttl:
            return self.exact[k][0], "exact"
        v = _embedder.encode(prompt, normalize_embeddings=True)
        for vec, ans, ts in self.entries:
            if time.time() - ts < self.ttl and float(np.dot(v, vec)) >= self.t:
                return ans, "semantic"
        return None, "miss"

    def put(self, model, prompt, params, answer):
        self.exact[self._key(model, prompt, params)] = (answer, time.time())
        v = _embedder.encode(prompt, normalize_embeddings=True)
        self.entries.append((v, answer, time.time()))`,
      },
      {
        title: 'Cost accounting per request',
        minutes: 15,
        body: `1. Add a \`cost_ledger\` to your capstone: after every model call, log a structured line with feature, model, input_tokens, output_tokens, cache_status, and computed dollars (put your provider's real prices in a PRICES dict).
2. Replay your golden set through the app once with caching off, once with caching on.
3. Run the starter aggregation script over the log: cost per request p50/p95, cost per feature, and the percentage saved by caching.
4. Sanity-check against the provider dashboard's usage page — if your ledger disagrees by more than ~10%, find the uncounted call (retries and judge calls are the usual suspects).`,
        code: `import json, collections

PRICES = {"big-model": (3.00, 15.00), "small-model": (0.25, 1.25)}  # $/M in, out

def cost(model, tin, tout):
    pi, po = PRICES[model]
    return (tin * pi + tout * po) / 1_000_000

total = collections.defaultdict(float)
per_request = []
for line in open("cost_ledger.jsonl"):
    e = json.loads(line)
    c = 0 if e["cache_status"] != "miss" else cost(
        e["model"], e["input_tokens"], e["output_tokens"])
    total[e["feature"]] += c
    per_request.append(c)

per_request.sort()
n = len(per_request)
print("per-request p50 $%.5f  p95 $%.5f" %
      (per_request[n // 2], per_request[int(n * 0.95)]))
for feat, c in sorted(total.items(), key=lambda kv: -kv[1]):
    print("%-20s $%.4f" % (feat, c))`,
      },
    ],
    practice: [
      {
        title: 'The router that must not lie',
        minutes: 20,
        body: `Add difficulty routing to the capstone: questions matching "easy" criteria (short, single-fact, high retrieval confidence) go to the small model; everything else to the big one. Your escalation rule: if the small model's answer fails citation validation or the groundedness check, retry on the big model — never ship the failure.

Constraints: (1) re-run the Day 140 golden set and report pass rate per route — overall quality must not drop more than 2 points; (2) report the cost saving; (3) log the route decision so Day 157's dashboard can chart route mix.

Hints: retrieval score percentiles from Day 117 make a decent difficulty signal; when in doubt, route up.`,
      },
    ],
    project: {
      title: 'Cut the capstone\'s cost, with receipts',
      brief: `Produce \`docs/cost_report.md\`: (1) baseline cost per request and per 1k requests from the ledger, broken down by feature; (2) the three levers you applied — caching, prompt reordering for prefix cache, output caps, or routing (pick at least two) — each with its measured saving; (3) the quality guardrail: golden-set pass rate before and after, with the Day 139 error bars; (4) a projection table: monthly cost at 1k, 10k, and 100k requests/day, before vs after. This document feeds directly into Day 173's ROI one-pager.`,
      rubric: [
        'Ledger reconciles with provider dashboard within 10%',
        'At least two levers implemented with individually measured savings',
        'Combined saving ≥ 25% on the replayed golden-set workload',
        'Golden-set pass rate after changes within 2 points of baseline, CIs shown',
        'Projection table present with arithmetic a stakeholder can check',
      ],
    },
    mistakes: [
      'Shipping a semantic cache without an eval. A 0.85-similarity hit on a different-jurisdiction question is a confident wrong answer; tune the threshold against labeled paraphrase pairs, not vibes.',
      'Forgetting to invalidate the response cache when the RAG corpus updates. The retrieval index changed but the cache still serves answers grounded in deleted documents.',
      'Putting volatile content (retrieved chunks, timestamps, user name) at the TOP of the prompt — it breaks the shared prefix and forfeits prefix-cache discounts. Stable first, volatile last.',
      'Optimizing input tokens while ignoring output. Output tokens usually cost 3–5× more; a max-token cap and a brevity contract often save more than any retrieval trim.',
      'Routing to the cheap model with no escalation path. The rule is "cheap first, but never ship a validation failure" — otherwise your cost cut is a silent quality cut.',
      'Measuring savings on cache-warm replays only. Report steady-state hit rate on realistic traffic, not the 100% hit rate of replaying the same 30 questions twice.',
    ],
    quiz: [
      {
        q: 'Your prompt is: [retrieved chunks][system instructions][few-shot examples][question]. Why is prefix caching saving you almost nothing?',
        o: [
          'Prefix caching only works on outputs',
          'The volatile retrieved chunks come first, so no two requests share a prefix',
          'Few-shot examples cannot be cached',
          'The prompt is too short to cache',
        ],
        x: 1,
        w: 'Prefix caching reuses the processed leading tokens. Volatile content first means the shared prefix is empty; reorder to system → examples → chunks → question.',
        revisit: 156,
      },
      {
        q: 'A semantic cache at threshold 0.80 returns the France leave-policy answer for a Germany question. The correct first fix is…',
        o: [
          'Raise the TTL',
          'Raise the similarity threshold and/or include jurisdiction in the cache key, accepting a lower hit rate',
          'Switch to exact caching only',
          'Fine-tune the embedding model',
        ],
        x: 1,
        w: 'This is a precision failure: the threshold (or missing metadata in the key) admitted a near-neighbor with different meaning. Trade hit rate back for correctness.',
        revisit: 156,
      },
      {
        q: 'Why must the golden set be re-run after adding a cheap-model route?',
        o: [
          'To warm the cache',
          'Because routing changes which model answers which slice — quality can drop on exactly the slices routed down, invisibly',
          'Because the golden set expires weekly',
          'To recompute token prices',
        ],
        x: 1,
        w: 'A router is a behavior change like any prompt change (Day 141): without a per-route eval, you cannot distinguish a cost win from a hidden quality regression.',
        revisit: 140,
      },
    ],
    resources: [
      { label: 'Claude Docs — prompt engineering (structure prompts for caching)', url: 'https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview', type: 'docs', time: '20 min' },
      { label: 'OpenAI Cookbook — caching & cost patterns', url: 'https://github.com/openai/openai-cookbook', type: 'repo', time: '20 min' },
      { label: 'Chip Huyen — blog (cost & latency engineering posts)', url: 'https://huyenchip.com/blog/', type: 'article', time: '20 min' },
      { label: 'Sentence-Transformers docs — embeddings for the semantic cache', url: 'https://sbert.net/', type: 'docs', time: '15 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: due cards incl. Day 47 caching & Day 129 routing', minutes: 10 },
      { activity: 'ELI5 + tech read; list the four levers from memory', minutes: 15 },
      { activity: 'Guided: two-tier cache + cost ledger', minutes: 40 },
      { activity: 'Practice: difficulty router with escalation', minutes: 20 },
      { activity: 'Project: cost report with before/after and projections', minutes: 25 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'Cache wrapper live in the capstone with a justified threshold and TTL',
      'Cost ledger reconciles with the provider dashboard',
      'cost_report.md committed: ≥25% saving, quality within 2 points, projections included',
      'Quiz ≥ 2/3',
    ],
    connections: {
      back: 'This is Day 47\'s cache-aside pattern and TTL discipline applied to LLM responses, Day 107\'s cost math made operational, and Day 129\'s routing decision finally implemented with an eval guardrail from Day 140.',
      forward: 'Day 157 charts cost/request on the monitoring dashboard. Day 160\'s design answers must name these levers unprompted, and Day 173 converts today\'s cost report into the customer-facing ROI one-pager.',
    },
    flashcards: [
      { f: 'Four cost levers for LLM apps?', b: 'Response caching (exact+semantic), prompt-prefix caching, output-length discipline, difficulty routing.' },
      { f: 'Semantic cache threshold is a dial between…', b: 'Hit rate (recall) and wrong-answer risk (precision). Tune on labeled paraphrase pairs.' },
      { f: 'Prompt order for prefix caching?', b: 'Stable → volatile: system, tools, few-shots first; retrieved context and user question last.' },
      { f: 'Why is output the expensive direction?', b: 'Output tokens are priced ~3–5× input tokens; caps and brevity contracts save the most.' },
      { f: 'The router\'s iron rule?', b: 'Cheap first, but escalate on validation failure — never ship the small model\'s rejected answer.' },
      { f: 'When must a RAG response cache be invalidated?', b: 'On corpus/index updates — cached answers grounded in stale chunks are groundedness bugs.' },
    ],
    deepDive: [
      { label: 'Request coalescing', note: 'When 50 identical requests arrive in the same second (a shared dashboard, a retry storm), let one call the model and 49 await its result. Same idea as the thundering-herd cache guard from Day 47.' },
    ],
  },
  {
    id: 'd157', day: 157, week: 23, phase: 8, kind: 'lesson',
    title: 'Monitoring & SLOs',
    analogy: 'Smoke alarms for software',
    objectives: [
      'Distinguish metrics, logs, and traces and pick the right one for a given question',
      'Define SLIs and SLOs for an LLM service and compute the implied error budget',
      'Design alerts that page on user-visible symptoms, not on every internal blip',
      'Instrument a FastAPI service with request-rate, error, and latency-histogram metrics',
      'Add LLM-specific monitors: quality score, refusal rate, token spend, and drift hooks',
    ],
    prereqs: [
      { day: 58, label: 'Distributions — heavy-tailed latencies' },
      { day: 142, label: 'Tracing LLM applications' },
      { day: 146, label: 'Quality & cost dashboards' },
      { day: 155, label: 'Latency percentiles for the capstone' },
    ],
    eli5: `A house needs smoke alarms, not a fire marshal standing in every room. A good smoke alarm has three properties: it triggers on real danger (smoke, not toast — mostly), it triggers early enough to act, and it is quiet the rest of the time. An alarm that shrieks daily about toast gets its battery removed, and then the real fire finds a silent house.

Monitoring production software is the same craft. You cannot watch everything, so you choose a handful of signals that stand for user experience — "are requests succeeding? fast enough? at what cost?" — and set thresholds that mean act now. The formal version has three layers: an SLI is the measurement itself (the smoke density sensor), an SLO is the promise you set against it ("99.5% of requests succeed within 3 seconds"), and the error budget is the promise's built-in allowance for failure — the 0.5% you are permitted to burn. When the budget is burning fast, you stop shipping features and fix reliability. When it is barely touched, you are allowed to move fast. The budget turns "is it reliable enough?" from an argument into arithmetic.`,
    why: `"Do you have SLOs?" is a question customers' platform teams will ask an FDE in the security-and-operations review before any enterprise deal closes — right next to the Day 159 checklist. Internally, alert design is what determines whether your on-call weeks are calm or ruinous: teams that page on symptoms sleep; teams that page on causes drown in noise and then miss the real outage. And LLM services add monitors traditional apps never needed — a service can be 100% up, fast, and cheap while quietly answering wrongly. Day 161's cutover gate requires today's alarms wired and tested.`,
    tech: `The three telemetry types answer different questions. **Metrics** are cheap aggregated numbers over time — ideal for "is it broken?" and for alerting. **Logs** are discrete structured events — ideal for "what exactly happened on request X?". **Traces** (Day 142) tie a request's spans together — ideal for "where did the time go?". You alert on metrics, then investigate with traces and logs.

### RED, plus histograms

For a request-driven service, monitor **Rate** (requests/sec), **Errors** (failure fraction), and **Duration** (latency distribution) per endpoint. Latency must be recorded as a **histogram**, because percentiles cannot be averaged: the p95 of your service is derived from bucket counts, not from averaging per-minute p95s. Prometheus's model is exactly this — counters and histogram buckets scraped from a \`/metrics\` endpoint, with percentiles computed at query time.

### SLI → SLO → error budget

An SLI is a ratio of good events to total events: "requests answered under 3s with a 2xx" over "all requests". An SLO sets a target over a window: 99.5% over 30 days. The complement is the **error budget**: 0.5% of a month's requests — if you serve 100k/month, you may fail 500. Alerting on **burn rate** beats alerting on thresholds: page when the budget is being consumed, say, 14× faster than sustainable (a fast burn over minutes), ticket when it burns 2× over hours. This is how you page on real fires and sleep through toast.

### The LLM extension

Uptime does not mean correctness, so add SLIs the SRE book never listed: **quality pass rate** on a sampled continuous eval (Day 145's online eval feeding a gauge), **refusal/fallback rate** (a spike means a provider change or an attack), **groundedness failures** from citation validation, **token spend per request** (Day 156's ledger as a metric), and **retrieval health** (empty-result rate). A synthetic check — a known question asked every minute against production, answer validated — is your canary: it catches "up but wrong" before users do. Dashboards (Day 146) display all of this; alerts fire on the small subset where a human must act now. Everything else is a graph for the weekly review, not a page.`,
    viz: null,
    guided: [
      {
        title: 'Instrument the capstone with RED metrics',
        minutes: 25,
        body: `1. Add \`prometheus-client\` to the capstone and mount the starter middleware. Hit a few endpoints, then open \`/metrics\` and find your counters and histogram buckets.
2. Add two LLM-specific metrics: a counter for fallback/refusal responses and a histogram for token spend per request (use the Day 156 ledger values).
3. Run Prometheus locally via Docker (or just curl /metrics repeatedly) and confirm numbers move under a small load loop (20 requests).
4. Write the PromQL-style expression for: p95 latency over 5 minutes, error ratio over 5 minutes, and fallback rate over 1 hour. Keep them in \`docs/slo.md\` — they become your alert rules.`,
        code: `import time
from fastapi import FastAPI, Request
from prometheus_client import Counter, Histogram, make_asgi_app

REQS = Counter("app_requests_total", "Requests", ["route", "status"])
LAT = Histogram("app_request_seconds", "Latency", ["route"],
                buckets=[0.1, 0.25, 0.5, 1, 2, 3, 5, 8, 13, 21])
FALLBACKS = Counter("app_fallback_total", "Degraded answers", ["reason"])
TOKENS = Histogram("app_tokens_per_request", "Total tokens", ["route"],
                   buckets=[100, 250, 500, 1000, 2000, 4000, 8000])

app = FastAPI()
app.mount("/metrics", make_asgi_app())

@app.middleware("http")
async def observe(request: Request, call_next):
    t0 = time.perf_counter()
    response = await call_next(request)
    route = request.url.path
    REQS.labels(route=route, status=str(response.status_code)).inc()
    LAT.labels(route=route).observe(time.perf_counter() - t0)
    return response
# in your answer handler, on degraded paths:
#   FALLBACKS.labels(reason="provider_timeout").inc()
#   TOKENS.labels(route="/ask").observe(total_tokens)`,
      },
      {
        title: 'Write the SLOs and do the error-budget math',
        minutes: 15,
        body: `1. In \`docs/slo.md\`, define three SLIs for the capstone: availability ("2xx or honest-fallback within 8s"), latency ("TTFT under 1.5s"), and quality ("sampled continuous-eval pass").
2. Set an SLO for each over 30 days. Be realistic: you are one person on a hobby budget — 99.5% availability is defensible; 99.99% is fiction (write down what 99.99% would allow: ~4 minutes of downtime a MONTH).
3. Compute each error budget in absolute terms at 10k requests/month: how many failed requests, how many slow ones, how many bad answers.
4. For the availability SLO, compute two burn-rate alert thresholds: a page (budget gone in ~6 hours at current rate) and a ticket (gone in ~3 days). Note which channel each goes to.`,
      },
      {
        title: 'Build the synthetic canary',
        minutes: 10,
        body: `1. Write \`canary.py\` from the pattern below: every run, ask production one known golden question, validate the answer contains the expected grounded fact and a citation, and record success/latency (push to a metrics file or a pushgateway).
2. Schedule it (cron or GitHub Actions schedule) every 5–15 minutes against your staging/production URL.
3. Break it on purpose: point the app at an empty index or unset the API key, and confirm the canary fails BEFORE you would have noticed by hand. That confirmation — the alarm fires in a drill — is the whole point.`,
        code: `import time, httpx, json, sys

URL = "https://your-capstone.example.com/ask"
QUESTION = "How many vacation days do employees get per year?"
MUST_CONTAIN = "25"          # grounded fact from the corpus
t0 = time.perf_counter()
try:
    r = httpx.post(URL, json={"q": QUESTION}, timeout=15)
    ok = (r.status_code == 200
          and MUST_CONTAIN in r.text
          and "source" in r.text.lower())
except Exception:
    ok = False
latency = time.perf_counter() - t0
print(json.dumps({"ok": ok, "latency_s": round(latency, 2),
                  "ts": time.time()}))
sys.exit(0 if ok else 1)`,
      },
    ],
    practice: [
      {
        title: 'The alert audit',
        minutes: 15,
        body: `You inherit this alert list for an LLM service: (a) CPU > 80% for 1 min → page; (b) any single 5xx → page; (c) p95 latency > 3s for 10 min → page; (d) daily token spend > budget → page at midnight; (e) fallback rate > 10% for 15 min → page; (f) disk 70% full → page.

For each: keep as page, demote to ticket/dashboard, or rewrite — with one line of justification grounded in "does a human need to act NOW, and is this a symptom users feel?" Produce the corrected list.

Hints: two of these are causes, not symptoms; one is noise by construction; one has the wrong urgency channel; two are close to correct.`,
      },
    ],
    project: {
      title: 'Capstone monitoring pack',
      brief: `Ship monitoring to the capstone: (1) the RED + LLM metrics endpoint live in staging; (2) \`docs/slo.md\` with three SLIs/SLOs, absolute error budgets, and two burn-rate alert rules each with its channel; (3) the canary scheduled and proven to fail in a drill (screenshot or log of the drill in the doc); (4) the Day 146 dashboard updated with panels for fallback rate, token spend, and canary status. This is half of Day 161's cutover gate — the alarms must exist AND have fired once on purpose.`,
      rubric: [
        '/metrics exposes request counters, latency histogram, fallback counter, token histogram',
        'slo.md defines 3 SLIs/SLOs with error budgets computed in absolute numbers',
        'Burn-rate page vs ticket thresholds stated with correct relative urgency',
        'Canary runs on a schedule against a deployed URL and failed once in a documented drill',
        'Dashboard shows fallback rate, token spend, and canary panels with live data',
      ],
    },
    mistakes: [
      'Averaging percentiles. The mean of per-minute p95s is not the p95; record histograms and derive percentiles from buckets at query time.',
      'Alerting on causes (CPU, memory, disk) instead of symptoms (error rate, latency, fallback rate). Causes belong on dashboards; symptoms decide pages.',
      'Setting SLOs at 100% — or at whatever the service currently does. A 100% SLO means any single failure is a crisis and no error budget exists; an SLO copied from current behavior is a description, not a promise.',
      'Treating "the service is up" as "the service is correct." An LLM app needs quality SLIs — sampled evals, groundedness checks, refusal rate — or it can fail for weeks while every infra graph stays green.',
      'Paging on single events ("any 5xx"). One blip pages a human at 3am for nothing; burn-rate windows page only when the budget is genuinely being consumed.',
      'Never testing the alarm. An alert that has not fired in a drill is a hypothesis, not a smoke alarm. Break production-adjacent things on purpose, on a schedule.',
    ],
    quiz: [
      {
        q: 'Your availability SLO is 99.5% over 30 days at ~100k requests/month. Roughly how many failed requests does the error budget allow?',
        o: ['5', '50', '500', '5,000'],
        x: 2,
        w: '0.5% of 100k is 500 failed requests. The budget makes reliability arithmetic: burn it slowly and keep shipping; burn it fast and stop for fixes.',
        revisit: 157,
      },
      {
        q: 'Which alert is best designed, per the symptom-vs-cause rule?',
        o: [
          'Page when CPU exceeds 80% for one minute',
          'Page when error-budget burn rate implies exhaustion within hours',
          'Page on every 5xx response',
          'Page nightly when token spend exceeds the daily budget',
        ],
        x: 1,
        w: 'Burn-rate alerting pages on user-visible failure consumed fast enough to demand action now. CPU is a cause, single 5xxs are noise, and budget overspend is a ticket, not a 3am page.',
        revisit: 157,
      },
      {
        q: 'Every infra metric is green, yet users report wrong answers for a week. Which monitor was missing?',
        o: [
          'A latency histogram',
          'A disk-space alert',
          'A sampled quality/groundedness SLI with a canary asking known questions',
          'A request-rate counter',
        ],
        x: 2,
        w: 'LLM services can be up, fast, and wrong. Only quality SLIs — continuous evals on sampled traffic (Day 145) and a validated canary — catch "up but wrong."',
        revisit: 145,
      },
    ],
    resources: [
      { label: 'Google SRE Book — Ch. 4: Service Level Objectives', url: 'https://sre.google/sre-book/service-level-objectives/', type: 'book', time: '30 min' },
      { label: 'Prometheus — overview & data model', url: 'https://prometheus.io/docs/introduction/overview/', type: 'docs', time: '20 min' },
      { label: 'Grafana docs — dashboards & alerting', url: 'https://grafana.com/docs/grafana/latest/', type: 'docs', time: '15 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: due cards incl. Day 142 tracing & Day 146 dashboards', minutes: 10 },
      { activity: 'ELI5 + tech read; recite SLI → SLO → error budget from memory', minutes: 15 },
      { activity: 'Guided: RED instrumentation, SLO math, canary', minutes: 50 },
      { activity: 'Practice: the alert audit', minutes: 15 },
      { activity: 'Project: monitoring pack assembly & drill', minutes: 20 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      '/metrics live in staging with LLM-specific metrics',
      'slo.md committed with budgets in absolute numbers and burn-rate rules',
      'Canary scheduled and its failure drill documented',
      'Alert audit completed with justifications; quiz ≥ 2/3',
    ],
    connections: {
      back: 'Day 58 explained why latency percentiles, not means; Day 142\'s traces are what you open when today\'s alerts fire; Day 145\'s continuous evals become the quality SLI; Day 146\'s dashboard gains its alerting layer.',
      forward: 'Tomorrow (Day 158) is what happens when the pager goes off — incident response and fallbacks. Day 161\'s cutover requires today\'s alarms tested; Day 172 uses these signals to debug in customer environments.',
    },
    flashcards: [
      { f: 'SLI vs SLO vs error budget?', b: 'SLI = the measurement (good/total). SLO = target over a window. Error budget = 1 − SLO, your allowance to fail.' },
      { f: 'Symptom vs cause alerting?', b: 'Page on what users feel (errors, latency, fallback rate); dashboards for causes (CPU, disk).' },
      { f: 'Why histograms for latency?', b: 'Percentiles cannot be averaged; derive p95 from bucket counts at query time.' },
      { f: 'Burn-rate alerting in one line?', b: 'Page when the error budget is being consumed fast enough to exhaust in hours; ticket for slow burns.' },
      { f: 'Three LLM-specific SLIs?', b: 'Sampled quality/groundedness pass rate, refusal/fallback rate, token spend per request (plus canary success).' },
      { f: 'What proves an alert works?', b: 'A drill — break the dependency on purpose and watch it fire. Untested alerts are hypotheses.' },
    ],
    deepDive: [
      { label: 'Google SRE Book — Ch. 6: Monitoring Distributed Systems', url: 'https://sre.google/sre-book/service-level-objectives/', note: 'The "four golden signals" chapter pairs with RED; read it before designing dashboards for anything with queues.' },
    ],
  },
  {
    id: 'd158', day: 158, week: 23, phase: 8, kind: 'lesson',
    title: 'Reliability & Incident Response',
    analogy: 'When the kitchen catches fire',
    objectives: [
      'Enumerate the failure modes specific to LLM apps: provider outages, rate limits, bad deploys, quality regressions',
      'Implement timeouts, bounded retries with jitter, and a circuit breaker around model calls',
      'Design a fallback chain — secondary model, cached answer, honest degradation — and defend its order',
      'Run an incident with roles, a timeline, and calm comms, then write a blameless postmortem',
      'Rehearse a provider-down scenario against your capstone before it happens for real',
    ],
    prereqs: [
      { day: 46, label: 'Distributed systems — retries & idempotency' },
      { day: 125, label: 'Agent reliability — graceful degradation' },
      { day: 157, label: 'Monitoring & SLOs — the alarms that start incidents' },
    ],
    eli5: `Professional kitchens do not prevent all fires; they rehearse for them. Every cook knows the drill: who grabs the extinguisher, who moves the guests, who calls it in, and — crucially — the restaurant does not stop serving. The menu shrinks to what the working stations can produce. Cold dishes go out. Nobody stands in the dining room shouting "EVERYTHING IS BROKEN"; someone calmly tells guests there will be a short delay on hot mains.

Production AI systems catch fire on a schedule you don't control: your model provider has an outage, you get rate-limited during your own launch spike, a deploy ships a subtle regression. Reliability engineering is the rehearsed drill: timeouts so one stuck call can't hold a table forever, retries that give up gracefully instead of hammering a downed provider, a circuit breaker that stops sending cooks into a burning station, and a fallback menu — a backup model, a cached answer, or an honest "I can't answer right now, here's a link to the docs." The postmortem afterward asks "what let the fire spread?" never "which cook do we blame?" — because a kitchen that hides mistakes burns down twice.`,
    why: `Your LLM app has a hard dependency on someone else's API, and every major provider has had multi-hour incidents — the question is when, not if. Customers judge you by minute twenty of an outage: did the app degrade honestly or return raw stack traces? Did someone communicate? FDEs are on the sharpest end — Day 172 has you debugging DURING a customer incident, and the difference between "we exercised this fallback last month" and improvising live is the difference between renewal and churn. Interviews probe this too: "what happens when the model API goes down?" is a standard Day 160 follow-up.`,
    tech: `### Contain the blast radius

Every external call gets a **timeout** (no exceptions — a missing timeout is an unbounded resource leak under load). Failures get **bounded retries with exponential backoff and jitter**, and only for retryable errors: 429s and 5xxs yes, 400s never. Retries require **idempotency** (Day 46) — retrying a "send email" tool without an idempotency key sends two emails. But retries alone make outages worse: a thousand clients retrying a downed provider is a self-inflicted DDoS. The **circuit breaker** fixes this: after N consecutive failures the circuit opens and calls fail fast to the fallback for a cooldown; a half-open probe lets one request test recovery. Fail fast, recover automatically.

### The fallback chain

Order fallbacks by descending quality and honesty: (1) primary model; (2) secondary model or provider — different vendor if you can, since same-vendor tiers can share an outage; (3) semantic-cached answer for near-identical past queries (Day 156), clearly labeled as possibly stale; (4) honest degradation — "I can't answer right now; here are the top matching documents" (retrieval still works when generation is down!); (5) a clear error with a status link. Never fake it: a hallucinated answer during degraded mode is worse than an apology. Every fallback fires the Day 157 fallback counter so degradation is visible, not silent.

### Run the incident like a crew

Roles beat heroics: an **incident commander** coordinates and decides, an **ops lead** does hands-on-keyboard, a **comms lead** posts updates on a cadence (even "still investigating" every 30 minutes builds trust). Keep a timestamped log as you go — it writes the postmortem for you. Mitigate first (rollback, flip to fallback), diagnose later; Day 154's rehearsed rollback is your fastest mitigation for bad deploys.

### Learn without blame

The **blameless postmortem** documents timeline, impact quantified against the error budget, contributing causes (plural — there is never exactly one), what went well, and action items with owners and dates. Blameless is not soft: it is the observation that "human error" is where analysis starts, not ends — the interesting question is what let one mistake reach users.`,
    viz: null,
    guided: [
      {
        title: 'Build the resilient call wrapper',
        minutes: 25,
        body: `1. Create \`resilient.py\` from the starter: timeout, bounded retries with jittered backoff, circuit breaker, and a fallback chain, wrapped around two simulated flaky providers.
2. Run the demo loop: provider A fails 100% for a stretch. Watch the log: retries → circuit opens → calls fail fast to provider B → half-open probe → recovery.
3. Tune: set retries to 5 with no backoff and re-run. Count how many useless calls hammer the dead provider before the circuit opens — this is the retry-storm anti-pattern made visible.
4. Now integrate the pattern into your capstone's model-call path with a real chain: primary model → cheaper backup model → retrieval-only degraded answer. Ensure each degraded response sets a \`degraded: true\` field and increments the Day 157 fallback counter.`,
        code: `import random, time

class CircuitBreaker:
    def __init__(self, fail_threshold=3, cooldown_s=5.0):
        self.fails, self.threshold = 0, fail_threshold
        self.open_until, self.cooldown = 0.0, cooldown_s

    def allow(self):
        return time.monotonic() >= self.open_until

    def record(self, ok: bool):
        if ok:
            self.fails = 0
        else:
            self.fails += 1
            if self.fails >= self.threshold:
                self.open_until = time.monotonic() + self.cooldown
                self.fails = 0
                print("  [breaker] OPEN — failing fast for cooldown")

def call_with_retries(fn, breaker, attempts=2, base=0.2):
    if not breaker.allow():
        raise RuntimeError("circuit open")
    for i in range(attempts):
        try:
            out = fn()
            breaker.record(True)
            return out
        except Exception:
            breaker.record(False)
            if i + 1 < attempts and breaker.allow():
                time.sleep(base * (2 ** i) * (0.5 + random.random()))
    raise RuntimeError("exhausted retries")

def answer(question, providers, breakers):
    for name, fn in providers:
        try:
            return call_with_retries(fn, breakers[name]), name
        except RuntimeError:
            continue
    return "Sorry — I can't generate an answer right now. " \
           "Top matching docs: [handbook §4, policy §2]", "degraded"`,
      },
      {
        title: 'Tabletop exercise: your provider is down',
        minutes: 20,
        body: `Run this solo tabletop against your capstone, writing the incident log in real time (timestamps included). Scenario script — reveal one step at a time:

1. **T+0** — Day 157's canary fails twice; fallback-rate alert pages you. Primary provider returns 529s. Write your first three actions in order.
2. **T+5m** — Provider status page confirms a major incident, no ETA. Decide: wait, or flip traffic to the backup chain? Write the decision AND the one-line stakeholder update you post (audience: your fictional users' Slack channel).
3. **T+20m** — Backup model is up but 30% slower and slightly weaker; fallback rate is 100%, latency SLI is breaching. Does the latency SLO page you into a second incident? What do you tell users now?
4. **T+90m** — Provider recovers. Define your recovery checklist: how do you confirm health before flipping back (hint: half-open probe, canary green, error rate), and what do you monitor for the next hour?
5. Compute the total error-budget burn from the incident using Day 157's numbers, and note whether the budget survived.`,
      },
    ],
    practice: [
      {
        title: 'Write the blameless postmortem',
        minutes: 20,
        body: `Turn the tabletop into a one-page postmortem in \`docs/postmortems/2026-08-provider-outage.md\` with sections: Summary, Impact (requests affected, budget burned), Timeline (from your log), Contributing causes (find at least three — the outage itself, plus what made it worse on YOUR side), What went well, Action items (owner + date each).

Constraints: no names blamed (it's you anyway — blame the system that let a single provider be a single point of failure); every action item must be verifiable ("add second provider to chain" not "be more careful").

Hints: good candidate causes — no pre-warmed backup, canary interval too long, no status page for users.`,
      },
    ],
    project: {
      title: 'The capstone incident runbook',
      brief: `Write \`docs/runbook.md\` — the document future-you opens at 3am: (1) service overview with the fallback chain diagrammed in text; (2) "alarm → first moves" table for your top five alerts (canary red, fallback spike, latency breach, error spike, cost spike), each with diagnosis commands and mitigation; (3) rollback procedure (Day 154, verified); (4) provider-outage play from today's tabletop; (5) comms templates — the three-sentence status update and the all-clear; (6) postmortem template. Keep every play executable by a stressed person: numbered commands, no prose walls. This completes the runbook Day 154 started and is required for Day 161's gate.`,
      rubric: [
        'Fallback chain implemented in the capstone with degraded:true labeling and metrics',
        'Runbook covers all five alarms with copy-pasteable diagnosis and mitigation steps',
        'Rollback procedure tested this week and marked with the test date',
        'Tabletop incident log and completed postmortem committed',
        'Comms templates present and under four sentences each',
      ],
    },
    mistakes: [
      'Retrying everything. 4xx errors (bad request, auth) will fail identically forever; retry only 429/5xx/timeouts, with backoff AND jitter, or you synchronize a retry storm.',
      'No circuit breaker, so every user request eats the full retry-timeout ladder against a dead provider. Fail fast once failure is established; probe for recovery automatically.',
      'A fallback chain that silently degrades. Unlabeled cached or weaker-model answers destroy trust when discovered; set degraded flags, show users honest banners, count it in metrics.',
      'Fallback to a same-vendor model tier and calling it redundancy. Shared infrastructure fails together; true redundancy crosses providers (and ideally regions).',
      'Diagnosing before mitigating. Users are down while you read logs; rollback or flip to fallback first, investigate on a healthy service.',
      'Postmortems that end with "root cause: human error, action: be careful." Find the systemic causes and write verifiable action items with owners, or the incident repeats.',
    ],
    quiz: [
      {
        q: 'Your provider starts returning 529 (overloaded). Naive clients everywhere retry immediately in a tight loop. What pattern-pair prevents your service from making the outage worse?',
        o: [
          'Longer timeouts and more retries',
          'Exponential backoff with jitter, plus a circuit breaker that fails fast after repeated failures',
          'Switching all traffic to GET requests',
          'Caching every response forever',
        ],
        x: 1,
        w: 'Backoff+jitter desynchronizes and thins the retry herd; the breaker stops sending doomed calls entirely, failing fast to fallbacks and probing recovery later.',
        revisit: 158,
      },
      {
        q: 'During degraded mode, why is "here are the top matching documents" often the right fallback for a RAG app?',
        o: [
          'It is cheaper than an apology page',
          'Retrieval runs on YOUR infrastructure and still works when generation is down — honest partial value beats a fake answer or a blank error',
          'Users prefer reading documents to answers',
          'It avoids incrementing error metrics',
        ],
        x: 1,
        w: 'The generation dependency is external; retrieval is not. Serving labeled partial results keeps trust and utility while the provider recovers.',
        revisit: 158,
      },
      {
        q: 'A postmortem concludes: "Cause: the engineer typo\'d the config. Action: engineers will double-check configs." What is wrong?',
        o: [
          'Nothing — the cause was found',
          'It stops at human error and produces an unverifiable action; it should ask what let a typo reach production (no validation, no canary deploy, no review) and fix THAT',
          'It should name the engineer for accountability',
          'Postmortems are only for provider outages',
        ],
        x: 1,
        w: 'Blameless analysis treats human error as the starting point. Systemic fixes — config validation in CI, staged rollout — are verifiable and actually prevent recurrence.',
        revisit: 158,
      },
    ],
    resources: [
      { label: 'Google SRE Book — Ch. 15: Postmortem Culture', url: 'https://sre.google/sre-book/postmortem-culture/', type: 'book', time: '25 min' },
      { label: 'Google SRE Book — Ch. 4: SLOs (error-budget policy)', url: 'https://sre.google/sre-book/service-level-objectives/', type: 'book', time: '15 min' },
      { label: 'System Design Primer — availability patterns & circuit breakers', url: 'https://github.com/donnemartin/system-design-primer', type: 'repo', time: '20 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: due cards incl. Day 46 idempotency & Day 157 SLOs', minutes: 10 },
      { activity: 'ELI5 + tech read; sketch the fallback chain from memory', minutes: 15 },
      { activity: 'Guided: resilient wrapper + tabletop exercise', minutes: 45 },
      { activity: 'Practice: blameless postmortem', minutes: 20 },
      { activity: 'Project: incident runbook', minutes: 20 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'Resilient wrapper integrated: timeouts, jittered retries, breaker, labeled fallbacks',
      'Tabletop completed with a timestamped incident log',
      'Postmortem and runbook committed; rollback re-verified',
      'Quiz ≥ 2/3',
    ],
    connections: {
      back: 'Day 46 gave you retries and idempotency; Day 125 taught graceful degradation for agents; Day 154 rehearsed the rollback you reached for; Day 157\'s alarms are what page you into today\'s process.',
      forward: 'Day 161\'s cutover gate requires the runbook and a tested fallback. Day 172 replays this discipline inside a customer\'s environment, where calm comms are half the job — and the Day 160 interviewer will ask "what if the provider goes down?" expecting today\'s answer.',
    },
    flashcards: [
      { f: 'Which errors are retryable?', b: '429s, 5xxs, timeouts — with bounded attempts, exponential backoff, jitter. Never 4xx client errors.' },
      { f: 'Circuit breaker states?', b: 'Closed (normal) → open after N failures (fail fast) → half-open probe → closed on success.' },
      { f: 'Fallback chain order for a RAG app?', b: 'Primary model → cross-vendor backup → labeled cached answer → retrieval-only degraded → honest error.' },
      { f: 'Incident roles?', b: 'Incident commander (decides), ops lead (hands on keyboard), comms lead (updates on a cadence).' },
      { f: 'Mitigate or diagnose first?', b: 'Mitigate (rollback / flip to fallback); diagnose on a healthy service.' },
      { f: 'What makes a postmortem blameless AND useful?', b: 'Multiple systemic contributing causes + verifiable action items with owners and dates.' },
    ],
    deepDive: [
      { label: 'Error-budget policy', note: 'The pre-agreed rule for what happens when the budget empties (feature freeze, reliability sprint). Agreeing on it BEFORE the incident is what makes Day 157\'s budgets enforceable instead of decorative.' },
    ],
  },
  {
    id: 'd159', day: 159, week: 23, phase: 8, kind: 'lesson',
    title: 'Production Security & Compliance Basics',
    analogy: 'Locking up at night',
    objectives: [
      'Handle secrets in production correctly: injection, rotation, and never-in-git discipline',
      'Map the PII flows of an LLM application: what enters prompts, logs, caches, and third parties',
      'Explain data retention and deletion obligations, and design logs/caches that can honor them',
      'State what SOC 2 and GDPR mean operationally for an engineer shipping an AI feature',
      'Complete a customer-style security review checklist against your own capstone',
    ],
    prereqs: [
      { day: 44, label: 'Security, authN & authZ' },
      { day: 132, label: 'Guardrails, injection & AI security' },
      { day: 153, label: 'IaC & environments — config vs secrets' },
      { day: 142, label: 'Tracing — privacy & redaction in traces' },
    ],
    eli5: `A shop owner locking up at night runs a ritual, not a vibe: till emptied into the safe, safe combination known by two people and changed when staff leave, doors and windows checked in the same order every time, alarm armed, camera tape dated. None of it is exotic — burglars mostly try doors, and the ritual makes sure no door is accidentally open. And when the insurance inspector visits, the owner doesn't say "trust me" — they show the checklist, the logbook, the rota.

Production security for your AI app is that ritual. Secrets (API keys, DB passwords) live in a safe (a secrets manager or injected environment), never taped under the counter (hardcoded, committed to git). Keys are rotated when people or machines change. Everything travels through locked corridors (TLS). The camera tape is your audit log: who asked what, when, and what the system did. And compliance — SOC 2, GDPR — is the insurance inspector: not a different job, but proof that the ritual exists, runs every night, and leaves evidence. The scary acronyms mostly ask questions you can answer with "here is the checklist, here is the log."`,
    why: `The fastest way to lose an enterprise deal is to fumble the security review. Before any pilot touches real data, the customer's security team sends a questionnaire: where do prompts go? Is our data used for training? How long do you retain logs? Who can access production? Can you delete a user's data on request? FDEs sit in that meeting, and "I'll get back to you" on every row kills momentum. Engineers who design PII-aware logging and rotation-friendly secrets from the start — instead of retrofitting under deadline — are the ones who pass. Day 170 (customer environments) and Day 177's final security gate both build on today.`,
    tech: `### Secrets

Secrets never live in code, images, or git history — one leaked key in a public repo gets scraped in minutes. They are injected at runtime from a secrets manager or the platform's secret store (Day 153), scoped per environment, and **rotated**: on a schedule, on personnel change, and immediately on suspicion. Rotation must be a non-event — two valid keys overlapping during the swap — which means building for it before you need it. Add a CI check (secret-scanning) so a committed key fails the build rather than shipping.

### Data flows and PII

Draw where user data actually goes in your app: prompt → your API → model provider; also into traces (Day 142), application logs, the semantic cache (Day 156), eval datasets mined from logs (Day 143), and backups. Every one of those is a copy with its own retention. The engineering consequences: redact or hash PII before it enters logs and traces; give caches and logs TTLs so retention is bounded by design; know your provider's data-use terms (training on your data? retention window? zero-data-retention options?) because the customer WILL ask. **Deletion requests** (GDPR's right to erasure) must be executable: if a user's data is scattered across unstructured logs with no user-id field, deletion is archaeology — structured logging with consistent identifiers makes it a query.

### The compliance gist for engineers

**SOC 2** is an audit of your controls — access management, change management (your CI/CD and review gates ARE controls), monitoring, incident response — plus evidence they operate. **GDPR** governs personal data of EU people: lawful basis, data minimization (don't log what you don't need — the cheapest compliance win in existence), purpose limitation, deletion and export rights, and breach notification. You are not the compliance officer, but you build the mechanisms compliance depends on: least-privilege access (Day 44's RBAC), audit logs of privileged actions, TLS everywhere including service-to-service, network boundaries so the vector DB and cache are not internet-reachable, and honest documentation of subprocessors (your model provider is one). The security-review checklist you complete today against your own app is, almost line for line, the questionnaire enterprises will send you.`,
    viz: null,
    guided: [
      {
        title: 'Secrets audit and rotation drill',
        minutes: 20,
        body: `1. Run the starter scanner over your capstone repo INCLUDING git history (\`git log -p\` piped through it, or use a real tool like gitleaks if installed). Triage every hit: real secret, test fixture, or false positive.
2. If anything real ever touched history: rotate that key NOW and note that removal from history alone is not enough — the key must be considered burned.
3. Verify runtime injection: confirm the deployed capstone reads all secrets from environment/secret store, none from committed files. Check the Docker image too (\`docker history\`, and inspect for baked-in env values).
4. Rotation drill: issue a second API key with your provider, deploy it alongside the old one, flip the app to the new key, confirm the canary stays green, revoke the old key. Time yourself — under 15 minutes means rotation is a non-event; write the steps into the runbook.`,
        code: `import re, sys, pathlib

PATTERNS = {
    "anthropic-ish key": r"sk-ant-[A-Za-z0-9\-_]{20,}",
    "openai-ish key":    r"sk-[A-Za-z0-9]{32,}",
    "aws access key":    r"AKIA[0-9A-Z]{16}",
    "generic assignment": r"(api_key|secret|password|token)\s*[=:]\s*['\"][^'\"]{12,}['\"]",
    "private key block": r"-----BEGIN (RSA |EC )?PRIVATE KEY-----",
}

hits = 0
for path in pathlib.Path(".").rglob("*"):
    if path.is_dir() or ".git" in path.parts or path.suffix in {".png", ".pdf"}:
        continue
    try:
        text = path.read_text(errors="ignore")
    except Exception:
        continue
    for name, pat in PATTERNS.items():
        for m in re.finditer(pat, text, re.IGNORECASE):
            hits += 1
            print(f"{path}: {name}: ...{m.group(0)[:12]}[REDACTED]")
print(f"\n{hits} potential secrets found")
sys.exit(1 if hits else 0)`,
      },
      {
        title: 'Map the PII flow and fix the leaks',
        minutes: 20,
        body: `1. In \`docs/data_map.md\`, draw the capstone's data flow as a text diagram: user question → API → [logs? traces? cache?] → model provider → response → [logs? feedback store?]. Mark every node that stores a COPY and its current retention (be honest: "forever" is the default you never chose).
2. Grep your actual logs and traces from staging for a test user's question text. If the raw question appears verbatim in more than one store, you have found your retention problem.
3. Apply two fixes: (a) add a redaction step before logging (emails, phone numbers, names via regex/allowlist — Day 142's redaction pattern) so logs keep structure but drop raw PII; (b) set explicit TTLs on the semantic cache and log retention.
4. Answer in writing, from your provider's actual data-use documentation: does the provider train on your API data? What is their retention window? Is a zero-retention option available? Cite the page.`,
      },
    ],
    practice: [
      {
        title: 'Face the questionnaire',
        minutes: 25,
        body: `A fictional enterprise prospect, Meridian Mutual Insurance, sends their standard vendor security questionnaire before your capstone pilot. Answer all twelve rows honestly for YOUR capstone as deployed today — "No / not yet, mitigation planned: X" is an acceptable answer; a false "Yes" is not.

1. Is all data encrypted in transit (TLS ≥1.2) and at rest? 2. Where are secrets stored and how often are keys rotated? 3. Which subprocessors receive our data? (Name your model/embedding providers.) 4. Is our data used to train models? 5. What is your log/trace retention period, and is PII redacted? 6. Can you delete all of a named user's data within 30 days? Describe how. 7. Who has production access, and is it audited? 8. Do you have monitoring/alerting and an incident-response runbook? (Point to Days 157–158 artifacts.) 9. What is your deploy process — is there review and rollback? 10. Have you tested against prompt injection and the OWASP LLM Top 10? (Day 133/144 reports.) 11. Do you enforce least-privilege on database and vector-store access? 12. Describe your backup and recovery posture.

Deliver as \`docs/security_questionnaire.md\` with a traffic-light summary at top: green (true today), yellow (partial), red (missing). Hints: expect 4–6 greens if you have been doing the capstone gates; that is normal — the red list is your Day 176 hardening backlog.`,
      },
    ],
    project: {
      title: 'The security-review pass',
      brief: `Turn today into capstone hardening: (1) secrets scanner wired into CI as a failing check, and the rotation drill documented in the runbook with your timing; (2) PII redaction live in the logging/tracing path, verified by re-grepping staging telemetry for planted PII; (3) TTLs set on cache and logs, recorded in \`docs/data_map.md\`; (4) the completed Meridian questionnaire committed with its traffic-light summary; (5) the top two red items converted into GitHub issues tagged for Day 176. The deliverable standard: a real security reviewer could read your three docs (data_map, questionnaire, runbook) and know exactly what your system does with data.`,
      rubric: [
        'CI fails on a planted fake secret; drill timing recorded in the runbook',
        'Planted PII (email + phone in a test question) no longer appears raw in logs or traces',
        'data_map.md shows every copy-holding node with an explicit retention value',
        'Questionnaire answered on all 12 rows with zero false greens',
        'Two red items filed as issues and referenced from the questionnaire',
      ],
    },
    mistakes: [
      'Deleting a committed secret and moving on. Git history keeps it and scrapers found it already; a secret that touched a remote repo is burned — rotate it.',
      'Logging full prompts and completions "for debugging" with no retention or redaction. That is an unbounded PII store you never designed; minimize, redact, and set TTLs.',
      'Treating compliance as a lawyer problem. Auditors ask for evidence of controls — access lists, change logs, incident records — and only engineering can make those exist.',
      'Answering a customer questionnaire aspirationally. A false "yes, encrypted at rest" discovered mid-pilot destroys the relationship; honest yellows with dated mitigation plans build trust.',
      'Forgetting the model provider is a subprocessor. Your customer\'s data leaves your boundary on every request — know the provider\'s training/retention terms and disclose them.',
      'Designing deletion as an afterthought. Scattered, unstructured logs make erasure requests archaeology; consistent user identifiers in structured logs make them a query.',
    ],
    quiz: [
      {
        q: 'A teammate accidentally commits an API key, then force-pushes to remove it from history. What is the required next step?',
        o: [
          'Nothing — the history is clean now',
          'Add the file to .gitignore',
          'Rotate the key immediately; a secret that reached a remote is burned regardless of history rewrites',
          'Rename the key variable',
        ],
        x: 2,
        w: 'Scrapers watch pushes in near-real-time, and clones/caches retain the old history. Rewriting history is hygiene; rotation is the actual fix.',
        revisit: 159,
      },
      {
        q: 'GDPR\'s "data minimization" translated into LLM-app engineering means…',
        o: [
          'Use the smallest model available',
          'Don\'t log or retain data you don\'t need — redact PII from telemetry and bound retention with TTLs',
          'Minimize the number of users',
          'Compress logs with gzip',
        ],
        x: 1,
        w: 'The cheapest compliance win: data you never stored can\'t leak, can\'t be subpoenaed, and needs no deletion pipeline. Log structure, not raw PII.',
        revisit: 159,
      },
      {
        q: 'In a customer security review, which answer about model providers is correct and safe?',
        o: [
          '"Your data never leaves our servers" (the model API call doesn\'t count)',
          '"We list the provider as a subprocessor, and per their API terms — cited — data is not used for training and is retained for N days"',
          '"We can\'t discuss third parties"',
          '"The provider is SOC 2 certified so there is nothing to disclose"',
        ],
        x: 1,
        w: 'Prompts literally leave your boundary on every request. Disclose the subprocessor, cite the actual terms, and let the customer assess — anything else is a discoverable false claim.',
        revisit: 159,
      },
    ],
    resources: [
      { label: 'OWASP Top 10 for LLM Applications', url: 'https://owasp.org/www-project-top-10-for-large-language-model-applications/', type: 'docs', time: '25 min' },
      { label: 'Simon Willison — prompt injection series (exfiltration risks)', url: 'https://simonwillison.net/series/prompt-injection/', type: 'article', time: '20 min' },
      { label: 'GitHub Docs — secret scanning & Actions secrets', url: 'https://docs.github.com/en/actions', type: 'docs', time: '15 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: due cards incl. Day 44 auth & Day 132 guardrails', minutes: 10 },
      { activity: 'ELI5 + tech read; write the secrets rules from memory', minutes: 15 },
      { activity: 'Guided: secrets audit + rotation drill + PII map', minutes: 40 },
      { activity: 'Practice: the Meridian questionnaire', minutes: 25 },
      { activity: 'Project: wire CI check, redaction, TTLs; file issues', minutes: 20 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'Rotation drill completed and timed; secrets scan in CI',
      'PII redaction verified against planted data in staging telemetry',
      'data_map.md and security_questionnaire.md committed, no false greens',
      'Quiz ≥ 2/3',
    ],
    connections: {
      back: 'Day 44 gave you the auth and least-privilege vocabulary; Day 132\'s injection threat model explains half the OWASP rows; Day 142\'s trace redaction and Day 153\'s secrets handling become enforced policy today.',
      forward: 'Day 160\'s designs must speak privacy fluently (the fourth corner of the quadrilemma). Day 170 extends this to customer-controlled environments (VPC, customer-managed keys), and Day 177 re-runs this checklist as the capstone\'s final quality gate.',
    },
    flashcards: [
      { f: 'A secret was committed and pushed. The fix?', b: 'Rotate immediately — history rewrites don\'t un-leak it. Then add CI secret-scanning.' },
      { f: 'Zero-downtime key rotation requires…', b: 'Two valid keys overlapping: issue new, deploy, verify canary, revoke old.' },
      { f: 'The five copy-holders of user data in an LLM app?', b: 'Logs, traces, caches, eval sets mined from logs, and the model provider (subprocessor).' },
      { f: 'SOC 2 in one line for engineers?', b: 'An audit that your controls (access, change management, monitoring, incident response) exist AND leave evidence.' },
      { f: 'Cheapest GDPR win?', b: 'Data minimization: never log raw PII, bound retention with TTLs — unstored data can\'t leak.' },
      { f: 'Right answer style for security questionnaires?', b: 'Honest greens, dated-mitigation yellows, never a false yes.' },
    ],
    deepDive: [
      { label: 'OWASP cheat-sheet habit', note: 'For any security mechanism you touch (session management, key storage, logging), skim the corresponding OWASP cheat sheet before implementing — it is the field-tested checklist your reviewer will grade you against.' },
    ],
  },
  {
    id: 'd160', day: 160, week: 23, phase: 8, kind: 'lesson',
    title: 'AI System Design',
    analogy: 'The architect\'s exam',
    objectives: [
      'Run the AI-system-design method: requirements → constraints → architecture → deep dives → trade-offs',
      'Navigate the quality/latency/cost/privacy quadrilemma explicitly in every design decision',
      'Reproduce three complete designs: a support copilot, enterprise doc-QA, and an agent with approvals',
      'Defend component choices (RAG vs fine-tuning, model tiers, sync vs async) against follow-up probes',
      'Self-grade a design answer against a rubric interviewers actually use',
    ],
    prereqs: [
      { day: 48, label: 'System design method' },
      { day: 123, label: 'Multi-agent & workflow patterns' },
      { day: 136, label: 'RAG evaluation' },
      { day: 158, label: 'Reliability & fallback chains' },
    ],
    eli5: `An architect's licensing exam doesn't ask "do you know what a beam is?" It hands over a messy brief — "a clinic, on this sloped site, this budget, must open by winter" — and watches HOW you work: do you ask what the clinic actually needs before drawing? Do you say out loud "I'm choosing wood over steel because of budget, accepting a height limit"? Do you know where your own design is weakest? A candidate who draws a gorgeous building for the wrong brief fails; one who draws a modest building with clearly reasoned trade-offs passes.

The AI system design interview — now a standard round for AI engineer and FDE roles — is exactly this exam, and so is every real customer engagement. The brief is always underspecified on purpose. The winning behavior is a loop you can rehearse: pin down requirements and scale, name the constraints that actually bind (in AI systems it is almost always some corner of quality-latency-cost-privacy), draw a boring-but-right architecture, then go deep where the risk lives — retrieval quality, eval strategy, failure modes. Today you study three model answers the way a chess student studies annotated grandmaster games: not to memorize them, but to absorb the move patterns.`,
    why: `This round decides senior-vs-junior offers. Coding rounds test whether you can build a component; the design round tests whether you can be left alone with an ambiguous, expensive problem — which is the actual job, and doubly so for FDEs who do this live in front of customers (Day 168's simulation is this skill with a customer in the room). The 2026 twist: interviewers now expect evals, guardrails, and cost engineering IN the design, not bolted on when prompted. Your last 60 days are precisely those muscles; today assembles them into an interview-shaped performance.`,
    tech: `### The method, adapted for AI systems

Day 48's skeleton survives: **requirements → capacity envelope → API → data model → high-level design → deep dives → trade-offs**. The AI adaptation adds four standing obligations. (1) **The quadrilemma**: quality, latency, cost, privacy — every AI design decision buys some corners with others. Say which corner the customer weights most, out loud, early; it decides model tier, RAG vs fine-tune, streaming, hosting. (2) **Evals are part of the design**: an interviewer who hears "golden set, LLM-judge calibrated on human labels, regression gate in CI" upgrades you a level. Quality claims without a measurement plan are vibes (Day 134). (3) **Failure is part of the design**: provider outage, injection via retrieved content, hallucination under missing context — name the fallback chain (Day 158) and guardrails (Day 132) unprompted. (4) **The capacity envelope is token math**: requests/day × tokens/request × price, plus a latency budget in TTFT terms (Day 155). Two minutes of arithmetic separates you from candidates hand-waving "we'll scale it."

### Anti-patterns that fail the round

Jumping to architecture before requirements (the #1 rejection reason); maximalism — proposing agents, fine-tuning, and a multi-model router for a problem a prompt and RAG solve (the intern-with-a-todo-list is expensive; the checklist from Day 120 applies); ignoring the write path (how does the corpus get INTO the index, and how fresh must it be?); quality claims with no eval plan; and never saying "it depends, and here is what it depends on." Seniority sounds like conditional statements with named conditions.

### How you will study today

Each guided exercise presents a complete model answer, structured exactly as you should speak it: requirements first (with the questions asked), envelope math, architecture, two deep dives, and a trade-offs paragraph that names what was sacrificed. Read actively: cover each section, produce your own version, then compare. The practice design (agent with approvals) you attempt cold before reading its model answer. Grade everything with the rubric in the project — the same one Day 168 and Day 179 reuse.`,
    viz: 'ai-sysdesign',
    guided: [
      {
        title: 'Worked design 1 — customer-support copilot (agent-assist)',
        minutes: 20,
        body: `Read this model answer in full, then close it and reproduce the architecture and both deep dives from memory; diff against the original.

**Brief:** "Design an AI copilot for our 300-agent customer-support team." (Deliberately vague.)

**Requirements (asked, not assumed):** Who uses it — agents, not end customers? (Yes: human-in-the-loop, which lowers risk tolerance needed.) What does it do — suggest replies, summarize tickets, surface KB articles? (All three; suggested replies are the core value.) Volume — 300 agents × ~40 tickets/day = 12k tickets/day, ~3 model interactions each = ~36k requests/day, peak ~10/sec. Latency — suggestions must land while the agent reads the ticket: TTFT under ~1.5s, streaming. Privacy — tickets contain customer PII; retention and redaction matter. Quality bar — a bad suggestion wastes agent time but a human reviews everything: medium risk, favor speed and cost.

**Quadrilemma call:** latency and cost weighted highest; quality medium (human review); privacy handled by redaction + provider terms. This licenses a mid-tier model.

**Architecture (spoken as a request walkthrough):** Ticket event → ingestion service normalizes and redacts PII → context builder assembles: ticket thread summary (cached per ticket, updated incrementally), customer metadata from CRM (read-only API), and top-k KB chunks via hybrid retrieval (BM25 + dense, reranked — Days 116–117) → prompt with stable prefix (system + few-shots) for prefix caching (Day 156) → mid-tier model, streamed into the agent desktop as three ranked suggested replies with KB citations → agent edits/accepts/rejects → **the accept/edit/reject signal is logged as feedback** (Day 143) — this flywheel is the design's best feature: every agent action is a free label.

**Deep dive 1 — KB retrieval:** KB articles chunked structure-aware (Day 114), nightly full re-index plus event-driven upserts on article edits; retrieval eval = precision@5 on a golden set mined from historical ticket→article links agents already click. **Deep dive 2 — evals & rollout:** offline golden set of 200 historical tickets with accepted replies; LLM-judge for helpfulness calibrated against agent labels (Day 135); online metric = suggestion acceptance rate; ship behind a 10%-of-agents canary; regression gate in CI on the golden set (Day 141).

**Trade-offs stated:** chose suggestion-only over auto-send (quality risk unacceptable without review); mid-tier model over frontier (latency+cost; acceptance rate will tell us if we underbought); RAG over fine-tuning for KB knowledge (KB changes weekly; fine-tuning bakes stale knowledge — Day 127's decision tree); accepted a cold-start weakness: acceptance rate is meaningless until agents trust the tool, so weeks 1–2 measure edit distance instead.`,
      },
      {
        title: 'Worked design 2 — enterprise doc-QA at scale (your capstone, times 100)',
        minutes: 20,
        body: `Same protocol: read, cover, reproduce the envelope math and the freshness deep dive, diff.

**Brief:** "A 40,000-employee company wants employees to ask questions over 2M internal documents — policies, wikis, contracts — with per-document access control."

**Requirements:** The two words that reshape everything: **access control**. An employee must never see an answer derived from a document they cannot open. Also: 2M docs ≈ (say) 40M chunks; usage assume 20% of employees ask 2 questions/day = 16k questions/day, peak 30/sec; freshness — HR policies must reflect edits within hours; audit — legal wants to know who asked what (retained, access-controlled, Day 159).

**Quadrilemma call:** privacy is the binding corner (ACL correctness is non-negotiable), quality second (wrong policy answers create liability), then latency, then cost.

**Envelope math (out loud):** 16k questions/day × ~4k tokens in (context-heavy RAG) + 300 out ≈ 70M tokens/day ≈ low-hundreds of dollars/day at mid-tier prices — real money: caching and routing (Day 156) are design requirements, not nice-to-haves.

**Architecture:** Ingestion is a first-class subsystem, not a script: connectors (SharePoint, Confluence, drive shares — Day 169 foreshadow) → parsing/chunking workers on a queue (Day 47) → embeddings → vector DB **with ACL metadata on every chunk** (source doc ID, allowed groups) plus BM25 index. Query path: authenticate → resolve user's groups → hybrid retrieval **with ACL pre-filter in the query** — filter at retrieval time, never post-filter after the model has seen forbidden text → rerank → generate with mandatory citations → citation validator checks every cited doc against the user's ACLs again (defense in depth) → respond, streamed. Semantic cache **keyed per ACL-group**, never global — a cached answer derived from restricted docs must not leak to a broader audience.

**Deep dive 1 — freshness:** event-driven upserts from source-system webhooks where available, else delta-crawl every N hours; tombstone deletions immediately (a revoked doc must leave the index NOW — that is a security event, not an eventual-consistency shrug); staleness SLI: p95 time from doc-edit to index-visibility. **Deep dive 2 — the ACL failure mode:** the nightmare is retrieval-time filter drift (group membership changed, index metadata stale), hence the second ACL check at citation time and a red-team eval (Day 144): a golden set of "user X asks about doc they cannot read" cases that must ALL refuse — gated in CI.

**Trade-offs:** pre-filter retrieval can hurt recall for users with narrow access (accepted; correctness beats completeness — and stated so the customer decides); per-group caching slashes hit rate (accepted for the same reason); chose managed vector DB over self-hosted at 40M chunks unless data-residency forces otherwise (ops cost dominates); fine-tuning rejected again — 2M living documents is the textbook RAG case (Day 113).`,
      },
    ],
    practice: [
      {
        title: 'Worked design 3 — attempt first: an agent with approvals',
        minutes: 25,
        body: `**Brief:** "Design an AI agent that processes vendor invoices: read the invoice, match it to a purchase order, flag discrepancies, and schedule payment — with human approval where it matters." Attempt the full answer solo (requirements, envelope, architecture, two deep dives, trade-offs) in 20 minutes, writing as you would speak. THEN read the model answer below and grade yourself with the project rubric.

---

**Model answer.** Requirements: volume — say 3k invoices/month, latency irrelevant (batch, minutes are fine — this changes everything: no streaming, cheap async workers); accuracy critical — money moves; audit trail legally required; the approval boundary is THE design question. Quadrilemma: quality and auditability dominate; latency nearly free; cost minor at this volume.

Architecture: event-driven pipeline (Day 123's workflow-not-agent insight — the steps are known, so use a workflow with LLM steps, not a free-roaming agent): invoice arrives → document extraction to a strict schema (Day 110 structured outputs + Day 130 document AI), validators on totals/dates/currency — retry loop on validation failure → deterministic PO matching first (exact PO number), LLM assist only for fuzzy cases, with match confidence → discrepancy rules engine (price/quantity deltas beyond tolerance) → **approval gates by risk tier**: auto-approve exact matches under $1k (still logged); human approval queue for fuzzy matches, discrepancies, or >$10k; ALL payment scheduling requires an idempotency key (Day 46 — retried payments must never double-pay). Every step writes to an append-only audit log: inputs, model version, prompt version, confidence, human decision.

Deep dive 1 — extraction quality: golden set of 100 real invoices (multi-format, scanned and native PDF), field-level accuracy metrics, hard gate in CI; per-field confidence drives routing to human review, and the human corrections feed the golden set (flywheel again). Deep dive 2 — the approval UX: reviewers see the extracted fields NEXT TO the source image with differences highlighted — reviewer throughput is the real bottleneck at scale, and a bad review UI silently becomes rubber-stamping; measure reviewer disagreement rate as a canary for extraction drift (Day 145).

Trade-offs: workflow over agent (predictability and auditability beat flexibility; an open-ended agent moving money is an unforced error); auto-approval threshold is a business decision surfaced to finance, not hidden in code; chose two-model cascade (cheap extractor, strong model only on low-confidence fields) for cost; accepted slower processing for fuzzy cases because reviewer quality beats speed here.

Self-grade honestly: where did your attempt diverge — and was the divergence a defensible alternative (fine) or a missed requirement (drill it)?`,
      },
    ],
    project: {
      title: 'Your design portfolio entry + the rubric',
      brief: `Create \`docs/design_answers.md\`: (1) the rubric below, kept verbatim for reuse on Days 168 and 179; (2) your reproduced versions of designs 1–2 (from the cover-and-reproduce drills) tightened to one page each; (3) your graded attempt at design 3 with a self-assessment paragraph naming your two weakest rubric rows and one drill for each. Rubric (score each 0–3): requirements — asked clarifying questions, quantified scale; constraints — named the binding quadrilemma corner with justification; architecture — complete request walkthrough incl. ingest/write path; evals — measurement plan with golden set and gate; reliability — failure modes and fallbacks unprompted; trade-offs — explicit sacrifices with alternatives named. 14+/18 is a passing interview performance.`,
      rubric: [
        'All three designs present, each structured requirements → envelope → architecture → deep dives → trade-offs',
        'Each design names its binding quadrilemma corner with a one-line justification',
        'Envelope math shown with real arithmetic in at least two designs',
        'Eval plan (golden set + gate) appears in every design, unprompted',
        'Self-assessment names two weakest rubric rows with a concrete drill each',
        'Committed and referenced from the capstone README (interview-prep section)',
      ],
    },
    mistakes: [
      'Drawing architecture before asking a single question. The brief is vague ON PURPOSE; the first five minutes of requirements questions ARE the assessment.',
      'Maximalism: agents + fine-tuning + multi-model routing for a problem RAG and a prompt solve. Boring-but-right beats impressive-but-unjustified; reach for Day 120\'s when-not-to-build-an-agent checklist.',
      'Designing only the read path. Where does the corpus come from, how does it update, what happens on deletes? The ingest/freshness story is where enterprise designs live or die.',
      'Claiming quality with no measurement plan. "It will answer accurately" is a vibe; a golden set, a calibrated judge, and a CI gate is a design.',
      'Post-filtering ACLs after retrieval. If forbidden text reached the prompt, you already leaked — filter at retrieval time and re-check at citation time.',
      'Hiding trade-offs. Interviewers and customers both trust the person who says "I sacrificed X for Y; if you weight X more, here is the alternative" — naming costs is seniority.',
    ],
    quiz: [
      {
        q: 'In the enterprise doc-QA design, why must ACL filtering happen AT retrieval time rather than on the final answer?',
        o: [
          'It is faster',
          'Once forbidden chunks enter the prompt, the model can leak their content into the answer regardless of output filtering',
          'Vector DBs cannot post-filter',
          'GDPR requires it explicitly',
        ],
        x: 1,
        w: 'Post-filtering inspects the answer, but the damage happened when restricted text reached the context window. Pre-filter retrieval, then re-verify citations as defense in depth.',
        revisit: 160,
      },
      {
        q: 'The invoice system was designed as a fixed workflow with LLM steps rather than a free-roaming agent because…',
        o: [
          'Agents cannot read PDFs',
          'The steps are known in advance and money moves — predictability and auditability outweigh flexibility (the when-not-an-agent checklist)',
          'Workflows are always cheaper to run',
          'Approval queues only work in workflows',
        ],
        x: 1,
        w: 'Day 123\'s framing: use an agent when the path is unknowable; use a workflow when it is enumerable. High-stakes, auditable, known-step processes are the workflow textbook case.',
        revisit: 123,
      },
      {
        q: 'An interviewer asks "how do you know your support copilot is good?" The strongest answer is…',
        o: [
          '"We use the best available model"',
          '"Agents will complain if it\'s bad"',
          '"Offline: a golden set with a judge calibrated on agent labels, gated in CI. Online: suggestion acceptance rate on a 10% canary"',
          '"We manually check ten outputs a week"',
        ],
        x: 2,
        w: 'The 2026 bar: evals are part of the design. Offline gate + online metric + staged rollout covers regression, real-world quality, and blast radius in one sentence.',
        revisit: 134,
      },
    ],
    resources: [
      { label: 'System Design Primer — the classic method to adapt', url: 'https://github.com/donnemartin/system-design-primer', type: 'repo', time: '25 min' },
      { label: 'ByteByteGo — architecture case studies', url: 'https://blog.bytebytego.com/', type: 'article', time: '20 min' },
      { label: 'FDE Interview Guide (Exponent) — the design round in FDE loops', url: 'https://www.tryexponent.com/blog/forward-deployed-engineer-interview-the-definitive-2026-guide-fde', type: 'article', time: '15 min' },
      { label: 'Chip Huyen — blog (ML/AI system design posts)', url: 'https://huyenchip.com/blog/', type: 'article', time: '20 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: due cards incl. Day 48 method & Day 123 workflows', minutes: 10 },
      { activity: 'ELI5 + tech read; write the method skeleton + quadrilemma from memory', minutes: 15 },
      { activity: 'Guided: designs 1 and 2, cover-and-reproduce protocol', minutes: 40 },
      { activity: 'Practice: design 3 attempted cold, then graded against the model', minutes: 25 },
      { activity: 'Project: portfolio entry + rubric self-assessment', minutes: 20 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'Designs 1–2 reproduced from memory and diffed against the models',
      'Design 3 attempted before reading its answer, scored on all six rubric rows',
      'design_answers.md committed with self-assessment and drills',
      'Quiz ≥ 2/3',
    ],
    connections: {
      back: 'This is Day 48\'s method with sixty days of new vocabulary plugged in: Day 113\'s RAG pipeline, Day 123\'s workflow-vs-agent judgment, Day 134\'s eval mindset, Day 156\'s cost levers, Day 158\'s fallbacks — spoken as one coherent answer.',
      forward: 'Day 168 runs this skill with a customer in the room instead of an interviewer, Day 165 turns designs into sellable documents, and Day 179\'s interview gym re-runs a full mock against today\'s rubric.',
    },
    flashcards: [
      { f: 'The AI-system-design method skeleton?', b: 'Requirements → capacity envelope → API/data → architecture walkthrough → deep dives → explicit trade-offs.' },
      { f: 'The quadrilemma?', b: 'Quality / latency / cost / privacy — name which corner binds, early and out loud; it decides model, RAG-vs-FT, hosting.' },
      { f: '#1 design-round rejection reason?', b: 'Jumping to architecture without asking requirements questions — the vagueness is the test.' },
      { f: 'ACL rule for RAG?', b: 'Filter at retrieval time (pre-filter); re-verify at citation time. Post-filtering the answer is already a leak.' },
      { f: 'Workflow vs agent — the deciding question?', b: 'Are the steps enumerable in advance? Yes → workflow with LLM steps. Unknowable path → agent.' },
      { f: 'What upgrades a quality claim from vibe to design?', b: 'Golden set + calibrated judge + CI gate offline; an online metric + canary rollout.' },
    ],
    deepDive: [
      { label: 'Drill: 10-minute lightning designs', note: 'Prompt yourself with one-liners (meeting summarizer for a hospital; code-review bot; multilingual FAQ) and produce ONLY requirements + quadrilemma call + one-paragraph architecture. Speed-reps build the reflex the full designs refine.' },
    ],
  },
  {
    id: 'd161', day: 161, week: 23, phase: 8, kind: 'review',
    title: 'Week 23 Checkpoint: Production Cutover',
    analogy: 'Opening night',
    objectives: [
      'Recall and connect the week: serving, cost, SLOs, incidents, security, and design',
      'Cut the capstone over to a production URL with monitoring, alerts, and fallbacks live',
      'Pass a load sanity check with concurrent users and record the latency/cost evidence',
      'Assemble the cutover evidence pack: SLO doc, cost report, runbook, security answers',
    ],
    prereqs: [
      { day: 155, label: 'Serving & latency budget' },
      { day: 157, label: 'Monitoring & SLOs' },
      { day: 158, label: 'Reliability & runbook' },
      { day: 154, label: 'Staging pipeline' },
    ],
    eli5: `Opening night at a theater is not the night the actors learn their lines — it is the night everything already rehearsed happens in front of a paying audience, with the stage manager watching cue sheets, understudies dressed, and a fire exit plan nobody hopes to use. The dress rehearsals this week were exactly that: you rehearsed the speed of service (Day 155), the cost of running the house (156), the alarms (157), the fire drill (158), the locks (159), and the architect's walkthrough (160).

Today the doors open: your capstone moves from "staging URL I test against" to "production URL with alarms armed and a runbook by the door." A review day also does its usual quieter work — spaced repetition. The week's ideas (percentiles, error budgets, fallback chains, the quadrilemma) share one theme: production is a system of PROMISES — to users about speed and honesty, to budgets about cost, to future-you about debuggability. Retrieval practice today is what moves those promises from notes into reflexes: you will reconstruct each artifact's logic from memory before you check it, because the exam-before-the-student-exists principle applies to your own knowledge too.`,
    why: `A deployed-once project is a demo; a monitored, fallback-protected, budgeted service is a portfolio piece that interviews can probe for an hour without hitting bottom. Every artifact today maps to a real interview or customer question: "how do you know it's up?" (SLOs, canary), "what if the provider dies?" (runbook, fallback drill), "what does it cost?" (cost report), "can we trust you with data?" (questionnaire). Week 24 pivots to the FDE craft of selling and scoping this exact system — you want production truth beneath the sales story.`,
    tech: `Review days run on retrieval practice: recall each artifact's REASONING cold, then verify. The week compresses to five promises and their proofs.

**Speed** (Day 155): the promise is a latency budget stated in percentiles; the proof is the probe data and one shipped improvement. Recall drill: TTFT vs tokens/sec, which phase drives each, why continuous batching wins. **Cost** (156): the promise is cost-per-request with projections; the proof is a reconciling ledger and a ≥25% cut with quality CIs. Recall: the four levers, and the router's iron rule. **Detection** (157): the promise is "we know before users tell us"; the proof is RED metrics, quality SLIs, a canary that failed a drill, and burn-rate alerts. **Response** (158): the promise is bounded, honest degradation; the proof is the breaker + fallback chain and a tabletop postmortem. **Trust** (159): the promise is a truthful security posture; the proof is the questionnaire with zero false greens.

### The cutover itself

A cutover is a checklist, not a vibe: pre-flight (staging green, evals green, rollback rehearsed within the week, secrets rotated into prod scope); flip (deploy to the production target, DNS/URL live, canary green from OUTSIDE the network); load sanity (a modest concurrent-user run — you are proving no crash and graceful queueing, not planetary scale); watch (30 minutes of dashboard attention, then rely on alerts). Then the load test feeds the cost report (measured, not projected, cost per request under concurrency) and the latency report (p95 under load vs single-user — queueing appears here, Day 155's TTFT lesson made visible).

The failure mode to avoid today is checklist theater: ticking "runbook exists" without the 3am test — could a stressed stranger execute it? Every gate below has an evidence requirement for exactly this reason.`,
    viz: null,
    guided: [
      {
        title: 'Closed-book week reconstruction',
        minutes: 20,
        body: `Editor closed. On paper or a blank file, from memory:

1. Draw the request path with every reliability/efficiency component from this week: cache check → route decision → prefix-cached prompt → model (breaker, timeout, retries) → fallback chain → metrics/ledger writes. Annotate where TTFT starts and stops.
2. Write the definitions: SLI, SLO, error budget, burn-rate alert. Compute from memory: 99.5% over 30 days at 50k requests/month allows how many failures? (Check: 250.)
3. List the four cost levers and the quadrilemma corners.
4. Write the fallback chain order for a RAG app and WHY retrieval-only is a valid degraded mode.
5. Now open your notes and this week's files; diff. Every gap goes onto a flashcard — gaps found today are gaps absent on Day 179.`,
      },
      {
        title: 'The cutover checklist run',
        minutes: 25,
        body: `Execute in order, recording evidence (timestamps, screenshots, log lines) in \`docs/cutover_log.md\`:

1. **Pre-flight:** CI green on main (tests + eval gate, Day 141); staging canary green; rollback rehearsed this week (Day 158 — if not, do it now); prod secrets set via the secret store, distinct from staging.
2. **Flip:** deploy to the production target (Day 151's path). Confirm the production URL serves from outside (phone off wifi counts as "outside").
3. **Verify:** production canary green 3 consecutive runs; /metrics live; one full traced request visible end-to-end (Day 142); fallback drill — temporarily break the primary model key in prod config, watch the degraded answer + fallback counter, restore.
4. **Load sanity:** run the starter load script at 10 concurrent users for 2 minutes. Record: error count (must be 0 or honest 429s), p50/p95 latency vs your single-user baseline, cost of the run from the ledger.
5. **Watch:** 15 quiet minutes on the dashboard. Note anything surprising in the log — surprises during a calm watch are free incident prevention.`,
        code: `import asyncio, time, httpx

URL = "https://your-capstone-prod.example.com/ask"
QUESTIONS = ["What is the vacation policy?", "How do I submit expenses?",
             "What is the remote work rule?", "Who approves travel?"]

async def user(client, uid, results):
    for i in range(6):
        q = QUESTIONS[(uid + i) % len(QUESTIONS)]
        t0 = time.perf_counter()
        try:
            r = await client.post(URL, json={"q": q}, timeout=30)
            results.append((r.status_code, time.perf_counter() - t0))
        except Exception as e:
            results.append(("EXC:" + type(e).__name__, time.perf_counter() - t0))

async def main(concurrency=10):
    results = []
    async with httpx.AsyncClient() as client:
        await asyncio.gather(*[user(client, u, results)
                               for u in range(concurrency)])
    lats = sorted(t for s, t in results if s == 200)
    errs = [s for s, _ in results if s != 200]
    print(f"{len(results)} reqs, {len(errs)} non-200 ({errs[:5]})")
    if lats:
        print(f"p50={lats[len(lats)//2]:.2f}s p95={lats[int(len(lats)*0.95)]:.2f}s")

asyncio.run(main())`,
      },
    ],
    practice: [
      {
        title: 'Cumulative self-quiz, exam conditions',
        minutes: 15,
        body: `Ten questions, closed book, then grade with your notes. 1. Why can\'t you average p95s across minutes? 2. A user sees 4s of silence then fast text — which metric, which phase, two fixes? 3. Why does the semantic cache need per-ACL-group keys in the enterprise design? 4. Prefix caching: what prompt ordering exploits it? 5. Define burn-rate paging vs threshold paging and why burn wins. 6. Which errors must never be retried, and why does retry need idempotency? 7. Order the RAG fallback chain. 8. Two things that make a postmortem blameless AND useful. 9. A committed-then-deleted API key: required action and why. 10. Name the six rubric rows of a design answer.

Score honestly. Anything below 8/10: schedule the linked day's flashcards for tomorrow and re-quiz on Day 163's warm-up.`,
      },
    ],
    project: {
      title: 'The cutover gate (capstone milestone)',
      brief: `Assemble the evidence pack and declare production. \`docs/cutover_log.md\` must show: production URL serving externally; canary green ×3; fallback drill executed in prod with metrics evidence; load sanity results (10 concurrent users, error count, p50/p95 vs baseline); cost of the load run reconciled to the ledger; links to the week's five artifacts (latency report, cost report, slo.md, runbook, security questionnaire). Tag the repo \`v0.9-production\`. Anything that failed its gate gets a GitHub issue with a target day (176–177 hardening window) — an honest red with a plan beats a fake green, exactly as on Day 159.`,
      rubric: [
        'Production URL verified from outside the deployment network',
        'Canary green three consecutive runs AND fallback drill evidence captured in prod',
        'Load sanity: zero unhandled errors at 10 concurrent users; percentiles recorded vs baseline',
        'All five week-23 artifacts committed and linked from the cutover log',
        'Repo tagged v0.9-production; every failed gate has an issue with a target day',
        'Closed-book reconstruction completed with gaps converted to flashcards',
      ],
    },
    mistakes: [
      'Checklist theater: ticking "runbook exists" without asking whether a stressed stranger could execute it. Every gate needs evidence, not existence.',
      'Load-testing through the cache. Replaying four questions repeatedly measures your cache, not your service; the sanity check is honest only if you note the hit rate alongside.',
      'Treating the load test as a scale proof. Ten concurrent users proves "no crash, graceful queueing" — claiming more invites the Day 160 interviewer to dismantle you.',
      'Skipping the outside-the-network check. Localhost and in-VPC curls hide DNS, TLS, and firewall failures — the three most common "works for me, down for users" causes.',
      'Reviewing by rereading notes instead of reconstructing from memory. Recognition feels like knowledge; only retrieval builds the Day 179 reflexes.',
      'Declaring victory and closing the laptop. The first 24 hours of production are when alert thresholds prove themselves — tomorrow\'s warm-up includes checking what fired overnight.',
    ],
    quiz: [
      {
        q: 'Under 10 concurrent users your p95 jumps from 2.1s to 6.8s while tokens/sec per request stays constant. The bottleneck is…',
        o: [
          'The model got slower',
          'Queueing before prefill — requests waiting for capacity, visible as TTFT growth',
          'The network path to the user',
          'The cache hit rate improved',
        ],
        x: 1,
        w: 'Constant generation speed with ballooning total time under concurrency is the queueing signature: requests wait, TTFT stretches. Day 155\'s decomposition tells you where to look.',
        revisit: 155,
      },
      {
        q: 'During the fallback drill you break the primary key and users get unlabeled cached answers with no metric change. Which TWO promises are broken?',
        o: [
          'Latency and cost',
          'Honest degradation (no degraded label) and observability (fallback not counted)',
          'Security and freshness',
          'None — the users got answers',
        ],
        x: 1,
        w: 'Day 158 requires degradation be labeled to users, and Day 157 requires it be visible in metrics. Silent fallback is the worst state: broken and invisible.',
        revisit: 158,
      },
      {
        q: 'Your error budget for the month is 250 failed requests; the load test burned 0 but the fallback drill served 40 degraded responses. Do degraded responses burn the availability budget?',
        o: [
          'Yes, automatically — degraded equals failed',
          'It depends on how your SLI defined "good": if honest-fallback-within-8s counts as good, no; the SLI definition you wrote on Day 157 decides',
          'No — only 5xx responses ever count',
          'Error budgets reset after drills',
        ],
        x: 1,
        w: 'This is why SLI definitions are written precisely: YOU chose whether labeled degradation counts as success. The budget is arithmetic over your own definition — know what you promised.',
        revisit: 157,
      },
    ],
    resources: [
      { label: 'Google SRE Book — Ch. 4: SLOs (re-read with your own SLOs open)', url: 'https://sre.google/sre-book/service-level-objectives/', type: 'book', time: '20 min' },
      { label: 'Grafana docs — alerting (verify your rules against best practice)', url: 'https://grafana.com/docs/grafana/latest/', type: 'docs', time: '15 min' },
      { label: 'Docker docs — production checklist angles', url: 'https://docs.docker.com/get-started/', type: 'docs', time: '15 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep: full due deck for Days 155–160', minutes: 15 },
      { activity: 'Closed-book week reconstruction + diff', minutes: 20 },
      { activity: 'Cutover checklist run with evidence log', minutes: 40 },
      { activity: 'Cumulative self-quiz under exam conditions', minutes: 15 },
      { activity: 'Evidence pack assembly, tagging, issue filing', minutes: 20 },
      { activity: 'Quiz + flashcard additions from today\'s gaps', minutes: 10 },
    ],
    completion: [
      'Reconstruction done closed-book; gaps became flashcards',
      'Production URL live, canary ×3, fallback drill evidenced',
      'Load sanity passed and recorded; repo tagged v0.9-production',
      'Self-quiz ≥ 8/10 (or remediation scheduled); day quiz ≥ 2/3',
    ],
    connections: {
      back: 'This gate stands on the whole phase: Day 148\'s container, Day 152\'s pipeline, Day 154\'s staging rehearsal, and this week\'s five promise-artifacts — speed, cost, detection, response, trust.',
      forward: 'Week 24 flips the table: Days 162–168 teach you to sell, scope, and demo this system as an FDE — Day 165\'s proposal and Day 167\'s demo are built on the production truth you certified today. Days 176–178 harden whatever you red-flagged.',
    },
    flashcards: [
      { f: 'The five production promises of Week 23?', b: 'Speed (latency budget), cost (ledger+projections), detection (SLOs+canary), response (fallbacks+runbook), trust (security posture).' },
      { f: 'What does a 10-user load sanity actually prove?', b: 'No crash, graceful queueing, honest errors under modest concurrency — NOT scale.' },
      { f: 'Queueing signature under load?', b: 'p95 total time grows while per-request tokens/sec stays flat — waiting, not slower generation.' },
      { f: 'Why verify prod from outside the network?', b: 'DNS, TLS, and firewall failures are invisible from localhost/in-VPC — the classic "works for me."' },
      { f: 'Cutover order?', b: 'Pre-flight (green + rollback rehearsed) → flip → verify (canary, trace, fallback drill) → load sanity → watch.' },
    ],
    deepDive: [
      { label: 'Write the "day 2" list', note: 'After 24 hours of production, review: which alerts fired, which were noise, what the real traffic latency histogram looks like vs the load test. Tuning thresholds against day-2 reality is the step most solo projects skip.' },
    ],
  },
  {
    id: 'd162', day: 162, week: 24, phase: 9, kind: 'lesson',
    title: 'The FDE Role',
    analogy: 'The embedded field engineer',
    objectives: [
      'Trace the FDE lineage from Palantir to the current AI-lab wave and explain why the role exploded with LLMs',
      'Describe the three hats — consultant, product manager, engineer — and when each is worn in an engagement',
      'Differentiate FDE from solutions engineer, sales engineer, and product engineer on concrete axes',
      'Walk the engagement lifecycle from discovery to handoff and name the deliverable of each stage',
      'Read real FDE job postings critically and map your own evidence to their requirements',
    ],
    prereqs: [
      { day: 105, label: 'Explaining LLMs to non-technical stakeholders' },
      { day: 146, label: 'Communicating quality to stakeholders' },
      { day: 160, label: 'AI system design' },
    ],
    eli5: `When an armed force buys a new radar system, the manufacturer doesn't just ship crates and a manual. It sends a field engineer who lives on the base for months: someone who knows the radar's guts cold, but spends most days learning the BASE — how this squadron actually flies, what the maintenance chief worries about, which workflow the manual's authors never imagined. The field engineer adapts the system to the base, radios design flaws back to the factory, and by the end has quietly become the most trusted person on site: the one who speaks both languages.

A forward-deployed engineer is that person for software. Palantir institutionalized it — engineers embedded with customers, building against real messy data until the product fit — and the AI wave revived it at scale, because LLM products are powerful but shapeless: what an AI assistant should DO at an insurance firm versus a freight company only becomes clear inside their walls. The FDE goes in with three hats in the bag: consultant (diagnose the real problem), product manager (decide what to build first), engineer (build it, on production-quality instincts). The rarest skill is knowing which hat the current hour requires.`,
    why: `FDE roles at AI labs and AI-first startups are among the best-paid, fastest-growing engineering jobs of 2026 precisely because the skill mix is scarce: people who can both pass Day 160's design round AND sit with a claims manager for an hour without opening a laptop. Everything you have built for 161 days is the engineering half; Weeks 24–25 train the deployed half. Even if you never take the title, every senior AI engineer is part-FDE now — the ambiguous, customer-shaped problem is the job. Understanding the role also transforms your job search: you will read postings today the way employers write them.`,
    tech: `### Lineage and why now

Palantir's model: deploy engineers (their "FDEs", split into echo/delta flavors) into customer sites to build against real data and workflows, then harvest the recurring patterns into product. The economics only work when each deployment teaches the product something — otherwise it is a consultancy with worse margins. The LLM era recreated the conditions: enormous capability, unclear application, enterprise buyers who cannot self-serve. Labs and AI startups now field FDE teams to close that gap, and the role commands a premium because it compresses three jobs into one seat.

### The three hats, operationally

**Consultant hat**: discovery interviews (Day 163), stakeholder mapping, workflow archaeology — output is a problem statement the customer recognizes as their own. **PM hat**: scoping v0/v1/later (Day 164), success criteria, saying no with options (Day 171) — output is a plan with testable acceptance criteria. **Engineer hat**: prototype fast (Day 166), integrate with their systems (Day 169), production-grade judgment about what is demo-safe vs deployable — output is working software and an honest account of its limits. Failure modes are hat mismatches: engineering during discovery (building before understanding), consulting during delivery (slideware when the customer needs software).

### The role, disambiguated

Versus **sales engineer / SE**: SEs support a salesperson through a defined pre-sales motion — demos, POCs, questionnaire answers — and step out at signature. FDEs go deeper and stay longer: they build custom integrations, own outcomes post-sale, and feed product. Versus **product engineer**: product engineers optimize for the general case from headquarters; FDEs optimize for one customer's specific case from inside, then generalize. Versus **consultant**: consultants bill hours against a statement of work; FDEs are product-company employees whose north star is product-shaped learning, not billable expansion.

### The engagement lifecycle

Discovery → scoping/proposal → pilot build → evaluation against agreed success criteria → production hardening → handoff/expansion. Each stage has a deliverable you now recognize: discovery notes and stakeholder map (Day 163), requirements doc (164), proposal with architecture (165), prototype (166), demo (167), eval report (Day 140's craft), runbook and cutover (this past week). The next six days ARE this lifecycle, run in order.`,
    viz: 'fde-hats',
    guided: [
      {
        title: 'Dissect two job postings like an examiner',
        minutes: 20,
        body: `Below are two condensed-but-realistic postings. For each: (1) underline every distinct skill claim; (2) tag it C/PM/E for the hat it belongs to; (3) write the interview question you would expect it to generate; (4) note the strongest evidence YOU currently have, naming a specific artifact from your 161 days.

**Posting A — "Forward Deployed Engineer, AI Platform (Series C, fintech vertical)":** "You will embed with 2–3 enterprise customers at a time, owning engagements from technical discovery through production. You'll scope and build LLM-powered workflows (document processing, agent-assist) on our platform, integrating with customer systems (core banking APIs, SharePoint, Snowflake). You'll define success metrics with customer stakeholders and instrument evaluations to prove them. Expect 25–50% travel. Requirements: strong Python + production API experience; hands-on LLM app experience (RAG, tool use, evals); ability to run a room of mixed technical/executive stakeholders; security-review fluency (SOC 2 environments)."

**Posting B — "Forward Deployed Software Engineer (AI lab, applied team)":** "Work with strategic customers to turn frontier-model capability into deployed products. Prototype rapidly (days, not months), then harden what works. Translate ambiguous business problems into technical plans; write proposals and architecture docs executives approve and engineers can build. Debug production issues in customer environments. Requirements: full-stack shipping ability; excellent written communication; comfort with ambiguity; experience making latency/cost/quality trade-offs in LLM systems."

5. Finish with a gap list: the two claims across both postings where your evidence is thinnest. (Common honest answers at this point: "run a room" and "customer-environment debugging" — Days 167 and 172 exist for exactly this reason.)`,
      },
      {
        title: 'Map the lifecycle onto your capstone — as if you had been the customer',
        minutes: 15,
        body: `1. Draw the six lifecycle stages (discovery → scoping → pilot → evaluation → hardening → handoff) as a table.
2. For each stage, fill two columns: "deliverable an FDE would produce" and "the closest artifact I already have," citing real files from your capstone repo (requirements came from the Day 119 brief; eval report from Day 140; cutover evidence from Day 161…).
3. Mark the honest holes — you never DID discovery (the Day 119 brief was handed to you) and you have no proposal. Those two holes are precisely Days 163–165's work.
4. Write one paragraph: "If the capstone had been a real engagement, the moment it would have failed is…" — arguing from a specific stage. (Strong candidates usually pick discovery: building the right thing was assumed, not established.)`,
      },
    ],
    practice: [
      {
        title: 'The three-hats reflex drill',
        minutes: 15,
        body: `For each situation, name the hat that should be on, the FIRST move it dictates, and the classic mistake of wearing the wrong hat. Answer in three lines each, then compare with a peer or the AI tutor.

1. Kickoff week. The VP who bought the pilot says "we need an AI chatbot for procurement." Nobody can say who will use it.
2. Mid-pilot, the customer's engineers ask you to also ingest a legacy Oracle system "while you're here" — two weeks of work, not in scope.
3. The demo is Thursday; extraction accuracy on their scanned invoices is 70% and the fix is genuinely hard.
4. Post-pilot review. Usage data shows only 3 of 40 intended users touch the tool weekly.

Hints: 1 is consultant (discovery before design — "chatbot" is a solution claim, not a problem); 2 is PM (scope guard: log it, price it, trade it); 3 is a judgment call — engineer hat says fix, PM hat says re-scope the demo honestly around what works (the honest path wins, Day 167 explains why); 4 is consultant again — usage failure is a discovery failure until proven otherwise.`,
      },
    ],
    project: {
      title: 'Your FDE positioning memo',
      brief: `Write \`docs/fde_positioning.md\` (one page, three sections). **Evidence map:** the ten most FDE-relevant artifacts from your 161 days, each with one sentence of "so what" written for a hiring manager (not "built a RAG app" but "shipped a monitored, fallback-protected doc-QA service with a measured 30% cost reduction and an eval-gated CI"). **Gap plan:** your three thinnest claims, each tied to the coming day that trains it (163–174). **Positioning paragraph:** 120 words, first person, the kind you would paste into an application — what problem you deploy against and what proof you carry. This memo becomes your Day 180 job-search launch material.`,
      rubric: [
        'Evidence map cites ten real artifacts with hiring-manager-readable "so what" lines',
        'Every lifecycle stage is covered by at least one evidence item or an explicit gap',
        'Gap plan names three gaps, each mapped to a specific upcoming day',
        'Positioning paragraph is ≤120 words, concrete, and free of unverifiable claims',
        'Committed to the repo; job-posting dissection notes attached',
      ],
    },
    mistakes: [
      'Treating FDE as "sales with extra steps." FDEs own outcomes and code after signature; the center of gravity is deployed working software, not the deal.',
      'Treating FDE as "normal engineering, remote from HQ." The consultant and PM hats are half the job; engineers who skip discovery build beautiful wrong things.',
      'Wearing the engineer hat during discovery — proposing architectures in the first meeting. The customer\'s stated solution ("we need a chatbot") is data about their problem, not a spec.',
      'Reading job postings as checklists to feel behind on. Postings are unions of wishes; map evidence to the core claims and let strong artifacts argue for you.',
      'Underestimating the writing load. Proposals, requirement docs, status updates — FDEs are judged on documents executives forward; Day 164–165 treat writing as an engineering discipline.',
      'Assuming the product does not matter because you can custom-build anything. The FDE\'s economic job is harvesting patterns back into product; pure bespoke work is consulting in disguise.',
    ],
    quiz: [
      {
        q: 'A customer\'s VP opens the engagement with "we need an AI chatbot for procurement." The FDE\'s correct first move is…',
        o: [
          'Estimate the chatbot build and propose a timeline',
          'Treat "chatbot" as a symptom, put on the consultant hat, and run discovery on the underlying workflow and pain',
          'Demo the platform\'s chatbot template immediately',
          'Escalate to the account executive',
        ],
        x: 1,
        w: 'Customer solution-statements are evidence about the problem, not specifications. Discovery first — the requested chatbot frequently dissolves into a document-search or process problem.',
        revisit: 162,
      },
      {
        q: 'The cleanest single axis separating an FDE from a sales engineer is…',
        o: [
          'FDEs know more math',
          'FDEs stay and own outcomes after the contract is signed, building and hardening in production; SEs support the pre-sales motion and hand off',
          'SEs travel more',
          'FDEs never talk to executives',
        ],
        x: 1,
        w: 'Both demo and scope pre-sale. The FDE\'s distinctive territory is post-signature: custom integration, production ownership, and feeding learnings back to product.',
        revisit: 162,
      },
      {
        q: 'Mid-engagement, usage data shows almost nobody uses the delivered tool. Which hat diagnoses this, and what is the leading hypothesis?',
        o: [
          'Engineer hat — the latency must be too high',
          'PM hat — the roadmap needs more features',
          'Consultant hat — discovery failure: the tool likely solves a problem the real users don\'t have, or fights their actual workflow',
          'No hat — adoption is the customer\'s job',
        ],
        x: 2,
        w: 'Low adoption is a discovery signal until proven otherwise. The fix starts with watching real users work — not with features or speed.',
        revisit: 162,
      },
    ],
    resources: [
      { label: 'Nabeel Qureshi — Reflections on Palantir (the FDE origin story)', url: 'https://nabeelqu.substack.com/p/reflections-on-palantir', type: 'article', time: '30 min' },
      { label: 'FDE Interview Guide (Exponent) — role definition & loop structure', url: 'https://www.tryexponent.com/blog/forward-deployed-engineer-interview-the-definitive-2026-guide-fde', type: 'article', time: '25 min' },
      { label: 'PreSales Collective — the adjacent SE craft', url: 'https://www.presalescollective.com/', type: 'article', time: '15 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: Week 23 due cards + check what fired in prod overnight', minutes: 10 },
      { activity: 'ELI5 + tech read; write the three hats and lifecycle from memory', minutes: 20 },
      { activity: 'Guided: job-posting dissection + lifecycle mapping', minutes: 35 },
      { activity: 'Practice: three-hats reflex drill', minutes: 15 },
      { activity: 'Project: FDE positioning memo', minutes: 25 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'Both postings dissected with hat-tags, expected questions, and evidence',
      'Lifecycle table filled with real artifact citations and honest holes',
      'fde_positioning.md committed with evidence map, gap plan, and paragraph',
      'Quiz ≥ 2/3',
    ],
    connections: {
      back: 'Day 105 (the stakeholder explainer) and Day 146 (communicating quality) were early reps of the consultant hat; Day 160\'s design skill is the engineer hat\'s crown; Week 23\'s production evidence is what makes your positioning memo credible.',
      forward: 'The next six days run the engagement lifecycle in order: discovery (163), requirements (164), proposal (165), prototype (166), demo (167), full simulation (168). Day 174 runs it again under pressure with objections and scope changes.',
    },
    flashcards: [
      { f: 'The FDE\'s three hats?', b: 'Consultant (diagnose the real problem), PM (scope & success criteria), engineer (build & harden). Skill = switching correctly.' },
      { f: 'FDE vs sales engineer in one line?', b: 'SE supports the pre-sales motion and hands off; FDE stays post-signature, builds, owns outcomes, feeds product.' },
      { f: 'The engagement lifecycle?', b: 'Discovery → scoping/proposal → pilot → evaluation → hardening → handoff/expansion.' },
      { f: 'Why did LLMs revive the FDE model?', b: 'Huge capability, shapeless application: what the AI should do only becomes clear inside the customer\'s walls.' },
      { f: '"We need a chatbot" is…', b: 'A symptom, not a spec — data about the problem. Consultant hat: run discovery on the workflow.' },
      { f: 'What makes FDE economics work (vs consulting)?', b: 'Each deployment harvests patterns back into product; pure bespoke work is consulting in disguise.' },
    ],
    deepDive: [
      { label: 'Read one real posting tonight', note: 'Find a live FDE posting from an AI lab or applied-AI startup and run today\'s dissection protocol on it. Postings drift fast; the protocol is the durable skill.' },
    ],
  },
  {
    id: 'd163', day: 163, week: 24, phase: 9, kind: 'lesson',
    title: 'Customer Discovery & the Mom Test',
    analogy: 'Questions that can\'t lie to you',
    objectives: [
      'Explain why polite people lie in discovery and how question design defeats it',
      'Convert hypothetical and opinion questions into past-behavior and specifics questions',
      'Extract workflow, pain frequency, cost, and current workarounds from an interview transcript',
      'Map stakeholders — economic buyer, users, champion, blocker — from conversational evidence',
      'Elicit testable success criteria ("how would you know this worked?") without leading the witness',
    ],
    prereqs: [
      { day: 162, label: 'The FDE role — the consultant hat' },
      { day: 105, label: 'Talking to non-technical stakeholders' },
    ],
    eli5: `Ask your mom "would you use an app that plans family dinners?" and she'll say "of course, sweetheart!" — because she loves you, not because she'd use it. Ask instead "how did you decide what to cook last Tuesday?" and she cannot lie: either a story about a real struggle tumbles out, or a shrug reveals there is no problem here at all. That is the Mom Test, and the insight generalizes brutally: everyone you interview is polite, and questions about the future or about opinions ("would you…", "do you think…") harvest politeness. Questions about the past and about specifics ("walk me through the last time…", "what did that cost you?", "what did you try instead?") harvest facts.

For an FDE the stakes are a hundred times a dinner app. A VP says "we need AI for our claims process" — and if you ask "would a summarization assistant help?" the answer is yes, it is ALWAYS yes, and three months later you demo a tool that nobody opens. The discovery interview is the cheapest, highest-leverage engineering you will ever do: an hour of well-designed questions routinely saves a quarter of well-engineered waste.`,
    why: `The most expensive failure in applied AI is not hallucination — it is the perfectly engineered solution to the wrong problem. Enterprises are littered with abandoned AI pilots that demoed beautifully and solved nothing anyone was paid to care about. FDE interview loops test discovery directly: you will role-play a customer conversation and be graded on question quality (Day 168 simulates this; the Exponent guide's case round is exactly this). And the skill compounds: every requirements doc (Day 164), proposal (165), and demo (167) inherits its truth or its fiction from the discovery that fed it.`,
    tech: `### The three Mom Test rules, engineered

1. **Talk about their life, not your idea.** The moment your idea enters the room, the data corrupts: people react to YOU, not to their problem. Keep the tool imaginary as long as possible.
2. **Ask about specifics in the past, not generics or the future.** "Walk me through the last time a claim got stuck" produces a workflow map with names, systems, and durations. "Do claims often get stuck?" produces "oh yes, all the time" — unfalsifiable mush.
3. **Listen for commitment and advancement, not compliments.** "This is really cool" is a polite exit. "Can you come back Thursday to meet our claims director?" is evidence. In discovery, the currencies are time, reputation (introductions), and eventually money.

### The extraction targets

A discovery conversation should leave you able to fill five slots: **workflow** (the actual sequence of steps, systems, and people — get them to narrate a specific recent instance); **pain quantified** (frequency × duration × who — "twice a week, half a day each, two senior people" is a business case; "it's annoying" is not); **current workaround** (what they do today; no workaround usually means no real pain); **stakeholders** (who feels the pain = user; who pays = economic buyer; who can kill it = blocker — often IT/security, Day 159's questionnaire made flesh; who wants you to win = champion); **success criteria** (ask "if this worked perfectly, what number changes on whose dashboard?" — the raw material of Day 164's acceptance criteria).

### Question surgery

Bad → good, the transformation you will drill: "Would you use an AI that summarizes reports?" → "How did you handle the last report that crossed your desk — what did you do with it, how long did it take?" · "Is data quality a big problem?" → "Tell me about the last time bad data burned you. What did it cost?" · "Do you think your team would adopt this?" → "Who on your team would touch this daily? What tool did they most recently adopt — and what made that one stick?" Follow-ups do the digging: "what happened next?", "how often?", "who else was involved?", "what have you tried?", "what would happen if you did nothing?" The last one sizes the pain honestly — sometimes the true answer is "nothing much," and hearing it in week zero is a gift.`,
    viz: null,
    guided: [
      {
        title: 'Annotate a real-shaped transcript: Harbor & Vane Insurance',
        minutes: 25,
        body: `Below is an excerpt from a discovery call with Dana Okafor, Claims Operations Manager at Harbor & Vane, a 400-person commercial-insurance brokerage. Read once for flow. Then annotate line by line: mark each interviewer question MT-GOOD (past/specific/their-life) or MT-BAD (hypothetical/opinion/pitch), and mark each Dana answer for which extraction slot it fills (workflow / pain-quant / workaround / stakeholder / success).

~~~text
FDE: Thanks for the time, Dana. Before anything else — could you
  walk me through the last claim that came in yesterday or today?
  Just what literally happened, start to finish.
DANA: Sure. A water-damage claim from a logistics client came in
  around 9am — email to our claims inbox, PDF attachments, maybe
  30 pages. Priya on my team opened it, skimmed for the policy
  number, looked it up in AS400 — that's our policy system —
  then started keying the loss details into ClaimCore, our
  claims platform. That took her until, I want to say, 11:30.
FDE: What was she actually doing for those two and a half hours?
DANA: Reading, mostly. The loss runs are never in the same format.
  Adjusters' reports, photos, invoices — she has to find dates,
  amounts, cause-of-loss language, and policy exclusions that
  might apply, and re-type them. And she double-checks against
  the policy PDF because AS400's data is... let's say vintage.
FDE: How many claims like that land in a week?
DANA: Complex commercial ones? Forty to sixty across the team.
  Simple auto stuff is maybe two hundred but those are quick.
FDE: You said Priya double-checks against the policy PDF — tell
  me about the last time skipping that check caused a problem.
DANA: [laughs] March. We paid a claim that an exclusion clearly
  barred — nobody caught the endorsement. That was a $40K
  mistake and I spent a week of my life on the postmortem.
FDE: What have you tried already, for the re-keying part?
DANA: We piloted an OCR tool two years ago. It choked on the
  adjusters' scanned reports and the team quietly went back
  to doing it by hand. IT still brings it up — they bought
  licenses. Oh, and don't repeat that.
FDE: Noted. If the intake time went from two and a half hours
  to thirty minutes, what number changes, and who sees it?
DANA: Cycle time to first response. It's on my dashboard and my
  VP's — we promise brokers 48 hours and we hit maybe 70%.
  If that went to 90 I'd... honestly I'd take the win to Marcus
  myself. He owns the ops budget.
FDE: Would an AI copilot that pre-extracts the loss details
  into ClaimCore be something the team would use?
DANA: Oh — sure, that sounds great.
~~~

1. Annotate every FDE turn. (You should find exactly one MT-BAD question — the final one. Note what the answer is worth: nothing. Note also how much the "what have you tried" question yielded: a failed OCR pilot, a wary IT department holding budget scar tissue, and a confidentiality boundary.)
2. Fill the five extraction slots from evidence only; quote the supporting line for each.
3. Stakeholder map: Dana (champion? user?), Priya (user), Marcus (economic buyer), IT (blocker with a grudge — name why). What is your evidence for each label?
4. Write the one question you would ask next, and defend it against the three rules.`,
      },
      {
        title: 'Question surgery on a corrupted interview: Nortia Labs',
        minutes: 15,
        body: `This excerpt is from a DIFFERENT discovery call — a biotech scale-up, Nortia Labs — conducted badly. Rewrite it.

~~~text
FDE: We've built an incredible AI platform for lab documentation.
  I think it could transform your workflows. Do you feel your
  scientists spend too much time on documentation?
DR. IKEDA: I suppose everyone would say yes to that.
FDE: If we could cut documentation time in half, would that be
  valuable to Nortia?
DR. IKEDA: In principle, of course.
FDE: Would your scientists use an AI assistant that drafts their
  experiment write-ups automatically?
DR. IKEDA: Maybe. Some might. We're quite busy with the FDA
  submission this quarter, though.
FDE: Great — so would next week work for a demo?
DR. IKEDA: ...Send me some materials and we'll see.
~~~

1. Label the failure in each FDE turn (pitch-first, hypothetical, leading, compliment-fishing, premature advance).
2. Note the two genuine signals the FDE talked past: "busy with the FDA submission" (their ACTUAL top pain this quarter — a better wedge than documentation) and the soft brush-off ending (no time, no introduction, no commitment = polite no).
3. Rewrite the interview as five questions that obey the rules, starting from the FDA-submission thread. For each, say which extraction slot it targets.
4. One paragraph: why "send me some materials" is a failure outcome, and what commitment-currency a good version would have asked for instead.`,
      },
    ],
    practice: [
      {
        title: 'Live discovery against a simulated customer',
        minutes: 20,
        body: `Run a 15-minute discovery interview with your AI tutor playing a role you must not peek at: "You are Sam Torres, Head of Customer Support at Fieldstone Software (B2B payroll, 900 customers, 12 support agents). You have a real, specific operational pain involving your support workflow that you will only reveal through concrete stories when asked good questions. Politely deflect hypotheticals with vague agreement. Volunteer nothing. If asked Mom-Test-style past-behavior questions, answer with rich specifics including numbers, system names, and people."

Constraints: no pitching, no solution words ("AI", "copilot", "tool") for the first ten minutes; fill all five extraction slots; end by asking for ONE commitment and note what you get.

Afterward, self-grade: count MT-GOOD vs MT-BAD questions from your own transcript; check which slots are actually filled with QUOTED evidence rather than your inference. Hints if stuck mid-interview: "walk me through yesterday's worst ticket", "what happened next?", "what does that cost you in a week?", "what have you tried?"`,
      },
    ],
    project: {
      title: 'The discovery kit',
      brief: `Build \`docs/discovery_kit.md\` — the artifact you will carry into Day 168's simulation and real interviews: (1) your annotated Harbor & Vane transcript with the five slots filled and quoted; (2) the Nortia rewrite (five repaired questions, slot-tagged); (3) a personal question bank of 15 questions organized by extraction slot, each obeying the three rules — at least 5 written by you, not copied from today's text; (4) the stakeholder-map template (role, name, pain exposure, power, evidence line); (5) your self-graded score from the live practice interview with two specific improvements for next time.`,
      rubric: [
        'Harbor & Vane annotation identifies the MT-BAD question and quotes evidence for all five slots',
        'Nortia rewrite starts from the FDA-submission signal and every question is slot-tagged',
        'Question bank has 15 rule-compliant questions, ≥5 original, none hypothetical',
        'Stakeholder template includes an evidence column (no vibes-based labels)',
        'Practice interview self-grade includes MT-GOOD/BAD counts and two named improvements',
      ],
    },
    mistakes: [
      'Pitching in the first five minutes. Once your idea is on the table, every subsequent answer measures politeness toward you, not reality.',
      'Accepting compliments as validation. "That sounds great" (see Dana\'s last answer) is a zero-information response to a bad question; only past behavior and commitments count.',
      'Asking about the future: "would you / do you think / how likely." Humans are terrible predictors and generous liars about their future selves; convert to "last time" questions.',
      'Ignoring the workaround question. What they currently do (including a failed OCR pilot!) reveals pain intensity, budget history, and political scar tissue in one answer.',
      'Interviewing only your champion. Dana is not the buyer (Marcus) nor the daily user (Priya) nor the blocker (IT) — a deal map built from one enthusiastic voice collapses at security review.',
      'Ending without asking for a commitment. Time, an introduction, data access — if the meeting ends in compliments and "send materials," you learned nothing about whether they mean it.',
    ],
    quiz: [
      {
        q: 'Which question yields the most trustworthy discovery data?',
        o: [
          '"Would your team use an AI that summarizes claims?"',
          '"Do you think intake takes too long?"',
          '"Walk me through the last claim that came in — what literally happened, step by step?"',
          '"How likely are you to buy a tool like this, 1–10?"',
        ],
        x: 2,
        w: 'Past, specific, about their life: it produces a verifiable narrative with systems, people, and durations. The others harvest opinions, predictions, and politeness.',
        revisit: 163,
      },
      {
        q: 'In the Harbor & Vane call, Dana\'s "Oh — sure, that sounds great" in response to the copilot question is best treated as…',
        o: [
          'Validation that the copilot is the right build',
          'A commitment to pilot',
          'Noise — a polite response to a hypothetical pitch question; the real evidence is the $40K story and the 48-hour SLA numbers',
          'A rejection',
        ],
        x: 2,
        w: 'The one MT-BAD question got the one worthless answer. Everything durable in that call came from past-behavior questions: the workflow, the quantified pain, the failed pilot, the metric.',
        revisit: 163,
      },
      {
        q: 'A prospect ends discovery with warm compliments and "send me some materials." Under commitment-currency rules this is…',
        o: [
          'A strong buying signal',
          'A polite no — zero cost was committed; a real advance spends time, reputation, or access (a follow-up meeting, an intro to the buyer, sample data)',
          'A request for a proposal',
          'Grounds to start building the prototype',
        ],
        x: 1,
        w: '"Send materials" costs the prospect nothing and usually converts to silence. Good interviews end by asking for a currency-bearing next step and reading the answer honestly.',
        revisit: 163,
      },
    ],
    resources: [
      { label: 'The Mom Test — book site & summary materials', url: 'https://www.momtestbook.com/', type: 'book', time: '25 min' },
      { label: 'FDE Interview Guide (Exponent) — the customer-case round', url: 'https://www.tryexponent.com/blog/forward-deployed-engineer-interview-the-definitive-2026-guide-fde', type: 'article', time: '15 min' },
      { label: 'PreSales Collective — discovery-call craft', url: 'https://www.presalescollective.com/', type: 'article', time: '15 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: due cards + Day 161 self-quiz remediation check', minutes: 10 },
      { activity: 'ELI5 + tech read; write the three rules and five slots from memory', minutes: 15 },
      { activity: 'Guided: Harbor & Vane annotation + Nortia surgery', minutes: 40 },
      { activity: 'Practice: live discovery with the simulated customer', minutes: 20 },
      { activity: 'Project: assemble the discovery kit', minutes: 25 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'Both transcripts fully annotated with slot-quoted evidence',
      'Live interview run; MT-GOOD/BAD self-count recorded',
      'discovery_kit.md committed with a 15-question original-heavy bank',
      'Quiz ≥ 2/3',
    ],
    connections: {
      back: 'This is Day 162\'s consultant hat given a method, and it rhymes with Day 134\'s eval mindset: in both, you design the measurement BEFORE trusting the output — questions are to customers what golden sets are to models.',
      forward: 'Tomorrow (Day 164) the Harbor & Vane transcript becomes a requirements doc. Day 168\'s simulation opens with a fresh transcript to mine, and Day 174 adds live objections. The success-criteria question returns as pilot metrics on Day 173.',
    },
    flashcards: [
      { f: 'The three Mom Test rules?', b: 'Their life not your idea; specifics in the past not generics/future; commitments not compliments.' },
      { f: 'The five extraction slots of discovery?', b: 'Workflow, quantified pain (freq × duration × who), current workaround, stakeholder map, success criteria.' },
      { f: 'Convert: "Would you use X?"', b: '"Walk me through the last time you [did the underlying task] — what happened, how long, what did you try?"' },
      { f: 'Commitment currencies?', b: 'Time (next meeting), reputation (introductions), money/access (data, pilot budget). Compliments are not one.' },
      { f: 'Why does the workaround question punch above its weight?', b: 'It reveals pain intensity, prior budget spent, and political scar tissue (e.g. a failed OCR pilot IT still resents).' },
      { f: 'Stakeholder four-role map?', b: 'User (feels pain), economic buyer (pays), champion (sells internally), blocker (can kill it — often IT/security).' },
    ],
    deepDive: [
      { label: 'Interview a real person tonight', note: 'Run a 15-minute Mom-Test interview with a friend about any workflow of theirs (expense reports, meal planning). The rules feel obvious on paper and evaporate under social pressure; only live reps fix that.' },
    ],
  },
  {
    id: 'd164', day: 164, week: 24, phase: 9, kind: 'lesson',
    title: 'Ambiguity → Requirements',
    analogy: 'Fog into blueprints',
    objectives: [
      'Write a problem statement the customer would recognize as their own words, sharpened',
      'Separate functional from non-functional requirements and make every one testable',
      'Maintain an explicit assumptions-and-constraints log with owners and verification dates',
      'Scope ruthlessly into v0 / v1 / later, with a defensible rationale for every deferral',
      'Transform a real discovery transcript into a complete requirements document',
    ],
    prereqs: [
      { day: 163, label: 'Discovery & the Mom Test — the Harbor & Vane transcript' },
      { day: 48, label: 'System design method — requirements first' },
      { day: 134, label: 'Golden sets — testable criteria' },
    ],
    eli5: `A family tells an architect: "we want the house to feel more open, and cooking is chaos when guests come." That is fog — true, felt, and unbuildable. The architect's craft is converting fog into blueprints WITHOUT losing the family's meaning: "remove the wall between kitchen and dining (structural engineer to confirm load-bearing status — assumption, verify by Friday); island with seating for four; done means: two people can cook while four sit, and the oven opens fully with someone seated." Notice what happened: feelings became checkable statements, each guess got labeled as a guess with a deadline, and the swimming pool the teenager wanted went to a "later" list with a reason attached, not a rejection.

Yesterday's discovery call left you with exactly such fog: Dana's stories about re-keying PDFs, a $40K exclusion miss, a 48-hour promise kept 70% of the time. Today you draft the blueprint: a requirements doc where every line is testable ("extraction of eight named fields at ≥95% accuracy on 50 sample claims" — not "accurate extraction"), every assumption is logged with an owner, and the v0 line is drawn where the pilot can prove value in six weeks. The doc is also a mirror: the customer reads it and says "yes, that's our problem" — or corrects you now, while corrections cost nothing.`,
    why: `Requirements docs are where FDE engagements are won or quietly doomed. Vague requirements produce the classic pilot death: three months in, the customer says "this isn't what we meant," and nobody can prove otherwise because nothing was testable. A sharp doc does the opposite — it converts Day 163's discovery into acceptance criteria that Day 140-style evals can literally execute, makes scope creep visible ("that's a v1 item, here's the log"), and becomes the contract-shaped artifact your Day 165 proposal prices. Interviewers for FDE and senior AI roles hand you a messy brief and watch for exactly this conversion skill.`,
    tech: `### The document's anatomy

The template you will use today and carry through Day 180:

1. **Problem statement** — 3–5 sentences in the customer's vocabulary, quantified from discovery evidence, naming who hurts and what it costs. No solution words.
2. **Goals & non-goals** — what changes if this works (tied to the customer's metric: cycle-time to first response, 70%→90% on the 48h SLA), and explicit non-goals to kill scope ambiguity ("not replacing ClaimCore; not touching simple auto claims in v0").
3. **Functional requirements** — numbered FR-1…FR-n, each a testable behavior: "FR-3: extract policy number, loss date, cause of loss, claimed amount + four more named fields from emailed claim PDFs into a review screen." Each carries a priority (MoSCoW: must/should/could/won't-now) and a source line from the transcript — traceability is what lets you defend scope later.
4. **Non-functional requirements** — the -ilities, each with a number and a measurement method: accuracy targets per field, latency ("intake processing < 10 min end-to-end"), security (Day 159 vocabulary: data residency, PII redaction, audit logging), availability tier. Untestable NFRs ("must be fast, secure, scalable") are decoration.
5. **Constraints** — facts you cannot change: AS400 is read-only vintage; IT is scarred by the OCR pilot and must approve anything touching claims data; brokers email PDFs and will not change behavior.
6. **Assumptions log** — every guess, tabled: assumption / owner / how to verify / by when / risk if wrong. "A-2: adjuster reports are ≥80% digitally-generated PDFs, not photos of paper (owner: me; verify: sample 100 claims by Fri; risk: OCR-pilot redux)."
7. **Scope ladder** — v0 (six-week pilot provable value), v1 (post-pilot), later (parking lot with reasons). The v0 test: does it touch the metric the economic buyer watches?
8. **Acceptance criteria** — the pilot's exam, written before the pilot exists (Day 134's move, verbatim): "AC-1: on a held-out set of 50 real claims, the eight fields extract at ≥95% field-level accuracy; AC-2: median intake time on pilot claims ≤ 45 min vs 150 min baseline; AC-3: zero un-flagged exclusion misses on the pilot set."

### The craft rules

Write requirements as observable behaviors, never internal mechanisms ("uses a vector database" is design leaking into requirements — say "answers cite the specific policy clause"). Quantify from evidence, and when evidence is missing, write the assumption instead of a confident number. Every requirement traceable to a transcript line or a logged assumption — if you cannot trace it, you invented it.`,
    viz: null,
    guided: [
      {
        title: 'Walk the template against Harbor & Vane — sections 1–4',
        minutes: 25,
        body: `Open your annotated Day 163 transcript and \`requirements_harbor_vane.md\` with the eight-section template. Build the first four sections:

1. **Problem statement.** Draft it, then run the checks: Is it in Dana's vocabulary (claims intake, loss runs, cycle time — not "document AI")? Does it quantify from evidence (40–60 complex claims/week, ~2.5h each, 70% on a 48h SLA, one $40K exclusion miss)? Does it name who hurts (Priya's team daily; Dana's dashboard; Marcus's budget)? Zero solution words?
2. **Goals & non-goals.** One primary goal tied to the SLA metric. Then at least three non-goals — practice the knife: simple auto claims out; writing INTO ClaimCore out for v0 (review-screen only — why? the $40K story means a human must stay in the loop, and IT trust must be earned); replacing the adjuster relationship out.
3. **Functional requirements.** Write FR-1 through FR-6 minimum, MoSCoW-tagged, each with its transcript-line citation. Must-haves should cover: PDF intake from the claims inbox, eight-field extraction to a review screen, policy lookup cross-check, exclusion/endorsement flagging (that is the $40K line — arguably the highest-value FR), human confirm-before-commit.
4. **Non-functional requirements.** At least five, each with number + measurement: field accuracy (how will you measure it? — a labeled sample, i.e., a golden set), processing latency, PII handling, audit trail ("every extraction traceable to source page" — Day 136's citation discipline appearing in a contract), and availability (business hours only for a pilot is FINE, and writing that down is the skill).`,
      },
      {
        title: 'Sections 5–8: assumptions, scope ladder, acceptance criteria',
        minutes: 20,
        body: `1. **Constraints.** List five from the transcript. (AS400 read-only; emailed PDFs, formats uncontrolled; IT approval gate with OCR scar tissue; brokers won't change behavior; pilot must fit ops budget cycle — Marcus's.)
2. **Assumptions log.** Table at least six. Seed set to beat: PDF quality distribution; volume seasonality; ClaimCore has an API or at least an import path (nobody asked! — that is an assumption with a deadline, owner: you, verify: ask IT this week); Dana can grant sample data access; the 8 fields cover 90% of re-keying time; Marcus's budget window.
3. **Scope ladder.** v0 = the six-week pilot: extraction + review screen + exclusion flags on ONE claim type (water damage — you have evidence for it), measured against AC-1..3. v1 = more claim types, ClaimCore write-back behind approvals, exclusion-rule library. Later = auto-drafted broker responses, simple-auto automation. Every deferral gets a reason ("write-back deferred until extraction accuracy is proven and IT trust established").
4. **Acceptance criteria.** Write AC-1 through AC-4, then apply the two tests: could a neutral third party run this as an exam and get an unambiguous pass/fail? And — does Dana's team help DEFINE the labeled sample? (If the customer co-owns the golden set, the pilot cannot end in "that's not what we meant.")
5. Read the whole doc top to bottom as Dana. Mark any line she would frown at; fix or flag it.`,
      },
    ],
    practice: [
      {
        title: 'The adversarial review',
        minutes: 20,
        body: `Swap hats: you are now Harbor & Vane's skeptical IT director (the one still paying for OCR licenses), reviewing this requirements doc line by line in front of your boss. Write the seven hardest review comments you can — attack untestable lines, unverified assumptions, security silence, and anything that smells like the last pilot. Then, back in the FDE hat, resolve every comment: edit the doc or add a logged response.

Constraints: at least two comments must attack real weaknesses you left in (there are always some); at least one must be about data access/PII (transcript says claims contain client details — where does your doc handle Day 159's questions?); at least one must be unfair — and your response must de-escalate it with evidence rather than winning the argument.

Hints: strong IT-director openers — "what happens to our data, exactly, hop by hop?", "the last vendor also promised 95%", "who pays when the extraction is wrong?"`,
      },
    ],
    project: {
      title: 'The requirements doc + reusable template',
      brief: `Finalize and commit two artifacts: (1) \`docs/requirements_harbor_vane.md\` — the complete eight-section document from guided work, revised through the adversarial review, with every FR traceable and every AC executable; (2) \`docs/templates/requirements_template.md\` — the blank eight-section template with your own one-line quality checks per section (e.g. under Acceptance Criteria: "could a third party run this as an exam?"). The template is a permanent tool: Day 168's simulation and Day 174's full-cycle sim both start from it, and it belongs in your portfolio next to the code.`,
      rubric: [
        'Problem statement quantified from transcript evidence, zero solution words',
        'Six or more FRs, MoSCoW-tagged, every one traceable to a transcript line or logged assumption',
        'Five or more NFRs, each with a number AND a measurement method',
        'Assumptions log has ≥6 rows with owner, verification method, and date',
        'v0 provably touches the economic buyer\'s metric; every deferral has a written reason',
        'All seven adversarial comments resolved in-document',
      ],
    },
    mistakes: [
      'Writing solutions as requirements. "Use RAG with a vector DB" is your design; "answers must cite the specific policy clause" is their requirement. Mechanisms leak, behaviors bind.',
      'Untestable NFRs: "fast, secure, user-friendly, scalable." Each needs a number and a measurement method or it is decoration that a dispute will ignore.',
      'Burying assumptions inside confident sentences. "ClaimCore\'s API will receive the data" — nobody verified ClaimCore HAS an API. Unlogged assumptions become week-4 crises.',
      'Scoping v0 by ease instead of by the buyer\'s metric. A pilot that is easy to build but doesn\'t move cycle-time gives Marcus nothing to fund v1 with.',
      'Writing acceptance criteria the customer didn\'t co-own. If Dana\'s team doesn\'t help define the labeled sample, "95% accurate" will be relitigated at pilot end.',
      'Polishing the doc in isolation for a week. It is a conversation artifact — ship the draft fast, let the customer\'s corrections improve it while corrections are still free.',
    ],
    quiz: [
      {
        q: 'Which is a correctly written non-functional requirement?',
        o: [
          '"The system must be highly accurate"',
          '"The system must use a state-of-the-art LLM"',
          '"Field-level extraction accuracy ≥95% on a customer-labeled sample of 50 claims, measured per release by the eval harness"',
          '"The system should feel fast to users"',
        ],
        x: 2,
        w: 'Number + measurement method + data source. The others are untestable vibes or design leaking into requirements.',
        revisit: 164,
      },
      {
        q: '"ClaimCore will accept our extracted data" appears in your doc as a plain statement. What should it be instead?',
        o: [
          'A functional requirement',
          'A logged assumption with an owner, a verification action ("confirm import path with IT"), a date, and a risk-if-wrong',
          'A non-goal',
          'Deleted — too risky to mention',
        ],
        x: 1,
        w: 'Nobody in the transcript verified this. Confident-sounding guesses are how week-4 crises are manufactured; the assumptions log exists to give every guess a deadline.',
        revisit: 164,
      },
      {
        q: 'Why should v0 exclude ClaimCore write-back even though it is the most automation-valuable feature?',
        o: [
          'Write-back is technically impossible',
          'The $40K-error history demands a human-in-the-loop trust phase, IT approval is a constraint, and v0 must prove accuracy before earning write access — deferral with reasons, not rejection',
          'Pilots never write to production systems anywhere',
          'It would make the demo too long',
        ],
        x: 1,
        w: 'Scope ladders encode risk sequencing: prove extraction on a review screen, build IT trust, then earn the write path in v1. The written reason is what makes the deferral sellable.',
        revisit: 164,
      },
    ],
    resources: [
      { label: 'Google Technical Writing Courses — clarity for requirement prose', url: 'https://developers.google.com/tech-writing', type: 'course', time: '30 min' },
      { label: 'arc42 — sections 1–3: goals, constraints, context', url: 'https://arc42.org/overview', type: 'docs', time: '15 min' },
      { label: 'The Mom Test — turning conversations into commitments', url: 'https://www.momtestbook.com/', type: 'book', time: '15 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: due cards incl. Day 163 rules & slots', minutes: 10 },
      { activity: 'ELI5 + tech read; write the eight sections from memory', minutes: 15 },
      { activity: 'Guided: build the Harbor & Vane doc, all eight sections', minutes: 45 },
      { activity: 'Practice: adversarial IT-director review + resolutions', minutes: 20 },
      { activity: 'Project: finalize doc + extract the reusable template', minutes: 15 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'Complete eight-section doc committed with full traceability',
      'Assumptions log has ≥6 owned, dated rows',
      'Adversarial review run with all comments resolved',
      'Reusable template extracted; quiz ≥ 2/3',
    ],
    connections: {
      back: 'The acceptance criteria are Day 134\'s exam-before-the-student principle in contract form, the doc structure extends Day 48\'s requirements-first discipline, and every quantity traces to Day 163\'s transcript evidence.',
      forward: 'Tomorrow this doc gets priced and argued for in a proposal (Day 165). Day 166 prototypes only what the v0 scope permits, Day 168 repeats the transcript→doc conversion under simulation, and Day 173 turns the same numbers into ROI.',
    },
    flashcards: [
      { f: 'The eight sections of the requirements doc?', b: 'Problem, goals/non-goals, FRs, NFRs, constraints, assumptions log, scope ladder (v0/v1/later), acceptance criteria.' },
      { f: 'Requirement vs design leak?', b: 'Requirement = observable behavior ("cites the policy clause"); design leak = mechanism ("uses a vector DB").' },
      { f: 'Anatomy of a logged assumption?', b: 'The guess + owner + verification action + date + risk-if-wrong.' },
      { f: 'The v0 scoping test?', b: 'Does it move the metric the ECONOMIC BUYER watches, within the pilot window?' },
      { f: 'What makes acceptance criteria dispute-proof?', b: 'Third-party-runnable as an exam + the customer co-owns the labeled sample.' },
      { f: 'Why ship the requirements draft fast?', b: 'It is a conversation artifact — customer corrections are free early and expensive late.' },
    ],
    deepDive: [
      { label: 'MoSCoW under pressure', note: 'The tags only bite when the customer pushes a "could" into "must." Rehearse the response: "yes — which current must moves out to make room?" Scope is a conservation law; Day 171 trains the conversation.' },
    ],
  },
  {
    id: 'd165', day: 165, week: 24, phase: 9, kind: 'lesson',
    title: 'Proposals & Architecture Docs',
    analogy: 'Drawing the blueprint together',
    objectives: [
      'Structure a technical proposal: problem, approach, plan, team, risks, investment',
      'Write C4-lite architecture views — context, container, component — for mixed audiences',
      'Estimate with ranges and confidence levels instead of fake-precise point numbers',
      'Build a risk register with likelihood, impact, and named mitigations',
      'Produce a complete proposal for your capstone as if selling it to Harbor & Vane',
    ],
    prereqs: [
      { day: 164, label: 'Requirements — the Harbor & Vane doc' },
      { day: 160, label: 'AI system design — architecture reasoning' },
      { day: 161, label: 'Production evidence — cost & latency reports' },
    ],
    eli5: `When a family approves a renovation, the architect doesn't hand over structural calculations — but doesn't hand over only a watercolor either. The winning packet zooms: a street-view sketch anyone's grandmother can read (here's your house, here's the new kitchen), a floor plan the family debates doors on, and framing drawings the builder prices from. Same building, three altitudes, one story. Alongside it: what this fixes, what it costs as a RANGE with a reason ("18–24k; the range narrows once we open the wall — old houses surprise"), what could go wrong and what we'll do about it, and what happens next if you say yes.

A technical proposal is that packet. The C4 model gives you the zoom discipline for the drawings: **context** (your system as one box among the customer's systems — the executive slide), **container** (the deployable pieces and how data flows — the IT-review slide), **component** (inside the interesting container — the engineer slide). The prose around it answers the only four questions any buyer has: do you understand my problem? Will your approach work? What does it cost and how long? What could go wrong? Answer those plainly and the proposal sells itself; decorate instead, and even a good plan reads like a brochure.`,
    why: `Proposals are where FDE work converts to revenue and where engineering credibility is spent or earned. Two audiences read them with opposite needs — Marcus skims for value, risk, and price; the IT director reads the container diagram hunting for the data-leaves-our-network arrow — and one document must survive both. Estimation with ranges is a trust technology: point estimates are lies with confidence, and customers have been lied to before. This exact deliverable appears in FDE interview loops ("write a one-page proposal for the case from the last round") and Day 168 grades you on it tomorrow-adjacent; Day 174 adds objections.`,
    tech: `### The proposal skeleton (and the reason for each bone)

1. **Executive summary** — five sentences: problem in their words, quantified cost of it, proposed pilot, headline number range, the ask. Written LAST, placed first; most readers who matter read only this.
2. **Problem** — compressed from the Day 164 doc, evidence-forward. Its job is recognition: "yes, that's us."
3. **Proposed approach** — what you will build (v0 scope verbatim from requirements — the proposal must not silently widen it), how it works at the three C4 altitudes, and what you are explicitly NOT doing (non-goals travel with the price).
4. **Plan** — weeks, milestones, and the customer's obligations (data access by week 1, labeled sample by week 2, IT review slot by week 3 — their misses move dates, and writing that down NOW is what saves the relationship in week 4).
5. **Success criteria** — the acceptance criteria, verbatim. The proposal PROMISES what the requirements doc DEFINED; if they drift apart, one of them is lying.
6. **Risks** — a register, honestly populated: risk / likelihood (L/M/H) / impact / mitigation / owner. Include the awkward ones (scanned-PDF quality — the OCR ghost; ClaimCore import path unverified). A proposal with no real risks reads as either naive or dishonest, and the IT director knows which.
7. **Investment & timeline** — ranges with drivers: "6 weeks, 1 FDE + 0.25 solutions architect; pilot fee X–Y; the range narrows after the week-1 data sample." Anchor infra/API costs with your Day 156 arithmetic — real numbers from a real system are your unfair advantage.
8. **Next steps** — one concrete, small, dated ask. Proposals die of vague endings.

### C4-lite, practically

**Context**: one box for your system, boxes for AS400, ClaimCore, the claims inbox, and the model provider, arrows labeled with WHAT flows (claims PDFs, policy records, extracted fields — and a lock icon narrative: what leaves their boundary, Day 159). **Container**: ingestion worker, extraction service, review UI, eval/audit store, each with technology and the trust boundary drawn. **Component**: only for the extraction service — the interesting one — showing the schema-constrained extraction, validators, exclusion-flagger, and confidence router from Day 160's invoice design. Every diagram earns its place by answering a named reader's question; a diagram nobody asked a question of is decoration.

### Estimation with ranges

Decompose into parts, estimate each with a confidence tag, and let the range reflect the widest unknown — then name the unknown ("the range halves once we sample 100 real PDFs"). This converts estimation from a guess into a plan for narrowing, which is what a buyer is actually paying for in week 1.`,
    viz: 'c4-zoom',
    guided: [
      {
        title: 'Draw the three C4 altitudes for the Harbor & Vane pilot',
        minutes: 20,
        body: `Work in \`docs/proposal_harbor_vane.md\` (diagrams as fenced text blocks or mermaid if your renderer supports it).

1. **Context diagram.** Boxes: Claims Intake Copilot (yours); claims inbox (email); AS400 (policy system, read-only); ClaimCore (v0: humans type into it — draw THAT arrow from the review UI through Priya, not from your system); model provider (external, with the data-boundary annotation: "PDF text, PII-redacted per DPA, retention N days"). Label every arrow with the data that flows, not just "API".
2. **Container diagram.** Inside the copilot boundary: intake watcher → parsing/extraction service → review UI → audit & eval store; plus the golden-set harness as a first-class container (you sell WITH your eval — Day 160's lesson made commercial). Draw the trust boundary line where the customer's network ends.
3. **Component diagram** for the extraction service only: schema-constrained extractor (Day 110), field validators, policy cross-checker (AS400 read), exclusion flagger, confidence router (low-confidence → human-first ordering in the review UI).
4. The altitude test, per diagram: write the ONE question its reader is asking. Context/Marcus: "what touches what, and does our data leave?" Container/IT: "what runs where, and where is the boundary?" Component/their tech lead: "is the interesting part real engineering or magic?" If a diagram answers a question nobody is asking, delete it.`,
      },
      {
        title: 'Write the prose: risks, estimates, and the executive summary',
        minutes: 25,
        body: `1. **Risk register.** Minimum six rows. Must include: scanned-PDF quality (the OCR ghost — mitigation: week-1 sample of 100 real claims, accuracy floor re-negotiated on evidence); ClaimCore import path unverified (mitigation: v0 doesn't need it — human types from review screen; verify for v1); exclusion-flagging false negatives (the $40K scenario — mitigation: flag-recall prioritized over precision + human review mandatory); adoption risk (mitigation: Priya's team co-designs the review UI in week 2); model-provider data terms vs their compliance (mitigation: DPA + Day 159 questionnaire attached); pilot-window slip from customer dependencies (mitigation: the obligations table with dates).
2. **Estimates.** Build the table: extraction pipeline 2–3 wks (medium confidence — format variance is the driver); review UI 1–1.5 wks (high); AS400 read integration 0.5–2 wks (LOW — vintage system, unknown access path; name it as the range-widener); eval harness + labeled sample 1 wk (high — you have done this, cite Day 140). Then the API-cost line from real arithmetic: 50 claims/day × ~30 pages × tokens/page at mid-tier rates — show the multiplication, give a monthly range.
3. **Plan & obligations.** Six weekly milestones, each with a customer obligation and a demo checkpoint (never go dark — Day 167 foreshadow: weekly 15-minute demos beat one big reveal).
4. **Executive summary**, written now that everything else exists: five sentences, numbers included, ending with the dated ask ("30 minutes with you and IT on Thursday to confirm data access").`,
      },
    ],
    practice: [
      {
        title: 'The two-reader gauntlet',
        minutes: 15,
        body: `Print (or split-screen) your proposal and read it twice, in character.

Pass 1 — Marcus (VP Ops, 4 minutes, phone in hand): he reads the exec summary, skims headings, looks at ONE diagram, jumps to price. Mark every sentence he'd skip and every place he'd stall confused. Does the exec summary alone give him: cost of the problem, shape of the fix, price range, risk posture, next step?

Pass 2 — the IT director (30 minutes, red pen, OCR grudge): he reads the container diagram first, then risks, then hunts for what you DIDN'T say. Write the three questions he asks that the doc fails to answer, then fix the doc.

Deliverable: a changelog of ≥6 edits made because of the two passes, tagged by which reader forced each. If either pass produced zero edits, you weren't in character.`,
      },
    ],
    project: {
      title: 'The capstone proposal — sold to Harbor & Vane',
      brief: `Complete \`docs/proposal_harbor_vane.md\` as the full packet: exec summary, problem, approach with all three C4 diagrams, six-week plan with customer obligations, success criteria imported verbatim from the Day 164 requirements doc, ≥6-row risk register, ranged estimates with named drivers and real API-cost arithmetic from Day 156, and a dated next-step ask. Also extract \`docs/templates/proposal_template.md\` with your per-section quality checks. This proposal is graded again inside Day 168's simulation and defended against objections on Day 174 — write it as the version of record.`,
      rubric: [
        'Exec summary ≤5 sentences, contains the price range and a dated ask, readable standalone',
        'Three C4 altitudes present; every arrow labeled with the data that flows; trust boundary drawn',
        'Success criteria match the requirements doc verbatim — zero silent scope drift',
        'Risk register ≥6 rows including the OCR-history and data-boundary risks, each with a named mitigation',
        'All estimates are ranges with confidence tags and a named range-narrowing action',
        'Two-reader gauntlet changelog committed with ≥6 tagged edits',
      ],
    },
    mistakes: [
      'One diagram for all audiences. The executive drowns in the component view; the engineer distrusts the context cartoon. Zoom levels exist because readers do.',
      'Point estimates ("the pilot costs $32,400 and takes 41 days"). False precision reads as either naivety or salesmanship; ranges with named drivers read as competence.',
      'An empty or cosmetic risk register. The IT director KNOWS the risks — an honest register with mitigations is how you take his objections before he raises them.',
      'Silently widening scope between requirements and proposal to sweeten the deal. The two documents must promise the same v0, or the pilot ends in a dispute you engineered.',
      'No customer obligations in the plan. When THEIR data access slips two weeks, an obligations-free plan makes it your slip; the table with dates keeps the schedule honest.',
      'Vague endings ("we look forward to partnering!"). Proposals convert on one small dated ask; without it, even an impressed buyer has nothing to say yes to.',
    ],
    quiz: [
      {
        q: 'The IT director should be handed which view first, and why?',
        o: [
          'The component diagram — it has the most detail',
          'The container diagram — it shows what runs where, the trust boundary, and which arrows cross the network edge',
          'The context diagram — it is the simplest',
          'The risk register only',
        ],
        x: 1,
        w: 'IT\'s question is deployment- and boundary-shaped: what runs where, what data crosses which line. Context is for execs; component is for the tech lead who implements against you.',
        revisit: 165,
      },
      {
        q: 'Which estimate line is written correctly?',
        o: [
          '"AS400 integration: 8 days"',
          '"AS400 integration: 0.5–2 weeks, low confidence — access path unknown; range narrows after the week-1 IT session"',
          '"AS400 integration: TBD"',
          '"AS400 integration: fast, assuming no surprises"',
        ],
        x: 1,
        w: 'Range + confidence + the named unknown + the action that narrows it. The point estimate is fake precision; TBD is abdication; "assuming no surprises" hides the assumption instead of logging it.',
        revisit: 165,
      },
      {
        q: 'Your proposal\'s success criteria say "≥90% accuracy" but the requirements doc says "≥95%". What is the correct reading of this situation?',
        o: [
          'Fine — proposals are marketing documents',
          'One of the two documents is now lying; they must promise identical criteria or the pilot\'s end becomes a dispute about which number was "real"',
          'Use whichever the customer remembers',
          'Average them to 92.5%',
        ],
        x: 1,
        w: 'The requirements doc defines, the proposal promises — verbatim. Drift between them is how "successful" pilots end in renegotiation instead of renewal.',
        revisit: 164,
      },
    ],
    resources: [
      { label: 'C4 Model — context/container/component definitions', url: 'https://c4model.com/', type: 'docs', time: '25 min' },
      { label: 'arc42 — solution strategy & risks sections', url: 'https://arc42.org/overview', type: 'docs', time: '20 min' },
      { label: 'Google Technical Writing — audience-first documents', url: 'https://developers.google.com/tech-writing', type: 'course', time: '20 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: due cards incl. Day 164 sections & ACs', minutes: 10 },
      { activity: 'ELI5 + tech read; write the 8-bone skeleton from memory', minutes: 15 },
      { activity: 'Guided: three C4 diagrams + risks, estimates, exec summary', minutes: 45 },
      { activity: 'Practice: the two-reader gauntlet', minutes: 15 },
      { activity: 'Project: finalize the proposal + extract the template', minutes: 15 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'All three C4 diagrams drawn with labeled arrows and trust boundary',
      'Risk register ≥6 honest rows; estimates all ranged with drivers',
      'Gauntlet changelog shows ≥6 reader-forced edits',
      'Proposal + template committed; quiz ≥ 2/3',
    ],
    connections: {
      back: 'The approach section is Day 160\'s design skill made customer-facing; the success criteria import Day 164\'s acceptance criteria verbatim; the cost arithmetic reuses Day 156\'s ledger; the data-boundary annotations are Day 159 drawn as arrows.',
      forward: 'Day 166 builds the prototype this proposal scoped; Day 167 demos it with the narrative this proposal seeded; Day 168 grades a fresh proposal under simulation; Day 173 deepens the investment section into full ROI analysis.',
    },
    flashcards: [
      { f: 'The proposal skeleton?', b: 'Exec summary, problem, approach (C4 ×3), plan + customer obligations, success criteria (verbatim from requirements), risk register, ranged investment, dated next step.' },
      { f: 'C4-lite altitudes and their readers?', b: 'Context → executive ("what touches what"); container → IT ("what runs where, boundary"); component → tech lead ("is the core real").' },
      { f: 'A well-formed estimate?', b: 'Range + confidence tag + named driver of the range + the action that narrows it.' },
      { f: 'Why populate the risk register with the awkward truths?', b: 'The reviewer already knows them; naming risks with mitigations takes his objections before he raises them.' },
      { f: 'The requirements↔proposal invariant?', b: 'Identical success criteria, verbatim. Drift = an engineered end-of-pilot dispute.' },
      { f: 'What do proposals convert on?', b: 'One small, concrete, dated ask. Vague endings kill impressed buyers\' momentum.' },
    ],
    deepDive: [
      { label: 'arc42 as the long-form companion', url: 'https://arc42.org/overview', note: 'When a pilot graduates to production, the proposal grows into an arc42-shaped architecture doc — same bones, more load-bearing. Your Day 178 capstone architecture doc will borrow its section list.' },
    ],
  },
  {
    id: 'd166', day: 166, week: 24, phase: 9, kind: 'lesson',
    title: 'Rapid Prototyping',
    analogy: 'The movie trailer, not the movie',
    objectives: [
      'Scope a prototype to the one moment that must convince, cutting everything else',
      'Use wizard-of-oz techniques and honest hardcoding without ever deceiving the customer',
      'Distinguish prototype code from production code and say out loud which is which',
      'Climb the prototype→production ladder deliberately, knowing what each rung adds',
      'Build a working demo against a customer brief inside a hard time limit',
    ],
    prereqs: [
      { day: 164, label: 'Requirements — the v0 scope ladder' },
      { day: 110, label: 'Structured outputs — fast extraction backbones' },
      { day: 41, label: 'FastAPI — quick services' },
    ],
    eli5: `A movie trailer is two minutes cut from a two-hour film — except it usually isn't: trailers are often assembled before the film is finished, from the best scenes, sometimes with placeholder music and shots that won't survive the final cut. Nobody calls this fraud, because everyone knows what a trailer IS: a promise of the experience, built to answer one question — "do you want to see this movie?" The sin would be a trailer for scenes that could never be filmed.

An FDE prototype is a trailer. Its job is to answer one question — usually "can the machine really read OUR documents?" or "would this fit OUR workflow?" — in days, not months. So you cut like a trailer editor: the login page is a hardcoded user, the database is a JSON file, six claim types become one, and the "integration with ClaimCore" is a screen that SHOWS what would be written, not a write. The one thing you never fake is the thing being tested: if the question is "can it extract from your PDFs," the extraction must be real, on their real documents. Wizard-of-oz (a human behind the curtain) and hardcoding are honorable tools with one iron rule: the customer always knows which parts are movie and which are trailer.`,
    why: `Speed is the FDE's credibility currency: showing a working slice against the customer's own data within days of discovery changes the conversation from "vendor pitching" to "partner building." But uncontrolled speed creates the twin failure modes that kill engagements: the deceptive demo (faked capability discovered later — trust never recovers) and the eternal prototype (the demo hack quietly becomes production and pages you at 3am — Week 23 taught you what production actually requires). FDE interviews test this directly with timed build exercises; Day 168's simulation includes your demo plan, and Day 174 gives you another timed brief under pressure.`,
    tech: `### Scope ruthlessness: find the one question

Every prototype exists to retire one specific risk — technical ("can the model handle their scanned PDFs?") or adoption-shaped ("will the quote desk actually consult this screen?"). Write that question down first; everything that doesn't serve it is cut. The cutting checklist: auth → hardcode one user; persistence → a JSON file or SQLite; six document types → the one you have samples of; error handling → a friendly failure banner; integrations → read real data if cheap, SHOW would-be writes; UI → a plain Streamlit/FastAPI page, because customers forgive ugly and never forgive fake.

### The honest-faking toolbox

**Wizard-of-oz**: a human plays a component that doesn't exist yet — classic for testing workflow fit before building automation. **Hardcoding**: canned lookups for peripheral data (the customer record, the exchange rate). **Synthetic-but-realistic data**: when their real data hasn't cleared security review yet (Day 159), generate look-alike documents and SAY so. The disclosure rule is absolute and practical: label it in the demo ("this part is simulated; the extraction you're watching is real"), because the moment a customer discovers an undisclosed fake, every real capability becomes suspect too. Honest labels do the opposite — they focus attention on the real thing you proved.

### The ladder

Rung 0 — notebook spike: does the core trick work at all? Rung 1 — demo-able prototype: a URL a customer can watch you drive; hardcoded edges, real core. Rung 2 — pilot: real users, real data, the Day 164 acceptance criteria measured, but bounded (one team, business hours, human-in-the-loop). Rung 3 — production: Week 23's full kit — monitoring, fallbacks, security review, runbook. Each rung has an entry decision, and the ladder's point is that climbing is DELIBERATE: the prototype's code may be entirely rewritten at rung 2, and saying so in the proposal (Day 165's plan section) is what stops the demo hack from becoming load-bearing. During any demo, capture feedback in the moment — what made them lean in, what they corrected, what they asked for next — because a prototype is a discovery instrument (Day 163) wearing a UI.`,
    viz: null,
    guided: [
      {
        title: 'The scope-cut drill: from proposal to 45-minute plan',
        minutes: 15,
        body: `Take the Harbor & Vane v0 scope from Day 164 (extraction + review screen + exclusion flags). You have 45 minutes of build time and one goal: make Dana lean forward.

1. Write the one question this prototype must answer. (Strong answer: "can it really pull the eight fields + exclusion flags from OUR kind of claim documents?" — the OCR pilot failed exactly here, so this is where disbelief lives.)
2. Apply the cutting checklist to every FR: what is real, hardcoded, wizard-of-oz, or absent? Produce a two-column table: IN (real) / FAKED-OR-CUT (with the honest label you'll say aloud).
3. Sanity-check the IN column: it should be roughly — one sample claim PDF (public/synthetic since you have no real ones — say so), schema-constrained extraction (Day 110 code you already own), a one-page review screen showing fields + confidence + a flagged exclusion, and a visible "would write to ClaimCore" panel that writes nothing.
4. Time-box the IN column: minutes per piece, summing to ≤40 with 5 spare. If it doesn't fit, cut again — the discipline is that the timer wins, not the feature list.`,
      },
      {
        title: 'Build the skeleton you will reuse forever',
        minutes: 20,
        body: `Every timed build starts faster from a skeleton. Assemble yours now from code you already own, into \`proto_kit/\`:

1. \`extract.py\` — your Day 110 schema-constrained extraction function, trimmed to take (pdf_text, schema) and return validated fields + confidences.
2. \`app.py\` — the starter below: a single-file review screen (FastAPI + inline HTML — swap for Streamlit if you prefer) that renders extracted fields, confidence colors, and an honest SIMULATED banner over the fake parts.
3. \`fake.py\` — canned lookups: one customer record, one policy record, clearly named FAKE_POLICY.
4. Run it end-to-end once on any PDF text. Commit. In every future timed exercise (today's project, Day 174), you start from this kit — assembling proven parts IS the 48-hour-prototype method.`,
        code: `from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from extract import extract_fields          # your Day 110 function
from fake import FAKE_POLICY                # labeled canned data

app = FastAPI()
SAMPLE = open("sample_claim.txt").read()    # pasted PDF text for the demo

@app.get("/", response_class=HTMLResponse)
def review():
    fields = extract_fields(SAMPLE)         # the REAL part
    rows = ""
    for name, f in fields.items():
        color = "#c8e6c9" if f.confidence > 0.9 else "#fff9c4"
        rows += (f"<tr style='background:{color}'><td>{name}</td>"
                 f"<td>{f.value}</td><td>{f.confidence:.0%}</td></tr>")
    return f"""
    <h2>Claims Intake Copilot — Prototype</h2>
    <p style='background:#ffe0b2;padding:6px'>Policy lookup below is
       SIMULATED (canned record). Extraction above is live.</p>
    <table border=1 cellpadding=6>{rows}</table>
    <h3>Policy check (simulated): {FAKE_POLICY["number"]}</h3>
    <p><b>Exclusion flag:</b> water-damage endorsement E-114 may
       apply — review section 4.2</p>
    <button disabled>Write to ClaimCore (v1 — not in prototype)</button>
    """`,
      },
    ],
    practice: [
      {
        title: 'Ladder audit: what would this cost to make real?',
        minutes: 15,
        body: `Take the prototype plan from guided work and write the rung-by-rung upgrade bill. For each of five components (intake, extraction, policy lookup, review UI, audit trail): what does rung 2 (pilot) demand that rung 1 lacks, and what does rung 3 (production) add on top? Use Week 23's vocabulary — where do evals, monitoring, fallbacks, secrets handling, and the security questionnaire attach?

Constraints: output is a table, ≤1 line per cell; mark the two components whose prototype code you would fully REWRITE rather than harden (and why — hint: anything wizard-of-oz, and anything whose error handling is a banner).

The point: you can now answer the customer question "so how far is this from production?" with a bill instead of a shrug.`,
      },
    ],
    project: {
      title: 'The timed build: 45-minute hard stop',
      brief: `Fresh mini-brief, timer on. **Brightgate Property Management** (fictional) manages 3,000 rental units; maintenance requests arrive as free-text emails; the dispatcher triages them by hand into urgency (emergency/urgent/routine), trade (plumbing/electrical/HVAC/general), and building. Discovery said the one question is: "can it triage OUR messy emails reliably enough to trust?" Build the trailer: paste 8 realistic maintenance emails you write yourself (make three ambiguous), run real schema-constrained classification with confidence, render a dispatcher screen (color-coded urgency, sorted queue), label anything faked. Hard stop at 45 minutes — commit whatever exists, then spend 5 minutes writing honest notes: what worked, what you cut live, what you would say while demoing the rough edges.`,
      rubric: [
        'Working end-to-end at the 45-minute mark (committed as-is, no post-timer polishing)',
        'Classification is real (model-backed, schema-validated), not canned',
        'At least one ambiguous email visibly handled (low confidence surfaced, not hidden)',
        'Every faked element carries an on-screen honest label',
        'Post-timer notes name what was cut live and the demo talking points for rough edges',
        'proto_kit skeleton was the starting point (visible in the commit history)',
      ],
    },
    mistakes: [
      'Faking the one thing being tested. Hardcode the login, the lookup, the styling — never the core capability the customer is there to judge; a canned "extraction" discovered later ends the engagement.',
      'Hiding the fakes instead of labeling them. Undisclosed simulation is a trust bomb; a cheerful "this panel is simulated, the extraction is live" is a trust builder.',
      'Polishing the UI while the core is unproven. Customers forgive ugly screens showing real capability; the reverse impresses no one who matters.',
      'Letting the prototype crawl into production. Rung 1 code has no evals, no monitoring, no security review — Week 23 is the bill; climbing the ladder must be a decision, not an accident.',
      'Building without a written one-question. A prototype that tries to answer five questions answers none convincingly and blows the timer.',
      'Demoing without capturing feedback. The prototype is a discovery instrument; the leaning-in moment and the "actually, we\'d need it to…" corrections are the deliverable.',
    ],
    quiz: [
      {
        q: 'The customer\'s doubt is "no tool has ever read our scanned adjuster reports." Which prototype corner may NOT be cut?',
        o: [
          'The login system',
          'The database',
          'Real extraction running on their kind of documents',
          'The production-grade error handling',
        ],
        x: 2,
        w: 'Cut everything except the thing being tested. The one question defines the one component that must be real; everything else is trailer.',
        revisit: 166,
      },
      {
        q: 'Wizard-of-oz prototyping is legitimate when…',
        o: [
          'The customer never finds out',
          'The human-behind-the-curtain is disclosed, and the technique tests something real (like workflow fit) that automation would later replace',
          'The demo is for executives only',
          'The contract is already signed',
        ],
        x: 1,
        w: 'The technique is honorable; the deception would be the sin. Disclosed wizard-of-oz cheaply tests adoption and workflow questions before you build the machine.',
        revisit: 166,
      },
      {
        q: '"How far is this demo from production?" The strongest FDE answer is…',
        o: [
          '"Very close — mostly styling work"',
          '"Impossible to say"',
          '"Here\'s the rung-by-rung bill: pilot needs real intake, an eval harness, and your labeled sample; production adds monitoring, fallbacks, and your security review — the lookup component gets rewritten, not hardened"',
          '"That depends on your budget"',
        ],
        x: 2,
        w: 'The ladder audit converts the question into an itemized, honest bill — which is simultaneously the truthful answer and the v1 sales conversation.',
        revisit: 166,
      },
    ],
    resources: [
      { label: 'Streamlit docs — get started (fastest prototype UI)', url: 'https://docs.streamlit.io/get-started', type: 'docs', time: '20 min' },
      { label: 'FastAPI docs — single-file apps', url: 'https://fastapi.tiangolo.com/', type: 'docs', time: '15 min' },
      { label: 'FDE Interview Guide (Exponent) — the timed build round', url: 'https://www.tryexponent.com/blog/forward-deployed-engineer-interview-the-definitive-2026-guide-fde', type: 'article', time: '15 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: due cards incl. Day 164 scope ladder', minutes: 10 },
      { activity: 'ELI5 + tech read; write the cutting checklist from memory', minutes: 10 },
      { activity: 'Guided: scope-cut drill + build the proto_kit skeleton', minutes: 35 },
      { activity: 'Practice: the ladder audit table', minutes: 15 },
      { activity: 'Project: 45-minute timed build + 5-minute honest notes', minutes: 50 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'proto_kit committed and runnable end-to-end',
      'Timed build committed at the hard stop with honest notes',
      'Ladder audit table names the two rewrite-not-harden components',
      'Quiz ≥ 2/3',
    ],
    connections: {
      back: 'The extraction backbone is Day 110\'s structured outputs; the v0 scope you cut from is Day 164\'s ladder; the production bill you quoted is all of Week 23 — which is why you can now quote it honestly.',
      forward: 'Tomorrow (Day 167) you wrap this prototype in a demo narrative. Day 168\'s simulation asks for a demo plan built on today\'s method, and Day 174\'s full-cycle sim runs another timed build with objections mid-flight.',
    },
    flashcards: [
      { f: 'The first artifact of any prototype?', b: 'The written one-question it must answer — everything not serving it gets cut.' },
      { f: 'The iron rule of honest faking?', b: 'The customer always knows which parts are simulated; never fake the thing being tested.' },
      { f: 'The prototype→production ladder?', b: 'Rung 0 spike → rung 1 demo-able prototype → rung 2 bounded pilot (evals, real users) → rung 3 production (Week 23 kit).' },
      { f: 'Customers forgive ___ and never forgive ___.', b: 'Ugly; fake.' },
      { f: 'Why capture feedback during the demo?', b: 'A prototype is a discovery instrument — lean-in moments and corrections are its real output.' },
    ],
    deepDive: [
      { label: 'The 48-hour prototype as assembly', note: 'Fast builders don\'t type faster — they own more proven parts. Audit your repos: extraction, RAG query, eval harness, review UI, resilient client. That inventory IS your prototyping speed; grow it deliberately.' },
    ],
  },
  {
    id: 'd167', day: 167, week: 24, phase: 9, kind: 'lesson',
    title: 'Demo Craft',
    analogy: 'The show must go on',
    objectives: [
      'Script a demo on the problem → magic → how → next arc, opening with the customer\'s pain',
      'Rehearse to a timing sheet, including the questions you hope nobody asks',
      'Recover from live failure gracefully using prepared fallbacks and honest narration',
      'Tailor the same demo to an executive room versus an engineering room',
      'Run demo-environment hygiene: seeded data, killed notifications, backup recording',
    ],
    prereqs: [
      { day: 166, label: 'Rapid prototyping — the thing being demoed' },
      { day: 161, label: 'Production cutover — the real system behind the story' },
      { day: 105, label: 'Explaining AI to non-technical stakeholders' },
    ],
    eli5: `Stage magicians obsess over an asymmetry: the audience remembers the thirty seconds of wonder, and forgets — if the show is built right — that everything around those seconds was engineered. The patter that frames the trick, the volunteer chosen on the aisle, the second deck in the left pocket for when the first is dropped: none of it is improvised. And when a trick genuinely dies on stage, the professional does not freeze; there is a line ready ("even the cards are nervous tonight"), a pivot, and the show continues. The audience judges composure more than perfection.

A product demo is stagecraft in service of truth. The arc is fixed: open with THEIR problem told back in their words (the room leans in when it hears itself), show the magic moment fast — their document, their jargon, the answer appearing — THEN explain how it works, then land on what happens next. Rehearsal is not optional and not once. The demo environment is a stage: seeded data you chose, notifications silenced, network fallbacks staged (a recording of the happy path is your second deck — disclosed as a recording if used). Live failure handled calmly — "good, that's the timeout fallback you'd see in production; here's the same flow from this morning" — often builds MORE trust than a flawless run, because everyone in that room has watched software fail.`,
    why: `Demos are decision points: pilots get funded, champions get armed, and skeptics get quieter — or none of that happens and momentum dies in a conference room. FDEs demo constantly (weekly checkpoint demos were baked into your Day 165 plan), and the interview loop nearly always includes one ("demo something you built" — your capstone, Day 180, is exactly this). The craft is disproportionately learnable: most technical demos fail on narrative order (how before magic), unrehearsed timing, and unmanaged environments — all fixable this afternoon, all instantly visible to a hiring panel.`,
    tech: `### The arc, engineered

**Problem** (60–90s): their numbers, their vocabulary, from discovery — "forty complex claims a week, two and a half hours each, and one $40K exclusion miss" — establishing that the demo exists inside THEIR story. **Magic** (2–4 min): the single most convincing moment, as early as possible, on data that looks like theirs. Show, don't narrate mechanism. One moment, fully landed, beats five features skimmed. **How** (2–3 min, calibrated to the room): now that they care, the architecture — for engineers, the container diagram and the eval harness; for executives, the boundary story ("your data stays here") and the human-in-the-loop control. **Next** (60s): the dated ask, same discipline as Day 165 — a pilot start date, a data-access confirmation, the Thursday meeting.

### Rehearsal discipline

Three passes minimum: a walkthrough for flow, a timed run against the sheet (every segment has a clock number and a cut-line — know NOW what you drop if the exec arrives ten minutes late), and a sabotage run where a partner (or you, cruelly) breaks something mid-flow — wifi off, wrong document, model timeout — and you practice the recovery lines. Prepare the **hostile-question sheet**: the five questions you hope nobody asks (yesterday's honest-notes rough edges are the source), each with a two-sentence truthful answer. Unrehearsed truth comes out defensive; rehearsed truth comes out confident.

### Failure choreography and hygiene

The fallback ladder for live demos: retry once silently → switch to the pre-staged backup environment → play the disclosed recording of this morning's run → whiteboard the flow and convert the slot into discovery. Each step is PREPARED. Narrate honestly at every rung ("that's the provider timing out — in production you'd see the degraded banner from our runbook") — Week 23 gave you real reliability language; using it during failure turns an embarrassment into evidence of operational maturity. Hygiene checklist, run twice (night before, 30 minutes before): seeded demo data that is realistic but PII-free (Day 159 — never demo on real customer records without written clearance); notifications, autoplay, and update popups killed; browser zoomed for the back row; hardcoded model params pinned (temperature, model version — a surprise model upgrade mid-demo is drift, Day 145, live on stage); the backup recording tested on the room's actual AV. After the room: the follow-up email within 24 hours — what they saw, what was simulated (honesty in writing), the answers you owed, and the dated next step.`,
    viz: null,
    guided: [
      {
        title: 'Script the capstone demo on the arc',
        minutes: 20,
        body: `Write \`docs/demo_script.md\` for a 10-minute demo of your capstone (audience: Harbor & Vane's Dana + Marcus + the IT director — a mixed room, the hardest kind).

1. **Problem segment** (write it word-for-word, 90s when spoken): open with three numbers from the Day 163 transcript. No product mention yet.
2. **Magic segment**: choose the ONE moment. (Strong choice: paste a realistic claim question, watch the grounded answer appear WITH the policy-clause citation — because the citation is what the $40K miss was missing.) Script your exact words while it streams — silence while software thinks is where demos die; narrate what the audience is seeing, not the mechanism.
3. **How segment, two versions**: (a) 90 seconds for Marcus — the boundary story, the human-in-the-loop, "every answer cites its source so Priya can verify in seconds"; (b) 2 minutes for the IT director — container diagram, where data flows, the eval harness pass rate, the fallback behavior. Mark in the script where you pivot depending on who leans in.
4. **Next segment**: the dated ask, verbatim from your Day 165 proposal.
5. Build the timing sheet: segment / clock / cut-line (what drops if you lose 5 minutes). Total must be 10:00 with 2 minutes of slack for interruptions — a demo with no interruption budget is a demo that runs over.`,
      },
      {
        title: 'The sabotage rehearsal',
        minutes: 20,
        body: `1. Run the demo once, timed, out loud, to an empty room (yes, out loud — silent read-throughs rehearse nothing). Record it (phone is fine). Note where you exceeded the sheet.
2. Sabotage run: before starting, roll a die for which failure you inject mid-magic-segment — (1–2) kill the network, (3–4) paste a document the system handles badly, (5–6) the model returns a wrong answer. Practice the recovery out loud: the honest narration line, the pivot to the fallback rung, the continuation. Script your three recovery lines afterward — they go in the demo script as a FAILURE PLAYS section.
3. Wrong-answer drill specifically (it is the AI-demo special): practice the line that builds trust instead of panic — "good catch, and this is why the pilot has a human review step and an eval harness; let me show you how we measure exactly this." Never argue with your own demo, never blame the model, never silently retry and pray.
4. Stage the fallback ladder for real: record this morning's happy path (screen recording, 90s), label it RECORDING in the corner, save it locally (not in the cloud — the wifi that killed the live demo also kills streaming).
5. Prepare the hostile-question sheet: five questions from yesterday's honest notes + the two IT-director questions your Day 165 gauntlet surfaced, each with a rehearsed two-sentence answer.`,
      },
    ],
    practice: [
      {
        title: 'Same demo, two rooms',
        minutes: 15,
        body: `Deliver the demo twice, out loud, timed, adapting live:

Round 1 — exec room (Marcus + CFO, 6 minutes hard cap, phones present): problem 60s, magic 2 min, how 90s (boundary + control story ONLY — no architecture), next 60s. What did you cut? Did the cut-lines on your timing sheet survive contact?

Round 2 — engineering room (their tech lead + two engineers, 12 minutes, interruptions encouraged — have the AI tutor play a skeptical engineer who interrupts twice with real questions): magic can be shorter; the how expands — show the eval pass rate, the trace of one request (Day 142), the fallback drill evidence (Day 161).

Afterward, write the delta list: every concrete difference between the two deliveries (segment lengths, vocabulary, which artifact you showed). If the two rounds were nearly identical, you tailored neither.`,
      },
    ],
    project: {
      title: 'The demo kit',
      brief: `Commit \`docs/demo_kit/\` containing: (1) the final demo script with timing sheet, cut-lines, pivot marks, and the FAILURE PLAYS section; (2) the hostile-question sheet (≥7 questions with rehearsed answers); (3) the hygiene checklist as a runnable pre-flight (every item checkable in 30 minutes); (4) the labeled backup recording of the happy path; (5) the follow-up email template — subject line, what-you-saw summary with simulated-parts disclosure, owed answers section, dated next step — plus the filled example addressed to the Harbor & Vane room. This kit is the one you carry into Day 168's simulation, Day 174, and the Day 180 Demo Day.`,
      rubric: [
        'Script follows problem → magic → how → next with word-for-word problem and magic narration',
        'Timing sheet totals 10:00 with explicit slack and a cut-line per segment',
        'Three failure plays scripted, including the wrong-answer drill; backup recording exists and is labeled',
        'Hostile-question sheet has ≥7 real questions with two-sentence rehearsed answers',
        'Both room-versions delivered out loud and timed; delta list committed',
        'Follow-up email example discloses simulated parts and ends with a dated ask',
      ],
    },
    mistakes: [
      'Opening with architecture. The room doesn\'t care how it works until they\'ve seen that it works on THEIR problem; how-before-magic is the #1 technical-demo killer.',
      'Demoing five features instead of landing one moment. Attention is a budget; the demo exists to make one memory.',
      'Rehearsing silently, or once. Timing, transitions, and recovery lines only exist if they\'ve been said out loud; the first out-loud run must not be in front of the customer.',
      'Treating a wrong AI answer as a catastrophe. Argue with your demo and you lose the room; narrate it into your review-step-and-evals story and you gain credibility.',
      'Live-demoing on real customer PII without written clearance, or with notifications on. One popped Slack message or leaked record can end more than the demo.',
      'No follow-up within 24 hours. The demo\'s decision energy decays fast; the email with owed answers and the dated ask is where the demo actually converts.',
    ],
    quiz: [
      {
        q: 'Why does the arc put the magic moment BEFORE the architecture explanation?',
        o: [
          'Architecture is unimportant',
          'Attention and belief are earned by seeing it work on their problem; explanation lands only after the room cares',
          'Executives cannot understand diagrams',
          'It makes the demo shorter',
        ],
        x: 1,
        w: 'How-before-magic asks the room to invest before showing why they should. Problem → magic earns the right to explain; then the how is heard instead of endured.',
        revisit: 167,
      },
      {
        q: 'Mid-demo, the assistant gives a confidently wrong answer. The strongest recovery is…',
        o: [
          'Silently re-run until it answers correctly',
          'Blame the model provider and move on',
          '"Good catch — this is exactly why the pilot keeps a human review step and an eval harness; here\'s how we measure and gate this failure mode"',
          'End the demo early',
        ],
        x: 2,
        w: 'The rehearsed honest pivot converts the failure into evidence of operational maturity — review steps, evals, gates — which is what enterprise buyers are actually evaluating.',
        revisit: 167,
      },
      {
        q: 'Which pre-demo hygiene failure is the most severe?',
        o: [
          'Browser not zoomed for the back row',
          'Demoing on real customer records containing PII without written clearance',
          'Forgetting to close email',
          'A timing sheet without cut-lines',
        ],
        x: 1,
        w: 'The others cost polish; unclearead PII on screen is a security/compliance incident (Day 159) that can end the engagement. Seeded, realistic, PII-free data is the rule.',
        revisit: 159,
      },
    ],
    resources: [
      { label: 'PreSales Collective — demo craft & discovery-to-demo flow', url: 'https://www.presalescollective.com/', type: 'article', time: '20 min' },
      { label: 'Google Technical Writing — clarity under time pressure', url: 'https://developers.google.com/tech-writing', type: 'course', time: '15 min' },
      { label: 'FDE Interview Guide (Exponent) — the demo/presentation round', url: 'https://www.tryexponent.com/blog/forward-deployed-engineer-interview-the-definitive-2026-guide-fde', type: 'article', time: '15 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: due cards incl. Day 166 ladder & labels', minutes: 10 },
      { activity: 'ELI5 + tech read; write the arc and fallback ladder from memory', minutes: 15 },
      { activity: 'Guided: script the demo + sabotage rehearsal', minutes: 40 },
      { activity: 'Practice: same demo, two rooms', minutes: 15 },
      { activity: 'Project: assemble the demo kit + follow-up email', minutes: 20 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'Demo delivered out loud ≥3 times including one sabotage run',
      'Backup recording made, labeled, stored locally',
      'demo_kit committed complete with hostile-question sheet and email template',
      'Quiz ≥ 2/3',
    ],
    connections: {
      back: 'The thing being demoed is Day 166\'s prototype backed by Day 161\'s real production evidence; the two-room tailoring extends Day 105\'s stakeholder translation; the failure narration uses Week 23\'s reliability vocabulary as a trust asset.',
      forward: 'Day 168\'s simulation requires a demo plan from this kit. Day 171 deepens the exec-vs-eng communication craft, Day 174 stress-tests the demo under objections, and Day 180\'s Demo Day is this skill, graduated.',
    },
    flashcards: [
      { f: 'The demo arc?', b: 'Problem (their numbers) → magic (one landed moment, early) → how (calibrated to the room) → next (dated ask).' },
      { f: 'The live-failure fallback ladder?', b: 'Silent retry once → staged backup environment → disclosed recording → whiteboard + convert to discovery.' },
      { f: 'The wrong-answer recovery line?', b: 'Honest pivot: "this is why the pilot has human review and an eval harness — here\'s how we measure exactly this."' },
      { f: 'Three rehearsal passes?', b: 'Flow walkthrough, timed run against the sheet, sabotage run with recovery lines out loud.' },
      { f: 'Demo data rule?', b: 'Seeded, realistic, PII-free; real customer records only with written clearance.' },
      { f: 'When does a demo actually convert?', b: 'In the ≤24h follow-up email: what they saw (fakes disclosed), owed answers, dated next step.' },
    ],
    deepDive: [
      { label: 'Watch one great keynote demo critically', note: 'Pick any famous product-launch demo and mark the arc segments with timestamps: where is the problem, when does magic land, how long before any mechanism is explained? The pattern is remarkably consistent across two decades.' },
    ],
  },
  {
    id: 'd168', day: 168, week: 24, phase: 9, kind: 'review',
    title: 'Week 24 Checkpoint: FDE Simulation I',
    analogy: 'The client room',
    objectives: [
      'Recall Week 24\'s toolkit: hats, Mom Test rules, requirements sections, proposal bones, demo arc',
      'Convert a fresh, unseen discovery transcript into a requirements doc under time pressure',
      'Produce a proposal with an architecture sketch and a demo plan for the same engagement',
      'Grade the full package against the four-dimension FDE rubric and extract targeted drills',
    ],
    prereqs: [
      { day: 163, label: 'Discovery & the Mom Test' },
      { day: 164, label: 'Requirements — the template' },
      { day: 165, label: 'Proposals & architecture docs' },
      { day: 167, label: 'Demo craft — the demo plan' },
    ],
    eli5: `Flight schools end each phase with a check ride: the examiner doesn't quiz you on aerodynamics — you fly, with the examiner in the right seat, through a route you have never seen, and the graded thing is the whole performance: planning, execution, judgment, communication. Skills that felt solid in isolation wobble the first time they run in sequence under a clock, and that wobble is precisely what the check ride exists to find while finding it is cheap.

Today is your first FDE check ride. You get a discovery transcript you have never seen — a real-feeling conversation with a freight company, full of pain, politics, red herrings, and numbers — and a timer. From it you produce the full deliverable chain of an engagement's opening week: the requirements doc, the proposal with an architecture sketch, and a demo plan. Then you become the examiner: grading your own package against the same four-dimension rubric (discovery, scoping, communication, feasibility) that FDE interviewers use. The review-day machinery runs underneath as always — the spaced-repetition warm-up and the closed-book recall of the week's frameworks are what make the templates available to you at speed, because in the client room, and in the interview that simulates it, you don't get to look things up.`,
    why: `This simulation IS the FDE interview, rehearsed: the case round at AI labs and applied-AI startups hands you exactly this — a transcript or a role-played customer, then asks for scoping, a proposal, and a plan, graded on precisely today's four dimensions. It is also the honest audit of Week 24: gaps that survive today's rubric would otherwise surface in a real interview or, worse, a real engagement. Day 174 re-runs the cycle harder (objections, mid-course scope change); today establishes your baseline score so that improvement is measurable, not felt.`,
    tech: `### How the simulation runs

Total 100 minutes. **Phase 0 — recall (15 min, closed book):** reconstruct the week's frameworks from memory before touching the transcript; the sim is worthless if you pattern-match against open notes. **Phase 1 — mine the transcript (20 min):** annotate like Day 163 — slots, stakeholders, quoted evidence, and the question-quality of the interviewer (this FDE makes mistakes; part of your grade is catching what they failed to ask). **Phase 2 — the deliverable sprint (55 min):** requirements doc (25) → proposal-lite with architecture sketch (20) → demo plan (10), using your Day 164/165/167 templates from memory-first, templates-second. **Phase 3 — grading (10 min):** rubric below, honestly.

### The FDE rubric (0–3 per dimension, 12 max)

**Discovery** — evidence discipline: every requirement traceable to transcript lines; unknowns logged as owned assumptions, not guessed; the un-asked questions identified. **Scoping** — a v0 that moves the economic buyer's metric inside the pilot window; deferrals with reasons; nothing faked as in-scope. **Communication** — the two-reader test: an exec could act on the summary, an engineer could challenge the architecture; numbers over adjectives; testable acceptance criteria. **Feasibility** — the architecture would actually work: correct integration realities, honest treatment of latency/cost/quality/privacy (Day 160's quadrilemma), risks that a practitioner would recognize as the real ones. Scoring guide per dimension: 0 = absent, 1 = attempted with major holes, 2 = solid with minor holes, 3 = a hiring panel would advance you on this dimension alone. 8+ is a pass; 10+ is strong.

### What examiners actually catch

The recurring failure patterns, so you can pre-empt them: requirements invented from plausibility rather than transcript evidence ("users want a dashboard" — nobody said that); v0 scoped to what is fun to build rather than what the buyer measures; solution words in the problem statement; acceptance criteria no third party could run; architecture ignoring a constraint the transcript stated plainly (residency, a legacy system, a security gate); and a demo plan that demos features instead of retiring the customer's specific disbelief. Read your own package for exactly these six before scoring.`,
    viz: null,
    guided: [
      {
        title: 'Phase 0 — closed-book recall of the week',
        minutes: 15,
        body: `Editor and notes closed. From memory, write:

1. The three hats and the engagement lifecycle with each stage's deliverable (Day 162).
2. The three Mom Test rules and the five extraction slots (Day 163).
3. The eight sections of the requirements doc; the anatomy of a logged assumption; the v0 test (Day 164).
4. The proposal skeleton; the three C4 altitudes and their readers; a well-formed estimate (Day 165).
5. The demo arc, the live-failure fallback ladder, and the cutting checklist / one-question rule (Days 166–167).

Open your notes; diff; convert every gap into a flashcard BEFORE starting the sim — today\'s wobbles are Day 174\'s drills.`,
      },
      {
        title: 'Phase 1 — the transcript (your working material)',
        minutes: 20,
        body: `This is the simulation transcript. Mine it per Day 163: mark slots, quote evidence, map stakeholders, and — new today — list what the interviewer FAILED to ask (there are at least three significant misses).

~~~text
Discovery call — Copperline Logistics. Present: Elena Marsh (COO,
economic buyer per the AE), Tomas Rieder (Quote Desk Lead),
Farid Haddad (Head of IT Security, joined late). FDE: you-know-who.

FDE: Elena, thanks for making time. Could you walk me through
  what happened the last time a quote request came in?
ELENA: Tomas lives that, so — Tomas?
TOMAS: Yesterday, typical one. A forwarder emails us: 40-foot
  container, machine parts, Rotterdam to Ho Chi Minh City, what's
  the rate and what paperwork does the shipper need. The rate part
  is fast — rate cards are in CargoWise, two minutes. The paperwork
  question is the time sink. Machine parts means HS-code questions,
  export-control screening, certificate-of-origin rules that
  changed in March... I keep a folder of PDFs — customs circulars,
  our own how-to docs, carrier bulletins. I searched it for maybe
  twenty-five minutes, then honestly I walked over and asked Ingrid,
  because she just knows.
FDE: How many requests like that per week, and who handles them?
TOMAS: The desk gets maybe 120 quote requests a week. Half are
  rate-only, quick. The other half have at least one compliance or
  documentation question. Me, Ingrid, and Stefan handle those —
  and Ingrid is the bottleneck, every hard one funnels to her.
FDE: What happens when the answer is wrong?
TOMAS: February. A shipment to Türkiye went out quoted with the
  wrong ATR certificate guidance — customer's goods sat in customs
  eleven days. We ate about €18K between the demurrage claim and
  the goodwill credit, and the customer moved half their volume
  to a competitor. That one was Stefan following a 2023 circular
  that had been superseded.
FDE: Ouch. What did you change after that?
TOMAS: Ingrid now reviews anything touching Türkiye, Egypt, or
  Brazil. Which makes her more of a bottleneck. She's also
  retiring in March, which nobody wants to talk about.
ELENA: Which is why you're here. Our quote turnaround is the
  number I own — we promise same-business-day and we're at 60%.
  Every point matters; two big RFPs this year asked for our
  documented turnaround stats.
FDE: Elena, if this worked, what would you look at in six months
  to call it a success?
ELENA: Same-day rate above 85%, and the compliance answers not
  getting worse when Ingrid goes. I'd take those numbers to the
  board.
FDE: Would an AI assistant that answers the desk's documentation
  questions from your circulars be valuable?
ELENA: If it's right, obviously. If it's wrong we're back in
  Türkiye. [laughs]
FARID: [joining] Sorry — context? ...Right. Before anything
  touches our documents: we're mid-audit for ISO 27001, our
  customers are EU shippers, and customer shipment data cannot
  leave the EU. The circulars folder also has carrier contracts
  mixed in — those are commercially confidential. Nothing goes
  to a US model provider without my sign-off, and honestly the
  answer is probably a European region or nothing.
FDE: Understood. Tomas, how current is the circulars folder?
TOMAS: [pause] Ingrid updates it when she notices something.
  The March origin-rule change took us three weeks to notice.
FDE: One more — who'd actually type questions into a tool like
  this? You three, or the whole desk?
TOMAS: The desk is eleven people. The eight juniors mostly do
  rate-only quotes. If the tool were good, juniors could take
  compliance questions too. That's the actual dream — Ingrid's
  knowledge not walking out the door in March.
~~~

Extraction targets: fill the five slots with quotes; map Elena / Tomas / Ingrid / Stefan / Farid / the eight juniors onto buyer-user-champion-blocker (careful: Ingrid is simultaneously the bottleneck, the quality bar, and a departure risk — what does that make her in your plan?). The interviewer's misses to find (minimum): never asked to SEE the folder (corpus size? formats? how much is contracts-vs-circulars?); never asked what "compliance question" volume looks like end-to-end (is 25 min typical or worst-case? no baseline distribution); never asked about CargoWise integration expectations or where the desk would want answers to appear; never validated the March deadline's hard constraints (what must be true BEFORE Ingrid leaves — capture her review judgments? by when?). Note also the one MT-BAD question and what it produced ("if it's right, obviously" — nothing).`,
      },
    ],
    practice: [
      {
        title: 'Objection preview (Day 174 foreshadow)',
        minutes: 10,
        body: `After the sprint, before grading: write the two hardest objections this room would raise to YOUR proposal, and answer each in ≤3 sentences.

Constraint: one must come from Farid (data boundary — your architecture had better already answer it; if your sketch sends carrier contracts to a US-region API, you have failed feasibility before he speaks) and one from Elena (likely: "how does this fix the Ingrid problem by March?" — does your v0 capture her review judgments as labeled data, or does her knowledge still walk out the door?).

Hints: strong answers cite your own artifacts — the residency choice in the container sketch, the review-queue-as-golden-set design where every Ingrid correction becomes eval data.`,
      },
    ],
    project: {
      title: 'The graded simulation package',
      brief: `Phase 2, timed — 55 minutes, templates allowed, transcript allowed, this week\'s finished examples NOT allowed. Produce in \`docs/sim1/\`: (1) \`requirements.md\` — all eight sections for Copperline; every FR traced to a transcript quote; assumptions log covering at least: corpus size/formats, contract-vs-circular split, CargoWise integration path, question-volume baseline, Ingrid\'s availability for labeling; v0 must move Elena\'s same-day metric AND start capturing Ingrid\'s judgment before March; (2) \`proposal.md\` — exec summary, approach with context + container sketches (the trust boundary and EU-residency choice drawn explicitly; freshness pipeline for the circulars — the three-week-stale March incident is your evidence), ranged estimates, ≥5-row risk register (superseded-circular risk gets a row: retrieval must prefer current documents — recency weighting, Day 116), dated ask; (3) \`demo_plan.md\` — the one question the demo must retire (credibly: "can it answer a real HS-code/certificate question CORRECTLY, with the current circular cited?"), the magic moment, what is honestly faked, the failure play. Then Phase 3: score all four rubric dimensions 0–3 with one written line of evidence per score, and list your two lowest dimensions with a named drill for each before Day 174.`,
      rubric: [
        'Requirements: every FR quote-traced; the five seeded assumptions all logged with owners and dates',
        'Scoping: v0 targets the 85% same-day metric and the pre-March knowledge capture; deferrals reasoned',
        'Proposal: EU-residency and contract-confidentiality visibly handled in the container sketch; recency/freshness risk in the register',
        'Demo plan: retires the correctness disbelief (citation to the CURRENT circular), fakes disclosed',
        'Package produced inside the 55-minute box (note your actual time)',
        'Self-scores carry evidence lines; two drills named for the lowest dimensions',
      ],
    },
    mistakes: [
      'Inventing requirements the transcript never supports ("juniors need a mobile app"). Traceability is the discovery dimension\'s whole grade; if you can\'t quote it, log it as an assumption or leave it out.',
      'Scoping v0 to the fun build (chat over all documents!) instead of the buyer\'s metric and the March clock. Elena funds same-day-rate and knowledge-capture; everything else is v1.',
      'Treating Farid as an obstacle instead of a requirement source. The EU-residency and contract-confidentiality lines are hard constraints; an architecture that ignores them scores feasibility zero regardless of elegance.',
      'Missing the freshness trap. The February incident WAS a stale-document failure; a RAG design without recency weighting and an update pipeline re-ships the €18K bug at scale.',
      'Missing the Ingrid design. Her retirement is the engagement\'s real deadline; a v0 whose review queue converts her corrections into labeled eval data solves knowledge-capture as a side effect — examiners specifically look for this move.',
      'Grading yourself gently. The rubric only produces improvement if the 1s are called 1s; interviewers will not round up, so today should not either.',
    ],
    quiz: [
      {
        q: 'The February €18K incident (superseded circular followed) translates into which non-negotiable architecture requirement?',
        o: [
          'A larger context window',
          'Retrieval must handle document currency: recency/supersession-aware ranking plus a monitored update pipeline for the corpus',
          'A faster model',
          'Fine-tuning on the circulars',
        ],
        x: 1,
        w: 'The failure was answering from a stale document — and the folder went three weeks without noticing a rule change. Freshness-aware retrieval and an ingestion pipeline with staleness monitoring are the direct fix; fine-tuning would bake staleness in (Day 127).',
        revisit: 164,
      },
      {
        q: 'Farid\'s statement — EU shippers, ISO audit, contracts mixed into the folder, "nothing to a US provider without sign-off" — should appear in your package as…',
        o: [
          'A risk to be mitigated by persuasion',
          'Hard constraints shaping the architecture (EU-region inference, contract-document segregation at ingest) and a named stakeholder gate in the plan',
          'A note in the appendix',
          'A reason to descope the project',
        ],
        x: 1,
        w: 'Blocker requirements are requirements. The container diagram must show the residency choice and the confidential-document filter, and the plan must schedule Farid\'s review — that is what feasibility means here.',
        revisit: 165,
      },
      {
        q: 'Ingrid retires in March. The strongest v0 response to this is…',
        o: [
          'Schedule the pilot after she leaves to reduce disruption',
          'Ask her to write documentation in her spare time',
          'Design the human-review queue so her corrections on real questions become labeled eval/training data now — knowledge capture as a byproduct of daily work',
          'Hire a replacement first',
        ],
        x: 2,
        w: 'The retirement is the true deadline. A review workflow that harvests her judgments turns the bottleneck into the golden set\'s author — the flywheel move (Day 143) examiners look for.',
        revisit: 168,
      },
    ],
    resources: [
      { label: 'FDE Interview Guide (Exponent) — the case round this simulates', url: 'https://www.tryexponent.com/blog/forward-deployed-engineer-interview-the-definitive-2026-guide-fde', type: 'article', time: '20 min' },
      { label: 'The Mom Test — re-skim rules before mining the transcript', url: 'https://www.momtestbook.com/', type: 'book', time: '10 min' },
      { label: 'C4 Model — sketch reference for the proposal', url: 'https://c4model.com/', type: 'docs', time: '10 min' },
      { label: 'arc42 — constraints section, for Farid\'s requirements', url: 'https://arc42.org/overview', type: 'docs', time: '10 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep: full due deck for Days 162–167', minutes: 10 },
      { activity: 'Phase 0: closed-book recall of the week\'s frameworks', minutes: 15 },
      { activity: 'Phase 1: mine the Copperline transcript', minutes: 20 },
      { activity: 'Phase 2: timed deliverable sprint (requirements → proposal → demo plan)', minutes: 55 },
      { activity: 'Phase 3: rubric grading + objection preview', minutes: 15 },
      { activity: 'Quiz + flashcards from today\'s gaps', minutes: 10 },
    ],
    completion: [
      'Recall reconstruction done closed-book; gaps became flashcards',
      'Transcript mined with quoted slots, stakeholder map, and ≥3 interviewer misses found',
      'All three deliverables produced inside the 55-minute box and committed to docs/sim1/',
      'Rubric self-score ≥8/12 with evidence lines (below 8: schedule the named drills before Day 174); quiz ≥ 2/3',
    ],
    connections: {
      back: 'Every phase reuses a specific day: mining is Day 163, the requirements sprint is Day 164\'s template at speed, the proposal is Day 165 compressed, the demo plan is Day 167\'s one-question discipline — and the architecture judgment underneath is Day 160.',
      forward: 'Day 174 re-runs the full cycle with written objections and a mid-course scope change; Day 175 debriefs both simulations and rewrites your weakest deliverable; Day 179\'s FDE case drill and your real interviews are this exercise with strangers watching.',
    },
    flashcards: [
      { f: 'The FDE rubric\'s four dimensions?', b: 'Discovery (evidence discipline), scoping (buyer\'s metric + reasoned deferrals), communication (two-reader test), feasibility (real constraints honored).' },
      { f: 'Copperline\'s two binding constraints from Farid?', b: 'EU data residency for shipment data + carrier contracts are confidential (segregate at ingest, EU-region inference).' },
      { f: 'The Ingrid move examiners look for?', b: 'Review queue where her corrections become labeled eval data — knowledge capture as a byproduct before she retires.' },
      { f: 'What did the February €18K incident prove architecturally?', b: 'Staleness kills: retrieval needs recency/supersession ranking + a monitored corpus-update pipeline.' },
      { f: 'A requirement you cannot quote from the transcript is…', b: 'Either a logged assumption with an owner and date, or an invention — never a silent FR.' },
      { f: 'Pass bar on the 12-point FDE rubric?', b: '8+ passes, 10+ is strong; every score needs an evidence line, and 1s must be called 1s.' },
    ],
    deepDive: [
      { label: 'Re-run the sim with a partner as examiner', note: 'Hand a friend the rubric and your package; their questions will differ from yours in exactly the dimensions you graded too gently. Day 175\'s debrief is richer with an outside score to reconcile.' },
    ],
  },
];
