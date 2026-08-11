# Day-Content Authoring Guide

Every day of the 180-day program is one JS object following the schema in
`src/lib/curriculum.ts`. This guide defines the format, voice, and quality bar.
The exemplar at the bottom is the reference implementation — match its depth.

## File format

Each batch file exports one array, e.g.:

```js
// src/data/days-022-035.js  (illustrative)
export const DAYS_022_035 = [ { /* day 22 */ }, { /* day 23 */ }, ... ];
```

Rules for the JS itself:

- Long text fields are **template literals** (backticks).
- **NEVER use a raw backtick or `${` inside a template literal.** Inline code is
  written with escaped backticks: `` \`like_this\` ``. Code blocks use **tilde
  fences**: `~~~python` … `~~~` (the renderer treats `~~~` exactly like ```).
- Text supports markdown-lite: paragraphs separated by blank lines, `**bold**`,
  inline code, `~~~lang` fences, `- ` bullets, `1. ` numbered lists, `### ` mini
  headings. No tables, no images, no links inside bodies (links go in `resources`).
- Apostrophes are fine inside template literals — write naturally.

## Field-by-field spec

| Field | Spec |
| --- | --- |
| `id` | `"d022"` — always 3-digit padded, must equal day number |
| `day`, `week`, `phase` | numbers; week = ceil(day/7) capped at 26; phase from the outline |
| `kind` | `"lesson"`, `"review"`, or `"project"` per the outline |
| `title`, `analogy` | from the master outline (may polish wording, keep meaning) |
| `objectives` | 3–5 bullets, each starts with a verb, each testable |
| `prereqs` | 1–4 `{ day, label }` — the *specific* earlier days this builds on; label = that day's short topic. Day 1 may be `[]` |
| `eli5` | 120–220 words. Analogy FIRST, then map it to the concept. Vivid, concrete, zero jargon (or jargon immediately translated). One paragraph or two short ones |
| `why` | 60–120 words. Why this matters for an AI engineer / FDE specifically — name a real production or customer situation where it bites |
| `tech` | 250–450 words. Precise technical explanation with correct terminology. 2–5 paragraphs, may use `### ` mini-headings and short fenced snippets. This is the "flip the switch" deep version, not a summary |
| `viz` | key from the outline or `null` |
| `guided` | 2–3 exercises `{ title, minutes, body, code? }`. `body` = numbered steps the learner follows; `code` = starter/reference code (real, runnable). Total 35–55 min |
| `practice` | 1–2 exercises, no hand-holding — a goal + constraints + hints section at the end. 15–25 min |
| `project` | The day's practical task. `brief` (80–150 words, concrete deliverable), `rubric` 4–6 measurable criteria ("Passes X", "Handles Y", not "understands Z") |
| `mistakes` | 4–6 bullets. Real misconceptions/pitfalls, each with the correction, not just the mistake |
| `quiz` | Exactly 3 questions, 3–4 options each, `x` = correct index, `w` = 1–2 sentence explanation, `revisit` = day number to restudy if missed (usually this day or the prereq day) |
| `resources` | 3–5 `{ label, url, type, time }` from the **verified resource pool** (see prompt) or official docs you have verified. Deep links to the specific page/chapter/video beat homepages |
| `schedule` | 4–7 activities summing to **110–130 minutes**, covering: recap/spaced-rep (~10), concept study, guided exercises, independent practice/project, quiz+flashcards (~10) |
| `completion` | 3–5 checkable criteria ("Quiz ≥ 2/3", "Project rubric ≥ 4/6", "Pushed to GitHub") |
| `connections` | `back`: 1–2 sentences naming earlier days ("On Day 50 you…"); `forward`: 1–2 sentences naming later days ("On Day 115 this becomes…") — use real day numbers from the outline |
| `flashcards` | 4–6 `{ f, b }`. Front = question/term, back = crisp answer (≤ 25 words). These feed the SRS deck |
| `deepDive` | optional, 1–3 `{ label, url?, note? }` for the "if you have a third hour" crowd |

## Voice & pedagogy (the 8-step frame baked into fields)

1. Simple explanation → `eli5` (steps 1–2: concept + analogy)
2. Why it matters → `why` (step 3)
3. Technical detail → `tech` (step 4)
4. Demonstration → `guided[0]` + `viz` (step 5)
5. Practice → `guided`/`practice`/`project` (step 6)
6. Test → `quiz` (step 7)
7. Real AI/FDE use case → woven into `why` and `connections.forward` (step 8)

Terminology is consistent program-wide. Reuse the standing analogies when a later
lesson touches an earlier concept:

- polymath = an LLM; briefing memo = system prompt; open-book exam = RAG;
  intern with a to-do list = agent; map of meaning = embedding space;
  library with a meaning-based index = vector DB; the con artist = prompt injection;
  exam written before the student exists = golden-set evals; flight recorder = tracing;
  two chefs at a wedding = complexity analysis; time machine = git;
  rolling downhill in fog = gradient descent; surprise as a currency = entropy.

Never assume something was taught because it was *mentioned*. Check the outline:
if a concept's teaching day is later, foreshadow ("you'll build this on Day N"),
don't depend on it.

**Review days** (`kind: "review"`): `eli5`/`tech` explain *what to review and why
spaced repetition works for this week's material*; `guided` = structured recall
drills (e.g. "close the editor, write X from memory, then diff"); `project` = the
week's checkpoint build; quiz = cumulative over the week (revisit pointers to the
specific day). **Project days**: `tech` covers the architecture/approach of the
build; guided = milestone steps.

## Quality bar — the exemplar (Day 22)

```js
{
  id: 'd022', day: 22, week: 4, phase: 2, kind: 'lesson',
  title: 'Big O & Complexity',
  analogy: 'Two chefs at a wedding',
  objectives: [
    'Explain why growth rate matters more than raw speed for scaling systems',
    'Classify code as O(1), O(log n), O(n), O(n log n), or O(n²) by reading it',
    'Compare best, average, and worst cases and say which one matters when',
    'Estimate the space complexity of a function, not just its time',
  ],
  prereqs: [
    { day: 4, label: 'Collections — lists and dicts' },
    { day: 11, label: 'Iterators & generators' },
  ],
  eli5: `Two chefs each claim they can cater a wedding. Chef A makes a sandwich in 30 seconds but insists on shaking hands with every previous guest before serving the next one. Chef B takes 2 minutes per sandwich but just… makes sandwiches. For a party of 5, Chef A wins easily. For a wedding of 500, Chef A is still shaking hands at midnight — guest number 500 required 499 handshakes first — while Chef B finished hours ago.

Big O is the habit of asking "what happens to the TOTAL work as the guest list grows?" instead of "how fast is one sandwich?" It ignores the stopwatch (30 seconds vs 2 minutes) and looks at the *shape* of the workload: does doubling the guests double the work (linear), barely change it (logarithmic), or quadruple it (quadratic, like the handshakes)? The shape always wins eventually.`,
  why: `Every scaling conversation you will ever have — "why is the dashboard slow with 10k users when it was fine with 100?" — is a Big O conversation. AI engineering is full of them: comparing every document chunk to every other chunk is O(n²) and dies at scale, which is exactly why vector databases exist (Day 115). In interviews, complexity analysis is the shared language of every coding round; in front of a customer, it is how you explain why the demo that worked on 50 rows needs re-architecting for 5 million.`,
  tech: `Big O notation describes an upper bound on how a function's resource use grows with input size n, keeping only the dominant term and dropping constant factors: 3n² + 40n + 7 is O(n²), because for large n the n² term dwarfs everything else.

### The ladder you must recognize on sight

- **O(1)** — constant: dict lookup by key, list index, arithmetic. Work does not depend on n.
- **O(log n)** — logarithmic: binary search; each step discards half the remaining input. Doubling n adds one step.
- **O(n)** — linear: a single pass; sum a list, scan for a max.
- **O(n log n)** — linearithmic: good comparison sorts (merge sort, Timsort). The floor for general-purpose sorting.
- **O(n²)** — quadratic: nested loops over the same input; comparing all pairs.

Reading code: sequential blocks add (and the larger term wins); nested loops multiply; a loop that halves its range each iteration is logarithmic. A loop over n that does an O(1) dict lookup inside is O(n) — which is why "replace the inner list scan with a set lookup" turns O(n²) into O(n), the single most common optimization in interview problems.

### Three honest caveats

Best/average/worst can differ: hash lookups are O(1) average but O(n) worst-case under adversarial collisions; quicksort is O(n log n) average, O(n²) worst. Say which case you mean. Space complexity follows the same notation for extra memory: sorting in place is O(1) space, building a frequency dict is O(n). And constants do matter at small n — for 20 items, a tight O(n²) loop can beat a clever O(n log n) pipeline with heavy setup. Big O tells you what happens as n grows, not who wins at n = 20.`,
  viz: 'growth-curves',
  guided: [
    {
      title: 'Time it yourself — the shape appears',
      minutes: 20,
      body: `1. Create \`bigo_lab.py\` and paste the starter code.
2. It times two functions that both answer "does this list contain duplicates?" — one with a nested loop, one with a set.
3. Run it for n = 1_000, 2_000, 4_000, 8_000. Record the four timings for each version.
4. For each version, compute the ratio between consecutive timings. Doubling n should roughly double the O(n) version (ratio ≈ 2) and quadruple the O(n²) version (ratio ≈ 4).
5. Predict before you run: at n = 16_000, what will each cost? Verify.`,
      code: `import time

def has_dupes_quadratic(items):
    for i in range(len(items)):          # n iterations
        for j in range(i + 1, len(items)):  # ~n/2 each -> O(n^2)
            if items[i] == items[j]:
                return True
    return False

def has_dupes_linear(items):
    seen = set()
    for x in items:                      # n iterations, O(1) lookups
        if x in seen:
            return True
        seen.add(x)
    return False

for n in [1_000, 2_000, 4_000, 8_000]:
    data = list(range(n))                # no dupes: worst case
    for fn in (has_dupes_quadratic, has_dupes_linear):
        t0 = time.perf_counter()
        fn(data)
        ms = (time.perf_counter() - t0) * 1000
        print(f"{fn.__name__:24s} n={n:6d}  {ms:8.2f} ms")`,
    },
    {
      title: 'Classify by reading',
      minutes: 15,
      body: `Classify each snippet's time complexity before checking the answers at the bottom of the starter file. Write your reasoning in one line each — "nested loop over n" beats a guess.

Snippets: (a) summing a list; (b) \`x in my_list\` inside a loop; (c) \`x in my_set\` inside a loop; (d) a while-loop that does \`n = n // 2\`; (e) two sequential (not nested) for-loops; (f) building all pairs from a list.`,
      code: `# (a)
total = 0
for x in nums: total += x

# (b)
hits = 0
for x in queries:
    if x in big_list: hits += 1

# (c)
hits = 0
for x in queries:
    if x in big_set: hits += 1

# (d)
steps = 0
while n > 1:
    n = n // 2; steps += 1

# (e)
for x in nums: print(x)
for x in nums: print(-x)

# (f)
pairs = [(a, b) for a in nums for b in nums]

# answers: a O(n) · b O(n*m) — list scan inside loop · c O(n) — set lookup O(1)
# d O(log n) · e O(n) — sequential adds, constants drop · f O(n^2)`,
    },
  ],
  practice: [
    {
      title: 'The slow function clinic',
      minutes: 20,
      body: `You inherit \`find_common(a, b)\` which returns items present in both lists, written with a nested loop. It takes 40 seconds on production data (two lists of ~50k items).

Your goal: (1) state its current complexity; (2) rewrite it to run in well under a second; (3) state the new complexity and the space you paid for the speed; (4) verify both return the same result on a random test case.

Hints (read only if stuck): what structure gives O(1) membership checks? What is the time-space trade you are making?`,
    },
  ],
  project: {
    title: 'Complexity field guide',
    brief: `Create \`complexity_notes.md\` in your practice repo: for each rung of the ladder (O(1) → O(n²)), write one Python snippet from your OWN code so far (Days 1–21 projects count), classify it, and justify the classification in one sentence. Finish with a "smells" section: three code patterns that should trigger a complexity alarm in code review (e.g. list membership test inside a loop). Commit it — this file grows during interview prep on Day 179.`,
    rubric: [
      'Five snippets, one per complexity class, all from your own code or lightly adapted',
      'Each classification includes a one-line justification naming the driver (loop structure, halving, lookup cost)',
      'The O(n²) → O(n) set-lookup rewrite from practice is included with before/after timings',
      'Three review "smells" listed with the fix for each',
      'Committed to the practice repo with a descriptive message',
    ],
  },
  mistakes: [
    'Thinking Big O measures speed in seconds. It measures growth shape; a slow O(n) beats a fast O(n²) once n is large enough — and only then.',
    'Dropping the wrong term: O(n² + n) is O(n²), but O(n·m) with two independent inputs does NOT simplify to O(n²) — keep both variables.',
    'Assuming `x in collection` is always cheap. It is O(1) for sets/dicts, O(n) for lists — the single most common hidden quadratic in real code.',
    'Reporting worst case when average case is what matters (or vice versa): hash maps are O(1) average and that is usually the honest answer, with the caveat stated.',
    'Forgetting space: memoization and frequency dicts buy time with O(n) memory. Interviewers ask for both; production bills you for both.',
  ],
  quiz: [
    {
      q: 'A loop over n items does a membership check `x in big_list` on each pass. Overall complexity?',
      o: ['O(n)', 'O(n log n)', 'O(n²) — list membership is itself O(n)', 'O(1)'],
      x: 2,
      w: 'A list membership test scans the list — O(n) — and it runs inside an O(n) loop, so the total is O(n²). Swap the list for a set to get O(n).',
      revisit: 22,
    },
    {
      q: 'Doubling the input size adds exactly ONE more step. The complexity is…',
      o: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'],
      x: 1,
      w: 'One extra step per doubling is the signature of logarithmic growth — like binary search halving its range.',
      revisit: 22,
    },
    {
      q: 'Your O(n log n) solution loses to a colleague\'s O(n²) one on a benchmark with n = 30. What is the best explanation?',
      o: [
        'Big O is unreliable',
        'Constant factors dominate at small n; the O(n log n) advantage appears as n grows',
        'The benchmark must be wrong',
        'O(n²) is actually faster than O(n log n)',
      ],
      x: 1,
      w: 'Big O describes asymptotic growth. At tiny n, setup costs and constants decide the race; the shapes only take over as n grows.',
      revisit: 22,
    },
  ],
  resources: [
    { label: 'VisuAlgo — sorting & complexity visualizations', url: 'https://visualgo.net/en', type: 'tool', time: '15 min' },
    { label: 'CS50x Week 3 — Algorithms (Big O segment)', url: 'https://cs50.harvard.edu/x/', type: 'course', time: '30 min' },
    { label: 'OpenDSA — Algorithm Analysis chapter', url: 'https://opendsa-server.cs.vt.edu/', type: 'book', time: '25 min' },
  ],
  schedule: [
    { activity: 'Spaced-rep warm-up: due flashcards from Week 3', minutes: 10 },
    { activity: 'ELI5 + tech read, watch the growth-curves visualizer', minutes: 20 },
    { activity: 'Guided: time it yourself + classify by reading', minutes: 35 },
    { activity: 'Practice: the slow function clinic', minutes: 20 },
    { activity: 'Project: complexity field guide', minutes: 25 },
    { activity: 'Quiz + write your own flashcards additions', minutes: 10 },
  ],
  completion: [
    'Both guided exercises run; timing ratios recorded and explained',
    'find_common rewritten to O(n) with before/after timings',
    'Complexity field guide committed with all five classes + three smells',
    'Quiz ≥ 2/3 (retake after revisiting if lower)',
  ],
  connections: {
    back: 'The set-vs-list lookup gap comes straight from Day 4 (collections) — today you learned to name its cost. The timing harness reuses Day 11\'s iteration patterns.',
    forward: 'Every pattern day this phase (Days 23–34) states its complexity up front. On Day 115 the O(n²) pain of comparing everything-to-everything is exactly why approximate nearest-neighbor indexes exist, and on Day 160 you\'ll do capacity estimates with the same growth-shape reasoning.',
  },
  flashcards: [
    { f: 'O(n²) code smell inside a loop?', b: 'Membership test on a LIST (x in big_list) — swap for a set/dict to get O(n).' },
    { f: 'Doubling n adds one step — complexity?', b: 'O(log n): halving/doubling structure, like binary search.' },
    { f: 'Why can O(n²) beat O(n log n) at n=30?', b: 'Constants and setup dominate at small n; Big O only governs growth.' },
    { f: 'Sequential loops vs nested loops?', b: 'Sequential ADD (larger term wins); nested MULTIPLY.' },
    { f: 'Space complexity of memoization?', b: 'O(n) typically — you buy time with memory. State both in interviews.' },
  ],
  deepDive: [
    { label: 'Amortized analysis — why list.append is O(1) "on average"', note: 'Dynamic arrays double capacity; occasional O(n) copies average out to O(1) per append. Revisited when we meet dynamic arrays on Day 23.' },
  ],
},
```

Notes on the exemplar: the analogy opens and *maps*; `why` names AI-engineering and
FDE stakes with real forward day-references; `tech` teaches (it does not summarize);
guided code is complete and runnable; the project produces a durable artifact that a
later day reuses; every quiz `w` teaches; connections cite real day numbers.
