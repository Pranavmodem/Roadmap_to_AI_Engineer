// Days 113–126 — Phase 6, Weeks 17–18: RAG and Agents.
// Week 17: RAG architecture → chunking → vector DBs → hybrid → reranking →
// advanced patterns → CAPSTONE KICKOFF. Week 18: the agent loop → planning →
// memory → multi-agent → MCP → reliability → support-triage agent.

export const DAYS_113_126 = [
  {
    id: 'd113', day: 113, week: 17, phase: 6, kind: 'lesson',
    title: 'RAG I — Architecture',
    analogy: 'The open-book exam',
    objectives: [
      'Draw the full RAG pipeline (ingest → chunk → embed → index → retrieve → generate) and explain what each stage owes the next',
      'Argue when RAG beats context-stuffing and fine-tuning for knowledge, and when it does not',
      'Build a minimal end-to-end RAG loop in pure Python and trace one query through it',
      'Name the stage a bad answer came from, given the retrieved chunks and the final output',
    ],
    prereqs: [
      { day: 92, label: 'Embeddings — meaning as geometry' },
      { day: 104, label: 'Context windows & hallucination' },
      { day: 106, label: 'LLM APIs — the request' },
    ],
    eli5: `A closed-book exam tests what a student memorized months ago. An open-book exam tests something more useful: can you find the right page fast and reason from it? The student doesn't re-read the whole textbook per question — the book has an index, they look up the two relevant pages, put a finger on them, and write an answer that cites those pages.

RAG (Retrieval-Augmented Generation) turns every LLM call into an open-book exam. Instead of hoping the polymath memorized your company's leave policy during pretraining (it didn't — your docs are private and newer than its knowledge cutoff), you build the index ahead of time: split your documents into pages ("chunks"), file each one in a library with a meaning-based index (embeddings in a vector store), and at question time fetch the few most relevant pages and staple them into the prompt. The model answers *from the pages in front of it* and cites them. When the policy changes, you update the index — no retraining, and every answer can point at its source.`,
    why: `RAG is the single most-built LLM system in industry, and "design a docs-QA system" is now a standard AI-engineer interview round. As an FDE it is usually the first thing a customer asks for: "can it answer questions over OUR documents?" The difference between a demo and a product is knowing where answers go wrong — retrieval missed, chunking mangled the page, or the model ignored the context — and that requires holding the whole pipeline in your head as separate, individually-debuggable stages. Your capstone, kicked off Day 119, is exactly this system taken to production.`,
    tech: `RAG has two data paths that run at different times. The **offline path** (ingest) runs when documents change: load sources → clean/normalize → split into chunks → embed each chunk → upsert vectors + text + metadata into an index. The **online path** (query) runs per request: embed the user's question with the *same* embedding model → similarity-search the index for top-k chunks → assemble a prompt containing the question plus the retrieved chunks → generate an answer constrained to that context, with citations.

### Why not the alternatives

- **Stuff everything into the context window?** Cost and quality both fail: you pay for every token on every call, and models demonstrably lose facts in the middle of very long contexts (Day 104). A 10k-page wiki doesn't fit anyway.
- **Fine-tune the knowledge in?** Fine-tuning shapes *behavior and style*, not reliable factual recall; it can't cite sources, updating one policy means retraining, and you can't delete a fact on request (Day 127 covers this decision tree properly).
- RAG gives you: freshness (re-index, not retrain), access control (filter the index per user), citations (each chunk knows its source), and deletability.

### Grounding and citations

Generation must be *grounded*: the system prompt says "answer ONLY from the provided context; if the context is insufficient, say so," and each chunk carries an id the model can cite like [1]. Citations are not decoration — they are your debugging handle and the user's trust handle.

### Where failures hide

Every bad answer comes from a specific stage, and stage-by-stage thinking is the whole game: **ingest** (doc never made it in), **chunking** (the answer got split across two chunks, neither retrievable), **embedding/retrieval** (right chunk exists, wrong chunks returned — vocabulary mismatch, Day 116's topic), **prompt assembly** (right chunks retrieved but truncated or badly ordered), **generation** (right context in the prompt, model ignored or contradicted it). You will formalize this taxonomy into a debugging flowchart on Day 118 and into metrics on Day 136.`,
    viz: 'rag-pipeline',
    guided: [
      {
        title: 'Build a whole RAG pipeline in 60 lines',
        minutes: 25,
        body: `1. Create \`rag_v0.py\` with the starter code. It is a complete pipeline: a 6-doc corpus, a bag-of-words "embedding," cosine retrieval, and a grounded prompt builder. It runs in the browser interpreter — no libraries, no API key.
2. Read the honesty note in the code: the word-count vector is a *lexical stand-in* for a real embedding. The architecture — embed, index, cosine top-k, assemble — is identical to production; on Day 115 you swap in real embeddings and a vector DB without touching the shape.
3. Run the three test queries. For each, check: did the top-2 chunks actually contain the answer?
4. The query "how much time off do I get" retrieves poorly — the corpus says "vacation," not "time off." Write one sentence on WHICH stage failed (retrieval: vocabulary mismatch). This exact failure is why embeddings (D115) and hybrid search (D116) exist.
5. Paste the printed grounded prompt into any chat LLM and confirm it answers with citations, and says "not in the context" for the out-of-scope query.`,
        code: `import math, re
from collections import Counter

# --- corpus: Nimbus Analytics internal docs (your capstone's world) ---
DOCS = {
    "hb-01": ("handbook", "Vacation policy: employees accrue 1.5 vacation days per month, capped at 25 days. Unused vacation days roll over, up to a maximum of 10."),
    "hb-02": ("handbook", "Parental leave is 16 weeks fully paid for all new parents, plus a 4-week flexible return-to-work period."),
    "hb-03": ("handbook", "Expense policy: individual purchases over 500 USD require manager pre-approval. Travel must be booked through the Navan portal."),
    "sec-01": ("security", "All laptops must use full-disk encryption. Report a lost device to security@nimbus.example within 4 hours."),
    "prod-1": ("product", "The Insights API rate limit is 120 requests per minute per key. Error ERR-4092 means the monthly quota is exhausted."),
    "prod-2": ("product", "Dashboards refresh every 15 minutes on the Standard plan and every 60 seconds on Enterprise."),
}

# --- "embedding": bag-of-words vector. Honest note: this is a LEXICAL
# stand-in so the pipeline runs anywhere. Real embeddings (D115) map
# synonyms near each other; this one cannot. Same architecture, weaker map.
def embed(text):
    return Counter(re.findall(r"[a-z0-9']+", text.lower()))

def cosine(a, b):
    dot = sum(a[w] * b[w] for w in a if w in b)
    na = math.sqrt(sum(v * v for v in a.values()))
    nb = math.sqrt(sum(v * v for v in b.values()))
    return dot / (na * nb) if na and nb else 0.0

# --- ingest (offline path): embed every chunk once ---
INDEX = {cid: (src, text, embed(text)) for cid, (src, text) in DOCS.items()}

# --- retrieve (online path) ---
def retrieve(query, k=2):
    qv = embed(query)
    scored = [(cosine(qv, vec), cid, src, text)
              for cid, (src, text, vec) in INDEX.items()]
    return sorted(scored, reverse=True)[:k]

# --- assemble the grounded prompt ---
def build_prompt(query, hits):
    ctx = "\\n".join(f"[{cid}] ({src}) {text}" for _, cid, src, text in hits)
    return ("Answer ONLY from the context. Cite chunk ids like [hb-01]. "
            "If the context is insufficient, say 'Not in the provided context.'\\n\\n"
            "Context:\\n" + ctx + "\\n\\nQuestion: " + query)

for q in ["how many vacation days roll over?",
          "what does error ERR-4092 mean?",
          "how much time off do I get",          # vocabulary mismatch!
          "what is the office wifi password?"]:  # not in corpus
    hits = retrieve(q)
    print("Q:", q)
    for score, cid, src, _ in hits:
        print(f"   {score:.3f}  [{cid}] {src}")
    print()
print(build_prompt("how many vacation days roll over?", retrieve("how many vacation days roll over?")))`,
      },
      {
        title: 'Failure triage: name the guilty stage',
        minutes: 15,
        body: `You get four incident reports from a docs-QA bot. For each, name the guilty stage (ingest / chunking / retrieval / prompt assembly / generation) and the fix. Write your answers, then check against the key at the bottom.

1. Q: "What is the Enterprise refresh rate?" — Retrieved chunks: hb-01, hb-03. Answer: "Not in the provided context." (The fact IS in prod-2.)
2. Q: "What is the vacation cap?" — Retrieved: a chunk reading "...capped at 25 days. Unused vacation" (cut mid-sentence, no policy name). Answer is vague.
3. Q: "How fast must I report a lost laptop?" — Retrieved: sec-01 (contains "within 4 hours"). Answer: "Within 24 hours."
4. Q: "What is the refund policy?" — The refund doc lives in a PDF that the loader skipped. Answer: hallucinated a policy.

Key: 1 retrieval (right chunk exists, wrong ones returned); 2 chunking (answer split/truncated — Day 114); 3 generation (context correct, model contradicted it — needs grounding-faithfulness eval, Day 136); 4 ingest (doc never indexed; no retrieval can save you).`,
      },
    ],
    practice: [
      {
        title: 'Extend the pipeline honestly',
        minutes: 20,
        body: `Extend \`rag_v0.py\` on your own: (1) add a \`min_score\` threshold to \`retrieve\` so garbage matches (score < 0.05) are dropped and the prompt says "no relevant context found" instead of stuffing noise; (2) add a \`source_filter\` argument so a query can be restricted to \`handbook\` docs only — this is metadata filtering, the baby version of per-user access control; (3) add 3 new docs and one query that your bag-of-words retriever gets WRONG but a human librarian would get right. Keep that failing query — it is your test case for Days 115–117.

Hints: threshold before slicing top-k; filter inside the comprehension; for the failing query, use synonyms the corpus never uses.`,
      },
    ],
    project: {
      title: 'Docs-QA architecture one-pager',
      brief: `Write \`rag_architecture.md\` in your practice repo: a diagram-first design for a docs-QA assistant over an internal wiki (the shape of your Day 119 capstone). Draw the offline and online paths as two labeled pipelines (ASCII or Mermaid). For each of the six stages, write one line: what goes in, what comes out, and the failure mode that hides there. Close with a 5-row "symptom → suspect stage → first check" triage table built from today's guided exercise. This file becomes the skeleton of your capstone design doc.`,
      rubric: [
        'Both paths (offline ingest, online query) drawn with all six stages in order',
        'Each stage has input, output, and its characteristic failure mode',
        'Triage table maps at least 5 symptoms to stages with a concrete first check',
        'States explicitly why RAG was chosen over fine-tuning and context-stuffing for this use case',
        'Committed to the practice repo',
      ],
    },
    mistakes: [
      'Treating RAG as one thing to debug. It is six stages; a bad answer always has ONE primary guilty stage. Debug by stage, never by re-rolling the prompt.',
      'Embedding queries with a different model (or different preprocessing) than documents. Query and document vectors must live in the same space, produced identically.',
      'Believing fine-tuning "teaches facts" better than RAG. FT shapes style and behavior; it cannot cite, cannot update cheaply, and cannot forget. Knowledge belongs in the index.',
      'Skipping the "insufficient context" escape hatch. Without it, the model answers from parametric memory when retrieval fails — the worst failure, because it looks confident.',
      'Retrieving top-k with no score threshold. When nothing relevant exists, top-k still returns k chunks of noise, and the model will dutifully answer from noise.',
      'Ignoring metadata at ingest. Source, section, date, and access level cost nothing to store and are the only way to do filtering, citations, and permissions later.',
    ],
    quiz: [
      {
        q: 'A docs-QA bot answers a question wrongly. The logs show the retrieved chunks DID contain the correct fact. Which stage is the prime suspect?',
        o: ['Chunking', 'Embedding/retrieval', 'Generation — the model ignored or contradicted its context', 'Ingest'],
        x: 2,
        w: 'If the right context reached the prompt, retrieval and everything before it did their job. The failure is in generation faithfulness — measured as groundedness on Day 136.',
        revisit: 113,
      },
      {
        q: 'Why does RAG beat fine-tuning for keeping a company handbook answerable?',
        o: [
          'Fine-tuned models are always less accurate',
          'RAG updates by re-indexing, supports citations and per-user filtering, and can delete facts; FT can do none of these cheaply',
          'Fine-tuning cannot use company data',
          'RAG is free',
        ],
        x: 1,
        w: 'Freshness, citations, access control, and deletability are structural properties of an index, not of model weights. FT shapes behavior; the index holds knowledge.',
        revisit: 113,
      },
      {
        q: 'The query "how much time off do I get" fails against a corpus that says "vacation days." What failed, and what fixes it?',
        o: [
          'Generation; a better system prompt',
          'Retrieval, due to vocabulary mismatch; real semantic embeddings (and hybrid search) fix it',
          'Chunking; smaller chunks',
          'Ingest; the doc was missing',
        ],
        x: 1,
        w: 'The chunk exists but shares no words with the query — lexical matching cannot bridge synonyms. Semantic embeddings (Day 115) map "time off" near "vacation."',
        revisit: 115,
      },
    ],
    resources: [
      { label: 'RAG paper — Lewis et al. 2020 (read §1–2 for the why)', url: 'https://arxiv.org/abs/2005.11401', type: 'paper', time: '25 min' },
      { label: 'Pinecone Learning Center — Retrieval-Augmented Generation', url: 'https://www.pinecone.io/learn/', type: 'article', time: '20 min' },
      { label: 'LlamaIndex — framework docs (high-level RAG concepts)', url: 'https://developers.llamaindex.ai/python/framework/', type: 'docs', time: '20 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: due cards from Week 16 (APIs, prompting, tools)', minutes: 10 },
      { activity: 'ELI5 + tech read; study the rag-pipeline visualizer stage by stage', minutes: 25 },
      { activity: 'Guided: build the 60-line pipeline + failure triage drill', minutes: 40 },
      { activity: 'Practice: threshold, metadata filter, and your failing query', minutes: 20 },
      { activity: 'Project: architecture one-pager', minutes: 15 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'rag_v0.py runs; all four test queries traced and explained',
      'All four triage incidents attributed to the correct stage',
      'One personally-crafted failing query saved for Days 115–117',
      'Architecture one-pager committed',
      'Quiz ≥ 2/3',
    ],
    connections: {
      back: 'Day 92 gave you embeddings as a map of meaning and Day 50 gave you cosine similarity — today they became a retrieval system. Day 104 explained why stuffing the whole wiki into context fails; RAG is the engineered answer.',
      forward: 'Day 114 fixes the chunking stage, Day 115 swaps the toy embedding for the real thing, and Days 116–117 fix retrieval quality. On Day 119 this pipeline becomes your capstone v0, and Day 136 turns today\'s failure taxonomy into automated metrics.',
    },
    flashcards: [
      { f: 'The six RAG stages, in order?', b: 'Ingest → chunk → embed → index → retrieve → generate (offline: first four; online: last two plus prompt assembly).' },
      { f: 'RAG vs fine-tuning for knowledge — three structural wins for RAG?', b: 'Freshness (re-index, not retrain), citations/access control via metadata, deletability. FT shapes behavior, not reliable recall.' },
      { f: 'Right chunks retrieved, wrong answer — guilty stage?', b: 'Generation (faithfulness failure). The model ignored or contradicted the provided context.' },
      { f: 'Why must query and doc embeddings use the same model?', b: 'Cosine similarity only means anything within one embedding space; different models produce incomparable vectors.' },
      { f: 'What is grounding?', b: 'Constraining generation to answer only from retrieved context, with citations and an explicit "insufficient context" escape hatch.' },
    ],
    deepDive: [
      { label: 'Lost in the middle — why prompt order matters', note: 'Liu et al. showed retrieval quality can be undone by placing key chunks mid-prompt. You will mitigate this on Day 117 with reranking and ordering.' },
    ],
  },
  {
    id: 'd114', day: 114, week: 17, phase: 6, kind: 'lesson',
    title: 'Chunking Strategies',
    analogy: 'Tearing the book into useful pages',
    objectives: [
      'Implement fixed-size, recursive, and structure-aware chunking on the same document',
      'Explain the retrieval-precision vs context-completeness trade-off that chunk size controls',
      'Choose overlap and size defaults for prose, tables, and code, and justify them',
      'Attach metadata (source, section, position) at chunk time and say why it must happen there',
    ],
    prereqs: [
      { day: 113, label: 'RAG architecture' },
      { day: 96, label: 'Tokenization' },
    ],
    eli5: `You're building the index for the open-book exam, and the book won't fit on index cards whole — you have to tear it into pages first. Tear carelessly and every page ends mid-sentence: the card that says "the limit is" is useless without the card that says "500 USD." Tear too small and each card is a confetti scrap with no context. Tear too big and each card is half the book — it matches every search vaguely and the student has to skim the whole thing anyway.

Chunking is the tearing strategy. The dumbest tear is "every 200 words, cut" (fixed-size). Smarter is "prefer to cut at paragraph breaks, then sentences, only then mid-sentence" (recursive). Smartest is "cut where the AUTHOR cut — at headings and sections — and write the chapter name on every scrap" (structure-aware). The strategy you pick decides what CAN ever be retrieved: retrieval returns chunks, not documents, so a fact split across two chunks is a fact your system half-knows forever.`,
    why: `Chunking is the most underrated dial in RAG — practitioner postmortems routinely trace "the bot can't find things" to chunks that severed answers from their context, and no amount of embedding-model upgrades repairs a bad tear. It is also cheap leverage: re-chunking is a one-line config change plus re-index, versus weeks of model work. In your capstone (Day 119) and in any customer engagement, "show me your chunks for this failing query" is the first debugging move an experienced FDE makes — you are learning that move today.`,
    tech: `A chunk is the unit of retrieval AND the unit of context. Small chunks embed crisply (one topic → one clean vector → high retrieval precision) but may lack the context needed to answer. Large chunks carry full context but embed muddily (five topics average into one blurry vector) and waste prompt tokens. That tension is the whole design space; Day 117's parent-child retrieval resolves it by retrieving small and delivering big.

### The three families

**Fixed-size** splits every N characters/tokens with M overlap. Trivial, fast, format-blind — and it severs sentences and separates policy names from their numbers. Overlap (typically 10–20%) is a bandage: it duplicates boundary text so a fact near a cut survives in at least one chunk, at the cost of index size and near-duplicate retrievals.

**Recursive** (the sane default, as in LangChain's RecursiveCharacterTextSplitter) tries a priority list of separators — paragraph break, newline, sentence end, space — recursing to finer separators only when a piece still exceeds the size limit. Boundaries land on natural seams, so most chunks are whole paragraphs.

**Structure-aware** parses the format first: split markdown/HTML at headings, keep each section together, and stamp the heading path ("Handbook > Expenses > Travel") into both metadata and the chunk text itself. This is the strongest option for docs because the heading path disambiguates ("limit" under Expenses vs "limit" under API) and gives citations human-readable locations. **Semantic chunking** goes further — embed sentences and cut where adjacent-sentence similarity drops — powerful but costlier and rarely the first tool.

### Special cases and metadata

Tables die when split row-from-header: keep tables atomic, or prepend the header row to every row-group chunk. Code should split at function/class boundaries, never mid-function. Whatever you do, attach metadata AT CHUNK TIME — source path, section title, position index, ingest date — because after chunking, provenance is unrecoverable. Sizes are measured in tokens (Day 96), not characters, since token budgets are what the prompt pays; 200–500 tokens is a common starting band for prose. You will *evaluate* chunking properly on Day 136 — today you build the intuition by watching retrievals change.`,
    viz: 'chunk-strategies',
    guided: [
      {
        title: 'One document, three tearings',
        minutes: 25,
        body: `1. Create \`chunk_lab.py\` with the starter code: one realistic markdown policy doc and three chunkers — fixed (with overlap), recursive, structure-aware.
2. Run it. For each strategy, read the printed chunks and count: how many chunks cut a sentence in half? How many separated a number from the rule it belongs to?
3. Now run the retrieval comparison at the bottom: the same three queries against each strategy's index (reusing Day 113's cosine retriever).
4. Query "what is the travel booking limit" should expose the fixed chunker: the phrase "500 USD" and the words "travel" or "pre-approval" land in different chunks. Verify which strategies return a chunk containing the COMPLETE answer.
5. Note how the structure-aware chunks carry their heading path in the text — and how that alone lifts their scores on section-flavored queries.`,
        code: `import math, re
from collections import Counter

DOC = """# Nimbus Analytics — Expense & Travel Policy

## Purchases
Individual purchases over 500 USD require written manager pre-approval.
Software subscriptions of any amount must go through IT procurement.
Receipts are mandatory for every expense above 25 USD.

## Travel
All travel must be booked through the Navan portal. Economy class is
standard for flights under 6 hours. Hotel budget is capped at 250 USD
per night in tier-1 cities and 180 USD elsewhere.

## Reimbursement
Submit expense reports within 30 days of purchase. Reimbursement lands
in the next payroll cycle after approval. Late reports need VP sign-off.
"""

# --- strategy 1: fixed-size with overlap ---
def chunk_fixed(text, size=180, overlap=40):
    text = re.sub(r"\\s+", " ", text).strip()
    chunks, start = [], 0
    while start < len(text):
        chunks.append(text[start:start + size])
        start += size - overlap
    return chunks

# --- strategy 2: recursive (paragraphs, then sentences) ---
def chunk_recursive(text, size=180):
    def split(piece, seps):
        if len(piece) <= size or not seps:
            return [piece]
        parts, out, buf = piece.split(seps[0]), [], ""
        for p in parts:
            cand = (buf + seps[0] + p) if buf else p
            if len(cand) <= size:
                buf = cand
            else:
                if buf: out.append(buf)
                out.extend(split(p, seps[1:]) if len(p) > size else [p])
                buf = ""
        if buf: out.append(buf)
        return out
    return [c.strip() for c in split(text, ["\\n\\n", ". ", " "]) if c.strip()]

# --- strategy 3: structure-aware (markdown headings + heading-path metadata) ---
def chunk_structured(text):
    chunks, h1, h2, buf = [], "", "", []
    def flush():
        if buf:
            path = " > ".join(p for p in (h1, h2) if p)
            body = " ".join(buf)
            chunks.append({"path": path, "text": path + ": " + body})
            buf.clear()
    for line in text.splitlines():
        if line.startswith("## "):
            flush(); h2 = line[3:].strip()
        elif line.startswith("# "):
            flush(); h1 = line[2:].strip(); h2 = ""
        elif line.strip():
            buf.append(line.strip())
    flush()
    return chunks

# --- retrieval comparison (Day 113's retriever) ---
def embed(t): return Counter(re.findall(r"[a-z0-9']+", t.lower()))
def cosine(a, b):
    dot = sum(a[w] * b[w] for w in a if w in b)
    na = math.sqrt(sum(v * v for v in a.values()))
    nb = math.sqrt(sum(v * v for v in b.values()))
    return dot / (na * nb) if na and nb else 0.0

def top1(query, chunks):
    qv = embed(query)
    return max(chunks, key=lambda c: cosine(qv, embed(c)))

STRATS = {
    "fixed": chunk_fixed(DOC),
    "recursive": chunk_recursive(DOC),
    "structured": [c["text"] for c in chunk_structured(DOC)],
}
for name, chunks in STRATS.items():
    print(f"=== {name}: {len(chunks)} chunks ===")
    for c in chunks: print("  |", c[:80].replace("\\n", " "))

for q in ["what is the travel booking limit",
          "hotel budget per night",
          "when do I get reimbursed"]:
    print("\\nQ:", q)
    for name, chunks in STRATS.items():
        print(f"  {name:10s} ->", top1(q, chunks)[:90])`,
      },
      {
        title: 'Break a table, then save it',
        minutes: 15,
        body: `1. Add this markdown table to the doc, under a new "## Per-diem rates" section:
   Region | Breakfast | Dinner — three data rows (US 20/50, EU 15/45, APAC 12/40, as pipe-separated lines).
2. Re-run the fixed chunker and find where the table got cut. Ask: if retrieval returns only the chunk with the "APAC" row, can a model know 12 means breakfast USD? (No — the header is in another chunk.)
3. Implement the fix: detect table lines (they contain " | ") and emit the table as ONE atomic chunk, header included. If a table exceeds the size limit, split by row-groups but prepend the header row to every group.
4. Re-run retrieval for "APAC dinner per diem" and confirm the atomic-table strategy returns a self-sufficient chunk.`,
      },
    ],
    practice: [
      {
        title: 'Chunk your own repo docs',
        minutes: 20,
        body: `Take a real README or docs file from one of your own projects (Day 21 or Day 42 work). Run all three chunkers on it. Deliverable: a 10-line written verdict — which strategy wins for THIS document and why; the worst single chunk each strategy produced (paste it); and your recommended size/overlap numbers with one sentence of justification each.

Constraints: judge chunks by asking "could a model answer a question from this chunk alone?" Hints: code fences are the tables of READMEs — check whether any chunker cut one in half; if your doc has headings, structure-aware should win, so explain any surprise.`,
      },
    ],
    project: {
      title: 'The chunking decision card',
      brief: `Create \`chunking_notes.md\`: a decision card you will reuse at capstone ingest time (Day 119). Contents: (1) a table of the three families with one-line mechanism, best-for, and failure mode; (2) your defaults — size in tokens, overlap %, separator priority — for prose, markdown docs, tables, and code, each with a one-sentence why; (3) the "torn answer" example from today's lab pasted verbatim as a cautionary exhibit; (4) three rules that must happen at chunk time (metadata stamping, table atomicity, heading-path prefixing). Commit it.`,
      rubric: [
        'All three families compared with mechanism, best-for, and failure mode',
        'Concrete defaults per content type (prose/markdown/tables/code) in tokens, each justified',
        'A real severed-answer chunk from the lab included as evidence',
        'The three chunk-time rules stated with reasons',
        'Committed to the practice repo',
      ],
    },
    mistakes: [
      'Chunking by characters while budgeting prompts by tokens. Measure chunk size in tokens (Day 96) — a 1000-character code chunk can be 400 tokens; emoji-heavy text even more.',
      'Assuming bigger chunks are safer. Big chunks blur the embedding (many topics → one vector), tanking retrieval precision. Retrieve-small, deliver-big is the real fix (Day 117).',
      'Using overlap as a substitute for good boundaries. Overlap patches cut wounds; recursive/structure-aware splitting avoids making them.',
      'Splitting tables from their headers or code mid-function. Keep them atomic, or replicate the header into every fragment.',
      'Deferring metadata to "later." After chunking, you cannot recover which section a chunk came from — stamp source, heading path, and position at chunk time.',
      'Re-chunking without re-embedding and re-indexing everything. Chunks and their vectors must stay in lockstep; a partial re-index silently mixes two chunking generations.',
    ],
    quiz: [
      {
        q: 'Retrieval keeps returning a chunk that reads "...requires written manager" — the amount is in the previous chunk. What is the cleanest fix?',
        o: [
          'A better embedding model',
          'Chunk at natural boundaries (recursive/structure-aware) so rules stay whole; overlap as a fallback',
          'Increase top-k to 20',
          'Lower the temperature',
        ],
        x: 1,
        w: 'This is a torn answer — a chunking failure. Boundary-respecting splitters keep the rule and its number together; no retrieval or generation change can reunite them.',
        revisit: 114,
      },
      {
        q: 'What is the core trade-off that chunk size controls?',
        o: [
          'Cost vs latency',
          'Retrieval precision (small, single-topic chunks embed crisply) vs context completeness (large chunks carry the full answer)',
          'Index size vs accuracy',
          'Token count vs character count',
        ],
        x: 1,
        w: 'Small chunks make clean vectors but may lack answering context; large chunks have context but blurry vectors. Parent-child retrieval (Day 117) gets both.',
        revisit: 114,
      },
      {
        q: 'Why must metadata be attached at chunk time rather than later?',
        o: [
          'It makes embedding faster',
          'Vector DBs require it',
          'Provenance (source, section, position) is unrecoverable after the text is torn from its document',
          'It reduces index size',
        ],
        x: 2,
        w: 'Once a chunk is a floating string, nothing links it back to its heading path or file. Citations, filters, and permissions all depend on stamping provenance during the tear.',
        revisit: 114,
      },
    ],
    resources: [
      { label: 'Pinecone Learning Center — chunking strategies', url: 'https://www.pinecone.io/learn/', type: 'article', time: '20 min' },
      { label: 'LangChain docs — text splitters', url: 'https://docs.langchain.com/oss/python/langchain/overview', type: 'docs', time: '15 min' },
      { label: 'LlamaIndex — node parsing & ingestion', url: 'https://developers.llamaindex.ai/python/framework/', type: 'docs', time: '15 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep: due cards + redraw the six RAG stages from memory (D113)', minutes: 10 },
      { activity: 'ELI5 + tech read; chunk-strategies visualizer', minutes: 20 },
      { activity: 'Guided: three tearings + the table rescue', minutes: 40 },
      { activity: 'Practice: chunk your own repo docs', minutes: 20 },
      { activity: 'Project: chunking decision card', minutes: 20 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'All three chunkers run; severed-answer failure demonstrated and explained',
      'Table made atomic and verified retrievable as a self-sufficient chunk',
      'Own-docs verdict written with recommended defaults',
      'Decision card committed',
      'Quiz ≥ 2/3',
    ],
    connections: {
      back: 'Day 113 showed chunking as one of six stages — today you learned it decides what can ever be retrieved. Day 96\'s tokenization is why sizes are measured in tokens, not characters.',
      forward: 'Day 115 embeds these chunks for real; Day 117\'s parent-child retrieval resolves today\'s size trade-off outright. On Day 119 your capstone ingest pipeline applies today\'s decision card, and Day 136 measures chunking quality with context-precision metrics.',
    },
    flashcards: [
      { f: 'Three chunking families and their one-line mechanisms?', b: 'Fixed: cut every N tokens + overlap. Recursive: try paragraph→sentence→word separators. Structure-aware: cut at headings, stamp heading path.' },
      { f: 'What does chunk overlap actually do?', b: 'Duplicates boundary text so facts near a cut survive in one chunk — a bandage for bad boundaries, costing index size.' },
      { f: 'Rule for chunking tables?', b: 'Keep atomic with header; if too big, split row-groups and prepend the header row to each.' },
      { f: 'Why prefix the heading path into structure-aware chunk text?', b: 'Disambiguates terms ("limit" under Expenses vs API), boosts section queries, and gives citations readable locations.' },
      { f: 'Starting size band for prose chunks?', b: 'Roughly 200–500 tokens with 10–20% overlap — then tune by watching retrieval, not by guessing.' },
    ],
    deepDive: [
      { label: 'Semantic chunking', note: 'Embed sentences, cut where adjacent-sentence cosine similarity drops below a threshold. Elegant, ~10–50x the embedding cost at ingest; try it when structure-aware boundaries still feel wrong.' },
    ],
  },
  {
    id: 'd115', day: 115, week: 17, phase: 6, kind: 'lesson',
    title: 'Embeddings & Vector Databases',
    analogy: 'The library with a meaning-based index',
    objectives: [
      'Choose an embedding model deliberately (dimensions, domain, cost, and the lock-in it creates)',
      'Explain exact vs approximate nearest-neighbor search and the HNSW recall/speed trade',
      'Build and query a vector index with Chroma-style code: add, upsert, metadata filters',
      'Pick the right distance metric and say when cosine vs dot product vs Euclidean differ',
    ],
    prereqs: [
      { day: 113, label: 'RAG architecture' },
      { day: 92, label: 'Embeddings — meaning as geometry' },
      { day: 50, label: 'Vectors & cosine similarity' },
    ],
    eli5: `A normal library index answers "where is the book titled X?" — you must know the exact title. A meaning-based library is stranger and better: every book's CONTENT is boiled down to a point on a giant map, where books about similar things sit near each other. To find "something about taking time off work," you boil your question down to a point on the same map and grab the nearest neighbors — even if no book contains your exact words. "Vacation policy" sits right next to "time off," because the map was drawn from meaning, not spelling.

The map is the embedding space (Day 92's map of meaning). The vector database is the librarian who can find nearest neighbors FAST: with a million books, checking the distance to every single one per question is too slow, so the librarian builds shortcut walkways between neighborhoods (an ANN index like HNSW) and hops along them — visiting maybe a thousand books instead of a million, and almost always finding the true nearest ones.`,
    why: `This is the O(n²)/O(n) moment from Day 22 arriving in production: exact search over every chunk is linear per query and fine at 10k chunks, but a 20M-chunk enterprise corpus at 50 queries/sec needs ANN indexes — knowing WHERE that line sits is an interview staple and a real architecture decision you'll defend to customers. Just as important is the operational side FDEs live in: embedding-model version lock-in (change the model, re-embed everything), metadata filtering for per-customer access control, and upsert lifecycles for docs that change daily.`,
    tech: `An embedding model maps text → a fixed-length float vector (typically 384–3072 dims) such that semantic similarity ≈ geometric closeness. Model choice matters: dimensionality (bigger = more expressive, more storage, slower search), training domain (code vs legal vs multilingual), context limit per input, and cost. The brutal operational fact: vectors from different models — even different VERSIONS — are incomparable. Your embedding model choice is written into every stored vector; migrating means re-embedding the entire corpus. Pin the model+version in metadata from day one.

### Exact vs approximate search

Exact (brute-force) search computes similarity to all n vectors: O(n·d) per query, perfectly accurate, and genuinely fine below ~100k vectors — do not let anyone tell you a 5k-doc pilot needs a distributed vector DB. Past that, **ANN** (approximate nearest neighbor) indexes trade a sliver of recall for orders-of-magnitude speed. **HNSW** — the dominant algorithm — builds a multi-layer "skip-list of neighborhoods": sparse top layers for coarse hops, dense bottom layer for precision; queries greedily descend, touching ~log(n) regions. Parameters \`M\` (links per node) and \`ef\` (candidate list width) tune the recall/speed/memory triangle. ANN means *recall < 100%*: the true best chunk is occasionally missed — an invisible failure unless you measure retrieval recall (Day 136).

### Distance metrics

Cosine similarity compares directions (length-invariant); dot product rewards magnitude too; Euclidean measures straight-line distance. For vectors normalized to unit length — which most sentence-embedding models output — all three produce the SAME ranking; cosine is the safe default. The metric is baked into the index at creation: pick it once, consciously.

### The database part

A vector DB (Chroma, pgvector, Qdrant, Pinecone…) is the index plus database duties: persistence, **upserts** (re-ingesting a changed doc replaces its vectors — keyed by stable chunk IDs, which is why deterministic ID schemes like \`source#section#i\` matter), **metadata filtering** (\`where source = handbook\` — the mechanism behind per-user permissions), and hybrid hooks (Day 116). Filters interact subtly with ANN: filtering AFTER approximate search can return fewer than k results, so real engines filter during traversal.`,
    viz: 'vector-search',
    guided: [
      {
        title: 'A vector store from scratch — the contract',
        minutes: 20,
        body: `1. Create \`vecstore.py\` with the starter code: a tiny class with the EXACT api shape of a real vector DB — \`add\`, \`upsert\`, \`query\` with \`where\` filters — over brute-force cosine. Runs in the browser interpreter.
2. Run it. Note the three behaviors the tests demonstrate: (a) top-k ranking; (b) a \`where\` filter restricting results to handbook docs; (c) an upsert replacing an old vector under the same ID — the doc-changed lifecycle.
3. Predict, then verify: after upserting hb-01 with new text, does the old text ever come back? Why is a STABLE id scheme what made replacement (not duplication) happen?
4. This class IS the mental model: everything a vector DB adds beyond it is speed (HNSW), persistence, and scale.`,
        code: `import math

class VecStore:
    """Minimal vector store: the contract of Chroma/pgvector/Qdrant,
    minus the speed. Brute-force cosine = exact search, fine to ~100k."""
    def __init__(self):
        self.rows = {}   # id -> (vector, text, metadata)

    def add(self, id, vector, text, metadata):
        if id in self.rows:
            raise ValueError(f"duplicate id {id} — use upsert")
        self.rows[id] = (vector, text, metadata)

    def upsert(self, id, vector, text, metadata):
        self.rows[id] = (vector, text, metadata)   # replace or insert

    @staticmethod
    def _cosine(a, b):
        dot = sum(x * y for x, y in zip(a, b))
        na = math.sqrt(sum(x * x for x in a))
        nb = math.sqrt(sum(x * x for x in b))
        return dot / (na * nb) if na and nb else 0.0

    def query(self, qvec, k=3, where=None):
        hits = []
        for id, (vec, text, meta) in self.rows.items():
            if where and any(meta.get(key) != val for key, val in where.items()):
                continue                      # metadata filter
            hits.append((self._cosine(qvec, vec), id, text, meta))
        return sorted(hits, reverse=True)[:k]

# --- toy embeddings: 4 dims = (hr-ness, security-ness, product-ness, money-ness)
# Real models produce 384-3072 dims; the geometry lesson is identical.
E = {
    "vacation days roll over up to 10":        [0.9, 0.0, 0.0, 0.2],
    "parental leave is 16 weeks paid":         [0.95, 0.0, 0.0, 0.1],
    "laptops must use full-disk encryption":   [0.1, 0.9, 0.0, 0.0],
    "API rate limit is 120 requests/minute":   [0.0, 0.1, 0.9, 0.0],
    "purchases over 500 USD need approval":    [0.3, 0.0, 0.1, 0.9],
}
store = VecStore()
for i, (text, vec) in enumerate(E.items()):
    src = "handbook" if vec[0] > 0.2 or vec[3] > 0.5 else "techdocs"
    store.add(f"chunk-{i}", vec, text, {"source": src})

q_timeoff = [0.85, 0.0, 0.0, 0.15]   # "how much time off do I get?"
print("no filter:      ", [(round(s,3), t[:30]) for s, _, t, _ in store.query(q_timeoff)])
print("handbook only:  ", [(round(s,3), t[:30]) for s, _, t, _ in store.query(q_timeoff, where={"source": "handbook"})])

# --- the upsert lifecycle: hb policy changed ---
store.upsert("chunk-0", [0.9, 0.0, 0.0, 0.2],
             "vacation days roll over up to 15 (updated 2026)", {"source": "handbook"})
print("after upsert:   ", [(round(s,3), t) for s, _, t, _ in store.query(q_timeoff, k=1)])
print("rows in store:  ", len(store.rows), "(still 5 — replaced, not duplicated)")`,
      },
      {
        title: 'The real thing: Chroma over your Day 114 chunks',
        minutes: 20,
        body: `This exercise needs a local Python environment (\`pip install chromadb sentence-transformers\`) — the in-browser interpreter can't run it; if you're browser-only today, read the code line by line and map each call onto your VecStore, then run it tonight.

1. Create \`chroma_lab.py\` with the starter code. It ingests the structure-aware chunks from Day 114's policy doc into Chroma, which embeds them automatically (all-MiniLM-L6-v2, 384 dims, runs on CPU).
2. Run it. The killer test is the last query: "how much time off do I get" — the vocabulary-mismatch query your Day 113 bag-of-words retriever FAILED. Real embeddings place "time off" near "vacation." Confirm it now retrieves the right chunk.
3. Try the \`where\` filter — then break it: filter for a source that doesn't exist and see the graceful empty result.
4. Re-run the script. Note \`get_or_create_collection\` + stable IDs make re-ingest idempotent — accidental double-ingest is the classic index-poisoning bug.`,
        code: `# Local run: pip install chromadb  (embeds with a local model by default)
import chromadb

client = chromadb.PersistentClient(path="./chroma_data")
col = client.get_or_create_collection(
    name="nimbus_docs",
    metadata={"hnsw:space": "cosine"},     # metric fixed at creation!
)

chunks = [
    ("expenses#purchases#0", "Expenses > Purchases: purchases over 500 USD require manager pre-approval. Software goes through IT procurement.", {"source": "handbook", "section": "Purchases"}),
    ("expenses#travel#0",    "Expenses > Travel: book through the Navan portal. Hotels capped at 250 USD/night tier-1, 180 elsewhere.",          {"source": "handbook", "section": "Travel"}),
    ("hr#vacation#0",        "HR > Vacation: employees accrue 1.5 vacation days per month; up to 10 unused days roll over.",                     {"source": "handbook", "section": "Vacation"}),
    ("api#limits#0",         "API > Limits: the Insights API allows 120 requests per minute. ERR-4092 means monthly quota exhausted.",           {"source": "techdocs", "section": "Limits"}),
]
col.upsert(   # stable ids => re-running this script never duplicates
    ids=[c[0] for c in chunks],
    documents=[c[1] for c in chunks],
    metadatas=[c[2] for c in chunks],
)

for q in ["hotel budget for a work trip",
          "what does ERR-4092 mean",
          "how much time off do I get"]:      # D113's failing query
    res = col.query(query_texts=[q], n_results=2)
    print("Q:", q)
    for doc, dist in zip(res["documents"][0], res["distances"][0]):
        print(f"   dist={dist:.3f}  {doc[:70]}")

res = col.query(query_texts=["spending rules"], n_results=3,
                where={"source": "handbook"})   # metadata filter
print("handbook-only:", [d[:40] for d in res["documents"][0]])`,
      },
    ],
    practice: [
      {
        title: 'Find the exact-search cliff',
        minutes: 20,
        body: `Using your pure-Python VecStore, measure where brute force stops being fine. Generate synthetic corpora of n = 1_000, 10_000, 100_000 random 384-dim vectors (\`random.random()\`), time 20 queries against each (reuse Day 22's timing harness), and extrapolate: at what n does a single query exceed 100 ms? Then write a 5-line recommendation: for the capstone corpus (~2k chunks), is an ANN index justified on latency grounds — or is the honest answer "exact search, revisit at 100k"?

Hints: per-query cost is O(n·d) — confirm the linear ratio between the three sizes. Python loops are ~100x slower than NumPy/real DBs; note that your cliff estimate is conservative and say by how much.`,
      },
    ],
    project: {
      title: 'Index the capstone corpus (dry run)',
      brief: `Build \`build_index.py\`: an ingest script that takes a folder of markdown files (create 4–6 fake Nimbus docs, or reuse Day 114's), applies your structure-aware chunker with the Day 114 decision-card defaults, stamps metadata (source, section path, position, model name "bow-v0"), and loads everything into your VecStore — plus a Chroma variant behind an \`if USE_CHROMA\` flag for local runs. Include a smoke test: 5 queries with expected source sections, asserting the right section appears in top-2. This script IS the seed of your capstone's ingest pipeline; on Day 119 you will point it at the real corpus.`,
      rubric: [
        'Ingest walks a folder, chunks with Day 114 defaults, and stamps all four metadata fields',
        'Deterministic chunk IDs (source#section#position) — re-running never duplicates',
        'Smoke test: ≥ 4/5 queries retrieve the expected section in top-2',
        'Embedding model name recorded in metadata (the lock-in you now understand)',
        'Chroma variant present and runnable locally',
        'Committed to the practice repo',
      ],
    },
    mistakes: [
      'Reaching for a hosted vector DB at 3k chunks. Exact search is O(n·d), perfect-recall, and instant at that scale — complexity must be earned by n, latency, or ops needs.',
      'Mixing embedding model versions in one index. Vectors from different models/versions are geometrically incomparable; the symptom is quietly mediocre retrieval, not an error.',
      'Forgetting ANN recall < 100%. HNSW can miss the true nearest chunk; if you never measure retrieval recall (Day 136), these misses masquerade as "the model is dumb."',
      'Choosing dot product for unnormalized vectors without meaning to. Magnitude then influences ranking — long chunks win regardless of relevance. For unit vectors, cosine/dot/Euclidean rank identically.',
      'Random or content-hash chunk IDs. Doc updates then ADD vectors instead of replacing them, and stale chunks keep answering. Deterministic IDs + upsert = the update lifecycle.',
      'Applying metadata filters as a post-filter on ANN results. You can get back fewer than k (or zero) hits; engines must filter during traversal — know which yours does.',
    ],
    quiz: [
      {
        q: 'You re-embed new docs with your embedding provider\'s v3 model into an index full of v2 vectors. What happens?',
        o: [
          'Nothing — embeddings are standardized',
          'An immediate error from the vector DB',
          'Silent degradation: v2 and v3 vectors are incomparable, so cross-generation similarity scores are meaningless',
          'Only latency gets worse',
        ],
        x: 2,
        w: 'Different model versions produce different geometries. The DB happily stores both and compares them — producing garbage rankings with no error. Pin model+version in metadata; migrate by full re-embed.',
        revisit: 115,
      },
      {
        q: 'When is brute-force exact search the RIGHT engineering choice?',
        o: [
          'Never in production',
          'Below roughly 100k vectors — O(n·d) is fast enough, with perfect recall and zero index ops',
          'Only during development',
          'When using Euclidean distance',
        ],
        x: 1,
        w: 'Exact search at small n is faster to build, perfectly accurate, and has no tuning surface. ANN indexes are a scale tool, earned by n and QPS — the Day 22 lesson in production clothes.',
        revisit: 115,
      },
      {
        q: 'Your embedding model outputs unit-normalized vectors. Choosing cosine vs dot product vs Euclidean changes…',
        o: [
          'Everything — rankings differ completely',
          'Nothing about the RANKING — all three order unit vectors identically',
          'Only recall',
          'Only index build time',
        ],
        x: 1,
        w: 'For unit-length vectors the three metrics are monotonic transforms of each other, so top-k order is identical. The choice only bites with unnormalized vectors, where dot product rewards magnitude.',
        revisit: 50,
      },
    ],
    resources: [
      { label: 'Chroma — getting started (client, collections, query)', url: 'https://docs.trychroma.com/docs/overview/getting-started', type: 'docs', time: '20 min' },
      { label: 'Pinecone Learning Center — HNSW & vector indexes', url: 'https://www.pinecone.io/learn/', type: 'article', time: '25 min' },
      { label: 'Sentence-Transformers — pretrained embedding models', url: 'https://sbert.net/', type: 'docs', time: '15 min' },
      { label: 'Qdrant docs — filtering & payloads', url: 'https://qdrant.tech/documentation/', type: 'docs', time: '15 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep: due cards + explain chunk-size trade-off aloud (D114)', minutes: 10 },
      { activity: 'ELI5 + tech read; vector-search visualizer (watch HNSW hop)', minutes: 25 },
      { activity: 'Guided: VecStore contract + Chroma lab', minutes: 40 },
      { activity: 'Practice: find the exact-search cliff', minutes: 20 },
      { activity: 'Project: build_index.py dry run', minutes: 20 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'VecStore demonstrates add/upsert/query-with-filter; upsert lifecycle explained',
      'Chroma lab run locally (or fully traced if browser-only) — the D113 failing query now retrieves correctly',
      'Exact-search cliff measured with the linear ratio confirmed',
      'build_index.py committed with passing smoke test',
      'Quiz ≥ 2/3',
    ],
    connections: {
      back: 'Day 50\'s cosine similarity and Day 92\'s map of meaning are now infrastructure. Day 22\'s growth-shape reasoning told you exactly when brute force dies — today you measured the cliff yourself.',
      forward: 'Day 116 fuses this dense index with BM25 because embeddings still miss exact identifiers. Day 119 points build_index.py at the capstone corpus, and Day 149 puts the vector DB into your docker-compose stack.',
    },
    flashcards: [
      { f: 'What does HNSW trade for its speed?', b: 'A sliver of recall: multi-layer neighborhood graph gives ~log(n) search but can miss the true nearest neighbor.' },
      { f: 'Embedding-model lock-in — what and why?', b: 'Every stored vector encodes the model version; changing models means re-embedding the whole corpus. Vectors across models are incomparable.' },
      { f: 'Cosine vs dot vs Euclidean on unit vectors?', b: 'Identical rankings — the metrics only diverge on unnormalized vectors, where dot product rewards magnitude.' },
      { f: 'Why deterministic chunk IDs (source#section#i)?', b: 'Upsert then REPLACES a changed doc\'s vectors instead of duplicating them — the doc-update lifecycle depends on stable keys.' },
      { f: 'When is exact (brute-force) search correct in production?', b: 'Small corpora (≲100k vectors): O(n·d) is fast, recall is perfect, zero index tuning. ANN is earned by scale.' },
      { f: 'What are metadata filters for in RAG?', b: 'Scoping retrieval — per-source, per-section, per-user permissions. Must be applied during (not after) ANN traversal.' },
    ],
    deepDive: [
      { label: 'pgvector — vectors inside Postgres', note: 'If the customer already runs Postgres, one extension gives vectors + SQL + transactions with no new infra: a very common FDE recommendation. Compare its IVFFlat vs HNSW index options.' },
    ],
  },
  {
    id: 'd116', day: 116, week: 17, phase: 6, kind: 'lesson',
    title: 'Hybrid Search',
    analogy: 'Smell plus card catalog',
    objectives: [
      'Name the characteristic failure modes of dense retrieval and of lexical retrieval, with examples',
      'Implement BM25 from scratch and explain what each term in the formula rewards',
      'Fuse dense and lexical rankings with reciprocal rank fusion (RRF) and justify rank-based fusion over score mixing',
      'Layer metadata filters, recency, and source weighting onto hybrid retrieval',
    ],
    prereqs: [
      { day: 115, label: 'Embeddings & vector DBs' },
      { day: 114, label: 'Chunking strategies' },
    ],
    eli5: `A bloodhound finds things by smell — it doesn't need the exact name, just the scent of the thing. Ask it for "something about taking time off" and it happily leads you to the vacation shelf. But ask it for "form W-4991-B" and the bloodhound is useless: form numbers have no smell. The card catalog is the opposite: type "W-4991-B" and it finds the exact card instantly — but ask it for "time off" when every card says "vacation" and it returns nothing at all.

Dense retrieval (embeddings) is the bloodhound: brilliant at meaning, blind to exact strings — error codes, SKUs, function names, people's names all smell like nothing. Lexical retrieval (BM25, the algorithm behind classic search engines) is the card catalog: exact words or bust. Hybrid search runs BOTH on every query and merges the two ranked lists, so "why am I getting ERR-4092 after taking time off" — half jargon, half meaning — finds both halves. The merge trick, reciprocal rank fusion, is delightfully dumb: ignore the incomparable scores, reward whatever ranks high on either list.`,
    why: `Real user queries are full of unsmellable tokens — ticket numbers, product codes, API names, invoice IDs — and pure-dense RAG systems fail on exactly the queries enterprise users care most about. "Why didn't it find ERR-4092?" is a bug you will personally field as an FDE. Every serious vector DB (Qdrant, Weaviate, Pinecone, pgvector+tsvector) now ships hybrid because pure dense lost this fight in production. Your capstone's retrieval layer (Day 119) is hybrid from v0, and interviewers love asking "when does semantic search fail?" — today you'll have a crisp, example-backed answer.`,
    tech: `**BM25** is the workhorse of lexical ranking. For each query term it multiplies an IDF factor (rarer word → more informative: "ERR-4092" beats "the") by a saturated term-frequency factor: tf·(k1+1) / (tf + k1·(1 − b + b·dl/avgdl)). The saturation (k1 ≈ 1.2–2.0) means the 10th occurrence of a word adds little — no keyword-stuffing wins — and the length normalization (b ≈ 0.75) stops long documents from winning by sheer bulk. BM25 needs an inverted index (term → posting list of docs), which is O(1)-ish per term at query time; it's the algorithm inside Elasticsearch/Lucene and Postgres full-text search.

### Complementary failure modes

Dense fails on: exact identifiers (codes, SKUs, names), out-of-vocabulary jargon coined after the embedding model trained, negation subtleties, and very short queries. Lexical fails on: synonymy ("time off"/"vacation"), paraphrase, cross-lingual queries, and misspellings (partially). The sets barely overlap — which is precisely why fusion works.

### Reciprocal rank fusion

You cannot average a cosine similarity (0.83) with a BM25 score (14.7) — different scales, different distributions, and score calibration drifts with corpus stats. **RRF** sidesteps calibration entirely: fused(d) = Σ over systems 1/(k + rank_s(d)), with k ≈ 60. A document ranked #1 by dense and #3 by BM25 scores 1/61 + 1/63 — beating anything only one system liked. Because it uses ranks, not scores, RRF is robust, parameter-light, and extensible to three or more retrievers (add a recency-sorted list as a third "system" and fresh docs get a structured boost). The alternative — weighted score fusion after min-max normalization — can outperform tuned-per-corpus, but is fragile; start with RRF.

### The full retrieval layer

Production retrieval = metadata filter (permissions, source scoping) applied to BOTH retrievers → dense top-20 + BM25 top-20 → RRF → top-k onward. Recency and source authority enter either as fusion lists or as multiplicative boosts AFTER fusion (e.g. ×1.2 for official docs, decay by document age for news-like corpora). Keep boosts out of the stored scores; apply them at query time so policy changes don't force re-indexing. Tomorrow a reranker (Day 117) sits after fusion to polish the final ordering.`,
    viz: null,
    guided: [
      {
        title: 'BM25 from scratch, then watch each retriever fail',
        minutes: 25,
        body: `1. Create \`hybrid_lab.py\` with the starter code: a compact BM25 class, the synonym-aware dense stand-in from Day 113 (upgraded with a tiny synonym map so it behaves like real embeddings on this corpus), and a shared 6-doc corpus.
2. Run query A: "what does ERR-4092 mean". Confirm BM25 nails it (#1) and dense flails — the code shares almost no "meaning" tokens with anything.
3. Run query B: "how much time off can I carry into next year". Confirm dense nails it (the synonym map bridges time off → vacation) and BM25 returns near-zero scores.
4. Read the BM25 \`score\` method against the formula in the tech section: point to the IDF line, the saturation constant k1, and the length-normalization term b. Change k1 to 0 and re-run — term frequency now barely matters. Put it back.
5. Record both failure cases; the next exercise fuses them.`,
        code: `import math, re
from collections import Counter

def tok(t): return re.findall(r"[a-z0-9-]+", t.lower())

CORPUS = {
    "hb-01": "Employees accrue 1.5 vacation days per month. Up to 10 unused vacation days roll over to the next year.",
    "hb-02": "Parental leave is 16 weeks fully paid for all new parents.",
    "hb-03": "Purchases over 500 USD require manager pre-approval and a receipt.",
    "prod-1": "Error ERR-4092 means the monthly API quota is exhausted. Upgrade the plan or wait for the quota reset.",
    "prod-2": "The Insights API rate limit is 120 requests per minute per key.",
    "sec-01": "Report a lost laptop to security within 4 hours. Full-disk encryption is mandatory.",
}

class BM25:
    def __init__(self, docs, k1=1.5, b=0.75):
        self.ids = list(docs)
        self.toks = {i: tok(d) for i, d in docs.items()}
        self.N = len(docs)
        self.avgdl = sum(len(t) for t in self.toks.values()) / self.N
        self.df = Counter(w for t in self.toks.values() for w in set(t))
        self.k1, self.b = k1, b
    def idf(self, w):
        return math.log((self.N - self.df[w] + 0.5) / (self.df[w] + 0.5) + 1)
    def score(self, q, i):
        tf, dl, s = Counter(self.toks[i]), len(self.toks[i]), 0.0
        for w in tok(q):
            if tf[w] == 0: continue
            sat = tf[w] * (self.k1 + 1) / (tf[w] + self.k1 * (1 - self.b + self.b * dl / self.avgdl))
            s += self.idf(w) * sat          # rare-word weight x saturated tf
        return s
    def rank(self, q):
        return sorted(self.ids, key=lambda i: -self.score(q, i))

# dense stand-in: bag-of-words + a synonym map simulating what real
# embeddings learn ("time off" lives near "vacation" on the map of meaning)
SYN = {"time": "vacation", "off": "vacation", "pto": "vacation", "carry": "roll",
       "year": "year", "laptop": "laptop", "stolen": "lost"}
def dense_vec(t):
    return Counter(SYN.get(w, w) for w in tok(t))
def cosine(a, b):
    dot = sum(a[w] * b[w] for w in a if w in b)
    na, nb = math.sqrt(sum(v*v for v in a.values())), math.sqrt(sum(v*v for v in b.values()))
    return dot / (na * nb) if na and nb else 0.0
DENSE = {i: dense_vec(d) for i, d in CORPUS.items()}
def dense_rank(q):
    qv = dense_vec(q)
    return sorted(CORPUS, key=lambda i: -cosine(qv, DENSE[i]))

bm25 = BM25(CORPUS)
for q in ["what does ERR-4092 mean",
          "how much time off can I carry into next year"]:
    print("Q:", q)
    print("  bm25 :", [(i, round(bm25.score(q, i), 2)) for i in bm25.rank(q)[:3]])
    print("  dense:", [(i, round(cosine(dense_vec(q), DENSE[i]), 3)) for i in dense_rank(q)[:3]])`,
      },
      {
        title: 'Reciprocal rank fusion — ten lines that fix both',
        minutes: 15,
        body: `1. Append the RRF function below to \`hybrid_lab.py\`.
2. Run both yesterday's failing queries through \`hybrid\`. Confirm each now ranks its correct doc #1: RRF trusts whichever system is confident, because the OTHER system's noise lands at deep ranks worth almost nothing (1/(60+5) ≈ 0.015).
3. Run the mixed query "ERR-4092 while on time off" and inspect the fused list: both prod-1 and hb-01 should surface — neither retriever alone puts both in its top-2.
4. Change k from 60 to 1 and re-run: small k over-trusts rank #1 of each list; large k flattens everything. See why 60 is the boring, robust default.
5. Add a third list: docs sorted by a fake \`updated\` date, and fuse all three. Fresher docs get a bounded nudge — this is recency weighting without touching stored scores.`,
        code: `def rrf(rankings, k=60):
    """rankings: list of ranked id-lists from different retrievers."""
    scores = {}
    for ranking in rankings:
        for rank, id in enumerate(ranking, start=1):
            scores[id] = scores.get(id, 0.0) + 1.0 / (k + rank)
    return sorted(scores.items(), key=lambda kv: -kv[1])

def hybrid(q, k=60):
    return rrf([bm25.rank(q), dense_rank(q)], k=k)

for q in ["what does ERR-4092 mean",
          "how much time off can I carry into next year",
          "ERR-4092 while on time off"]:
    print("Q:", q)
    for id, s in hybrid(q)[:3]:
        print(f"   {s:.4f}  {id}  {CORPUS[id][:50]}")

# recency as a third fused system
UPDATED = {"hb-01": "2026-05", "hb-02": "2024-01", "hb-03": "2025-11",
           "prod-1": "2026-07", "prod-2": "2026-06", "sec-01": "2023-08"}
by_recency = sorted(CORPUS, key=lambda i: UPDATED[i], reverse=True)
print("\\nwith recency:", rrf([bm25.rank("quota"), dense_rank("quota"), by_recency])[:3])`,
      },
    ],
    practice: [
      {
        title: 'Build the query zoo',
        minutes: 20,
        body: `Create \`query_zoo.md\` plus code: 9 queries against today's corpus (extend it to ~10 docs first) — 3 where BM25 must win, 3 where dense must win, 3 mixed. For each, record the top-2 from bm25-only, dense-only, and hybrid, and mark which systems got it right. Deliverable: a table plus a 3-sentence conclusion on WHEN hybrid pays.

Constraints: at least one query with a misspelling, one with an exact identifier, one pure paraphrase. Hints: identifiers and rare jargon → lexical; paraphrase/synonyms → dense; misspellings hurt both, which is a preview of query rewriting (Day 117).`,
      },
    ],
    project: {
      title: 'Hybrid retrieval module for the capstone',
      brief: `Refactor today's lab into \`retrieval.py\`, a clean module your capstone imports on Day 119: \`class HybridRetriever\` wrapping a BM25 index and your Day 115 VecStore over the SAME chunk IDs, with \`search(query, k=5, where=None)\` that (1) applies metadata filters to both retrievers BEFORE ranking, (2) fuses with RRF, (3) returns (id, fused_score, text, metadata) tuples, and (4) exposes \`explain(query)\` returning both raw rankings for debugging — the tool you will reach for every time retrieval looks wrong. Include 5 pytest cases from your query zoo.`,
      rubric: [
        'Single ingest path keeps BM25 and vector index in lockstep over shared chunk IDs',
        'Metadata filter applied pre-ranking in both retrievers, verified by a test',
        'RRF fusion with configurable k; default 60',
        'explain() shows per-retriever rankings side by side',
        'Five query-zoo tests pass, covering identifier, paraphrase, and mixed queries',
        'Committed to the practice repo',
      ],
    },
    mistakes: [
      'Averaging raw BM25 and cosine scores. They live on different scales and distributions — fuse ranks (RRF) or normalize very carefully; never mix raw scores.',
      'Assuming embeddings handle everything and lexical search is legacy. Exact identifiers, fresh jargon, and names have no semantic neighborhood; dense-only RAG fails its most valuable enterprise queries.',
      'Tokenizing away the identifiers ("ERR-4092" split into "err" and "4092"). Your lexical tokenizer must preserve codes, or the card catalog loses its one superpower.',
      'Filtering after fusion. Apply metadata/permission filters inside both retrievers, or fused top-k can be entirely filtered away — returning nothing for valid queries.',
      'Letting the two indexes drift. If chunks are re-ingested into the vector store but not the BM25 index (or vice versa), fusion silently degrades — one ingest path, two indexes, same IDs.',
      'Boosting recency by mutating stored scores at ingest. Bake policy into query-time fusion instead, so changing the boost never requires re-indexing.',
    ],
    quiz: [
      {
        q: 'A user searches "invoice INV-88291 status" and your dense-only RAG returns generic billing docs. Root cause?',
        o: [
          'The chunks are too big',
          'Exact identifiers have no meaningful embedding neighborhood — this is the canonical lexical-retrieval query',
          'The model temperature is too high',
          'The vector index recall is too low',
        ],
        x: 1,
        w: 'INV-88291 "smells like nothing" — embeddings can\'t place it near anything specific. BM25\'s IDF makes rare exact tokens dominate. This is the case FOR hybrid.',
        revisit: 116,
      },
      {
        q: 'Why does RRF fuse ranks instead of scores?',
        o: [
          'Ranks are faster to compute',
          'BM25 and cosine scores are on incomparable scales and drift with corpus statistics; ranks need no calibration',
          'Scores are secret in most vector DBs',
          'RRF was designed before scores existed',
        ],
        x: 1,
        w: 'A cosine of 0.83 and a BM25 of 14.7 cannot be averaged meaningfully. 1/(k+rank) uses only ordering, making fusion robust across retrievers and corpora — and trivially extensible to a third list.',
        revisit: 116,
      },
      {
        q: 'In BM25, what does the k1 saturation term prevent?',
        o: [
          'Long documents from ranking well',
          'A word repeated 50 times from scoring ~50x a single occurrence — diminishing returns per repeat kills keyword stuffing',
          'Rare words dominating',
          'Stop words being indexed',
        ],
        x: 1,
        w: 'Term frequency saturates: tf·(k1+1)/(tf+k1·…) flattens as tf grows. Length normalization (b) is the separate term that handles long documents.',
        revisit: 116,
      },
    ],
    resources: [
      { label: 'Pinecone — getting started with hybrid search', url: 'https://www.pinecone.io/learn/hybrid-search-intro/', type: 'article', time: '20 min' },
      { label: 'Qdrant docs — hybrid queries & sparse vectors', url: 'https://qdrant.tech/documentation/', type: 'docs', time: '20 min' },
      { label: 'Pinecone Learning Center — BM25 & sparse retrieval', url: 'https://www.pinecone.io/learn/', type: 'article', time: '15 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep: due cards + recite HNSW trade-off from memory (D115)', minutes: 10 },
      { activity: 'ELI5 + tech read; trace the BM25 formula term by term', minutes: 25 },
      { activity: 'Guided: BM25 from scratch + RRF fusion', minutes: 40 },
      { activity: 'Practice: query zoo', minutes: 20 },
      { activity: 'Project: HybridRetriever module', minutes: 20 },
      { activity: 'Quiz + flashcards', minutes: 5 },
    ],
    completion: [
      'BM25 implemented; both single-retriever failure modes demonstrated',
      'RRF fixes both failing queries; k sensitivity explored',
      'Query zoo table with 9 queries and a written conclusion',
      'retrieval.py committed with 5 passing tests',
      'Quiz ≥ 2/3',
    ],
    connections: {
      back: 'Day 115 built the bloodhound; today you built the card catalog it was missing — with Day 23\'s hashing (inverted index) and Day 62\'s information-as-surprise (IDF is literally rarity-as-informativeness) doing the work.',
      forward: 'Day 117 adds a reranker after fusion, and Day 119 wires HybridRetriever into your capstone v0. On Day 136 you\'ll measure exactly how much hybrid lifts retrieval recall over either retriever alone.',
    },
    flashcards: [
      { f: 'Dense retrieval\'s characteristic failures?', b: 'Exact identifiers (codes, SKUs, names), post-training jargon, very short queries — tokens with no semantic neighborhood.' },
      { f: 'Lexical (BM25) retrieval\'s characteristic failures?', b: 'Synonymy and paraphrase ("time off" vs "vacation"), cross-lingual queries — exact words or nothing.' },
      { f: 'RRF formula?', b: 'fused(d) = Σ 1/(k + rank_s(d)) over each retriever s; k ≈ 60. Rank-based, calibration-free.' },
      { f: 'BM25\'s two moderating terms?', b: 'k1 saturates term frequency (anti-stuffing); b normalizes by doc length (anti-bulk). IDF weights rarity.' },
      { f: 'Where do permission filters go in hybrid search?', b: 'Inside BOTH retrievers, before ranking — post-fusion filtering can empty the result set.' },
    ],
    deepDive: [
      { label: 'Learned sparse retrieval (SPLADE-style)', note: 'A neural model that outputs weighted term expansions — lexical precision with learned synonyms, one index instead of two. The best of both, at higher serving cost.' },
    ],
  },
  {
    id: 'd117', day: 117, week: 17, phase: 6, kind: 'lesson',
    title: 'Reranking & Query Transforms',
    analogy: 'The librarian double-checks the pile',
    objectives: [
      'Explain bi-encoder vs cross-encoder architectures and why cross-encoders judge relevance better',
      'Justify two-stage retrieval economics: cheap recall over millions, expensive precision over twenty',
      'Apply query rewriting, expansion, and HyDE, and say which failure each one targets',
      'Implement parent-child (small-to-big) retrieval and measure a precision@k improvement',
    ],
    prereqs: [
      { day: 116, label: 'Hybrid search' },
      { day: 115, label: 'Embeddings & vector DBs' },
      { day: 94, label: 'Attention (Q/K/V)' },
    ],
    eli5: `The library assistant sprints through the stacks and returns with twenty books that "seem about right" — fast, because she only glanced at the spines. Then the senior librarian sits down with your actual question, opens each of the twenty books, reads a page of each WHILE re-reading your question, and hands you the best three in order. Slow per book — which is exactly why she only does it for twenty, never for the whole library.

That's two-stage retrieval. Stage one (your bi-encoder embeddings + BM25) is the sprinter: it compressed every book into a point on the map long before you arrived, so it can't consider your specific question deeply. Stage two, the reranker, is a cross-encoder: it reads query and document TOGETHER, letting every word of one attend to every word of the other, and scores the pair properly. And sometimes the librarian fixes your QUESTION before searching: "the thing where salary keeps coming when you have a baby?" becomes "parental leave pay policy" — query rewriting. Or she imagines what the perfect answering page would look like and searches for THAT — that trick is called HyDE.`,
    why: `Reranking is the highest-leverage single upgrade in most RAG stacks — teams routinely report the largest quality jump per line of code changed, because stage one optimizes recall ("is the answer somewhere in these 20?") while the LLM needs precision ("are the top 3 actually it?"). It also fights lost-in-the-middle (Day 104): reranking puts the best chunk first, where the model actually reads. Query transforms attack the other half of failures — bad queries, not bad indexes. As an FDE, "we added a reranker and rewrote queries" is the before/after demo that wins renewals; expect interview questions on bi- vs cross-encoders verbatim.`,
    tech: `### Bi-encoder vs cross-encoder

A **bi-encoder** (your embedding model) encodes query and document *separately* into vectors; relevance ≈ cosine of two independent compressions. This is what makes indexing possible — documents embed once, offline — but nothing in the document's vector knows what today's query is. A **cross-encoder** concatenates [query, document] into ONE input and runs full attention across the pair (Day 94's everyone-looks-at-everyone, spanning both texts), outputting a relevance score. It captures exact interactions — negation, entity matching, "does this SPECIFIC clause answer this SPECIFIC question" — and consistently ranks better. The catch: no precomputation possible; scoring is one forward pass per (query, doc) pair. Hence the **two-stage economics**: stage one narrows millions → 20–50 candidates in milliseconds; the cross-encoder spends ~10–50 ms/pair only on those. Reranking the whole corpus would take hours; reranking 20 takes under a second. (Options: open cross-encoders via sentence-transformers, hosted APIs like Cohere Rerank, or an LLM-as-reranker prompt — decreasing setup cost, increasing per-call cost.)

### Query transforms — fix the question, not the index

- **Rewriting**: an LLM turns conversational mush ("what about the thing we discussed re: expenses?") into a self-contained query, resolving pronouns from chat history. Essential for multi-turn RAG.
- **Expansion**: generate synonym/related-term variants, retrieve for each, fuse with RRF (Day 116's trick, reused).
- **HyDE** (Hypothetical Document Embeddings): have the LLM *hallucinate* a plausible answer document, then embed THAT instead of the query. Works because doc-to-doc similarity beats query-to-doc similarity — the hypothetical answer lives in the same neighborhood as the real one, even when its facts are wrong. Wrong facts, right vocabulary, right neighborhood.
- **Decomposition** (preview of Day 118): split multi-part questions into sub-queries.

### Small-to-big (parent-child) retrieval

Resolve Day 114's size dilemma structurally: index SMALL child chunks (crisp, single-topic vectors → precise matching) but store each child's parent ID, and at answer time deliver the PARENT (full section) to the LLM. Retrieve on precision, generate on completeness. Measure everything with **precision@k** (fraction of top-k that are relevant) and **recall@k** against a small labeled set — you build that harness today and industrialize it on Day 136.`,
    viz: 'rerank-flow',
    guided: [
      {
        title: 'Two-stage retrieval with a measurable precision@3 gain',
        minutes: 25,
        body: `1. Create \`rerank_lab.py\` with the starter code. Stage one is Day 116's hybrid retriever over a 12-chunk corpus with several near-miss distractors. Stage two is a simulated cross-encoder: it scores (query, doc) PAIRS using phrase-level evidence — bigram matches and coverage of query terms — which a bag-of-words bi-encoder structurally cannot see. (In local runs you'd swap in sentence-transformers' CrossEncoder — the harness is identical.)
2. Run the labeled eval: 5 queries, each with known relevant chunk IDs. The script prints precision@3 for stage-one-only vs reranked.
3. Confirm the mechanism on query 1: stage one ranks the distractor ("vacation REQUEST process") above the answer ("vacation ACCRUAL policy") because single words overlap; the pair-scorer sees the bigram "roll over" and flips them.
4. Record your precision@3 lift. Then set RERANK_DEPTH to 3 (rerank only stage one's top-3) and watch the gain shrink: a reranker cannot promote what stage one never fetched. Recall first, then precision.`,
        code: `import math, re
from collections import Counter

CHUNKS = {
    "hr-1": "Vacation accrual policy: 1.5 days per month accrue; up to 10 unused days roll over into next year.",
    "hr-2": "Vacation request process: submit requests in Workday at least 2 weeks ahead.",
    "hr-3": "Sick leave: unlimited with manager notification; doctor note after 5 consecutive days.",
    "hr-4": "Parental leave is 16 weeks fully paid, plus 4-week flexible return.",
    "fin-1": "Purchases over 500 USD require manager pre-approval before purchase.",
    "fin-2": "Expense reports are due within 30 days; late reports need VP sign-off.",
    "fin-3": "Corporate card holders must reconcile statements monthly.",
    "it-1": "Password policy: 14+ characters, rotated yearly, MFA everywhere.",
    "it-2": "Lost laptops: report to security within 4 hours; remote wipe follows.",
    "api-1": "ERR-4092 means monthly API quota exhausted; upgrade plan or wait for reset.",
    "api-2": "Insights API rate limit is 120 requests per minute per key.",
    "api-3": "API keys rotate every 90 days via the developer console.",
}
# labeled eval set: query -> relevant chunk ids
EVAL = [
    ("how many unused vacation days roll over", {"hr-1"}),
    ("do I need approval before buying a 700 dollar monitor", {"fin-1"}),
    ("stolen laptop what do I do", {"it-2"}),
    ("why does the api say quota exhausted", {"api-1"}),
    ("deadline for submitting expenses", {"fin-2"}),
]

def tok(t): return re.findall(r"[a-z0-9-]+", t.lower())
def vec(t): return Counter(tok(t))
def cosine(a, b):
    dot = sum(a[w] * b[w] for w in a if w in b)
    na, nb = math.sqrt(sum(v*v for v in a.values())), math.sqrt(sum(v*v for v in b.values()))
    return dot / (na * nb) if na and nb else 0.0
VECS = {i: vec(c) for i, c in CHUNKS.items()}

def stage1(q, k=8):                      # bi-encoder-style: independent vectors
    qv = vec(q)
    return sorted(CHUNKS, key=lambda i: -cosine(qv, VECS[i]))[:k]

def cross_score(q, doc):
    """Simulated cross-encoder: judges the PAIR. Sees bigram evidence and
    query-term coverage — interactions invisible to independent embeddings.
    Locally: from sentence_transformers import CrossEncoder;
    CrossEncoder('cross-encoder/ms-marco-MiniLM-L6-v2').predict([(q, doc)])"""
    qt, dt = tok(q), tok(doc)
    dset = set(dt)
    coverage = sum(1 for w in set(qt) if w in dset) / max(len(set(qt)), 1)
    qbi = {(a, b) for a, b in zip(qt, qt[1:])}
    dbi = {(a, b) for a, b in zip(dt, dt[1:])}
    bigram = len(qbi & dbi)
    return 2.0 * bigram + coverage

RERANK_DEPTH = 8
def two_stage(q, k=3):
    cands = stage1(q, k=RERANK_DEPTH)
    return sorted(cands, key=lambda i: -cross_score(q, CHUNKS[i]))[:k]

def precision_at_k(ranked, relevant, k=3):
    return sum(1 for i in ranked[:k] if i in relevant) / k

p1 = p2 = 0
for q, rel in EVAL:
    s1, s2 = stage1(q, k=3), two_stage(q, k=3)
    p1 += precision_at_k(s1, rel); p2 += precision_at_k(s2, rel)
    print(f"Q: {q}\\n   stage1: {s1}   reranked: {s2}   relevant: {sorted(rel)}")
print(f"\\nprecision@3  stage1-only: {p1/len(EVAL):.2f}   reranked: {p2/len(EVAL):.2f}")`,
      },
      {
        title: 'Query transforms: rewrite, HyDE, small-to-big',
        minutes: 20,
        body: `1. Append the starter code. It demonstrates three transforms against the same corpus.
2. **Rewriting**: the conversational query "and what about carrying them over?" retrieves garbage alone. The rewritten, self-contained version (simulating what an LLM produces given chat history) retrieves hr-1. In production the rewrite prompt is: "Given the conversation, rewrite the last user message as a fully self-contained search query."
3. **HyDE**: the query "use it or lose it?" shares no vocabulary with any chunk. The fake hypothetical answer (write it yourself: one sentence a policy doc WOULD say) retrieves correctly — wrong facts, right vocabulary, right neighborhood. Verify by making your hypothetical say "20 days roll over" (factually wrong) and watching retrieval still succeed.
4. **Small-to-big**: sentences are indexed as children pointing at parent sections; retrieval matches a crisp sentence, but the returned context is the whole parent. Confirm the returned parent contains BOTH the accrual rate and the rollover cap — completeness the child alone lacked.`,
        code: `# --- 1. query rewriting (multi-turn) ---
history = ["user: how do vacation days accrue?",
           "assistant: 1.5 days per month.",
           "user: and what about carrying them over?"]
raw_q = "and what about carrying them over?"
rewritten = "how many unused vacation days carry over to next year"  # LLM output
print("raw:      ", stage1(raw_q, k=2))
print("rewritten:", stage1(rewritten, k=2))

# --- 2. HyDE: embed a hypothetical ANSWER, not the question ---
q = "use it or lose it?"
hyde_doc = ("Unused vacation days roll over to the next year up to a cap; "
            "days beyond the cap are forfeited.")            # LLM-imagined answer
print("query-embed:", stage1(q, k=2))
print("hyde-embed: ", stage1(hyde_doc, k=2))

# --- 3. small-to-big: index children, deliver parents ---
PARENTS = {
    "hr-A": "Vacation: employees accrue 1.5 days per month. Up to 10 unused days roll over into next year. Days beyond 10 are forfeited on Jan 1.",
    "fin-A": "Expenses: purchases over 500 USD need pre-approval. Reports due within 30 days. Late reports need VP sign-off.",
}
CHILDREN = {}   # child id -> (sentence, parent id)
for pid, ptext in PARENTS.items():
    for j, sent in enumerate(s.strip() for s in ptext.split(". ") if s.strip()):
        CHILDREN[f"{pid}#c{j}"] = (sent, pid)

def small_to_big(q, k=1):
    qv = vec(q)
    ranked = sorted(CHILDREN, key=lambda c: -cosine(qv, vec(CHILDREN[c][0])))
    out, seen = [], set()
    for cid in ranked:                       # dedupe children of same parent
        pid = CHILDREN[cid][1]
        if pid not in seen:
            seen.add(pid); out.append((cid, pid, PARENTS[pid]))
        if len(out) == k: break
    return out

for cid, pid, ptext in small_to_big("what happens to days beyond the cap"):
    print(f"matched child {cid} -> deliver parent {pid}:\\n   {ptext}")`,
      },
    ],
    practice: [
      {
        title: 'Rerank-depth economics memo',
        minutes: 18,
        body: `Your capstone will rerank with a cross-encoder at ~30 ms per (query, doc) pair, after a stage one that takes ~50 ms total. Write a short memo (code optional) answering: (1) total added latency at rerank depths 5, 20, 50, 100 assuming sequential scoring, then assuming batches of 16 scored in parallel at 40 ms/batch; (2) using your lab result that gains shrink with depth, which depth do you recommend for an interactive docs-QA UI with a 2-second answer budget, and why; (3) one situation where you would rerank with an LLM prompt instead of a cross-encoder.

Hints: depth × 30 ms sequential; ceil(depth/16) × 40 ms batched. LLM-as-reranker fits when volume is tiny and you already pay for the LLM call.`,
      },
    ],
    project: {
      title: 'Add rerank + transforms to the capstone retriever',
      brief: `Extend Day 116's \`retrieval.py\`: (1) a \`Reranker\` class with the pair-scoring interface (\`score(query, text) -> float\`), shipping today's heuristic scorer and a documented drop-in stub for sentence-transformers' CrossEncoder locally; (2) \`HybridRetriever.search(..., rerank_depth=20)\` running fuse-then-rerank; (3) a \`rewrite_query(history, query)\` hook that returns the prompt to send an LLM (string in, string out — testable without an API key); (4) the labeled 5-query eval from the lab as a pytest that asserts reranked precision@3 ≥ stage-one precision@3. Commit with before/after numbers in the README.`,
      rubric: [
        'Reranker interface identical for heuristic and CrossEncoder backends',
        'rerank_depth configurable; fuse-then-rerank order verified by a test',
        'Query-rewrite hook produces a self-contained query prompt from history',
        'Eval test passes: reranked precision@3 ≥ stage-one baseline',
        'README records the measured precision@3 lift',
        'Committed to the practice repo',
      ],
    },
    mistakes: [
      'Reranking to fix a recall problem. If the answer isn\'t in stage one\'s candidates, no reranker can surface it — widen k, fix chunking, or add hybrid FIRST; rerankers only reorder.',
      'Using a cross-encoder as the primary retriever. One forward pass per document per query does not scale past thousands of docs — that\'s the whole reason two stages exist.',
      'Confusing the two encoder types: bi-encoders embed separately (indexable, weaker); cross-encoders read the pair jointly (unindexable, stronger). Interviews ask exactly this.',
      'Skipping query rewriting in multi-turn chat. "What about the second one?" embeds to mush; conversational RAG without rewrite fails on most follow-ups.',
      'Expecting HyDE to add knowledge. It only fixes vocabulary mismatch by moving the query into document space; the hypothetical\'s wrong facts are never shown to the user.',
      'Measuring reranker value by vibes. Precision@k on a labeled query set is 20 lines of code (you wrote them today); without it you cannot justify the added latency.',
    ],
    quiz: [
      {
        q: 'Why can a cross-encoder outrank a bi-encoder on the same (query, document) pair?',
        o: [
          'It has more parameters',
          'Attention spans both texts jointly, capturing exact query-document interactions that two independent compressions lose',
          'It uses a better distance metric',
          'It is trained on more data',
        ],
        x: 1,
        w: 'A bi-encoder compresses each text alone — the doc vector can\'t know the query. The cross-encoder\'s attention lets every query token attend to every doc token (Day 94), scoring the actual pair.',
        revisit: 117,
      },
      {
        q: 'Retrieval recall@20 is 55% — the right chunk is usually absent from the top 20. Adding a reranker will…',
        o: [
          'Fix it — rerankers improve relevance',
          'Barely help: rerankers reorder existing candidates; missing chunks stay missing. Fix recall first (hybrid, chunking, more k)',
          'Fix it if depth is 20',
          'Double recall',
        ],
        x: 1,
        w: 'Two-stage division of labor: stage one owns recall, stage two owns precision. A reranker cannot promote what was never fetched — today\'s RERANK_DEPTH experiment showed the shrinking gain.',
        revisit: 117,
      },
      {
        q: 'What makes HyDE work despite the hypothetical document containing wrong facts?',
        o: [
          'The facts are usually right',
          'Doc-to-doc similarity: the fake answer shares vocabulary and style with real answer documents, landing in the right embedding neighborhood',
          'It fine-tunes the embedder',
          'It expands the context window',
        ],
        x: 1,
        w: 'Queries and documents are written differently; embedding an imagined ANSWER bridges that register gap. The hypothetical is only a search key — it is never shown to the user.',
        revisit: 117,
      },
    ],
    resources: [
      { label: 'Pinecone — rerankers & two-stage retrieval', url: 'https://www.pinecone.io/learn/series/rag/rerankers/', type: 'article', time: '25 min' },
      { label: 'HyDE paper — Precise Zero-Shot Dense Retrieval (Gao et al.)', url: 'https://arxiv.org/abs/2212.10496', type: 'paper', time: '25 min' },
      { label: 'Sentence-Transformers — cross-encoder usage', url: 'https://sbert.net/', type: 'docs', time: '15 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep: due cards + write the RRF formula from memory (D116)', minutes: 10 },
      { activity: 'ELI5 + tech read; rerank-flow visualizer', minutes: 20 },
      { activity: 'Guided: two-stage lab + query transforms', minutes: 45 },
      { activity: 'Practice: rerank-depth economics memo', minutes: 18 },
      { activity: 'Project: extend retrieval.py', minutes: 20 },
      { activity: 'Quiz + flashcards', minutes: 7 },
    ],
    completion: [
      'Precision@3 lift measured and the depth experiment explained',
      'All three transforms demonstrated, including the wrong-facts HyDE test',
      'Economics memo written with latency math',
      'retrieval.py extended; eval test green; lift recorded in README',
      'Quiz ≥ 2/3',
    ],
    connections: {
      back: 'Day 94\'s attention is literally why cross-encoders win — joint attention over the pair. Day 116\'s RRF reappears as the fusion step before reranking, and Day 114\'s size dilemma just got its structural fix in small-to-big.',
      forward: 'Day 118 chains these transforms into multi-hop and agentic retrieval. Your capstone v0 (Day 119) ships fuse-then-rerank, and Day 136 upgrades today\'s 5-query eval into a 40-case Ragas-style harness.',
    },
    flashcards: [
      { f: 'Bi-encoder vs cross-encoder in one line each?', b: 'Bi: embeds query and doc separately — indexable, weaker. Cross: attends over the pair jointly — unindexable, stronger. Hence two stages.' },
      { f: 'The two-stage division of labor?', b: 'Stage 1 (dense+BM25): recall over millions, cheap. Stage 2 (reranker): precision over ~20, expensive. Rerankers only reorder.' },
      { f: 'HyDE in one sentence?', b: 'Embed an LLM-imagined answer instead of the query — wrong facts, right vocabulary, lands in the answer\'s neighborhood.' },
      { f: 'Small-to-big retrieval?', b: 'Index small child chunks for crisp matching; deliver the parent section for complete context. Resolves the chunk-size dilemma.' },
      { f: 'precision@k vs recall@k?', b: 'precision@k: fraction of top-k that is relevant. recall@k: fraction of all relevant items that made top-k.' },
      { f: 'When is query rewriting mandatory?', b: 'Multi-turn chat — follow-ups like "what about the second one?" only retrieve after being rewritten into self-contained queries.' },
    ],
    deepDive: [
      { label: 'Lost-in-the-middle mitigation by ordering', note: 'After reranking, place the best chunk first and second-best last (ends of the context) rather than strictly in order — models attend to edges. Try it on Day 119.' },
    ],
  },
  {
    id: 'd118', day: 118, week: 17, phase: 6, kind: 'lesson',
    title: 'Advanced RAG Patterns',
    analogy: 'Beyond one shelf',
    objectives: [
      'Decompose multi-hop questions into dependent sub-queries and execute them sequentially',
      'Sketch when graph-RAG, RAPTOR-style summary trees, and agentic retrieval each earn their complexity',
      'Route between structured (SQL) and unstructured (vector) sources for a mixed question',
      'Assemble the week into a failure-mode taxonomy and a debugging flowchart you will use on the capstone',
    ],
    prereqs: [
      { day: 117, label: 'Reranking & query transforms' },
      { day: 113, label: 'RAG architecture' },
      { day: 111, label: 'Tool use & function calling' },
    ],
    eli5: `Some questions can't be answered from one shelf. "Did the author of our expense policy also write the security policy?" needs three trips: find who wrote the expense policy, find who wrote the security policy, compare. A single search for the whole question retrieves a muddle — no one page contains the answer, because the answer doesn't LIVE anywhere; it has to be assembled.

The advanced patterns are all ways of making multiple, smarter trips. Multi-hop decomposition breaks the question into steps where each search uses the previous answer. A summary tree (RAPTOR) adds "shelf summaries" and "floor summaries" to the library so zoomed-out questions ("what are the big themes?") have something zoomed-out to retrieve. Graph-RAG draws a map of which people, teams, and documents connect to each other, so "everything related to X" follows edges instead of similarity. And agentic retrieval hires the intern from next week early: let the model itself decide what to search next, look at what came back, and search again — an open-book exam where the student may return to the shelves as often as needed.`,
    why: `One-shot retrieval tops out fast on real corpora: enterprise users ask comparison questions, aggregate questions ("how many customers mentioned pricing?"), and questions whose answers span three systems — the exact queries that make naive RAG look broken in a pilot. Knowing which pattern fixes which failure — and that each adds latency, cost, and failure surface — is the difference between an engineer and a framework-user. The debugging flowchart you build today is a genuine FDE artifact: when a customer says "it answered wrong," you'll walk the flowchart live instead of shrugging. It also completes the mental model your capstone and Day 136's evals depend on.`,
    tech: `### Multi-hop & decomposition

An LLM splits the question into sub-queries; crucially, hops can be *dependent* — hop 2's query is written using hop 1's answer ("find X's author" → "find documents by ⟨that author⟩"). Execute sequentially, carry intermediate answers forward, then synthesize with all retrieved evidence cited. Cost: N retrievals + extra LLM calls; failure: a wrong hop-1 answer poisons hop 2 (verify intermediate answers when stakes are high).

### Structure-adding patterns

**RAPTOR** builds a tree at ingest: cluster chunks, summarize each cluster, cluster the summaries, repeat — then index ALL levels. Detail questions match leaves; thematic questions match high-level summaries; retrieval picks the right altitude. **Graph-RAG** extracts entities and relations at ingest into a knowledge graph; queries retrieve subgraphs (or graph-community summaries), excelling at "everything connected to X" and relationship questions that similarity search structurally misses. Both shift cost to ingest time and complicate updates — earn them with real query logs, not anticipation.

### Routing & structured+unstructured fusion

"How many support tickets mentioned refunds last quarter?" is a SQL question wearing a natural-language costume. A router (a small LLM classification call, Day 111's tool-choice pattern) sends aggregates to text-to-SQL over your warehouse, policy lookups to vector RAG, and mixed questions to both, with a synthesis step. Counting rows with a vector index is malpractice; quoting a policy with SQL is impossible — fusion is the point.

### Agentic retrieval & freshness

Give a model retrieval as a *tool* in a loop: search → read → decide "insufficient, search again with better terms" → stop when confident. This subsumes decomposition/rewriting (the model does them adaptively) at the price of latency, cost, and nondeterminism — the full treatment is Days 120–122. Meanwhile production corpora change daily: incremental indexing (re-chunk/re-embed only changed docs — your Day 115 stable-ID upserts), tombstoning deletions so stale chunks stop answering, and an index-freshness metric belong in your capstone's ingest design.

### The taxonomy

Every RAG failure you've met this week now has a name and a stage: missing doc (ingest), torn answer (chunking), vocabulary mismatch (dense retrieval), unsmellable identifier (lexical gap), right-pile-wrong-order (ranking), multi-part question (decomposition), aggregate question (routing), stale answer (freshness), unfaithful generation. Today you arrange them into a flowchart keyed on observable symptoms.`,
    viz: null,
    guided: [
      {
        title: 'Multi-hop over a corpus where one-shot fails',
        minutes: 25,
        body: `1. Create \`multihop_lab.py\` with the starter code: a corpus with document authorship facts and a hand-written two-hop plan for the question "Did the author of the expense policy also write the security policy?"
2. Run the one-shot baseline: the full question retrieves a muddle (verify: no single chunk contains the answer).
3. Run the multi-hop version: hop 1 retrieves the expense policy's author chunk; a tiny extractor pulls the name; hop 2's query is BUILT from that name; the synthesizer compares. Note the dependency — hop 2 could not have been written in advance.
4. Poison hop 1: change the extractor to return the wrong name and watch hop 2 confidently retrieve irrelevant evidence. Write one sentence on why intermediate verification matters.
5. In production the plan comes from an LLM ("split this question into sequential sub-queries; later queries may reference earlier answers as ⟨answer1⟩") — the printed PLAN_PROMPT shows exactly that prompt.`,
        code: `import math, re
from collections import Counter

CORPUS = {
    "meta-1": "The expense policy was written by Dana Okafor of the Finance team, last revised March 2026.",
    "meta-2": "The security policy was written by Priya Natarajan of the Security team.",
    "meta-3": "The vacation policy was written by Dana Okafor and approved by HR.",
    "hb-1": "Purchases over 500 USD require manager pre-approval.",
    "sec-1": "Laptops must use full-disk encryption; report loss within 4 hours.",
    "hr-1": "Employees accrue 1.5 vacation days per month.",
}
def vec(t): return Counter(re.findall(r"[a-z0-9-]+", t.lower()))
def cosine(a, b):
    dot = sum(a[w] * b[w] for w in a if w in b)
    na, nb = math.sqrt(sum(v*v for v in a.values())), math.sqrt(sum(v*v for v in b.values()))
    return dot / (na * nb) if na and nb else 0.0
V = {i: vec(c) for i, c in CORPUS.items()}
def retrieve(q, k=2):
    qv = vec(q)
    return sorted(CORPUS, key=lambda i: -cosine(qv, V[i]))[:k]

QUESTION = "Did the author of the expense policy also write the security policy?"

print("one-shot:", retrieve(QUESTION, k=3), "  <- muddle: answer spans two chunks")

# --- multi-hop: dependent sub-queries ---
hop1_q = "who wrote the expense policy"
hop1_hits = retrieve(hop1_q, k=1)
hop1_text = CORPUS[hop1_hits[0]]
m = re.search(r"written by ([A-Z][a-z]+ [A-Z][a-z]+)", hop1_text)
author = m.group(1) if m else "UNKNOWN"          # in prod: an LLM extraction call
print(f"hop1: {hop1_hits} -> author = {author}")

hop2_q = f"who wrote the security policy {author}"   # query BUILT from hop1
hop2_hits = retrieve(hop2_q, k=1)
hop2_text = CORPUS[hop2_hits[0]]
print(f"hop2: {hop2_hits} -> {hop2_text}")

same = author in hop2_text
print(f"synthesis: expense author is {author}; security policy chunk "
      f"{'names' if same else 'does not name'} them -> answer: {'Yes' if same else 'No'}")

PLAN_PROMPT = """Split the question into sequential sub-queries. Later
sub-queries may reference earlier answers as <answer1>, <answer2>.
Question: Did the author of the expense policy also write the security policy?
Sub-queries:
1. Who wrote the expense policy?
2. Did <answer1> write the security policy?"""
print("\\n--- the prompt that generates such plans ---\\n" + PLAN_PROMPT)`,
      },
      {
        title: 'Route the question: SQL, vectors, or both',
        minutes: 15,
        body: `1. Append the starter code: a mini "warehouse" (a list of ticket dicts), the vector corpus from exercise 1, and a keyword-based router standing in for an LLM classification call (the real router prompt is printed).
2. Run the three test questions: an aggregate ("how many tickets mention refunds"), a policy lookup ("what needs pre-approval"), and a mixed one ("are refund complaints against our stated policy?").
3. Verify the aggregate goes to the SQL-ish path and returns an exact count — then force it through vector retrieval instead and see why that's malpractice (it returns 2 example tickets, not a count).
4. For the mixed question, confirm both paths run and note what the synthesis step would need to cite: a number from one source, a quote from the other.`,
        code: `TICKETS = [
    {"id": 1, "text": "I want a refund for the annual plan", "quarter": "Q2"},
    {"id": 2, "text": "dashboard is slow", "quarter": "Q2"},
    {"id": 3, "text": "refund please, feature missing", "quarter": "Q2"},
    {"id": 4, "text": "love the product!", "quarter": "Q1"},
    {"id": 5, "text": "requesting refund per policy", "quarter": "Q1"},
]

def sql_count_mentions(term, quarter=None):
    rows = [t for t in TICKETS if term in t["text"].lower()
            and (quarter is None or t["quarter"] == quarter)]
    return len(rows)

def route(question):
    ql = question.lower()
    aggregate = any(w in ql for w in ["how many", "count", "average", "per quarter"])
    policyish = any(w in ql for w in ["policy", "allowed", "approval", "rule"])
    if aggregate and policyish: return "both"
    if aggregate: return "sql"
    return "vector"

ROUTER_PROMPT = """Classify the question as one of: sql (aggregate/count/trend
over records), vector (policy/docs lookup), both. Reply with the label only."""

for q in ["how many tickets mention refunds in Q2?",
          "what purchases need pre-approval?",
          "how many refund requests did we get, and is refusing them against policy?"]:
    r = route(q)
    print(f"\\nQ: {q}\\n  route -> {r}")
    if r in ("sql", "both"):
        print("  sql path: refund mentions =", sql_count_mentions("refund"))
    if r in ("vector", "both"):
        print("  vector path:", retrieve(q, k=1))
print("\\n(real router = one small LLM call with:\\n" + ROUTER_PROMPT + ")")`,
      },
    ],
    practice: [
      {
        title: 'Pattern-matching drill: prescribe, don\'t implement',
        minutes: 18,
        body: `For each symptom below, prescribe the cheapest adequate fix from this week's toolbox (chunking / hybrid / rerank / rewrite / HyDE / decomposition / RAPTOR / graph-RAG / routing / freshness), plus one sentence of reasoning. Then rank your prescriptions by implementation cost.

1. "Summarize our Q2 customer themes" retrieves five random specific tickets.
2. "Compare the old and new expense policies" answers from only one of them.
3. Follow-up questions in chat retrieve nonsense.
4. "Who has worked with vendor Acme across any team?" misses connections spread over many docs.
5. Answers cite a policy retired two months ago.
6. "SKU-9981 warranty length" returns unrelated warranty prose.

No peeking until done. Reasonable answers: 1 RAPTOR-style summaries (no zoomed-out chunks exist); 2 decomposition (two targeted retrievals + compare); 3 query rewriting; 4 graph-RAG (relationship question); 5 freshness/incremental indexing + tombstones; 6 hybrid (exact identifier).`,
      },
    ],
    project: {
      title: 'The RAG debugging flowchart',
      brief: `Create \`rag_debugging.md\` — the artifact you will physically use during the capstone and can show in interviews. Part 1: the failure taxonomy as a table (symptom → stage → root cause → fix → which day taught it) covering at least 9 failures from this week. Part 2: a flowchart (Mermaid or ASCII) starting from "answer is wrong" that branches on OBSERVABLE checks in debugging order: was the doc ingested? → is the fact intact in one chunk? → is that chunk in stage-one top-20? → in reranked top-3? → did the prompt contain it? → did the model use it faithfully? Each leaf names the fix. Part 3: three symptoms where the fix is an ADVANCED pattern (decomposition, routing, summaries), so you don't over-prescribe them for stage-level bugs. Commit it.`,
      rubric: [
        'Taxonomy table has ≥ 9 symptom rows, each mapped to stage, fix, and source day',
        'Flowchart branches only on checks you could actually run against logs/index',
        'Check order goes upstream-to-downstream (ingest before generation)',
        'Advanced patterns appear as leaves only where one-shot retrieval is structurally insufficient',
        'A teammate could triage a failure using only this file',
        'Committed to the practice repo',
      ],
    },
    mistakes: [
      'Prescribing agentic/multi-hop retrieval for stage-level bugs. If the chunk was torn or the identifier unsmellable, fix chunking or add BM25 — advanced patterns multiply cost and failure surface.',
      'Letting hop-2 run on an unverified hop-1 answer. Dependent hops compound errors; verify intermediate extractions (or at least carry confidence forward) when hops chain.',
      'Answering aggregate questions from a vector index. "How many…" needs SQL over records; similarity search returns examples, not counts — route, don\'t retrieve.',
      'Building RAPTOR trees or knowledge graphs before query logs demand them. Both are heavy at ingest and painful on updates; earn them with observed thematic/relationship queries.',
      'Forgetting deletions. Removing a doc from the source without tombstoning its chunks means the retired policy keeps answering — freshness includes forgetting.',
      'Treating the debugging flowchart as documentation. It is a runbook: walk it top-down on every capstone failure, and update it when a new failure class appears.',
    ],
    quiz: [
      {
        q: '"Which of our policies were written by the same person?" fails with one-shot retrieval because…',
        o: [
          'The chunks are too small',
          'The answer exists in no single chunk — it must be assembled across documents (multi-hop / graph territory)',
          'The embedding model is weak',
          'Top-k is too low',
        ],
        x: 1,
        w: 'Comparison and relationship answers are synthesized, not stored. Decomposition makes multiple targeted trips; graph-RAG precomputes the relationships at ingest.',
        revisit: 118,
      },
      {
        q: 'A user asks "how many tickets mentioned refunds last quarter?" The correct architecture move is…',
        o: [
          'Increase top-k so more tickets are retrieved',
          'Route to text-to-SQL over the ticket store; vector search returns examples, never trustworthy counts',
          'Use HyDE',
          'Chunk tickets smaller',
        ],
        x: 1,
        w: 'Aggregates are structured queries in natural-language costume. A router sends them to SQL; retrieval handles the unstructured half of mixed questions.',
        revisit: 118,
      },
      {
        q: 'What problem do RAPTOR-style summary trees solve?',
        o: [
          'Slow ingest',
          'Thematic/zoomed-out questions have nothing to match — leaves are all detail; the tree indexes summaries at multiple altitudes',
          'Embedding cost',
          'Prompt injection',
        ],
        x: 1,
        w: '"What are the main themes?" can\'t match any detail chunk. Clustering and summarizing recursively creates retrievable zoomed-out chunks, letting retrieval pick its altitude.',
        revisit: 118,
      },
    ],
    resources: [
      { label: 'RAPTOR paper — recursive abstractive retrieval (Sarthi et al.)', url: 'https://arxiv.org/abs/2401.18059', type: 'paper', time: '30 min' },
      { label: 'LlamaIndex — advanced retrieval (routing, sub-questions)', url: 'https://developers.llamaindex.ai/python/framework/', type: 'docs', time: '25 min' },
      { label: 'Anthropic — building effective agents (augmented LLM & routing sections)', url: 'https://www.anthropic.com/research/building-effective-agents', type: 'article', time: '20 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep: due cards + bi- vs cross-encoder from memory (D117)', minutes: 10 },
      { activity: 'ELI5 + tech read', minutes: 25 },
      { activity: 'Guided: multi-hop + routing labs', minutes: 40 },
      { activity: 'Practice: prescription drill', minutes: 18 },
      { activity: 'Project: debugging flowchart', minutes: 22 },
      { activity: 'Quiz + flashcards', minutes: 5 },
    ],
    completion: [
      'Multi-hop lab run, including the poisoned-hop experiment',
      'Router demonstrated on all three question types, with the malpractice case shown',
      'All six prescriptions reasoned and cost-ranked',
      'rag_debugging.md committed with taxonomy + flowchart',
      'Quiz ≥ 2/3',
    ],
    connections: {
      back: 'This day is Week 17\'s synthesis: Day 113\'s stages became Day 114–117\'s fixes, and today\'s taxonomy files every one of them. The router is Day 111\'s tool-choice pattern pointed at data sources.',
      forward: 'Tomorrow (Day 119) the capstone kicks off and your flowchart becomes a living runbook. Agentic retrieval gets its full treatment as the agent loop on Days 120–122, and Day 136 turns each taxonomy row into a metric.',
    },
    flashcards: [
      { f: 'Multi-hop retrieval\'s defining feature?', b: 'Dependent sub-queries: hop 2\'s query is constructed from hop 1\'s answer. Sequential execution; verify intermediate answers.' },
      { f: 'When does graph-RAG beat similarity search?', b: 'Relationship/connection questions ("everything touching X") — answers that live in edges between entities, not in any chunk.' },
      { f: 'RAPTOR in one line?', b: 'Cluster chunks, summarize, recurse; index every level so retrieval can match at the right altitude (detail vs theme).' },
      { f: 'The routing rule for aggregate questions?', b: '"How many / average / trend" → SQL over records. Vector search returns examples, not counts. Mixed questions run both + synthesize.' },
      { f: 'Freshness triad for a changing corpus?', b: 'Incremental re-index of changed docs (stable-ID upserts), tombstone deletions, monitor index staleness.' },
      { f: 'First question in the RAG debugging flowchart?', b: '"Was the doc ingested at all?" — debug upstream-to-downstream; no downstream fix repairs an upstream failure.' },
    ],
    deepDive: [
      { label: 'GraphRAG (Microsoft) — community summaries', note: 'Combines both structure patterns: build an entity graph, detect communities, summarize each community — graph structure plus RAPTOR-style altitude in one system.' },
    ],
  },
  {
    id: 'd119', day: 119, week: 17, phase: 6, kind: 'review',
    title: 'Week 17 Checkpoint: Capstone Kickoff — Docs-QA v0',
    analogy: 'The open-book exam, for real',
    objectives: [
      'Reconstruct the full RAG pipeline and this week\'s failure taxonomy from memory',
      'Restate the capstone brief in your own words: business context, requirements, v0 scope',
      'Ship capstone v0: ingest + hybrid retrieval + grounded, cited answers over a real corpus',
      'Score ≥ 2/3 on the cumulative Week 17 quiz and requeue weak spots',
    ],
    prereqs: [
      { day: 113, label: 'RAG architecture' },
      { day: 115, label: 'Embeddings & vector DBs' },
      { day: 116, label: 'Hybrid search' },
      { day: 117, label: 'Reranking & query transforms' },
    ],
    eli5: `All week you practiced open-book exam technique on toy corpora. Today two things happen: you consolidate, and you go pro. Consolidation first, because this week's six days form ONE machine, and machines are remembered as wholes: you'll redraw the pipeline from memory, re-derive why each stage exists from the failure it prevents, and let spaced repetition do what it does — each successful recall at the edge of forgetting roughly doubles the interval before the next one, which is why today's effortful "wait, what was RRF's k again?" moment is worth ten passive re-reads.

Then the kickoff. From today until Day 180 you are building a real product for a fictional-but-realistic client. Nimbus Analytics, the 250-person company whose policy snippets you've been retrieving all week, wants an internal Docs-QA assistant. Today's deliverable is v0: the honest, minimal, working core — documents in, grounded and cited answers out. Not a demo of everything; a thin slice of the real thing, built with the exact modules you committed on Days 115–117. Every later phase of the program (evals, tracing, deployment, hardening, demo day) upgrades THIS artifact.`,
    why: `Shipping v0 early is the FDE method: a working thin slice beats a perfect plan, because every later decision (evals, observability, deploys) needs a real system to attach to. This capstone is also your portfolio centerpiece — by Day 180 it will be the repo you walk interviewers through, with a commit history that tells a 60-day production story. And the review half matters just as much: Week 18 (agents) builds directly on retrieval-as-a-tool, so Week 17's machinery must be recallable without notes before you hand it to an agent.`,
    tech: `### THE CAPSTONE BRIEF (keep this; you will re-read it on Days 140, 154, and 176)

**Business context.** Nimbus Analytics is a 250-person B2B data-analytics company. Internal knowledge lives in ~200 documents: an HR handbook, security & IT policies, finance/expense rules, and product/API docs. Employees ask ~400 questions a week in Slack; HR and IT each burn ~10 hours/week answering repeats, answers are inconsistent, and new hires flounder. The VP of Operations (your economic buyer) wants an internal assistant: employees ask in plain language, get a correct answer with a citation to the source document, and get an honest "I don't know — ask #hr-help" when the docs don't cover it. Wrong-but-confident answers about policy are the named nightmare: a hallucinated expense rule costs real money and trust.

**Requirements (full product, Day 180 horizon).** Functional: web UI + JSON API; grounded answers with structured citations (doc + section); "insufficient context" refusals; per-source filtering (e.g. exclude drafts); corpus updates without downtime. Non-functional: p95 end-to-end latency ≤ 5 s; answer cost ≤ $0.05 median; retrieval hit rate ≥ 85% and faithfulness ≥ 90% on a golden set (built Day 140); injection resistance (docs are user-editable — tested Days 133/144); tracing on every request (Day 142); containerized deploy with CI eval gate (Days 148–154); runbook + cost analysis (Days 161, 173). Rubric: 8 dimensions × 4 levels; "production-ready" = ≥3 everywhere.

**v0 scope (today).** In: ingest script (chunk with your Day 114 decision card, stamp metadata, stable IDs), hybrid retrieval (your Day 116 module), reranking (Day 117), grounded answer generation with citations and refusal, a CLI or single FastAPI endpoint, 10 smoke-test questions with expected sources. Out (explicitly): UI, auth, evals harness, tracing, deploy — scoped out, not forgotten; each has a scheduled day. Corpus: write or generate 12–20 markdown docs for Nimbus (HR handbook sections, security policy, expense policy, API docs) — authoring the corpus yourself is a feature: you'll know where every answer lives, which makes failures diagnosable.

### Review protocol (before you build)

Blank-page recall beats re-reading: reproduce the pipeline diagram, the BM25+RRF formulas, and the bi-vs-cross-encoder argument from memory FIRST, then diff against your notes from Days 113–117. Wrong-but-attempted recall strengthens memory more than fluent recognition — that is the testing effect, and it is the reason review days exist.`,
    viz: 'rag-pipeline',
    guided: [
      {
        title: 'Blank-page recall: rebuild the week from memory',
        minutes: 20,
        body: `Close every note and editor tab first.

1. On paper or a blank file: draw the six-stage RAG pipeline with offline/online paths, and annotate each stage with its characteristic failure (D113).
2. Write the BM25 scoring idea (IDF × saturated TF × length norm) and the RRF formula with its k, from memory (D116).
3. Write three sentences: why a cross-encoder outranks a bi-encoder, and why it can't replace stage one (D117).
4. List the three chunking families and your decision-card defaults (D114), and the embedding-model lock-in rule (D115).
5. NOW open your notes and diff. Every gap or error goes onto a flashcard — gaps found today are the highest-value cards you'll write this month.
6. Re-answer, from memory, the two quiz questions you found hardest this week (check the dashboard's missed-question list).`,
      },
      {
        title: 'Author the Nimbus corpus, then ship v0',
        minutes: 35,
        body: `1. Create the capstone repo: \`docs-qa/\` with \`corpus/\`, \`src/\`, \`tests/\`, and a README containing the brief above in your own words (5 sentences — this is your Day 165 proposal seed).
2. Author the corpus: 12–20 markdown files under \`corpus/\`. Include on purpose: one table (per-diem rates), one pair of near-duplicate docs (old + new expense policy, the old one marked superseded), API docs with error codes, and at least two facts that require different sections to answer. Plant 3 "landmine" facts you'll use to test refusals and freshness later.
3. Wire the pipeline: copy in your \`build_index.py\` (D115), \`retrieval.py\` with reranker (D116–117). Point ingest at \`corpus/\`, build both indexes.
4. Write \`answer.py\`: \`answer(question) -> {text, citations, refused}\`. Assemble the grounded prompt (D113's contract: cite chunk ids, refuse on insufficient context, best chunk first per D117's deep-dive). If you have an API key, call your Day 107 client wrapper; otherwise print the assembled prompt and paste into a chat model — the architecture is what's graded today.
5. Write \`tests/smoke.py\`: 10 questions with expected source sections — 6 straightforward, 2 requiring hybrid (error codes), 1 refusal case (not in corpus), 1 against the superseded-policy pair. Run it; record the score in the README.`,
      },
    ],
    practice: [
      {
        title: 'Walk your own flowchart',
        minutes: 15,
        body: `At least one of your 10 smoke tests failed (if not, add harder ones until one does — a suite that can't fail teaches nothing). Take the worst failure and walk your Day 118 \`rag_debugging.md\` flowchart on it, top-down, writing one line per check: ingested? intact in one chunk? in stage-one top-20? in reranked top-3? in the prompt? used faithfully? Fix the failure at the guilty stage, re-run the suite, and append a 3-line postmortem (symptom → stage → fix) to the README. This is the debugging ritual you'll repeat for 60 days.`,
      },
    ],
    project: {
      title: 'Capstone v0: grounded docs-QA over the Nimbus corpus',
      brief: `Deliver the v0 slice end-to-end in the new \`docs-qa\` repo: authored corpus (12–20 docs with the planted structures), ingest with metadata + stable IDs, hybrid retrieval + reranking, and \`answer()\` returning grounded text with structured citations or an honest refusal. The smoke suite (10 questions) runs with one command and the README records the score, the brief-in-your-own-words, and one postmortem from the flowchart walk. Tag the commit \`v0\`. This repo now receives every upgrade through Day 180 — treat the commit history as part of the portfolio.`,
      rubric: [
        'Corpus of 12–20 authored docs including table, superseded pair, and error codes',
        'Ingest is idempotent (re-run produces no duplicates) and stamps source/section/position/model metadata',
        'Answers carry citations resolvable to doc + section; out-of-corpus question produces a refusal, not an invention',
        'Smoke suite ≥ 8/10 with the failing case postmortem\'d via the flowchart',
        'Hybrid + rerank verifiably in the path (explain() output for one query pasted in README)',
        'Repo tagged v0 with a README containing the brief restated in your own words',
      ],
    },
    mistakes: [
      'Building v0 features that are scoped out (UI, auth, dashboards). The discipline of "out means out, with a scheduled day" is the FDE scoping muscle — v0 is a thin slice, not a small everything.',
      'Grabbing a random public corpus instead of authoring one. You need to KNOW where every answer lives to diagnose failures; authored landmines make Weeks 20–21 evals meaningful.',
      'Reviewing by re-reading the week\'s lessons. Recognition feels like knowledge; only retrieval from a blank page reveals and repairs the gaps. Diff after recalling, never before.',
      'Letting the smoke suite pass 10/10 on day one. If it can\'t fail, it can\'t teach — add the refusal case and the superseded-policy case until something breaks, then flowchart it.',
      'Skipping the honest-refusal path because "the corpus covers everything." The named client nightmare is wrong-but-confident policy answers; refusal is a feature with a test, not an apology.',
      'Deferring stable IDs and metadata "until it matters." It matters on Day 145 (freshness) and Day 133 (injection-via-docs) — and retrofitting provenance is a full re-ingest.',
    ],
    quiz: [
      {
        q: 'Your v0 answers a question about the OLD expense policy (superseded doc). Which two mechanisms, both from this week, address this?',
        o: [
          'Bigger chunks and higher temperature',
          'Metadata filtering (exclude superseded sources at query time) and freshness/tombstoning at ingest',
          'HyDE and a reranker',
          'More top-k and a longer prompt',
        ],
        x: 1,
        w: 'Staleness is a retrieval-scope problem: filter superseded sources via metadata (D115) and tombstone/replace at ingest (D118). No generation-side fix stops a stale chunk from being retrieved.',
        revisit: 118,
      },
      {
        q: 'A smoke test on "ERR-4092" fails under dense-only retrieval but passes with your hybrid module. This is because…',
        o: [
          'The reranker fixed it',
          'BM25\'s IDF makes the rare exact token dominate, while the code has no useful embedding neighborhood',
          'Chroma is faster than brute force',
          'The chunk was too small',
        ],
        x: 1,
        w: 'Exact identifiers are the canonical lexical query: no semantic neighborhood, maximal IDF. This single query class justifies hybrid in v0 — it will appear in your golden set on Day 140.',
        revisit: 116,
      },
      {
        q: 'Why does the v0 prompt place the best reranked chunk FIRST in the context?',
        o: [
          'JSON requires ordering',
          'Models attend more reliably to the edges of the context; burying the key chunk mid-prompt invites lost-in-the-middle failures',
          'It reduces token cost',
          'Vector DBs return sorted order anyway',
        ],
        x: 1,
        w: 'Reranking earns you a correct ordering; prompt assembly must not squander it. Edge placement mitigates the positional attention weakness from Day 104.',
        revisit: 117,
      },
    ],
    resources: [
      { label: 'RAG paper — Lewis et al. (skim §3 now that you\'ve built it)', url: 'https://arxiv.org/abs/2005.11401', type: 'paper', time: '15 min' },
      { label: 'Chroma docs — persistence & collections (for the local index)', url: 'https://docs.trychroma.com/docs/overview/getting-started', type: 'docs', time: '15 min' },
      { label: 'FastAPI docs — first steps (for the optional v0 endpoint)', url: 'https://fastapi.tiangolo.com/', type: 'docs', time: '15 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep: full due deck for Week 17 (SM-2 drill)', minutes: 15 },
      { activity: 'Guided 1: blank-page recall + diff + new cards', minutes: 20 },
      { activity: 'Read the capstone brief; restate it in the README', minutes: 10 },
      { activity: 'Guided 2: author corpus + ship v0', minutes: 35 },
      { activity: 'Practice: flowchart walk on the worst failure', minutes: 15 },
      { activity: 'Cumulative quiz + requeue missed topics', minutes: 15 },
    ],
    completion: [
      'Blank-page recall diffed; every gap converted to a flashcard',
      'docs-qa repo created, corpus authored, v0 tagged',
      'Smoke suite ≥ 8/10 with one postmortem written',
      'Brief restated in your own words in the README',
      'Cumulative quiz ≥ 2/3 (retake after targeted review if lower)',
    ],
    connections: {
      back: 'Everything this week converged here: D113\'s architecture, D114\'s decision card, D115\'s build_index.py, D116–117\'s retrieval.py, D118\'s flowchart — v0 is those five artifacts composed.',
      forward: 'Day 120 hands retrieval to an agent as a tool. Day 140 builds v0\'s golden-set eval harness, Day 142 adds tracing, Day 148 containerizes it, Day 154 gives it CI, and Day 180 you demo it. The repo you tagged today is the one you\'ll present.',
    },
    flashcards: [
      { f: 'Capstone client, corpus, and nightmare failure?', b: 'Nimbus Analytics (250-person B2B); ~200 internal docs (HR/security/finance/API); wrong-but-confident policy answers.' },
      { f: 'Capstone v0 scope — in vs out?', b: 'In: ingest, hybrid+rerank retrieval, grounded cited answers, refusal, smoke tests. Out (scheduled later): UI, auth, evals, tracing, deploy.' },
      { f: 'Two headline quality targets for the capstone golden set?', b: 'Retrieval hit rate ≥ 85%; faithfulness ≥ 90% (plus p95 ≤ 5 s, median cost ≤ $0.05).' },
      { f: 'Why author the corpus yourself?', b: 'You know where every answer lives — failures become diagnosable, and planted landmines power later eval and red-team days.' },
      { f: 'The testing effect in one line?', b: 'Effortful recall at the edge of forgetting strengthens memory far more than re-reading; review = blank page first, notes second.' },
    ],
    deepDive: [
      { label: 'Write the v0 announcement', note: 'Optional FDE rep: draft the 5-sentence Slack message announcing the pilot to Nimbus employees — what it does, what it won\'t do yet, where to report bad answers. You\'ll reuse it on Day 167 (demo craft).' },
    ],
  },
  {
    id: 'd120', day: 120, week: 18, phase: 6, kind: 'lesson',
    title: 'Agents I — The Loop',
    analogy: 'An intern with a to-do list',
    objectives: [
      'Define an agent as LLM + tools + loop and identify each part in running code',
      'Implement the ReAct-style loop: decide → act → observe → decide, with tool errors fed back as observations',
      'Enforce stopping criteria and budgets (steps, tokens, time) and explain why every agent needs them',
      'Apply the when-NOT-to-build-an-agent checklist to three candidate tasks',
    ],
    prereqs: [
      { day: 111, label: 'Tool use & function calling' },
      { day: 106, label: 'LLM APIs — the request' },
      { day: 113, label: 'RAG architecture' },
    ],
    eli5: `On Day 111 you gave the polymath hands: it could call one tool when you asked one question. An agent is the next step — an intern with a to-do list and permission to keep working. You say "find out which config file sets our API rate limit," and the intern doesn't answer from memory. She walks to the filing room, lists the folders, opens the likely one, reads it, doesn't find it, opens the next, finds the line, and comes back with the answer AND how she got it.

The magic isn't intelligence — it's the loop. Look at the situation, pick ONE next action, do it, look at what happened, repeat. Each trip around the loop the intern knows more than the last trip, because the results of her actions pile up in her notes. And crucially, a good intern knows when to stop: when she has the answer, when she's out of places to look ("I checked every file — it isn't there"), or when she's spent too long ("this is taking hours, let me check in"). An intern with no stopping rule reorganizes the filing room until midnight. Yours will too, unless you build the clock in.`,
    why: `"Agentic" is the most-hyped word in AI engineering, and the fastest way to stand out — in interviews and with customers — is demonstrating you know what the word mechanically means: a while-loop around an LLM that chooses tool calls, with observations accumulating in context. Every agent product you'll ever debug (coding agents, support agents, research agents) is this loop wearing different tools. FDEs also field the opposite conversation weekly: a customer wants "an agent" for a task that is actually a 3-step fixed pipeline — cheaper, faster, testable. Knowing when NOT to build the loop is billable judgment. Days 121–126 all build on the file you write today.`,
    tech: `An agent = **LLM + tools + loop**. Per iteration: (1) send the model the task plus the full history of actions and observations; (2) the model returns either a tool call or a final answer; (3) you execute the tool — the model never touches the world directly, your code does; (4) append the observation (including errors!) to history; (5) repeat. This is the **ReAct pattern** (Reason + Act): interleaving reasoning about the situation with actions against it, so each decision is conditioned on everything learned so far. The Day 111 tool loop was one lap; an agent is laps until done.

### What makes it an agent, precisely

Anthropic's framing (Day 123 goes deeper): a **workflow** follows a code-defined path — the LLM fills in steps you predetermined. An **agent** directs its own path — the model decides which tool, with what arguments, and when to stop, based on observations. Agency is a dial, not a binary; you buy flexibility for open-ended tasks and pay in latency, cost, and nondeterminism.

### Stopping criteria and budgets — the non-negotiables

An agent terminates by: (a) the model declaring a final answer; (b) an honest give-up ("searched everywhere, not found" — a *success* of calibration, not a failure); (c) budget exhaustion — max steps, max tokens/cost, wall-clock timeout; (d) no-progress detection (Day 125 formalizes loop detection). Ship (c) from day one: LLMs genuinely get stuck repeating actions, and an unbounded loop against a paid API is a wallet-draining incident you only need once. Error handling doubles as steering: a tool failure ("file not found") returned AS the observation lets the model self-correct next lap — errors are information, not exceptions to hide.

### When NOT to build an agent

Checklist before reaching for the loop: Is the step sequence knowable in advance? → fixed workflow. Is one retrieval + one generation enough? → plain RAG (Day 113). Does the task tolerate zero variance (compliance reports, billing)? → deterministic code, maybe LLM-assisted steps. Is the tool surface dangerous and unreviewable? → don't hand it a loop (Day 125's approvals). Agents earn their cost on open-ended tasks where the path genuinely depends on what's discovered along the way — debugging, research, multi-file code changes.`,
    viz: 'agent-loop',
    guided: [
      {
        title: 'Build the loop: a file-Q&A agent in 70 lines',
        minutes: 30,
        body: `1. Create \`agent_v0.py\` with the starter code. It has all three parts labeled: TOOLS (three real functions over an in-memory filesystem), a ScriptedLLM (a deterministic stand-in policy so the LOOP runs in-browser — locally you swap in your Day 107 client and the Day 111 tool-use API, and nothing else changes), and \`run_agent\`, the loop itself.
2. Run task 1: "Which config file sets the API rate limit, and to what value?" Read the printed trace lap by lap: list_files → read the likeliest file → not there → read the next → found → final answer. Notice the answer cites the file it actually read.
3. Run task 2: "What is the database password?" — it is nowhere in the corpus. Watch the agent read everything, then give the honest give-up answer. Circle where in the ScriptedLLM that honesty lives (the fallback branch) — with a real LLM, that behavior comes from the system prompt: "if the information is not found after checking plausible files, say so."
4. Break a tool: rename a file in FS so the scripted policy requests a missing file, and confirm the TOOL ERROR comes back as an observation and the loop continues rather than crashing. Errors are observations.
5. Set max_steps=2 and rerun task 1: budget exhaustion fires mid-investigation. This is the seatbelt — leave it on.`,
        code: `# agent_v0.py — LLM + tools + loop. Grows on D121 (planner), D122 (memory),
# D125 (guards), D126 (triage). ScriptedLLM stands in for a real model so the
# loop mechanics run anywhere; swap in the D111 tool-use API locally.
FS = {
    "README.md":     "Nimbus Insights service. See settings for configuration.",
    "app.py":        "from settings import load\\nconfig = load()\\n# serves /v1/query",
    "settings.yaml": "workers: 4\\nrate_limit: 120   # requests/min per key\\nretries: 3",
    "notes.txt":     "TODO: move rate limiting to the gateway next quarter.",
}

# --- TOOLS: the agent's hands. The model never touches FS directly. ---
def list_files():
    return sorted(FS)

def read_file(name):
    if name not in FS:
        raise FileNotFoundError(f"no such file: {name}")
    return FS[name]

TOOLS = {"list_files": list_files, "read_file": read_file}

# --- the "LLM": a deterministic policy over (task, history) ---
class ScriptedLLM:
    def decide(self, task, history):
        listed = [h for h in history if h["tool"] == "list_files"]
        if not listed:
            return {"tool": "list_files", "args": {}}
        # if any read observation contains a promising line, answer from it
        for h in history:
            if h["tool"] == "read_file" and "rate" in str(h["obs"]):
                line = [l for l in str(h["obs"]).splitlines() if "rate" in l][0]
                name = h["args"]["name"]
                return {"tool": "final_answer",
                        "args": {"text": f"{name} sets {line.strip()}"}}
        files = listed[0]["obs"]
        seen = {h["args"].get("name") for h in history if h["tool"] == "read_file"}
        # heuristic the prompt would induce: config-ish files first
        ordered = sorted(files, key=lambda f: ("settings" in f or "config" in f), reverse=True)
        for f in ordered:
            if f not in seen:
                return {"tool": "read_file", "args": {"name": f}}
        return {"tool": "final_answer",
                "args": {"text": "Checked every file; the information is not there."}}

# --- THE LOOP ---
def run_agent(llm, tools, task, max_steps=8):
    history = []
    for step in range(1, max_steps + 1):
        action = llm.decide(task, history)                 # 1. decide
        if action["tool"] == "final_answer":
            print(f"step {step}: FINAL -> {action['args']['text']}")
            return action["args"]["text"]
        fn = tools.get(action["tool"])
        try:                                               # 2. act
            obs = fn(**action["args"]) if fn else f"unknown tool {action['tool']}"
        except Exception as e:
            obs = f"TOOL ERROR: {e}"                       # errors are observations
        history.append({"tool": action["tool"], "args": action["args"], "obs": obs})
        print(f"step {step}: {action['tool']}({action['args']}) -> {str(obs)[:60]}")
    return "STOPPED: step budget exhausted"                # 3. the seatbelt

print("--- task 1 ---")
run_agent(ScriptedLLM(), TOOLS, "Which config file sets the API rate limit, and to what value?")
print("\\n--- task 2: not in the corpus ---")
run_agent(ScriptedLLM(), TOOLS, "What is the database password?")`,
      },
      {
        title: 'Agent or not? Three verdicts',
        minutes: 12,
        body: `For each task below, decide: agent, fixed workflow, or plain RAG — then write the one-sentence justification. Check against the key only when done.

1. "Every Monday, pull last week's tickets, summarize by category, email the report." Same steps every time, zero exploration.
2. "Find why the staging deploy is failing." Unknown cause; next action depends on each log you read.
3. "Answer employee policy questions from the handbook." One retrieval + one grounded generation per question.

Key: 1 = fixed workflow (the path is knowable in advance — an agent adds variance to a task that tolerates none); 2 = agent (genuinely open-ended investigation, the D120 loop's home turf); 3 = plain RAG (your capstone! — no loop needed until questions require multi-hop, and even then Day 118's decomposition may suffice). If you said "agent" for all three, reread the checklist — that instinct is the expensive one.`,
      },
    ],
    practice: [
      {
        title: 'Teach the agent a new trick without touching the loop',
        minutes: 20,
        body: `Add a third tool \`grep(pattern)\` that returns {filename: [matching lines]} across all of FS, and extend the ScriptedLLM to prefer one grep over reading files one by one for "find the line" tasks. Then run the rate-limit task again and compare traces: the grep-enabled agent should finish in 2 steps instead of 3-4.

Constraints: \`run_agent\` must not change at all — that is the point of the tool abstraction; only TOOLS and the policy change. Hints: policy order — grep first if no grep observation exists; answer from the grep observation if it hits; fall back to read_file. Note what you just felt: better tools shrink the loop. That lesson — invest in tools, not cleverer loops — is half of agent engineering.`,
      },
    ],
    project: {
      title: 'agent_v0 becomes a module',
      brief: `Refactor today's lab into a committed module the rest of Week 18 builds on: \`agent/core.py\` with \`run_agent(llm, tools, task, max_steps, on_step=None)\` — the on_step callback receives each (step, action, obs) for logging (Day 125's audit trail will hook in here); \`agent/tools_fs.py\` with the three file tools plus docstrings written as if for the model (they become tool descriptions in the real API); and \`tests/test_loop.py\` with four pytest cases: happy path finds the answer, honest give-up on absent info, tool error fed back as observation (loop continues), and max_steps stops a runaway policy (write a deliberately stuck ScriptedLLM for this). Include a README section mapping each piece to its real-LLM equivalent.`,
      rubric: [
        'run_agent is tool-agnostic and policy-agnostic; nothing in it references files',
        'All four tests pass, including the deliberately-stuck-policy budget test',
        'Tool errors surface as observations, never as crashes',
        'Tool docstrings are written as model-facing descriptions (what, args, returns, when to use)',
        'README maps ScriptedLLM → real tool-use API swap explicitly',
        'Committed to the practice repo',
      ],
    },
    mistakes: [
      'Letting the model "execute" tools. The model only ever emits a request; your code validates and executes. Blurring this line is how agents delete files nobody asked them to.',
      'Hiding tool errors from the model. A swallowed exception leaves the agent reasoning from a stale world-model; the error string IS the steering signal for the next lap.',
      'Shipping a loop with no budget "because it terminates in testing." Production inputs find the infinite loop; max steps, cost caps, and timeouts are day-one requirements, not hardening.',
      'Treating an honest "not found" as a failure to prompt away. Calibrated give-ups are a success mode; punishing them breeds confident fabrication — the worst agent behavior.',
      'Building an agent where a workflow suffices. If you can write the step sequence down in advance, do that — cheaper, faster, testable, explainable to the customer.',
      'Growing the loop instead of the tools. A grep tool beat a smarter policy today; when an agent flails, upgrade its tools and their descriptions before touching the loop.',
    ],
    quiz: [
      {
        q: 'What are the three components that make something an agent, per today\'s definition?',
        o: [
          'Prompt, model, temperature',
          'LLM + tools + a loop where observations from each action condition the next decision',
          'Planner, memory, executor',
          'Model, vector DB, UI',
        ],
        x: 1,
        w: 'Agent = LLM + tools + loop. Planning and memory (Days 121–122) are upgrades to this core, not the definition. The loop with accumulating observations is what separates an agent from one-shot tool use.',
        revisit: 120,
      },
      {
        q: 'A tool call throws an exception mid-run. The correct handling is…',
        o: [
          'Crash the run and alert',
          'Retry the same call silently until it works',
          'Return the error text to the model as the observation — it is exactly the information the model needs to change course',
          'Skip to the final answer',
        ],
        x: 2,
        w: 'Errors-as-observations lets the agent self-correct ("file not found" → try another file). Crashing wastes the run; silent retries repeat the mistake; both hide the steering signal.',
        revisit: 120,
      },
      {
        q: 'A customer wants "an agent" to generate the same three-section weekly report from the same two data sources. Your recommendation?',
        o: [
          'Build the agent — it future-proofs the pipeline',
          'A fixed workflow: the path is fully knowable in advance, so a loop only adds cost, latency, and variance',
          'Fine-tune a model on old reports',
          'Plain RAG',
        ],
        x: 1,
        w: 'Agents buy flexibility for open-ended paths. A predetermined sequence wants deterministic orchestration with LLM calls as steps — cheaper, testable, and easier to explain. Saying so is FDE judgment.',
        revisit: 120,
      },
    ],
    resources: [
      { label: 'Anthropic — Building Effective Agents (workflows vs agents)', url: 'https://www.anthropic.com/engineering/building-effective-agents', type: 'article', time: '30 min' },
      { label: 'Lilian Weng — LLM Powered Autonomous Agents (loop & tools sections)', url: 'https://lilianweng.github.io/posts/2023-06-23-agent/', type: 'article', time: '30 min' },
      { label: 'Claude Docs — Tool Use overview (the real API for the swap)', url: 'https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview', type: 'docs', time: '20 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep: due cards + restate the capstone brief from memory (D119)', minutes: 10 },
      { activity: 'ELI5 + tech read; agent-loop visualizer lap by lap', minutes: 20 },
      { activity: 'Guided: build the loop + agent-or-not verdicts', minutes: 42 },
      { activity: 'Practice: the grep tool upgrade', minutes: 20 },
      { activity: 'Project: refactor into agent/core.py with tests', minutes: 20 },
      { activity: 'Quiz + flashcards', minutes: 8 },
    ],
    completion: [
      'Loop runs both tasks; honest give-up and budget stop both demonstrated',
      'Tool-error experiment run: loop continues with the error as observation',
      'All three agent-or-not verdicts match the key with sound reasoning',
      'agent/core.py committed with four passing tests',
      'Quiz ≥ 2/3',
    ],
    connections: {
      back: 'Day 111\'s tool loop was one lap; today you closed it into a cycle. The honest give-up is Day 113\'s "insufficient context" escape hatch reborn as agent behavior.',
      forward: 'Day 121 adds a planner on top of this exact module, Day 122 gives it memory, Day 125 hardens it, and on Day 126 it triages support tickets with your capstone\'s retrieval as one of its tools.',
    },
    flashcards: [
      { f: 'Agent, in one equation?', b: 'LLM + tools + loop: decide → act → observe → repeat, with observations accumulating in context until a stop condition.' },
      { f: 'The four ways an agent run terminates?', b: 'Final answer; honest give-up; budget exhaustion (steps/cost/time); no-progress detection. Ship budgets from day one.' },
      { f: 'Why feed tool errors back as observations?', b: 'The error text is the steering signal — the model self-corrects next lap. Hidden errors leave it reasoning from a stale world-model.' },
      { f: 'Workflow vs agent (Anthropic framing)?', b: 'Workflow: code defines the path, LLM fills steps. Agent: model directs its own path from observations. Agency is a dial.' },
      { f: 'When an agent flails, upgrade ___ first?', b: 'Its tools and their descriptions. A grep tool beats a cleverer loop — tool quality bounds agent quality.' },
    ],
    deepDive: [
      { label: 'ReAct paper (Yao et al. 2022)', url: 'https://arxiv.org/abs/2210.03629', note: 'The origin of reason-act interleaving. Skim §2 and the Wikipedia-QA traces; you built exactly this today, minus the academic benchmarks.' },
    ],
  },
  {
    id: 'd121', day: 121, week: 18, phase: 6, kind: 'lesson',
    title: 'Agents II — Planning & Decomposition',
    analogy: 'Breaking the mission into missions',
    objectives: [
      'Contrast plan-then-execute with interleaved (ReAct) planning and choose per task shape',
      'Represent a plan as explicit task state (pending/done/failed) the code — not the model — owns',
      'Verify each subtask against its done_when criterion before advancing',
      'Trigger replanning on subtask failure instead of pushing on or giving up',
    ],
    prereqs: [
      { day: 120, label: 'Agents I — the loop' },
      { day: 118, label: 'Advanced RAG — decomposition' },
    ],
    eli5: `Send the intern to "organize the company offsite" with only Day 120's loop and she'll improvise: book a venue, then discover the date wasn't set, then un-book, then re-book. A senior intern starts differently — she writes the mission as missions: 1) confirm date and headcount, 2) shortlist venues, 3) get budget approval, 4) book. Then she works through the list one item at a time, and — the crucial habit — CHECKS each item actually succeeded before starting the next, because booking a venue for an unapproved budget means redoing everything.

And when reality disagrees with the plan (every venue is full that week), she doesn't push on to step 4 anyway, and she doesn't quit. She goes back to the whiteboard: cross out the broken step, write a recovery step ("propose two alternate dates"), and continue. That's the whole upgrade: a visible to-do list, a checkmark test for each item, and permission to rewrite the list when the world says no. The list lives on paper — not in the intern's head — so anyone (including you, the manager) can see exactly where the mission stands.`,
    why: `Raw ReAct loops wander on long tasks: they lose the thread mid-mission, redo finished work, and declare victory early. Every serious agent product — coding agents, research agents, the deep-research features you've used — runs some form of explicit planning with subtask verification, and "how would you keep an agent on track over a 20-step task?" is now a standard AI-engineering interview question. The deeper habit transfers beyond agents: state that code owns and checks is how you'll debug agent trajectories on Day 137 (trajectory evals) and how your Day 126 triage agent survives a malformed ticket without derailing the batch.`,
    tech: `### Two planning regimes

**Interleaved (ReAct)** — Day 120's loop — replans implicitly every step: maximum adaptivity, no visible commitment. It shines on short, exploratory tasks. Its failure mode is drift: on multi-part missions the model forgets sub-goals, repeats work, or stops early. **Plan-then-execute** front-loads a planning call ("split this mission into ordered subtasks with dependencies"), then executes each subtask — often with the plain Day 120 loop as the executor per subtask. It shines on long, structured missions: progress is inspectable, partial results survive crashes, and cost is predictable. The synthesis used in practice: plan explicitly, execute each step adaptively, and **replan when verification fails** — commitment with an escape hatch.

### State the code owns

Represent the plan as data, not vibes: a list of subtask dicts with id, goal, done_when, status (pending/running/done/failed), and result. The harness — your Python, not the model — owns this state: it selects the next pending subtask, feeds the model ONLY that subtask (plus needed prior results), and records outcomes. This kills two failure classes at once: the model can't forget the plan (it never has to remember it), and you get a progress bar and audit trail for free. Prior-subtask results become inputs to later ones — the dependent-hops idea from Day 118, generalized.

### Verification and replanning

Each subtask carries a **done_when** — a check the harness can run: a predicate on the result (file exists, list is non-empty, answer cites a source), a schema validation (Day 110), or for fuzzy criteria an LLM check ("does this text actually name a venue?"). Verify BEFORE advancing; a false "done" poisons everything downstream — exactly Day 118's poisoned hop. On failure you have a ladder: retry (transient), revise the subtask (bad approach), replan the remainder (bad plan), or escalate to a human (Day 125). **Reflection** — asking the model to critique its own output before you verify — catches shallow errors nearly free, but it is a weak filter with a known ceiling: models grade their own work generously. Reflection supplements code verification; it never replaces it.`,
    viz: null,
    guided: [
      {
        title: 'Plan, execute, verify — the harness owns the list',
        minutes: 30,
        body: `1. Create \`agent_planner.py\` importing your Day 120 module (or paste the starter, which is self-contained). Mission: "Produce a summary of every policy that mentions a specific dollar amount, and save it to summary.txt." Too long for one lap; perfect for a plan.
2. Read the PLAN the scripted planner emits — in production this is one LLM call with the printed PLANNER_PROMPT; here it is fixed so the mechanics run in-browser. Note each subtask's done_when is something CODE can check.
3. Run it. Watch the harness pull subtasks in order, execute, verify, and record results — and see subtask 3 consume subtask 2's result (dependent subtasks, Day 118's hops generalized).
4. Now flip INJECT_FAILURE to True: the write_file tool fails once (disk full). Watch verification catch it (done_when: file exists), status flip to failed, and the replanner insert a recovery subtask (retry to a fallback path) instead of the mission dying or the failure being ignored.
5. Print the final plan state. This table — every subtask, status, result — is the audit trail Day 137 will grade trajectories with.`,
        code: `# agent_planner.py — plan-then-execute with verification + replanning.
FS = {
    "expenses.md": "Purchases over 500 USD require manager pre-approval.",
    "travel.md":   "Hotel budget is capped at 250 USD per night in tier-1 cities.",
    "security.md": "Report lost laptops within 4 hours.",
    "vacation.md": "Employees accrue 1.5 vacation days per month.",
}
WRITES, INJECT_FAILURE = {}, False

def list_files(): return sorted(FS)
def read_file(name): return FS[name]
def write_file(name, text):
    if INJECT_FAILURE and name == "summary.txt" and name not in WRITES:
        WRITES[name] = None                       # mark the attempt
        raise IOError("disk full on primary volume")
    WRITES[name] = text
    return f"wrote {len(text)} chars to {name}"

PLAN = [  # in prod: one LLM call returns this JSON (see PLANNER_PROMPT)
    {"id": 1, "goal": "list all policy files", "needs": [],
     "done_when": lambda r: isinstance(r, list) and len(r) > 0},
    {"id": 2, "goal": "collect lines containing 'USD'", "needs": [1],
     "done_when": lambda r: isinstance(r, list) and len(r) >= 2},
    {"id": 3, "goal": "write summary.txt from collected lines", "needs": [2],
     "done_when": lambda r: "summary.txt" in WRITES and WRITES["summary.txt"]},
]

def execute(sub, results):   # a scripted executor: one D120-loop per subtask
    if sub["id"] == 1:
        return list_files()
    if sub["id"] == 2:
        return [f"{f}: {l}" for f in results[1] for l in read_file(f).splitlines()
                if "USD" in l]
    if sub["id"] == 3 or sub["goal"].startswith("retry"):
        return write_file("summary.txt", "\\n".join(results[2]))

def replan(failed, error):
    print(f"  REPLAN: subtask {failed['id']} failed ({error}) -> insert recovery")
    return {"id": failed["id"] + 100, "goal": "retry write after freeing space",
            "needs": failed["needs"], "done_when": failed["done_when"]}

def run_mission(plan):
    results, queue = {}, list(plan)
    while queue:
        sub = queue.pop(0)
        sub["status"] = "running"
        try:
            r = execute(sub, results)
            ok = sub["done_when"](r)
        except Exception as e:
            r, ok = f"ERROR: {e}", False
        if ok:
            sub["status"], results[sub["id"]] = "done", r
            print(f"  [done] {sub['id']}: {sub['goal']} -> {str(r)[:55]}")
        else:
            sub["status"] = "failed"
            print(f"  [FAIL] {sub['id']}: {sub['goal']} -> {str(r)[:55]}")
            queue.insert(0, replan(sub, r))
    return results

PLANNER_PROMPT = """Split the mission into ordered subtasks as JSON:
[{id, goal, needs: [ids], done_when: <objective check>}]. Each done_when
must be verifiable by code or a single yes/no question about the result."""

print("--- clean run ---"); run_mission([dict(s) for s in PLAN])
WRITES.clear(); INJECT_FAILURE = True
print("--- with injected failure ---"); run_mission([dict(s) for s in PLAN])
print("\\nsummary.txt:", WRITES.get("summary.txt", "MISSING"))`,
      },
      {
        title: 'Reflection: cheap filter, low ceiling',
        minutes: 12,
        body: `1. Subtask 2's result currently includes the travel line and the expenses line. Simulate a sloppier executor: make it also collect the vacation line (no dollar amount — a plausible LLM slip).
2. Add a reflection pass before verification: a function \`reflect(goal, result)\` that re-checks each collected line against the goal ("mentions a specific dollar amount") and drops non-matching ones. Scripted here as a "USD" substring check standing in for an LLM self-critique call.
3. Confirm reflection catches the slip — then construct the case it CANNOT catch: remove the travel line from the collection entirely. Reflection inspects what is present; it cannot notice what is absent. Only a done_when with an expected-count or coverage check (or Day 137's evals) catches omissions.
4. Write the two-line summary in your notes: reflection filters visible junk cheaply; verification against independent criteria is the real gate. Both, in that order.`,
      },
    ],
    practice: [
      {
        title: 'Plan quality is a testable artifact',
        minutes: 20,
        body: `Write \`plan_lint.py\`: a function that takes a plan (list of subtask dicts) and returns a list of defects, checking: (1) every \`needs\` reference points at an earlier id (no cycles/forward refs); (2) every subtask has a non-trivial done_when; (3) no two subtasks share the same goal (duplicate work); (4) the final subtask's done_when references the mission deliverable. Test it against three bad plans you write: one cyclic, one with a vague subtask ("handle the data"), one that never produces the deliverable.

Hints: this linter runs on LLM-produced plans BEFORE execution in production — rejecting a bad plan costs one retry; executing one costs the whole mission. Topological-sort thinking from Day 31 applies to check (1).`,
      },
    ],
    project: {
      title: 'Planner module for the Week 18 agent',
      brief: `Extend the agent package: \`agent/planner.py\` with (1) \`Subtask\` as a dataclass (id, goal, needs, done_when, status, result); (2) \`run_mission(plan, executor, replanner, max_replans=2)\` — the verified plan-then-execute harness from the lab, generalized: executor and replanner are injected callables, and a mission fails cleanly after max_replans (the budget lesson from Day 120, one level up); (3) your plan linter, run automatically before execution; (4) tests: clean run, injected tool failure triggers exactly one replan then succeeds, an always-failing subtask exhausts max_replans and the mission reports failed-with-state (not an exception), linter rejects your three bad plans. Update the README's real-LLM mapping: planner call, executor loop, replan call.`,
      rubric: [
        'Plan state is data owned by the harness; the executor never mutates statuses',
        'Dependent subtasks consume earlier results through the results map only',
        'Replanning is bounded by max_replans and failure is a reported state, not a crash',
        'Linter rejects cyclic, vague, and deliverable-less plans in tests',
        'All tests pass; trace output shows the audit-trail table',
        'Committed to the practice repo',
      ],
    },
    mistakes: [
      'Letting the model carry the plan in its head. Unwritten plans drift and evaporate under context pressure; the harness owns the list, the model works one item at a time.',
      'Advancing on unverified "done." A subtask that claims success without meeting done_when poisons every dependent step — Day 118\'s poisoned hop at mission scale.',
      'Writing done_when criteria the code cannot check ("understands the policy"). Every criterion must be a predicate, a schema, or a concrete yes/no question.',
      'Trusting reflection as verification. Self-critique catches visible junk; it cannot see omissions and grades its own work generously. Independent checks gate; reflection assists.',
      'Unbounded replanning. Replan → fail → replan forever is Day 120\'s runaway loop wearing a suit; cap replans and escalate with the state table attached.',
      'Planning everything upfront for exploratory tasks. When the path depends on discoveries, over-committed plans are re-written every step — just use interleaved ReAct there.',
    ],
    quiz: [
      {
        q: 'For which task is plan-then-execute clearly better than pure interleaved ReAct?',
        o: [
          '"Why is this one API call returning 500?"',
          '"Migrate 40 config files to the new format, verifying each" — long, structured, verifiable steps',
          '"What does this error message mean?"',
          'All tasks equally',
        ],
        x: 1,
        w: 'Long structured missions need visible progress, per-step verification, and survivable state — plan-then-execute\'s strengths. Short exploratory debugging suits interleaved ReAct.',
        revisit: 121,
      },
      {
        q: 'Why must the harness (code) own plan state rather than the model?',
        o: [
          'Models cannot output JSON',
          'It prevents drift (the model can\'t forget what it never has to remember) and yields an inspectable audit trail and progress record',
          'It is cheaper per token',
          'The model would refuse long plans',
        ],
        x: 1,
        w: 'State-in-code kills the forgetting failure class, enables crash recovery and progress bars, and produces the trajectory record that Day 137\'s evals grade.',
        revisit: 121,
      },
      {
        q: 'Reflection ("critique your own output") fails to catch which class of error?',
        o: [
          'Formatting junk in the output',
          'An off-topic item included by mistake',
          'Omissions — items that should be present but are absent are invisible to inspection of what exists',
          'Spelling errors',
        ],
        x: 2,
        w: 'Reflection inspects the visible result. Missing coverage needs an independent expectation — a count, a checklist, or an eval — to detect. That is why done_when gates and reflection merely filters.',
        revisit: 121,
      },
    ],
    resources: [
      { label: 'Anthropic — Building Effective Agents (orchestrator-workers section)', url: 'https://www.anthropic.com/engineering/building-effective-agents', type: 'article', time: '20 min' },
      { label: 'Lilian Weng — LLM Powered Autonomous Agents (planning section)', url: 'https://lilianweng.github.io/posts/2023-06-23-agent/', type: 'article', time: '25 min' },
      { label: 'LangChain docs — agent architectures', url: 'https://docs.langchain.com/oss/python/langchain/overview', type: 'docs', time: '15 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep: due cards + recite the four stop conditions (D120)', minutes: 10 },
      { activity: 'ELI5 + tech read', minutes: 20 },
      { activity: 'Guided: plan-execute-verify + reflection ceiling', minutes: 42 },
      { activity: 'Practice: plan linter', minutes: 20 },
      { activity: 'Project: agent/planner.py with tests', minutes: 20 },
      { activity: 'Quiz + flashcards', minutes: 8 },
    ],
    completion: [
      'Clean run and injected-failure run both traced and explained',
      'Reflection catch and reflection blind spot both demonstrated',
      'Plan linter rejects all three bad plans',
      'agent/planner.py committed, tests green',
      'Quiz ≥ 2/3',
    ],
    connections: {
      back: 'Day 118\'s dependent hops became dependent subtasks; Day 120\'s budget discipline reappears as max_replans; Day 110\'s schema validation is one flavor of done_when.',
      forward: 'Day 122 manages the context these longer missions consume; Day 123\'s orchestrator-workers is this planner with multiple executors; Day 137 grades the audit trail you started printing today.',
    },
    flashcards: [
      { f: 'Plan-then-execute vs interleaved — the trade?', b: 'Plan: visible commitment, verifiable progress, best for long structured tasks. Interleaved: adaptive, best for short exploration. Synthesis: plan + adaptive steps + replan on failure.' },
      { f: 'What is a done_when?', b: 'A harness-checkable success criterion per subtask (predicate, schema, or yes/no check). Verified BEFORE advancing — false dones poison downstream steps.' },
      { f: 'The failure-response ladder for a subtask?', b: 'Retry (transient) → revise the subtask (bad approach) → replan the remainder (bad plan) → escalate to a human. Bounded by max_replans.' },
      { f: 'Reflection\'s ceiling?', b: 'It filters visible junk cheaply but cannot see omissions and self-grades generously. Independent verification gates; reflection assists.' },
      { f: 'Who owns plan state and why?', b: 'The harness (code): kills drift, enables crash recovery, and produces the trajectory audit trail evals will grade (Day 137).' },
    ],
    deepDive: [
      { label: 'Plan-and-Solve & least-to-most prompting', note: 'The prompting-era ancestors of today\'s harness: explicit decomposition instructions measurably beat freeform reasoning on multi-step tasks. Worth knowing as the lineage.' },
    ],
  },
  {
    id: 'd122', day: 122, week: 18, phase: 6, kind: 'lesson',
    title: 'Agents III — Memory & Context',
    analogy: 'The intern\'s notebook',
    objectives: [
      'Budget an agent\'s context window across system prompt, tools, history, and retrievals — in numbers',
      'Implement history compaction: keep recent turns verbatim, roll older turns into a summary',
      'Distinguish scratchpad, episodic, and semantic memory and pick storage for each',
      'Wire retrieval-backed memory: store episode outcomes in a vector index and recall them for new tasks',
    ],
    prereqs: [
      { day: 120, label: 'Agents I — the loop' },
      { day: 121, label: 'Agents II — planning' },
      { day: 115, label: 'Embeddings & vector databases' },
      { day: 104, label: 'Context windows & lost-in-the-middle' },
    ],
    eli5: `The intern's brain (the context window) holds maybe one desk's worth of paper at a time. On a long mission the papers pile up — every file she opened, every dead end — until the important sheet slides off the desk. The fix is not a bigger desk; even the biggest desk fills, and the middle of a tall pile is exactly where things get lost. The fix is a notebook system.

Three notebooks, actually. The **scratchpad**: today's working page — the current plan, the running total, the thing she's in the middle of. Torn out when the mission ends. The **diary** (episodic memory): one paragraph per finished mission — "checked settings.yaml for rate limits, found it; notes.txt is always stale." Tomorrow's missions start by skimming relevant diary entries. And the **reference binder** (semantic memory): distilled durable facts — "the config lives in settings.yaml" — no story attached, just what's true. When the desk fills mid-mission, she doesn't dump papers randomly: she summarizes the oldest ones onto one sheet ("mornings work: ruled out 3 files") and keeps the recent ones verbatim. The desk stays small; the mission stays whole.`,
    why: `Context management is where real agents live or die: the model's per-call memory is the window and nothing else, every token costs money on every lap (history is re-sent each iteration — cost grows quadratically with naive accumulation), and Day 104 taught you the middle of a stuffed window is a dead zone. Long-running agents that "get dumber over time" are almost always drowning in their own history. This is also this week's RAG payoff: retrieval-backed memory is literally your Day 115 vector store pointed at the agent's own past. Claude Code, cursor-style agents, and every support bot with "memory" run exactly the machinery you build today.`,
    tech: `### The token budget is an engineering budget

Every lap re-sends: system prompt + tool definitions (fixed overhead, ~500–2000 tokens), the task, accumulated history, and any retrieved context. With a naive append-everything loop, lap N re-sends all N-1 observations — total tokens across a mission grow O(N²) (Day 22 reasoning applied to your API bill). Budget explicitly: e.g. in a 32k window reserve 2k for system+tools, 1k for the task and plan state, 4k for retrieved context, 2k for the response, leaving ~23k for history — and enforce it in code with a token estimator (chars/4 approximates English; tiktoken locally, Day 96).

### Compaction: recent-verbatim, older-summarized

When history exceeds budget: keep the last K turns verbatim (recency carries the working state), compress everything older into a rolling summary — in production, one LLM call ("summarize these steps: decisions made, facts learned, dead ends — preserve identifiers exactly"), appended to a running mission summary. Two disciplines: never compact the system prompt or current plan state, and preserve exact strings (file names, error codes, IDs) verbatim in summaries — paraphrased identifiers are corrupted identifiers, and a corrupted ID sends the agent re-exploring dead ends.

### The three memory types

- **Scratchpad (working memory)**: current-mission state — the plan table from Day 121 IS one. Lives in the prompt every lap; cleared at mission end.
- **Episodic**: records of past missions ("what happened when"). Store as text with metadata; retrieve by similarity when a new task resembles an old one.
- **Semantic**: durable distilled facts ("rate limit lives in settings.yaml"), promoted from episodes once stable — the agent's own little knowledge base.

Storage answer for the last two: your Day 115 vector store. Write an episode summary + metadata (task, outcome, date) after each mission; at mission start, embed the new task, retrieve top-k similar episodes, inject the lessons into the system prompt. That's "learning from experience" without touching a single weight — and with Day 115's deletability when a lesson goes stale. **What to forget** is a feature: failed paths (keep only the lesson), stale facts (tombstone on contradiction), anything sensitive (Day 132). An agent that remembers everything ends up drowning in its own diary.`,
    viz: 'context-window',
    guided: [
      {
        title: 'Watch it drown, then build the compactor',
        minutes: 30,
        body: `1. Create \`agent_memory.py\` with the starter code. Part 1 simulates a 12-step mission with a naive append-everything history and a 900-token budget (tiny on purpose). The printed table shows tokens-per-lap climbing until the budget breaks mid-mission — and the cumulative-token column shows the O(N²) bill shape.
2. Part 2 adds \`ContextManager\`: last 3 turns verbatim, older turns rolled into a summary (scripted extractive summarizer standing in for the LLM call — the compaction PROMPT it replaces is printed). Rerun: tokens-per-lap now plateau under budget for the same 12 steps.
3. Verify the safety property: the file name "settings.yaml" and error code "ERR-4092" appearing in early turns must still appear VERBATIM in the compacted context at lap 12 (the code asserts this). Break it: make the summarizer drop identifiers and watch the assert fail — that corrupted-summary bug is real and nasty.
4. Compute from the printout: total tokens sent across the mission, naive vs compacted. Write the ratio in your notes — that is money.`,
        code: `# agent_memory.py — context budgeting + compaction.
def toks(s): return max(1, len(s) // 4)          # chars/4 ~ tokens (D96)

SYSTEM = "You are the Nimbus ops agent. Investigate using tools; cite files."
STEPS = [  # a 12-step mission's (action, observation) pairs, pre-scripted
    (f"step_{i}", obs) for i, obs in enumerate([
        "list_files -> [app.py, settings.yaml, notes.txt, legacy/, deploy.md]",
        "read_file(app.py) -> imports settings; serves /v1/query",
        "read_file(settings.yaml) -> rate_limit: 120  # ERR-4092 when exceeded",
        "grep('quota') -> deploy.md: 'quota resets monthly'",
        "read_file(notes.txt) -> TODO move rate limiting to gateway",
        "read_file(deploy.md) -> deploy via compose; quota resets monthly",
        "list_files(legacy/) -> [old_limits.cfg]",
        "read_file(legacy/old_limits.cfg) -> rate_limit: 60 (SUPERSEDED)",
        "grep('4092') -> settings.yaml comment; docs/api.md missing",
        "check_docs -> api docs not in repo; only settings comment",
        "compare -> current limit 120, legacy 60, superseded",
        "draft_answer -> settings.yaml sets rate_limit 120; ERR-4092 = exceeded",
    ], start=1)
]
BUDGET = 900

print("--- naive: append everything ---")
hist, total = [], 0
for i, (a, obs) in enumerate(STEPS, 1):
    hist.append(f"{a}: {obs}")
    ctx = SYSTEM + " ".join(hist)
    total += toks(ctx)
    flag = "  << OVER BUDGET" if toks(ctx) > BUDGET else ""
    print(f"lap {i:2d}: context={toks(ctx):4d} tok  cumulative={total:5d}{flag}")

class ContextManager:
    def __init__(self, keep_verbatim=3):
        self.recent, self.summary, self.keep = [], "", keep_verbatim
    def add(self, turn):
        self.recent.append(turn)
        while len(self.recent) > self.keep:
            self.summary = self._summarize(self.summary, self.recent.pop(0))
    def _summarize(self, summary, turn):
        # scripted stand-in for: "Fold this step into the running summary.
        # Keep decisions, facts, dead ends. PRESERVE identifiers exactly."
        keep = [w for w in turn.replace(",", " ").split()
                if "." in w or "_" in w or w.isupper() or w.isdigit()]
        return (summary + " | " + " ".join(keep[:6]))[-600:]
    def context(self):
        return SYSTEM + " SUMMARY:" + self.summary + " RECENT: " + " ".join(self.recent)

print("\\n--- compacted: recent-verbatim + rolling summary ---")
cm, total2 = ContextManager(), 0
for i, (a, obs) in enumerate(STEPS, 1):
    cm.add(f"{a}: {obs}")
    total2 += toks(cm.context())
    print(f"lap {i:2d}: context={toks(cm.context()):4d} tok  cumulative={total2:5d}")

final = cm.context()
assert "settings.yaml" in final and "ERR-4092" in final, "identifiers lost!"
print(f"\\nidentifiers preserved verbatim: OK")
print(f"total tokens  naive={total}  compacted={total2}  saved={100*(1-total2/total):.0f}%")`,
      },
      {
        title: 'Episodic memory on the Day 115 vector store',
        minutes: 15,
        body: `1. Append the starter code below (it reuses your VecStore contract from Day 115 with the bag-of-words embedder — swap Chroma in locally).
2. Run it: three finished missions are written to memory as episode summaries with metadata. Then a NEW task arrives — "investigate why API calls fail after the 20th of the month" — and the agent retrieves relevant past episodes before starting.
3. Confirm the retrieved episode is the quota one (vocabulary overlap on quota/monthly/API), and note what gets injected into the system prompt: the LESSON, not the whole transcript. Memory injection competes with everything else for the context budget you just engineered.
4. Promote a fact: the quota lesson has now appeared twice (episodes 1 and 3). Write it into a \`SEMANTIC\` dict as a durable fact with a source-episode list — that promotion step (in production, a periodic LLM distillation pass) is how diaries become reference binders.
5. Forget something: delete the episode about the superseded legacy config (its lesson is now wrong). Note this is Day 115\'s deletability argument, aimed at the agent\'s own past.`,
        code: `episodes = [
    ("ep-1", "Task: debug ERR-4092 spike. Outcome: quota resets monthly; heavy "
             "clients hit limits near month end. Lesson: check quota calendar first.",
     {"task_type": "api-debug", "outcome": "solved"}),
    ("ep-2", "Task: find vacation rollover rule. Outcome: handbook hr#vacation "
             "has it. Lesson: HR questions -> handbook source filter.",
     {"task_type": "policy-qa", "outcome": "solved"}),
    ("ep-3", "Task: monthly API failure report. Outcome: failures cluster after "
             "the 20th; correlated with quota exhaustion. Lesson: quota again.",
     {"task_type": "api-debug", "outcome": "solved"}),
]
# store: VecStore from D115 (bag-of-words embed stands in for real embeddings)
import math, re
from collections import Counter
def embed(t): return Counter(re.findall(r"[a-z0-9-]+", t.lower()))
def cos(a, b):
    dot = sum(a[w] * b[w] for w in a if w in b)
    na, nb = math.sqrt(sum(v*v for v in a.values())), math.sqrt(sum(v*v for v in b.values()))
    return dot / (na * nb) if na and nb else 0.0

MEMORY = {eid: (embed(text), text, meta) for eid, text, meta in episodes}

def recall(task, k=1):
    qv = embed(task)
    ranked = sorted(((cos(qv, v), eid, text) for eid, (v, text, _) in MEMORY.items()),
                    reverse=True)
    return ranked[:k]

new_task = "investigate why API calls fail after the 20th of the month"
for score, eid, text in recall(new_task, k=2):
    print(f"{score:.3f} {eid}: {text[:70]}")

best = recall(new_task, k=1)[0]
lesson = best[2].split("Lesson:")[-1].strip()
print("\\ninjected into system prompt -> 'Relevant experience:", lesson + "'")

SEMANTIC = {"quota-calendar": {"fact": "API quota resets monthly; failures cluster late-month",
                               "sources": ["ep-1", "ep-3"]}}
del MEMORY["ep-2"]  # pretend it went stale: forgetting is an operation, not an accident
print("semantic facts:", list(SEMANTIC), "| episodes remaining:", list(MEMORY))`,
      },
    ],
    practice: [
      {
        title: 'Write the budget, then defend it',
        minutes: 18,
        body: `Your Day 126 triage agent will run on a 32k-token window with: a 1200-token system prompt + tool definitions, tickets up to 800 tokens, RAG context (Day 119 retriever) of 3 chunks × 400 tokens, up to 2 recalled episodes × 150 tokens, and a required 1000-token response reserve. Produce \`context_budget.md\`: (1) the line-item budget with a history allowance and an explicit safety margin; (2) the compaction trigger (at what history size do you compact, and to what); (3) which line you would cut first under pressure and why; (4) the two things that must NEVER be compacted.

Hints: budgets that sum to exactly the window are already broken — retrievals vary. Plan compaction to trigger well before the ceiling, not at it.`,
      },
    ],
    project: {
      title: 'Memory module for the Week 18 agent',
      brief: `Extend the agent package: \`agent/memory.py\` with (1) \`ContextManager\` from the lab, parameterized by token budget and keep_verbatim, with the identifier-preservation property under test; (2) \`EpisodeStore\` wrapping your Day 115 VecStore: \`record(task, outcome, lesson, meta)\` after missions, \`recall(task, k)\` before them, \`forget(episode_id)\`; (3) integration: \`run_agent\` (Day 120) gains an optional memory argument — recalled lessons injected into the system section, episode recorded at mission end. Tests: compaction keeps context under budget across a scripted 15-turn mission; identifiers survive compaction; recall returns the planted relevant episode; forget removes it. Update the README mapping (compaction call, distillation pass) to their real-LLM equivalents.`,
      rubric: [
        'ContextManager enforces the token budget on every lap of a 15-turn test mission',
        'Identifier-preservation assert passes (file names, error codes verbatim post-compaction)',
        'EpisodeStore record/recall/forget all covered by tests against planted episodes',
        'run_agent integration injects lessons and records episodes without changing loop logic',
        'context_budget.md committed alongside with the four required sections',
        'Committed to the practice repo',
      ],
    },
    mistakes: [
      'Solving context pressure with a bigger window. Cost scales with tokens re-sent per lap, and lost-in-the-middle worsens with stuffing — budget and compact instead.',
      'Summarizing away exact identifiers. A paraphrased file name or error code is corrupted state; summaries must preserve IDs verbatim — assert it in tests.',
      'One memory bucket for everything. Scratchpad (this mission), episodic (past missions), semantic (durable facts) have different lifetimes, stores, and injection points.',
      'Injecting whole transcripts as memory. Recall lessons, not logs — memory competes with retrievals and history for the same budget you wrote this morning.',
      'Never forgetting. Stale lessons misdirect future missions; contradiction should tombstone (Day 115\'s deletability aimed at the agent\'s own past). Forgetting is an operation.',
      'Compacting the plan state or system prompt. The working plan (Day 121) and the agent\'s instructions are load-bearing every lap; compaction applies to history only.',
    ],
    quiz: [
      {
        q: 'Why does a naive append-everything agent loop cost O(N²) tokens over an N-step mission?',
        o: [
          'The model slows down',
          'Each lap re-sends the entire accumulated history, so lap N pays for ~N observations — summing to quadratic total',
          'Tool definitions grow each lap',
          'It does not; cost is linear',
        ],
        x: 1,
        w: 'History is re-transmitted per call: 1+2+…+N observation-loads ≈ N²/2. Compaction caps per-lap context, making the total roughly linear — Day 22\'s growth-shape reasoning on your API bill.',
        revisit: 122,
      },
      {
        q: 'Your compactor summarizes "read legacy/old_limits.cfg, found rate_limit 60, superseded" as "checked an old config." What breaks later?',
        o: [
          'Nothing — the gist is preserved',
          'The agent re-explores the dead end and may resurface the superseded value: identifiers and verdicts must survive compaction verbatim',
          'Token count rises',
          'The summary is too short',
        ],
        x: 1,
        w: 'Which file, which value, and the superseded verdict were the load-bearing facts. Lossy summaries of identifiers turn recorded knowledge back into open questions — the classic compaction bug.',
        revisit: 122,
      },
      {
        q: 'Where does "the intern learns from experience" live, mechanically?',
        o: [
          'Fine-tuned weights after each mission',
          'A bigger context window',
          'Episode summaries stored in a vector index, retrieved by task similarity, with lessons injected into the prompt — RAG over the agent\'s own past',
          'The scratchpad',
        ],
        x: 2,
        w: 'No weights change. Record → embed → recall-by-similarity → inject the lesson: your Day 115 machinery pointed at episodes, with deletability when lessons go stale.',
        revisit: 115,
      },
    ],
    resources: [
      { label: 'Lilian Weng — LLM Powered Autonomous Agents (memory section)', url: 'https://lilianweng.github.io/posts/2023-06-23-agent/', type: 'article', time: '25 min' },
      { label: 'Anthropic — Building Effective Agents (augmented LLM: retrieval & memory)', url: 'https://www.anthropic.com/engineering/building-effective-agents', type: 'article', time: '15 min' },
      { label: 'LangChain docs — short-term & long-term memory', url: 'https://docs.langchain.com/oss/python/langchain/overview', type: 'docs', time: '15 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep: due cards + write a done_when for a sample subtask (D121)', minutes: 10 },
      { activity: 'ELI5 + tech read; context-window visualizer', minutes: 20 },
      { activity: 'Guided: drown-then-compact + episodic memory', minutes: 45 },
      { activity: 'Practice: the triage-agent context budget', minutes: 18 },
      { activity: 'Project: agent/memory.py with tests', minutes: 20 },
      { activity: 'Quiz + flashcards', minutes: 7 },
    ],
    completion: [
      'Naive-vs-compacted token totals measured; savings ratio recorded',
      'Identifier-preservation assert understood by breaking it once',
      'Episodic recall demo run: right episode recalled, lesson (not transcript) injected',
      'context_budget.md written; agent/memory.py committed with tests green',
      'Quiz ≥ 2/3',
    ],
    connections: {
      back: 'Day 104 named the disease (finite windows, dead middles); Day 115\'s vector store turned out to be the memory organ; Day 121\'s plan table was a scratchpad before you had the word for it.',
      forward: 'Day 125 adds guards around this now-complete agent, and Day 126\'s triage agent runs on today\'s budget doc. Day 142\'s traces will show you context sizes per lap in production.',
    },
    flashcards: [
      { f: 'The three agent memory types and their lifetimes?', b: 'Scratchpad: this mission, in-prompt, cleared after. Episodic: past-mission summaries, vector-recalled. Semantic: durable distilled facts, promoted from repeated episodes.' },
      { f: 'Compaction recipe?', b: 'Keep last K turns verbatim; roll older turns into a running summary; never touch system prompt or plan state; preserve identifiers exactly.' },
      { f: 'Naive agent history cost shape?', b: 'O(N²) total tokens over N steps — full history re-sent every lap. Compaction makes it ~linear.' },
      { f: 'What gets injected from episodic memory?', b: 'The lesson, not the transcript — recalled by task similarity, charged against the same context budget as everything else.' },
      { f: 'When should an agent forget?', b: 'Stale/contradicted lessons (tombstone), failed paths (keep only the takeaway), sensitive data. Forgetting is a designed operation.' },
    ],
    deepDive: [
      { label: 'MemGPT / letta-style memory hierarchies', note: 'Treats the context window like RAM and external stores like disk, with the agent paging its own memory via tools — today\'s architecture taken to its logical extreme.' },
    ],
  },
  {
    id: 'd123', day: 123, week: 18, phase: 6, kind: 'lesson',
    title: 'Multi-Agent & Workflow Patterns',
    analogy: 'A small firm, not one intern',
    objectives: [
      'State the workflow-vs-agent distinction (Anthropic\'s framing) and place a given system on that spectrum',
      'Implement routing and evaluator-optimizer as code, and describe chaining, parallelization, and orchestrator-workers precisely',
      'Choose the simplest adequate pattern for three real briefs and defend the choice',
      'Name the costs multi-agent designs add (latency, cost, error compounding, debugging surface) and when they are worth paying',
    ],
    prereqs: [
      { day: 120, label: 'Agents I — the loop' },
      { day: 121, label: 'Agents II — planning' },
      { day: 111, label: 'Tool use & function calling' },
    ],
    eli5: `One brilliant intern can do a lot. But watch a small firm work: the front desk reads each incoming request and sends it to the right specialist (routing). The paralegal drafts, the associate reviews, the draft bounces back until it passes (evaluator-optimizer). Big filings get split across three associates working simultaneously, results merged (parallelization). Some jobs move down a fixed corridor of desks — intake, then research, then drafting, then proofing (chaining). And on the messiest cases, a partner reads the situation, decides which specialists to pull in and in what order, and synthesizes their work (orchestrator-workers).

Here's the part the hype skips: most of these are NOT teams of free-roaming agents. The corridor, the front desk, the review loop — the FIRM designed those paths; the workers just do their step well. That's a workflow: code defines the route, LLMs fill in the steps. A true multi-agent system — several interns each carrying their own to-do list and deciding their own next moves — is the rare, expensive option you save for problems where nobody can draw the corridor in advance. The firm's org chart is a menu, and the skill is ordering the cheapest dish that feeds the problem.`,
    why: `"Should this be one prompt, a pipeline, or agents?" is now THE architecture question in AI engineering interviews and customer engagements — and Anthropic's building-effective-agents essay (today's core reading) became the industry's shared vocabulary for answering it. Getting it wrong is expensive in both directions: mega-prompts that should be three chained calls produce mush; agent swarms that should be a router burn 10x the tokens and are undebuggable. Your Day 126 triage agent is a routing + RAG + approval workflow; your Day 160 system-design interview round will hand you exactly these briefs. FDEs earn trust by prescribing the boring pattern that ships.`,
    tech: `### The spectrum, precisely

**Workflows** orchestrate LLM calls through code-defined paths — predictable, testable, debuggable step by step. **Agents** direct their own tool use and path (Day 120's loop). Anthropic's guidance, distilled: find the simplest solution that works; add autonomy only when the task's structure genuinely can't be predetermined. Every pattern below is a workflow except the last.

### The five workflow patterns

- **Prompt chaining**: fixed sequence, each call transforms the last output (outline → draft → polish). Add programmatic gates between links — schema checks, length checks — so garbage stops at the first link, not the last (Day 110's validation, inter-call).
- **Routing**: a cheap classifier call picks one of several specialized handlers (billing prompt, bug-triage prompt, docs-RAG). Specialization beats one prompt juggling all cases; misroutes are the tax, so log and eval the router itself (Day 137).
- **Parallelization**: independent subtasks fan out simultaneously — sectioning (split a doc, summarize parts, merge) or voting (N samples, majority/judge picks). Latency ≈ slowest branch instead of the sum; Day 40's asyncio.gather is literally the implementation.
- **Orchestrator-workers**: a lead call decomposes the task AT RUNTIME (unlike chaining's fixed links), dispatches workers, synthesizes. This is Day 121's planner with delegated executors — the bridge pattern to true agency.
- **Evaluator-optimizer**: generator drafts, evaluator critiques against explicit criteria, loop until pass or budget. Works when critique is genuinely easier than generation (translation nuance, code review); it inherits reflection's ceiling (Day 121) unless the evaluator has independent criteria or tools.

### True multi-agent, and its price

Multiple Day-120-style agents with separate context windows, communicating via handoffs (transfer the conversation) or as tools (orchestrator calls a sub-agent like a function). Benefits: separation of concerns, per-agent least-privilege toolsets (Day 125), parallel exploration. Costs, and they compound: every hop adds latency and tokens; errors multiply through the chain (five 90%-reliable stages ≈ 59% end-to-end); debugging requires tracing across contexts (Day 142); and agents can deadlock politely deferring to each other. The honest default: one agent with good tools outperforms a committee of mediocre ones. Reach for multi-agent when contexts must stay separate (privilege boundaries, competing hypotheses, huge parallel research), not for org-chart aesthetics.`,
    viz: null,
    guided: [
      {
        title: 'Build routing and evaluator-optimizer',
        minutes: 30,
        body: `1. Create \`patterns_lab.py\` with the starter code: a router (scripted classifier standing in for one cheap LLM call — its prompt is printed) dispatching to three specialized handlers, and an evaluator-optimizer loop improving a draft against explicit criteria.
2. Run the router on the four requests. Note the shape: classify once, then the SPECIALIZED handler owns the request — each handler's prompt can be short, opinionated, and separately testable. Check the misroute: "my invoice is wrong and the app crashes" is genuinely ambiguous; see which label wins and what the cost of the wrong choice would be.
3. Run the evaluator-optimizer demo: the drafter produces a reply that violates two explicit criteria (too long, missing citation); the evaluator returns per-criterion pass/fail; the reviser fixes; the loop exits on all-pass. Count the iterations and note the budget cap — this is Day 120's loop discipline applied to quality instead of investigation.
4. Change MAX_ROUNDS to 1 and observe the honest partial result with its evaluation attached — shipping "best effort + known gaps" beats shipping mystery output.
5. In your notes, write each of the other three patterns (chaining, parallelization, orchestrator-workers) as three lines of pseudocode. If you can pseudocode it, you own it.`,
        code: `# patterns_lab.py — routing + evaluator-optimizer, scripted-LLM style.
ROUTER_PROMPT = """Classify the request as exactly one of:
billing | bug | policy. Reply with the label only."""

def route(request):        # stands in for one cheap classifier call
    rl = request.lower()
    scores = {"billing": sum(w in rl for w in ["invoice", "charge", "refund", "price"]),
              "bug":     sum(w in rl for w in ["crash", "error", "broken", "slow"]),
              "policy":  sum(w in rl for w in ["vacation", "policy", "allowed", "expense"])}
    return max(scores, key=scores.get)

def handle_billing(r): return f"[billing handler] check account, invoice tools: {r[:40]}"
def handle_bug(r):     return f"[bug handler] collect version + logs, file ticket: {r[:40]}"
def handle_policy(r):  return f"[policy handler] RAG over handbook (D119): {r[:40]}"
HANDLERS = {"billing": handle_billing, "bug": handle_bug, "policy": handle_policy}

for req in ["I was charged twice this month",
            "the dashboard crashes on export",
            "how many vacation days roll over?",
            "my invoice is wrong and the app crashes"]:   # ambiguous!
    label = route(req)
    print(f"{label:8s} <- {req!r:50s} {HANDLERS[label](req)[:45]}")

# --- evaluator-optimizer: draft -> critique -> revise until pass ---
CRITERIA = {
    "under_50_words": lambda t: len(t.split()) <= 50,
    "has_citation":   lambda t: "[hb-" in t,
    "no_promises":    lambda t: "guarantee" not in t.lower(),
}
def draft(_task):
    return ("We guarantee your refund will be processed. Our policy explains "
            "the full details of the refund process in extensive depth and "
            "many further considerations apply to every possible case, "
            "which we will describe at length below across several sections.")
def revise(text, failures):
    if "no_promises" in failures:
        text = text.replace("We guarantee", "We expect")
    if "has_citation" in failures:
        text += " Per the refund policy [hb-04]."
    if "under_50_words" in failures:
        text = " ".join(text.split()[:38]) + " Per the refund policy [hb-04]."
    return text

MAX_ROUNDS = 3
text = draft("refund reply")
for rnd in range(1, MAX_ROUNDS + 1):
    failures = [name for name, check in CRITERIA.items() if not check(text)]
    print(f"round {rnd}: failures={failures or 'NONE - ship it'}")
    if not failures:
        break
    text = revise(text, failures)     # in prod: evaluator + reviser LLM calls
print("final:", text)`,
      },
      {
        title: 'Three briefs, three designs — on paper',
        minutes: 15,
        body: `Design on paper (no code): for each brief, pick the pattern(s), draw the boxes-and-arrows, mark where a human sits, and write the one-line justification. Then compare with the key.

1. **Contract intake**: 200 vendor contracts arrive monthly as PDFs; extract 12 fields each into the ERP, flag unusual clauses for legal.
2. **Support inbox**: mixed stream of billing/bug/policy emails; billing needs account lookups, bugs need repro details, policy needs handbook RAG.
3. **Competitive research**: "Produce a report on how our top 5 competitors price their APIs" — sources unknown in advance, quality bar high.

Key: 1 = chaining with gates (extract → validate schema (D110) → flag clauses → human review for flags) — fixed corridor, zero agency needed. 2 = routing to three specialized handlers, one of which is your capstone RAG; escalation to humans on low router confidence. 3 = orchestrator-workers (decompose per competitor at runtime, parallel research workers, synthesis) + evaluator pass on the report; the one brief where runtime decomposition is genuinely required. If you reached for multi-agent on 1 or 2, reread the costs paragraph.`,
      },
    ],
    practice: [
      {
        title: 'The error-compounding budget',
        minutes: 18,
        body: `A proposed pipeline chains five LLM stages (intake parse → classify → retrieve+draft → compliance rewrite → format), each independently ~92% reliable on your eval set. (1) Compute expected end-to-end reliability if errors compound independently. (2) You can afford to add programmatic gates (schema/regex checks that catch ~80% of a stage's failures and trigger one retry) after exactly two stages — which two do you protect, and why? (3) Merging the compliance rewrite into the draft stage would remove a hop but grow that prompt's job; name the trade in one sentence. (4) Generalize: write the rule for when to add a stage vs when to merge stages.

Hints: 0.92^5 first. Protect stages whose failures are cheap to DETECT programmatically and expensive to let through; upstream gates protect more downstream work than late ones.`,
      },
    ],
    project: {
      title: 'The pattern decision card + triage design',
      brief: `Create \`agent_patterns.md\` in the practice repo: (1) a six-row table — five workflow patterns + true multi-agent — with mechanism, when-it-wins, failure tax, and a one-line code sketch each; (2) your three paper designs from guided 2, cleaned up; (3) the design for Day 126's support-triage agent, committed to BEFORE building it: routing (ticket class) + RAG handler (capstone retriever as a tool) + evaluator gate on drafted replies (the CRITERIA pattern from today) + human approval on escalations — drawn as boxes and arrows with each pattern labeled; (4) a "multi-agent tax" section: the error-compounding math from practice, plus latency and debugging costs in your own words. This card is your Day 160 system-design cheat sheet.`,
      rubric: [
        'All six patterns tabled with mechanism, win condition, and failure tax',
        'Three briefs designed with patterns labeled and humans placed',
        'Day 126 triage design present with all four components and data flow drawn',
        'Error-compounding math correct and interpreted',
        'Simplest-adequate-pattern principle stated and applied consistently',
        'Committed to the practice repo',
      ],
    },
    mistakes: [
      'Reaching for multi-agent because the problem has parts. Parts want a workflow; free-roaming agency wants unpredictable structure. Most "multi-agent systems" in production are routers and chains.',
      'Chaining without gates. One bad link poisons everything downstream; schema/sanity checks between links catch failures where they are cheapest.',
      'Trusting the router blindly. It is an LLM call with its own error rate — log its decisions, eval it separately (Day 137), and route low-confidence cases to a human or a generalist.',
      'Evaluator-optimizer with vibes criteria. "Make it better" loops forever; explicit, checkable criteria (with the code-checkable subset enforced programmatically) make the loop converge.',
      'Ignoring error compounding. Five 92% stages ≈ 66% end-to-end; every added hop must pay for its reliability tax with a genuine capability gain.',
      'Parallelizing dependent work. Fan-out requires independence; hidden dependencies between branches produce merge conflicts an LLM synthesizer will paper over silently.',
    ],
    quiz: [
      {
        q: 'What distinguishes orchestrator-workers from prompt chaining?',
        o: [
          'Orchestrator-workers uses more tokens',
          'Chaining\'s steps are fixed in code; the orchestrator decomposes the task at runtime, so the subtasks vary per input',
          'Chaining cannot use tools',
          'They are the same pattern',
        ],
        x: 1,
        w: 'The corridor vs the partner: chaining walks predetermined links; orchestrator-workers decides the decomposition per task — which is why it bridges toward true agency.',
        revisit: 123,
      },
      {
        q: 'A five-stage LLM pipeline with 92% per-stage reliability has roughly what end-to-end reliability, and what follows?',
        o: [
          '92% — reliability is set by the weakest stage',
          '~66% — errors compound multiplicatively, so every stage must justify its reliability tax and gates belong between stages',
          '100% with retries',
          '~85%',
        ],
        x: 1,
        w: '0.92⁵ ≈ 0.66. Compounding is the structural argument against gratuitous stages and for programmatic gates that catch failures early.',
        revisit: 123,
      },
      {
        q: 'When does evaluator-optimizer actually converge to better output?',
        o: [
          'Whenever you loop enough times',
          'When critique is genuinely easier than generation AND the evaluator has explicit, checkable criteria — otherwise it inherits reflection\'s ceiling',
          'Only with two different models',
          'When temperature is zero',
        ],
        x: 1,
        w: 'The loop needs an evaluator with real signal: independent criteria, ideally code-checkable. A vague self-critic converges to confident sameness (Day 121\'s reflection lesson).',
        revisit: 121,
      },
    ],
    resources: [
      { label: 'Anthropic — Building Effective Agents (the five patterns; core reading)', url: 'https://www.anthropic.com/engineering/building-effective-agents', type: 'article', time: '35 min' },
      { label: 'Lilian Weng — LLM Powered Autonomous Agents', url: 'https://lilianweng.github.io/posts/2023-06-23-agent/', type: 'article', time: '20 min' },
      { label: 'LangChain docs — multi-agent & workflow orchestration', url: 'https://docs.langchain.com/oss/python/langchain/overview', type: 'docs', time: '15 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep: due cards + the three memory types from memory (D122)', minutes: 10 },
      { activity: 'Read Anthropic\'s essay + tech section', minutes: 30 },
      { activity: 'Guided: routing + evaluator-optimizer, then paper designs', minutes: 45 },
      { activity: 'Practice: error-compounding budget', minutes: 18 },
      { activity: 'Project: pattern card + triage design', minutes: 12 },
      { activity: 'Quiz + flashcards', minutes: 5 },
    ],
    completion: [
      'Router and evaluator-optimizer both run and annotated',
      'Three briefs designed; choices match (or thoughtfully argue with) the key',
      'Compounding math computed and gates placed with reasoning',
      'agent_patterns.md committed including the Day 126 triage design',
      'Quiz ≥ 2/3',
    ],
    connections: {
      back: 'The router is Day 111\'s tool choice one level up; evaluator-optimizer is Day 120\'s loop aimed at quality; orchestrator-workers is Day 121\'s planner with delegated executors; parallel fan-out is Day 40\'s asyncio in costume.',
      forward: 'Day 126 builds the triage design you just committed to. Day 137 evals the router and trajectories; Day 160\'s AI system design round hands you these briefs with a whiteboard.',
    },
    flashcards: [
      { f: 'The five workflow patterns?', b: 'Prompt chaining, routing, parallelization (sectioning/voting), orchestrator-workers, evaluator-optimizer. All code-defined paths; agents direct their own.' },
      { f: 'Workflow vs agent, one line?', b: 'Workflow: code defines the path, LLM fills steps. Agent: model chooses tools and path from observations. Prefer the simplest adequate option.' },
      { f: 'Error compounding rule of thumb?', b: 'Reliabilities multiply: five 92% stages ≈ 66% end-to-end. Gates between stages + fewer hops = the countermeasures.' },
      { f: 'When is TRUE multi-agent justified?', b: 'Separate contexts genuinely required: privilege boundaries, parallel exploration at scale, competing hypotheses — not because the problem has parts.' },
      { f: 'What makes evaluator-optimizer converge?', b: 'Explicit checkable criteria and critique-easier-than-generation. Enforce the code-checkable subset programmatically.' },
    ],
    deepDive: [
      { label: 'Handoffs vs agents-as-tools', note: 'Two multi-agent wirings: transfer the whole conversation (handoff) vs call a sub-agent like a function and use its return (tool). The second keeps the orchestrator in control and is usually the safer start.' },
    ],
  },
  {
    id: 'd124', day: 124, week: 18, phase: 6, kind: 'lesson',
    title: 'Model Context Protocol',
    analogy: 'The universal adapter',
    objectives: [
      'Explain the N×M integration problem and how a protocol reduces it to N+M',
      'Diagram MCP\'s participants — host, client, server — and what each owns',
      'Distinguish the three server primitives (tools, resources, prompts) and choose the right one for a capability',
      'Build and run a minimal Python MCP server and connect it to a host',
    ],
    prereqs: [
      { day: 111, label: 'Tool use & function calling' },
      { day: 120, label: 'Agents I — the loop' },
      { day: 41, label: 'HTTP & APIs' },
    ],
    eli5: `Before USB, every gadget shipped its own plug, and every computer needed a matching port: N gadgets × M computers = a drawer full of adapters and a lot of gadgets you simply couldn't connect. USB replaced the drawer with one agreement: any device that speaks the standard works with any computer that has the port. Device makers build ONE plug; computer makers build ONE port; N×M melted into N+M.

AI tools had the same drawer problem. Your Day 111 toolbelt was hand-wired to your app: your schemas, your dispatch code. Want those same tools in Claude Desktop? Rewire. In your IDE agent? Rewire again. Every tool provider was soldering custom plugs for every AI app. The Model Context Protocol is the USB moment: a tool provider wraps their capability in an MCP *server* (one plug), and any MCP *host* — Claude Desktop, an IDE, your own agent — can discover and use it through a standard handshake (one port). The host asks "what have you got?", the server answers with a machine-readable menu, and from then on the model can order off that menu. Build your filesystem tools once; every MCP-speaking app can use them forever.`,
    why: `MCP went from Anthropic announcement (late 2024) to industry standard with remarkable speed — Claude, ChatGPT, VS Code, Cursor, and thousands of community servers speak it — because N×M was everyone's cost center. For you it is doubly practical: as an AI engineer you will consume MCP servers (databases, ticketing, browsers) instead of hand-wiring integrations, and as an FDE the sentence "we can expose your internal systems to any AI application through one MCP server" is a deal-shaping capability. It is also fresh interview material: hosts vs clients vs servers, and why tools/resources/prompts are separate primitives, are exactly the questions that reveal whether someone has built with it or only read headlines.`,
    tech: `### Architecture: host, client, server

The **host** is the AI application (Claude Desktop, an IDE, your agent harness). For each connected server it creates one **client** — a connection object owning the 1:1 session. The **server** is the program exposing capabilities; it can run locally as a child process (**stdio transport** — the host launches it and speaks JSON-RPC over stdin/stdout) or remotely (**streamable HTTP transport** — POST + optional server-sent events, with OAuth-style auth). Same messages either way; the transport is swappable plumbing. Under the hood it is JSON-RPC 2.0: discovery ("what do you support?"), then listing (\`tools/list\`), then invocation (\`tools/call\`) — a formalized, discoverable version of the tool loop you hand-rolled on Day 111.

### The three server primitives

- **Tools** — model-controlled actions: functions the LLM decides to invoke (query a DB, create a ticket). Each carries a name, description, and JSON Schema for inputs — your Day 111 schema-design judgment applies verbatim, because the description IS the model's documentation.
- **Resources** — application-controlled context: readable data addressed by URI (a file's contents, a DB schema, a config). The host decides what to load into context; the model doesn't "call" a resource.
- **Prompts** — user-controlled templates: reusable, parameterized interactions the user explicitly invokes (a /summarize command).

The distinction is *who decides*: model (tools), application (resources), user (prompts). Servers advertise what they support; hosts discover it at connect time — so a server can add a tool and every connected host picks it up without redeploying anything. That discovery step is what makes the N+M economics real.

### Security model

MCP servers run code and touch data on the model's behalf, so the protocol bakes in consent choke points: hosts must surface which tools exist, and tool invocations flow through the host where approval UX lives (you will formalize approval gates on Day 125). The threat you must already see today: a malicious or compromised server is a prompt-injection vector — its tool descriptions and results enter the model's context (the con artist from Day 132's preview, arriving through the adapter). Trust servers the way you trust dependencies: pin, review, least-privilege.`,
    viz: 'mcp-hosts',
    guided: [
      {
        title: 'The wire protocol by hand — discovery to invocation',
        minutes: 20,
        body: `1. Create \`mcp_wire.py\` with the starter code: a toy in-process "server" that dispatches the three JSON-RPC methods, and a "host" that walks the real message sequence — list tools, then call one. No SDK, no processes: the point is to see that MCP is just structured messages, so nothing about it stays magic.
2. Run it. Read the \`tools/list\` response: name, description, inputSchema — recognize Day 111's tool schema, now standardized and *discoverable*. The host learned the menu at runtime; nothing was hard-coded.
3. Add a second tool to SERVER_TOOLS (e.g. \`delete_note\`) and rerun WITHOUT touching the host code. The host picks it up from discovery — that is the N+M economics in one edit.
4. Make the call fail: request a tool name that doesn't exist and see the JSON-RPC error object come back as data (not a crash) — errors-as-observations again, one protocol layer down.
5. Note what this toy omits (real framing, transports, capability negotiation, notifications) — the SDK in exercise 2 handles all of it.`,
        code: `# mcp_wire.py — the MCP message shapes, in-process. SDK does this for real.
import json

NOTES = {"standup": "Daily at 9:30, #eng-sync", "oncall": "Rotation wiki page 4"}

SERVER_TOOLS = {
    "search_notes": {
        "description": "Return titles of notes whose text contains the query.",
        "inputSchema": {"type": "object",
                        "properties": {"query": {"type": "string"}},
                        "required": ["query"]},
        "fn": lambda args: [t for t, x in NOTES.items()
                            if args["query"].lower() in x.lower()],
    },
    "add_note": {
        "description": "Store a note under a title. Overwrites existing.",
        "inputSchema": {"type": "object",
                        "properties": {"title": {"type": "string"},
                                       "text": {"type": "string"}},
                        "required": ["title", "text"]},
        "fn": lambda args: NOTES.update({args["title"]: args["text"]}) or "saved",
    },
}

def server_handle(msg):                       # the server side of the wire
    method, mid = msg.get("method"), msg.get("id")
    if method == "tools/list":
        tools = [{"name": n, "description": t["description"],
                  "inputSchema": t["inputSchema"]} for n, t in SERVER_TOOLS.items()]
        return {"jsonrpc": "2.0", "id": mid, "result": {"tools": tools}}
    if method == "tools/call":
        name = msg["params"]["name"]
        if name not in SERVER_TOOLS:
            return {"jsonrpc": "2.0", "id": mid,
                    "error": {"code": -32602, "message": f"unknown tool: {name}"}}
        out = SERVER_TOOLS[name]["fn"](msg["params"]["arguments"])
        return {"jsonrpc": "2.0", "id": mid,
                "result": {"content": [{"type": "text", "text": json.dumps(out)}]}}
    return {"jsonrpc": "2.0", "id": mid, "error": {"code": -32601, "message": "no such method"}}

# --- the host walks the sequence ---
listing = server_handle({"jsonrpc": "2.0", "id": 1, "method": "tools/list"})
print("discovered tools:")
for t in listing["result"]["tools"]:
    print("  -", t["name"], "|", t["description"])

call = {"jsonrpc": "2.0", "id": 2, "method": "tools/call",
        "params": {"name": "search_notes", "arguments": {"query": "rotation"}}}
print("\\ncall:", json.dumps(call["params"]))
print("resp:", server_handle(call)["result"]["content"][0]["text"])

bad = server_handle({"jsonrpc": "2.0", "id": 3, "method": "tools/call",
                     "params": {"name": "drop_database", "arguments": {}}})
print("\\nbad call ->", bad["error"]["message"], "(an error object, not a crash)")`,
      },
      {
        title: 'A real MCP server with the Python SDK',
        minutes: 22,
        body: `This exercise needs a local environment (\`pip install "mcp[cli]"\`); browser-only today means read every line, map it onto exercise 1, and run it tonight.

1. Create \`notes_server.py\` with the starter code: the same notes capability, now as a real MCP server via FastMCP. Note how little is left: decorators register tools, type hints become the inputSchema, docstrings become the descriptions the model reads — everything you hand-wrote in exercise 1, generated.
2. Test it with the MCP Inspector: \`mcp dev notes_server.py\` opens a browser UI where you can list and invoke your tools — you are being the host, manually.
3. Connect it to a real host: add the printed config block to Claude Desktop's config file (or any MCP-speaking host), restart, and ask the assistant "what's in my oncall note?" Watch it discover and call YOUR server — with the host's consent prompt in between (that approval UX is the security model working).
4. Add a resource: \`get_note\` exposed at \`notes://{title}\` — data the HOST can load, distinct from tools the MODEL calls. Re-run the Inspector and find it under resources, not tools. Say out loud who decides for each primitive: model / application / user.`,
        code: `# notes_server.py — a real MCP server. Local: pip install "mcp[cli]"
# Run in dev UI:  mcp dev notes_server.py
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("nimbus-notes")

NOTES = {"standup": "Daily at 9:30, #eng-sync", "oncall": "Rotation wiki page 4"}

@mcp.tool()
def search_notes(query: str) -> list[str]:
    """Return titles of notes whose text contains the query (case-insensitive)."""
    return [t for t, x in NOTES.items() if query.lower() in x.lower()]

@mcp.tool()
def add_note(title: str, text: str) -> str:
    """Store a note under a title. Overwrites any existing note with that title."""
    NOTES[title] = text
    return f"saved note '{title}'"

@mcp.resource("notes://{title}")
def get_note(title: str) -> str:
    """Read one note's full text by title."""
    return NOTES.get(title, "no such note")

if __name__ == "__main__":
    mcp.run(transport="stdio")     # host launches this process, speaks stdin/stdout

# Claude Desktop config (claude_desktop_config.json) to connect a host:
# {"mcpServers": {"nimbus-notes": {
#     "command": "python", "args": ["/absolute/path/to/notes_server.py"]}}}`,
      },
    ],
    practice: [
      {
        title: 'Primitive triage + the trust review',
        minutes: 18,
        body: `Part 1 — for each capability, pick tool, resource, or prompt, with one line of reasoning: (a) run a read-only SQL query the model composes; (b) the database's schema, so the model writes correct SQL; (c) a user-invoked "/weekly-report" template; (d) create a Jira ticket; (e) the contents of the currently open file in an editor; (f) redact PII from pasted text on demand.

Part 2 — you are evaluating a community MCP server for your team ("connects to your CRM!"). Write the five-question security review you'd run before allowing it: think about what enters the model's context from the server, what credentials the server holds, and what its tools can do. Compare with: (1) what do its tool descriptions and results inject into context? (2) what scopes/credentials does it demand — least privilege? (3) which tools are destructive and does the host gate them? (4) is the code auditable and the version pinnable? (5) where does data flow — does ticket text leave your boundary?

Answers part 1: a tool; b resource; c prompt; d tool (destructive — flag for approval); e resource; f tool (or prompt if user-invoked by convention).`,
      },
    ],
    project: {
      title: 'An MCP server for the capstone corpus',
      brief: `Build \`docsqa_server.py\`: an MCP server exposing your capstone (Day 119) to any host. Tools: \`search_docs(query, k=3)\` calling your hybrid retriever and returning chunks with citations, and \`answer_question(question)\` returning your grounded \`answer()\` output (text, citations, refused). Resource: \`corpus://{doc_id}\` serving raw document text for host-side context. Write model-facing docstrings with the same care as Day 111 schemas — they are the only manual the model gets. Verify with \`mcp dev\` (screenshot or transcript in the README), and add a security note: why \`answer_question\` is safe to auto-approve but a hypothetical \`reindex_corpus\` tool would need an approval gate. Commit to the capstone repo — this is the capstone's second interface (CLI, now MCP; API comes Day 148).`,
      rubric: [
        'Both tools wrap the real Day 119 modules, not reimplementations',
        'search_docs returns chunk text + resolvable citations; answer_question preserves the refusal path',
        'Resource serves raw docs by id at a corpus:// URI',
        'Docstrings/type hints produce clean discoverable schemas (verified in Inspector)',
        'README records the Inspector verification and the approval-gate security note',
        'Committed to the capstone repo',
      ],
    },
    mistakes: [
      'Confusing the participants: the host is the app, the client is the per-server connection the host owns, the server exposes capabilities. One host, many clients, each pinned to one server.',
      'Exposing everything as tools. Data the application should load is a resource; user-invoked templates are prompts. The primitive encodes who decides — model, app, or user.',
      'Writing lazy tool descriptions. Discovery means the model chooses tools by description alone; vague descriptions produce wrong tool choices at runtime, same as Day 111.',
      'Treating community servers as safe because the protocol is standard. The protocol standardizes the wire, not the trustworthiness — server output is injected context; review, pin, least-privilege.',
      'Hard-coding against one server\'s tool list. The entire point is runtime discovery; enumerate tools/list at connect time and handle the menu changing.',
      'Building a bespoke REST API where an MCP server was the answer. If the consumer is an AI app — yours or a customer\'s — MCP gets you every host for free; that is the N+M argument in reverse.',
    ],
    quiz: [
      {
        q: 'MCP turns the integration problem from N×M into N+M because…',
        o: [
          'It compresses tool schemas',
          'Each tool provider builds one server and each AI app builds one client implementation; any pair then interoperates through the shared protocol',
          'It runs all tools on one machine',
          'Servers share a single global registry',
        ],
        x: 1,
        w: 'One plug per device, one port per computer: N servers + M hosts replace N×M bespoke integrations. Discovery at connect time is what makes the pairing automatic.',
        revisit: 124,
      },
      {
        q: 'A DB\'s schema should be exposed to the model as which primitive, and why?',
        o: [
          'A tool — the model calls it',
          'A resource — it is context data the APPLICATION decides to load, not an action the model invokes',
          'A prompt — users request schemas',
          'It cannot be exposed',
        ],
        x: 1,
        w: 'Resources are application-controlled context addressed by URI. Tools are model-controlled actions; prompts are user-controlled templates. The primitive encodes who decides.',
        revisit: 124,
      },
      {
        q: 'Why is a malicious MCP server a prompt-injection vector?',
        o: [
          'It can read your model weights',
          'Its tool descriptions and tool results are injected into the model\'s context, where adversarial instructions can steer the agent',
          'JSON-RPC is unencrypted',
          'It bypasses the host',
        ],
        x: 1,
        w: 'Everything a server returns becomes model-visible text. A poisoned description or result is the con artist (Day 132) arriving through the adapter — hence consent UX, pinning, and least privilege.',
        revisit: 124,
      },
    ],
    resources: [
      { label: 'MCP — What is the Model Context Protocol? (intro)', url: 'https://modelcontextprotocol.io/docs/getting-started/intro', type: 'docs', time: '15 min' },
      { label: 'MCP — Architecture overview (participants, primitives, transports)', url: 'https://modelcontextprotocol.io/docs/learn/architecture', type: 'docs', time: '30 min' },
      { label: 'MCP — Build an MCP server (Python quickstart)', url: 'https://modelcontextprotocol.io/docs/develop/build-server', type: 'docs', time: '30 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep: due cards + the five patterns from memory (D123)', minutes: 10 },
      { activity: 'ELI5 + tech read; mcp-hosts visualizer', minutes: 20 },
      { activity: 'Guided: wire protocol by hand + real SDK server', minutes: 42 },
      { activity: 'Practice: primitive triage + trust review', minutes: 18 },
      { activity: 'Project: docsqa_server.py', minutes: 22 },
      { activity: 'Quiz + flashcards', minutes: 8 },
    ],
    completion: [
      'Wire lab run; second tool discovered without host changes',
      'notes_server.py verified in Inspector (or fully traced if browser-only, run scheduled)',
      'All six primitive-triage calls correct; security review written',
      'docsqa_server.py committed to the capstone repo with README verification',
      'Quiz ≥ 2/3',
    ],
    connections: {
      back: 'Day 111\'s tool schemas and descriptions are exactly what MCP standardizes and makes discoverable; Day 41\'s HTTP/JSON-RPC literacy is the transport layer; Day 120\'s loop is what lives inside every MCP host.',
      forward: 'Day 125 builds the approval gates MCP\'s consent model expects around destructive tools. Day 132 weaponizes (then defends) the injection vector you named today, and Day 169 pitches MCP as the enterprise integration story.',
    },
    flashcards: [
      { f: 'MCP participants and ownership?', b: 'Host = the AI app; it creates one client per connection; server = the capability provider. One host, many clients, each 1:1 with a server.' },
      { f: 'The three server primitives and who decides?', b: 'Tools: model-invoked actions. Resources: application-loaded context (URIs). Prompts: user-invoked templates.' },
      { f: 'MCP\'s two transports?', b: 'stdio (host launches a local child process) and streamable HTTP (remote, POST + SSE, OAuth-style auth). Same JSON-RPC either way.' },
      { f: 'The N×M → N+M argument?', b: 'One standard server per tool provider + one client implementation per host replaces bespoke per-pair integrations; discovery pairs them at runtime.' },
      { f: 'Why review third-party MCP servers?', b: 'Their descriptions and results are injected into model context (injection vector) and they hold credentials — pin versions, least privilege, gate destructive tools.' },
    ],
    deepDive: [
      { label: 'MCP server concepts — tools/resources/prompts in depth', url: 'https://modelcontextprotocol.io/docs/learn/server-concepts', note: 'The full primitive semantics, including annotations for destructive vs read-only tools — the metadata Day 125\'s approval gates key off.' },
    ],
  },
  {
    id: 'd125', day: 125, week: 18, phase: 6, kind: 'lesson',
    title: 'Agent Reliability',
    analogy: 'Trust, but verify',
    objectives: [
      'Name the major agent failure classes (loops, drift, tool misuse, runaway cost) and a detector for each',
      'Implement loop detection, cost guards, and an approval gate as tool-layer wrappers, not prompt requests',
      'Design least-privilege toolsets and idempotent actions for a given agent task',
      'Produce an audit trail (JSONL) sufficient to reconstruct any run after the fact',
    ],
    prereqs: [
      { day: 120, label: 'Agents I — the loop' },
      { day: 122, label: 'Agents III — memory & context' },
      { day: 44, label: 'Security, authN & authZ' },
    ],
    eli5: `The intern did great work all week, so on Friday you're tempted to hand over your corporate card, the master keys, and say "handle everything." No manager on earth does that — not because the intern is bad, but because trust is built with *structure*: give her keys only to the rooms today's job needs (least privilege), require a sign-off before anything irreversible — sending the email, deleting the folder (approvals), have her log every action in the site diary as she goes (audit trail), and agree on a spending cap and a check-in time so a stuck task can't quietly burn the whole day (budgets and loop detection).

Notice what these have in common: none of them are advice to the intern. They are properties of the BUILDING — the doors, the forms, the logbook. You don't ask the intern to please not enter the server room; the badge doesn't open it. Agent reliability is exactly this move: stop trying to prompt your way to safety ("be careful!") and start building the guardrails into the tool layer, where the model physically cannot bypass them. The agent stays creative inside a room you made safe to be creative in.`,
    why: `Agents fail in ways demos never show: retrying the same broken call forty times at 3am, "fixing" a config by deleting it, drifting from summarize-the-tickets to answering them, or burning a hundred dollars of tokens on a task worth five. Production agent horror stories almost all reduce to a missing guard that costs twenty lines. This is also the week's material customers probe hardest — "what if it does something wrong?" decides deals, and "every action is logged, destructive ones need human approval, and it can only touch these three systems" is the answer that closes them. Everything you build today wraps the D120–122 agent and carries straight into tomorrow's triage checkpoint and Day 137's trajectory evals.`,
    tech: `### A failure taxonomy with detectors

- **Loops**: identical or near-identical (tool, args) repeating. Detector: hash recent calls, trip at N repeats. LLMs genuinely do this when an approach fails and nothing steers them off it.
- **Drift**: the agent leaves its mission (asked to summarize, starts replying). Detector: scope-limited tools make most drift *impossible*; for the rest, a cheap goal-check call or Day 121's done_when catches it.
- **Tool misuse**: legal-but-wrong calls — deleting to "clean up," writing outside the workspace. Detector/preventer: argument validation in the tool wrapper (path allowlists, id checks) — Day 44's authorization thinking applied to a nonhuman caller.
- **Runaway cost**: steps × tokens × retries compounding. Detector: a cost meter accumulated per run with a hard ceiling — the Day 120 seatbelt, now denominated in dollars.

### The control structure

**Least privilege**: build the toolset per task, not per agent — a read-only investigation gets read-only tools; there is no "delete" to misuse if no delete tool was mounted. **Sandboxing**: point tools at copies, staging, or dry-run modes by default. **Idempotency**: Day 46's lesson lands here — agents retry, so \`create_ticket(idempotency_key)\` must be safe to call twice; check-then-act beats act-and-hope. **Approval gates (human-in-the-loop)**: classify each tool as read / write / destructive-or-irreversible; destructive calls pause the run, surface (tool, args, context) to a human, and proceed only on approval. Deny is not an error — it returns to the agent as an observation ("approval denied: propose an alternative"), steering rather than crashing. This is the consent choke point MCP's host model anticipated yesterday.

**Audit trail**: one JSONL line per event — timestamp, run id, step, tool, args, outcome or error, tokens, cost, approval decisions. The bar: reconstruct any run without guessing. This file is tomorrow's debugging tool, Day 137's eval input, and Day 142's tracing precursor.

**Graceful degradation**: when guards trip, prefer degraded service over silence — return partial results with an honest status ("stopped at budget; here's what I found and where I was stuck"). An agent that fails loudly, cheaply, and legibly is one you can ship; the prompt is advisory, the tool layer is enforcement.`,
    viz: null,
    guided: [
      {
        title: 'Wrap the agent in guards, then watch each one fire',
        minutes: 30,
        body: `1. Create \`agent_guards.py\` with the starter code. \`Guarded\` wraps your Day 120 TOOLS dict without changing the loop or tools themselves — enforcement lives at the boundary the model cannot cross.
2. Run scenario 1 (loop): a stuck ScriptedLLM re-reads the same missing file forever. The loop detector trips at 3 identical calls and ends the run with a legible status. Check the audit JSONL: the repetition is visible at a glance.
3. Run scenario 2 (cost): each call charges the meter; the run stops at the ceiling with partial results — degraded, not silent.
4. Run scenario 3 (approval): the agent requests \`delete_file\`. The gate pauses, prints the (tool, args) for review, and the scripted human DENIES. Confirm the denial arrives as an observation and the agent continues with a non-destructive alternative — steering, not crashing.
5. Read the audit trail end to end and answer: could you reconstruct each run without the code? If any line leaves you guessing, add the missing field — that is the actual bar.`,
        code: `# agent_guards.py — guardrails as tool-layer wrappers around the D120 agent.
import json, time

FS = {"settings.yaml": "rate_limit: 120", "notes.txt": "TODO tidy configs"}
def list_files(): return sorted(FS)
def read_file(name):
    if name not in FS: raise FileNotFoundError(name)
    return FS[name]
def delete_file(name): return FS.pop(name) and f"deleted {name}"

TOOL_CLASS = {"list_files": "read", "read_file": "read", "delete_file": "destructive"}
COST = {"read": 0.01, "destructive": 0.02}      # toy per-call cost, stands in for tokens

class Guarded:
    def __init__(self, tools, approver, max_cost=0.10, max_repeats=3):
        self.tools, self.approve = tools, approver
        self.max_cost, self.max_repeats = max_cost, max_repeats
        self.spent, self.recent, self.audit = 0.0, [], []
    def _log(self, **event):
        event["ts"] = round(time.time(), 2)
        self.audit.append(event)
        print("  audit:", json.dumps(event))
    def call(self, tool, args):
        sig = f"{tool}:{json.dumps(args, sort_keys=True)}"
        self.recent.append(sig)
        if self.recent[-self.max_repeats:].count(sig) >= self.max_repeats:
            self._log(event="LOOP_DETECTED", tool=tool, args=args)
            raise RuntimeError("loop detected: same call repeated; run stopped")
        cost = COST[TOOL_CLASS[tool]]
        if self.spent + cost > self.max_cost:
            self._log(event="COST_CEILING", spent=self.spent)
            raise RuntimeError(f"cost ceiling hit at {self.spent:.2f}; partial results stand")
        if TOOL_CLASS[tool] == "destructive":
            ok = self.approve(tool, args)               # human-in-the-loop
            self._log(event="APPROVAL", tool=tool, args=args, approved=ok)
            if not ok:
                return "APPROVAL DENIED: choose a non-destructive alternative"
        self.spent += cost
        try:
            out = self.tools[tool](**args)
            self._log(event="CALL", tool=tool, args=args, ok=True, spent=self.spent)
            return out
        except Exception as e:
            self._log(event="CALL", tool=tool, args=args, ok=False, error=str(e))
            return f"TOOL ERROR: {e}"

def scripted_human(tool, args):
    print(f"  >> APPROVAL REQUESTED: {tool}({args}) — deny (policy: no deletions)")
    return False

g = Guarded({"list_files": list_files, "read_file": read_file,
             "delete_file": delete_file}, approver=scripted_human)

print("--- scenario 1: stuck loop ---")
try:
    for _ in range(5): g.call("read_file", {"name": "ghost.txt"})
except RuntimeError as e: print("STOP:", e)

print("--- scenario 3: destructive needs approval ---")
print("agent sees:", g.call("delete_file", {"name": "notes.txt"}))
print("notes.txt still present:", "notes.txt" in FS)`,
      },
      {
        title: 'Least privilege: build the toolset per task',
        minutes: 12,
        body: `1. Write \`toolset_for(task_type)\` returning only what each task needs: \`investigate\` → {list_files, read_file}; \`cleanup\` → adds delete_file (destructive-classed, so gated anyway); \`report\` → {read_file, write_file} with write_file's wrapper validating the path is inside \`reports/\` (an argument allowlist — misuse prevented by validation, not by hoping).
2. Rerun scenario 3 with the \`investigate\` toolset: the delete request now fails at dispatch ("unknown tool") — the strongest guard is the tool that was never mounted. Compare the two failure messages (unmounted vs denied) and note both returned as observations.
3. For tomorrow's triage agent, draft its toolset on paper: classify_ticket (read), search_docs (read — your capstone retriever), draft_reply (write, schema-validated), escalate (destructive-classed: it emails a human). Justify each classification in a phrase — this paper lands in tonight's project.`,
      },
    ],
    practice: [
      {
        title: 'Red-team your own agent',
        minutes: 20,
        body: `Attack the guarded agent three ways, then patch what you find. (1) The near-miss loop: alternate two failing calls (A, B, A, B…) — does your exact-signature detector fire? Upgrade it to trip on no-progress: N consecutive calls with error observations. (2) The salami slicer: many cheap calls that each pass the per-call check but blow the total budget — verify the meter catches the accumulation (and fix it if you only checked per-call). (3) The laundered deletion: add a \`run_shell(cmd)\` tool classed "read" and watch the agent (or you, roleplaying it) delete via \`rm\` — write the two-line moral about tool classification granularity and why catch-all tools defeat every guard.

Hints: (1) keep a window of outcomes, not just signatures; (3) the fix is not a smarter classifier — it is not mounting catch-all tools, or classing them destructive.`,
      },
    ],
    project: {
      title: 'Harden the Week 18 agent',
      brief: `Ship \`agent/guards.py\` in the agent package: the \`Guarded\` wrapper (loop/no-progress detection, cost ceiling, approval gates, JSONL audit trail to a file), \`toolset_for()\` least-privilege factories, and integration with \`run_agent\` via the on_step hook from Day 120. Tests must cover: loop trip, no-progress trip, cost ceiling with partial-results message, approval denial returned as observation, unmounted-tool dispatch failure, and an audit-trail replay test — parse the JSONL from a run and assert the full action sequence is reconstructable. Add \`RELIABILITY.md\`: the failure taxonomy table (failure → detector → response) plus your triage-agent toolset classification from guided 2. This hardened agent is exactly what Day 126 deploys.`,
      rubric: [
        'All guards live in the tool layer; the loop and tools are unmodified',
        'Six test scenarios pass, including audit-replay reconstruction',
        'Denials and guard trips return as observations or legible statuses, never bare crashes',
        'Cost guard caps the accumulated total, not just per-call cost',
        'RELIABILITY.md maps every taxonomy row to an implemented detector and response',
        'Committed to the practice repo',
      ],
    },
    mistakes: [
      'Prompting for safety instead of enforcing it. "Never delete files" in the system prompt is advisory; a tool layer without delete, or with a gate, is enforcement. The prompt asks; the wrapper decides.',
      'Detecting only exact-repeat loops. Agents alternate between two failing approaches too — detect no-progress (consecutive errors, no new observations), not just identical signatures.',
      'Gating everything. If every read needs approval, humans rubber-stamp within an hour and the gate is theater. Reserve approvals for destructive/irreversible; let reads flow.',
      'Non-idempotent actions plus retries. An agent that retries create_ticket makes three tickets; idempotency keys and check-before-act are mandatory once loops and retries exist.',
      'Logging only failures. The audit trail must contain every action — the 3am question is "what did it DO?", and reconstruction needs the boring successful steps too.',
      'Catch-all tools (run_shell, eval) classed as safe. One generic tool launders every forbidden action through an innocent-looking call; don\'t mount what you can\'t classify.',
    ],
    quiz: [
      {
        q: 'Why is "never delete files" in the system prompt insufficient as a safety control?',
        o: [
          'Prompts cost tokens',
          'Instructions are advisory and fail under drift or injection; enforcement must live in the tool layer (unmounted tools, argument validation, approval gates) the model cannot bypass',
          'Models cannot read system prompts reliably',
          'It is sufficient',
        ],
        x: 1,
        w: 'The model can be confused, injected (Day 132), or simply wrong. Guards that are properties of the tool boundary hold regardless of what the model believes it should do.',
        revisit: 125,
      },
      {
        q: 'An agent alternates between two different failing tool calls: A, B, A, B… Which detector catches it?',
        o: [
          'Exact-signature repeat detection',
          'The approval gate',
          'No-progress detection: a window of consecutive error/unchanged observations trips regardless of call variety',
          'Schema validation',
        ],
        x: 2,
        w: 'Signature-matching misses alternating loops. Tracking outcomes — nothing new learned in N steps — catches the general stuck condition; exact-repeat detection is just its cheapest special case.',
        revisit: 125,
      },
      {
        q: 'An approval gate denies a destructive call. The best system behavior is…',
        o: [
          'Crash the run with an error',
          'Retry the approval hourly',
          'Return the denial to the agent as an observation so it can pursue a non-destructive alternative — steering, not stopping',
          'Log it silently and skip the step',
        ],
        x: 2,
        w: 'Denial is information (Day 120: errors are observations). Fed back, the agent replans around the constraint; crashed or silent, the mission dies or the gap hides.',
        revisit: 120,
      },
    ],
    resources: [
      { label: 'Anthropic — Building Effective Agents (guardrails & human oversight threads)', url: 'https://www.anthropic.com/engineering/building-effective-agents', type: 'article', time: '15 min' },
      { label: 'OWASP Top 10 for LLM Applications (excessive agency & related risks)', url: 'https://owasp.org/www-project-top-10-for-large-language-model-applications/', type: 'docs', time: '25 min' },
      { label: 'Simon Willison — prompt injection series (why prompts can\'t be the guard)', url: 'https://simonwillison.net/series/prompt-injection/', type: 'article', time: '20 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep: due cards + the three MCP primitives from memory (D124)', minutes: 10 },
      { activity: 'ELI5 + tech read: taxonomy and control structure', minutes: 20 },
      { activity: 'Guided: guards firing + least-privilege toolsets', minutes: 42 },
      { activity: 'Practice: red-team and patch', minutes: 20 },
      { activity: 'Project: agent/guards.py + RELIABILITY.md', minutes: 20 },
      { activity: 'Quiz + flashcards', minutes: 8 },
    ],
    completion: [
      'All three guard scenarios run; each trip explained from the audit trail',
      'Unmounted-vs-denied comparison articulated',
      'All three red-team attacks run and patched (or the moral written for #3)',
      'agent/guards.py + RELIABILITY.md committed, six tests green',
      'Quiz ≥ 2/3',
    ],
    connections: {
      back: 'Day 44\'s least-privilege and authorization thinking now applies to a nonhuman caller; Day 46\'s idempotency became an agent survival trait; Day 120\'s budget seatbelt grew into a full control structure; Day 124\'s consent model got its implementation.',
      forward: 'Tomorrow\'s triage agent ships inside these guards. Day 132 attacks them (injection), Day 137 evals trajectories from your audit trails, and Day 142 upgrades the JSONL into real distributed traces.',
    },
    flashcards: [
      { f: 'The four agent failure classes?', b: 'Loops (repeat/no-progress), drift (off-mission), tool misuse (legal-but-wrong calls), runaway cost. Each needs a tool-layer detector.' },
      { f: 'Where does agent safety enforcement live?', b: 'The tool layer: unmounted tools, argument validation, approval gates, cost meters. Prompts are advisory; wrappers are enforcement.' },
      { f: 'Tool classification for approval gates?', b: 'read (flows freely) / write (validated) / destructive-irreversible (pause for human approval; denial returns as an observation).' },
      { f: 'Least privilege for agents?', b: 'Toolset per task, not per agent. The strongest guard is the tool that was never mounted; avoid catch-all tools (run_shell) entirely.' },
      { f: 'The audit-trail bar?', b: 'One JSONL event per action (ts, run, step, tool, args, outcome, cost, approvals) — sufficient to reconstruct any run without guessing.' },
    ],
    deepDive: [
      { label: 'Dry-run and plan-approval modes', note: 'Beyond per-call gates: have the agent emit its full intended plan (Day 121\'s table) for approval BEFORE execution — one human review instead of five interrupts. Trade: less friction, staler approval.' },
    ],
  },
  {
    id: 'd126', day: 126, week: 18, phase: 6, kind: 'review',
    title: 'Week 18 Checkpoint: Support-Triage Agent',
    analogy: 'The intern\'s first shift',
    objectives: [
      'Reconstruct the agent loop, planning harness, memory system, patterns menu, and guard structure from memory',
      'Assemble the Week 18 modules into a support-triage agent: classify → retrieve → draft → escalate-with-approval',
      'Measure the agent on a 20-ticket labeled set and report classification accuracy, grounding, and escalation precision/recall',
      'Score ≥ 2/3 on the cumulative Week 18 quiz and requeue weak spots',
    ],
    prereqs: [
      { day: 120, label: 'Agents I — the loop' },
      { day: 122, label: 'Agents III — memory & context' },
      { day: 123, label: 'Workflow patterns — routing' },
      { day: 125, label: 'Agent reliability' },
    ],
    eli5: `The intern trained all week: Monday the work loop, Tuesday planning, Wednesday the notebook system, Thursday how the firm organizes teams, Friday the safety rules. Today is her first real shift — a morning inbox of twenty support tickets — and, just as important, her certification exam. First the exam, because a skill you can't recall without notes isn't yours yet: you'll rebuild the week's machinery from a blank page, and every stumble becomes a flashcard. The stumbles are the point — memory science says the recalls that almost fail are the ones that stick hardest.

Then the shift. For each ticket she: reads it and decides what KIND of problem it is (the front desk from Thursday), looks up the relevant policy in the company library (last week's open-book system, now one of her tools), drafts a reply that cites its sources, and — the judgment call — decides whether this one is above her pay grade. Refund over the limit? Security scare? Furious customer? Those go to a human, with her notes attached. And because it's her first shift, you don't grade on vibes: twenty tickets with known right answers, counted. How many classified correctly, how many replies actually grounded in the docs, how many escalations correct — and which mistake is cheapest.`,
    why: `This checkpoint is the program's thesis in miniature: RAG (Week 17) and agents (Week 18) composing into one measured system — precisely the architecture behind real support-automation products, and the single most common "design an AI system" interview brief. The evaluation half is the deeper lesson: "measured on a 20-ticket set" is the difference between a demo and a claim you can defend, and it previews Phase 7 (Days 134–140), where evals become your daily discipline. The artifact also feeds forward directly: Day 137 evals this exact agent's trajectories, and Day 160's system-design round asks you to whiteboard what you will have actually built today.`,
    tech: `### The architecture (assembled, not invented)

Today is composition day — every part exists: **Router** (Day 123): classify each ticket into billing / bug / how_to / account via one scripted-or-LLM call. **RAG handler** (Days 119): for how_to and policy-flavored tickets, call your capstone retriever as a *tool* — search_docs(query) returning chunks with citations (the Day 124 MCP server exposes the same capability; today you may import the module directly). **Drafting with an evaluator gate** (Day 123): draft a reply, then check explicit criteria in code — cites at least one chunk when docs were used, no invented policy numbers, length bounds — revise once on failure. **Escalation with approval** (Day 125): rule-triggered (refund amount over limit, security keywords, repeated-anger signals) OR low router confidence → the ticket pauses in an approval queue with the draft and evidence attached; denial returns as an observation. **Memory** (Day 122): after each ticket, record an episode; before each, recall similar past tickets — watch the third duplicate ticket get answered faster. **Guards** (Day 125): the whole run executes inside Guarded tools with an audit trail.

### The measurement contract

The 20-ticket set carries labels: true category, whether docs should be cited (and which section), and true escalate/handle. Report three numbers plus a confusion table: **classification accuracy** (target ≥ 16/20); **grounding rate** — of replies that used docs, fraction citing a correct chunk (target ≥ 80%); **escalation precision and recall** — and here the asymmetry that runs through all of engineering: a missed escalation (false negative) is a furious customer or a security incident; an over-escalation (false positive) is a few minutes of human review. Tune thresholds toward escalation recall (Day 75's harm-model reasoning, applied). Every number comes from code over the audit trail, not from eyeballing transcripts — that habit is Phase 7 arriving early.

### Review protocol

Blank-page first, notes second, cards from gaps: the testing effect (Day 119) applies to systems as much as formulas — if you can rebuild the loop skeleton, the guard list, and the pattern menu from memory, Week 18 is yours.`,
    viz: 'agent-loop',
    guided: [
      {
        title: 'Blank-page recall: rebuild Week 18 from memory',
        minutes: 20,
        body: `Close every editor tab and note first.

1. Write the Day 120 agent loop skeleton from memory — decide/act/observe, errors-as-observations, the four stop conditions. Then diff against \`agent/core.py\` line by line.
2. List the five workflow patterns with a one-phrase mechanism each, and state the workflow-vs-agent distinction (D123).
3. Draw the memory architecture: three memory types, what compaction keeps verbatim, and the O(N²) cost argument (D122).
4. Write the guard taxonomy table — four failure classes, detector for each (D125) — and the three MCP primitives with who-decides (D124).
5. Reproduce the plan-harness contract: what a done_when is, the failure ladder, who owns state (D121).
6. Diff everything; every gap becomes a flashcard. Re-answer this week's two hardest quiz questions from the dashboard's missed list.`,
      },
      {
        title: 'The shift: assemble and run the triage agent',
        minutes: 40,
        body: `1. In the practice repo, create \`triage/\`. Write \`tickets.json\`: 20 tickets you author — 6 billing (2 with refund amounts over the 100 USD limit), 5 bug reports (1 mentioning "security breach"), 6 how-to/policy questions answerable from your Nimbus capstone corpus, 3 account requests (1 from a twice-angry customer thread). Label each: category, expected_docs (section id or null), escalate (true/false). Authoring the labels IS designing the eval — you did this for the corpus on Day 119.
2. Write \`triage/agent.py\` wiring the week's modules per the architecture you committed to in \`agent_patterns.md\` (D123): router → (RAG tool for docs tickets) → draft → evaluator gate → escalation check → approval queue. Run everything inside \`Guarded\` toolsets with the audit trail on. The scripted classifier/drafter stand-ins keep it runnable in-browser; the README maps each to its real LLM call (you have made this mapping four times this week — it should feel mechanical).
3. Write \`triage/score.py\`: read the audit trail + outputs, compute classification accuracy, grounding rate, escalation precision/recall, and print the 4×4 confusion table.
4. Run the shift. Twenty tickets, one command, three numbers and a table out.
5. The security-breach ticket and both over-limit refunds MUST be in the approval queue. If any slipped through, that is a failed guard — find it in the audit trail before touching any code.`,
      },
    ],
    practice: [
      {
        title: 'Error analysis: the worst ticket',
        minutes: 15,
        body: `Take your worst failure (a misclassification, an ungrounded reply, or a missed escalation — if you scored perfectly, harden a ticket until you don't: add an ambiguous billing-bug hybrid, a policy question using vocabulary far from the corpus, or a polite message hiding a refund demand). Diagnose it with the right week's tool: routing errors → D123 (router confidence, category definitions); grounding failures → walk the Day 118 RAG flowchart; escalation misses → D125 (rule coverage vs classifier confidence). Fix at the guilty layer, rerun the full 20, and append a 3-line postmortem to the README: symptom → layer → fix → metric before/after. One number must improve and none may regress — if a fix trades accuracy for recall, say so explicitly.`,
      },
    ],
    project: {
      title: 'The measured triage agent',
      brief: `Deliver \`triage/\` complete in the practice repo: 20 labeled tickets, the assembled agent (router + RAG tool + evaluator-gated drafting + escalation approval queue + memory + guards), the scorer, and a README reporting the three headline metrics with the confusion table, the postmortem, and the real-LLM mapping for every scripted stand-in. Targets: classification ≥ 16/20, grounding ≥ 80%, escalation recall = 100% on the three must-escalate tickets (precision may pay for it — say what it cost). Tag it \`week18\`. This is the artifact Day 137 evals, and the system you will diagram from memory in the Day 160 design round.`,
      rubric: [
        'All 20 tickets processed in one command; audit trail reconstructs every run',
        'Classification ≥ 16/20 with confusion table reported',
        'Docs-flavored replies cite resolvable chunks; grounding rate ≥ 80% and computed by code',
        'All three must-escalate tickets land in the approval queue (recall 100%); precision reported honestly',
        'Postmortem shows a metric improved at the correctly-diagnosed layer without silent regressions',
        'Tagged week18 with the real-LLM mapping in the README',
      ],
    },
    mistakes: [
      'Grading the agent by reading a few transcripts. Twenty labeled tickets with code-computed metrics is the minimum honest claim; vibes-grading is how demos ship and products fail.',
      'Tuning escalation for precision. The false-negative (missed security incident) costs incomparably more than a human reviewing an unnecessary escalation — tune for recall and report the price.',
      'Rebuilding instead of composing. Today\'s agent is five imports and wiring; if you are writing new loop logic, stop and use the week\'s modules — composition is the checkpoint skill.',
      'Letting the drafter answer doc questions from its own head. The RAG tool exists so replies cite chunks; an eloquent uncited reply about the refund policy is the capstone\'s named nightmare in agent clothing.',
      'Reviewing by rereading lesson notes. Blank-page reconstruction first — the diff IS the review; recognition without recall decays in days.',
      'Skipping the confusion table. Aggregate accuracy hides that all four errors are billing-vs-account swaps — the table tells you which prompt or rule to fix; the average tells you nothing.',
    ],
    quiz: [
      {
        q: 'The triage agent\'s escalation gate should be tuned toward recall because…',
        o: [
          'Recall is always the right metric',
          'A missed must-escalate ticket (security incident, over-limit refund) is far costlier than a human reviewing an unnecessary escalation — the harm model sets the metric',
          'Precision cannot be measured here',
          'It reduces token costs',
        ],
        x: 1,
        w: 'Asymmetric costs decide thresholds (Day 75\'s lesson, applied): cheap false positives, catastrophic false negatives → maximize recall on must-escalates and pay the review tax knowingly.',
        revisit: 125,
      },
      {
        q: 'A reply about the refund policy is fluent, plausible, and cites nothing. Under this week\'s architecture, which component failed?',
        o: [
          'The router',
          'The evaluator gate: "cites at least one chunk when docs were used" is an explicit, code-checkable criterion that should have bounced the draft for revision',
          'The memory system',
          'The approval queue',
        ],
        x: 1,
        w: 'The drafter will sometimes answer from parametric memory; that is WHY the evaluator gate exists (Day 123) with grounding as a hard criterion. Uncited policy claims must not pass it.',
        revisit: 123,
      },
      {
        q: 'Ticket 14 was processed but you cannot tell whether the RAG tool was called before drafting. What is missing?',
        o: [
          'A bigger context window',
          'The audit trail: every tool call, args, and outcome should be one JSONL event, making any run reconstructable without guessing',
          'More test tickets',
          'A better router',
        ],
        x: 1,
        w: 'Reconstruction-without-guessing is the audit bar from Day 125. If the question is answerable only by re-running, the trail failed — and Day 137\'s trajectory evals would have nothing to grade.',
        revisit: 125,
      },
    ],
    resources: [
      { label: 'Anthropic — Building Effective Agents (reread with a built system behind you)', url: 'https://www.anthropic.com/engineering/building-effective-agents', type: 'article', time: '20 min' },
      { label: 'Lilian Weng — LLM Powered Autonomous Agents (full pass)', url: 'https://lilianweng.github.io/posts/2023-06-23-agent/', type: 'article', time: '25 min' },
      { label: 'Hamel Husain — Your AI Product Needs Evals (preview of Phase 7)', url: 'https://hamel.dev/blog/posts/evals/', type: 'article', time: '25 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep: full due deck for Week 18 (SM-2 drill)', minutes: 15 },
      { activity: 'Guided 1: blank-page recall + diff + new cards', minutes: 20 },
      { activity: 'Guided 2: assemble and run the triage shift', minutes: 40 },
      { activity: 'Practice: worst-ticket error analysis', minutes: 15 },
      { activity: 'Project wrap: README metrics + tag week18', minutes: 15 },
      { activity: 'Cumulative quiz + requeue missed topics', minutes: 15 },
    ],
    completion: [
      'Blank-page recall diffed; gaps converted to flashcards',
      'Twenty tickets processed in one command inside guards with a complete audit trail',
      'Three headline metrics + confusion table computed by code and reported',
      'All must-escalate tickets in the approval queue; postmortem written',
      'Cumulative quiz ≥ 2/3 (retake after targeted review if lower)',
    ],
    connections: {
      back: 'Composition day: D120\'s loop, D121\'s verification, D122\'s memory and budget, D123\'s routing and evaluator gate, D124\'s tool interface, D125\'s guards — plus Week 17\'s retriever as the tool that grounds it all.',
      forward: 'Day 127 pivots to adaptation (fine-tuning); Day 132 attacks this agent with injection; Day 137 evals its trajectories from today\'s audit trails; Day 160 asks you to whiteboard this architecture under interview pressure.',
    },
    flashcards: [
      { f: 'Triage agent pipeline, in order?', b: 'Route (classify) → retrieve docs if needed (RAG tool) → draft → evaluator gate (grounding criteria) → escalation check → approval queue for must-escalates.' },
      { f: 'The three headline metrics for the triage checkpoint?', b: 'Classification accuracy (confusion table), grounding rate of doc-based replies, escalation precision AND recall — recall prioritized by the harm model.' },
      { f: 'Why must escalation recall beat precision here?', b: 'False negatives (missed security/refund escalations) are catastrophic; false positives cost minutes of review. Asymmetric harm sets the threshold.' },
      { f: 'What makes today\'s agent a workflow, mostly?', b: 'Code defines the path (route → retrieve → draft → gate); the LLM fills steps. Agency appears only inside steps — the simplest adequate design.' },
      { f: 'Where do the eval labels come from?', b: 'You author them with the tickets: true category, expected docs, escalate flag. Designing labels IS designing the eval — Phase 7\'s golden-set discipline, previewed.' },
    ],
    deepDive: [
      { label: 'Trajectory vs outcome scoring', note: 'Today you scored outcomes. Day 137 also grades the PATH — did it retrieve before drafting, escalate before replying? Your audit trail already contains everything that eval needs; skim it with that question in mind.' },
    ],
  },
];
