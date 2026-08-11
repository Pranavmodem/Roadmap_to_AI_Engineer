// Days 57–70: Phase 3 Week 9 (probability, statistics & information) and
// Phase 4 Week 10 (data craft: NumPy, pandas, EDA, cleaning, features).
export const DAYS_057_070 = [
  {
    id: 'd057', day: 57, week: 9, phase: 3, kind: 'lesson',
    title: 'Probability Fundamentals',
    analogy: 'Weather forecasts',
    objectives: [
      'Define sample spaces and events, and compute probabilities by counting or simulating',
      'Apply the product rule for independent events and the sum rule for mutually exclusive ones',
      'Explain conditional probability P(A|B) as "probability inside a restricted world"',
      'Estimate any probability with a Monte Carlo simulation in NumPy and know when to trust it',
      'Reproduce the birthday-problem result and explain why intuition fails on it',
    ],
    prereqs: [
      { day: 50, label: 'Vectors & NumPy arrays' },
      { day: 56, label: 'NumPy fluency — linear regression by hand' },
    ],
    eli5: `A weather forecast that says "70% chance of rain" is not saying the sky is 70% full of rain. It is saying: imagine 100 days that look exactly like today on the radar — on about 70 of them it rained. Probability is always that move: instead of asking "what WILL happen?", ask "across all the ways this could play out, what fraction go my way?"

Everything today is that one idea dressed differently. A sample space is the full list of tomorrows. An event is the subset you care about ("it rains"). Conditional probability is checking the forecast after peeking out the window: given that it is already cloudy, the 100 imaginary tomorrows shrink to the cloudy ones, and you recount inside that smaller world. And when the counting gets too hairy to do by hand — which happens fast — you cheat honestly: make the computer live through a million tomorrows and count. That cheat is called Monte Carlo, and it will be your best friend for the whole week.`,
    why: `AI systems are probabilistic top to bottom: an LLM literally outputs a probability distribution over tokens (Day 102), classifiers output P(class|input) (Day 72), and every eval score you will ever report is an estimate from a random sample (Day 139). Engineers who can't reason about probability ship confident nonsense — "the model passed 9/10 tests, it's fine" is a probability error you will learn to catch. The simulation-first habit you build today (simulate, count, then trust the math) is also how working data scientists sanity-check every formula before betting a launch on it.`,
    tech: `A **sample space** Ω is the set of all possible outcomes of an experiment; an **event** A is a subset of Ω. When outcomes are equally likely, P(A) = |A| / |Ω| — count favorable, divide by total. Two dice have 36 equally likely outcomes; "sum is 7" contains 6 of them, so P = 6/36 = 1/6.

### The three rules that generate everything else

- **Sum rule (mutually exclusive events):** if A and B cannot both happen, P(A or B) = P(A) + P(B). If they can overlap, subtract the double count: P(A or B) = P(A) + P(B) − P(A and B).
- **Product rule (independent events):** if knowing A tells you nothing about B, P(A and B) = P(A)·P(B). Independence is an assumption to be checked, not a default — consecutive requests hitting the same overloaded server are not independent.
- **Conditional probability:** P(A|B) = P(A and B) / P(B). You shrink the universe to the outcomes where B happened and re-normalize. Every "given that…" sentence is this formula.

The **complement trick** deserves its own line: P(at least one …) is usually painful directly but easy as 1 − P(none). The birthday problem is the canonical example: P(some shared birthday among 23 people) = 1 − P(all 23 distinct) = 1 − (365/365)·(364/365)·…·(343/365) ≈ 0.507.

### Monte Carlo: probability by brute force

When events tangle together, simulate: draw random outcomes with \`numpy.random.Generator\`, test the event with a boolean expression, and take the mean of the boolean array — because the mean of True/False values IS the empirical probability. By the law of large numbers (formalized Day 60), the estimate converges to the true value as trials grow, with error shrinking like 1/√n: 10,000 trials gives roughly ±1% noise, 1,000,000 gives ±0.1%. Always run the simulation twice with different seeds; if the two answers disagree in a digit you care about, you need more trials.`,
    viz: null,
    guided: [
      {
        title: 'Monte Carlo warm-up — prove the rules to yourself',
        minutes: 20,
        body: `1. Create \`prob_lab.py\` (or run in the in-browser interpreter) and paste the starter code.
2. It simulates 200,000 rolls of two dice and estimates P(sum = 7). Check it lands near 1/6 ≈ 0.1667.
3. Verify the product rule: estimate P(first die = 6 AND second die = 6) and compare to (1/6)·(1/6) ≈ 0.0278.
4. Verify the sum rule with overlap: P(first is 6 OR second is 6). Predict it with the inclusion-exclusion formula (1/6 + 1/6 − 1/36 ≈ 0.3056) before printing.
5. Conditional probability: among rolls where the FIRST die shows 6, what fraction have sum ≥ 10? Filter with a boolean mask, then take the mean inside the filtered world. Compare to the by-hand answer (3/6 = 0.5).
6. Rerun everything with a different seed. Note how much each estimate wobbles — that wobble is the star of Day 60.`,
        code: `import numpy as np

rng = np.random.default_rng(seed=57)
N = 200_000

d1 = rng.integers(1, 7, size=N)   # first die, values 1..6
d2 = rng.integers(1, 7, size=N)   # second die
total = d1 + d2

# The core Monte Carlo move: mean of a boolean array = empirical probability
print("P(sum = 7)            ", (total == 7).mean(), "  theory:", 6/36)
print("P(both sixes)         ", ((d1 == 6) & (d2 == 6)).mean(), "  theory:", 1/36)
print("P(at least one six)   ", ((d1 == 6) | (d2 == 6)).mean(), "  theory:", 11/36)

# Conditional probability: restrict the world, then recount
first_is_six = d1 == 6
p_cond = (total[first_is_six] >= 10).mean()
print("P(sum >= 10 | d1 = 6) ", p_cond, "  theory:", 3/6)`,
      },
      {
        title: 'The birthday problem — intuition vs arithmetic',
        minutes: 20,
        body: `1. Before any code: write down your gut guess for "how many people in a room before a shared birthday is a coin flip (50%)?" Most people guess 100+.
2. Paste the starter code. It simulates rooms of size k and estimates the collision probability for k = 5..60.
3. Find the smallest k where the estimate crosses 0.5. (It is 23.)
4. Now compute the exact answer with the complement trick — the product loop in the code — and confirm simulation and formula agree to ~2 decimal places.
5. Write two sentences in your notes: why does intuition fail? (Hint: you compare 23 to 365, but the number of PAIRS in a room of 23 is 253 — collisions scale with pairs.)
6. AI tie-in: replace 365 with 4096 "hash buckets" and find the 50% collision point. This is exactly how you reason about ID collisions and cache-key clashes in real systems.`,
        code: `import numpy as np

rng = np.random.default_rng(seed=7)
TRIALS = 20_000

def collision_prob(k, days=365):
    # simulate TRIALS rooms of k people; True if any birthday repeats
    rooms = rng.integers(0, days, size=(TRIALS, k))
    hits = 0
    for room in rooms:
        if len(np.unique(room)) < k:
            hits += 1
    return hits / TRIALS

def exact_prob(k, days=365):
    p_all_distinct = 1.0
    for i in range(k):
        p_all_distinct *= (days - i) / days
    return 1 - p_all_distinct

for k in [5, 10, 15, 20, 22, 23, 24, 30, 40, 60]:
    print(f"k={k:3d}  sim={collision_prob(k):.3f}  exact={exact_prob(k):.3f}")`,
      },
    ],
    practice: [
      {
        title: 'The Monty Hall verdict',
        minutes: 20,
        body: `Settle the most argued-about probability puzzle in history with a simulation. Setup: a prize hides behind one of three doors; you pick one; the host (who knows where the prize is) opens a different door that is empty; you may stick or switch.

Your goal: simulate 100,000 games under the "always stick" strategy and 100,000 under "always switch", and print both win rates. Then write a 3-sentence explanation of the result using conditional probability language ("given that the host opened…").

Constraints: model the host correctly — the host never opens your door and never reveals the prize. That constraint is the entire puzzle.

Hints (only if stuck): the switch strategy wins exactly when your first pick was wrong. What is the probability your first pick was wrong?`,
      },
    ],
    project: {
      title: 'Your Monte Carlo toolkit',
      brief: `Create \`monte_carlo.py\` in your practice repo: a small reusable module with a function \`estimate(event_fn, n_trials, seed)\` that runs a vectorized simulation and returns the estimated probability, plus a demo section answering three questions of YOUR choosing by simulation (e.g. "probability a 5-request retry chain with 80% per-try success eventually succeeds", "probability two of my 10 microservices fail in the same hour if each fails 1% of hours"). For each, state the assumption you made (independence? equal likelihood?) in a comment. Commit it — Days 60, 61, and 63 import ideas (and possibly code) from this file.`,
      rubric: [
        'estimate() is vectorized (no Python loop over trials) and seedable for reproducibility',
        'Three original questions answered, each with the simulated probability printed',
        'Each question has a one-line comment naming its key assumption',
        'At least one question uses the complement trick or a conditional filter',
        'Committed to the practice repo with a descriptive message',
      ],
    },
    mistakes: [
      'Adding probabilities of events that can co-occur. P(A or B) needs the −P(A and B) correction unless the events are mutually exclusive.',
      'Multiplying probabilities of events that are not independent. Correlated failures (same server, same outage) make P(both fail) far higher than the product.',
      'Reading P(A|B) as P(B|A). "P(sum≥10 | first die is 6)" and "P(first die is 6 | sum≥10)" are different numbers — the confusion Bayes fixes on Day 59.',
      'Trusting a Monte Carlo estimate without checking its noise. 1,000 trials of a 1%-probability event sees ~10 hits; the estimate can easily be off by 50%. Scale trials to the rarity of the event.',
      'Forgetting to seed the generator, then being unable to reproduce a "weird" result. Always pass an explicit seed; rerun with a second seed to check stability.',
      'Computing "at least one" head-on with a giant case analysis instead of 1 − P(none). The complement trick is almost always the shorter road.',
    ],
    quiz: [
      {
        q: 'You roll two fair dice. What is P(sum ≥ 10 GIVEN the first die shows 6)?',
        o: ['1/6', '1/2 — the second die must show 4, 5, or 6', '1/12', '1/4'],
        x: 1,
        w: 'Conditioning shrinks the world to rolls where d1 = 6. Inside that world the sum is 6 + d2, so we need d2 ∈ {4,5,6}: 3 of 6 outcomes = 1/2.',
        revisit: 57,
      },
      {
        q: 'Why does "P(at least one shared birthday among 23 people) ≈ 50%" feel too high to most people?',
        o: [
          'The formula is an approximation that overestimates',
          'People compare 23 to 365, but collisions scale with the 253 PAIRS of people, not with 23',
          'Birthdays are not uniformly distributed',
          'Simulation noise inflates the estimate',
        ],
        x: 1,
        w: 'Each of the 253 pairs is a small collision chance, and 253 small chances compound. Intuition tracks the headcount, not the pair count.',
        revisit: 57,
      },
      {
        q: 'A Monte Carlo run with 1,000 trials estimates a probability as 0.012. What should you do before reporting it?',
        o: [
          'Report it — 1,000 trials is plenty',
          'Multiply by a safety factor of 2',
          'Increase trials (the event is rare, so ~12 hits is noisy) and rerun with a different seed to check stability',
          'Switch to an exact formula, which always exists',
        ],
        x: 2,
        w: 'A 1.2% event hit only ~12 times; relative error is large. More trials plus a second seed is the honest check. Exact formulas often do not exist for tangled events.',
        revisit: 57,
      },
    ],
    resources: [
      { label: 'Seeing Theory — Basic Probability (interactive)', url: 'https://seeing-theory.brown.edu/basic-probability/index.html', type: 'course', time: '20 min' },
      { label: 'Khan Academy — Statistics & Probability', url: 'https://www.khanacademy.org/math/statistics-probability', type: 'course', time: '25 min' },
      { label: 'NumPy docs — Random sampling (Generator API)', url: 'https://numpy.org/doc/stable/reference/random/index.html', type: 'docs', time: '15 min' },
      { label: 'Harvard Stat 110 — lectures & materials', url: 'https://stat110.hsites.harvard.edu/home', type: 'course', time: '30 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: due flashcards from Week 8 (gradients, matrices)', minutes: 10 },
      { activity: 'ELI5 + tech read: the three rules and the Monte Carlo move', minutes: 20 },
      { activity: 'Guided: Monte Carlo warm-up + birthday problem', minutes: 40 },
      { activity: 'Practice: Monty Hall verdict', minutes: 20 },
      { activity: 'Project: monte_carlo.py toolkit', minutes: 20 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'All guided simulations run and match theory to ~2 decimals',
      'Monty Hall simulation shows ~1/3 stick vs ~2/3 switch, with a written conditional-probability explanation',
      'monte_carlo.py committed with three original questions answered',
      'Quiz ≥ 2/3 (retake after revisiting if lower)',
    ],
    connections: {
      back: 'The vectorized boolean-mask tricks come straight from Day 50\'s NumPy work — a mean over a boolean array is a dot product with a ones vector divided by n. Day 56 gave you the NumPy fluency this week leans on daily.',
      forward: 'Day 58 gives the outcomes shapes (distributions); Day 59 turns conditional probability into Bayes\' rule; Day 60 explains exactly how fast Monte Carlo converges. On Day 102 you\'ll watch an LLM sample from a probability distribution over tokens, and on Day 139 every eval score becomes a probability estimate with error bars.',
    },
    flashcards: [
      { f: 'P(A|B) in one formula and one sentence?', b: 'P(A and B)/P(B) — shrink the world to where B happened, then recount.' },
      { f: 'When does P(A and B) = P(A)·P(B)?', b: 'Only when A and B are independent — knowing one tells you nothing about the other.' },
      { f: 'The complement trick?', b: 'P(at least one) = 1 − P(none). Usually far easier to compute.' },
      { f: 'Monte Carlo probability estimate in NumPy?', b: 'Simulate outcomes, test the event as a boolean array, take .mean().' },
      { f: 'How fast does Monte Carlo error shrink?', b: 'Like 1/√n — 100× more trials buys 10× less noise.' },
      { f: 'Why does the birthday paradox surprise people?', b: 'Collisions scale with pairs (253 for 23 people), not headcount.' },
    ],
    deepDive: [
      { label: 'Stat 110 Lecture 1–2 — sample spaces and counting done rigorously', url: 'https://stat110.hsites.harvard.edu/home', note: 'Blitzstein\'s counting arguments (naive definition, multiplication rule) put today\'s intuitions on formal footing.' },
    ],
  },
  {
    id: 'd058', day: 58, week: 9, phase: 3, kind: 'lesson',
    title: 'Random Variables & Distributions',
    analogy: 'The shape of chance',
    objectives: [
      'Distinguish discrete from continuous random variables and read their distributions',
      'Recognize Bernoulli, binomial, uniform, and normal distributions and say what process generates each',
      'Compute expectation and variance by simulation and by formula, and explain what each summarizes',
      'Demonstrate the Central Limit Theorem by simulation and state what it does and does not say',
      'Explain why production latencies are heavy-tailed and why that makes means misleading',
    ],
    prereqs: [
      { day: 57, label: 'Probability fundamentals & Monte Carlo' },
      { day: 50, label: 'NumPy arrays & vectorized math' },
    ],
    eli5: `Flip a coin once and the outcome is chaos — you know nothing. Flip it a thousand times and something eerie happens: the chaos develops a *shape*. Roughly 500 heads, a predictable bell of wobble around it, and you can say exactly how surprised to be by 530. Randomness is unpredictable one draw at a time but astonishingly disciplined in bulk, and a distribution is the name of that discipline — a portrait of where the outcomes pile up.

A random variable is just "a number the world hands you at random": the number of failed requests today, the milliseconds a query took. Its distribution is the histogram you would see given infinite repeats. A few shapes cover most of reality: the coin flip (Bernoulli), coins-in-bulk (binomial), the flat "anything goes" (uniform), and the bell (normal). Two numbers summarize any shape: expectation — where the pile balances — and variance — how wide it sprawls. The deepest magic is the Central Limit Theorem: average enough draws from almost ANY shape and the average itself turns bell-shaped. That is why the bell curve is everywhere: it is what averaging does to the world.`,
    why: `Distributions are the vocabulary of every measurement you will make as an AI engineer. An eval pass rate is a binomial; response latency is log-normal-ish with a brutal tail, which is why Day 155 talks p95/p99 instead of averages; the CLT is the reason confidence intervals (Day 60) and significance tests (Day 61, Day 139) work at all. Engineers who only know "the average" get burned in production weekly: a service with a fine mean latency and an ugly p99 is a service your biggest customer experiences as broken.`,
    tech: `A **random variable** X assigns a number to each outcome of a random process. Discrete X has a probability mass function (PMF): P(X = k) for each value. Continuous X has a density (PDF), where probabilities live in areas under the curve — P(X = exactly 3.7) is zero; P(3 < X < 4) is an integral.

### The four shapes to know cold

- **Bernoulli(p):** one yes/no trial. Mean p, variance p(1−p). One eval case passing is a Bernoulli.
- **Binomial(n, p):** count of successes in n independent Bernoullis. Mean np, variance np(1−p). "How many of 40 eval cases pass" is a binomial — this single fact powers Day 139.
- **Uniform(a, b):** everything in the range equally likely. What \`rng.random()\` gives you; the raw material other distributions are built from.
- **Normal(μ, σ²):** the bell. ~68% of mass within 1σ of μ, ~95% within 2σ, ~99.7% within 3σ. Arises whenever many small independent effects add up.

**Expectation** E[X] is the probability-weighted average — the long-run mean over infinite draws. **Variance** is E[(X−μ)²], the average squared distance from the mean; its square root, the standard deviation, lives in the same units as X and is the number you quote.

### The Central Limit Theorem, stated honestly

Take n independent draws from ANY distribution with finite mean μ and variance σ². The sample mean is itself a random variable, and as n grows its distribution approaches Normal(μ, σ²/n) — regardless of the original shape. Two readings matter: the mean's noise shrinks like σ/√n (the 1/√n law you met yesterday), and the *mean* becomes bell-shaped even when the data is not. What CLT does NOT say: that your data becomes normal (it doesn't), or that it works for distributions without finite variance, or that n = 5 is "enough" for a violently skewed distribution.

### Heavy tails: where production lives

Latencies, file sizes, and token counts are typically **log-normal or heavier**: most draws are small, but rare draws are enormous, and those rare draws dominate the mean. For such data the median (p50) and tail quantiles (p95, p99) are the honest summaries; the mean is a hostage to outliers. Today's lab makes you feel this: you will simulate a latency distribution whose mean is worse than its p75.`,
    viz: 'dist-shapes',
    guided: [
      {
        title: 'Meet the four shapes — simulate, summarize, compare to theory',
        minutes: 20,
        body: `1. Paste the starter code. It draws 100,000 samples each from Bernoulli(0.3), Binomial(40, 0.85), Uniform(0, 1), and Normal(200, 25).
2. For each, compare the simulated mean and standard deviation against the theory printed alongside. They should agree to ~2 significant figures.
3. The Binomial(40, 0.85) line is your first eval-score distribution: "40 golden-set cases, each passing with probability 0.85". Look at its spread — a run of 34/40 (85%) and a run of 31/40 (77.5%) are both completely ordinary. Sit with that.
4. Change the binomial to n=400 cases. Watch the standard deviation of the pass RATE shrink by √10 ≈ 3.2×. This is why bigger golden sets buy sharper conclusions (Day 140 builds a 40+ case set for exactly this reason).
5. For the normal draws, verify the 68/95/99.7 rule with boolean masks.`,
        code: `import numpy as np

rng = np.random.default_rng(seed=58)
N = 100_000

bern = rng.random(N) < 0.3                # Bernoulli(0.3) as booleans
binom = rng.binomial(n=40, p=0.85, size=N)  # 40-case eval runs
unif = rng.uniform(0, 1, size=N)
norm = rng.normal(200, 25, size=N)        # e.g. latency-ish, symmetric

print("Bernoulli  mean", bern.mean(), " theory 0.3 | sd", bern.std(), " theory", (0.3*0.7)**0.5)
print("Binomial   mean", binom.mean(), " theory 34.0 | sd", binom.std(), " theory", (40*0.85*0.15)**0.5)
print("Uniform    mean", unif.mean(), " theory 0.5 | sd", unif.std(), " theory", (1/12)**0.5)
print("Normal     mean", norm.mean(), " theory 200 | sd", norm.std(), " theory 25")

# How often is a TRUE-85% model observed at <= 80% on a 40-case set?
print("P(pass rate <= 32/40)", (binom <= 32).mean())

# 68-95-99.7 check on the normal
for k in (1, 2, 3):
    frac = ((norm > 200 - k*25) & (norm < 200 + k*25)).mean()
    print(f"within {k} sd: {frac:.4f}")`,
      },
      {
        title: 'Watch the Central Limit Theorem happen',
        minutes: 18,
        body: `1. The starter draws from a deliberately ugly distribution: an 80/20 mixture (80% fast draws near 1, 20% slow draws near 10) — bimodal, skewed, nothing like a bell.
2. Compute means of samples of size n = 1, 5, 30, 200 (20,000 sample-means each) and print each collection's mean, standard deviation, and a crude text histogram.
3. Observe two things as n grows: the spread of the means shrinks like 1/√n, and the histogram of MEANS morphs into a bell even though the raw data never does.
4. Verify the shrink quantitatively: sd(means at n=200) should be close to sd(raw)/√200.
5. Write one sentence in your notes: "The CLT is about the distribution of the ______, not the distribution of the ______." Fill the blanks.`,
        code: `import numpy as np

rng = np.random.default_rng(seed=580)

def ugly(size):
    fast = rng.normal(1.0, 0.2, size=size)
    slow = rng.normal(10.0, 1.0, size=size)
    return np.where(rng.random(size) < 0.8, fast, slow)

def text_hist(x, bins=18, width=40):
    counts, edges = np.histogram(x, bins=bins)
    for c, lo in zip(counts, edges[:-1]):
        bar = "#" * int(width * c / counts.max())
        print(f"{lo:7.2f} | {bar}")

raw = ugly(20_000)
print("raw data: mean", round(raw.mean(), 3), "sd", round(raw.std(), 3))
text_hist(raw)

for n in [5, 30, 200]:
    means = ugly((20_000, n)).mean(axis=1)
    print(f"means of n={n}: sd {means.std():.4f}   predicted {raw.std()/np.sqrt(n):.4f}")
text_hist(ugly((20_000, 200)).mean(axis=1))  # bell-shaped now`,
      },
    ],
    practice: [
      {
        title: 'The tail wags the SLA',
        minutes: 20,
        body: `Simulate 50,000 request latencies as log-normal: \`rng.lognormal(mean=4.0, sigma=0.8)\` milliseconds. Your goals: (1) compute mean, median (p50), p95, and p99; (2) explain in two sentences why the mean is higher than the median and which number you would put in a customer-facing SLA; (3) now contaminate the sample — replace 1% of requests with timeouts at 30,000 ms — and report how much the mean vs the p50 vs the p99 moved. (4) Write the one-line takeaway an SRE would tattoo on their arm.

Constraints: no plotting needed — quantiles via \`np.percentile\` tell the story. Hints: log-normal means "the LOG of the latency is normal" — multiplicative effects (retries, queue depth, payload size) make this shape; the median barely notices outliers because it only counts ranks, not magnitudes.`,
      },
    ],
    project: {
      title: 'A distribution field guide for production numbers',
      brief: `Create \`distributions_notes.md\` in your practice repo. For each of five quantities — (a) one eval case passing, (b) passes out of n eval cases, (c) a random seed's uniform draw, (d) an average of many small independent effects, (e) request latency — name the distribution family, the parameters you'd need to estimate, the honest summary statistic (mean? median? p99?), and one sentence on why. Then add a short simulation appendix (\`distributions_lab.py\`) reproducing today's CLT demo at n = 30 and the latency percentile table. This file is your cheat sheet when Day 139 asks "what distribution is a pass rate?"`,
      rubric: [
        'All five quantities mapped to a correct distribution family with parameters',
        'Each has a defended choice of summary statistic (tail-sensitive quantities use quantiles)',
        'CLT appendix runs and shows sd of means ≈ sd(raw)/√30',
        'Latency table shows mean > median with the log-normal simulation',
        'Committed to the practice repo',
      ],
    },
    mistakes: [
      'Reporting the mean of a heavy-tailed quantity. Latency and cost distributions have outliers that drag the mean above what most users experience — quote p50/p95/p99.',
      'Believing the CLT makes your DATA normal. It makes the SAMPLE MEAN approximately normal; the raw data keeps its shape forever.',
      'Treating a 3-point drop in a 40-case eval as signal. Binomial(40, 0.85) has sd ≈ 2.3 cases — swings of 2–3 cases are pure noise. Day 139 formalizes the fix.',
      'Confusing standard deviation (spread of the data) with standard error (spread of the mean, = sd/√n). The first stays put as n grows; the second shrinks.',
      'Asking P(X = exact value) for a continuous variable. It is zero; only ranges (areas under the density) carry probability.',
      'Assuming independence to use binomial math when trials are correlated — eval cases sharing a template, requests sharing a bad server. Correlation widens the real spread.',
    ],
    quiz: [
      {
        q: 'Your model truly passes 85% of cases. On a 40-case golden set, one run scores 31/40 (77.5%). What is the best interpretation?',
        o: [
          'The model regressed — investigate immediately',
          'Ordinary binomial noise: sd is ~2.3 cases, so 31/40 is within ~1.3 sd of the expected 34',
          'The golden set is broken',
          'The model\'s true rate must be 77.5%',
        ],
        x: 1,
        w: 'Binomial(40, 0.85) has sd √(40·0.85·0.15) ≈ 2.26 cases. A 3-case swing is unremarkable. You need more cases or repeated runs to call it a regression — the Day 139 discipline.',
        revisit: 58,
      },
      {
        q: 'The Central Limit Theorem says that as n grows…',
        o: [
          'any dataset becomes normally distributed',
          'the sample mean\'s distribution approaches Normal(μ, σ²/n), whatever the data\'s shape (finite variance required)',
          'variance disappears entirely',
          'the median and mean converge to each other',
        ],
        x: 1,
        w: 'CLT governs the distribution of the sample MEAN, not the data. The mean\'s spread shrinks as σ/√n and its shape becomes a bell.',
        revisit: 58,
      },
      {
        q: 'For request latency, the mean is 95 ms but the median is 55 ms. Why, and which belongs in the SLA conversation?',
        o: [
          'Measurement error; use the mean',
          'The distribution is heavy-tailed: rare slow requests inflate the mean. Quote median and tail percentiles (p95/p99)',
          'The median is wrong because latency is continuous',
          'Both are equally informative',
        ],
        x: 1,
        w: 'Right-skewed tails drag the mean up while the median tracks the typical request. SLAs are written about tails — p95/p99 — because that is what unlucky users feel.',
        revisit: 58,
      },
    ],
    resources: [
      { label: 'Seeing Theory — Probability Distributions (interactive)', url: 'https://seeing-theory.brown.edu/probability-distributions/index.html', type: 'course', time: '20 min' },
      { label: 'Harvard Stat 110 — distributions lectures', url: 'https://stat110.hsites.harvard.edu/home', type: 'course', time: '30 min' },
      { label: 'NumPy docs — Random sampling & distributions', url: 'https://numpy.org/doc/stable/reference/random/index.html', type: 'docs', time: '15 min' },
      { label: 'Khan Academy — random variables & the normal distribution', url: 'https://www.khanacademy.org/math/statistics-probability', type: 'course', time: '25 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: due cards + Day 57 rules recall', minutes: 10 },
      { activity: 'ELI5 + tech read, study the dist-shapes visualizer', minutes: 20 },
      { activity: 'Guided: four shapes + CLT demonstration', minutes: 38 },
      { activity: 'Practice: the tail wags the SLA', minutes: 20 },
      { activity: 'Project: distribution field guide', minutes: 22 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'Simulated means/sds match theory for all four distributions',
      'CLT demo shows the 1/√n shrink and the bell shape at n=200',
      'Latency exercise: percentile table computed and SLA takeaway written',
      'Field guide committed; quiz ≥ 2/3',
    ],
    connections: {
      back: 'Every simulation today is Day 57\'s Monte Carlo move at scale, and the vectorized (trials × n) arrays are Day 51\'s matrix thinking paying rent.',
      forward: 'Day 60 turns "sd of the sample mean" into standard errors and confidence intervals; Day 61 tests whether two shapes differ. Binomial eval noise returns as the villain of Day 139, and latency percentiles headline Day 155\'s serving work.',
    },
    flashcards: [
      { f: 'Binomial(n, p) mean and variance?', b: 'Mean np, variance np(1−p). A pass count on an n-case eval set is binomial.' },
      { f: 'What exactly does the CLT claim?', b: 'The SAMPLE MEAN of n iid draws (finite variance) approaches Normal(μ, σ²/n). Not the data itself.' },
      { f: 'Standard deviation vs standard error?', b: 'sd = spread of data; se = sd/√n = spread of the sample mean. Only se shrinks with n.' },
      { f: 'Honest summary for heavy-tailed data (latency)?', b: 'Median and tail quantiles (p95/p99) — the mean is hostage to outliers.' },
      { f: '68–95–99.7 rule?', b: 'Normal data: ~68% within 1σ, 95% within 2σ, 99.7% within 3σ of the mean.' },
      { f: 'Why is latency roughly log-normal?', b: 'Multiplicative effects (retries, queues, payload sizes) multiply — logs add — so log-latency ends up near normal.' },
    ],
    deepDive: [
      { label: 'Poisson processes — counts of rare events per interval', note: 'Requests per second, errors per day: Poisson(λ) with mean = variance = λ. A 10-minute read that instantly upgrades your on-call reasoning.' },
    ],
  },
  {
    id: 'd059', day: 59, week: 9, phase: 3, kind: 'lesson',
    title: "Bayes' Rule",
    analogy: 'Updating your beliefs',
    objectives: [
      "Write Bayes' rule from memory and name prior, likelihood, evidence, and posterior",
      'Solve the medical-test problem with natural frequencies and explain why P(disease|+) ≪ test accuracy',
      'Identify base-rate neglect in real product and debugging claims',
      'Build a tiny naive Bayes spam classifier from word counts and explain each factor',
      'Apply Bayesian updating to a debugging/incident-triage scenario',
    ],
    prereqs: [
      { day: 57, label: 'Conditional probability & Monte Carlo' },
      { day: 58, label: 'Distributions & expectation' },
    ],
    eli5: `You hear a fire alarm in your building. Do you believe there is a fire? Probably not — you have heard a hundred alarms and seen zero fires. Your belief starts from experience (fires are rare), gets nudged by evidence (the alarm), and lands somewhere in between: "almost certainly burnt toast, but let's glance at the hallway." Now add smoke under the door and your belief flips. You just ran Bayes' rule twice, natively, in your head.

Bayes' rule is the arithmetic of changing your mind. You start with a **prior** — how plausible the idea was before the new clue. You ask how loudly the clue shouts for the idea — the **likelihood**: alarms happen often without fires, so an alarm shouts quietly; smoke rarely appears without fire, so smoke shouts loudly. Multiplying "how plausible before" by "how loud the clue" and rescaling gives the **posterior** — your new belief. The classic human bug is ignoring the prior: a 99%-accurate test for a one-in-a-thousand disease still yields mostly false alarms, because the disease was so rare to begin with. Rare things stay fairly rare even after impressive-sounding evidence.`,
    why: `Bayes shows up on both sides of your future job. Inside the models: spam filters, classifier probabilities (Day 72's logistic regression outputs are posteriors), and the whole "P(next token | context)" framing of language models. Inside your head: incident triage is Bayesian — "deploys break things far more often than cosmic rays" is a prior that routes 80% of debugging correctly (Day 172 makes this a formal method). And when a customer says "your model flagged 200 frauds, how many are real?", the answer is a base-rate calculation — get it wrong and you torch trust in the system you just sold.`,
    tech: `Bayes' rule is conditional probability read in reverse:

~~~text
P(H|E) = P(E|H) · P(H) / P(E)
posterior = likelihood × prior / evidence
~~~

P(H) is the **prior** — belief in hypothesis H before evidence. P(E|H) is the **likelihood** — how probable the evidence is if H is true. P(E) is the total probability of the evidence under all hypotheses: P(E|H)·P(H) + P(E|¬H)·P(¬H); it is just the normalizer that makes posteriors sum to 1.

### The medical test, done honestly

Disease prevalence 0.1%; test sensitivity 99% (P(+|disease)); false-positive rate 1% (P(+|healthy)). Take 100,000 people: 100 have the disease, ~99 of them test positive. Of the 99,900 healthy, ~999 also test positive. So a positive test means you are one of 99 + 999 = 1,098 positives, of which only 99 are real: P(disease|+) ≈ 9%. The test is "99% accurate" and yet a positive is 91% likely to be false — because the prior (0.1%) was tiny. This counts-first method, **natural frequencies**, is how you should do every Bayes problem: it makes the base rate impossible to ignore.

### Base-rate neglect is P(A|B) vs P(B|A) confusion

Sensitivity is P(+|disease); the patient cares about P(disease|+). Swapping them is the most consequential probability error in medicine, law ("prosecutor's fallacy"), and ML product claims ("our fraud model is 99% accurate" tells you nothing about precision on 0.01% base-rate fraud — Day 75's precision/recall machinery is this exact issue).

### Naive Bayes: Bayes as a classifier

To classify text, compare P(spam|words) against P(ham|words). By Bayes both share the normalizer, so compare P(words|class)·P(class). The "naive" step assumes words are independent given the class, so P(words|class) is a product of per-word probabilities — estimated by counting word frequencies per class. Multiply many small numbers and you underflow, so implementations **sum logs** instead of multiplying probabilities — your first taste of log-probabilities, the currency of Day 62 and of every LLM logit you will ever inspect. Unseen words get a small "Laplace smoothing" count (add 1) so a single novel word cannot veto a classification with a hard zero.`,
    viz: 'bayes-grid',
    guided: [
      {
        title: 'The medical test three ways: counts, formula, simulation',
        minutes: 20,
        body: `1. Paste the starter. Part A computes P(disease|+) via natural frequencies (a 100,000-person table). Predict the answer before running — most people guess near 99%.
2. Part B computes the same thing with the Bayes formula. Confirm the two agree (~9%).
3. Part C is the Monte Carlo check: simulate a million patients, filter to positives with a boolean mask, take the mean of disease among them — Day 57's conditional-probability move.
4. Now experiment: raise prevalence to 10% (screening a high-risk group) and rerun. Watch the posterior jump to ~92%. Same test, different prior, wildly different meaning — write down why doctors order tests only when symptoms raise the prior.
5. Lower the false-positive rate to 0.1% at 0.1% prevalence. The posterior hits ~50%. Note which knob mattered more here — the false-positive rate fights the prior directly.`,
        code: `import numpy as np

prevalence, sensitivity, false_pos = 0.001, 0.99, 0.01

# A: natural frequencies on 100,000 people
n = 100_000
sick = n * prevalence                      # 100
true_pos = sick * sensitivity              # 99
false_pos_count = (n - sick) * false_pos   # 999
print("A counts:", true_pos / (true_pos + false_pos_count))

# B: the formula
p_pos = sensitivity * prevalence + false_pos * (1 - prevalence)
posterior = sensitivity * prevalence / p_pos
print("B formula:", posterior)

# C: simulation — Bayes emerges from conditional filtering
rng = np.random.default_rng(seed=59)
N = 1_000_000
disease = rng.random(N) < prevalence
positive = np.where(disease,
                    rng.random(N) < sensitivity,
                    rng.random(N) < false_pos)
print("C simulation:", disease[positive].mean())`,
      },
      {
        title: 'A naive Bayes spam filter in 40 lines',
        minutes: 22,
        body: `1. The starter ships a tiny labeled corpus (10 spam, 10 ham messages) inline — no downloads.
2. Read the \`train\` function: it counts word frequencies per class with Laplace add-one smoothing. Say out loud what each count estimates (it is P(word|class)).
3. Read \`classify\`: it SUMS LOG probabilities instead of multiplying. Comment out the log version and multiply raw probabilities for a 60-word message to see why (tiny numbers → underflow toward 0.0).
4. Run the classifier on the three test messages and inspect the per-class log scores.
5. Break it on purpose: classify a message full of words the training set has never seen. Confirm smoothing keeps it from crashing to a hard zero, and that the PRIOR (spam vs ham counts in training) decides the tie.
6. Add two spam and two ham messages of your own invention to the corpus and re-run. Watch a word's spam-score shift as its counts change — that is "updating on evidence" made mechanical.`,
        code: `import math
from collections import Counter

spam = ["win free money now", "free prize claim now", "urgent offer win cash",
        "free money offer expires", "claim your free prize", "win big cash now",
        "cheap loans instant offer", "free crypto win guaranteed",
        "urgent claim cash prize", "act now free offer"]
ham = ["meeting moved to friday", "lunch tomorrow at noon", "draft report attached",
       "can you review my code", "standup notes from today", "invoice for march attached",
       "project deadline next week", "thanks for the feedback",
       "see you at the demo", "notes from the client call"]

def train(msgs_by_class):
    counts = {c: Counter(w for m in msgs for w in m.split())
              for c, msgs in msgs_by_class.items()}
    priors = {c: len(msgs) / sum(len(v) for v in msgs_by_class.values())
              for c, msgs in msgs_by_class.items()}
    vocab = set(w for cnt in counts.values() for w in cnt)
    return counts, priors, vocab

def classify(msg, counts, priors, vocab):
    scores = {}
    for c in counts:
        total = sum(counts[c].values())
        score = math.log(priors[c])
        for w in msg.split():
            p_w = (counts[c][w] + 1) / (total + len(vocab))  # Laplace smoothing
            score += math.log(p_w)                            # sum logs, never multiply
        scores[c] = score
    return max(scores, key=scores.get), scores

model = train({"spam": spam, "ham": ham})
for msg in ["free cash offer now", "review the report tomorrow", "win a meeting"]:
    label, scores = classify(msg, *model)
    print(f"{msg!r:35s} -> {label}  {scores}")`,
      },
    ],
    practice: [
      {
        title: 'Bayesian incident triage',
        minutes: 18,
        body: `Your API's error rate just spiked. From six months of postmortems you know the base rates of root causes: bad deploy 60%, provider outage 25%, traffic spike 10%, database issue 5%. You observe one clue: the provider status page is green (assume: P(green | provider outage) = 0.2 — status pages lag; P(green | any other cause) = 0.95).

Your goals: (1) compute the posterior over all four causes given the green status page (normalize across all four hypotheses — this is Bayes with more than two hypotheses); (2) state which cause to investigate first and second; (3) a second clue arrives — no deploy happened in the last 24h (P(no-deploy | bad deploy) = 0.05, P(no-deploy | others) = 0.7). Update AGAIN, using your first posterior as the new prior. (4) Write the two-line lesson about chaining evidence.

Hints: build a dict of priors, multiply each by its likelihood, divide by the sum. Sequential updating = yesterday's posterior is today's prior.`,
      },
    ],
    project: {
      title: 'The base-rate briefing memo',
      brief: `Write \`bayes_memo.md\` (plus a small \`bayes_calc.py\` helper): a one-page memo to a fictional customer whose fraud model "is 99% accurate" on transactions with a 0.2% fraud base rate. Compute the honest precision of an alert (use natural frequencies and show the 100,000-transaction table), propose the two levers that would actually improve alert quality (raise the prior by pre-filtering; lower the false-positive rate), and include a reusable \`posterior(prior, sensitivity, false_pos)\` function with three worked calls. Written for a smart non-statistician — the Day 105 and Day 171 stakeholder-communication muscle starts here.`,
      rubric: [
        'The 100,000-transaction natural-frequency table appears and is arithmetically correct',
        'Alert precision computed correctly (~16% with the stated numbers) and stated plainly',
        'Two improvement levers proposed, each tied to a term in Bayes\' rule',
        'posterior() function is correct and used for three scenarios',
        'Memo is jargon-free enough for a non-statistician (test: no unexplained term)',
        'Committed to the practice repo',
      ],
    },
    mistakes: [
      'Confusing P(E|H) with P(H|E). "99% of sick people test positive" does not mean "99% of positives are sick" — the base rate decides the gap.',
      'Ignoring the prior entirely (base-rate neglect). Impressive evidence about a rare hypothesis usually still leaves it unlikely.',
      'Forgetting the normalizer when comparing multiple hypotheses — posteriors must sum to 1 across ALL candidate causes, not just the two you like.',
      'Multiplying many raw probabilities in code. They underflow to zero; always sum log-probabilities.',
      'Letting one unseen word zero out a naive Bayes score. Laplace (add-one) smoothing exists precisely to prevent hard zeros from sparse counts.',
      'Updating on the same evidence twice — re-reading the same status page is not new information. Each update must use genuinely new evidence.',
    ],
    quiz: [
      {
        q: 'Disease prevalence 0.1%, sensitivity 99%, false-positive rate 1%. Roughly what is P(disease | positive test)?',
        o: ['99%', '50%', '~9%', '0.1%'],
        x: 2,
        w: 'Per 100,000 people: ~99 true positives vs ~999 false positives, so 99/1098 ≈ 9%. The tiny prior dominates the impressive-sounding accuracy.',
        revisit: 59,
      },
      {
        q: 'In naive Bayes, why sum log-probabilities instead of multiplying probabilities?',
        o: [
          'Logs make the math more accurate statistically',
          'Products of many small probabilities underflow to zero in floating point; sums of logs are numerically stable',
          'Addition is faster than multiplication',
          'It removes the need for smoothing',
        ],
        x: 1,
        w: 'Sixty factors of ~0.01 is 10⁻¹²⁰ — beyond float precision. log turns the product into a well-behaved sum; the argmax is unchanged.',
        revisit: 59,
      },
      {
        q: 'During triage you compute a posterior over causes, then a second independent clue arrives. What do you do?',
        o: [
          'Restart from the original base rates with the new clue only',
          'Use the current posterior as the new prior and update with the new clue\'s likelihoods',
          'Average the two clues\' posteriors',
          'Take whichever clue has the higher likelihood',
        ],
        x: 1,
        w: 'Bayesian updating chains: posterior after clue 1 becomes the prior for clue 2. Restarting throws away evidence; averaging has no probabilistic meaning.',
        revisit: 59,
      },
    ],
    resources: [
      { label: 'Seeing Theory — Bayesian Inference (interactive)', url: 'https://seeing-theory.brown.edu/bayesian-inference/index.html', type: 'course', time: '20 min' },
      { label: 'Harvard Stat 110 — conditioning & Bayes lectures', url: 'https://stat110.hsites.harvard.edu/home', type: 'course', time: '30 min' },
      { label: 'Khan Academy — conditional probability & Bayes', url: 'https://www.khanacademy.org/math/statistics-probability', type: 'course', time: '25 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: Day 57–58 cards (conditional probability, binomial)', minutes: 10 },
      { activity: 'ELI5 + tech read, walk the bayes-grid visualizer', minutes: 20 },
      { activity: 'Guided: medical test three ways + naive Bayes filter', minutes: 42 },
      { activity: 'Practice: Bayesian incident triage', minutes: 18 },
      { activity: 'Project: base-rate briefing memo', minutes: 22 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'Medical-test posterior computed three ways, all agreeing (~9%)',
      'Spam filter runs; underflow experiment and unseen-word experiment done',
      'Triage exercise: two-step sequential update computed correctly',
      'Briefing memo committed; quiz ≥ 2/3',
    ],
    connections: {
      back: 'Bayes is Day 57\'s conditional probability read in reverse — the simulation in Part C is literally a boolean-mask filter. The log-sum trick leans on logarithm intuition from Day 53.',
      forward: 'Day 62\'s cross-entropy is built from the same log-probabilities. Day 72\'s logistic regression outputs posteriors; Day 75\'s precision/recall is the base-rate problem industrialized; Day 172 turns today\'s triage exercise into a formal debugging method.',
    },
    flashcards: [
      { f: "Bayes' rule in words?", b: 'posterior = likelihood × prior / evidence. New belief = how loud the clue × how plausible before, rescaled.' },
      { f: 'Why is P(disease|+) tiny despite a 99% accurate test?', b: 'Rare disease → false positives from the huge healthy group swamp true positives. Base rate dominates.' },
      { f: 'Natural frequencies method?', b: 'Convert to counts per 100,000 people and read the answer off the table. Makes base rates impossible to ignore.' },
      { f: 'Why log-probabilities in naive Bayes?', b: 'Products of many small probabilities underflow; sums of logs are stable and preserve the argmax.' },
      { f: 'What does Laplace smoothing prevent?', b: 'An unseen word making P(word|class)=0 and vetoing the whole classification.' },
      { f: 'Sequential Bayesian updating?', b: 'Yesterday\'s posterior is today\'s prior. Chain updates only on genuinely new evidence.' },
    ],
    deepDive: [
      { label: 'The prosecutor\'s fallacy — P(evidence|innocent) vs P(innocent|evidence)', note: 'Courtroom cases (Sally Clark) where this exact confusion convicted innocent people. The strongest motivation you will find for keeping the direction of conditioning straight.' },
    ],
  },
  {
    id: 'd060', day: 60, week: 9, phase: 3, kind: 'lesson',
    title: 'Statistics I — Sampling & Confidence',
    analogy: 'Tasting the soup, not drinking the pot',
    objectives: [
      'Distinguish a population parameter from a sample estimate and name common sources of sampling bias',
      'State the law of large numbers and compute a standard error as sd/√n',
      'Construct a 95% confidence interval and interpret it correctly (coverage, not certainty)',
      'Build a bootstrap confidence interval for any statistic with NumPy resampling',
      'Attach honest error bars to an eval pass rate and say whether two scores are distinguishable',
    ],
    prereqs: [
      { day: 57, label: 'Monte Carlo & the 1/√n law' },
      { day: 58, label: 'Distributions, CLT & standard error' },
    ],
    eli5: `A chef never drinks the whole pot to find out if the soup needs salt. One spoonful — IF the pot is well stirred — tells the story. Statistics is the discipline of spoonfuls: the pot is the population (every request your API will ever serve, every question users will ever ask your model), the spoonful is your sample, and the entire game is knowing how far a spoonful can mislead you.

Two things can go wrong. The pot might not be stirred — you tasted only the top, where the fat floats. That is sampling bias, and no amount of math repairs it. Or the pot is stirred but the spoon is small — a tiny taste is noisy, and salt levels wobble from spoonful to spoonful. That wobble is quantifiable: it shrinks like 1/√n, and a confidence interval is just an honest label on the spoon that says "the pot is probably within this range of what I tasted." The bootstrap, today's power move, is delightfully weird: you re-taste your OWN spoonful thousands of times (resampling it with replacement) to measure how wobbly spoonfuls of that size are — no formula required.`,
    why: `Every number you will report as an AI engineer is a spoonful: an eval pass rate on 40 cases, a latency p95 from an hour of traffic, a thumbs-up rate from 200 users. Report "87% vs 84%, we improved!" without error bars and you will ship regressions with confidence — on a 40-case set, that gap is well inside the noise. Day 139 builds the eval-statistics discipline on today's foundations, and Day 140's capstone eval report requires CIs. Customers and interviewers both ask the same question: "how sure are you?" — today you learn to answer with a number.`,
    tech: `A **population parameter** is the true value you care about (the real pass rate over all possible cases); a **statistic** is what you compute from a sample. Statistics wobble from sample to sample; parameters do not. The **law of large numbers** guarantees the sample mean converges to the population mean as n grows — Monte Carlo works because of it. But bias breaks the guarantee: convenience samples ("the 30 queries the demo team likes"), survivorship ("only sessions that completed"), and selection effects poison the estimate in ways more data cannot fix.

### Standard error and the confidence interval

The **standard error** is the standard deviation of the statistic itself: for a mean, se = σ/√n (estimate σ with the sample sd). By the CLT the sample mean is approximately normal, so **estimate ± 1.96·se** covers the true value about 95% of the time. For a pass rate p̂ on n cases, se = √(p̂(1−p̂)/n): a 34/40 run (85%) has se ≈ 5.6 points, so the 95% CI is roughly 74%–96%. Sit with how wide that is.

Interpretation discipline: the parameter is fixed; the INTERVAL is random. "95% confidence" means the recipe produces intervals that capture the truth in 95% of repeated experiments — not "there is a 95% probability the truth is in this particular interval". Practically, the reading is: values inside the interval are consistent with your data; values outside are not.

### The bootstrap

The formula above needs a formula for se — fine for means, painful for medians, p95s, ratios, or F1 scores. The **bootstrap** sidesteps it: resample your n observations WITH replacement to make a fake sample of size n, compute the statistic, repeat ~10,000 times, and take the 2.5th and 97.5th percentiles of the results as the CI. The resamples simulate "what other samples of this size from this world would have looked like". It requires a representative, reasonably sized sample (n ≥ ~30 as a rough floor) and roughly independent observations — it cannot rescue a biased sample or conjure information you never collected.`,
    viz: 'sampling-ci',
    guided: [
      {
        title: 'What "95%" actually means — a coverage experiment',
        minutes: 20,
        body: `1. Paste the starter. It creates a population of 1,000,000 latencies with a KNOWN true mean — a luxury you never have in real life, which is exactly why simulation is the right teacher.
2. Draw 1,000 independent samples of n = 50. For each, compute mean, se = sd/√n, and the interval mean ± 1.96·se.
3. Count what fraction of the 1,000 intervals contain the true mean. It should land near 0.95 — that fraction IS the meaning of "95% confidence".
4. Rerun with n = 200. Coverage stays ~95% but intervals get ~2× narrower (√4). Coverage is the promise; width is what you buy with sample size.
5. Now sabotage it: sample only from the slowest 20% of the population (biased sampling) and watch coverage collapse to ~0. Write the lesson: the CI machinery assumes a fair spoonful — bias breaks it silently.`,
        code: `import numpy as np

rng = np.random.default_rng(seed=60)
population = rng.lognormal(mean=4.0, sigma=0.7, size=1_000_000)
true_mean = population.mean()

def coverage(n, n_experiments=1000):
    hits = 0
    for _ in range(n_experiments):
        sample = rng.choice(population, size=n)
        se = sample.std(ddof=1) / np.sqrt(n)
        lo, hi = sample.mean() - 1.96 * se, sample.mean() + 1.96 * se
        hits += (lo <= true_mean <= hi)
    return hits / n_experiments

print("true mean:", round(true_mean, 2))
print("coverage at n=50: ", coverage(50))
print("coverage at n=200:", coverage(200))

# biased spoonful: only the slow tail gets sampled
slow_tail = np.sort(population)[-200_000:]
sample = rng.choice(slow_tail, size=50)
se = sample.std(ddof=1) / np.sqrt(50)
print("biased CI:", round(sample.mean() - 1.96*se, 1), "-",
      round(sample.mean() + 1.96*se, 1), " vs truth", round(true_mean, 1))`,
      },
      {
        title: 'The bootstrap from scratch',
        minutes: 20,
        body: `1. The starter gives you ONE sample of 200 latencies — your real-world situation: no population, no formula for the p95's standard error.
2. Read the bootstrap loop: \`rng.integers(0, n, size=(10_000, n))\` builds 10,000 resample index sets at once; fancy indexing turns them into resamples; one statistic per row.
3. Compute bootstrap 95% CIs for the mean, the median, and the p95. Note how much wider the p95's interval is — tail statistics are hungry for data.
4. Cheat and check: the code holds a hidden population. Compare each CI against the true values. The mean and median CIs should cover; the p95 usually covers but is wide.
5. Shrink your sample to n = 25 and rebuild the p95 CI. Watch it become absurd — a p95 from 25 points is barely more than the maximum of 25 points. Write the rule: the bootstrap quantifies the noise in YOUR sample; it cannot substitute for data you never collected.`,
        code: `import numpy as np

rng = np.random.default_rng(seed=600)
hidden_population = rng.lognormal(mean=4.0, sigma=0.7, size=1_000_000)
sample = rng.choice(hidden_population, size=200)   # all you "really" have

def bootstrap_ci(data, stat_fn, n_boot=10_000, alpha=0.05, seed=0):
    r = np.random.default_rng(seed)
    n = len(data)
    idx = r.integers(0, n, size=(n_boot, n))       # resample WITH replacement
    stats = stat_fn(data[idx], axis=1)             # one statistic per resample
    lo, hi = np.percentile(stats, [100*alpha/2, 100*(1-alpha/2)])
    return lo, hi

for name, fn, truth in [
    ("mean  ", np.mean,   hidden_population.mean()),
    ("median", np.median, np.median(hidden_population)),
    ("p95   ", lambda a, axis: np.percentile(a, 95, axis=axis),
               np.percentile(hidden_population, 95)),
]:
    lo, hi = bootstrap_ci(sample, fn)
    print(f"{name} CI [{lo:8.1f}, {hi:8.1f}]   truth {truth:8.1f}")`,
      },
    ],
    practice: [
      {
        title: 'Error bars or it didn\'t happen',
        minutes: 20,
        body: `Your model passed 34/40 golden-set cases yesterday and 31/40 today after a prompt tweak. A teammate wants to revert the tweak.

Your goals: (1) compute the 95% CI for each day's pass rate using se = √(p̂(1−p̂)/n); (2) bootstrap the same CIs from the case-level boolean arrays (simulate them: 40 Bernoulli draws each at the observed rates, or just build arrays with 34 and 31 Trues) and confirm the formula and the bootstrap roughly agree; (3) state whether the two days are distinguishable and what you would tell the teammate; (4) compute how many cases n you would need for the CI to be ±3 points at p ≈ 0.85 — solve 1.96·√(0.85·0.15/n) = 0.03.

Hints: the two intervals overlap heavily — the honest answer is "we cannot tell from 40 cases". The n you compute in (4) is why Day 140's golden set has a minimum size and why Day 139 uses paired comparisons to squeeze more signal from the same cases.`,
      },
    ],
    project: {
      title: 'bootstrap.py — your error-bar machine',
      brief: `Promote the guided code into \`bootstrap.py\` in your practice repo: a reusable \`bootstrap_ci(data, stat_fn, n_boot=10_000, alpha=0.05, seed=0)\` that works for any vectorizable statistic, plus a \`pass_rate_ci(k, n)\` helper implementing the formula CI for eval scores. Include a demo section that (a) reproduces the 34/40 vs 31/40 analysis with a printed verdict, and (b) bootstraps a CI for the p95 of a seeded log-normal latency sample. Docstrings state the assumptions (representative sample, independence, n not tiny). Commit it — Day 63's checkpoint imports this file, and Day 139 rebuilds it for real eval runs.`,
      rubric: [
        'bootstrap_ci is vectorized (index-matrix trick, no Python loop over resamples) and seedable',
        'pass_rate_ci(34, 40) returns approximately (0.74, 0.96)',
        'Demo prints a correct verdict on 34/40 vs 31/40 (overlapping CIs → not distinguishable)',
        'Latency p95 CI demo runs on seeded data',
        'Assumptions documented in docstrings',
        'Committed to the practice repo',
      ],
    },
    mistakes: [
      'Reading "95% CI" as "95% probability the truth is inside this interval". The truth is fixed; the interval is the random thing. 95% is the long-run capture rate of the recipe.',
      'Quoting an eval score without n. "85%" from 40 cases is 74–96%; from 4,000 cases it is 84–86%. The number alone is meaningless.',
      'Using standard deviation where standard error belongs. sd describes the data\'s spread; se = sd/√n describes the estimate\'s wobble.',
      'Bootstrapping a biased sample and trusting the result. The bootstrap replays YOUR sample\'s composition — bias in, bias out, now with respectable-looking error bars.',
      'Cranking n_boot to narrow an interval. More resamples only smooth the CI estimate; interval width comes from n, the real sample size.',
      'Bootstrapping tail statistics (p95, max) from tiny samples. A p95 needs enough points in the tail to say anything; check n before trusting the interval.',
    ],
    quiz: [
      {
        q: 'A model passes 34/40 eval cases (85%). Roughly what is the 95% confidence interval for its true pass rate?',
        o: ['84%–86%', '74%–96%', '80%–90%', 'Exactly 85% — the set is fixed'],
        x: 1,
        w: 'se = √(0.85·0.15/40) ≈ 0.056, so the interval is 0.85 ± 1.96·0.056 ≈ [0.74, 0.96]. Small golden sets give wide error bars — the Day 139 discipline in one calculation.',
        revisit: 60,
      },
      {
        q: 'What does "95% confidence" technically promise?',
        o: [
          'There is a 95% chance the true value lies in this interval',
          'The procedure, repeated across many samples, produces intervals that capture the true value ~95% of the time',
          '95% of the data falls inside the interval',
          'The estimate is 95% accurate',
        ],
        x: 1,
        w: 'Coverage is a property of the recipe, not of one interval. Your coverage experiment measured exactly this: ~950 of 1,000 intervals contained the truth.',
        revisit: 60,
      },
      {
        q: 'You raise n_boot from 1,000 to 1,000,000 resamples. What happens to your bootstrap CI?',
        o: [
          'It gets much narrower — more resamples, more precision',
          'Its endpoints stabilize (less Monte Carlo noise) but its width barely changes — width comes from the real sample size n',
          'It becomes exact',
          'It gets wider to be safe',
        ],
        x: 1,
        w: 'Resamples only re-mix the data you already have. n_boot controls simulation noise in the CI endpoints; only collecting more real data narrows the interval.',
        revisit: 60,
      },
    ],
    resources: [
      { label: 'Seeing Theory — Frequentist Inference (CIs & bootstrap, interactive)', url: 'https://seeing-theory.brown.edu/frequentist-inference/index.html', type: 'course', time: '20 min' },
      { label: 'Khan Academy — confidence intervals unit', url: 'https://www.khanacademy.org/math/statistics-probability', type: 'course', time: '25 min' },
      { label: 'Harvard Stat 110 — inference lectures', url: 'https://stat110.hsites.harvard.edu/home', type: 'course', time: '30 min' },
      { label: 'Mathematics for Machine Learning — probability & statistics chapters', url: 'https://mml-book.github.io/', type: 'book', time: '25 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: Days 57–59 cards (conditional prob, CLT, Bayes)', minutes: 10 },
      { activity: 'ELI5 + tech read, walk the sampling-ci visualizer', minutes: 20 },
      { activity: 'Guided: coverage experiment + bootstrap from scratch', minutes: 40 },
      { activity: 'Practice: error bars on the 34/40 vs 31/40 eval delta', minutes: 20 },
      { activity: 'Project: bootstrap.py error-bar machine', minutes: 20 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'Coverage experiment shows ~95% at two sample sizes and collapse under biased sampling',
      'Bootstrap CIs computed for mean, median, and p95 with the vectorized index trick',
      'Eval-delta practice answered: CIs, verdict, and required n for ±3 points',
      'bootstrap.py committed; quiz ≥ 2/3',
    ],
    connections: {
      back: 'The 1/√n wobble you eyeballed on Day 57 is now the standard error, and Day 58\'s CLT is why "estimate ± 1.96·se" is allowed to use the normal\'s 95% number.',
      forward: 'Day 61 asks the follow-up question — is this difference real? — with hypothesis tests. Day 63\'s checkpoint runs bootstrap CIs on a model-A-vs-model-B decision, and Day 139 turns today\'s toolkit loose on real eval runs (with pairing tricks that beat naive CIs).',
    },
    flashcards: [
      { f: 'Standard error of a mean?', b: 'se = sd/√n — the standard deviation of the estimate itself. Quadruple n to halve it.' },
      { f: 'Correct reading of a 95% CI?', b: 'The recipe captures the truth in ~95% of repeated samples. Not "95% chance truth is in this one".' },
      { f: 'Bootstrap in one sentence?', b: 'Resample your sample with replacement many times, recompute the statistic, take percentiles as the CI.' },
      { f: 'CI for a pass rate p̂ on n cases?', b: 'p̂ ± 1.96·√(p̂(1−p̂)/n). For 34/40 that is roughly 74%–96%.' },
      { f: 'What can the bootstrap NOT fix?', b: 'Sampling bias and tiny samples — it replays your sample, garbage in, garbage out.' },
      { f: 'Does raising n_boot narrow the CI?', b: 'No — it only stabilizes the endpoints. Width comes from the real sample size n.' },
    ],
    deepDive: [
      { label: 'Wilson score interval — better CIs for proportions near 0 or 1', note: 'The normal-approximation CI misbehaves when p̂ is extreme or n is small (it can exceed 100%). The Wilson interval fixes this and is what serious eval harnesses use — worth knowing before Day 139.' },
    ],
  },
  {
    id: 'd061', day: 61, week: 9, phase: 3, kind: 'lesson',
    title: 'Statistics II — Hypothesis Tests & A/B',
    analogy: 'The courtroom standard',
    objectives: [
      'State null and alternative hypotheses for a product or model change',
      'Define a p-value precisely and list two things it is NOT',
      'Run a permutation test from scratch with NumPy and read its verdict',
      'Estimate statistical power by simulation and size an experiment before running it',
      'Explain how multiple comparisons and peeking manufacture false positives',
    ],
    prereqs: [
      { day: 58, label: 'Binomial noise & the CLT' },
      { day: 60, label: 'Standard errors & confidence intervals' },
    ],
    eli5: `A courtroom does not ask "is the defendant guilty?" — it asks "is the evidence too strong to be explained by innocence?" The defendant is presumed innocent (the null hypothesis: nothing changed, the difference is luck). The prosecution presents evidence (your data). The jury asks: IF the defendant were innocent, how surprising would this evidence be? That "how surprising" is the p-value. If innocence would produce evidence this damning only 2% of the time, the jury convicts — rejects the null.

Two subtleties make the analogy load-bearing. First, "not guilty" is not "innocent": failing to reject the null means the evidence was insufficient, not that there is no effect — maybe you just needed a bigger investigation (more samples: that is power). Second, the standard of proof is chosen BEFORE the trial (the significance level, usually 5%), because a jury that keeps deliberating until it finds the verdict it wants — peeking at the data until significance appears — will convict innocent defendants constantly. Statistics is a courtroom where you are prosecutor, jury, AND the person who profits from a guilty verdict. The rules exist to protect you from yourself.`,
    why: `"Prompt B scored 3 points higher, ship it" is the AI-engineering equivalent of convicting on a hunch — Day 58 showed 3 points on 40 cases is routine noise. Every prompt tweak, model swap, and retrieval change you A/B (Day 109 does exactly this with two prompt variants) is a hypothesis test, whether you run it honestly or not. Day 139 builds eval significance testing on today's machinery, and Day 141's regression gates are automated hypothesis tests in CI. Teams without this discipline oscillate: ship noise, revert noise, ship it again.`,
    tech: `The **null hypothesis** H₀ says nothing interesting is happening (the two variants have equal true pass rates); the **alternative** H₁ says something is. You compute a test statistic (e.g. the difference in pass rates), then ask: what is the probability, ASSUMING H₀, of a statistic at least this extreme? That probability is the **p-value**. Small p (below a pre-chosen α, conventionally 0.05) → the data is hard to explain as luck → reject H₀. A p-value is NOT the probability the null is true, NOT the probability you are wrong, and NOT a measure of effect size — a microscopic, irrelevant difference becomes "significant" with enough data. Always report the effect size with its CI alongside p.

### The permutation test — simulation-first significance

If the two variants truly perform identically, the labels "A" and "B" are meaningless decoration. So: pool all case results, shuffle the labels thousands of times, and recompute the difference each time. That histogram is the null distribution — what luck alone produces. Your p-value is the fraction of shuffles at least as extreme as the observed difference. No distributional assumptions, works for any statistic (means, medians, pass rates, F1), and it is ten lines of NumPy.

### Power, and the two ways to cheat

**Power** is the probability of detecting an effect that truly exists: it grows with effect size and sample size. An underpowered experiment mostly returns "not significant" even for real improvements — absence of evidence, not evidence of absence. Simulate before you run: pick the minimum effect you care about, and find the n where power ≥ 80%.

Cheating method one: **multiple comparisons** — test 20 metrics at α = 0.05 and expect one false positive by design; correct with stricter thresholds (Bonferroni: α/k) or pre-register ONE primary metric. Cheating method two: **peeking** — testing after every batch and stopping at the first significant result inflates the false-positive rate far above 5%, because you give luck many chances to cross the line. Fix the sample size in advance (or use sequential methods designed for peeking).`,
    viz: null,
    guided: [
      {
        title: 'A permutation test from scratch',
        minutes: 22,
        body: `1. The scenario: prompt A passed 33/50 golden-set cases; prompt B passed 41/50. The starter builds the two boolean arrays and computes the observed gap (0.16).
2. Read the shuffle loop: pool all 100 results, permute, split back into two groups of 50, record the gap. 10,000 shuffles build the null distribution.
3. Compute the two-sided p-value: the fraction of shuffled gaps whose absolute value ≥ 0.16. You should land near p ≈ 0.09.
4. Interpret honestly: at α = 0.05 you cannot reject the null — a 16-point gap on 50 cases is still explainable by luck often enough to worry. Feel how counterintuitive that is; this is why eyeballing eval deltas fails.
5. Rerun the whole experiment pretending each prompt was evaluated on 200 cases with the same rates (132/200 vs 164/200). Watch p collapse to near zero. Same effect, more evidence, different verdict.
6. Print the 95% CI on the gap (Day 60\'s formula) next to the p-value and note they tell one consistent story.`,
        code: `import numpy as np

rng = np.random.default_rng(seed=61)

def make_results(passes, n):
    a = np.zeros(n, dtype=bool); a[:passes] = True
    return rng.permutation(a)

def perm_test(a, b, n_perm=10_000):
    observed = b.mean() - a.mean()
    pooled = np.concatenate([a, b])
    gaps = np.empty(n_perm)
    for i in range(n_perm):
        shuffled = rng.permutation(pooled)
        gaps[i] = shuffled[len(a):].mean() - shuffled[:len(a)].mean()
    p = (np.abs(gaps) >= abs(observed)).mean()
    return observed, p

a, b = make_results(33, 50), make_results(41, 50)
obs, p = perm_test(a, b)
print(f"n=50 per arm : gap {obs:+.3f}  p = {p:.4f}")

a2, b2 = make_results(132, 200), make_results(164, 200)
obs2, p2 = perm_test(a2, b2)
print(f"n=200 per arm: gap {obs2:+.3f}  p = {p2:.4f}")`,
      },
      {
        title: 'Power — size the experiment before you run it',
        minutes: 18,
        body: `1. Question: prompt B is TRULY 5 points better (0.80 vs 0.85). How often would your test actually detect that?
2. The starter simulates 1,000 complete experiments at each n: draw A ~ Binomial(n, 0.80) and B ~ Binomial(n, 0.85), run a fast normal-approximation test on each, count the fraction reaching p < 0.05. That fraction is the power.
3. Run for n = 50, 200, 800, 3200. Expect roughly 8%, 25%, 65%, 99% — at n = 50 you would miss a REAL 5-point improvement more than 90% of the time.
4. Find the smallest n (bisect by hand) where power ≥ 0.80. This number — around 1,200 per arm for a 5-point gap — is why "just eyeball 20 cases" is not a methodology.
5. Repeat for a 15-point true gap (0.70 vs 0.85) and see power ≥ 80% arrive by n ≈ 100. Write the law in your notes: detectable effect size and required n trade off quadratically — half the effect needs 4× the cases.`,
        code: `import numpy as np

rng = np.random.default_rng(seed=610)

def power(p_a, p_b, n, n_sims=1000, alpha=0.05):
    ka = rng.binomial(n, p_a, size=n_sims)
    kb = rng.binomial(n, p_b, size=n_sims)
    pa, pb = ka / n, kb / n
    pool = (ka + kb) / (2 * n)
    se = np.sqrt(pool * (1 - pool) * 2 / n)
    z = (pb - pa) / np.where(se == 0, 1e-9, se)
    return (np.abs(z) > 1.96).mean()

for n in [50, 200, 800, 3200]:
    print(f"n={n:5d}  power to detect 0.80 vs 0.85: {power(0.80, 0.85, n):.2f}")
for n in [50, 100, 200]:
    print(f"n={n:5d}  power to detect 0.70 vs 0.85: {power(0.70, 0.85, n):.2f}")`,
      },
    ],
    practice: [
      {
        title: 'The 20-dashboard trap',
        minutes: 18,
        body: `Your team tracks 20 metrics. A release goes out that changes NOTHING (you will simulate this: both arms drawn from identical distributions).

Your goals: (1) simulate 20 independent A/A tests (same true rate 0.8, n = 500 per arm), test each at α = 0.05, and count "significant" results — repeat the whole thing 200 times and report the average number of false alarms and the probability of at least one; (2) now simulate peeking: one A/A test where you check significance after every additional 100 observations up to 2,000, stopping at the first p < 0.05 — across 500 simulated experiments, what fraction ever "finds" significance? (3) write the two-line policy you would give a team: one pre-registered primary metric, fixed n decided by a power calculation, no early stopping without sequential methods.

Hints: expect ~1 false alarm per 20-metric release and a ~64% chance of at least one (1 − 0.95²⁰); peeking typically inflates 5% to 25%+. These two numbers explain most "mystery regressions" in dashboards.`,
      },
    ],
    project: {
      title: 'ab_test.py + the one-page readout',
      brief: `Build \`ab_test.py\` in your practice repo: a reusable \`perm_test(a, b, n_perm, seed)\` (vectorize the shuffle loop if you can: one big permuted matrix) and a \`required_n(p_base, min_effect, power=0.8)\` estimated by simulation. Then write \`ab_readout.md\` — a template you will reuse on Days 109 and 139: hypothesis, primary metric, minimum effect of interest, n from the power calculation, result (effect size + 95% CI + p), decision. Fill the template in for the 33/50 vs 41/50 prompt experiment, with the honest verdict ("promising, underpowered — extend to n≈X before shipping"). Commit both.`,
      rubric: [
        'perm_test reproduces the guided results (p ≈ 0.09 at n=50, near 0 at n=200)',
        'required_n(0.80, 0.05) returns roughly 1,000–1,500 per arm',
        'Readout template contains all six sections and is filled in with the honest verdict',
        'Effect size + CI reported alongside the p-value, never p alone',
        'Committed to the practice repo',
      ],
    },
    mistakes: [
      'Reading p = 0.03 as "97% chance the improvement is real". The p-value conditions on the null being true; it says nothing directly about P(H₀).',
      'Treating "not significant" as "no difference". With low power, real effects routinely fail to reach significance — report the CI so the reader sees what you could and could not detect.',
      'Confusing significance with importance. With n = 100,000, a 0.1-point difference is "significant" and still not worth shipping. Effect size decides importance.',
      'Testing 20 metrics and celebrating the one that lit up. At α = 0.05, one in twenty lights up by design. Pre-register a primary metric or correct the threshold.',
      'Peeking: checking significance repeatedly and stopping when it appears. This inflates false positives severalfold. Fix n in advance.',
      'Ignoring that both prompts ran on the SAME cases. Paired analysis (per-case comparison) is more powerful than treating the arms as independent — Day 139 exploits this properly.',
    ],
    quiz: [
      {
        q: 'A test on your prompt change returns p = 0.03. What does that number mean?',
        o: [
          'There is a 3% chance the change did nothing',
          'If the change truly did nothing, data this extreme would occur about 3% of the time',
          'The change improved the metric by 3%',
          'There is a 97% chance the change helped',
        ],
        x: 1,
        w: 'The p-value is computed ASSUMING the null: it is P(data this extreme | no effect), not P(no effect | data). Inverting it is Day 59\'s base-rate error in a lab coat.',
        revisit: 61,
      },
      {
        q: 'You monitor 20 metrics after a no-op release, each tested at α = 0.05. What should you expect?',
        o: [
          'No significant results, since nothing changed',
          'About one falsely significant metric, and a ~64% chance of at least one',
          'All 20 slightly significant',
          'Significance only if the release actually changed something',
        ],
        x: 1,
        w: 'Each test has a 5% false-positive rate; across 20 independent tests that compounds to 1 − 0.95²⁰ ≈ 64% chance of at least one false alarm. Multiple comparisons need correction or a single pre-registered metric.',
        revisit: 61,
      },
      {
        q: 'Prompt B beat prompt A by 6 points on 30 cases, p = 0.4. The most honest conclusion is…',
        o: [
          'B is better — ship it',
          'B is not better — revert it',
          'The experiment is underpowered: a real 6-point effect and pure noise are both consistent with this data; collect more cases',
          'The p-value must be miscalculated',
        ],
        x: 2,
        w: 'Failing to reject the null is not evidence of no effect — with n = 30 the test has little power to detect a 6-point gap. The CI on the effect will be wide enough to include both 0 and large improvements.',
        revisit: 61,
      },
    ],
    resources: [
      { label: 'Seeing Theory — Frequentist Inference (interactive)', url: 'https://seeing-theory.brown.edu/frequentist-inference/index.html', type: 'course', time: '20 min' },
      { label: 'Khan Academy — significance tests unit', url: 'https://www.khanacademy.org/math/statistics-probability', type: 'course', time: '25 min' },
      { label: 'Harvard Stat 110 — inference & testing lectures', url: 'https://stat110.hsites.harvard.edu/home', type: 'course', time: '30 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: Day 60 cards (se, CI, bootstrap)', minutes: 10 },
      { activity: 'ELI5 + tech read: the courtroom, p-values, power', minutes: 20 },
      { activity: 'Guided: permutation test + power simulation', minutes: 40 },
      { activity: 'Practice: the 20-dashboard trap', minutes: 18 },
      { activity: 'Project: ab_test.py + readout template', minutes: 22 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'Permutation test built from scratch; p ≈ 0.09 at n=50 and ~0 at n=200 reproduced',
      'Power curve computed; required n for a 5-point effect estimated',
      'A/A false-alarm and peeking simulations run with written policy',
      'ab_test.py + readout committed; quiz ≥ 2/3',
    ],
    connections: {
      back: 'The null distribution is Day 57\'s Monte Carlo applied to a shuffled world, and the CI you report next to p is Day 60\'s. The binomial noise that makes 3-point gaps meaningless is Day 58\'s sd ≈ 2.3 cases.',
      forward: 'Day 109 A/Bs two prompt variants on 20 cases — you now know why 20 is only a smoke test. Day 139 adds paired comparisons and run-to-run variance for evals, and Day 141 turns significance thresholds into CI regression gates.',
    },
    flashcards: [
      { f: 'p-value in one precise sentence?', b: 'The probability, assuming the null, of a result at least as extreme as observed. Not P(null is true).' },
      { f: 'Permutation test recipe?', b: 'Pool results, shuffle labels many times, recompute the gap; p = fraction of shuffles as extreme as observed.' },
      { f: 'Statistical power?', b: 'P(detect an effect that truly exists). Grows with effect size and n. Aim ≥ 80% before running.' },
      { f: '"Not significant" means?', b: 'Insufficient evidence — not "no effect". Check power and report the CI.' },
      { f: 'Why is peeking dangerous?', b: 'Testing repeatedly and stopping at first significance gives luck many chances — false positives inflate far above α.' },
      { f: '20 metrics at α=0.05, no-op release?', b: 'Expect ~1 false positive; ~64% chance of at least one. Pre-register one primary metric.' },
    ],
    deepDive: [
      { label: 'Sequential testing & always-valid p-values', note: 'If peeking is inevitable (it is, dashboards exist), sequential methods (SPRT, confidence sequences) let you monitor continuously without inflating error rates. Worth a skim before you build Day 146\'s dashboards.' },
    ],
  },
  {
    id: 'd062', day: 62, week: 9, phase: 3, kind: 'lesson',
    title: 'Entropy, Cross-Entropy & KL',
    analogy: 'Surprise as a currency',
    objectives: [
      'Define information as surprise (−log p) and compute it in bits and nats',
      'Compute the entropy of a distribution and explain why uniform maximizes it',
      'Explain cross-entropy as "average surprise when betting with the wrong forecast" and why it is THE training loss',
      'Compute KL divergence and state its three key properties (≥ 0, zero iff equal, asymmetric)',
      'Convert a language-model loss to perplexity and interpret both against a random baseline',
    ],
    prereqs: [
      { day: 57, label: 'Probability fundamentals' },
      { day: 59, label: 'Log-probabilities & the underflow trick' },
    ],
    eli5: `Imagine paying for news in proportion to how surprised you are. "The sun rose this morning" — worthless, you pay nothing. "It snowed in the Sahara" — you would pay a lot. Information theory makes this precise: the surprise of an event is −log of its probability. Certain events carry zero surprise; rare events carry a lot; and surprises ADD — two independent shockers are worth the sum of each (because their probabilities multiply and logs turn products into sums).

Entropy is the average surprise a source dishes out. A fair coin keeps you maximally on your toes: 1 bit per flip. A trick coin that lands heads 99% of the time is boring — almost no surprise per flip. Now the punchline that runs all of deep learning: suppose the world deals events from distribution p, but YOU bet using forecast q. Your average surprise — cross-entropy — is always at least the world's own entropy, and the gap between them, KL divergence, is the exact price of being wrong. Training a model by "minimizing cross-entropy" just means: adjust the forecast until the model is as unsurprised by reality as reality allows. Surprise is the currency; learning is driving down your bill.`,
    why: `Cross-entropy is the loss function you will stare at more than any other number in your career: logistic regression's log-loss (Day 72), every neural net classifier (Days 85–90), and the pretraining objective of every LLM (Day 100) are all cross-entropy. Reading a loss curve without knowing what the units mean — "is 2.3 good?" — is flying blind; today you learn that 2.3 nats on 10 classes IS the random baseline (ln 10). Perplexity in model reports, temperature in sampling (Day 102), and KL penalties in RLHF are all today's vocabulary.`,
    tech: `The **information content** of an outcome with probability p is −log p: in base 2, bits; in base e, nats (PyTorch losses are nats — memorize this). **Entropy** is the expected surprise of a source: H(p) = −Σᵢ pᵢ log pᵢ. It is maximized by the uniform distribution (log k for k outcomes) and zero when one outcome is certain. Operationally, H is the floor on the average number of yes/no questions (or code bits) needed to identify an outcome — 8 equally likely suspects need 3 questions because H = 3 bits.

### Cross-entropy: the loss

If reality draws from p but your model assigns probabilities q, your average surprise is the **cross-entropy** H(p, q) = −Σᵢ pᵢ log qᵢ ≥ H(p), with equality only when q = p. In supervised training the true label is one-hot, so the sum collapses to a single term: **loss = −log q(correct class)** — literally "how surprised was the model by the truth". Confidently right → loss near 0. Confidently wrong → loss explodes, because −log q blows up as q → 0. That asymmetric punishment for confident errors is a feature: it is what pushes models toward calibrated probabilities.

### KL divergence: the gap

**KL(p‖q) = H(p, q) − H(p) = Σᵢ pᵢ log(pᵢ/qᵢ)** — the extra surprise you pay for using q instead of the truth p. Properties: always ≥ 0; zero iff p = q; and asymmetric — KL(p‖q) ≠ KL(q‖p), so it is not a distance. Minimizing cross-entropy in training is minimizing KL to the data distribution, since H(p) is fixed.

### Perplexity and temperature

**Perplexity** = exp(cross-entropy in nats): the "effective number of equally likely choices" the model is hedging across. A perplexity of 20 means the model is as uncertain as a fair 20-sided die per token. And dividing logits by a **temperature** T before softmax reshapes q: T < 1 sharpens (lower entropy), T > 1 flattens (higher entropy) — Day 102 turns this dial on a real model.`,
    viz: 'entropy-bits',
    guided: [
      {
        title: 'Surprise, entropy, and twenty questions',
        minutes: 18,
        body: `1. Paste the starter. Part A prints the surprise (in bits) of events at p = 0.99, 0.5, 0.1, 0.001 — confirm rare = expensive, and that a 1-in-1024 event costs exactly 10 bits.
2. Part B computes coin entropy across biases 0.5 → 0.99. Verify the fair coin maxes out at 1.0 bit and near-certain coins approach 0.
3. Part C is the guessing game: 8 equally likely suspects have H = 3 bits — exactly 3 optimal yes/no questions. Now skew the suspects (one has probability 0.65) and watch H drop below 2: a smart guesser asks about the likely suspect first and usually finishes early. Entropy = the unavoidable average number of questions.
4. Compute H for a uniform distribution over 50,000 outcomes (a vocabulary-sized die): ~15.6 bits. That is the ceiling a language model starts from before it learns anything.
5. Write one line in your notes: "entropy is a property of the ______, cross-entropy is a property of the ______ and the ______." (source; source and forecast)`,
        code: `import numpy as np

def surprise_bits(p):
    return -np.log2(p)

print("A: surprise in bits")
for p in [0.99, 0.5, 0.1, 1/1024]:
    print(f"  p={p:<8.4g} -> {surprise_bits(p):6.2f} bits")

def entropy_bits(p):
    p = np.asarray(p, dtype=float)
    nz = p[p > 0]
    return -(nz * np.log2(nz)).sum()

print("B: coin entropy")
for bias in [0.5, 0.7, 0.9, 0.99]:
    print(f"  bias={bias} -> H = {entropy_bits([bias, 1-bias]):.3f} bits")

print("C: suspects")
uniform8 = np.full(8, 1/8)
skewed8 = np.array([0.65, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05])
print("  uniform 8:", entropy_bits(uniform8), "bits")
print("  skewed  8:", round(entropy_bits(skewed8), 3), "bits")
print("  vocab 50k:", round(entropy_bits(np.full(50_000, 1/50_000)), 2), "bits")`,
      },
      {
        title: 'Cross-entropy as a loss you can feel',
        minutes: 22,
        body: `1. The starter sets up a 4-class problem with 6 labeled examples and four "models": uniform (knows nothing), decent, confident-and-right, confident-and-wrong.
2. Compute each model's average cross-entropy loss = mean of −log q(true class), in nats. Predict the ordering before running. Confirm uniform lands at ln 4 ≈ 1.386 — the random baseline for 4 classes.
3. Stare at the confident-and-wrong model: ONE example where it put q = 0.001 on the truth costs −ln(0.001) ≈ 6.9 nats, dragging the average above the know-nothing model. Confident wrongness is the cardinal sin — write down why that is exactly the incentive you want a training loss to encode.
4. Mini-training: interpolate the uniform model toward the perfect one-hot answers in 10 steps and print the loss at each step — a hand-made loss curve, falling monotonically. This is the shape you will watch on Day 89 for real.
5. Compute KL(p_true_freq ‖ q) for each model and confirm KL = cross-entropy − entropy. Then compute both KL directions between two of the models to see the asymmetry with your own eyes.
6. Convert each loss to perplexity with exp(loss). The uniform model's perplexity is exactly 4 — "hedging across 4 choices". This number is how LLM papers will speak to you.`,
        code: `import numpy as np

rng = np.random.default_rng(seed=62)
K = 4
y = np.array([0, 2, 1, 3, 2, 0])            # true classes for 6 examples

def model(rows):
    q = np.array(rows, dtype=float)
    return q / q.sum(axis=1, keepdims=True)  # normalize each row

uniform  = model([[1, 1, 1, 1]] * 6)
decent   = model([[6, 1, 2, 1], [1, 1, 6, 2], [1, 6, 1, 1],
                  [1, 2, 1, 6], [2, 1, 5, 2], [5, 1, 1, 3]])
sharp_ok = model([[97, 1, 1, 1], [1, 1, 97, 1], [1, 97, 1, 1],
                  [1, 1, 1, 97], [1, 1, 97, 1], [97, 1, 1, 1]])
sharp_bad = sharp_ok.copy()
sharp_bad[0] = [0.001, 0.997, 0.001, 0.001]  # confidently wrong on example 0

def xent(q, y):
    return -np.log(q[np.arange(len(y)), y]).mean()   # nats

for name, q in [("uniform", uniform), ("decent", decent),
                ("sharp+right", sharp_ok), ("sharp+1 wrong", sharp_bad)]:
    L = xent(q, y)
    print(f"{name:14s} loss {L:6.3f} nats   perplexity {np.exp(L):7.2f}")
print("random baseline ln(4) =", round(np.log(4), 3))

# hand-made loss curve: uniform -> perfect
onehot = np.zeros((6, K)); onehot[np.arange(6), y] = 1
for step in range(11):
    t = step / 10
    q = (1 - t) * uniform + t * onehot
    q = np.clip(q, 1e-9, 1)                  # never log(0)
    print(f"t={t:.1f}  loss {xent(q, y):.4f}")`,
      },
    ],
    practice: [
      {
        title: 'The temperature dial',
        minutes: 18,
        body: `A model produces logits [4.0, 2.5, 1.0, 0.5, -1.0] over five tokens. Implement a stable softmax with temperature: subtract the max, divide logits by T, exponentiate, normalize.

Your goals: (1) compute the probability distribution and its entropy (in bits) at T = 0.25, 0.5, 1, 2, 100; (2) describe the two limits — as T → 0 the distribution approaches one-hot argmax (entropy → 0, "greedy"), as T → ∞ it approaches uniform (entropy → log₂ 5 ≈ 2.32); (3) in two sentences, connect this to sampling from an LLM: what does raising temperature trade away, and why does T change WHICH token wins never (argmax is invariant) but HOW OFTEN each is sampled always? (4) sample 1,000 tokens at T = 0.5 and T = 2 with rng.choice(p=...) and compare the counts.

Hints: entropy of the T = 1 distribution should land around 1.3 bits. Day 102 runs this exact experiment against a real API — keep your code.`,
      },
    ],
    project: {
      title: 'entropy.py + the loss-reader\'s card',
      brief: `Build \`entropy.py\` in your practice repo: \`entropy(p)\`, \`cross_entropy(p, q)\`, \`kl(p, q)\` (all accepting NumPy arrays, safe against zeros via clipping, with a \`bits=True/False\` flag), and \`perplexity(loss_nats)\`. Add asserts encoding the theory: cross_entropy ≥ entropy, kl ≥ 0, kl(p, p) == 0, and kl asymmetry on an example. Then write \`loss_card.md\` — the card you will keep beside every training run: random-baseline loss = ln(k) for k classes (with a table for k = 2, 4, 10, 100, 50,000), what perplexity means, nats vs bits, and the three loss-curve smells (loss above baseline = worse than guessing; loss exploding = confident wrongness or LR too high; train ≪ val = memorizing). Commit both — Day 72 and Day 89 will use this card verbatim.`,
      rubric: [
        'All four functions correct on hand-checked examples (fair coin H = 1 bit; uniform-4 cross-entropy = ln 4)',
        'Zero-probability inputs handled without NaN/inf via clipping, and the choice documented',
        'Asserts for the three KL properties pass',
        'loss_card.md contains the baseline table and the three loss-curve smells',
        'Committed to the practice repo',
      ],
    },
    mistakes: [
      'Mixing up bits and nats. log₂ gives bits, ln gives nats; PyTorch cross-entropy reports nats. A "loss of 2.3" on 10 classes is ln 10 — exactly random, not "pretty good".',
      'Interpreting a loss without its baseline. Always compare to ln(k) for k classes; a loss of 1.0 is great for 50,000 classes and terrible for 2.',
      'Treating KL as a distance. It is asymmetric — KL(p‖q) ≠ KL(q‖p) — and violates the triangle inequality. Say "divergence", and state the direction.',
      'Computing log(0). A model that assigns exact zero to an event that happens earns infinite loss and NaNs your training. Clip probabilities (or work in logits) — the same hard-zero problem Laplace smoothing solved on Day 59.',
      'Believing temperature changes what the model knows. It only reshapes the existing distribution — sharper or flatter; the ranking of tokens is untouched.',
      'Expecting cross-entropy to reach zero on noisy data. It bottoms out at the data\'s own entropy H(p) — irreducible uncertainty is not a modeling failure.',
    ],
    quiz: [
      {
        q: 'What is the entropy of a fair 8-sided die, and what does the number mean operationally?',
        o: [
          '8 bits — one per face',
          '3 bits — the average number of optimal yes/no questions needed to identify the outcome',
          '1 bit — it is one random event',
          '0.125 bits — the probability of each face',
        ],
        x: 1,
        w: 'H = log₂ 8 = 3 bits. Entropy is the floor on average yes/no questions (or code length) to pin down an outcome — halving the candidates with each question takes 3 steps.',
        revisit: 62,
      },
      {
        q: 'With one-hot true labels, the cross-entropy loss for one example reduces to…',
        o: [
          'the entropy of the model\'s distribution',
          '−log of the probability the model gave the correct class',
          'the number of misclassified examples',
          'the KL divergence between two model checkpoints',
        ],
        x: 1,
        w: 'The sum −Σ pᵢ log qᵢ has only one nonzero term when p is one-hot: −log q(true class) — the model\'s surprise at the truth. Confidently wrong → q near 0 → enormous loss.',
        revisit: 62,
      },
      {
        q: 'Your 10-class classifier reports loss 2.30 nats. How is it doing?',
        o: [
          'Well — loss is close to 2 which is low',
          'Exactly at the random-guessing baseline, since ln 10 ≈ 2.30 — it has learned nothing yet',
          'Badly — loss should be negative',
          'Cannot say without the accuracy',
        ],
        x: 1,
        w: 'The uniform (know-nothing) model scores ln k. For k = 10 that is 2.303 nats — this model is guessing. Always read losses against the ln(k) baseline.',
        revisit: 62,
      },
    ],
    resources: [
      { label: 'Colah — Visual Information Theory', url: 'https://colah.github.io/posts/2015-09-Visual-Information/', type: 'article', time: '30 min' },
      { label: 'Shannon (1948) — A Mathematical Theory of Communication (PDF, skim §1–6)', url: 'https://people.math.harvard.edu/~ctm/home/text/others/shannon/entropy/entropy.pdf', type: 'paper', time: '20 min' },
      { label: 'Dive into Deep Learning — information theory appendix', url: 'https://d2l.ai/', type: 'book', time: '20 min' },
      { label: 'Mathematics for Machine Learning — probability chapter', url: 'https://mml-book.github.io/', type: 'book', time: '15 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: Days 59–61 cards (log-probs, CIs, p-values)', minutes: 10 },
      { activity: 'ELI5 + tech read, walk the entropy-bits visualizer', minutes: 20 },
      { activity: 'Guided: surprise & entropy + cross-entropy loss lab', minutes: 40 },
      { activity: 'Practice: the temperature dial', minutes: 18 },
      { activity: 'Project: entropy.py + loss-reader\'s card', minutes: 22 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'Entropy computations match theory (fair coin 1 bit, 8 suspects 3 bits, vocab ~15.6 bits)',
      'Cross-entropy lab run; confident-wrong model\'s loss explosion observed and explained',
      'Temperature practice: entropies at five temperatures + sampling comparison done',
      'entropy.py with passing asserts and loss_card.md committed; quiz ≥ 2/3',
    ],
    connections: {
      back: 'The −log p at the center of everything is Day 59\'s log-probability trick wearing a crown, and "average over the distribution" is Day 58\'s expectation. The 1-in-1024 = 10 bits arithmetic is Day 33\'s halving instinct.',
      forward: 'Day 72 meets cross-entropy as logistic regression\'s log-loss; Days 86–89 minimize it with backprop; Day 99 watches your tiny GPT\'s cross-entropy fall from ln(vocab) as it learns to spell; Day 102 turns the temperature dial on a real model.',
    },
    flashcards: [
      { f: 'Information content of an event?', b: '−log p. Base 2 → bits, base e → nats. Rare = surprising = expensive.' },
      { f: 'Entropy H(p)?', b: '−Σ p log p: average surprise of a source. Max = log k at uniform; 0 when certain.' },
      { f: 'Cross-entropy with a one-hot label?', b: '−log q(correct class): the model\'s surprise at the truth. THE classification/LLM loss.' },
      { f: 'KL(p‖q) in one line?', b: 'H(p,q) − H(p): extra surprise from forecasting q when truth is p. ≥ 0, zero iff p=q, asymmetric.' },
      { f: 'Random-baseline loss for k classes?', b: 'ln k nats (log₂ k bits). Loss 2.3 on 10 classes = pure guessing.' },
      { f: 'Perplexity?', b: 'exp(cross-entropy in nats): effective number of equally likely choices the model hedges across.' },
    ],
    deepDive: [
      { label: 'Why minimizing cross-entropy = maximum likelihood', note: 'The average −log q(data) is exactly the negative log-likelihood; minimizing one minimizes the other. This single identity connects information theory, statistics, and every training run you will launch.' },
    ],
  },
  {
    id: 'd063', day: 63, week: 9, phase: 3, kind: 'review',
    title: 'Week 9 Checkpoint: Math Assessment',
    analogy: 'The toolkit inspection',
    objectives: [
      'Reproduce the week\'s core formulas (Bayes, standard error, CI, entropy, cross-entropy) from memory',
      'Score ≥ 16/20 on the cumulative math assessment and map every miss to a revisit day',
      'Run a complete model-A-vs-model-B analysis: bootstrap CIs, permutation test, honest verdict',
      'Diagnose flawed statistical claims and name the specific error in each',
    ],
    prereqs: [
      { day: 57, label: 'Probability & Monte Carlo' },
      { day: 60, label: 'Sampling, CIs & bootstrap' },
      { day: 61, label: 'Hypothesis tests & power' },
      { day: 62, label: 'Entropy & cross-entropy' },
    ],
    eli5: `A mechanic doesn't inspect a toolkit by reading the labels on the drawers — they pull each tool out and use it on something. Today is inspection day for the sharpest week of math in the program. No new tools; instead you close the notes and find out which handles your hand actually reaches for and which drawers are secretly empty.

The science here is boring and bulletproof: retrieving something from memory strengthens it far more than re-reading it, struggling before checking beats checking first, and finding a gap today — while the material is a week old — is cheap, whereas finding it on Day 139 in front of a real eval report is expensive. So the day has three movements: write the formulas cold and diff against your notes; take a 20-question assessment that mixes all six days so your brain has to pick the right tool, not just reuse the one from the current chapter; then do the job this week was training you for all along — look at two models' eval scores and decide, with error bars and a test, whether A actually beats B. That decision is the single most repeated statistical act of an AI engineer's career.`,
    why: `Week 9 is the statistical spine of everything downstream: Day 75's metrics, Day 102's sampling, Day 139's eval statistics, Day 140's capstone eval report. The interleaved assessment matters because real problems never announce their chapter — "is this retrieval change better?" doesn't tell you it wants a paired test with CIs. And the A-vs-B mini-lab is a dress rehearsal for the exact deliverable Day 140 grades: a quality claim with error bars that survives a skeptical reviewer.`,
    tech: `### What to drill, and why in this order

**Recall before recognition.** The formula sheet drill (write from memory, then diff) targets the six load-bearing items: P(A|B) = P(A∩B)/P(B); Bayes with the normalizer; binomial mean/variance np, np(1−p); se = sd/√n and the pass-rate CI p̂ ± 1.96·√(p̂(1−p̂)/n); the permutation-test recipe; H(p), H(p,q), KL = H(p,q) − H(p), and the ln(k) baseline. Diffing your sheet against the real one converts each slip into a flashcard.

**Interleaving.** The 20-question assessment deliberately shuffles topics because the retrieval cue "which tool fits?" is most of the difficulty in practice. Score it honestly and write a revisit day next to every miss — Days 57–62 each own specific questions.

### The A-vs-B mini-lab, structured

You get case-level results for two models on the same 60-question eval (simulated with seeds, so everyone's numbers agree). The analysis you must produce is the canonical one: (1) point estimates for each pass rate; (2) 95% bootstrap CIs for each (import YOUR Day 60 bootstrap.py); (3) a permutation test on the difference (Day 61's ab_test.py); (4) — the step most people skip — a PAIRED look: since both models answered the same questions, count the disagreements (A-right/B-wrong vs A-wrong/B-right) and notice how much sharper the comparison gets; (5) a three-sentence verdict a stakeholder could act on, stating effect size, uncertainty, and what data would settle it.

The grading standard for the verdict is the one you will be held to professionally: no claim without an interval, no "significant" without the test named, and no certainty the data cannot support.`,
    viz: null,
    guided: [
      {
        title: 'The closed-book formula sheet',
        minutes: 18,
        body: `1. Close every note and editor. On paper or a blank file, write from memory: conditional probability, Bayes\' rule (with the normalizer spelled out), binomial mean and variance, standard error of a mean, the 95% CI for a pass rate, the permutation-test recipe (as 3 numbered steps), entropy, cross-entropy, KL as a difference, and the random-baseline loss for k classes.
2. Now open your notes and diff line by line. Mark each item green (exact), yellow (right shape, wrong detail), or red (blank/wrong).
3. For every yellow and red: write a fresh flashcard in your own words, and say OUT LOUD one sentence about where the formula earns money (e.g. "pass-rate CI → every eval report").
4. Re-write the reds from memory once more before moving on — the second retrieval is where the repair happens.`,
      },
      {
        title: 'The 20-question assessment',
        minutes: 37,
        body: `1. Take the assessment in one sitting, closed-book, ~90 seconds per question. Pull 20 questions from the week\'s quiz banks and flashcard decks — 3–4 per day from Days 57–62 — or have your AI tutor generate them from the day titles, mixed in random order.
2. Coverage checklist (verify before starting): conditional probability & the complement trick (D57), binomial noise & CLT & heavy tails (D58), Bayes & base rates (D59), CIs & bootstrap & coverage (D60), p-values & power & peeking (D61), entropy & cross-entropy & perplexity (D62).
3. Grade honestly. 16+/20: proceed. 12–15: fine — this is exactly what today is for. Below 12: schedule tomorrow\'s first 30 minutes for the two weakest days before starting Week 10.
4. For every miss, write the day number to revisit and ONE sentence on why the wrong answer tempted you — the temptation is the misconception, and naming it is the cure.
5. Update your error log (the Day 28 artifact): statistical misconceptions belong in it just like algorithm bugs.`,
      },
    ],
    practice: [
      {
        title: 'The flawed-claims clinic',
        minutes: 15,
        body: `Five claims cross your desk. For each, name the specific error and write the one-sentence correction:

1. "Our fraud model is 99% accurate, so 99% of its alerts are real fraud." (base rate: 0.2%)
2. "Model B scored 35/40 vs A\'s 33/40 — B is better, shipping it."
3. "p = 0.20, so there\'s an 80% chance our change worked."
4. "Mean latency is 80 ms, well under our 100 ms target — we\'re fine."
5. "Loss hit 2.3 on our 10-class classifier — great progress from 4.1!"

Hints: the errors are, in some order — confusing P(E|H) with P(H|E); ignoring binomial noise on a small n; misreading a p-value as a posterior; using a mean on a heavy-tailed quantity; missing the ln(k) baseline. Match them, then check against Days 58–62.`,
      },
    ],
    project: {
      title: 'Mini-lab: does model A beat model B?',
      brief: `Run the week\'s capstone decision. The starter recipe: with \`rng = np.random.default_rng(seed=63)\`, simulate 60 shared eval questions with per-question difficulty \`d = rng.uniform(0.05, 0.6, size=60)\`, then case-level results \`a = rng.random(60) > d\` and \`b = rng.random(60) > d * 0.82\` (B is genuinely a bit better). Produce \`ab_verdict.md\`: pass rates with 95% bootstrap CIs (import your Day 60 \`bootstrap.py\`), a permutation test on the gap (your Day 61 \`ab_test.py\`), a paired disagreement table (A-only-right vs B-only-right counts), and a three-sentence stakeholder verdict naming effect size, uncertainty, and what evidence would settle the question. Commit it — Day 140\'s eval report is this document at production scale.`,
      rubric: [
        'Both pass rates reported with bootstrap 95% CIs (imported from your own bootstrap.py)',
        'Permutation test run with n_perm ≥ 10,000; p-value reported next to the effect size, never alone',
        'Paired disagreement counts computed and discussed (the sharper lens)',
        'Verdict makes no claim the intervals cannot support and names the data that would settle it',
        'Fully reproducible from seeds — a second run gives identical numbers',
        'Committed to the practice repo',
      ],
    },
    mistakes: [
      'Re-reading notes instead of retrieving. Recognition feels like knowledge; only closed-book recall reveals (and repairs) the gaps.',
      'Taking the assessment open-book "just to check". You are measuring retrieval strength; an open book measures your ability to read.',
      'Skipping the miss-to-revisit-day mapping. An ungraded mistake is a mistake scheduled to repeat on Day 139.',
      'Running the A/B mini-lab unseeded, getting different numbers each run, and shrugging. Reproducibility is part of the deliverable.',
      'Comparing A and B only as independent samples when they answered the SAME questions — the paired view uses the shared difficulty and is much sharper.',
      'Writing a verdict with certainty the data cannot support. "B is better, p = 0.04, effect +7 points (CI 1–13)" is honest; "B wins" is not.',
    ],
    quiz: [
      {
        q: 'A screening test is 95% sensitive with a 2% false-positive rate; the condition affects 1 in 500 people. A person tests positive. Roughly how likely do they have the condition?',
        o: ['95%', '~50%', '~9%', '~2%'],
        x: 2,
        w: 'Per 100,000 people: 200 have it, ~190 test positive; ~1,996 healthy people also test positive. 190/2,186 ≈ 9%. If this surprised you, revisit Day 59\'s natural-frequency method.',
        revisit: 59,
      },
      {
        q: 'Which change narrows a confidence interval on an eval pass rate?',
        o: [
          'Raising bootstrap resamples from 10³ to 10⁶',
          'Quadrupling the number of eval cases (halves the width)',
          'Rerunning the same 40 cases with a new seed',
          'Reporting 90% confidence but calling it 95%',
        ],
        x: 1,
        w: 'Width scales with 1/√n of REAL data: 4× the cases → half the interval. Bootstrap iterations only stabilize the endpoints (Day 60), and reruns of the same cases add no new information.',
        revisit: 60,
      },
      {
        q: 'Your language model\'s cross-entropy loss is 10.82 nats on a 50,000-token vocabulary. What has it learned so far?',
        o: [
          'A lot — 10.82 is a big number',
          'Essentially nothing: ln(50,000) ≈ 10.82, the uniform-guessing baseline',
          'It is overfitting',
          'Impossible to say without accuracy',
        ],
        x: 1,
        w: 'The know-nothing baseline is ln(k). At 10.82 nats (perplexity 50,000) the model is a uniform die over the vocabulary. Day 99 starts from exactly this number and watches it fall.',
        revisit: 62,
      },
    ],
    resources: [
      { label: 'Seeing Theory — full site (review the four chapters you used this week)', url: 'https://seeing-theory.brown.edu/', type: 'course', time: '25 min' },
      { label: 'Khan Academy — Statistics & Probability (unit quizzes for weak spots)', url: 'https://www.khanacademy.org/math/statistics-probability', type: 'course', time: '25 min' },
      { label: 'Harvard Stat 110 — strategic practice problems', url: 'https://stat110.hsites.harvard.edu/home', type: 'course', time: '30 min' },
      { label: 'Mathematics for Machine Learning — probability chapter (reference)', url: 'https://mml-book.github.io/', type: 'book', time: '20 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: the full Week 9 due deck', minutes: 10 },
      { activity: 'Guided: closed-book formula sheet drill', minutes: 18 },
      { activity: 'Guided: 20-question cumulative assessment + grading', minutes: 37 },
      { activity: 'Practice: flawed-claims clinic', minutes: 15 },
      { activity: 'Project: model A vs model B mini-lab + verdict', minutes: 30 },
      { activity: 'Quiz + map misses to revisit days', minutes: 10 },
    ],
    completion: [
      'Formula sheet written from memory; reds re-drilled and turned into flashcards',
      'Assessment scored ≥ 16/20, or a targeted revisit plan written for the weak days',
      'All five flawed claims corrected with the specific error named',
      'ab_verdict.md committed with CIs, permutation test, paired table, and an honest verdict',
    ],
    connections: {
      back: 'Every tool today came from this week: Monte Carlo (Day 57), binomial noise (Day 58), Bayes (Day 59), bootstrap CIs (Day 60), permutation tests (Day 61), and the ln(k) baseline (Day 62). The mini-lab imports your own Day 60 and 61 code.',
      forward: 'Week 10 starts tomorrow with NumPy in anger — the same arrays, pointed at data instead of dice. The A-vs-B verdict you wrote today reappears at production scale on Day 139 (eval statistics) and Day 140 (the capstone eval report with CIs).',
    },
    flashcards: [
      { f: 'The paired trick for comparing two models on the same eval set?', b: 'Count disagreements: A-only-right vs B-only-right. Shared question difficulty cancels — sharper than independent CIs.' },
      { f: 'The three parts of an honest quality claim?', b: 'Effect size, uncertainty interval, and the test/method by name. Never a bare "B is better".' },
      { f: 'Why closed-book recall over re-reading?', b: 'Retrieval strengthens memory; recognition only feels like it does. Struggle first, check second.' },
      { f: 'Cheap place to find a knowledge gap vs expensive?', b: 'Today\'s assessment (cheap) vs Day 139\'s real eval report or an interview (expensive).' },
      { f: 'First three steps of an A/B readout?', b: 'Point estimates → CIs on each and on the gap → significance test. Then the verdict.' },
    ],
    deepDive: [
      { label: 'McNemar\'s test — the formal version of the paired disagreement table', note: 'The disagreement-count comparison you did has a name and an exact test. Day 139 uses this family for paired eval comparisons; reading it now makes that day trivial.' },
    ],
  },
  {
    id: 'd064', day: 64, week: 10, phase: 4, kind: 'lesson',
    title: 'NumPy in Anger',
    analogy: 'Power tools for numbers',
    objectives: [
      'Explain what an ndarray is (buffer + dtype + shape) and why that makes it fast',
      'Replace Python loops with vectorized operations and measure the speedup',
      'Apply the broadcasting rules to predict result shapes before running the code',
      'Use boolean masks, fancy indexing, and axis-aware aggregations fluently',
      'State the view-vs-copy rules and avoid the mutation bugs they cause',
    ],
    prereqs: [
      { day: 50, label: 'Vectors & NumPy basics' },
      { day: 51, label: 'Matrices & matmul' },
      { day: 57, label: 'Random generators & boolean masks' },
    ],
    eli5: `You have been cutting boards one at a time with a hand saw: a Python loop picks up each number, works on it, puts it down. NumPy is the table saw: you stack a thousand boards, push the whole stack through, done. The speed is real — often 100× — because the saw blade is compiled C running over a solid block of memory, instead of Python picking up and unwrapping each number individually.

But power tools have two safety rules. First, the guide fence — broadcasting: when two stacks of different sizes meet, NumPy lines them up from the right edge and stretches any side of size one to match. Learn the two-line rule and shapes stop being guesswork. Second, and this one bites everyone exactly once: when you slice an array, you usually get a window onto the SAME wood, not a fresh copy. Sand the piece in your hand and you discover you have sanded the original. Knowing when you hold a view and when you hold a copy is the difference between a power user and a person with mysterious data corruption. Today you use the machine in anger — timed, on real-sized data — because Week 10 is data craft and every tool this week stands on this one.`,
    why: `pandas columns ARE NumPy arrays; PyTorch tensors (Day 87) copy NumPy's API almost verbatim, broadcasting rules included. A data pipeline written with Python loops is the classic "worked in the demo, died on the customer's 10-million-row file" story — Day 22's complexity lesson, but the constant factor is 100×. And shape fluency is the daily language of ML debugging: half of all deep-learning bugs are shape bugs, and the engineers who read (1000, 3) − (3,) at a glance fix them in seconds.`,
    tech: `An **ndarray** is one contiguous memory buffer plus metadata: a **dtype** (every element the same fixed-size type), a **shape**, and strides. That layout is why vectorized operations fly — the loop happens in C over packed memory — and why NumPy arrays are typed: \`int8\` overflows past 127, \`uint8\` wraps 255+1 to 0 (image code bites people here), and \`float32\` halves memory versus \`float64\` at the cost of ~7 significant digits.

### Broadcasting: the two-line rule

Align shapes from the RIGHT. Two dimensions are compatible if they are equal or either is 1 (a size-1 dimension is stretched, virtually, without copying; missing left dimensions are treated as 1). So (1000, 3) − (3,) subtracts a row vector from every row. The classic trap: (n,) + (n,1) broadcasts to (n, n) — a silent 10⁶-element surprise from two length-1000 vectors. Insert explicit axes with \`a[:, None]\` (column) or \`a[None, :]\` (row) so shapes say what you mean.

### Masks, indexing, and axes

A comparison on an array yields a boolean array; use it to filter (\`x[x > 0]\`), count (\`mask.sum()\`), estimate probabilities (\`mask.mean()\` — Day 57), or assign (\`x[mask] = 0\`). **Fancy indexing** with an integer array reorders or gathers (\`x[idx]\`) — it always returns a copy. Aggregations take an \`axis\`: the axis you pass is the one that DISAPPEARS — \`a.mean(axis=0)\` on (1000, 3) collapses the 1000 rows into per-column means of shape (3,).

### Views vs copies

Basic slicing (\`a[10:20]\`, \`a[:, 0]\`) returns a **view** — same buffer, so writes propagate to the original. Fancy indexing and boolean indexing return **copies**. When you need an independent slice, say so: \`a[10:20].copy()\`. This single rule explains most "my data changed behind my back" bugs — and its mirror image, "I assigned into a copy and nothing happened."`,
    viz: null,
    guided: [
      {
        title: 'Time the loop out of your code',
        minutes: 18,
        body: `1. Paste the starter. It computes the same two results — sum of squares, then standardization (subtract mean, divide by sd) — on a million floats, once with Python loops and once vectorized.
2. Run it and record the two speedups. Expect roughly 50–200× depending on the machine. Say out loud WHY: the loop version unboxes a Python object per element; the vectorized version is one C loop over a packed buffer.
3. Add a third comparison of your own: count how many values exceed 2.0 (loop with a counter vs \`(x > 2).sum()\`).
4. Now the dtype experiment: rebuild the data as \`float32\` and re-time. Then make an \`int8\` array of 200 and add 100 to it — observe the overflow wraparound. Write the rule: dtype is a contract, and arithmetic near the edges of the contract lies silently.
5. Check memory: \`x.nbytes\` for the float64 vs float32 versions. Halving memory matters when Day 66 loads real datasets.`,
        code: `import time
import numpy as np

rng = np.random.default_rng(seed=64)
x = rng.normal(0, 1, size=1_000_000)

t0 = time.perf_counter()
total = 0.0
for v in x:
    total += v * v
t_loop = time.perf_counter() - t0

t0 = time.perf_counter()
total_vec = float((x * x).sum())
t_vec = time.perf_counter() - t0
print(f"sum of squares: loop {t_loop*1000:8.1f} ms  vec {t_vec*1000:6.2f} ms  "
      f"speedup {t_loop/t_vec:6.0f}x")

t0 = time.perf_counter()
mean = sum(x) / len(x)
sd = (sum((v - mean) ** 2 for v in x) / len(x)) ** 0.5
z_loop = [(v - mean) / sd for v in x]
t_loop = time.perf_counter() - t0

t0 = time.perf_counter()
z_vec = (x - x.mean()) / x.std()
t_vec = time.perf_counter() - t0
print(f"standardize   : loop {t_loop*1000:8.1f} ms  vec {t_vec*1000:6.2f} ms  "
      f"speedup {t_loop/t_vec:6.0f}x")

small = np.array([120, 125, 127], dtype=np.int8)
print("int8 overflow:", small + np.int8(100))   # wraps around, no error`,
      },
      {
        title: 'Broadcasting and axes — predict, then run',
        minutes: 20,
        body: `1. The starter creates \`data\` with shape (1000, 3): a thousand rows of [duration_ms, tokens, cost]. For each expression below, WRITE the result shape on paper first, then run and check:
   a. \`data - data.mean(axis=0)\` (center each column)
   b. \`data / data.max(axis=0)\` (scale each column to ≤ 1)
   c. \`data.mean(axis=1)\` (row means — shape (1000,))
   d. \`col = data[:, 0]; col[:, None] * np.ones(3)\` (what shape? why?)
2. The trap, on purpose: \`v = np.arange(4); w = v[:, None]; print((v + w).shape)\` — a (4,) plus a (4,1) makes (4,4). Write one sentence on when this trap fires in real code (adding a "column" that is actually 1-D to a row vector).
3. Center the columns using an explicit \`[None, :]\` instead of relying on automatic alignment, and confirm it is identical.
4. The axis mantra: the axis you pass is the one that disappears. Verify on \`data.sum(axis=0)\` → (3,) and \`data.sum(axis=1)\` → (1000,).
5. Finish with the view/copy drill: \`window = data[:10]\`, set \`window[:] = -1\`, and check \`data[:3]\`. Then redo with \`.copy()\` and confirm the original survives.`,
        code: `import numpy as np

rng = np.random.default_rng(seed=640)
data = np.column_stack([
    rng.lognormal(5, 0.6, 1000),      # duration_ms
    rng.integers(50, 2000, 1000),     # tokens
    rng.uniform(0.001, 0.05, 1000),   # cost
])
print("data shape:", data.shape)

centered = data - data.mean(axis=0)        # (1000,3) - (3,) -> (1000,3)
scaled = data / data.max(axis=0)
row_means = data.mean(axis=1)              # (1000,)
print(centered.shape, scaled.shape, row_means.shape)

v = np.arange(4)
w = v[:, None]
print("the trap: (4,) + (4,1) ->", (v + w).shape)

window = data[:10]        # a VIEW
window[:] = -1
print("original mutated?", data[0, 0] == -1)   # True!`,
      },
    ],
    practice: [
      {
        title: 'The image is just an array',
        minutes: 18,
        body: `Build a synthetic 128×128 grayscale "image" without any files: \`img = np.clip(xx*0.5 + yy*0.5 + rng.normal(0, 0.05, (128,128)), 0, 1)\` where \`xx, yy = np.meshgrid(np.linspace(0,1,128), np.linspace(0,1,128))\` — a noisy diagonal gradient, values in [0, 1].

Your goals, all loop-free: (1) brighten by 0.3 WITH clipping to [0, 1] and explain what unclipped uint8 arithmetic would have done instead; (2) increase contrast: (img − 0.5) · 1.8 + 0.5, clipped; (3) invert it; (4) extract the center 64×64 crop with slicing and state whether it is a view or a copy; (5) apply a checkerboard mask (built from index parity via meshgrid or \`np.indices\`) that zeroes alternating 8×8 blocks; (6) report mean brightness per row for the top 5 rows (one axis-aware call).

Hints: (row // 8 + col // 8) % 2 gives the checkerboard at block scale; a slice is always a view — mutate the crop and check the original. Print img.min(), img.max() after every step; leaving [0,1] silently is how image bugs are born.`,
      },
    ],
    project: {
      title: 'numpy_drills.py — eight one-liners you will reuse all program',
      brief: `Create \`numpy_drills.py\` in your practice repo: eight functions, each essentially one vectorized expression, each with an assert proving it on a tiny hand-checked example: (1) \`standardize(X)\` per column; (2) \`minmax(X)\` per column; (3) \`pairwise_dist(A, B)\` via broadcasting (\`A[:, None, :] − B[None, :, :]\`, then norm over the last axis); (4) \`one_hot(labels, k)\`; (5) \`moving_avg(x, w)\` via cumsum; (6) \`clip_outliers(x, k)\` replacing values beyond k standard deviations with the boundary; (7) \`softmax(Z)\` row-wise, stable (subtract row max — Day 62\'s exp in disguise); (8) \`accuracy(pred, y)\`. No Python loops anywhere. Commit it: Day 69\'s features, Day 85\'s forward pass, and Day 92\'s nearest-neighbor search all reuse these exact moves.`,
      rubric: [
        'All eight functions loop-free and passing their asserts',
        'pairwise_dist matches a hand-computed 2×2 example (the broadcasting showpiece)',
        'softmax is numerically stable (works on logits like [1000, 1001] without overflow)',
        'Each function has a one-line docstring naming its broadcasting/axis trick',
        'Committed to the practice repo with a descriptive message',
      ],
    },
    mistakes: [
      'Mutating a slice and corrupting the original. Basic slices are views; call .copy() when you need independence, and know that boolean/fancy indexing already return copies.',
      'The (n,) vs (n,1) confusion. Adding them broadcasts to (n, n); a "vector" and a "column" are different shapes. Use [:, None] to be explicit.',
      'Reading axis=0 as "along the rows, per row". The passed axis is the one that COLLAPSES: axis=0 on (1000, 3) gives 3 column-aggregates.',
      'Writing Python loops over arrays out of habit. If you typed "for" over an ndarray, stop and look for the vectorized form — it exists ~95% of the time.',
      'Ignoring dtype until it bites: int8/uint8 overflow wraps silently, float32 loses precision in big sums, and integer division truncates.',
      'Assigning into the result of fancy indexing and expecting the original to change: x[idx][0] = 5 writes into a temporary copy and is silently lost.',
    ],
    quiz: [
      {
        q: 'a has shape (4,) and b has shape (4, 1). What is (a + b).shape?',
        o: ['(4,)', '(4, 1)', '(4, 4) — a broadcasts as a row against b\'s column', 'Error — shapes don\'t match'],
        x: 2,
        w: 'Aligned from the right: (4,) becomes (1, 4); against (4, 1) both dimensions stretch to give (4, 4). The most common silent shape bug in numeric code.',
        revisit: 64,
      },
      {
        q: 'For data of shape (1000, 3), what does data.mean(axis=0) return?',
        o: [
          'Shape (1000,) — one mean per row',
          'Shape (3,) — one mean per column; axis 0 is the dimension that disappears',
          'A single scalar',
          'Shape (1000, 3) — element-wise means',
        ],
        x: 1,
        w: 'The axis you pass is the one that collapses. axis=0 aggregates over the 1000 rows, leaving one value per column: shape (3,).',
        revisit: 64,
      },
      {
        q: 'b = a[10:20]; b[:] = 0. What happened to a?',
        o: [
          'Nothing — b is an independent copy',
          'Elements 10–19 of a are now 0, because basic slices are views into the same buffer',
          'a is entirely zeroed',
          'NumPy raises an error on writing to a slice',
        ],
        x: 1,
        w: 'Basic slicing returns a view sharing memory with the original; writes propagate. Use a[10:20].copy() for an independent piece.',
        revisit: 64,
      },
    ],
    resources: [
      { label: 'NumPy — the absolute basics for beginners', url: 'https://numpy.org/doc/stable/user/absolute_beginners.html', type: 'docs', time: '25 min' },
      { label: 'NumPy — Broadcasting (official guide with figures)', url: 'https://numpy.org/doc/stable/user/basics.broadcasting.html', type: 'docs', time: '20 min' },
      { label: 'NumPy — Random sampling (Generator API)', url: 'https://numpy.org/doc/stable/reference/random/index.html', type: 'docs', time: '10 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: Week 9 due cards + Day 63 misses', minutes: 10 },
      { activity: 'ELI5 + tech read: buffers, broadcasting, views', minutes: 20 },
      { activity: 'Guided: timing lab + broadcasting/axis drills', minutes: 38 },
      { activity: 'Practice: the image is just an array', minutes: 18 },
      { activity: 'Project: numpy_drills.py', minutes: 24 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'Timing lab run: both speedups recorded and the overflow demo observed',
      'All broadcasting shapes predicted correctly before running (or misses noted and re-derived)',
      'Image practice done loop-free with values verified in [0, 1] after each step',
      'numpy_drills.py committed with all asserts passing; quiz ≥ 2/3',
    ],
    connections: {
      back: 'Day 50 introduced these arrays gently; Day 57 used masks for probability; Day 22 explained why the loop dies at scale — today you measured the constant factor. The stable softmax is Day 62\'s cross-entropy machinery.',
      forward: 'Tomorrow pandas wraps these arrays in labels — every fast pandas operation is a NumPy operation underneath. Day 85\'s forward pass is matmul + broadcasting; Day 87\'s PyTorch tensors follow these exact rules on a GPU.',
    },
    flashcards: [
      { f: 'Broadcasting rule in one line?', b: 'Align shapes from the right; dimensions must be equal or 1; size-1 stretches without copying.' },
      { f: '(n,) + (n,1) gives what shape?', b: '(n, n) — the classic silent trap. Use [:, None] to make columns explicit.' },
      { f: 'Which axis disappears in a.sum(axis=k)?', b: 'Axis k — the one you pass is the one aggregated away.' },
      { f: 'View or copy: basic slice? boolean mask? fancy index?', b: 'Slice → view (shared memory). Boolean and fancy indexing → copies.' },
      { f: 'Why is vectorized code ~100× faster than a Python loop?', b: 'One compiled C loop over a packed typed buffer vs per-element Python object overhead.' },
      { f: 'Stable softmax trick?', b: 'Subtract the row max from logits before exp — same result, no overflow.' },
    ],
    deepDive: [
      { label: 'Strides — how NumPy walks memory', note: 'Shape × strides explains why transposes are free, why some views are possible and others are not, and what "contiguous" means in PyTorch error messages later. A 15-minute read that demystifies a dozen future errors.' },
    ],
  },
  {
    id: 'd065', day: 65, week: 10, phase: 4, kind: 'lesson',
    title: 'pandas I — DataFrames',
    analogy: 'The spreadsheet that scripts',
    objectives: [
      'Explain what a DataFrame is (labeled columns over NumPy arrays sharing an index)',
      'Select data correctly with [], loc, iloc, and boolean masks — and say which is which',
      'Add derived columns with assign and build readable method chains',
      'Control dtypes on load, use categoricals, and measure memory savings',
      'Avoid the chained-indexing trap when writing values',
    ],
    prereqs: [
      { day: 64, label: 'NumPy arrays, masks & dtypes' },
      { day: 36, label: 'SQL — tables, rows & columns' },
    ],
    eli5: `A spreadsheet is wonderful until you have to do the same thing twice. You cleaned March's data by hand — forty clicks — and now April's file arrives. A DataFrame is a spreadsheet where every action is a line of code instead of a click: filter, sort, add a column, summarize. Run the script again on April's file and the forty clicks replay themselves in a millisecond. And because the steps are written down, a teammate can review them, and future-you can figure out what past-you actually did — the spreadsheet that scripts, and remembers.

Under the hood there is no magic: each column is one of yesterday's NumPy arrays, and a shared index — row labels — keeps the columns glued together. That one design fact explains most of pandas: why columns are fast and typed, why filtering is a boolean mask like Day 64's, and why there are TWO ways to point at rows — by label (loc, like "the row named 42") and by position (iloc, like "the 42nd row") — which become different questions the moment sorting or filtering shuffles the rows.`,
    why: `Something like 80% of applied ML is data plumbing, and pandas is the pipe wrench. Every eval log you will analyze (Day 137), every cost report (Day 146), and every customer CSV an FDE receives arrives as a table; the person who can answer "which category of tickets breaches SLA most?" in ninety seconds of chained pandas is the person the room listens to. This week builds to Day 70's EDA report and Day 83's churn project — both are pandas from the first line.`,
    tech: `A **Series** is a 1-D NumPy array plus an index (labels); a **DataFrame** is a dict of Series sharing one index. Column access \`df["col"]\` returns a Series; a list \`df[["a", "b"]]\` returns a DataFrame.

### The three selection tools

- **\`df.loc[rows, cols]\`** — by LABEL. Slices are INCLUSIVE on both ends (\`df.loc[2:5]\` can be 4 rows). Also takes boolean masks: \`df.loc[df.latency > 500, "category"]\`.
- **\`df.iloc[rows, cols]\`** — by POSITION, Python-style half-open slices (\`df.iloc[2:5]\` is 3 rows).
- **Boolean filtering** — \`df[df.priority == "urgent"]\` keeps rows where the mask is True; combine masks with \`&\`, \`|\`, \`~\` and parenthesize each condition (\`&\` binds tighter than \`==\`).

After filtering or sorting, positions and labels diverge — that is not a bug, it is the reason both tools exist. \`reset_index(drop=True)\` re-aligns them when you want a fresh start.

### Writing values: the one trap

\`df[df.x > 0]["y"] = 1\` — chained indexing — may write into a temporary copy and silently do nothing (pandas warns; under copy-on-write semantics it never sticks). The correct form is one indexer: \`df.loc[df.x > 0, "y"] = 1\`. Better still, prefer building new columns over mutating: \`df = df.assign(sla_breached=df.latency > 500)\` keeps pipelines functional and chainable.

### Dtypes, memory, and chaining style

\`df.info()\` and \`df.memory_usage(deep=True)\` are your first commands on any load. Strings default to \`object\` (a Python object per cell — slow, fat); a low-cardinality string column converted to \`category\` stores each label once plus small integer codes, often cutting memory 10–20×. Load with explicit \`dtype=\` and \`parse_dates=\` rather than fixing types after. For flow, wrap chains in parentheses — filter, assign, sort, head — one operation per line: readable, reviewable, and re-runnable, which is the entire point.`,
    viz: null,
    guided: [
      {
        title: 'Build and interrogate your first DataFrame',
        minutes: 20,
        body: `1. Paste the starter — it generates a seeded 500-row support-ticket table (no files needed; every run is identical).
2. Run the opening ritual you will use on every dataset forever: \`df.head()\`, \`df.shape\`, \`df.info()\`, \`df.describe()\`, and \`df["category"].value_counts()\`.
3. Read \`df.info()\` closely: which columns are int64/float64, which are object? Note the memory estimate.
4. Convert \`category\` and \`priority\` to the \`category\` dtype and compare \`memory_usage(deep=True).sum()\` before and after. Record the ratio.
5. Sanity-check the data like an engineer: any negative response times? \`(df.response_min < 0).sum()\`. CSAT within 1–5? min/max. This 30-second habit catches half of all data bugs at the door.
6. Answer your first question: what fraction of tickets are urgent? (value_counts with normalize=True).`,
        code: `import numpy as np
import pandas as pd

rng = np.random.default_rng(seed=65)
N = 500
df = pd.DataFrame({
    "ticket_id": np.arange(1000, 1000 + N),
    "category": rng.choice(["billing", "bug", "how-to", "outage"],
                           size=N, p=[0.3, 0.35, 0.25, 0.1]),
    "priority": rng.choice(["low", "normal", "urgent"],
                           size=N, p=[0.3, 0.55, 0.15]),
    "response_min": np.round(rng.lognormal(3.2, 0.9, size=N), 1),
    "csat": rng.integers(1, 6, size=N),
    "agent_id": rng.integers(1, 9, size=N),
})

print(df.head())
print(df.shape)
df.info()
print(df.describe())
print(df["category"].value_counts())

before = df.memory_usage(deep=True).sum()
df["category"] = df["category"].astype("category")
df["priority"] = df["priority"].astype("category")
after = df.memory_usage(deep=True).sum()
print(f"memory: {before:,} -> {after:,} bytes")`,
      },
      {
        title: 'Selection without superstition',
        minutes: 20,
        body: `1. Loc vs iloc, felt directly: sort by \`response_min\` descending into \`slow = df.sort_values("response_min", ascending=False)\`. Compare \`slow.iloc[0]\` (slowest ticket) with \`slow.loc[0]\` (the ticket whose LABEL is 0 — a totally different row). Write one sentence on why both behaviors are correct.
2. Boolean drills — predict row counts before running: (a) urgent tickets; (b) urgent AND response over 120 min (remember the parentheses around each condition); (c) billing OR outage via \`.isin(["billing", "outage"])\`; (d) NOT csat 5 via \`~\`.
3. The trap, on purpose: run \`df[df.priority == "urgent"]["escalated"] = True\` and then check whether an \`escalated\` column exists — chained indexing did nothing (watch for the warning). Now do it right with a single \`.loc[mask, "escalated"] = True\` and verify.
4. Build a chained pipeline in parentheses: assign an \`sla_breached\` column (response over 60 min), filter to breaches, sort by response descending, take the 10 worst, select three display columns. One statement, one operation per line.
5. Re-run the whole script top to bottom and confirm identical output — reproducibility is the product.`,
        code: `import numpy as np
import pandas as pd
# (continue from the same df as exercise 1)

slow = df.sort_values("response_min", ascending=False)
print(slow.iloc[0][["ticket_id", "response_min"]])   # slowest ticket
print(slow.loc[0][["ticket_id", "response_min"]])    # row LABELED 0 — different!

urgent_slow = df[(df.priority == "urgent") & (df.response_min > 120)]
print("urgent & slow:", len(urgent_slow))

worst = (
    df
    .assign(sla_breached=df.response_min > 60)
    .loc[lambda d: d.sla_breached]
    .sort_values("response_min", ascending=False)
    .head(10)
    [["ticket_id", "category", "response_min"]]
)
print(worst)`,
      },
    ],
    practice: [
      {
        title: 'Five stakeholder questions, five chains',
        minutes: 20,
        body: `Using the seeded ticket DataFrame, answer each question with ONE parenthesized chain (no intermediate variables, no groupby — that is tomorrow):

1. What share of tickets falls in each priority level? (value_counts with normalize)
2. What is the median response time for urgent tickets vs non-urgent? (two masked medians, one line each)
3. Which categories do the 20 slowest tickets come from? (sort, head, value_counts)
4. What fraction of SLA breaches (response over 60) got a CSAT of 1 or 2? (mask, then mean of a condition — Day 57\'s trick on a Series)
5. Which agent handled the most urgent tickets?

Then write each answer as a sentence with the number in it — "38% of breached tickets scored CSAT ≤ 2" — because a number without a sentence is not yet a finding.

Hints: \`.value_counts(normalize=True)\`; boolean masks compose with \`&\`; \`(series <= 2).mean()\` turns a condition into a rate. Keep this file — Day 67 upgrades these questions into a full EDA.`,
      },
    ],
    project: {
      title: 'ticket_report.py — load, type, verify, report',
      brief: `Build the round-trip you will perform on every real dataset. \`ticket_report.py\` should: (1) generate the seeded ticket data and write it to \`tickets.csv\` AND \`tickets.parquet\`; (2) reload the CSV with explicit \`dtype=\` mapping (low-cardinality strings as "category") and compare dtypes and memory against a naive \`pd.read_csv\` with no arguments; (3) run five assert-based sanity checks (row count, no negative response times, csat within 1–5, no duplicate ticket_ids, expected columns present); (4) print a five-line text report: ticket count, breach rate, urgent share, median response for urgent vs not, and the three slowest tickets. Commit it — Day 68 turns these asserts into a real validation contract.`,
      rubric: [
        'CSV and Parquet both written and reloaded; dtypes after explicit load match the originals',
        'Naive-load vs typed-load memory difference measured and printed',
        'All five sanity asserts present and passing',
        'Report prints correct numbers from the seeded data',
        'Script is idempotent — running twice produces identical output',
        'Committed to the practice repo',
      ],
    },
    mistakes: [
      'Writing via chained indexing: df[mask]["col"] = value. It may hit a temporary copy and vanish. One indexer: df.loc[mask, "col"] = value.',
      'Confusing loc and iloc after a sort or filter. loc answers "the row labeled 3"; iloc answers "the 3rd row" — different rows once order changes.',
      'Forgetting parentheses in masks: df[df.a == 1 & df.b == 2] — & binds before ==, so this crashes or lies. Wrap every condition.',
      'Iterating with iterrows() to compute something per row. It is a Python loop in disguise (Day 64\'s 100× tax); look for the vectorized column expression.',
      'Loading everything as default dtypes: strings become object blobs, dates stay strings, memory balloons. Pass dtype= and parse_dates= at read time.',
      'Testing for missing values with == np.nan, which is never True. Use .isna() / .notna().',
    ],
    quiz: [
      {
        q: 'After s = df.sort_values("x"), what is the difference between s.iloc[0] and s.loc[0]?',
        o: [
          'None — they always return the same row',
          'iloc[0] is the first row of the sorted frame; loc[0] is the row whose index LABEL is 0, wherever sorting moved it',
          'loc[0] is faster',
          's.loc[0] raises an error after sorting',
        ],
        x: 1,
        w: 'iloc is positional, loc is label-based. Sorting reorders positions but labels travel with their rows — the two answers diverge immediately.',
        revisit: 65,
      },
      {
        q: 'What is wrong with df[df.priority == "urgent"]["escalated"] = True?',
        o: [
          'Nothing — it sets the column on matching rows',
          'It is chained indexing: the assignment may target a temporary copy and silently not stick. Use df.loc[mask, "escalated"] = True',
          'The mask syntax is invalid',
          'You cannot create new columns in pandas',
        ],
        x: 1,
        w: 'df[mask] can produce a copy; the second [] then writes into that temporary. One .loc call with rows and columns together is the reliable form.',
        revisit: 65,
      },
      {
        q: 'A string column has 4 distinct values across 1M rows. The best dtype choice is…',
        o: [
          'Leave it as object — strings are strings',
          'Convert to category: labels stored once, rows become small integer codes — often 10–20× less memory and faster groupbys',
          'Convert to int64 by hashing',
          'Split each value into a separate column',
        ],
        x: 1,
        w: 'Low-cardinality strings are exactly what categorical dtype exists for: one copy of each label plus compact codes per row.',
        revisit: 65,
      },
    ],
    resources: [
      { label: '10 minutes to pandas (official quickstart)', url: 'https://pandas.pydata.org/docs/user_guide/10min.html', type: 'docs', time: '25 min' },
      { label: 'pandas User Guide — indexing & selecting data', url: 'https://pandas.pydata.org/docs/user_guide/index.html', type: 'docs', time: '25 min' },
      { label: 'Kaggle Learn — Pandas (interactive micro-course)', url: 'https://www.kaggle.com/learn', type: 'course', time: '30 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: Day 64 cards (broadcasting, views, axes)', minutes: 10 },
      { activity: 'ELI5 + tech read: Series, index, loc/iloc, dtypes', minutes: 20 },
      { activity: 'Guided: build & interrogate + selection drills', minutes: 40 },
      { activity: 'Practice: five stakeholder questions', minutes: 20 },
      { activity: 'Project: ticket_report.py round-trip', minutes: 20 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'Opening ritual run and memory savings from categoricals recorded',
      'loc/iloc divergence demonstrated and explained in one sentence',
      'Five stakeholder questions answered as sentences with numbers',
      'ticket_report.py committed with all asserts passing; quiz ≥ 2/3',
    ],
    connections: {
      back: 'Every fast pandas operation is Day 64\'s NumPy underneath — boolean filtering IS the boolean mask, and dtype discipline is the same contract. The rows-and-columns mental model comes from Day 36\'s SQL tables.',
      forward: 'Tomorrow adds the power tools — groupby, merge, reshape — and Day 67 turns interrogation into full EDA. The typed-load + sanity-assert habit becomes Day 68\'s data contracts, and eval logs get exactly this treatment on Day 137.',
    },
    flashcards: [
      { f: 'loc vs iloc?', b: 'loc = by label (inclusive slices, takes masks); iloc = by position (half-open slices). They diverge after sort/filter.' },
      { f: 'The chained-indexing trap?', b: 'df[mask]["col"] = v may write to a temporary copy. Always df.loc[mask, "col"] = v.' },
      { f: 'First four commands on any new DataFrame?', b: 'head(), shape, info(), describe() — plus value_counts() on key columns.' },
      { f: 'When to use category dtype?', b: 'Low-cardinality strings: stores labels once + integer codes. Big memory and speed wins.' },
      { f: 'Combining boolean masks in pandas?', b: 'Use & | ~ with parentheses around EACH condition — & binds tighter than ==.' },
      { f: 'Why chain methods in parentheses?', b: 'One operation per line: readable, reviewable, re-runnable — the scriptable spreadsheet\'s whole advantage.' },
    ],
    deepDive: [
      { label: 'Copy-on-write in modern pandas', note: 'pandas 2+ makes copy-on-write standard: chained assignment never modifies the original, turning a silent maybe-bug into a consistent rule. Read the short docs page so the warnings you see make sense.' },
    ],
  },
  {
    id: 'd066', day: 66, week: 10, phase: 4, kind: 'lesson',
    title: 'pandas II — Wrangling',
    analogy: 'The data kitchen',
    objectives: [
      'Summarize data by group with groupby-agg, including named multi-aggregations',
      'Join tables with merge, and audit every join with validate= and indicator=',
      'Reshape between wide and long with pivot_table and melt, and say when each shape serves',
      'Parse and exploit datetimes with pd.to_datetime and the .dt accessor',
      'Combine inconsistent multi-source tables into one tidy dataset',
    ],
    prereqs: [
      { day: 65, label: 'DataFrames, selection & dtypes' },
      { day: 37, label: 'SQL joins & data modeling' },
    ],
    eli5: `Three suppliers deliver to your restaurant every morning, and none of them agree on anything. One labels crates by date, one by week; one writes "tomatoes", another "Tomato (red)"; one bills in dollars, another in cents. Before any cooking happens, the kitchen must merge the deliveries into one inventory, group them by ingredient, and reshape the pile so the chef can read it at a glance. That unglamorous back-of-house work is data wrangling, and it is most of the job.

Three moves run the kitchen. **Groupby** is sorting the delivery into labeled bins and summarizing each bin — "total kilos per vegetable" — split, apply, combine. **Merge** is matching two lists against each other — the delivery manifest against your supplier contacts — and it inherits every join subtlety you met in SQL on Day 37, including the quiet catastrophe: if a supplier appears twice in the contacts list, every matched crate DUPLICATES. **Reshape** is turning the same numbers sideways: a long list of (date, product, amount) rows becomes a wide month-by-product grid for humans to read — pivot — and back again for machines to process — melt. The chef never sees this work. The chef only notices when it wasn't done.`,
    why: `Real data never arrives as one clean table — it arrives as exports from three systems with different keys, date formats, and opinions. The capstone's ingest pipeline (Day 119), every eval-results-joined-to-metadata analysis (Day 137), and the classic FDE morning ("here are CSVs from our CRM, billing, and support tools — what's going on?") are all wrangling. The join-audit habits you build today — validate=, indicator=, count rows before and after — are the difference between an analysis and a confident wrong answer: a silent row explosion double-counts revenue in a way nobody notices until the customer does.`,
    tech: `### groupby: split–apply–combine

\`df.groupby("region")["revenue"].sum()\` splits rows into per-region bins, applies the aggregation, and combines results indexed by group. Multiple stats at once with named aggregation: \`df.groupby("region").agg(total=("revenue", "sum"), orders=("order_id", "count"), avg=("revenue", "mean"))\`. Group by several keys and you get a MultiIndex — \`reset_index()\` flattens it back to columns. Remember the result is aggregated: one row per group, not per original row (\`transform\` broadcasts a group statistic back to original rows when you need that instead).

### merge: joins with an audit trail

\`pd.merge(left, right, on="key", how="inner|left|outer")\` is Day 37's join in memory. The two silent killers: **row explosion** — duplicate keys on the right turn a 1,000-row left table into more rows than you started with — and **silent drops** — an inner join discards non-matching rows without a word. Audit every join: pass \`validate="m:1"\` (or "1:1") to make pandas RAISE if key multiplicity is not what you claimed, and \`indicator=True\` to get a \`_merge\` column (\`both\`/\`left_only\`/\`right_only\`) you can value_counts to see exactly what matched. Check \`len()\` before and after, every time. \`concat\` stacks frames vertically (aligning columns by name, filling gaps with NaN — inspect for surprise NaN blocks).

### Reshape and time

**pivot_table** goes long→wide: \`df.pivot_table(index="month", columns="region", values="revenue", aggfunc="sum")\` — a human-readable grid. **melt** goes wide→long, the tidy shape (one observation per row) that groupby and plotting want. **Datetimes**: \`pd.to_datetime(col)\` parses strings into a proper dtype; then \`.dt.year\`, \`.dt.month\`, \`.dt.day_name()\`, \`.dt.to_period("M")\` unlock time grouping. Unparsed date strings sort alphabetically — "2024-10" before "2024-9" — a classic silent wrong-answer. **String ops** live under \`.str\` (\`.str.strip()\`, \`.str.lower()\`, \`.str.replace()\`) and are the first aid for inconsistent labels. \`apply\` with a Python function is the last resort — a hidden loop, often 100× slower than the vectorized form.`,
    viz: null,
    guided: [
      {
        title: 'Merge like an auditor',
        minutes: 20,
        body: `1. Paste the starter. It builds two seeded tables the way two real systems would export them: \`orders\` (400 rows) and \`customers\` (60 rows) — and deliberately plants two problems: three orders reference a customer_id that does not exist, and one customer_id appears TWICE in customers (a dirty CRM export).
2. Record \`len(orders)\`. Now do the naive thing: left-merge orders with customers and print the new length. It GREW — the duplicated customer matched some orders twice. Revenue is now double-counted for that customer.
3. Redo the merge with \`validate="m:1"\` and watch pandas raise MergeError immediately. This one keyword would have caught the bug before it shipped.
4. Fix the right table (\`customers.drop_duplicates(subset="customer_id")\`), merge again with \`validate="m:1"\` and \`indicator=True\`, and \`value_counts\` the \`_merge\` column: 397 both, 3 left_only — the orphaned orders, found instead of silently NaN-filled.
5. Write the three-line join checklist in your notes: row counts before/after; validate= always; indicator= when anything might not match.`,
        code: `import numpy as np
import pandas as pd

rng = np.random.default_rng(seed=66)
n_orders, n_cust = 400, 60

customers = pd.DataFrame({
    "customer_id": np.arange(1, n_cust + 1),
    "region": rng.choice(["NA", "EU", "APAC"], size=n_cust, p=[0.5, 0.3, 0.2]),
    "tier": rng.choice(["free", "pro", "enterprise"], size=n_cust, p=[0.5, 0.35, 0.15]),
})
# dirty CRM: customer 7 exported twice
customers = pd.concat([customers, customers[customers.customer_id == 7]],
                      ignore_index=True)

orders = pd.DataFrame({
    "order_id": np.arange(10_000, 10_000 + n_orders),
    "customer_id": rng.integers(1, n_cust + 4, size=n_orders),  # some ids beyond 60!
    "amount": np.round(rng.lognormal(4.0, 0.8, size=n_orders), 2),
})

print("orders before merge:", len(orders))
naive = orders.merge(customers, on="customer_id", how="left")
print("after naive merge:  ", len(naive), " <- row explosion!")

try:
    orders.merge(customers, on="customer_id", how="left", validate="m:1")
except Exception as e:
    print("validate caught it:", type(e).__name__)

clean_cust = customers.drop_duplicates(subset="customer_id")
audited = orders.merge(clean_cust, on="customer_id", how="left",
                       validate="m:1", indicator=True)
print(audited["_merge"].value_counts())`,
      },
      {
        title: 'Groupby, time, and the pivot',
        minutes: 20,
        body: `1. Extend the audited merge: add an \`order_date\` column of string dates (the starter generates 180 days of them) and parse with \`pd.to_datetime\`. Prove the danger first: sort the STRING version of "2024-2-1" vs "2024-10-1" style dates and watch alphabetical order lie.
2. Derive \`month = df.order_date.dt.to_period("M")\` and \`dow = df.order_date.dt.day_name()\`.
3. Named aggregation: revenue, order count, and mean order value by region — one \`.agg()\` call with three named outputs. Then two-key groupby (region × tier) and \`reset_index()\` to flatten.
4. Build the executive grid: \`pivot_table(index="month", columns="region", values="amount", aggfunc="sum")\`. Read one cell aloud so the meaning sticks ("EU revenue in July was…").
5. Melt the pivot back to long form and confirm (after sorting) it matches the groupby result — pivot and melt are inverses.
6. Use \`transform\` once: add a column with each region\'s mean order value on EVERY row, then flag orders above their own region\'s average. Note how transform differs from agg (same length as input vs one row per group).`,
        code: `import numpy as np
import pandas as pd
# (continue from the audited frame; drop the _merge column first)

df = audited.drop(columns="_merge")
rng2 = np.random.default_rng(seed=660)
dates = pd.Timestamp("2024-01-01") + pd.to_timedelta(
    rng2.integers(0, 180, size=len(df)), unit="D")
df["order_date"] = dates
df["month"] = df.order_date.dt.to_period("M")

by_region = df.groupby("region").agg(
    revenue=("amount", "sum"),
    orders=("order_id", "count"),
    avg_order=("amount", "mean"),
)
print(by_region)

grid = df.pivot_table(index="month", columns="region",
                      values="amount", aggfunc="sum")
print(grid.round(0))

long_again = grid.reset_index().melt(id_vars="month",
                                     value_name="revenue")
print(long_again.head())

df["region_avg"] = df.groupby("region")["amount"].transform("mean")
df["above_avg"] = df.amount > df.region_avg
print(df["above_avg"].mean())`,
      },
    ],
    practice: [
      {
        title: 'The three-supplier mess',
        minutes: 22,
        body: `Three monthly exports arrive as DataFrames (build them seeded, ~50 rows each, in your script): supplier A has columns \`["date", "product", "qty", "unit_price"]\` with ISO date strings; supplier B has \`["Day", "Item", "Quantity", "PriceCents"]\` — dates as "03/15/2024", prices in CENTS; supplier C has \`["date", "product", "total_cost"]\` only, with product names in UPPERCASE and some duplicate rows.

Goal: one tidy table \`["date", "product", "total_cost"]\` (datetime dtype, lowercase product names, dollars), deduplicated, then: total spend per product per month (groupby) and a month × product pivot grid. Assert the final row count equals the sum of the three inputs minus the duplicates you dropped, and assert total spend equals the hand-computable sum from each source.

Hints: rename columns with a dict; \`pd.to_datetime(col, format="%m/%d/%Y")\` for supplier B; cents / 100; \`.str.lower().str.strip()\` for names; \`concat\` then \`drop_duplicates\`. Log the row count after every step — the wrangler\'s flight recorder.`,
      },
    ],
    project: {
      title: 'wrangle.py — the auditable pipeline',
      brief: `Refactor the three-supplier practice into \`wrangle.py\` with one function per stage: \`load_sources()\` (returns the three seeded frames), \`standardize(df, mapping)\` (renames, retypes, normalizes strings and units), \`combine(frames)\` (concat + dedupe with counts logged), and \`summarize(tidy)\` (the groupby and pivot). Every stage logs rows-in → rows-out via the logging module (Day 16), and the module ends with four asserts covering row counts, dtypes (order_date is datetime64), no duplicates, and totals matching the sources. Add one deliberate test: corrupt a date in source B and confirm the pipeline fails loudly rather than sorting wrongly. Commit — Day 70's checkpoint report imports this pipeline shape.`,
      rubric: [
        'Four stage functions, each pure (frame in, frame out) and individually runnable',
        'Every stage logs rows-in/rows-out; final asserts all pass',
        'Unit conversion (cents→dollars) and date parsing verified by an assert on totals and dtypes',
        'The corrupted-date test fails loudly with a clear error',
        'Committed to the practice repo',
      ],
    },
    mistakes: [
      'Merging without validate= and getting silent row explosion from duplicate keys. One duplicated key double-counts every matched row — assert the multiplicity you believe in.',
      'Using an inner join and never noticing the dropped rows. indicator=True plus a value_counts of _merge makes losses visible.',
      'Sorting or grouping unparsed date strings — alphabetical order is not chronological order. pd.to_datetime first, always.',
      'Forgetting groupby returns one row per group. Reaching for original-row context afterward needs transform (broadcast back) or a merge, not wishful indexing.',
      'Reaching for .apply(lambda …) when a vectorized column op or .str/.dt accessor exists — a hidden Python loop with Day 64\'s 100× tax.',
      'Concatenating frames with mismatched column names and not checking for the NaN blocks it silently creates. Standardize names before concat.',
    ],
    quiz: [
      {
        q: 'You left-merge 1,000 orders against a customers table and get 1,013 rows. What happened?',
        o: [
          'pandas added an index row per group',
          'Some customer_ids appear more than once in customers — each duplicate key multiplies its matching orders. validate="m:1" would have raised instead',
          'The orders table had NaNs',
          'Left joins always add rows',
        ],
        x: 1,
        w: 'Row explosion from duplicate join keys is the classic silent wrangling bug — it double-counts whatever you sum next. Declaring multiplicity with validate= turns it into a loud error.',
        revisit: 66,
      },
      {
        q: 'Which call reshapes a long (month, region, revenue) table into a month × region grid?',
        o: [
          'melt(id_vars="month")',
          'groupby("month").sum()',
          'pivot_table(index="month", columns="region", values="revenue", aggfunc="sum")',
          'concat([months, regions])',
        ],
        x: 2,
        w: 'pivot_table goes long→wide: rows become the index, one column per region, cells aggregated. melt is the inverse (wide→long).',
        revisit: 66,
      },
      {
        q: 'A column of date STRINGS like "2024-9-1" and "2024-10-1" is sorted without parsing. What goes wrong?',
        o: [
          'Nothing — ISO-ish strings sort fine',
          'Alphabetical order puts "2024-10-1" before "2024-9-1" (1 < 9 character-wise) — chronology silently breaks. Parse with pd.to_datetime first',
          'pandas auto-detects dates on sort',
          'Sorting strings raises a TypeError',
        ],
        x: 1,
        w: 'String comparison is character by character: "10" sorts before "9". Only zero-padded full-ISO strings happen to sort correctly — parse to datetime and stop gambling.',
        revisit: 66,
      },
    ],
    resources: [
      { label: 'pandas User Guide — merge, join, concatenate & compare; groupby', url: 'https://pandas.pydata.org/docs/user_guide/index.html', type: 'docs', time: '30 min' },
      { label: '10 minutes to pandas — merge/grouping/reshaping sections', url: 'https://pandas.pydata.org/docs/user_guide/10min.html', type: 'docs', time: '15 min' },
      { label: 'Kaggle Learn — Pandas (grouping & joining lessons)', url: 'https://www.kaggle.com/learn', type: 'course', time: '30 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: Day 65 cards (loc/iloc, chained indexing)', minutes: 10 },
      { activity: 'ELI5 + tech read: split-apply-combine, join audits, reshape', minutes: 20 },
      { activity: 'Guided: merge like an auditor + groupby/pivot', minutes: 40 },
      { activity: 'Practice: the three-supplier mess', minutes: 22 },
      { activity: 'Project: wrangle.py pipeline', minutes: 18 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'Row explosion reproduced, then caught with validate="m:1"; orphans found via indicator',
      'Named aggregation, pivot, melt round-trip, and one transform all executed',
      'Three-supplier mess tidied with asserts on counts and totals passing',
      'wrangle.py committed with logged stages; quiz ≥ 2/3',
    ],
    connections: {
      back: 'merge is Day 37\'s SQL joins executed in memory — same inner/left semantics, same duplicate-key hazards. groupby-agg is what your Day 42 SQL GROUP BY did, and every column op is still Day 64\'s vectorized NumPy.',
      forward: 'Day 67 does EDA on tidy data — which today\'s pipeline produces. Day 70\'s report and Day 83\'s churn project both start with a wrangle stage, and the capstone\'s ingest (Day 119) is this pipeline pattern with documents instead of orders.',
    },
    flashcards: [
      { f: 'The two silent join killers?', b: 'Row explosion from duplicate keys, and inner joins silently dropping non-matches. Audit with validate= and indicator=.' },
      { f: 'What does validate="m:1" do?', b: 'Asserts many-to-one key multiplicity — raises MergeError if the right side has duplicate keys.' },
      { f: 'groupby agg vs transform?', b: 'agg → one row per group; transform → group statistic broadcast back to every original row.' },
      { f: 'pivot_table vs melt?', b: 'pivot_table: long→wide grid for humans. melt: wide→long tidy rows for groupby/plotting. Inverses.' },
      { f: 'Why parse dates before sorting/grouping?', b: 'String dates sort alphabetically ("10" before "9"). pd.to_datetime gives real chronology plus the .dt accessor.' },
      { f: 'When is .apply acceptable?', b: 'Last resort only — it is a hidden Python loop. Prefer vectorized ops and .str/.dt accessors.' },
    ],
    deepDive: [
      { label: 'Tidy Data (Hadley Wickham\'s paper, concept)', note: 'One variable per column, one observation per row, one table per entity type. The vocabulary behind "melt to tidy" — ten minutes that organizes your instincts for every reshape decision.' },
    ],
  },
  {
    id: 'd067', day: 67, week: 10, phase: 4, kind: 'lesson',
    title: 'Exploratory Data Analysis',
    analogy: 'Interviewing your data',
    objectives: [
      'Run a repeatable EDA checklist: shape, types, missingness, distributions, relationships, time, leakage',
      'Choose the right plot (histogram, scatter, box) and read skew, outliers, and separation from it',
      'Quantify relationships with correlations and grouped target rates — and state their limits',
      'Detect target leakage by interrogating any feature that looks too good',
      'Write findings as defensible sentences with numbers, not as chart dumps',
    ],
    prereqs: [
      { day: 65, label: 'DataFrames & selection' },
      { day: 66, label: 'groupby, merge & reshape' },
      { day: 58, label: 'Distributions, skew & heavy tails' },
    ],
    eli5: `A journalist handed a press release does not print it — they interview. Who are you? (shape, columns, types.) Where are the gaps in your story? (missing values.) Walk me through a typical day — and your worst day. (distributions, outliers.) Who are you connected to? (correlations.) And the question that breaks cases open: how do you know that — did you learn it BEFORE or AFTER the fact? That last one is leakage hunting: a column that "predicts" churn perfectly usually turns out to be a consequence of churn, quietly written back into the file after the customer left. It aces the interview because it already read tomorrow's newspaper.

EDA is that interview, done in pandas and plots, BEFORE any model touches the data. The order matters: understand each character alone (univariate), then the relationships (bivariate), then the timeline. And the output is not a pile of charts — it is findings written as sentences a skeptic can check: "Customers with 3+ support tickets churn at 41% vs 12% baseline (n = 214)." A chart is evidence; the sentence is the testimony.`,
    why: `Skipping EDA is how teams spend three weeks tuning a model on data with a leak, a unit mix-up, or 30% silent missingness — then watch the "95% accurate" model collapse in production. Day 70's checkpoint IS an EDA report; Day 77's competition and Day 83's churn project begin with this checklist; Day 80's error analysis is EDA pointed at model mistakes. For an FDE, the first customer dataset is a first interview — the engineer who finds the data's three surprises in an afternoon earns the room's trust before any model exists.`,
    tech: `### The checklist, in interview order

1. **Identity**: \`shape\`, \`dtypes\`, \`head\`, memory. Do row counts match expectations? Are dates dates?
2. **Gaps**: \`df.isna().mean()\` per column — the missingness map. WHY is data missing (Day 68 acts on this)? Watch for disguised missingness: 0, -999, "unknown", empty strings.
3. **Univariate**: histograms for numerics (log-scale heavy tails — Day 58's lesson made visual), \`value_counts\` for categoricals. Note skew, spikes (sentinel values masquerading), impossible values.
4. **Outliers**: box plots and quantiles. Decide error vs genuine extreme — a 10-second latency is real; an age of 250 is not.
5. **Relationships**: \`df.corr(numeric_only=True)\` for numeric pairs; grouped target rates for categoricals (\`df.groupby("plan")["churned"].mean()\` — the workhorse). Scatter plots for pairs that matter.
6. **Time**: is the target drifting? Do rates differ by cohort or month? (Day 145's drift story starts here.)
7. **Leakage interrogation**: any feature that separates the target too cleanly gets cross-examined — could this value exist BEFORE the outcome? Post-outcome artifacts (refund flags, closure codes, "days_until_cancel") are leaks; they train a model to read the answer key. Rule: too good to be true IS a finding, just not the one you hoped.

### Reading correlation honestly

Pearson r measures LINEAR association: r ≈ 0 does not mean unrelated (a U-shape scores zero), outliers can manufacture or destroy r, and correlation is not causation — an unseen third variable often drives both (and aggregation can even reverse a relationship across subgroups — Simpson's paradox). Treat r as a pointer to pairs worth plotting, never as a conclusion.

### Findings as sentences

Every finding follows one shape: claim + number + denominator + comparison. "Enterprise-tier customers churn at 4% vs 18% overall (n = 61)" is checkable; "enterprise looks better" is vibes. Five such sentences beat fifty charts, and they are exactly what Day 70's report and every stakeholder readout demand.`,
    viz: null,
    guided: [
      {
        title: 'The first interview — identity, gaps, shapes',
        minutes: 20,
        body: `1. Paste the starter — a seeded 1,200-customer churn dataset with three planted surprises you have not been told about.
2. Identity pass: shape, dtypes, head. One column that should be numeric is an object — find it (a sentinel string is hiding in it) and fix with \`pd.to_numeric(col, errors="coerce")\`.
3. Gaps pass: \`df.isna().mean().sort_values(ascending=False)\` — which columns leak data and how much? Is missingness random, or concentrated in one plan tier? (Check with a groupby — this distinction drives Day 68\'s strategy.)
4. Univariate pass: histogram \`monthly_spend\` — heavily right-skewed, so re-plot on log scale and note how the story changes. value_counts on plan and region.
5. Outlier pass: box plot tenure_months by plan; quantiles of spend at [0.01, 0.5, 0.99]. Decide for each extreme: error or whale?
6. Write your first two findings as sentences with numbers and denominators.`,
        code: `import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

rng = np.random.default_rng(seed=67)
N = 1200
plan = rng.choice(["basic", "pro", "enterprise"], size=N, p=[0.55, 0.33, 0.12])
tenure = rng.integers(1, 60, size=N)
tickets = rng.poisson(1.2, size=N)
spend = np.round(rng.lognormal(3.4, 0.8, size=N) *
                 np.where(plan == "enterprise", 4, np.where(plan == "pro", 2, 1)), 2)

# churn depends on tenure and tickets (the real signal)
p_churn = 0.45 - 0.005 * tenure + 0.06 * tickets
churned = rng.random(N) < np.clip(p_churn, 0.02, 0.9)

# planted surprise 1: a LEAK — written after the outcome
refund_issued = np.where(churned, rng.random(N) < 0.92, rng.random(N) < 0.03)
# planted surprise 2: missingness concentrated in basic tier
csat = rng.integers(1, 6, size=N).astype(float)
csat[(plan == "basic") & (rng.random(N) < 0.4)] = np.nan
# planted surprise 3: sentinel string hiding in a numeric column
last_login_days = rng.integers(0, 90, size=N).astype(object)
last_login_days[rng.random(N) < 0.02] = "unknown"

df = pd.DataFrame({"plan": plan, "tenure_months": tenure, "support_tickets": tickets,
                   "monthly_spend": spend, "csat": csat,
                   "last_login_days": last_login_days,
                   "refund_issued": refund_issued, "churned": churned})

print(df.shape); print(df.dtypes)
print(df.isna().mean().sort_values(ascending=False))
df["last_login_days"] = pd.to_numeric(df.last_login_days, errors="coerce")

fig, ax = plt.subplots(1, 2, figsize=(10, 3))
ax[0].hist(df.monthly_spend, bins=50); ax[0].set_title("spend")
ax[1].hist(np.log10(df.monthly_spend), bins=50); ax[1].set_title("log10 spend")
plt.show()`,
      },
      {
        title: 'Find the signal — and smell the leak',
        minutes: 22,
        body: `1. Overall churn rate first — the baseline every comparison needs: \`df.churned.mean()\` (~30%).
2. Grouped target rates, the EDA workhorse: churn by plan, churn by tenure bins (\`pd.cut(df.tenure_months, bins=[0, 12, 24, 48, 60])\`), churn by ticket count (0, 1, 2, 3+). Two real signals should emerge: churn falls with tenure and rises with tickets.
3. Correlation matrix on numerics + churned (as int). Rank features by |r| with churn.
4. One feature will dominate at r ≈ 0.8+: \`refund_issued\`. Interrogate it: churn rate among refund receivers vs not (~92% vs ~3%). This separation is TOO clean for a real pre-churn signal.
5. Ask the journalist\'s question: is a refund issued before or after a customer decides to leave? After. It is a consequence of churn, not a predictor — a LEAK. Write the finding: "refund_issued separates churn almost perfectly (r ≈ 0.85) but is generated post-outcome; it must be excluded from any model."
6. Check csat honestly: with 40% missing in the basic tier, a naive "csat vs churn" comparison is biased by WHO is missing. Note it for Day 68 rather than hand-waving it today.
7. Scatter tenure vs spend colored by churn — confirm there is no magic pattern hiding, and say why the boring result is still a finding ("no interaction visible between tenure and spend").`,
        code: `import pandas as pd
import numpy as np
# (continue with df from exercise 1)

base = df.churned.mean()
print(f"baseline churn: {base:.1%}")

print(df.groupby("plan")["churned"].mean().round(3))
df["tenure_bin"] = pd.cut(df.tenure_months, bins=[0, 12, 24, 48, 60])
print(df.groupby("tenure_bin", observed=True)["churned"].mean().round(3))
df["ticket_bin"] = np.minimum(df.support_tickets, 3)
print(df.groupby("ticket_bin")["churned"].mean().round(3))

num = df[["tenure_months", "support_tickets", "monthly_spend",
          "csat", "last_login_days"]].copy()
num["churned"] = df.churned.astype(int)
num["refund_issued"] = df.refund_issued.astype(int)
corr = num.corr()["churned"].drop("churned").sort_values(key=abs, ascending=False)
print(corr.round(3))

print("churn | refund:   ", df[df.refund_issued]["churned"].mean().round(3))
print("churn | no refund:", df[~df.refund_issued]["churned"].mean().round(3))
# too clean -> interrogate WHEN the value is created -> post-outcome -> LEAK`,
      },
    ],
    practice: [
      {
        title: 'Five findings, five sentences',
        minutes: 20,
        body: `Deliver the interview transcript: five findings from the churn dataset, each a single sentence in the claim + number + denominator + comparison format, each backed by one named piece of evidence (a groupby result or plot you can reproduce).

Constraints: at least one finding about data QUALITY (the sentinel column or the biased missingness), at least one about the LEAK (with the exclusion recommendation), at least one genuine predictive signal with its effect size (e.g. churn at 3+ tickets vs baseline), and at least one honest negative ("monthly_spend shows no meaningful association with churn, r = …") — absence of signal is information someone was going to waste a week on.

Then rank the five by "what a stakeholder must hear first" and justify the top pick in one line. Hints: lead with what changes decisions (the leak — it invalidates any model trained naively on this file); n and denominators make claims defensible; round numbers to the precision the sample size supports (Day 60: n = 214 does not justify "41.3%").`,
      },
    ],
    project: {
      title: 'eda_checklist.md — your reusable interview script',
      brief: `Turn today into an artifact you will reuse at least four times (Days 70, 77, 80, 83). Write \`eda_checklist.md\` in your practice repo: the seven interview stages, each with the exact pandas one-liners, what to look for, and a "red flags" line (sentinels, spikes at zero, alphabetical date sorts, too-clean separations). Include the finding-sentence template and a short "leakage interrogation" section with the three questions to ask any suspiciously strong feature (When is this value created? Could it exist at prediction time? Does it survive a time-ordered split?). Then prove the checklist works: run it top to bottom against today's churn dataset and append the resulting five findings as the worked example. Commit both.`,
      rubric: [
        'All seven stages present with runnable pandas snippets',
        'Red-flags line for each stage names at least one concrete symptom',
        'Leakage section contains the three interrogation questions',
        'Worked example includes the five findings in the sentence format',
        'A teammate could run the checklist on a new dataset without asking you anything',
        'Committed to the practice repo',
      ],
    },
    mistakes: [
      'Modeling before interviewing. Every hour of EDA saves days of tuning a model on broken data — the leak in today\'s dataset would have produced a fake 95% accuracy.',
      'Celebrating the too-good feature instead of interrogating it. Near-perfect separation is a leakage alarm, not a victory. Ask when the value is created.',
      'Reading r = 0 as "no relationship". Correlation only sees linear patterns; plot the pair before dismissing it.',
      'Using means on skewed columns. Day 58 again: spend and latency need medians and quantiles; one whale customer drags every mean.',
      'Deleting outliers by reflex. A 250-year age is an error; a 10× spend customer is your best account. Judge each, document the judgment.',
      'Shipping charts without sentences. A figure without a claim, number, and denominator delegates the thinking to the reader — who will decline.',
    ],
    quiz: [
      {
        q: 'A feature separates your churn target almost perfectly (r ≈ 0.85). Your FIRST move is…',
        o: [
          'Put it at the top of the model\'s feature list',
          'Interrogate when the value is created — near-perfect separation usually means it is a post-outcome artifact (leakage)',
          'Drop it as an outlier',
          'Rescale it to reduce the correlation',
        ],
        x: 1,
        w: 'Too good to be true is a data-provenance question, not a modeling win. A refund flag written after cancellation "predicts" churn by reading the answer key — and dies at prediction time.',
        revisit: 67,
      },
      {
        q: 'Pearson correlation between two variables is 0.02. What can you conclude?',
        o: [
          'The variables are unrelated',
          'Only that there is little LINEAR association — a strong U-shaped or thresholded relationship can still score near zero; plot it',
          'The data is broken',
          'One variable must be constant',
        ],
        x: 1,
        w: 'r measures linear association only. Nonlinear patterns, and relationships masked or manufactured by outliers, need the scatter plot r was pointing you toward.',
        revisit: 67,
      },
      {
        q: 'csat is missing for 40% of basic-tier customers but almost never for enterprise. Comparing raw mean csat between churned and retained customers is…',
        o: [
          'Fine — missingness affects both groups equally',
          'Biased: missingness is concentrated in one segment, so the observed csat values are not representative; the comparison inherits the bias',
          'Impossible — pandas drops NaN automatically so nothing can go wrong',
          'Only a problem if csat is the target',
        ],
        x: 1,
        w: 'Non-random missingness means "who answered" differs by segment — the visible values are a biased spoonful (Day 60\'s stirred-pot rule). Day 68 covers what to do about it.',
        revisit: 67,
      },
    ],
    resources: [
      { label: 'Kaggle Learn — Data Visualization (interactive)', url: 'https://www.kaggle.com/learn', type: 'course', time: '30 min' },
      { label: 'pandas User Guide — visualization & statistical functions', url: 'https://pandas.pydata.org/docs/user_guide/index.html', type: 'docs', time: '20 min' },
      { label: 'Google ML Crash Course — working with data modules', url: 'https://developers.google.com/machine-learning/crash-course', type: 'course', time: '25 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: Days 65–66 cards (selection, joins, groupby)', minutes: 10 },
      { activity: 'ELI5 + tech read: the interview checklist & leakage', minutes: 20 },
      { activity: 'Guided: first interview + signal-and-leak hunt', minutes: 42 },
      { activity: 'Practice: five findings, five sentences', minutes: 20 },
      { activity: 'Project: eda_checklist.md with worked example', minutes: 18 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'All three planted surprises found (sentinel column, biased missingness, refund leak)',
      'Grouped churn rates computed for plan, tenure bins, and ticket bins with the baseline stated',
      'Five findings written in the sentence format, ranked, with one honest negative',
      'eda_checklist.md committed with the worked example; quiz ≥ 2/3',
    ],
    connections: {
      back: 'The skew you diagnosed is Day 58\'s heavy tails made visible; grouped target rates are Day 66\'s groupby doing inference work; and "the visible csat values are a biased spoonful" is Day 60\'s sampling-bias lesson in the wild.',
      forward: 'Day 68 acts on the gaps and sentinels you found; Day 69 turns the clean signals into features (and excludes the leak); Day 70\'s checkpoint is this interview written up for stakeholders. Day 80 re-aims the same checklist at model errors.',
    },
    flashcards: [
      { f: 'The seven EDA interview stages?', b: 'Identity, gaps, univariate, outliers, relationships, time, leakage interrogation.' },
      { f: 'The leakage interrogation question?', b: 'When is this value created — could it exist BEFORE the outcome, at prediction time?' },
      { f: 'The finding-sentence format?', b: 'Claim + number + denominator + comparison: "3+ ticket customers churn at 41% vs 12% baseline (n=214)".' },
      { f: 'What does r ≈ 0 NOT tell you?', b: 'That the variables are unrelated — nonlinear patterns score zero. Plot the pair.' },
      { f: 'A feature with near-perfect target separation is…', b: 'A leakage alarm first, a feature candidate a distant second.' },
      { f: 'Disguised missingness examples?', b: 'Zeros, -999, "unknown", empty strings — sentinels hiding in valid-looking columns.' },
    ],
    deepDive: [
      { label: 'Simpson\'s paradox — when aggregation reverses the truth', note: 'A relationship can hold in every subgroup and reverse in the total (the Berkeley admissions case). Ten minutes that will one day stop you from shipping a backwards conclusion.' },
    ],
  },
  {
    id: 'd068', day: 68, week: 10, phase: 4, kind: 'lesson',
    title: 'Cleaning & Validation',
    analogy: 'Mise en place',
    objectives: [
      'Choose a defensible missing-data strategy (drop, impute, flag+impute) per column, per mechanism',
      'Detect and repair sentinels, unit mix-ups, duplicates, and impossible values',
      'Encode a data contract as a pydantic model and collect violations as a report, not a crash',
      'Write a reproducible raw→clean pipeline that logs every action and never mutates the raw data',
      'Argue the garbage-in economics of cleaning to a stakeholder',
    ],
    prereqs: [
      { day: 67, label: 'EDA — finding the dirt' },
      { day: 41, label: 'pydantic models & validation' },
      { day: 66, label: 'Wrangling pipelines' },
    ],
    eli5: `Watch a professional kitchen before service: nothing is cooking, yet everyone is working. Washing, chopping, labeling, lining up ingredients in bins — mise en place, "everything in its place". Amateurs skip it and improvise mid-cook; that is how garlic burns while you frantically dice an onion. Professionals know the boring preparation IS the cooking.

Data cleaning is mise en place, and it has two halves. The prep itself: fill or discard the gaps, fix the mislabeled jars (a column where half the values are in cents and half in dollars), throw out the duplicate deliveries, decide what to do with the weird ones (is a 250-year-old customer a typo, or a test account?). And then the allergy check at the pass: a written contract — every plate that leaves this kitchen has been checked against the ticket. In code, that contract is a schema: age is an integer between 0 and 120, plan is one of three known values, signup_date is a real date in the past. Every row is checked; violations get collected into a report instead of poisoning dinner. The deepest rule of the kitchen: never chop on the original — the raw file stays untouched, and the cleaning is a script you can rerun when next month's delivery arrives just as dirty.`,
    why: `"Garbage in, garbage out" has a price tag: a model trained on a column with mixed cents-and-dollars learns nonsense, ships, and misprices something real — and the postmortem finds the bug was visible in row 3 of the CSV. Cleaning-as-a-script matters doubly for FDEs: customer data arrives dirty EVERY month, and a pipeline that validates loudly turns "your integration broke our dashboard" into "our contract caught 212 bad rows from your export — here is the report". The capstone's document-ingest (Day 119) and the eval-set hygiene of Day 134 are this discipline aimed at text.`,
    tech: `### Missing data: mechanism first, method second

WHY data is missing determines what is legitimate. Missing completely at random (a flaky sensor) is benign — dropping rows mostly costs sample size. Missing conditional on something observable (basic-tier users skip the survey — yesterday's finding) biases naive analysis; impute within segment or model the missingness. Missing BECAUSE of the value itself (unhappy customers do not answer csat) is the dangerous case — no imputation fixes it; you flag it and reason carefully. Practical toolkit: drop columns that are mostly empty and unimportant; impute numerics with the MEDIAN (Day 58: means chase tails), categoricals with the mode or an explicit "missing" category; and add a \`was_missing\` indicator column when missingness itself might carry signal — models can use it (Day 69 keeps these as features).

### The repair bench

**Sentinels**: -999, 0-meaning-unknown, "N/A", "unknown" — find them via value_counts spikes and impossible values, convert to real NaN, THEN apply the missing-data strategy. **Units**: mixed cents/dollars or ms/s show up as bimodal histograms (two humps a constant factor apart) — fix by source, assert the result's range. **Duplicates**: exact dupes (\`drop_duplicates()\`) are easy; KEY duplicates (same ticket_id, different rows) need a policy — keep latest by timestamp, and log what you dropped. **Outliers**: four verdicts — fix (provable typo), cap/winsorize (real but destabilizing), keep (a whale is data), or flag for humans. Never silent deletion.

### Contracts and reproducibility

A **pydantic** model per row turns "the data should be fine" into executable truth: types, ranges (\`Field(ge=0, le=120)\`), enums for categoricals, and cross-field rules via validators. Validate every row; collect \`ValidationError\`s into a violations report (count, column, example rows) instead of dying on the first bad record — the report is a deliverable your data supplier can act on. Structure the pipeline as \`raw → clean.py → clean/\`: the raw file is read-only history, every transformation is logged with row counts (Day 66's habit), and the whole thing reruns identically — which is what makes next month's dirty delivery a non-event.`,
    viz: null,
    guided: [
      {
        title: 'Diagnose the dirt, systematically',
        minutes: 20,
        body: `1. Paste the starter — it generates a clean seeded dataset and then corrupts it the way real systems do: sentinel -999s and "unknown"s, 18 duplicated rows, a cents/dollars unit mix from "source B", and a handful of impossible ages.
2. Run the audit in order, recording counts for each: (a) value_counts spikes → find the -999s in \`age\` and "unknown"s in \`region\`; (b) \`df.describe()\` → the min age of -999 and max age of 240 jump out; (c) \`df.duplicated().sum()\` → exact dupes; (d) histogram of \`amount\` → two humps, ~100× apart. Group by \`source\` and compare medians to confirm the unit hypothesis (B is in cents).
3. For each of the four problems, write ONE line: symptom → root cause → chosen repair. This table is the core of a cleaning report.
4. Convert sentinels to real NaN (\`df.age.replace(-999, np.nan)\`, \`df.region.replace("unknown", np.nan)\`) and re-run \`isna().mean()\` — the true missingness rate was hiding behind the sentinels.
5. Do NOT fix anything else yet — diagnosis and repair are separate stages, and the repair belongs in the scripted pipeline of exercise 2.`,
        code: `import numpy as np
import pandas as pd

rng = np.random.default_rng(seed=68)
N = 800
df = pd.DataFrame({
    "customer_id": np.arange(1, N + 1),
    "age": rng.integers(18, 80, size=N).astype(float),
    "region": rng.choice(["north", "south", "east", "west"], size=N),
    "source": rng.choice(["A", "B"], size=N, p=[0.6, 0.4]),
    "amount": np.round(rng.lognormal(3.5, 0.6, size=N), 2),
    "signup": pd.Timestamp("2023-01-01")
              + pd.to_timedelta(rng.integers(0, 700, size=N), unit="D"),
})

# corruption, as real systems do it
df.loc[rng.random(N) < 0.06, "age"] = -999            # sentinel
df.loc[rng.random(N) < 0.04, "region"] = "unknown"    # sentinel
df.loc[df.source == "B", "amount"] *= 100             # cents vs dollars
df.loc[rng.choice(N, 5, replace=False), "age"] = rng.integers(150, 250, 5)  # impossible
df = pd.concat([df, df.sample(18, random_state=1)], ignore_index=True)      # dupes

print(df["age"].value_counts().head(3))       # the -999 spike
print(df.describe()[["age", "amount"]])
print("exact duplicates:", df.duplicated().sum())
print(df.groupby("source")["amount"].median()) # ~100x apart -> unit bug`,
      },
      {
        title: 'Contract first, then clean',
        minutes: 22,
        body: `1. Write the contract as a pydantic model (starter below): types, ranges, an enum for region, and amounts in dollars with a sane ceiling.
2. Validate every raw row and COLLECT the failures: a loop that appends (row index, error summary) instead of raising. Print the violations report grouped by field — age and amount should dominate, matching your diagnosis.
3. Now build \`clean(df)\` as a pure function applying the repairs in a fixed order: sentinels→NaN, dedupe (log count), unit-fix source B (divide by 100), null out impossible ages, median-impute age WITH an \`age_was_missing\` flag, mode-impute region. Log rows and repair counts at every step.
4. Re-validate the CLEANED frame against the contract: violations should drop to zero. That before/after pair of numbers — 212 violations → 0 — is the headline of a cleaning report.
5. Assert the endgame: no NaNs in contracted columns, amounts unimodal (p99/median under ~30), no duplicate customer_ids. The asserts are the contract\'s enforcement arm inside the pipeline.
6. Rerun the whole script and confirm identical output — the raw frame was never mutated (clean() returned a copy), so the pipeline is rerunnable forever.`,
        code: `import numpy as np
import pandas as pd
from pydantic import BaseModel, Field, ValidationError
from typing import Literal

class CustomerRow(BaseModel):
    customer_id: int = Field(gt=0)
    age: float = Field(ge=18, le=110)
    region: Literal["north", "south", "east", "west"]
    amount: float = Field(gt=0, lt=2000)   # dollars, sane ceiling

def violations(frame):
    report = []
    for i, row in enumerate(frame[["customer_id", "age", "region", "amount"]]
                            .to_dict("records")):
        try:
            CustomerRow(**row)
        except ValidationError as e:
            for err in e.errors():
                report.append((i, err["loc"][0], str(row[err["loc"][0]])[:12]))
    return pd.DataFrame(report, columns=["row", "field", "value"])

bad = violations(df)
print("violations by field:\\n", bad.field.value_counts())

def clean(raw):
    out = raw.copy()
    out["age"] = out["age"].replace(-999, np.nan)
    out["region"] = out["region"].replace("unknown", np.nan)
    n0 = len(out); out = out.drop_duplicates(subset="customer_id", keep="first")
    print(f"dedupe: dropped {n0 - len(out)}")
    out.loc[out.source == "B", "amount"] /= 100
    out.loc[out.age > 110, "age"] = np.nan
    out["age_was_missing"] = out["age"].isna()
    out["age"] = out["age"].fillna(out["age"].median())
    out["region"] = out["region"].fillna(out["region"].mode()[0])
    return out

cleaned = clean(df)
print("violations after clean:", len(violations(cleaned)))`,
      },
    ],
    practice: [
      {
        title: 'The unit trap, solo',
        minutes: 18,
        body: `You receive a payments extract (build it seeded: 600 rows, columns \`["payment_id", "provider", "amount"]\`, providers "stripe" and "legacy") where ONE provider reports in cents — but this time nobody told you which, or whether it is true at all.

Your goals: (1) detect the problem from the data alone — a histogram of log10(amount) shows two humps; quantify the separation (median by provider, ratio ≈ 100); (2) state the evidence for which provider is in cents in two sentences (magnitude ratio + which range is plausible for real payments); (3) fix it, then PROVE the fix: the combined log-histogram is unimodal and the provider medians agree within noise; (4) add the regression guard — an assert on the median ratio being within [0.5, 2] — that would catch this bug in next month's file automatically.

Hints: np.log10 makes multiplicative gaps additive (Day 58's log-normal lesson); the proof step matters as much as the fix — "I divided by 100" is not evidence the data is now right. This exact bug, in production, is a mispriced invoice.`,
      },
    ],
    project: {
      title: 'clean.py + the cleaning report',
      brief: `Assemble today into the deliverable shape: \`clean.py\` with three parts — \`generate_raw()\` (the seeded dirty dataset), \`validate(df)\` returning a violations DataFrame, and \`clean(raw)\` as a pure, logged function — plus \`cleaning_report.md\`: the four-row symptom→cause→repair table from guided 1, the before/after violation counts, row counts at each stage, and a three-sentence "garbage-in economics" paragraph for a stakeholder (what the unit bug would have cost downstream, why the contract now catches it monthly, what the supplier should fix at the source). Commit both — Day 70's checkpoint requires exactly this cleaning evidence, and Day 83's churn project reuses clean.py's structure verbatim.`,
      rubric: [
        'clean() is pure (never mutates raw), logged, and rerunnable with identical output',
        'Validation report shows nonzero violations on raw and zero on cleaned',
        'Missing-data choices are per-column and justified in the report (median vs mode vs flag)',
        'The was_missing indicator column exists and is documented as a feature candidate',
        'Report includes the symptom→cause→repair table and the economics paragraph',
        'Committed to the practice repo',
      ],
    },
    mistakes: [
      'Imputing before investigating WHY values are missing. Missingness concentrated in a segment (or caused by the value itself) biases naive imputation — mechanism first, method second.',
      'Dropping every row with any NaN. On wide tables this can discard most of the data and biases toward complete-record customers — the opposite of random.',
      'Mean-imputing skewed columns. The mean is tail-dragged (Day 58); the median is the defensible default for numerics.',
      'Treating sentinels as values: averaging ages with -999s in them, or counting "unknown" as a region. Convert to NaN first, then decide.',
      'Deduplicating on the full row when the KEY is what must be unique — two rows with the same ticket_id but different timestamps need a keep-policy, not drop_duplicates() defaults.',
      'Cleaning in an interactive session and overwriting the raw file. If the raw data is gone, so is your ability to fix your own mistakes — raw is read-only, cleaning is a script.',
    ],
    quiz: [
      {
        q: 'csat is missing mostly for basic-tier customers (as found yesterday). The best-practice first move is…',
        o: [
          'Global mean imputation — fast and unbiased',
          'Drop all rows with missing csat',
          'Treat the mechanism: impute within segment (or add a was_missing flag), because missingness depends on tier and naive global imputation inherits the bias',
          'Delete the csat column',
        ],
        x: 2,
        w: 'This is missingness conditional on an observed variable: handle it segment-aware and keep an indicator. Global imputation drags basic-tier estimates toward the overall mean; dropping rows biases toward tiers that answer.',
        revisit: 68,
      },
      {
        q: 'A histogram of a money column shows two clean humps about 100× apart, split perfectly by source system. Diagnosis?',
        o: [
          'Two customer segments — keep both humps',
          'A unit mix-up (cents vs dollars) between sources: fix per source, then assert the medians re-agree',
          'Log-normal data behaving normally',
          'Outliers to be capped',
        ],
        x: 1,
        w: 'A constant multiplicative gap aligned with data source is the unit-bug signature. The fix is per-source conversion plus a regression assert so next month\'s file cannot re-import the bug.',
        revisit: 68,
      },
      {
        q: 'Why validate rows with a pydantic contract that COLLECTS errors instead of raising on the first one?',
        o: [
          'Raising is slower',
          'The full violations report (counts by field, example rows) is the actionable deliverable — for your pipeline and for the data supplier; die-on-first hides the other 211 problems',
          'pydantic cannot raise inside loops',
          'Collecting errors fixes the data automatically',
        ],
        x: 1,
        w: 'One bad row aborting the run tells you almost nothing. The aggregated report quantifies the dirt, drives the repair order, and is something a supplier or teammate can act on.',
        revisit: 68,
      },
    ],
    resources: [
      { label: 'pandas User Guide — working with missing data', url: 'https://pandas.pydata.org/docs/user_guide/index.html', type: 'docs', time: '25 min' },
      { label: 'Kaggle Learn — Data Cleaning (interactive)', url: 'https://www.kaggle.com/learn', type: 'course', time: '30 min' },
      { label: 'Google ML Crash Course — data preparation modules', url: 'https://developers.google.com/machine-learning/crash-course', type: 'course', time: '20 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: Day 67 cards (EDA stages, leakage)', minutes: 10 },
      { activity: 'ELI5 + tech read: mechanisms, repair bench, contracts', minutes: 20 },
      { activity: 'Guided: diagnose the dirt + contract-then-clean', minutes: 42 },
      { activity: 'Practice: the unit trap, solo', minutes: 18 },
      { activity: 'Project: clean.py + cleaning report', minutes: 20 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'All four planted problems diagnosed with the symptom→cause→repair table',
      'Pydantic contract written; violations report shows raw count → 0 after cleaning',
      'Unit trap solved solo with detection evidence, proof of fix, and a regression assert',
      'clean.py + cleaning_report.md committed; quiz ≥ 2/3',
    ],
    connections: {
      back: 'You are repairing exactly what Day 67\'s interview uncovered; the pipeline shape (pure stages, logged counts) is Day 66\'s wrangle.py; the pydantic contract is Day 41\'s request validation aimed at data files; median-over-mean is Day 58.',
      forward: 'Day 69 builds features on the cleaned output (the was_missing flag becomes a feature; imputation moves INSIDE the pipeline to avoid leakage). Day 70\'s report requires the cleaning evidence, and Day 119\'s capstone ingest validates documents with this same contract pattern.',
    },
    flashcards: [
      { f: 'The three missing-data mechanisms?', b: 'Random (benign), conditional on observables (impute segment-aware), caused by the value itself (no imputation fixes it — flag and reason).' },
      { f: 'Default numeric imputation and why?', b: 'Median + a was_missing indicator — the mean chases heavy tails; the flag preserves possible signal.' },
      { f: 'Sentinel handling order?', b: 'Detect (value_counts spikes, impossible values) → convert to real NaN → then apply the missing-data strategy.' },
      { f: 'Unit-bug signature and fix?', b: 'Bimodal histogram, humps a constant factor apart, split by source. Fix per source; assert medians re-agree.' },
      { f: 'The four outlier verdicts?', b: 'Fix (typo), cap/winsorize, keep (whale), or flag for humans. Never silent deletion.' },
      { f: 'The two pipeline commandments?', b: 'Raw data is read-only; cleaning is a logged, rerunnable script with a validation contract at the end.' },
    ],
    deepDive: [
      { label: 'Great Expectations & pandera — data contracts at scale', note: 'Today\'s pydantic pattern industrialized: declarative expectation suites, data docs, and CI integration for datasets. Skim the concepts — the capstone\'s ingest checks (Day 119) borrow this shape.' },
    ],
  },
  {
    id: 'd069', day: 69, week: 10, phase: 4, kind: 'lesson',
    title: 'Feature Engineering',
    analogy: 'Cutting ingredients so the pan can cook them',
    objectives: [
      'Encode categoricals appropriately: one-hot vs ordinal vs target encoding, with the trade-offs',
      'Scale numeric features and state which model families care and which do not',
      'Extract predictive features from datetimes (including cyclical encodings) and raw text columns',
      'Explain train/test fitting discipline: transformers learn on train only',
      'Build a leak-proof preprocessing pipeline with sklearn ColumnTransformer',
    ],
    prereqs: [
      { day: 68, label: 'Cleaned, validated data' },
      { day: 64, label: 'NumPy vectorized transforms' },
      { day: 67, label: 'EDA — which signals are real' },
    ],
    eli5: `A pan can only cook what fits in it. Nobody sears a whole pumpkin; you cut it into pieces sized for the heat to reach the middle. Models are the pan: they eat fixed-size rows of numbers, and they can only "reach" patterns that the cut exposes. A raw timestamp is a whole pumpkin — one giant number the model can barely bite. Cut it into hour-of-day, day-of-week, is-weekend, and suddenly the pattern ("support tickets spike Monday mornings") is bite-sized. Feature engineering is knife work: same ingredients, cut so the learning can cook.

Different dishes need different cuts. Category labels like "pro/basic/enterprise" become separate yes/no columns (one-hot) — unless the categories have a true order. Numbers on wildly different scales (tenure 1–60, spend 20–4,000) get standardized so distance-based learners don't think spend is 60× more important. And one knife rule is absolute, the same one from yesterday's kitchen: you season from the TRAIN shelf only. If your scaler learns the mean of the whole dataset — test rows included — your model has tasted the exam. The fix is not vigilance, it is machinery: a pipeline object that physically cannot fit on data you didn't hand it.`,
    why: `On tabular data, better features beat fancier models — the winning move in Day 77's mini-competition and Day 83's churn project is almost always a feature, not a hyperparameter. The leakage discipline is career-critical: "fit the scaler on everything" is the most common silent bug in applied ML, inflating offline metrics and detonating in production. And the concept generalizes: prompt context selection (Day 108) and chunking for RAG (Day 114) are feature engineering for LLMs — deciding what the model gets to see, cut to the size it can digest.`,
    tech: `### Categoricals

**One-hot** (\`OneHotEncoder\`): one 0/1 column per category — the default for low cardinality (≤ ~15). Set \`handle_unknown="ignore"\` so an unseen category at inference maps to all-zeros instead of crashing. **Ordinal** (\`OrdinalEncoder\`): a single integer column — ONLY for true orders (basic < pro < enterprise); on unordered categories it invents a fake ranking that distance- and linear-models will obediently believe. **Target encoding** (replace category with the target mean for that category) is powerful for high cardinality but is a leakage machine unless computed out-of-fold — file under "later, carefully" (Day 77 revisits). High-cardinality IDs (user_id, zip) do NOT get one-hot into thousands of columns.

### Numerics, datetimes, text

**Scaling**: \`StandardScaler\` (mean 0, sd 1) or \`MinMaxScaler\`. Distance-based (k-NN, k-means), gradient-based (linear/logistic, neural nets — Day 71+) care a lot; tree-based models (Day 73–74) are split-based and scale-indifferent. **Skewed** amounts often benefit from log1p first (Day 58's tails). **Datetimes** decompose: hour, day-of-week, month, is_weekend, days-since-event; cyclical values need the sin/cos trick — encode hour as sin(2πh/24) and cos(2πh/24) so 23:00 and 01:00 are neighbors, as they are in reality. **Text** columns yield cheap features before embeddings exist in your toolkit (Day 92): length, word count, has_digits, exclamation count. **Interactions** (spend ÷ tenure = spend rate) and **binning** (tenure → 0–12/13–24/25+) inject domain knowledge linear models cannot invent.

### The discipline, mechanized

Transformers are learned: the scaler's mean, the encoder's category list, the imputer's median are all PARAMETERS — and parameters must come from training data only. \`fit_transform(X_train)\` then \`transform(X_test)\`; never fit on the full dataset. sklearn's **Pipeline** chains steps and **ColumnTransformer** routes columns (numerics → impute+scale; categoricals → impute+one-hot) into one object with a single fit/transform contract — making the right thing automatic, surviving into Day 82's production pipelines, and giving \`get_feature_names_out()\` for inspecting what the model actually eats.`,
    viz: null,
    guided: [
      {
        title: 'Encode and scale by hand — and watch the leak happen',
        minutes: 20,
        body: `1. Paste the starter — the cleaned churn-style dataset from this week, seeded, split 80/20 into train/test FIRST (before any transformer touches it).
2. One-hot the \`plan\` column with \`OneHotEncoder(handle_unknown="ignore")\`: fit on train, transform both. Print the feature names. Then simulate the future: transform a row with plan="platinum" (never seen) and confirm it becomes all-zeros instead of an exception.
3. Ordinal-encode plan as basic=0, pro=1, enterprise=2 — defensible, there is a real order. Now ordinal-encode \`region\` alphabetically and write one sentence on what a linear model would wrongly conclude ("west is 3× more region than east").
4. Scale \`monthly_spend\` with StandardScaler fit on TRAIN; check test-transformed mean is NOT exactly 0 (it shouldn't be — test is scaled by train's parameters).
5. Now commit the classic crime deliberately: fit the scaler on the FULL dataset, and compare the transformed train values against the honest version. The difference is small — which is exactly why this bug survives review. Write the rule: the size of the leak is not the point; the direction of information flow is.`,
        code: `import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder, StandardScaler

rng = np.random.default_rng(seed=69)
N = 1000
df = pd.DataFrame({
    "plan": rng.choice(["basic", "pro", "enterprise"], size=N, p=[0.55, 0.33, 0.12]),
    "region": rng.choice(["north", "south", "east", "west"], size=N),
    "tenure_months": rng.integers(1, 60, size=N),
    "monthly_spend": np.round(rng.lognormal(3.4, 0.8, size=N), 2),
    "signup_hour": rng.integers(0, 24, size=N),
})
df["churned"] = rng.random(N) < np.clip(
    0.45 - 0.005 * df.tenure_months + 0.1 * (df.plan == "basic"), 0.05, 0.9)

train, test = train_test_split(df, test_size=0.2, random_state=69)

ohe = OneHotEncoder(handle_unknown="ignore", sparse_output=False)
ohe.fit(train[["plan"]])
print(ohe.get_feature_names_out())
unseen = pd.DataFrame({"plan": ["platinum"]})
print("unseen category ->", ohe.transform(unseen))   # all zeros, no crash

scaler = StandardScaler().fit(train[["monthly_spend"]])
test_scaled = scaler.transform(test[["monthly_spend"]])
print("test mean after train-fit scaling:", test_scaled.mean().round(3))

leaky = StandardScaler().fit(df[["monthly_spend"]])   # the crime
print("honest vs leaky train mean:",
      scaler.mean_[0].round(2), "vs", leaky.mean_[0].round(2))`,
      },
      {
        title: 'ColumnTransformer — the whole kitchen in one object',
        minutes: 22,
        body: `1. Add the datetime knife work as plain pandas first (features are created before the transformer; the transformer handles impute/scale/encode): \`hour_sin = sin(2π·signup_hour/24)\`, \`hour_cos = cos(...)\`. Verify the payoff: compute the distance between hour 23 and hour 1 in raw form (22 apart) vs sin/cos form (close) — the encoding restored the clock\'s geometry.
2. Add two more cut-by-hand features: \`spend_per_tenure = monthly_spend / tenure_months\` (an interaction) and \`tenure_bin\` via pd.cut (0–12 / 13–24 / 25+).
3. Build the ColumnTransformer: numeric columns → SimpleImputer(median) + StandardScaler in a Pipeline; categorical columns (plan, region, tenure_bin) → SimpleImputer(most_frequent) + OneHotEncoder(handle_unknown="ignore"). Passthrough hour_sin/hour_cos (already in range).
4. fit_transform on train, transform on test. Print the output shape and \`get_feature_names_out()\` — read the list aloud; this is EXACTLY what the model will eat, and being able to name every column is a debugging superpower.
5. Prove the leak-proofing: the transformer, once fit, contains train-derived parameters only — print \`named_transformers_\` internals (the scaler\'s mean_, the encoder\'s categories_). One object, one fit, zero opportunities to season from the test shelf.
6. Note what did NOT go in: refund_issued (Day 67\'s leak) is excluded by design, and the exclusion is documented in the feature list.`,
        code: `import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import OneHotEncoder, StandardScaler

for frame in (train, test):
    frame["hour_sin"] = np.sin(2 * np.pi * frame.signup_hour / 24)
    frame["hour_cos"] = np.cos(2 * np.pi * frame.signup_hour / 24)
    frame["spend_per_tenure"] = frame.monthly_spend / frame.tenure_months
    frame["tenure_bin"] = pd.cut(frame.tenure_months, bins=[0, 12, 24, 60],
                                 labels=["0-12", "13-24", "25+"])

num_cols = ["tenure_months", "monthly_spend", "spend_per_tenure"]
cat_cols = ["plan", "region", "tenure_bin"]
cyc_cols = ["hour_sin", "hour_cos"]

pre = ColumnTransformer([
    ("num", Pipeline([("imp", SimpleImputer(strategy="median")),
                      ("sc", StandardScaler())]), num_cols),
    ("cat", Pipeline([("imp", SimpleImputer(strategy="most_frequent")),
                      ("oh", OneHotEncoder(handle_unknown="ignore"))]), cat_cols),
    ("cyc", "passthrough", cyc_cols),
])

X_train = pre.fit_transform(train)
X_test = pre.transform(test)          # transform ONLY — no fitting on test
print("train:", X_train.shape, " test:", X_test.shape)
print(list(pre.get_feature_names_out()))
print("scaler means (train-derived):",
      pre.named_transformers_["num"].named_steps["sc"].mean_.round(2))`,
      },
    ],
    practice: [
      {
        title: 'The leak hunt',
        minutes: 18,
        body: `Three preprocessing setups cross your code review. For each: leak or clean? Name the information flow, rank severity, and write the fix.

A. \`scaler.fit(X)\` on the full dataset, then train/test split, then a model trained on the scaled train half.
B. Target encoding: \`plan_churn_rate = df.groupby("plan")["churned"].mean()\` computed on ALL rows, mapped onto both train and test as a feature.
C. \`imputer.fit(X_train)\`; \`X_test = imputer.transform(X_test)\`; model evaluated on X_test.

Then the transfer question: your golden-set eval (Day 134 foreshadow) uses few-shot examples in the prompt. What is the analogous crime, and what is the analogous rule? (Answer shape: examples drawn from the eval set itself = fitting on test; the rule: eval cases must never appear in the prompt.)

Hints: B is the worst — the feature literally contains averaged test-set TARGETS, not just statistics of inputs; A is real but mild (input statistics only); C is clean and is the exact pattern the ColumnTransformer mechanizes. Severity follows how much target information crosses the line.`,
      },
    ],
    project: {
      title: 'features.py — the feature factory',
      brief: `Build \`features.py\` in your practice repo, structured for reuse in Days 70, 71, and 83: \`add_features(df)\` (pure function: cyclical hour, spend_per_tenure, tenure_bin, text-length features if a text column exists, the Day 68 was_missing flags kept), \`build_preprocessor(num_cols, cat_cols, passthrough)\` returning the ColumnTransformer, and a \`FEATURES.md\` block (docstring or file) listing every output feature with one line each: source column, transform, and why it should carry signal — plus an explicit EXCLUDED section naming refund_issued and the reason. Demo at the bottom: split, fit on train, transform both, print shapes and feature names. Commit it.`,
      rubric: [
        'add_features is pure and covered by at least three asserts (shapes, ranges, no NaN introduced)',
        'Preprocessor fits on train only in the demo; test is transform-only',
        'Cyclical encoding verified (hour 23 and hour 1 are near neighbors in sin/cos space)',
        'Feature documentation lists every column with a one-line rationale',
        'EXCLUDED section names the leak and why',
        'Committed to the practice repo',
      ],
    },
    mistakes: [
      'Fitting any transformer (scaler, imputer, encoder) on the full dataset before splitting. Information flows from test into training — offline metrics inflate, production deflates. Split first, fit on train, always.',
      'Ordinal-encoding unordered categories. The model reads the integers as magnitudes — "west > east" — and linear/distance models act on the fiction. One-hot unless a true order exists.',
      'One-hot encoding a 10,000-value ID column into 10,000 features. High cardinality wants target encoding (done out-of-fold), frequency encoding, or exclusion.',
      'Scaling everything for a tree model and believing it mattered. Trees split on thresholds; scaling is a no-op for them — know WHICH families care (distance- and gradient-based).',
      'Naive target encoding computed on all rows — averaged test TARGETS become a training feature; the most concentrated leak in tabular ML.',
      'Dropping the datetime column instead of decomposing it. The signal ("weekend signups churn more") lives in the parts, not the raw timestamp.',
    ],
    quiz: [
      {
        q: 'Why must StandardScaler be fit on the training split only?',
        o: [
          'Fitting on everything is slower',
          'Test-set statistics leaking into training inflates offline metrics — the model has partially "seen" the exam; fit on train, transform test',
          'The test set has different columns',
          'sklearn raises an error otherwise',
        ],
        x: 1,
        w: 'The scaler\'s mean/sd are learned parameters. Learning them from test rows lets test information shape training — a small leak here, a catastrophic one with target encoding, but the same broken direction of information flow.',
        revisit: 69,
      },
      {
        q: 'Encoding hour-of-day as sin(2πh/24) and cos(2πh/24) exists to…',
        o: [
          'Compress 24 values into 2 columns',
          'Make 23:00 and 01:00 near neighbors, matching the clock\'s circular geometry that a raw 0–23 integer breaks',
          'Normalize the feature to mean zero',
          'Help tree models split on time',
        ],
        x: 1,
        w: 'On a raw scale, 23 and 1 are 22 apart; in reality they are 2 hours apart. The sin/cos pair embeds the circle so cyclic proximity is preserved.',
        revisit: 69,
      },
      {
        q: 'Which model family is essentially indifferent to feature scaling?',
        o: [
          'k-nearest neighbors',
          'Logistic regression trained by gradient descent',
          'Decision trees and their ensembles — splits are threshold-based and monotone transforms of a feature do not change them',
          'Neural networks',
        ],
        x: 2,
        w: 'Trees ask "is x > t?" — rescaling x just moves t. Distance-based (k-NN) and gradient-based (linear, logistic, neural nets) learners are the ones that need scaled inputs.',
        revisit: 69,
      },
    ],
    resources: [
      { label: 'scikit-learn — preprocessing data (official user guide)', url: 'https://scikit-learn.org/stable/modules/preprocessing.html', type: 'docs', time: '30 min' },
      { label: 'scikit-learn User Guide — pipelines & ColumnTransformer', url: 'https://scikit-learn.org/stable/user_guide.html', type: 'docs', time: '20 min' },
      { label: 'Kaggle Learn — Feature Engineering (interactive)', url: 'https://www.kaggle.com/learn', type: 'course', time: '30 min' },
      { label: 'Google ML Crash Course — feature engineering modules', url: 'https://developers.google.com/machine-learning/crash-course', type: 'course', time: '20 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: Day 68 cards (mechanisms, contracts)', minutes: 10 },
      { activity: 'ELI5 + tech read: encodings, scaling, the fitting discipline', minutes: 20 },
      { activity: 'Guided: encode/scale by hand + ColumnTransformer', minutes: 42 },
      { activity: 'Practice: the leak hunt', minutes: 18 },
      { activity: 'Project: features.py feature factory', minutes: 20 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'Unseen-category behavior and the ordinal-encoding fiction both demonstrated',
      'ColumnTransformer built; feature names printed and every column explainable',
      'Leak hunt: all three setups classified correctly with severity ranking',
      'features.py committed with documentation and the EXCLUDED section; quiz ≥ 2/3',
    ],
    connections: {
      back: 'The features stand on Day 68\'s cleaned data (the was_missing flag survives as signal); log1p-before-scaling is Day 58\'s tails; vectorized sin/cos columns are Day 64\'s broadcasting; and the excluded refund_issued is Day 67\'s leak, formally banished.',
      forward: 'Day 71 feeds this exact matrix into sklearn models — your first fit/predict runs on today\'s output. Day 77\'s competition is won with feature work, Day 82 wraps preprocessor+model into one deployable pipeline, and Day 92 reframes features as learned embeddings.',
    },
    flashcards: [
      { f: 'One-hot vs ordinal encoding?', b: 'One-hot: one 0/1 column per category (unordered, low cardinality). Ordinal: single integer — ONLY for true orders.' },
      { f: 'The transformer fitting rule?', b: 'fit_transform(train), transform(test). Scaler means, encoder categories, imputer medians are parameters — learned from train only.' },
      { f: 'Which models need scaling, which do not?', b: 'Distance- and gradient-based (k-NN, linear/logistic, neural nets) need it; trees/ensembles are threshold-based and do not.' },
      { f: 'Cyclical encoding for hour/month?', b: 'sin(2πv/period) and cos(2πv/period) — preserves that 23:00 borders 01:00.' },
      { f: 'Why is naive target encoding the worst leak?', b: 'It maps averaged TARGET values (including test rows) into a feature — answer-key information, concentrated.' },
      { f: 'What does ColumnTransformer buy you?', b: 'Per-column-type pipelines in one object with a single fit/transform contract — leak-proofing by construction.' },
    ],
    deepDive: [
      { label: 'Out-of-fold target encoding', note: 'The safe version of the powerful trick: encode each row using target means computed WITHOUT that row\'s fold. Day 77\'s competition is where you may want it; read the idea now so it is not magic then.' },
    ],
  },
  {
    id: 'd070', day: 70, week: 10, phase: 4, kind: 'review',
    title: 'Week 10 Checkpoint: EDA Report',
    analogy: 'The data interview writeup',
    objectives: [
      'Recall the week\'s core idioms (NumPy semantics, pandas selection, join audits, cleaning contracts) from memory',
      'Execute the full pipeline — EDA → cleaning → feature plan — on a dataset you have never touched',
      'Deliver a stakeholder-readable report with 5 defensible findings in the sentence format',
      'Self-grade against the rubric and map every gap to a revisit day',
    ],
    prereqs: [
      { day: 64, label: 'NumPy in anger' },
      { day: 66, label: 'Wrangling & join audits' },
      { day: 67, label: 'EDA checklist' },
      { day: 68, label: 'Cleaning & validation' },
      { day: 69, label: 'Feature engineering' },
    ],
    eli5: `A journalist's interview only becomes journalism when the story is written — and written for readers, not for other journalists. Today you take everything Week 10 built and produce the writeup: a fresh dataset you have never seen, interviewed, cleaned, and turned into findings a business person can act on. No new techniques. The test is whether the checklist lives in your hands or only in your notes.

The order of the day mirrors how skill actually consolidates. First, retrieval drills: write the week's idioms from memory — the broadcasting rule, the join audit, the fitting discipline — because fetching them cold is what cements them, and Day 63 proved that re-reading is a placebo. Then the main event: the checkpoint project, done timeboxed like a real engagement. The constraint that makes it professional rather than academic: every finding must be a sentence a skeptic can check, every cleaning decision must be logged and justified, and the feature plan must name what is EXCLUDED and why. That last habit — documenting what you did NOT use — is what separates an analysis someone can trust from a notebook someone must audit.`,
    why: `This checkpoint is the program's first full FDE-shaped deliverable: ambiguous data in, stakeholder-readable insight out, with the engineering receipts attached. It is the dress rehearsal for Day 77's model card, Day 83's churn project report, and Day 105's non-technical explainer — and the EDA-report format is literally what a customer engagement's first week produces. The retrieval drills matter for a nearer reason: Week 11 starts fitting models tomorrow, and it assumes this week's idioms are reflexes, not references.`,
    tech: `### The recall targets

Before the project, drill the seven idioms that must be reflexes: (1) the broadcasting rule and the (n,) vs (n,1) trap; (2) view-vs-copy and the axis-that-disappears; (3) loc/iloc and the chained-indexing rule; (4) the join audit trio — counts before/after, validate=, indicator=; (5) sentinel→NaN→strategy ordering; (6) the contract pattern (validate, collect, report); (7) fit-on-train-only. Each drill is closed-book: write it, run it, diff against your notes, card the misses.

### The checkpoint project, specified

Pick a dataset you have NOT worked with: any public tabular dataset you can download as CSV (a city's open-data portal, a Kaggle dataset, seaborn's built-ins) — or, to stay fully offline, the provided seeded generator (an e-commerce sessions table with planted dirt and one planted leak). Fresh data is the point: the muscle being tested is approach, not memory of this week's toy tables.

Deliverable: \`eda_report.md\` for a named stakeholder (e.g. "Head of Support") plus a \`report_code/\` folder that reproduces every number. Required sections: (1) **Data overview** — what it is, grain (what one row means), size, time span; (2) **Quality assessment** — missingness map, sentinels, duplicates, the symptom→cause→repair table with violation counts before/after; (3) **Five findings** — sentence format (claim + number + denominator + comparison), each reproducible by one named script/section, at least one honest negative; (4) **Feature plan** — 8+ candidate features with one-line rationales, the encodings/scalings planned, and an EXCLUDED list with reasons (leaks, post-outcome artifacts, high-cardinality IDs); (5) **Risks & next steps** — what you could not verify, what data you would request.

The grading standard is the professional one: a reader who runs your code gets your numbers; a reader who checks your claims finds the denominators; a reader who knows nothing technical still learns the five things that matter. Timebox hard — 75 minutes of focused execution beats an unfinished masterpiece, and shipping within a timebox is itself part of the FDE skill.`,
    viz: null,
    guided: [
      {
        title: 'Idiom sprint — the week from memory',
        minutes: 20,
        body: `1. Closed book, blank file. Write and RUN, from memory, one minimal working example of each: (a) center a (100, 3) array's columns via broadcasting; (b) demonstrate a slice-view mutation and its .copy() fix; (c) a boolean-mask filter with two ANDed conditions in pandas; (d) a correct .loc write that chained indexing would have botched; (e) a merge with validate="m:1" and indicator=True on two 5-row toy frames; (f) a groupby with named aggregation; (g) fit a StandardScaler on train and transform test.
2. Diff each against your Week 10 files. Green / yellow / red as on Day 63.
3. For every yellow/red: write a flashcard AND say aloud the production consequence of getting it wrong (row explosion double-counts revenue; leaked scaler inflates metrics…). Consequences are the glue.
4. Time yourself. Under 15 minutes with ≤ 2 yellows is fluent; over 20 means schedule a 30-minute idiom review before Day 71.`,
      },
      {
        title: 'Checklist reconstruction + report skeleton',
        minutes: 15,
        body: `1. From memory, write the seven EDA interview stages and the three leakage-interrogation questions. Diff against your Day 67 \`eda_checklist.md\` — card any stage you dropped.
2. From memory, write the cleaning pipeline's five commandments (raw is read-only; script everything; log counts; contract at the end; mechanism before method). Diff against Day 68's report.
3. Now set up the checkpoint: create \`eda_report.md\` with the five required section headers and a named stakeholder, and \`report_code/\` with an empty \`run_all.py\`. Choose your dataset (public CSV or the seeded generator) and write ONE sentence: what decision could this data inform, and for whom? That sentence is your report's north star — every finding must serve it.`,
      },
    ],
    practice: [
      {
        title: 'Pre-flight: interrogate the fresh dataset',
        minutes: 15,
        body: `Before the full build, run the 15-minute reconnaissance you would do in a customer's conference room: load the fresh dataset, run the identity and gaps passes (shape, dtypes, head, isna map, value_counts on key columns), and write down — in exactly three bullets — the three biggest risks you can already see (a suspicious column, a skew, a missingness pattern, a possible unit issue, a candidate leak).

Constraints: 15 minutes, no cleaning yet, no plots beyond two quick histograms. The skill being drilled is triage — deciding where the report's effort should go BEFORE spending it. If you chose the seeded generator, expect to find at least one planted issue in this pass; if you chose a public dataset, whatever you find is real, which is better.

Hints: grain first ("what does one row mean?") — misunderstanding grain invalidates every later number; then the columns a stakeholder would ask about first.`,
      },
    ],
    project: {
      title: 'The Week 10 checkpoint: a stakeholder-ready EDA report',
      brief: `Execute the full pipeline on your fresh dataset in a hard 75-minute timebox: EDA per your checklist, cleaning with logged repairs and a validation before/after count, and the feature plan with encodings and exclusions — delivered as \`eda_report.md\` + \`report_code/run_all.py\` (which reproduces every number in the report from the raw file in one command). If you use the offline option, generate it with: \`rng = np.random.default_rng(seed=70)\` — 2,000 e-commerce sessions with columns [session_id, ts (string dates), device, pages_viewed, duration_min (log-normal), revenue (zero-inflated), converted], then plant: 3% "unknown" devices, 25 duplicate sessions, revenue in cents for device=="mobile", and a \`discount_applied_at_checkout\` column generated FROM converted (the leak). Commit everything, then self-grade against the rubric and write your gap map (miss → revisit day).`,
      rubric: [
        'run_all.py reproduces every number in the report from raw data in one command',
        'Quality section has the symptom→cause→repair table and validation counts before/after cleaning',
        'Five findings in sentence format, each with number + denominator + comparison, including one honest negative',
        'The planted (or discovered) leak is identified and sits in the EXCLUDED list with the interrogation reasoning',
        'Feature plan names 8+ features with rationales and correct encoding/scaling choices',
        'Report readable by a non-technical stakeholder: no unexplained jargon, findings ranked by decision-relevance',
      ],
    },
    mistakes: [
      'Skipping the recall drills to "save time for the project". The drills are why next week\'s modeling flows; the project alone only exercises what you already retrieve easily.',
      'Choosing a dataset you already know. Familiarity hides the very gaps this checkpoint exists to expose — fresh data or the provided generator, no exceptions.',
      'Blowing the timebox on plot polish. Stakeholders act on ranked sentences with numbers; a report that is 80% done everywhere beats one perfect histogram.',
      'Reporting findings without denominators or with precision the n cannot support — "conversion is 3.847%" from 400 sessions is Day 60 amnesia.',
      'Cleaning interactively and reporting numbers your run_all.py cannot reproduce. If the script and the report disagree, the report is fiction.',
      'Writing the feature plan without an EXCLUDED section. What you left out (and why) is half the evidence that you can be trusted with the modeling next week.',
    ],
    quiz: [
      {
        q: 'You merge sessions (2,000 rows) with a device-metadata table and end with 2,041 rows. Which single keyword would have turned this silent bug into a loud error?',
        o: [
          'indicator=True',
          'how="inner"',
          'validate="m:1" — it raises when the right table\'s keys are not unique',
          'sort=True',
        ],
        x: 2,
        w: 'Row growth on an m:1-intended merge means duplicate keys on the right — validate="m:1" makes pandas raise immediately. indicator shows match categories but does not stop the explosion. If missed, revisit Day 66.',
        revisit: 66,
      },
      {
        q: 'A column in the fresh dataset predicts the target almost perfectly. Per this week\'s discipline, it belongs…',
        o: [
          'At the top of the feature plan — strongest signal wins',
          'In the EXCLUDED list pending interrogation: when is the value created, could it exist at prediction time, does it survive a time-ordered split?',
          'In the report\'s headline finding as a success',
          'Nowhere — delete the column silently',
        ],
        x: 1,
        w: 'Too-clean separation is a provenance question. The three interrogation questions (Day 67) decide leak vs legitimate; until they pass, the column is excluded and documented — never silently deleted, never blindly used.',
        revisit: 67,
      },
      {
        q: 'Your report says "mobile revenue looks 100× higher than desktop". Before publishing this as a finding, this week says to first suspect…',
        o: [
          'Mobile users genuinely spend 100× more',
          'A unit mix-up (cents vs dollars) split by source/device — check for the two-hump log-histogram, fix per source, and re-assert medians agree',
          'An outlier to cap',
          'A correlation-causation problem',
        ],
        x: 1,
        w: 'A clean constant multiplicative gap aligned with a system boundary is Day 68\'s unit-bug signature — and it is one of the planted issues in the offline dataset. 100× real behavior differences are vanishingly rare; unit bugs are Tuesday.',
        revisit: 68,
      },
    ],
    resources: [
      { label: 'pandas User Guide (reference while building)', url: 'https://pandas.pydata.org/docs/user_guide/index.html', type: 'docs', time: '15 min' },
      { label: 'Google Technical Writing — writing for non-specialist readers', url: 'https://developers.google.com/tech-writing', type: 'course', time: '25 min' },
      { label: 'Kaggle Learn — Pandas & Data Cleaning (targeted review of weak spots)', url: 'https://www.kaggle.com/learn', type: 'course', time: '20 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: full Week 10 due deck', minutes: 10 },
      { activity: 'Guided: idiom sprint + checklist reconstruction', minutes: 35 },
      { activity: 'Practice: 15-minute reconnaissance of the fresh dataset', minutes: 15 },
      { activity: 'Project: the EDA report, hard 75-minute equivalent (build core in 50)', minutes: 50 },
      { activity: 'Quiz + self-grade against rubric + gap map', minutes: 10 },
    ],
    completion: [
      'Idiom sprint completed with ≤ 2 yellows (or the review session scheduled)',
      'eda_report.md shipped with all five sections and five sentence-format findings',
      'run_all.py reproduces the report\'s numbers from raw data in one command',
      'Self-grade done: rubric score recorded, every gap mapped to a revisit day',
    ],
    connections: {
      back: 'Everything here is this week compressed: Day 64\'s arrays under Day 65–66\'s pandas, Day 67\'s interview, Day 68\'s contracts, Day 69\'s feature plan. The report-writing bar comes from Day 63\'s "no claim without an interval" standard.',
      forward: 'Tomorrow (Day 71) the feature matrix you planned meets its first model — sklearn fit/predict on exactly this kind of prepared data. Day 77\'s model card and Day 83\'s churn report are this document plus a model; Day 105 and Day 168 push the stakeholder-writing muscle further.',
    },
    flashcards: [
      { f: 'The five sections of an EDA report?', b: 'Data overview (with grain), quality assessment, five findings, feature plan (with EXCLUDED), risks & next steps.' },
      { f: 'What makes a finding "defensible"?', b: 'Claim + number + denominator + comparison, reproducible by a named script. Precision matched to n.' },
      { f: 'Why does the report need an EXCLUDED list?', b: 'What you left out (leaks, IDs, post-outcome columns) and why is the evidence you can be trusted with modeling.' },
      { f: 'First question about any new table?', b: 'The grain: what does one row mean? Misread grain invalidates every downstream number.' },
      { f: 'The reproducibility bar for a data report?', b: 'One command from raw file to every published number. Report ≠ script output → the report is fiction.' },
      { f: 'Why timebox the checkpoint?', b: 'Shipping a complete-enough analysis on deadline is the FDE skill; polish is the enemy of shipped.' },
    ],
    deepDive: [
      { label: 'Read a real Kaggle EDA notebook critically', url: 'https://www.kaggle.com/learn', note: 'Find a highly-voted EDA notebook for any dataset and grade it against your rubric: where are the denominators? The excluded features? The honest negatives? Critiquing others\' EDA is the fastest way to sharpen your own.' },
    ],
  },
];
