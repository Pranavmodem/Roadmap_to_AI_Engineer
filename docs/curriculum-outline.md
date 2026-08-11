# The 180-Day AI Engineer / FDE Curriculum — Master Outline

One hundred eighty days, ~2 focused hours each. Nine phases, twenty-five weeks plus a
five-day finale. Every 7th day is a **review day**: spaced-repetition drills over the
week's flashcards, a re-quiz over weak spots, and a shipped mini-project or assessment.
The capstone — a production docs-QA RAG service — kicks off on Day 119 and threads
through evals (D140), observability (D147), deployment (D154, D161), and hardening
(D176–178) to Demo Day (D180).

Design sources: 2026 AI Engineer / FDE job descriptions and interview guides (RAG,
agents, evals, production systems, and customer-facing delivery dominate hiring),
university curricula (MIT Missing Semester, CS50, CMU 15-445, MIT 6.824, Stanford
lineage courses), and official documentation for every tool taught. All cited
resources are legally free or clearly marked purchase links — no pirated copies.

Format per line: `Dnnn [kind] Title — "analogy" (viz key) : topics`

## Phase 1 — Code Foundations (D1–21, Weeks 1–3)

### Week 1 — Python from zero
- D001 lesson **Your Machine, Your Map** — "packing for the expedition" (viz: null): how the program works (2-hour protocol, spaced repetition, active recall); install Python 3.12+, VS Code, terminal; REPL vs scripts; run and edit your first program; how to ask the AI tutor for hints, not answers.
- D002 lesson **Variables, Types & Control Flow** — "labeled boxes and forks in the road" (viz: cells-vars): binding vs value, int/float/str/bool/None, arithmetic & comparison, truthiness, if/elif/else, while/for, range, break/continue, f-strings, input().
- D003 lesson **Functions, Scope & Modules** — "recipes and kitchens" (viz: null): def, parameters/defaults/*args/**kwargs, return values, LEGB scope, docstrings, imports, stdlib tour (math, random, datetime), `__name__ == "__main__"`, python -m.
- D004 lesson **Collections** — "bookshelves and dictionaries" (viz: cells-index): list/tuple/set/dict, indexing & slicing, mutation vs rebinding, aliasing & shallow copy, comprehensions, iteration patterns, choosing the right structure.
- D005 lesson **Strings, Files & Errors** — "paper trails and safety nets" (viz: null): string methods, encodings gist, pathlib, open/read/write, CSV & JSON, exceptions (try/except/else/finally, raise), EAFP vs LBYL, exit codes.
- D006 lesson **The Terminal & Linux** — "the workshop" (viz: null): filesystem tree, cd/ls/mkdir/cp/mv/rm, cat/less/head/tail, pipes & redirection, grep/find, permissions & chmod, env vars & PATH, man pages, shell scripts (a 10-line script).
- D007 review **Week 1 Checkpoint: CLI Task Tracker** — "first checkpoint": spaced-rep quiz D1–6; mini-project: JSON-persisted CLI task tracker (add/list/done/delete) with functions + error handling; stretch: due dates.

### Week 2 — Objects, iterators, and the time machine
- D008 lesson **Git — Your Time Machine** — "save points for your work" (viz: git-graph): why VCS, init/status/add/commit/log/diff, the three areas (working/staging/history), .gitignore, undoing (restore/reset gist), commit hygiene; put the task tracker under git.
- D009 lesson **Object-Oriented Python I** — "blueprints and houses" (viz: oop-objects): classes vs instances, `__init__` & self, attributes vs methods, `__repr__`/`__eq__`, class vs instance attributes; model the task tracker's Task as a class.
- D010 lesson **Object-Oriented Python II** — "family trees vs Lego" (viz: null): inheritance & method overriding, composition over inheritance, dataclasses, properties, duck typing & protocols gist, when OOP earns its keep (and when functions win).
- D011 lesson **Iterators & Generators** — "conveyor belts" (viz: null): iteration protocol (iter/next), generators & yield, generator expressions, lazy pipelines over big files, itertools tour, memory intuition.
- D012 lesson **Closures, Decorators & Functional Style** — "gift-wrapping functions" (viz: null): first-class functions, closures, writing decorators (timing, retry), functools.wraps & lru_cache, map/filter vs comprehensions, sorted key=, lambda judgment.
- D013 lesson **Regex & Text Processing** — "find-and-replace with superpowers" (viz: null): literal/classes/quantifiers/groups/anchors, re module (search/findall/sub), greedy vs lazy, when NOT to use regex, parsing logs practice; verbose patterns.
- D014 review **Week 2 Checkpoint: Log Analyzer** — "second checkpoint": spaced-rep D8–13; mini-project: OO log analyzer that parses a provided server log with regex, uses generators for streaming, reports top errors/IPs; committed with clean history.

### Week 3 — Engineering habits
- D015 lesson **Clean Code & Type Hints** — "a tidy workshop" (viz: null): naming, small functions, guard clauses, DRY vs premature abstraction, type hints (list[str], Optional, TypedDict gist), mypy mental model, ruff/format; refactor D14 project live.
- D016 lesson **Logging, Config & CLI Ergonomics** — "the flight recorder" (viz: null): logging module (levels/handlers/format, why not print), argparse subcommands, environment-based config, .env files, exit codes & --help UX; upgrade the log analyzer.
- D017 lesson **Packaging & Environments** — "shipping the recipe box" (viz: null): venv, pip, requirements vs pyproject.toml, editable installs, project src layout, entry points (console scripts), semantic versioning, lockfiles gist.
- D018 lesson **Testing I — pytest Fundamentals** — "seatbelts and smoke alarms" (viz: null): why tests, pytest discovery, asserts, arrange-act-assert, parametrize, testing pure functions vs I/O, test naming, running subsets; write tests for the analyzer.
- D019 lesson **Testing II & Debugging** — "the crime-scene kit" (viz: null): fixtures, tmp_path, monkeypatch & mocking judgment, coverage intuition, TDD taste; reading tracebacks deeply, breakpoint()/pdb, bisection, rubber-duck protocol, regression tests from bugs.
- D020 lesson **GitHub Collaboration** — "working on the same house" (viz: null): remotes, push/pull/fetch, branching workflows, merge vs rebase mental model, conflicts hands-on, PRs & review etiquette, issues, README/license, SSH keys, Actions preview.
- D021 review **Week 3 Checkpoint: Ship a Tested Package** — "your first shipped tool": spaced-rep D15–20; project: package the log analyzer (pyproject, console script, pytest suite ≥80% of core, typed, logged), push to GitHub with a real README and a PR you review yourself.

## Phase 2 — CS Core (D22–49, Weeks 4–7)

### Week 4 — Data structures & the pattern toolkit
- D022 lesson **Big O & Complexity** — "two chefs at a wedding" (viz: growth-curves): growth beats stopwatch, O(1)/O(log n)/O(n)/O(n log n)/O(n²), best/avg/worst, space complexity, amortized cost (dynamic array), reading code for complexity.
- D023 lesson **Arrays & Hashing** — "numbered shelves & straight-to-the-page" (viz: hash-buckets): dynamic arrays & resizing, hash functions/buckets/collisions, dict/set internals, load factor, hashing patterns (frequency, dedupe, anagram groups); 3 classics.
- D024 lesson **Two Pointers & Sliding Window** — "closing pincers & the moving spotlight" (viz: two-pointers): sorted two-pointer, fast/slow, fixed & variable windows, window+hashmap; 4 classics solved with a think-aloud protocol.
- D025 lesson **Stacks & Queues** — "tray piles and lunch lines" (viz: stack-ops): LIFO/FIFO, deque, matching brackets, monotonic stack taste, queue for BFS preview, real uses (undo, call stack, task queues); 3 classics.
- D026 lesson **Linked Lists** — "treasure hunts" (viz: linked-list): nodes & pointers, singly/doubly, insert/delete O(1), traversal, reverse a list, detect cycle (fast/slow payoff), LRU cache idea; 3 classics.
- D027 lesson **Recursion & Divide/Conquer** — "Russian dolls" (viz: call-stack): base case & recursive case, call stack mechanics, tree of calls, memoized fib, divide & conquer shape, recursion→iteration, stack overflow; 3 classics.
- D028 review **Week 4 Checkpoint: Pattern Drill** — "the toolkit test": spaced-rep D22–27; timed drill: 4 problems (hashing, window, stack, recursion) with self-scored rubric; start the interview error log (a living artifact through D179).

### Week 5 — Trees, graphs & algorithms
- D029 lesson **Binary Trees & BSTs** — "org charts with a sorting rule" (viz: bst-search): tree anatomy, traversals (in/pre/post/level), BST invariant & search/insert, balanced vs degenerate, height intuition; 3 classics.
- D030 lesson **Heaps, Priority Queues & Tries** — "the triage nurse & the autocomplete tree" (viz: heap-ops): heap property, push/pop mechanics, heapq, top-K pattern, trie structure & prefix search, when each wins; 2 classics.
- D031 lesson **Graphs, BFS & DFS** — "friendship maps, ripples & corridors" (viz: graph-bfs): adjacency list/matrix, BFS level-order & shortest unweighted path, DFS & backtracking taste, cycle detection, connected components, topological sort gist; 3 classics.
- D032 lesson **Sorting** — "lining up the kids" (viz: sort-race): comparison sorts (insertion/merge/quick ideas), stability, Timsort reality, O(n log n) bound gist, counting-sort taste, sort-then-solve pattern; when sorting simplifies problems.
- D033 lesson **Binary Search & Variants** — "halving the phone book" (viz: binary-search): invariant thinking, boundaries (first/last true), search on answer space, bisect module, off-by-one discipline; 3 classics.
- D034 lesson **Dynamic Programming Intro** — "remembering solved puzzles" (viz: dp-grid): overlapping subproblems, memoization vs tabulation, 1D (climb stairs, house robber), 2D grid paths, LCS shape, recognizing DP; when brute force is fine.
- D035 review **Week 5 Checkpoint: Interview Drill I** — "the whiteboard warm-up": spaced-rep D29–34; timed mock: 3 problems across trees/graphs/DP + pattern-recognition quiz; error log update; NeetCode roadmap orientation for ongoing practice.

### Week 6 — Data & systems I
- D036 lesson **SQL I — Tables & Queries** — "spreadsheets with a contract" (viz: null): relational model, schemas/keys/constraints, SELECT/WHERE/ORDER/LIMIT, LIKE, aggregate functions, GROUP BY/HAVING, NULL traps; SQLite hands-on with a real dataset.
- D037 lesson **SQL II — Joins & Modeling** — "matching guest lists" (viz: sql-join): inner/left/right/full joins, many-to-many & junction tables, subqueries & CTEs, window functions taste, normalization gist vs pragmatic denormalization; design a schema for the task tracker.
- D038 lesson **Database Internals** — "the index at the back of the book" (viz: btree-index): B-tree indexes, EXPLAIN, covering indexes, transactions & ACID, isolation levels gist, N+1 problem, connection pooling, ORMs (when/when not), migrations, SQLite vs Postgres.
- D039 lesson **Operating Systems Essentials** — "the hotel manager" (viz: null): processes vs threads, scheduling gist, memory (stack/heap, virtual memory, OOM), file descriptors, signals & exit codes, ps/top/kill/htop, ulimits; why containers will make sense later.
- D040 lesson **Concurrency & Async Python** — "one chef, many pots" (viz: async-loop): concurrency vs parallelism, the GIL, threading for I/O, multiprocessing for CPU, asyncio (async/await, gather, timeouts, cancellation), race conditions & locks gist; why LLM apps are async-heavy.
- D041 lesson **HTTP & Build Your First API** — "ordering at the counter" (viz: http-cycle): request anatomy, methods & status codes, headers, JSON, httpx client (params, auth, retries/backoff, pagination), then FastAPI: path/query params, pydantic models, uvicorn, auto docs.
- D042 review **Week 6 Checkpoint: API + DB Mini-Service** — "the first backend": spaced-rep D36–41; project: FastAPI notes/bookmarks service backed by SQLite (CRUD, validation, tests with TestClient); EXPLAIN one query and add the right index.

### Week 7 — Systems II & design
- D043 lesson **Networking — Packets to HTTPS** — "the postal system" (viz: null): layers gist (IP/TCP/UDP), DNS resolution, ports & sockets, TLS handshake intuition & certificates, HTTP/1.1 vs 2, latency vs bandwidth, curl fluency, reading a request waterfall.
- D044 lesson **Security, AuthN & AuthZ** — "locks, badges and guest lists" (viz: auth-flow): hashing vs encryption, salted password hashing (bcrypt/argon2), sessions vs JWT (and JWT pitfalls), OAuth2/OIDC flow walkthrough, API keys, RBAC, OWASP top risks, secrets management, least privilege.
- D045 lesson **Web Service Architecture** — "the restaurant's back of house" (viz: null): layered design (routes/services/repos), dependency injection gist, middleware, error handling & problem details, request validation, rate limiting, versioning, 12-factor config; harden the D42 service with auth.
- D046 lesson **Distributed Systems Fundamentals** — "many kitchens, one restaurant" (viz: dist-sys): why distribute, load balancing, stateless services, horizontal vs vertical scaling, replication vs partitioning, CAP intuition, eventual consistency, idempotency & retries.
- D047 lesson **Caching & Queues** — "the pantry and the ticket rail" (viz: cache-flow): cache layers (client/CDN/app/DB), TTL & invalidation ("hardest problem"), cache-aside pattern, Redis gist, message queues & workers, backpressure, exactly-once myth; where AI apps cache (semantic cache preview).
- D048 lesson **System Design Method** — "the architect's rehearsal" (viz: sys-design): the interview & real-life method: requirements → capacity envelope → API → data model → high-level design → deep dives → trade-offs; worked example: pastebin; estimation cheat sheet.
- D049 review **Week 7 Checkpoint: Design & Build a URL Shortener** — "first system design": spaced-rep D43–48; design doc (capacity, schema, API, cache strategy) then build with FastAPI + SQLite + cache + tests; write the trade-offs section like an interview answer.

## Phase 3 — Math for ML (D50–63, Weeks 8–9)

### Week 8 — Linear algebra & calculus
- D050 lesson **Vectors & Dot Products** — "arrows and shadows" (viz: vector-dot): vectors as data & direction, norms, dot product as alignment, cosine similarity, orthogonality, high-dimensional intuition; NumPy vectors; preview: embeddings are exactly this.
- D051 lesson **Matrices & Transformations** — "machines that move space" (viz: matrix-transform): matrix × vector as transformation, composition = multiplication, identity/inverse gist, linear layers as matrices; NumPy matmul; why GPUs are matmul machines.
- D052 lesson **Rank, Eigenvectors & SVD Intuition** — "the grain of the wood" (viz: null): rank & information, eigenvector intuition (directions that only stretch), SVD as rotate-stretch-rotate, low-rank approximation (LoRA foreshadow), PCA connection.
- D053 lesson **Derivatives & Gradients** — "the sensitivity dial" (viz: gradient-descent): derivative as sensitivity, partials, gradient as steepest ascent, numerical vs analytic, visual reading of slopes; gradient of a 2-variable function by hand + NumPy check.
- D054 lesson **Chain Rule & Optimization** — "gears in a chain" (viz: chain-rule): chain rule as the one rule backprop needs, computational graphs, minimizing loss surfaces, learning rate intuition, convex vs non-convex, local minima & saddle points reality.
- D055 lesson **Gradient Descent Lab** — "rolling downhill in fog" (viz: gradient-descent): batch/mini-batch/stochastic, step-size experiments, divergence & oscillation, momentum gist; implement GD on two functions and watch trajectories.
- D056 review **Week 8 Checkpoint: Linear Regression by Hand** — "the math becomes code": spaced-rep D50–55; project: NumPy linear regression trained by hand-written gradient descent, loss curves, LR ablation table, written intuition paragraph.

### Week 9 — Probability, statistics & information
- D057 lesson **Probability Fundamentals** — "weather forecasts" (viz: null): sample spaces, events, conditional probability, independence, product/sum rules, simulation mindset (Monte Carlo with NumPy), birthday-problem lab.
- D058 lesson **Random Variables & Distributions** — "the shape of chance" (viz: dist-shapes): discrete vs continuous, Bernoulli/binomial/uniform/normal, expectation & variance, CLT intuition via simulation, log-normal & heavy tails in production latencies.
- D059 lesson **Bayes' Rule** — "updating your beliefs" (viz: bayes-grid): prior/likelihood/posterior, the medical-test example done honestly, base-rate neglect, spam-filter mini-lab, Bayesian thinking for debugging & incident triage.
- D060 lesson **Statistics I — Sampling & Confidence** — "tasting the soup, not drinking the pot" (viz: sampling-ci): populations vs samples, bias sources, law of large numbers, standard error, confidence intervals, bootstrap lab; why eval scores need error bars.
- D061 lesson **Statistics II — Hypothesis Tests & A/B** — "the courtroom standard" (viz: null): null/alternative, p-values (and abuses), significance vs importance, power & sample size, multiple comparisons, A/B testing pitfalls; comparing two prompts is an A/B test.
- D062 lesson **Entropy, Cross-Entropy & KL** — "surprise as a currency" (viz: entropy-bits): information as surprise, entropy, cross-entropy as THE training loss, KL divergence, perplexity, temperature preview; compute cross-entropy of toy predictions.
- D063 review **Week 9 Checkpoint: Math Assessment** — "the toolkit inspection": spaced-rep D57–62; cumulative math assessment (20 questions, mapped to revisit days); mini-lab: bootstrap CIs on a simulated eval-score dataset — decide if model A beats model B.

## Phase 4 — Data & Machine Learning (D64–84, Weeks 10–12)

### Week 10 — Data craft
- D064 lesson **NumPy in Anger** — "power tools for numbers" (viz: null): ndarray, dtype, vectorization vs loops (timed!), broadcasting rules, boolean masks, aggregation axes, random generators; image-as-array mini-lab.
- D065 lesson **pandas I — DataFrames** — "the spreadsheet that scripts" (viz: null): Series/DataFrame, loc/iloc, filtering, assign, sorting, value_counts, reading CSV/Parquet, dtypes & memory, method chaining style.
- D066 lesson **pandas II — Wrangling** — "the data kitchen" (viz: null): groupby-agg, merge/join, concat, pivot & melt, datetime handling, string ops, apply (sparingly); wrangle a messy multi-file dataset into tidy form.
- D067 lesson **Exploratory Data Analysis** — "interviewing your data" (viz: null): EDA checklist, distributions & outliers, correlations, target relationships, leakage sniffing, matplotlib fluency (histogram/scatter/box), narrative EDA — findings as sentences.
- D068 lesson **Cleaning & Validation** — "mise en place" (viz: null): missing-data strategies, types & units, duplicates, outlier judgment, pydantic data contracts, great-expectations-style checks gist, reproducible cleaning scripts; garbage-in economics.
- D069 lesson **Feature Engineering** — "cutting ingredients so the pan can cook them" (viz: null): encoding categoricals, scaling & when it matters, datetime & text features, interactions, binning, leakage traps, train/test discipline with pipelines; sklearn ColumnTransformer.
- D070 review **Week 10 Checkpoint: EDA Report** — "the data interview writeup": spaced-rep D64–69; project: full EDA + cleaning + feature plan on a fresh public dataset, delivered as a stakeholder-readable report with 5 defensible findings.

### Week 11 — Supervised learning
- D071 lesson **ML Framing & Linear Regression** — "drawing the best line" (viz: gradient-descent): what learning is (function + loss + optimizer), regression vs classification, baselines first, sklearn fit/predict/score, train/val/test splits, underfitting; D56 payoff — sklearn does what you built.
- D072 lesson **Logistic Regression & Losses** — "confidence, not just answers" (viz: sigmoid-boundary): sigmoid, decision boundaries, log-loss = cross-entropy (D62 payoff), class imbalance & thresholds, predict_proba, regularization first taste.
- D073 lesson **Decision Trees** — "twenty questions" (viz: decision-tree): splits & impurity, tree depth vs overfitting (watch it memorize), interpretability, feature importance caveats; grow & prune a tree on real data.
- D074 lesson **Ensembles — Forests & Boosting** — "asking a crowd" (viz: null): bagging & random forests, gradient boosting gist (XGBoost/LightGBM), why ensembles win tabular, tuning the few knobs that matter, early stopping; bake-off on one dataset.
- D075 lesson **Evaluation Metrics** — "grading fairly" (viz: confusion-matrix): accuracy trap, confusion matrix, precision/recall/F1, ROC-AUC vs PR-AUC, calibration taste, regression metrics (MAE/RMSE/R²), choosing the metric from the business harm model.
- D076 lesson **Validation, Bias/Variance & Regularization** — "practice tests vs the real exam" (viz: bias-variance): cross-validation, learning curves, bias vs variance diagnosis, L1/L2, hyperparameter search (grid/random), nested-CV gist, the overfitting-to-the-val-set trap.
- D077 review **Week 11 Checkpoint: Tabular Mini-Competition** — "first leaderboard": spaced-rep D71–76; project: beat two baselines on a held-out split of a public tabular dataset; deliver model card: metric choice, CV setup, error analysis, next steps.

### Week 12 — Unsupervised & ML practice
- D078 lesson **Clustering** — "sorting a garage sale, unlabeled" (viz: kmeans-cluster): k-means mechanics & initialization, choosing k (elbow/silhouette), DBSCAN gist, hierarchical taste, cluster profiling & naming; customer-segments lab.
- D079 lesson **PCA & Dimensionality** — "the best camera angle" (viz: pca-project): curse of dimensionality, variance maximization view, projection & reconstruction, explained variance, PCA-for-viz vs PCA-for-features, SVD connection (D52 payoff); visualize digits in 2D.
- D080 lesson **Error Analysis** — "the doctor reads the chart" (viz: null): slice-based analysis, confusion-driven data fixes, data-centric vs model-centric iteration, spotting label noise, ablation habits, "look at your errors" as a career-long superpower.
- D081 lesson **Experiment Tracking & Reproducibility** — "the lab notebook" (viz: null): MLflow runs/params/metrics/artifacts, seeds & determinism limits, data versioning gist, environment pinning, experiment naming, comparing runs honestly.
- D082 lesson **ML Code Structure & Pipelines** — "from notebook to factory" (viz: null): notebook→module refactor, sklearn Pipelines end-to-end, config-driven runs, model persistence (joblib), inference function contract, project template you'll reuse in the capstone.
- D083 project **Phase Project: Churn Prediction End-to-End** — "the whole assembly line": business framing → EDA → features → model bake-off (LR/RF/GBM) → error analysis → pipeline + saved model + report; rubric-graded against 8 criteria.
- D084 review **Week 12 Checkpoint + Interview Drill II** — "the ML viva": spaced-rep D78–83; project presentation writeup; ML-fundamentals mock interview (20 rapid questions: metrics, overfitting, CV, trees vs linear); error-log update.

## Phase 5 — Deep Learning & Transformers (D85–105, Weeks 13–15)

### Week 13 — Neural networks
- D085 lesson **Neurons & Forward Pass** — "layers of dials" (viz: nn-forward): neuron = weighted sum + nonlinearity, activation functions, layers & depth, forward pass by hand on a 2-2-1 net, decision boundaries bending; from-scratch NumPy forward pass.
- D086 lesson **Backpropagation from Scratch** — "blame flows backwards" (viz: backprop-flow): loss landscapes, chain rule on the computational graph (D54 payoff), gradients per weight, a micrograd-style scalar autograd in ~60 lines, gradient checking.
- D087 lesson **PyTorch — Tensors & Autograd** — "autograd does your calculus" (viz: null): tensors & devices, requires_grad, backward(), no_grad, nn.Module, parameters, rebuilding D86 in 20 lines; reading PyTorch error messages.
- D088 lesson **Training Loops & Data** — "the practice schedule" (viz: null): Dataset/DataLoader, batches & shuffling, optimizer step/zero_grad, train vs eval mode, device movement, checkpoint save/load, the canonical loop you'll write forever.
- D089 lesson **Training Dynamics** — "tuning the oven" (viz: loss-curves): under/overfitting curves, weight decay, dropout, batch norm gist, LR schedules & warmup, early stopping, gradient clipping, reading loss curves like a clinician.
- D090 project **MNIST Lab** — "hello, deep learning": train an MLP then small CNN on MNIST/FashionMNIST to target accuracy; experiment log (3 ablations), confusion-matrix error analysis, saved model + inference script.
- D091 review **Week 13 Checkpoint** — "the first neural check": spaced-rep D85–90; re-quiz weak spots; refactor MNIST lab into the D82 project template; flashcard deck drill; write "how backprop works" from memory, then check.

### Week 14 — Representation & attention
- D092 lesson **Embeddings — Meaning as Geometry** — "the map of meaning" (viz: embed-space): one-hot → dense, similarity = geometry (D50 payoff), analogy structure, sentence embeddings, nearest-neighbor search, visualizing with PCA (D79 payoff), domain-shift pitfalls.
- D093 lesson **word2vec Lab** — "words known by their company" (viz: null): distributional hypothesis, skip-gram intuition, negative sampling gist, train tiny word2vec (gensim or from-scratch-lite) on a small corpus, probe neighbors & analogies, limitations → contextual embeddings.
- D094 lesson **Attention** — "everyone looks at everyone" (viz: attention-heat): the bottleneck attention solves, Q/K/V as soft lookup, scaled dot-product, attention weights as a heatmap, multi-head as parallel perspectives; hand-compute attention on a 4-token example.
- D095 lesson **The Transformer** — "the assembly line of attention" (viz: transformer-stack): positional encoding, residuals & layernorm, FFN blocks, encoder vs decoder-only, causal masking, parameter counts, the Illustrated Transformer read-along; trace one token through GPT.
- D096 lesson **Tokenization** — "the LLM's alphabet" (viz: token-stream): why not words or chars, BPE mechanics, vocabulary trade-offs, tokenizer quirks (spaces, numbers, code), tiktoken lab: count & cost real prompts, tokenization-driven failures (arithmetic, spelling).
- D097 project **Tiny GPT Lab I — Build It** — "your own GPT, pocket-sized": assemble a char-level mini-transformer (Karpathy-guided) piece by piece: embedding → blocks → head; verify shapes; overfit one batch as a sanity test.
- D098 review **Week 14 Checkpoint** — "attention check": spaced-rep D92–97; re-quiz; explain attention to the AI tutor in ELI5 then tech mode and self-grade with the provided rubric; deck drill.

### Week 15 — LLM internals
- D099 project **Tiny GPT Lab II — Train & Sample** — "watching it learn to spell": train the D97 model on a small corpus, watch loss + samples evolve (gibberish → words → style), context-length & temperature experiments, save/generate script.
- D100 lesson **How LLMs Are Trained** — "raising a polymath" (viz: llm-pipeline): pretraining objective & data scale, SFT, RLHF & DPO gist, why assistants refuse, system prompts' place, compute realities; map the pipeline for a model you use.
- D101 lesson **Scaling Laws, Capabilities & Limits** — "bigger brains, sharper edges" (viz: scaling-curve): scaling laws gist, emergent capabilities debate, context windows & attention cost, knowledge cutoffs, why hallucination is structural, capability vs reliability gap.
- D102 lesson **Decoding & Sampling** — "the dice behind the words" (viz: sampling-dist): logits → softmax → sampling, temperature/top-p/top-k mechanics, greedy vs sampled, repetition penalties, seeds & determinism limits, when to use which settings; lab with the tiny GPT + an API model.
- D103 lesson **The Model Landscape & Local Inference** — "the tool wall" (viz: null): open vs closed models, weights vs API trade-offs (cost/privacy/control), Hugging Face ecosystem, running a small model locally (transformers/ollama gist), quantization preview, model cards & licenses.
- D104 lesson **Context Windows & Hallucination Deep-Dive** — "the polymath's notepad" (viz: null): context as working memory, lost-in-the-middle, long-context vs retrieval, hallucination taxonomy & triggers, grounding strategies preview (RAG foreshadow), calibrated-uncertainty prompting.
- D105 review **Week 15 Checkpoint: Phase Assessment** — "internals exam": spaced-rep D99–104; cumulative Phase 5 assessment (25 questions); demo artifact: 1-page "how an LLM works" explainer written for a non-technical stakeholder (FDE muscle).

## Phase 6 — AI Engineering (D106–133, Weeks 16–19)

### Week 16 — APIs, prompting & tools
- D106 lesson **LLM APIs I — The Request** — "renting the polymath" (viz: null): chat anatomy (system/user/assistant), max tokens, stop sequences, message-list statelessness, SDK setup (Anthropic + OpenAI-compatible), first scripted conversations, usage fields & token budgets.
- D107 lesson **LLM APIs II — Streaming, Retries & Cost** — "the meter is running" (viz: null): streaming (SSE) & TTFT UX, retries/backoff/timeouts, rate limits, idempotency, cost math per feature (input vs output pricing), caching prompts, cost dashboards habit; build a robust client wrapper.
- D108 lesson **Prompt Engineering I** — "writing the briefing memo" (viz: null): system prompts as job descriptions, few-shot examples that carry weight, role & context placement, instruction hierarchy, XML/markdown structuring, the Anthropic interactive tutorial (selected chapters).
- D109 lesson **Prompt Engineering II** — "memos that survive contact" (viz: null): chain-of-thought & when it helps, output contracts, refusal & edge-case handling, prompt files + versioning + review, anti-patterns (vibes-tuning, mega-prompts), a prompt-change checklist; A/B two variants on 20 cases.
- D110 lesson **Structured Outputs** — "forms, not essays" (viz: null): JSON mode & schema-constrained output, pydantic validation & repair loops, enums & nullable design, extraction tasks, partial/streaming JSON gist, failure-rate measurement; build a document-extraction function.
- D111 lesson **Tool Use & Function Calling** — "giving the polymath hands" (viz: tool-loop): the tool loop (request → tool_use → result → response), tool schema design (small, typed, idempotent), parallel calls, error feedback, multi-turn loops, safety boundaries; build a calculator+weather+search toolbelt.
- D112 review **Week 16 Checkpoint: Prompt Lab** — "the briefing-memo exam": spaced-rep D106–111; assessment: harden a prompt against 10 adversarial inputs; structured-extraction task graded by schema-match rate on a golden set.

### Week 17 — RAG
- D113 lesson **RAG I — Architecture** — "the open-book exam" (viz: rag-pipeline): why RAG beats stuffing & fine-tuning for knowledge, the pipeline (ingest→chunk→embed→index→retrieve→generate), grounding & citations, where each failure hides; diagram-first thinking.
- D114 lesson **Chunking Strategies** — "tearing the book into useful pages" (viz: chunk-strategies): fixed/recursive/structure-aware/semantic chunking, size & overlap trade-offs, metadata preservation, tables & code, chunking eval preview; lab: chunk one real doc 3 ways and compare retrievals.
- D115 lesson **Embeddings & Vector Databases** — "the library with a meaning-based index" (viz: vector-search): embedding-model choice, ANN vs exact, HNSW gist, Chroma/pgvector hands-on, upserts & metadata filters, distance metrics, index lifecycle; build the index for a docs corpus.
- D116 lesson **Hybrid Search** — "smell plus card catalog" (viz: null): dense vs lexical failure modes, BM25, reciprocal rank fusion, metadata filtering at scale, recency & source weighting; lab: queries where hybrid beats either alone.
- D117 lesson **Reranking & Query Transforms** — "the librarian double-checks the pile" (viz: rerank-flow): bi- vs cross-encoders, reranking economics, query rewriting/expansion, HyDE, small-to-big (parent-child) retrieval, lost-in-the-middle mitigation; measure precision@k gains.
- D118 lesson **Advanced RAG Patterns** — "beyond one shelf" (viz: null): multi-hop & decomposition, graph-RAG taste, RAPTOR gist, agentic retrieval, structured+unstructured fusion (SQL+vectors), freshness & incremental indexing, failure-mode taxonomy → debugging flowchart.
- D119 review **Week 17 Checkpoint: Capstone Kickoff — Docs-QA v0** — "the open-book exam, for real": spaced-rep D113–118; capstone brief delivered (realistic business problem + requirements doc); build v0: ingest + hybrid retrieval + grounded answers with citations over a provided corpus.

### Week 18 — Agents
- D120 lesson **Agents I — The Loop** — "an intern with a to-do list" (viz: agent-loop): agent = LLM + tools + loop, ReAct pattern, observation handling, stopping criteria, budgets (steps/tokens/time), the when-NOT-to-build-an-agent checklist; build a file-Q&A agent on the tool loop from D111.
- D121 lesson **Agents II — Planning & Decomposition** — "breaking the mission into missions" (viz: null): plan-then-execute vs interleaved, task lists & state, reflection & self-correction (and its limits), subtask verification, replanning on failure; upgrade the agent with a planner.
- D122 lesson **Agents III — Memory & Context** — "the intern's notebook" (viz: context-window): context-window management, conversation summarization, scratchpads, episodic vs semantic memory, retrieval-backed memory (RAG payoff), what to forget; token-budget engineering.
- D123 lesson **Multi-Agent & Workflow Patterns** — "a small firm, not one intern" (viz: null): workflows vs agents (Anthropic's framing), prompt chaining, routing, parallelization, orchestrator-workers, evaluator-optimizer, handoffs, when multi-agent is overkill; design three systems on paper.
- D124 lesson **Model Context Protocol** — "the universal adapter" (viz: mcp-hosts): why MCP (N×M → N+M), hosts/clients/servers, tools/resources/prompts primitives, transports, security model & consent, build a small MCP server (filesystem or notes) and connect it to a host.
- D125 lesson **Agent Reliability** — "trust, but verify" (viz: null): failure taxonomy (loops, drift, tool misuse), approvals & human-in-the-loop, sandboxing & least-privilege tools, idempotent actions, audit trails, graceful degradation, cost guards; harden the D120 agent.
- D126 review **Week 18 Checkpoint: Support-Triage Agent** — "the intern's first shift": spaced-rep D120–125; project: an agent that triages simulated support tickets (classify, look up docs via RAG, draft reply, escalate with approval); measured on a 20-ticket set.

### Week 19 — Adaptation, multimodal & safety
- D127 lesson **Fine-Tuning I — When & Data** — "teaching the polymath your house style" (viz: ft-decision): prompting vs RAG vs FT decision tree, what FT can/can't add, SFT data quality & formats, contamination & leakage, evals-before-and-after discipline, hosted FT options & costs.
- D128 lesson **Fine-Tuning II — LoRA Lab** — "sticky notes on the giant brain" (viz: lora-adapters): PEFT & LoRA mechanics (low-rank, D52 payoff), ranks & targets, run a small LoRA fine-tune on an open model (or walk a hosted FT), compare against base + prompt baseline honestly.
- D129 lesson **Distillation, Quantization & Model Selection** — "the right size of brain" (viz: null): distillation gist, quantization levels & quality trade-offs, latency/cost/quality selection matrix, cascades & routers (small-first), when the small model wins; build a model-selection worksheet.
- D130 lesson **Multimodal I — Vision & Documents** — "eyes for the polymath" (viz: null): vision-language models, image inputs in practice, document AI (OCR + layout), tables & charts, PDF pipelines, multimodal RAG taste; lab: extract structured data from real receipts/reports.
- D131 lesson **Multimodal II — Audio & Voice** — "ears and a voice" (viz: null): STT (Whisper-class), TTS options, latency budgets for voice UX, barge-in & endpointing gist, voice-agent architecture (the future voice-tutor blueprint), accessibility angle; transcribe-and-summarize lab.
- D132 lesson **Guardrails, Injection & AI Security** — "the con artist and the bank teller" (viz: injection-sim): prompt injection (direct/indirect), jailbreaks, tool-mediated exfiltration, the lethal trifecta, input/output guardrails, PII redaction, OWASP LLM Top 10, defense-in-depth architecture; attack then defend your own agent.
- D133 review **Week 19 Checkpoint: Red-Team Your RAG** — "the heist rehearsal": spaced-rep D127–132; assessment: run a 15-attack suite against your capstone v0 (injection via documents, exfiltration, off-policy), fix top holes, write the findings memo.

## Phase 7 — Evaluation & Observability (D134–147, Weeks 20–21)

### Week 20 — Evals
- D134 lesson **Eval Mindset & Golden Sets** — "the exam you write before the student exists" (viz: eval-loop): why vibes fail & demos lie, golden datasets (sourcing, size, coverage, counterfactuals), labeling guidelines, versioning eval data, eval-driven development loop.
- D135 lesson **Graders — Code, Rubric & LLM-as-Judge** — "who grades the grader?" (viz: judge-bias): exact/regex/programmatic checks, rubric design, LLM-as-judge setup & its biases (position, verbosity, self-preference), judge calibration against human labels, pairwise vs pointwise.
- D136 lesson **RAG Evaluation** — "grading the open-book exam" (viz: rag-evals): separating retrieval from generation, context precision/recall, faithfulness/groundedness, answer relevance, citation accuracy, Ragas-style metrics hands-on on the capstone, error taxonomy.
- D137 lesson **Agent & Task Evals** — "did the intern actually finish the job?" (viz: null): task-completion metrics, trajectory vs outcome scoring, tool-call correctness, multi-step eval harnesses, environment mocking, cost/latency as first-class metrics; eval the D126 agent.
- D138 lesson **Human Evaluation** — "the taste test" (viz: null): when humans are the only judge, annotation protocols & inter-rater agreement, side-by-side comparisons, feedback UX (thumbs, categories, freeform), turning feedback into eval cases; run a mini human-eval round.
- D139 lesson **Statistics for Evals** — "error bars or it didn't happen" (viz: sampling-ci): variance across runs, CIs on pass rates (D60 payoff), paired comparisons, minimum sample sizes, significance vs regression thresholds, seeds & non-determinism; analyze a real eval delta honestly.
- D140 review **Week 20 Checkpoint: Capstone Eval Harness** — "the exam is now automated": spaced-rep D134–139; project: ≥40-case golden set + automated harness scoring retrieval AND answers + judge calibrated on 10 human labels + a written eval report with CIs.

### Week 21 — Observability & continuous evaluation
- D141 lesson **Regression Gates & CI for AI** — "the tripwire" (viz: cicd-pipe): prompt/config changes as code, eval-in-CI patterns, thresholds & flaky-eval handling, canary sets, blocking vs warning gates, versioning prompts/models/data together; wire a gate into the capstone repo.
- D142 lesson **Tracing LLM Applications** — "flight recorders" (viz: trace-tree): spans for LLM calls/retrieval/tools, OpenTelemetry-style instrumentation, trace anatomy of a RAG request, privacy in traces (redaction), sampling strategies; instrument the capstone end-to-end.
- D143 lesson **Logging, Feedback & the Data Flywheel** — "every flight teaches the fleet" (viz: flywheel): structured logs for prompts/completions, user-feedback capture design, mining logs for eval cases, failure clustering, the improvement loop (log → case → fix → gate).
- D144 lesson **Red-Teaming Lab** — "fire drills" (viz: null): structured attack suites, threat modeling for your app, automated adversarial testing (attack libraries gist), jailbreak evolution, reporting & tracking findings, when to re-run; formal red-team pass on the capstone with report.
- D145 lesson **Drift & Continuous Eval in Prod** — "the slow leak" (viz: drift-lines): model-version drift, data/corpus drift, behavior drift after provider updates, online evals & sampling live traffic, shadow deployments, alerting on quality metrics; design the capstone's continuous-eval plan.
- D146 lesson **Quality & Cost Dashboards** — "the cockpit" (viz: null): the metrics that matter (quality, latency p50/p95, cost/request, error rates, feedback rate), dashboard design, weekly review ritual, communicating quality to stakeholders (FDE muscle); build the capstone dashboard skeleton.
- D147 review **Week 21 Checkpoint: Observability Complete** — "instruments all green": spaced-rep D141–146; capstone gate: traces on every request, feedback capture live, regression gate in CI, dashboard populated, red-team findings closed or ticketed.

## Phase 8 — Production & MLOps (D148–161, Weeks 22–23)

### Week 22 — Containers, cloud & pipelines
- D148 lesson **Docker Fundamentals** — "shipping the whole kitchen" (viz: container-layers): images vs containers, Dockerfile for a Python app, layers & caching, .dockerignore, ports & volumes, env config, debugging inside containers; containerize the capstone API.
- D149 lesson **Compose, Registries & Image Hygiene** — "the fleet manifest" (viz: null): multi-service compose (API + vector DB + cache), healthchecks, image size (slim bases, multi-stage builds), tagging strategy, registries, vulnerability scanning gist; compose the full capstone stack locally.
- D150 lesson **Cloud Fundamentals** — "renting racks by the minute" (viz: null): IaaS/PaaS/serverless, AWS core mental model (EC2/S3/RDS/Lambda/IAM), regions & AZs, managed vs self-hosted, egress & pricing gotchas, the free-tier lab path; map the capstone onto three deployment options.
- D151 project **Deploy Lab — Container to Cloud URL** — "opening the doors": deploy the containerized capstone to one real path (e.g. a small VM or container service), TLS & domain gist, env/secrets handling, smoke tests, teardown discipline & cost hygiene.
- D152 lesson **CI/CD with GitHub Actions** — "the robot release manager" (viz: cicd-pipe): workflow anatomy, test→build→deploy pipeline, caching, environments & secrets, docker build/push in CI, eval gate integration (D141 payoff), deployment protection & rollback plan.
- D153 lesson **Infrastructure as Code & Environments** — "blueprints for the building itself" (viz: null): why IaC, Terraform mental model (state/plan/apply), dev/staging/prod separation, config vs secrets management, drift, disposable environments; IaC-lite for the capstone's pieces.
- D154 review **Week 22 Checkpoint: Staging Pipeline** — "the assembly line runs": spaced-rep D148–153; capstone gate: push-to-main triggers tests + evals + build + deploy to a staging URL; runbook started; rollback rehearsed once.

### Week 23 — Serving, reliability & AI system design
- D155 lesson **Serving & Inference Optimization** — "the drive-through window" (viz: batching-q): latency anatomy (TTFT vs tokens/sec vs total), streaming UX, continuous batching gist, KV cache, vLLM/hosted trade-offs, GPU economics 101, concurrency tuning; measure the capstone's latency budget.
- D156 lesson **Caching, Batching & Cost Engineering** — "the pantry, again — at scale" (viz: cache-flow): exact & semantic caching (hit-rate vs staleness), prompt-prefix caching, request coalescing, output-length control, model routing by difficulty (D129 payoff), cost-per-request accounting; cut the capstone's cost measurably.
- D157 lesson **Monitoring & SLOs** — "smoke alarms for software" (viz: null): metrics/logs/traces (RED), SLIs→SLOs→error budgets, alerts that don't cry wolf, dashboards vs pages, synthetic checks, LLM-specific monitors (quality, refusal rate, drift hooks from D145).
- D158 lesson **Reliability & Incident Response** — "when the kitchen catches fire" (viz: null): failure modes (provider outages, rate limits, bad deploys), timeouts/retries/circuit breakers, fallback chains (model B, cached answer, honest error), incident roles & comms, blameless postmortems; tabletop exercise: your provider is down.
- D159 lesson **Production Security & Compliance Basics** — "locking up at night" (viz: null): secrets in prod, key rotation, TLS everywhere, network boundaries, audit logging, data retention & deletion, PII flows, SOC2/GDPR gist for engineers, the security-review checklist customers will run on you.
- D160 lesson **AI System Design** — "the architect's exam" (viz: ai-sysdesign): the 2026 interview round: requirements → constraints → architecture for AI systems; three worked designs (support copilot, doc-QA at enterprise scale, agent with approvals); the quality/latency/cost/privacy quadrilemma; practice rubric.
- D161 review **Week 23 Checkpoint: Production Cutover** — "opening night": spaced-rep D155–160; capstone gate: production URL live with monitoring, alerts, fallbacks, load sanity check (concurrent users), cost report, and the incident runbook complete.

## Phase 9 — FDE & Capstone (D162–180, Weeks 24–25 + finale)

### Week 24 — Forward-deployed craft I
- D162 lesson **The FDE Role** — "the embedded field engineer" (viz: fde-hats): lineage (Palantir → OpenAI/Anthropic wave), the three hats (consultant/PM/engineer), FDE vs SE vs sales engineer, engagement lifecycle, what "good" looks like, reading real job postings critically.
- D163 lesson **Customer Discovery & the Mom Test** — "questions that can't lie to you" (viz: null): discovery interviews, past-behavior questions vs hypotheticals, digging for the real workflow & pain, stakeholder mapping (economic buyer/user/blocker), success criteria extraction; scripted practice on two transcripts.
- D164 lesson **Ambiguity → Requirements** — "fog into blueprints" (viz: null): problem statements, functional & non-functional requirements, constraints & assumptions log, scoping v0/v1/later, acceptance criteria that are testable, the requirements doc template; turn a messy transcript into a requirements doc.
- D165 lesson **Proposals & Architecture Docs** — "drawing the blueprint together" (viz: c4-zoom): technical proposals (problem, approach, plan, risks, cost), architecture docs (C4-lite: context/container/component), diagrams that executives and engineers both read, estimating with ranges, risk registers; write one for the capstone as if selling it.
- D166 lesson **Rapid Prototyping** — "the movie trailer, not the movie" (viz: null): the 48-hour-prototype mindset, scope ruthlessness, wizard-of-oz & hardcoding honestly, prototype→production ladder, feedback capture during demos; 60-minute timed build against a mini-brief.
- D167 lesson **Demo Craft** — "the show must go on" (viz: null): demo narrative arcs (problem→magic→how→next), rehearsal discipline, handling live failure gracefully, tailoring to the room (exec vs eng), demo environments & data hygiene, the follow-up email; script and rehearse a capstone demo.
- D168 review **Week 24 Checkpoint: FDE Simulation I** — "the client room": spaced-rep D162–167; simulation: discovery transcript → requirements doc → proposal with architecture sketch → demo plan; graded against the FDE rubric (discovery, scoping, communication, feasibility).

### Week 25 — Forward-deployed craft II
- D169 lesson **Enterprise Integration** — "plumbing into an old building" (viz: enterprise-map): SSO (SAML/OIDC in practice), SCIM gist, data systems you'll actually meet (SharePoint, SQL warehouses, ERPs, ticketing), API gateways, change-management & security review processes, integration patterns & anti-patterns.
- D170 lesson **Customer Environments** — "cooking in someone else's kitchen" (viz: null): VPCs & private networking gist, on-prem & air-gapped realities, data residency, customer-managed keys, deployment models (SaaS/VPC/on-prem) & their support costs, debugging without direct access, environment checklists.
- D171 lesson **Stakeholders & Trade-off Navigation** — "translating between two languages" (viz: tradeoff-radar): exec vs eng communication, the accuracy/latency/cost/privacy/usability pentagon with worked trade-off cases, saying no with options, status updates that build trust, expectation management, escalation etiquette.
- D172 lesson **Production Debugging with Customers** — "the field mechanic" (viz: null): triage framework (impact→scope→recent changes), reproducing in constrained environments, log forensics for LLM apps (trace payoff from D142), hotfix vs root-cause judgment, communicating during incidents, support handoffs; three scenario walkthroughs.
- D173 lesson **ROI, Pricing & Cost Analysis** — "is the robot worth it?" (viz: null): cost model of an AI feature (tokens, infra, people), value quantification (time saved, deflection, revenue), build-vs-buy, pilots & success metrics, TCO conversations, the cost-analysis one-pager; write one for the capstone.
- D174 project **FDE Simulation II — Full Cycle** — "the engagement": end-to-end simulation with objections and a mid-course change request: discovery → proposal → prototype plan → demo script → handle two written objections + one scope change; timed, rubric-graded.
- D175 review **Week 25 Checkpoint: Debrief & Gap Closure** — "the after-action review": spaced-rep D169–174; sim debrief against rubric, rewrite weakest deliverable, error-log review across all interview drills, capstone punch-list finalized for the finale.

### Finale (D176–180)
- D176 project **Capstone Hardening** — "punch-list week begins": auth & rate limiting, input validation, error handling & honest failure messages, structured logging complete, config cleanup, docs pass; close the top issues from your backlog.
- D177 project **Capstone Quality Gates** — "the inspector's visit": eval harness green with report, guardrails re-tested against the D133/D144 attack suites, tracing verified, load sanity re-check, security checklist, final cost analysis.
- D178 project **Capstone Ship & Document** — "cutting the ribbon": final production deploy, README + architecture doc + runbook + eval report finalized, demo script rehearsed end-to-end, tag v1.0; the repo IS your portfolio.
- D179 lesson **Interview Gym** — "training camp, final week" (viz: null): DSA pattern recap drill, Python & ML rapid-fire, LLM fundamentals bank, one full AI-system-design mock (D160 rubric), behavioral STAR stories mined from your 180 days, FDE case drill; error-log final pass.
- D180 review **Demo Day** — "graduation": capstone presentation (template provided), program-wide mastery final (40 questions spanning all phases, mapped to revisit days), gap analysis → personal continuing plan, job-search launch checklist (portfolio, resume bullets from projects, target roles).

## Spaced repetition & mastery model

- Every day emits 4–8 flashcards; review days drill the due deck (SM-2-lite scheduling).
- Every quiz question maps to a `revisit` day; missed questions push targeted revision
  recommendations onto the dashboard.
- Mastery per phase = 60% lesson completion + 40% quiz accuracy (retakes allowed —
  latest score counts). Program mastery is the weighted mean across phases.

## The capstone (D119 → D180)

**Brief:** An internal "Docs-QA" assistant for a mid-size company: employees ask
questions against policy/handbook/product docs and get grounded, cited answers via
web UI and API. Includes ingest pipeline, hybrid retrieval + reranking, structured
citations, eval harness with golden set + regression gate in CI, guardrails
(injection defense, PII), tracing/observability, Docker deploy with monitoring,
cost analysis, runbook, and a stakeholder-ready demo. Rubric spans 8 dimensions ×
4 levels; "production-ready" requires ≥3 in every dimension.
