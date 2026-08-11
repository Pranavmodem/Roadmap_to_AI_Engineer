// The nine phases of the 180-day AI Engineer / Forward-Deployed Engineer program.
// Day ranges are inclusive. Weeks run 1–26 (week 26 is the 5-day finale); every
// 7th day through day 175 is a review day with spaced repetition and a shipped
// mini-project or assessment.
export const PHASES = [
  {
    id: 'p1', n: 'Phase 1', name: 'Code Foundations',
    blurb: 'Python from zero to fluent, plus the software-engineering habits — git, shell, testing, packaging, clean code — that everything else stands on.',
    days: [1, 21], weeks: [1, 3],
    skills: ['Python', 'Git & shell', 'Testing & debugging', 'Clean code & packaging'],
  },
  {
    id: 'p2', n: 'Phase 2', name: 'CS Core',
    blurb: 'Data structures, algorithms, SQL, operating systems, networking, concurrency, security, and system design — the invisible machinery under every production system.',
    days: [22, 49], weeks: [4, 7],
    skills: ['DSA & Big O', 'SQL & databases', 'OS & concurrency', 'Networking, security & system design'],
  },
  {
    id: 'p3', n: 'Phase 3', name: 'Math for ML',
    blurb: 'Vectors, matrices, gradients, probability, statistics and entropy — exactly the math modern ML runs on, taught visually and by building.',
    days: [50, 63], weeks: [8, 9],
    skills: ['Linear algebra', 'Calculus & optimization', 'Probability & statistics', 'Information theory'],
  },
  {
    id: 'p4', n: 'Phase 4', name: 'Data & Machine Learning',
    blurb: 'From messy CSV to validated model: NumPy, pandas, EDA, feature engineering, supervised and unsupervised learning, metrics, and honest error analysis.',
    days: [64, 84], weeks: [10, 12],
    skills: ['NumPy & pandas', 'EDA & data craft', 'Supervised learning', 'Evaluation & ML practice'],
  },
  {
    id: 'p5', n: 'Phase 5', name: 'Deep Learning & Transformers',
    blurb: 'Neural networks from scratch, PyTorch, embeddings, attention, tokenization, and a tiny GPT you train yourself — the internals behind the APIs.',
    days: [85, 105], weeks: [13, 15],
    skills: ['Neural nets & backprop', 'PyTorch', 'Embeddings & attention', 'LLM internals'],
  },
  {
    id: 'p6', n: 'Phase 6', name: 'AI Engineering',
    blurb: 'The 2026 job core: LLM APIs, prompting, structured outputs, tool use, RAG, vector search, agents, MCP, fine-tuning, multimodal, and AI security.',
    days: [106, 133], weeks: [16, 19],
    skills: ['Prompting & tool use', 'RAG & retrieval', 'Agents & MCP', 'Fine-tuning, multimodal & AI security'],
  },
  {
    id: 'p7', n: 'Phase 7', name: 'Evaluation & Observability',
    blurb: 'The most underrated hiring signal: golden sets, LLM-as-judge, RAG metrics, regression gates, tracing, red teaming, and continuous evaluation.',
    days: [134, 147], weeks: [20, 21],
    skills: ['Eval design', 'LLM-as-judge', 'RAG & agent evals', 'Observability & continuous eval'],
  },
  {
    id: 'p8', n: 'Phase 8', name: 'Production & MLOps',
    blurb: 'Docker, cloud, CI/CD, serving and inference optimization, monitoring, reliability, incident response — shipping AI that stays up and earns its cost.',
    days: [148, 161], weeks: [22, 23],
    skills: ['Docker & cloud', 'CI/CD & IaC', 'Serving & cost', 'Reliability & AI system design'],
  },
  {
    id: 'p9', n: 'Phase 9', name: 'FDE & Capstone',
    blurb: 'Forward-deployed craft: discovery, specs, prototypes, enterprise integration, stakeholder communication — then ship and present your capstone.',
    days: [162, 180], weeks: [24, 26],
    skills: ['Customer discovery', 'Specs & proposals', 'Enterprise delivery', 'Interview readiness'],
  },
];
