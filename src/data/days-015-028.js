// Days 15–28 — Phase 1 Week 3 (engineering habits) + Phase 2 Week 4 (data structures & the pattern toolkit).
export const DAYS_015_028 = [
  {
    id: 'd015', day: 15, week: 3, phase: 1, kind: 'lesson',
    title: 'Clean Code & Type Hints',
    analogy: 'A tidy workshop',
    objectives: [
      'Rename variables and functions so the code reads as a description of intent',
      'Refactor nested conditionals into guard clauses and small single-purpose functions',
      'Annotate functions with type hints (list[str], int | None, TypedDict) and run mypy on them',
      'Apply DRY judgment: extract shared logic at the right moment, not the first repetition',
      'Run ruff to lint and format a module and fix every warning it raises',
    ],
    prereqs: [
      { day: 3, label: 'Functions, scope & modules' },
      { day: 9, label: 'Object-oriented Python I' },
      { day: 14, label: 'Week 2 project — the log analyzer' },
    ],
    eli5: `Walk into two workshops. In the first, tools are wherever they last landed: three screwdrivers in a drawer labeled "misc," a saw under a tarp, nothing where the label says. The carpenter still builds good furniture — but every task starts with ten minutes of searching, and a visitor can't help at all. In the second workshop every drawer is labeled with exactly what it holds, each tool does one job, and the labels are honest: the drawer marked "wood screws, 40mm" contains wood screws, 40mm.

Code is a workshop that other people (including future-you) must work in. **Naming** is the labeling: \`days_until_expiry\` beats \`d\`. **Small functions** are single-purpose tools: a function called \`parse_line\` that also writes to a file has a lying label. **Type hints** are the printed drawer labels — \`def top_errors(lines: list[str]) -> dict[str, int]\` tells everyone what goes in and what comes out, and a robot inspector (mypy) walks the shop checking that nobody put a saw in the screw drawer. Tidiness isn't decoration; it's the speed of everyone who enters after you.`,
    why: `From here on, every project in this program — and every repo you touch professionally — gets read far more often than it gets written. AI engineering code is especially prone to rot: prompt strings, data-munging glue, and notebook-grown functions accumulate fast. Type hints are also load-bearing in the modern stack: pydantic (Day 41) validates API payloads from annotations, and FastAPI generates docs from them. In an FDE setting, a customer's engineers will read your prototype code the week after the demo — tidy, typed code is a trust signal you can't fake later.`,
    tech: `### Naming and shape

Good names state intent at the call site: a reader of \`if is_expired(entry):\` learns something; a reader of \`if check(e):\` learns nothing. Functions should do one thing at one level of abstraction, and their names should be verbs that tell the whole truth — if \`load_config\` also mutates global state, the name is a lie you will pay for. **Guard clauses** flatten nesting: instead of wrapping the whole body in \`if valid:\`, return early on the invalid cases and let the happy path run at indent level one. Three levels of indentation is a smell; five is a bug farm.

### DRY, carefully

Don't Repeat Yourself means one *authoritative home* for each piece of knowledge — a regex, a threshold, a rule. But deduplicating two snippets that merely look alike couples code that will want to evolve apart; the classic discipline is the rule of three: tolerate the second occurrence, extract on the third, and only when the repetition means the same thing. Premature abstraction is more expensive than duplication because it is harder to undo.

### Type hints and the mypy mental model

Python stays dynamically typed at runtime — hints are annotations, not enforcement:

~~~python
def top_errors(lines: list[str], limit: int = 5) -> dict[str, int]: ...

def find_user(uid: str) -> str | None: ...   # may return None: callers must handle it

class LogRecord(TypedDict):
    ip: str
    status: int
    path: str
~~~

\`str | None\` (the modern spelling of \`Optional[str]\`) is the most valuable hint you will write: it forces every caller to confront the None case. \`TypedDict\` gives dict-shaped data a checked schema without a class. **mypy** is a static checker: it reads the annotations and the code *without running anything* and reports where a caller could pass or receive the wrong type — like a spellchecker for data flow. It catches the bug on the path you didn't test. **ruff** complements it: an extremely fast linter (unused imports, shadowed names, suspicious comparisons) and formatter, so style stops being a human argument. The workflow you'll use daily from now on: write, \`ruff check --fix\`, \`ruff format\`, \`mypy\`, commit.`,
    viz: null,
    guided: [
      {
        title: 'Guard-clause surgery',
        minutes: 15,
        body: `1. Create \`refactor_lab.py\` and paste the BEFORE function from the starter code — read it and honestly time how long it takes you to say what it returns for a malformed line.
2. Refactor it in three passes, running it after each pass on the sample lines at the bottom: (a) invert the conditions into early returns; (b) rename \`x\`, \`p\`, and \`res\` to intent-revealing names; (c) pull the timestamp parsing into its own small function.
3. Compare with the AFTER shape in the starter code — yours doesn't need to match exactly, but the happy path must sit at indentation level one.
4. Write a one-line comment at the top: which pass helped readability most?`,
        code: `# BEFORE — works, but hostile to readers
def process(x):
    res = None
    if x:
        p = x.split(" ")
        if len(p) >= 3:
            if p[1].isdigit():
                res = {"ip": p[0], "status": int(p[1]), "path": p[2]}
    return res

# AFTER — same behavior, guard clauses + honest names
def parse_line(line: str) -> dict | None:
    if not line:
        return None
    parts = line.split(" ")
    if len(parts) < 3:
        return None
    ip, status, path = parts[0], parts[1], parts[2]
    if not status.isdigit():
        return None
    return {"ip": ip, "status": int(status), "path": path}

samples = ["10.0.0.1 200 /home", "bad line", "", "10.0.0.2 abc /login"]
for s in samples:
    print(repr(s), "->", parse_line(s))`,
      },
      {
        title: 'Type-check your own code with mypy and ruff',
        minutes: 20,
        body: `1. **Terminal:** install the inspectors into your environment: \`pip install mypy ruff\`.
2. Add full type hints to \`parse_line\` — the return type is \`dict[str, str | int] | None\` (or define a \`TypedDict\` named \`LogRecord\` for extra credit).
3. Below it, deliberately write a caller that forgets the None case (see starter code), then run **in the terminal**: \`mypy refactor_lab.py\`. Read the error — mypy caught a crash you never executed.
4. Fix the caller with an \`if record is None:\` guard and rerun mypy until it reports success.
5. **Terminal:** run \`ruff check refactor_lab.py\` then \`ruff format refactor_lab.py\`. Fix anything check reports and diff what format changed.`,
        code: `from typing import TypedDict

class LogRecord(TypedDict):
    ip: str
    status: int
    path: str

def parse_line(line: str) -> LogRecord | None:
    if not line:
        return None
    parts = line.split(" ")
    if len(parts) < 3 or not parts[1].isdigit():
        return None
    return {"ip": parts[0], "status": int(parts[1]), "path": parts[2]}

def describe(line: str) -> str:
    record = parse_line(line)
    return record["path"]        # mypy: record might be None!

# fixed version:
def describe_safe(line: str) -> str:
    record = parse_line(line)
    if record is None:
        return "<unparseable>"
    return record["path"]`,
      },
    ],
    practice: [
      {
        title: 'The smell clinic',
        minutes: 20,
        body: `Open your Day 14 log analyzer and find, in YOUR OWN code: (1) one name that hides intent — rename it everywhere; (2) one function doing two jobs — split it; (3) one nested conditional — flatten it with guard clauses; (4) one piece of duplicated knowledge (a repeated string, regex, or magic number) — give it one home as a named constant.

Constraints: behavior must not change — rerun the analyzer on the sample log before and after and diff the output. Finish by running ruff and mypy on the file.

Hints (only if stuck): magic numbers usually want to become module-level UPPER_CASE constants; a function that is hard to name is usually two functions.`,
      },
    ],
    project: {
      title: 'Refactor the log analyzer, live',
      brief: `Do a full clean-code pass on the Day 14 log analyzer: intent-revealing names throughout, no function longer than ~25 lines, guard clauses instead of nesting, one home for every constant and regex, and complete type hints on every public function (including a \`TypedDict\` for the parsed record). The bar: \`ruff check\` reports zero issues, \`ruff format\` changes nothing, and \`mypy\` passes. Commit in two steps — one commit for renames/structure, one for type hints — with messages that say why, not what. This exact codebase becomes a tested, shipped package on Day 21, so today's tidiness is next week's speed.`,
      rubric: [
        'Analyzer output on the sample log is byte-identical before and after the refactor',
        'Every public function has parameter and return annotations; parsed records use a TypedDict',
        'mypy passes with zero errors; ruff check and ruff format both come back clean',
        'No function exceeds ~25 lines; no conditional nests more than two levels',
        'Two commits with messages explaining the why of each change',
      ],
    },
    mistakes: [
      'Believing type hints change runtime behavior. Python ignores them when running; only tools like mypy and pydantic read them. A wrong hint is a lie that mypy exists to catch.',
      'Writing `list` or `dict` bare when you know the contents. `list[str]` and `dict[str, int]` let mypy check the elements too — the bare form checks almost nothing.',
      'Returning `str | None` but never guarding None at call sites. The hint\'s whole value is forcing that guard; suppressing the mypy error with a blind assertion defeats it.',
      'Extracting an abstraction on the first repetition. Duplication is cheaper to fix than the wrong abstraction — wait until the third occurrence proves the pattern.',
      'Renaming things in your head but not in the code ("I know what x means"). Six weeks from now you are the stranger in your own workshop.',
      'Treating linter output as noise to silence. Each ruff rule encodes a real bug class; disable one only with a comment saying why.',
    ],
    quiz: [
      {
        q: 'A function is annotated `-> str | None`. What does mypy demand from callers?',
        o: [
          'Nothing — hints are documentation only, even to mypy',
          'That they handle the None case before using the value as a str',
          'That they wrap every call in try/except',
          'That they convert the result with str() first',
        ],
        x: 1,
        w: 'mypy tracks that the value might be None and flags any use that assumes str — forcing an explicit None guard. That is the single most valuable check hints buy you.',
        revisit: 15,
      },
      {
        q: 'What does mypy actually do when you run it?',
        o: [
          'Runs your tests and reports failures',
          'Executes the code and watches the types at runtime',
          'Reads the code and annotations without running anything, and reports type inconsistencies',
          'Reformats the code to match PEP 8',
        ],
        x: 2,
        w: 'mypy is a static analyzer: it never executes your program. That is why it can catch a crash on a code path you never tested.',
        revisit: 15,
      },
      {
        q: 'You notice the same 3-line snippet in two functions. The cleanest immediate move is usually…',
        o: [
          'Extract a shared helper immediately — DRY is absolute',
          'Leave it, note the duplication, and extract only when a third occurrence (or shared meaning) proves the pattern',
          'Delete one of the functions',
          'Merge both functions into one bigger function',
        ],
        x: 1,
        w: 'DRY targets duplicated knowledge, not duplicated text. Premature abstraction couples code that may evolve apart and is harder to undo than duplication.',
        revisit: 15,
      },
    ],
    resources: [
      { label: 'PEP 8 — the official Python style guide', url: 'https://peps.python.org/pep-0008/', type: 'docs', time: '25 min' },
      { label: 'typing — official docs (read the cheat-sheet-style intro)', url: 'https://docs.python.org/3/library/typing.html', type: 'docs', time: '20 min' },
      { label: 'Google Technical Writing — clarity habits that transfer to naming', url: 'https://developers.google.com/tech-writing', type: 'course', time: '20 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: due flashcards from Weeks 1–2', minutes: 10 },
      { activity: 'ELI5 + tech read: naming, guard clauses, hints, mypy model', minutes: 20 },
      { activity: 'Guided: guard-clause surgery + mypy/ruff on your code', minutes: 35 },
      { activity: 'Practice: the smell clinic on your Day 14 analyzer', minutes: 20 },
      { activity: 'Project: full refactor pass, two commits', minutes: 25 },
      { activity: 'Quiz + write flashcards', minutes: 10 },
    ],
    completion: [
      'refactor_lab.py passes mypy and ruff with the None-guard fix in place',
      'Analyzer refactor committed in two commits with identical before/after output',
      'mypy + ruff clean on the analyzer',
      'Quiz ≥ 2/3 (revisit and retake if lower)',
    ],
    connections: {
      back: 'Day 3 taught you to write functions; today you learned to make them legible. The analyzer you are polishing is the Day 14 project, and the class you typed traces back to Day 9.',
      forward: 'Day 18\'s tests and Day 21\'s shipped package assume this tidy, typed codebase. On Day 41 pydantic turns these same annotations into runtime validation for APIs, and on Day 110 typed schemas become the contract you hand an LLM.',
    },
    flashcards: [
      { f: 'What does mypy do?', b: 'Static type checking: reads code + annotations WITHOUT running it, reports type inconsistencies (e.g. unguarded None).' },
      { f: 'Guard clause?', b: 'Early return on invalid cases so the happy path runs unnested at indent level one.' },
      { f: 'Modern spelling of Optional[str]?', b: 'str | None — and callers must handle the None branch.' },
      { f: 'Rule of three (DRY)?', b: 'Tolerate the 2nd repetition; extract on the 3rd, and only when the copies share meaning.' },
      { f: 'TypedDict use case?', b: 'Give dict-shaped data a checked schema (keys + value types) without writing a class.' },
    ],
    deepDive: [
      { label: 'Run mypy in strict mode', note: 'Try mypy --strict on refactor_lab.py and fix what it adds. Strict mode is the default in many production codebases; knowing what it demands (no implicit Any, full annotations) is a hiring signal.' },
    ],
  },
  {
    id: 'd016', day: 16, week: 3, phase: 1, kind: 'lesson',
    title: 'Logging, Config & CLI Ergonomics',
    analogy: 'The flight recorder',
    objectives: [
      'Replace print() debugging with the logging module and justify the swap',
      'Configure log levels, formats, and handlers, and toggle verbosity with a flag',
      'Build an argparse CLI with subcommands, typed arguments, and helpful --help text',
      'Load configuration with sane precedence: CLI flag > environment variable > default',
      'Return meaningful exit codes so scripts compose in shell pipelines',
    ],
    prereqs: [
      { day: 5, label: 'Files & errors' },
      { day: 6, label: 'The terminal & Linux' },
      { day: 14, label: 'Week 2 project — the log analyzer' },
    ],
    eli5: `Airliners carry a flight recorder — the orange "black box" — that continuously writes down altitude, speed, and every switch the crew flips. Nobody reads it during a normal flight. But when something goes wrong over the ocean at 3 a.m., investigators don't have to *reproduce* the incident; they replay the recording. Compare that to a pilot shouting observations out the window: loud, unrecorded, gone.

\`print()\` is shouting out the window. The **logging** module is the flight recorder: every message gets a timestamp, a severity (was this routine cruising data or an engine fire?), and a destination — screen, file, or both. Best of all, the recorder has a dial: in normal operation you record only WARNING and above; when investigating, you turn the dial to DEBUG and the same code suddenly narrates everything, no rewrites needed. Today you also give your programs a proper cockpit: a command-line interface with subcommands and \`--help\`, configuration that can come from flags or environment variables, and exit codes — the single number a program leaves behind that tells the rest of the system "landed fine" or "declare emergency."`,
    why: `Every production system you will run — the FastAPI service on Day 42, the RAG capstone from Day 119 — is debugged almost entirely through its logs, because you cannot attach a debugger to a crashed 3 a.m. process. LLM apps raise the stakes: on Day 142 you'll add tracing (the flight recorder's big sibling) to record every prompt, retrieval, and tool call. FDEs live in customer environments where logs are often the ONLY access you get — "send me the log file" is how remote debugging starts. Learn the recorder now, on a small plane.`,
    tech: `### Logging: levels, loggers, handlers, formats

The module has five standard levels — DEBUG, INFO, WARNING, ERROR, CRITICAL — and a logger only emits records at or above its configured level. That is the dial: code full of \`logger.debug(...)\` calls costs almost nothing until you turn the level down to DEBUG. The minimal setup:

~~~python
import logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)
~~~

\`getLogger(__name__)\` gives each module its own named channel, so output says *where* a message came from and you can silence one noisy module without touching others. **Handlers** route records to destinations (console, file, both); **formatters** control the line layout. Why not \`print\`? print has no levels, no timestamps, no off-switch, no destinations, and no source names — every one of which you will want the night something breaks.

### argparse: the cockpit

\`argparse\` declares your interface: positional arguments, options with types and defaults, and subcommands (\`analyzer report\`, \`analyzer top-ips\`) via \`add_subparsers()\`. In exchange you get parsing, validation, error messages, and \`--help\` for free. A CLI with good \`--help\` is documentation that cannot go stale.

### Config precedence and exit codes

Real tools read configuration from several sources with a strict precedence: **CLI flag beats environment variable beats built-in default**. Environment variables (\`os.environ.get("ANALYZER_LOG_LEVEL")\`) are how deployed services get configured without code changes — and how secrets stay out of git; a \`.env\` file is just a convenience file of such variables loaded at startup, never committed. Finally, exit codes: a process ends with an integer, 0 meaning success and anything else failure. \`sys.exit(1)\` (or letting an uncaught exception escape) is what lets shells and CI pipelines chain commands with \`&&\` and stop on failure. A script that prints "ERROR" but exits 0 is lying to every tool downstream.`,
    viz: null,
    guided: [
      {
        title: 'From print to flight recorder',
        minutes: 20,
        body: `1. Create \`recorder_lab.py\` from the starter code — it processes fake log lines with print() calls sprinkled in.
2. Replace every print with the appropriate logger call: routine progress -> \`logger.debug\`, notable events -> \`logger.info\`, recoverable problems -> \`logger.warning\`, failures -> \`logger.error\`.
3. **Terminal:** run \`python recorder_lab.py\` — at the default INFO level the debug chatter is gone.
4. Add the \`--verbose\` flag wiring from the starter (sets level to DEBUG) and run \`python recorder_lab.py --verbose\` — the full narration returns without touching the processing code. That is the dial.
5. Add a FileHandler so everything from DEBUG up also lands in \`run.log\` while the console stays at your chosen level. Run once and inspect \`run.log\` with \`cat run.log\`.`,
        code: `import argparse
import logging

logger = logging.getLogger("analyzer")

def process(lines):
    parsed = 0
    for i, line in enumerate(lines):
        logger.debug("line %d: %r", i, line)          # routine narration
        parts = line.split(" ")
        if len(parts) < 3:
            logger.warning("skipping malformed line %d: %r", i, line)
            continue
        parsed += 1
    logger.info("parsed %d/%d lines", parsed, len(lines))
    return parsed

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Flight-recorder lab")
    parser.add_argument("--verbose", action="store_true", help="show debug output")
    args = parser.parse_args()

    level = logging.DEBUG if args.verbose else logging.INFO
    logging.basicConfig(
        level=level,
        format="%(asctime)s %(levelname)-8s %(name)s: %(message)s",
    )
    # file handler: records EVERYTHING regardless of console level
    fh = logging.FileHandler("run.log")
    fh.setLevel(logging.DEBUG)
    fh.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(message)s"))
    logging.getLogger().addHandler(fh)

    process(["10.0.0.1 200 /home", "oops", "10.0.0.2 500 /api"])`,
      },
      {
        title: 'Subcommands and exit codes',
        minutes: 20,
        body: `1. Create \`cli_lab.py\` from the starter: an argparse CLI with two subcommands, \`report\` and \`top-ips\`, each with its own options.
2. **Terminal:** run \`python cli_lab.py --help\`, then \`python cli_lab.py top-ips --help\` — notice argparse wrote both help screens for you.
3. Run \`python cli_lab.py report missing.log\` — it should log an error and exit with code 1. Verify **in the terminal** with \`echo $?\` (PowerShell: \`echo $LASTEXITCODE\`) immediately after.
4. Run it on a real file and verify \`echo $?\` prints 0.
5. Chain it: \`python cli_lab.py report sample.log && echo "pipeline continues"\` — the echo only fires on success. This is why exit codes matter.`,
        code: `import argparse
import logging
import sys
from collections import Counter
from pathlib import Path

logger = logging.getLogger("analyzer")

def cmd_report(args) -> int:
    path = Path(args.logfile)
    if not path.exists():
        logger.error("log file not found: %s", path)
        return 1
    lines = path.read_text().splitlines()
    logger.info("report over %d lines", len(lines))
    print(f"{len(lines)} lines in {path}")
    return 0

def cmd_top_ips(args) -> int:
    path = Path(args.logfile)
    if not path.exists():
        logger.error("log file not found: %s", path)
        return 1
    ips = Counter(line.split(" ")[0] for line in path.read_text().splitlines() if line)
    for ip, n in ips.most_common(args.limit):
        print(f"{ip:15s} {n}")
    return 0

def main() -> int:
    parser = argparse.ArgumentParser(prog="analyzer", description="Log analyzer CLI")
    parser.add_argument("--verbose", action="store_true")
    sub = parser.add_subparsers(dest="command", required=True)

    p_report = sub.add_parser("report", help="summary counts")
    p_report.add_argument("logfile")
    p_report.set_defaults(func=cmd_report)

    p_top = sub.add_parser("top-ips", help="most frequent client IPs")
    p_top.add_argument("logfile")
    p_top.add_argument("--limit", type=int, default=5)
    p_top.set_defaults(func=cmd_top_ips)

    args = parser.parse_args()
    logging.basicConfig(level=logging.DEBUG if args.verbose else logging.WARNING)
    return args.func(args)

if __name__ == "__main__":
    sys.exit(main())`,
      },
    ],
    practice: [
      {
        title: 'Config precedence, implemented honestly',
        minutes: 20,
        body: `Write \`get_log_level(cli_value)\` used by your CLI: it must return the level from the CLI flag if given, else from the environment variable \`ANALYZER_LOG_LEVEL\` if set, else default to WARNING — and it must reject invalid values with a clear error and exit code 2.

Verify all three tiers **in the terminal**: (1) no flag, no env var; (2) \`export ANALYZER_LOG_LEVEL=DEBUG\` then run (Windows PowerShell: \`$env:ANALYZER_LOG_LEVEL="DEBUG"\`); (3) env var set AND \`--log-level ERROR\` passed — the flag must win. Prove each with a debug line that only appears at the right tier.

Hints: \`os.environ.get(name)\` returns None when unset; \`logging.getLevelName("DEBUG")\` maps names to numbers; precedence is just ordered "first non-None wins" logic.`,
      },
    ],
    project: {
      title: 'Give the analyzer a cockpit',
      brief: `Upgrade your Day 14/15 log analyzer into a proper CLI tool: (1) subcommands \`report\`, \`top-ips\`, and \`errors\` via argparse, each with \`--limit\`-style options and real help text; (2) all print-debugging replaced by a module logger with the timestamped format, \`--verbose\` dial, and a FileHandler writing \`analyzer.log\`; (3) config precedence for the log level (flag > \`ANALYZER_LOG_LEVEL\` > default); (4) exit codes: 0 on success, 1 on missing/unreadable input, 2 on bad arguments. Demonstrate the exit codes with a short shell session pasted into your journal. Commit the upgrade — tomorrow this tool gets packaged, and on Day 21 it ships.`,
      rubric: [
        'All three subcommands run and --help reads like documentation for each',
        'Zero print() calls used for diagnostics (user-facing output only); logger has timestamps and named channel',
        '--verbose flips the console to DEBUG without code changes; analyzer.log captures the full record',
        'Env var ANALYZER_LOG_LEVEL works and is overridden by the CLI flag when both are set',
        'echo $? demonstrates 0 / 1 / 2 for the three outcome classes',
        'Committed with a message describing the new interface',
      ],
    },
    mistakes: [
      'Using print() for diagnostics because "it works." It has no levels, timestamps, destinations, or off-switch — the four things you need the night production breaks. Reserve print for the program\'s actual output.',
      'Logging at the wrong level: everything at INFO (can never turn the noise down) or everything at ERROR (real alarms drown). Ask: who needs this line, and when?',
      'Calling logging.basicConfig() deep inside library code. Configuration belongs to the application entry point; libraries should only getLogger(__name__) and emit.',
      'Building string messages eagerly: logger.debug("row " + str(huge)) pays the formatting cost even when DEBUG is off. Use lazy %-style: logger.debug("row %s", huge).',
      'Printing "ERROR: ..." but exiting 0. Shells, cron, and CI only see the exit code — a failing script that exits 0 silently corrupts every pipeline built on it.',
      'Committing .env files or secrets in config. Environment-based config exists precisely to keep secrets OUT of the repo; .env goes in .gitignore on Day 20 if it is not there already.',
    ],
    quiz: [
      {
        q: 'Your code is full of logger.debug(...) calls but the level is set to INFO. What happens?',
        o: [
          'The debug lines print anyway — level is only a label',
          'The debug records are suppressed cheaply; turning the level to DEBUG later reveals them with no code change',
          'Python raises an error for unhandled records',
          'The debug lines go to a file automatically',
        ],
        x: 1,
        w: 'Levels are a dial: records below the threshold are dropped. That is the whole point — ship quiet, investigate loud, never rewrite.',
        revisit: 16,
      },
      {
        q: 'A script prints "FATAL: could not open file" but ends with sys.exit(0). What does a CI pipeline that ran it conclude?',
        o: [
          'Failure — it reads the output text',
          'Success — pipelines trust the exit code, and 0 means success',
          'It depends on the shell',
          'It retries automatically',
        ],
        x: 1,
        w: 'Downstream tools see only the integer exit status. 0 means success no matter what was printed — which is why wrong exit codes silently poison automation.',
        revisit: 16,
      },
      {
        q: 'With config precedence "flag > env var > default", the env var says DEBUG and the user passes --log-level ERROR. Effective level?',
        o: ['DEBUG', 'ERROR', 'WARNING (the default)', 'Both are applied'],
        x: 1,
        w: 'The most explicit, most local source wins: a CLI flag beats the environment, which beats the built-in default.',
        revisit: 16,
      },
    ],
    resources: [
      { label: 'Python Logging HOWTO (official tutorial)', url: 'https://docs.python.org/3/howto/logging.html', type: 'docs', time: '30 min' },
      { label: 'MIT Missing Semester — shell tools, env vars & scripting', url: 'https://missing.csail.mit.edu/', type: 'course', time: '25 min' },
      { label: 'Automate the Boring Stuff — running programs from the command line', url: 'https://automatetheboringstuff.com/', type: 'book', time: '20 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: due flashcards (incl. Day 15 hints)', minutes: 10 },
      { activity: 'ELI5 + tech read: levels, handlers, argparse, exit codes', minutes: 20 },
      { activity: 'Guided: print→logging swap + subcommands & exit codes', minutes: 40 },
      { activity: 'Practice: config precedence function with terminal proof', minutes: 20 },
      { activity: 'Project: the analyzer cockpit', minutes: 20 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'recorder_lab.py shows the verbosity dial working (INFO vs --verbose) with run.log capturing everything',
      'echo $? verified for success, missing-file, and bad-argument cases',
      'Analyzer upgraded with subcommands, logging, config precedence — committed',
      'Quiz ≥ 2/3',
    ],
    connections: {
      back: 'Day 6 gave you the shell where exit codes and env vars live; Day 5 gave you the file handling these subcommands wrap. The analyzer itself is the Day 14 project, freshly cleaned on Day 15.',
      forward: 'Day 17 packages this CLI as an installable console script. The flight-recorder idea returns at production scale on Day 142 (tracing LLM apps) and the log-mining flywheel on Day 143; environment-based config becomes 12-factor discipline on Day 45.',
    },
    flashcards: [
      { f: 'The five logging levels, in order?', b: 'DEBUG < INFO < WARNING < ERROR < CRITICAL; a logger emits records at or above its level.' },
      { f: 'Why logging over print()? (4 reasons)', b: 'Levels (dial), timestamps, destinations via handlers, per-module named channels — plus an off-switch.' },
      { f: 'Config precedence rule?', b: 'CLI flag > environment variable > built-in default. Most explicit wins.' },
      { f: 'Exit code convention?', b: '0 = success; nonzero = failure (often 1 runtime error, 2 bad usage). Pipelines trust the code, not the text.' },
      { f: 'Where does logging.basicConfig belong?', b: 'In the application entry point only — libraries just getLogger(__name__) and emit.' },
    ],
    deepDive: [
      { label: 'Structured (JSON) logging', note: 'Production services often log one JSON object per line so machines can query logs. Try formatting a record as JSON with the extra= parameter — this becomes standard practice in the capstone (Day 143).' },
    ],
  },
  {
    id: 'd017', day: 17, week: 3, phase: 1, kind: 'lesson',
    title: 'Packaging & Environments',
    analogy: 'Shipping the recipe box',
    objectives: [
      'Create and activate a virtual environment and explain what it isolates',
      'Declare dependencies in requirements.txt and in pyproject.toml, and say when each fits',
      'Lay out a project in src/ style and install it editable with pip install -e .',
      'Expose a console-script entry point so your tool runs as a real command',
      'Read a semantic version number and predict what a major/minor/patch bump promises',
    ],
    prereqs: [
      { day: 3, label: 'Modules & imports' },
      { day: 6, label: 'The terminal & PATH' },
      { day: 16, label: 'The analyzer CLI' },
    ],
    eli5: `You've perfected a dish in your own kitchen. A friend across the country wants to cook it. Mailing a note that says "make my curry" fails instantly: her kitchen has different pots, a different stove, and none of your spices. What actually works is shipping a **recipe box**: the recipe, an exact ingredient list with brands and amounts ("coconut milk, brand X, 400ml" — not "some coconut milk"), and a label saying which kitchen setup it needs.

That is packaging. A **virtual environment** is a clean rented kitchen per project — its own shelf of installed ingredients, so project A's tomato version never contaminates project B. \`requirements.txt\` and \`pyproject.toml\` are the ingredient list: exact names and versions, so \`pip\` (the grocery delivery service) can stock any empty kitchen identically. An **entry point** is the finishing touch: instead of telling your friend "run python path/to/that/script.py", the box installs a button on her counter labeled with your dish's name — she types \`loganalyzer\` anywhere and it just works. The test of a good recipe box is brutal and simple: someone who has never seen your kitchen can cook the dish from the box alone.`,
    why: `"Works on my machine" is the most expensive sentence in software, and environments are the cure. Every serious Python project you'll touch — sklearn pipelines (Day 82), the FastAPI service (Day 42), the capstone (Day 119) — starts with a venv and a pyproject.toml. Docker (Day 148) is this exact idea taken one level deeper: shipping the whole kitchen, not just the recipe box. For an FDE, reproducible installs are the difference between a 10-minute customer setup call and a lost afternoon of dependency archaeology on someone else's laptop.`,
    tech: `### Virtual environments

A venv is a directory containing a private Python and a private \`site-packages\` shelf. \`python -m venv .venv\` creates it; activating it (\`source .venv/bin/activate\`, or \`.venv\\Scripts\\activate\` on Windows) puts that private Python first on your PATH, so \`python\` and \`pip\` now mean *this project's* interpreter and shelf. Installs land in the project, not the system — which is what stops two projects from fighting over incompatible versions of the same library. Rule: one venv per project, never install into the system Python, and \`.venv/\` goes in \`.gitignore\` (you commit the ingredient list, not the pantry).

### Declaring dependencies

\`pip freeze > requirements.txt\` snapshots everything installed with exact versions — a **lockfile in spirit**: perfect for reproducing an environment, noisy as a statement of intent. \`pyproject.toml\` is the modern home for the project itself: metadata, *direct* dependencies with version ranges, and build configuration:

~~~toml
[project]
name = "loganalyzer"
version = "0.1.0"
dependencies = ["rich>=13"]

[project.scripts]
loganalyzer = "loganalyzer.cli:main"
~~~

The distinction matters: pyproject.toml says what you *need* ("rich, version 13 or later"); a lockfile records what you *got* (every transitive package, pinned). Modern tools (uv, pip-tools, poetry) generate the second from the first.

### src layout, editable installs, entry points, semver

The **src layout** puts the importable package under \`src/loganalyzer/\` with an \`__init__.py\`. Its virtue: your tests and scripts can only import the package if it is *installed*, which catches packaging mistakes immediately. \`pip install -e .\` performs an **editable install** — the environment links to your source directory instead of copying it, so edits take effect without reinstalling: the standard development mode. The \`[project.scripts]\` table creates real commands on PATH: \`loganalyzer = "loganalyzer.cli:main"\` means "make a command \`loganalyzer\` that calls the \`main\` function in \`loganalyzer/cli.py\`". Finally, **semantic versioning**: MAJOR.MINOR.PATCH, where a patch bump promises bug fixes only, minor adds features backwards-compatibly, and major signals breaking changes — which is why a range like \`>=13,<14\` is a common trust boundary.`,
    viz: null,
    guided: [
      {
        title: 'A clean kitchen: venv + pip, end to end',
        minutes: 15,
        body: `1. **Terminal:** in a new folder \`pkg-lab\`, create and activate a venv: \`python -m venv .venv\` then \`source .venv/bin/activate\` (Windows PowerShell: \`.venv\\Scripts\\Activate.ps1\`). Your prompt should now show \`(.venv)\`.
2. Prove isolation: \`pip list\` — nearly empty, no matter what your system Python has. \`which python\` (Windows: \`Get-Command python\`) — it points INSIDE .venv.
3. Install something: \`pip install rich\`, then run \`python -c "from rich import print; print('[bold green]isolated![/bold green]')"\`.
4. Snapshot: \`pip freeze > requirements.txt\` and open the file — notice rich brought friends (transitive dependencies), all pinned.
5. Deactivate (\`deactivate\`), run \`python -c "import rich"\` — with the system Python this should fail (or use a different rich). Reactivate. You now viscerally know what a venv isolates.`,
        code: `# The whole ritual, for reference (macOS/Linux):
python -m venv .venv
source .venv/bin/activate
pip list
pip install rich
pip freeze > requirements.txt
deactivate

# Windows PowerShell differences:
#   .venv\\Scripts\\Activate.ps1     (activate)
#   Get-Command python              (instead of which)`,
      },
      {
        title: 'The recipe box: pyproject.toml + editable install + entry point',
        minutes: 25,
        body: `1. Inside \`pkg-lab\` (venv active), build the src layout shown in the starter: \`src/greetkit/__init__.py\` and \`src/greetkit/cli.py\`, plus \`pyproject.toml\` at the root.
2. Type the pyproject.toml from the starter code — every line of it, so you know what each does.
3. **Terminal:** install your own package editable: \`pip install -e .\` — pip builds and links it. Run \`pip list\` and find greetkit pointing at your folder.
4. Run your new command from ANY directory: \`greet Ada\` then \`greet Ada --shout\`. There is no "python file.py" anymore — you shipped a tool.
5. Prove "editable": change the greeting text in \`cli.py\`, save, run \`greet Ada\` again — the change is live with no reinstall.
6. Bump \`version = "0.1.1"\` and state out loud what that bump promises under semver (bug fix only).`,
        code: `# ---- pyproject.toml ----
# [build-system]
# requires = ["setuptools>=68"]
# build-backend = "setuptools.build_meta"
#
# [project]
# name = "greetkit"
# version = "0.1.0"
# description = "A tiny demo package with a console script"
# requires-python = ">=3.12"
# dependencies = []
#
# [project.scripts]
# greet = "greetkit.cli:main"

# ---- src/greetkit/__init__.py ----
__version__ = "0.1.0"

# ---- src/greetkit/cli.py ----
import argparse

def main() -> None:
    parser = argparse.ArgumentParser(prog="greet")
    parser.add_argument("name")
    parser.add_argument("--shout", action="store_true")
    args = parser.parse_args()
    msg = f"hello, {args.name} — greetkit works"
    print(msg.upper() if args.shout else msg)`,
      },
    ],
    practice: [
      {
        title: 'The stranger test',
        minutes: 20,
        body: `Simulate a teammate's laptop: somewhere OUTSIDE pkg-lab, create a fresh venv, and get greetkit running in it using only what you would actually ship (the project folder without .venv).

Goal: \`greet World\` works in the fresh venv. Then break it on purpose: add \`dependencies = ["rich>=13"]\` to pyproject.toml, import rich in cli.py to colorize output, and reinstall — confirm pip pulled rich in automatically because the recipe box declared it.

Constraints: do not copy the old .venv; do not pip install rich manually — the metadata must do it.

Hints: \`pip install -e /path/to/pkg-lab\` works from anywhere; if the import fails, ask whether the dependency is declared where pip can see it.`,
      },
    ],
    project: {
      title: 'Package the log analyzer (skeleton)',
      brief: `Restructure your analyzer into a real package: \`src/loganalyzer/\` containing \`__init__.py\`, \`parser.py\` (the parsing/reporting logic from Days 14–16), and \`cli.py\` (the argparse cockpit); a \`pyproject.toml\` with metadata, \`version = "0.1.0"\`, and a \`[project.scripts]\` entry so \`loganalyzer report sample.log\` works as a bare command; a fresh venv with the package installed editable; and \`.venv/\` plus \`analyzer.log\` in .gitignore. Pass your own stranger test: fresh venv, \`pip install -e .\`, run the command. Commit the restructure. On Day 18 this package grows a test suite; on Day 21 it ships to GitHub as v0.1.0.`,
      rubric: [
        'src layout in place; imports go through the package (from loganalyzer.parser import ...)',
        'pyproject.toml has metadata, requires-python, dependencies, and a working console script',
        'loganalyzer runs from any directory with the venv active — no python path/to/script.py',
        'Stranger test passes in a brand-new venv using pip install -e . only',
        '.gitignore excludes .venv/ and generated logs; restructure committed',
      ],
    },
    mistakes: [
      'Installing everything into the system Python "just this once." Two projects later you have version conflicts nobody can untangle. One project, one venv, always.',
      'Committing the .venv/ folder. It is machine-specific and huge; commit the declarations (pyproject.toml / requirements.txt) — the pantry is rebuilt from the list.',
      'Confusing the two files: pyproject.toml declares direct needs with ranges; pip freeze output pins everything installed. Freezing INTO pyproject.toml buries intent under transitive noise.',
      'Forgetting to activate the venv, then wondering why pip installed "somewhere else." Check the prompt prefix or which python before installing.',
      'Running scripts by path (python src/loganalyzer/cli.py) after packaging. That bypasses the install and breaks package imports — use the console script or python -m loganalyzer.',
      'Reading version numbers as decoration. Under semver, accepting any-version dependencies means agreeing to future breaking changes sight-unseen; ranges like >=13,<14 are a contract.',
    ],
    quiz: [
      {
        q: 'What does pip install -e . actually do?',
        o: [
          'Copies your code into site-packages',
          'Links the environment to your source directory so edits apply without reinstalling',
          'Builds a wheel and uploads it to PyPI',
          'Installs only the dependencies, not the package',
        ],
        x: 1,
        w: 'Editable mode installs a link to your working directory — the standard development setup: import paths behave like a real install, but your edits are live.',
        revisit: 17,
      },
      {
        q: 'A library you depend on jumps from 2.4.1 to 3.0.0. Under semantic versioning, what should you expect?',
        o: [
          'Only bug fixes',
          'New features, fully backwards compatible',
          'Possible breaking changes — your code may need updates',
          'Nothing; version numbers carry no meaning',
        ],
        x: 2,
        w: 'A MAJOR bump is the signal for breaking changes. That is exactly why dependency ranges often pin below the next major (>=2.4,<3).',
        revisit: 17,
      },
      {
        q: 'Why does the src/ layout catch packaging bugs that a flat layout hides?',
        o: [
          'It makes imports faster',
          'Code can only import the package if it is properly installed, so a broken install fails immediately instead of accidentally importing local files',
          'pip requires it',
          'It lets you skip writing __init__.py',
        ],
        x: 1,
        w: 'With a flat layout, tests may silently import the local folder even when the install is broken. src/ forces every import through the installed package — honest failures, early.',
        revisit: 17,
      },
    ],
    resources: [
      { label: 'Packaging Python Projects — official tutorial', url: 'https://packaging.python.org/en/latest/tutorials/packaging-projects/', type: 'docs', time: '30 min' },
      { label: 'The Python Tutorial — modules & virtual environments chapters', url: 'https://docs.python.org/3/tutorial/index.html', type: 'docs', time: '20 min' },
      { label: 'Automate the Boring Stuff — installing third-party modules (appendix)', url: 'https://automatetheboringstuff.com/', type: 'book', time: '10 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: due flashcards', minutes: 10 },
      { activity: 'ELI5 + tech read: venvs, pyproject, entry points, semver', minutes: 20 },
      { activity: 'Guided: clean kitchen + the recipe box', minutes: 40 },
      { activity: 'Practice: the stranger test', minutes: 20 },
      { activity: 'Project: package the analyzer skeleton', minutes: 20 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'greetkit installs editable and runs as a bare command from any directory',
      'Stranger test passed in a fresh venv, including the declared-dependency variant',
      'Analyzer restructured to src layout with working console script — committed',
      'Quiz ≥ 2/3',
    ],
    connections: {
      back: 'Day 3\'s import system is what packaging organizes; Day 6\'s PATH is where console scripts land; the CLI you exposed as an entry point is Day 16\'s cockpit.',
      forward: 'Day 18 installs pytest into this venv and tests the package. Day 21 ships it as v0.1.0. Day 148 (Docker) is the same reproducibility promise extended to the OS itself — the whole kitchen, not just the recipe box.',
    },
    flashcards: [
      { f: 'What does a venv isolate?', b: 'A private interpreter + site-packages per project, activated by putting them first on PATH.' },
      { f: 'pyproject.toml vs pip freeze output?', b: 'pyproject: direct deps you NEED, with ranges. freeze: everything you GOT, pinned — a lockfile in spirit.' },
      { f: 'Editable install?', b: 'pip install -e . links the env to your source dir; edits are live without reinstalling.' },
      { f: 'semver MAJOR.MINOR.PATCH promises?', b: 'PATCH: fixes only. MINOR: compatible features. MAJOR: breaking changes allowed.' },
      { f: 'What creates the loganalyzer command?', b: 'A [project.scripts] entry point: name = "package.module:function", installed onto PATH.' },
    ],
    deepDive: [
      { label: 'uv — the fast modern package manager', note: 'The tool "uv" replaces venv+pip with one fast command set and real lockfiles (uv sync). Once the pip ritual is muscle memory, try recreating today\'s lab with uv init / uv add / uv run.' },
    ],
  },
  {
    id: 'd018', day: 18, week: 3, phase: 1, kind: 'lesson',
    title: 'Testing I — pytest Fundamentals',
    analogy: 'Seatbelts and smoke alarms',
    objectives: [
      'Explain what automated tests buy you and when they pay for themselves',
      'Write pytest test functions that pytest discovers and runs automatically',
      'Structure every test as arrange–act–assert and name it as a behavior sentence',
      'Turn a table of cases into one parametrized test',
      'Run a single test, a single file, and a keyword-filtered subset from the terminal',
    ],
    prereqs: [
      { day: 15, label: 'Clean, typed functions' },
      { day: 17, label: 'The packaged analyzer + venv' },
    ],
    eli5: `Nobody installs a smoke alarm because they expect a fire tonight. They install it because they plan to live in the house for years, and over years, *something* will eventually smolder — usually in the one room nobody is watching. A test suite is a wall of smoke alarms for your code: each test watches one behavior ("parsing a valid line yields the right record"), and the moment any future change makes that behavior stop being true, the alarm goes off — within seconds, while the change is still fresh in your head and trivial to undo.

The seatbelt half of the analogy is about *when* the payoff comes. A seatbelt is mildly annoying every single day, and then one day it is the only thing that matters. Tests feel the same: writing \`assert parse_line("") is None\` today is unglamorous. But in week 12, when you refactor the parser at 11 p.m., you will change code with total confidence — because 40 alarms are standing guard over every behavior you ever promised. Untested code isn't code without bugs; it is code where nobody will ever *dare* to change anything.`,
    why: `Tests are the profession's dividing line: hobby code is verified by running it and squinting; professional code is verified by a suite anyone can run. Every later phase leans on this — the FastAPI service is tested with TestClient (Day 42), CI runs your suite on every push (Day 152), and the biggest idea in AI engineering, evals (Day 134), is literally "pytest for model behavior": a fixed set of cases, run after every change, guarding against regressions you can't see by squinting at one output. Learn the reflex on deterministic code first.`,
    tech: `### Discovery and the anatomy of a test

pytest finds tests by convention, no registration needed: files named \`test_*.py\` (or \`*_test.py\`), containing functions named \`test_*\`. Inside, you use plain \`assert\` — and when an assertion fails, pytest rewrites it into a rich report showing the actual values on each side, which is why no special assertEqual methods are needed:

~~~python
def test_parse_line_extracts_fields():
    line = "10.0.0.1 200 /home"          # arrange
    record = parse_line(line)             # act
    assert record == {"ip": "10.0.0.1", "status": 200, "path": "/home"}  # assert
~~~

That three-beat shape — **arrange** the inputs, **act** once, **assert** on the outcome — keeps each test about one behavior. Name tests as sentences about behavior (\`test_malformed_line_returns_none\`), because the name is the error message future-you reads first.

### Parametrize: a table of cases, one test

When the same logic must hold across many inputs, don't copy-paste tests — feed pytest the table:

~~~python
import pytest

@pytest.mark.parametrize("line,expected_status", [
    ("10.0.0.1 200 /home", 200),
    ("10.0.0.9 404 /nope", 404),
    ("10.0.0.9 500 /api", 500),
])
def test_status_parsed(line, expected_status):
    assert parse_line(line)["status"] == expected_status
~~~

Each row runs as its own test with its own pass/fail — one failing row doesn't hide the others.

### What to test, and how to run it

Pure functions (input → output, no side effects) are the easy, high-value targets — one reason Day 15 pushed you toward small pure functions. I/O-touching code (files, network, time) needs the fixture tools you meet tomorrow; today, keep test targets pure. Running: \`pytest\` runs everything; \`pytest tests/test_parser.py\` one file; \`pytest -k malformed\` anything matching a keyword; \`pytest -x\` stops at the first failure; \`-q\` quiets the output. pytest's exit code is 0 only when all tests pass — which is exactly what lets CI (Day 152) block a bad merge automatically.`,
    viz: null,
    guided: [
      {
        title: 'First alarms on the analyzer',
        minutes: 20,
        body: `1. **Terminal:** with your analyzer venv active, \`pip install pytest\`, then create a \`tests/\` folder at the project root with an empty \`tests/__init__.py\` (or nothing — pytest does not need it) and \`tests/test_parser.py\`.
2. Write the three tests from the starter code against YOUR \`parse_line\` (adjust field names to match yours). Note each follows arrange–act–assert.
3. **Terminal:** run \`pytest -q\` from the project root. Because Day 17 installed your package editable, the import just works — that is the src-layout payoff.
4. Break the parser on purpose (make it return status as a string), run \`pytest -q\`, and READ the failure report: pytest shows both sides of the failed comparison. Revert the break.
5. Run a subset: \`pytest -k malformed -q\` and then a single test by node id: \`pytest tests/test_parser.py::test_malformed_line_returns_none -q\`.`,
        code: `from loganalyzer.parser import parse_line

def test_valid_line_parsed_to_record():
    record = parse_line("10.0.0.1 200 /home")
    assert record == {"ip": "10.0.0.1", "status": 200, "path": "/home"}

def test_malformed_line_returns_none():
    assert parse_line("not a log line") is None

def test_empty_line_returns_none():
    assert parse_line("") is None`,
      },
      {
        title: 'The parametrize upgrade',
        minutes: 15,
        body: `1. You are about to add a rule to the parser: status codes must be 100–599, else the line is malformed. Write the test FIRST as a parametrized table (starter code) — include valid edges (100, 599), invalid values (99, 600, 999), and a non-numeric case.
2. **Terminal:** run \`pytest -q\` — the new rows fail. Good: a failing test proves the test can fail, which is half its value.
3. Implement the range check in \`parse_line\`, rerun, and watch the table go green row by row.
4. Count what you got: one test function, six cases, six independent pass/fail results. Add one more edge row of your own invention.`,
        code: `import pytest
from loganalyzer.parser import parse_line

@pytest.mark.parametrize("line,expected", [
    ("1.1.1.1 100 /a", 100),     # lower edge: valid
    ("1.1.1.1 599 /a", 599),     # upper edge: valid
    ("1.1.1.1 99 /a",  None),    # below range: malformed
    ("1.1.1.1 600 /a", None),    # above range: malformed
    ("1.1.1.1 999 /a", None),
    ("1.1.1.1 abc /a", None),    # non-numeric
])
def test_status_range_rule(line, expected):
    record = parse_line(line)
    if expected is None:
        assert record is None
    else:
        assert record["status"] == expected`,
      },
    ],
    practice: [
      {
        title: 'Bug hunt by test',
        minutes: 20,
        body: `Paste this function into your project: it claims to return the top N most frequent items from a list, ties broken alphabetically. It contains two real bugs.

~~~python
def top_n(items: list[str], n: int) -> list[str]:
    counts = {}
    for item in items:
        counts[item] = counts.get(item, 0) + 1
    ranked = sorted(counts, key=lambda k: counts[k])
    return ranked[:n]
~~~

Your goal, in strict order: (1) write tests that EXPRESS the promised behavior (frequency descending, alphabetical ties, n larger than the number of distinct items); (2) run them and watch which fail; (3) fix the function until all pass. Do not fix by inspection first — let the tests find the bugs.

Hints: what order does sorted() use by default? How do you sort by two keys at once (hint: tuple keys, and negating a count reverses just that key)?`,
      },
    ],
    project: {
      title: 'A real suite for the analyzer',
      brief: `Grow \`tests/test_parser.py\` into a suite of at least 10 tests covering the analyzer's pure core: line parsing (valid, malformed, empty, status-range rule via parametrize), the top-IPs counting logic, and the error-summary logic. Every test named as a behavior sentence, every test arrange–act–assert. Where a function is hard to test because it mixes file I/O with logic, refactor: split the pure logic out (Day 15 muscle) and test that — leave the I/O shell thin. Finish with \`pytest -q\` fully green and commit tests + refactors together. Tomorrow the suite learns to test the I/O shell too, using fixtures.`,
      rubric: [
        'At least 10 tests, all green, discovered by bare pytest from the project root',
        'At least one parametrized test with 5+ rows including edge values',
        'Every test name reads as a behavior sentence (test_malformed_line_returns_none)',
        'At least one function refactored to separate pure logic from I/O for testability',
        'pytest exit code is 0 (verify with echo $? after the run); suite committed',
      ],
    },
    mistakes: [
      'Testing only the happy path. The malformed line, the empty file, the tie in the ranking — edges are where bugs live and where tests earn their keep.',
      'Multiple unrelated asserts in one test. When it fails you can\'t tell which behavior broke; one behavior per test keeps alarms specific.',
      'Vague test names (test_1, test_parser_works). The name is the first thing you read on failure — make it state the promise that broke.',
      'Never watching a new test fail. A test that passed from birth might be asserting nothing; break the code (or write the test first) to prove the alarm has a battery.',
      'Copy-pasting near-identical tests instead of parametrizing. Ten copies hide the pattern and rot independently; one table shows intent and fails row by row.',
      'Writing tests that depend on each other or on run order. pytest may run any subset in any order; each test must arrange its own world.',
    ],
    quiz: [
      {
        q: 'Which function will pytest automatically collect and run?',
        o: [
          'check_parser() in tests/test_parser.py',
          'test_parser_handles_empty() in tests/test_parser.py',
          'test_parser() in notes.py',
          'parser_test() inside a random script',
        ],
        x: 1,
        w: 'Discovery is by convention: test_*.py files (under the tested paths) containing test_* functions. Wrong prefixes on the file or function mean silent non-collection.',
        revisit: 18,
      },
      {
        q: 'Why write a failing test before fixing/implementing the behavior?',
        o: [
          'It is a formality from TDD dogma',
          'A test you have watched fail is proven able to detect the bug; one that passed from birth may assert nothing',
          'pytest requires failures first',
          'It makes the suite run faster',
        ],
        x: 1,
        w: 'The failure is the test\'s battery check. Red-then-green proves the alarm actually fires for the condition it guards.',
        revisit: 18,
      },
      {
        q: 'You have 8 input/expected pairs for one rule. The pytest-idiomatic structure is…',
        o: [
          'Eight copy-pasted test functions',
          'One test with eight asserts in sequence',
          'One @pytest.mark.parametrize test with eight rows, each reported independently',
          'A for-loop inside one test body',
        ],
        x: 2,
        w: 'Parametrize gives each row its own pass/fail. Eight asserts or a loop stop at the first failure and hide the rest; eight copies rot independently.',
        revisit: 18,
      },
    ],
    resources: [
      { label: 'pytest — Get Started (official)', url: 'https://docs.pytest.org/en/stable/getting-started.html', type: 'docs', time: '20 min' },
      { label: 'pytest Documentation — how-to guides index', url: 'https://docs.pytest.org/en/stable/', type: 'docs', time: '20 min' },
      { label: 'pytest — How to use fixtures (skim: tomorrow\'s tools)', url: 'https://docs.pytest.org/en/stable/how-to/fixtures.html', type: 'docs', time: '15 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: due flashcards', minutes: 10 },
      { activity: 'ELI5 + tech read: discovery, AAA, parametrize', minutes: 20 },
      { activity: 'Guided: first alarms + the parametrize upgrade', minutes: 35 },
      { activity: 'Practice: bug hunt by test', minutes: 20 },
      { activity: 'Project: grow the analyzer suite to 10+ tests', minutes: 25 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'pytest -q green on a suite of ≥ 10 tests including a 5+ row parametrized table',
      'Both top_n bugs found by tests before reading the code for them',
      'One I/O-mixed function refactored for testability',
      'Quiz ≥ 2/3',
    ],
    connections: {
      back: 'Day 15\'s small pure functions are exactly what makes today painless — logic you can call with a value and assert on. Day 17\'s editable install is why tests/ can import your package cleanly.',
      forward: 'Day 19 adds fixtures, tmp_path, and mocking so the I/O shell gets tested too. Day 21 requires the suite to ship green. Day 141/152 put this suite (and eval suites — the same idea aimed at LLMs, Day 134) into CI where a red run blocks the merge.',
    },
    flashcards: [
      { f: 'pytest discovery convention?', b: 'Files test_*.py, functions test_* — collected automatically, no registration.' },
      { f: 'Arrange–act–assert?', b: 'Set up inputs; call the code once; assert on the outcome. One behavior per test.' },
      { f: 'Why parametrize over copy-paste?', b: 'Each row is an independent pass/fail; the table shows intent; one failing row doesn\'t hide others.' },
      { f: 'Run only tests matching a word?', b: 'pytest -k word; single test via node id file.py::test_name; -x stops at first failure.' },
      { f: 'Why must you see a new test fail once?', b: 'Proves it can detect the bug — a born-green test may assert nothing.' },
    ],
    deepDive: [
      { label: 'Evals are tests for models', url: 'https://hamel.dev/blog/posts/evals/', note: 'Skim the opening: the eval loop you\'ll build on Day 134 is this exact discipline — fixed cases, run on every change — pointed at LLM behavior instead of parse_line.' },
    ],
  },
  {
    id: 'd019', day: 19, week: 3, phase: 1, kind: 'lesson',
    title: 'Testing II & Debugging',
    analogy: 'The crime-scene kit',
    objectives: [
      'Use fixtures to share setup, and tmp_path to test file-writing code safely',
      'Replace an environment dependency in a test with monkeypatch, and say when mocking is a smell',
      'Read a traceback bottom-up and locate the true failing frame',
      'Drive pdb via breakpoint(): inspect variables, step, and continue',
      'Convert any fixed bug into a permanent regression test',
    ],
    prereqs: [
      { day: 18, label: 'pytest fundamentals' },
      { day: 5, label: 'Files & exceptions' },
    ],
    eli5: `When a detective arrives at a crime scene, the amateurs are already trampling it — moving furniture, guessing suspects, changing things at random. The professional does something slower and far faster: cordon off the scene, photograph everything exactly as found, dust for prints, and only THEN form a theory. Debugging is the same discipline. The traceback is the photograph — a complete record of where the program died and every call that led there; you read it before touching anything. The debugger (\`pdb\`) is the fingerprint kit — it freezes the program mid-crime so you can inspect every variable as it actually was, not as you assume it was. Bisection is narrowing the suspect list: cut the possibilities in half, test, repeat.

And today's testing tools are the forensics lab itself: **fixtures** are prepared, sterile workbenches every analysis starts from — same setup, every time, torn down after. \`tmp_path\` hands each test a disposable room so file experiments can't contaminate the real house. When the case closes, one rule separates professionals from amateurs: every solved crime becomes a **regression test** — an alarm rigged so this exact crime can never be committed silently again.`,
    why: `Interview reality: you will spend far more professional hours debugging than writing fresh code, and LLM systems make it harder — failures are often buried in glue code, not the model. The discipline transfers directly: reading a traceback calmly is the same skill as reading a failed trace on Day 142; bisection is how you find which prompt change broke an eval on Day 141; "reproduce, then fix, then rig the alarm" is exactly the log-to-eval-case flywheel of Day 143. FDEs debug in customer environments with limited access (Day 172) — method, not luck, is all you get to bring.`,
    tech: `### Fixtures: the prepared workbench

A fixture is a function pytest runs to build something your test needs; tests request it by naming it as a parameter:

~~~python
import pytest

@pytest.fixture
def sample_log(tmp_path):
    p = tmp_path / "sample.log"
    p.write_text("10.0.0.1 200 /home\n10.0.0.2 500 /api\n")
    return p

def test_report_counts_lines(sample_log):
    assert count_lines(sample_log) == 2
~~~

\`tmp_path\` is itself a built-in fixture: a unique temporary directory per test, created fresh and cleaned up for you — the only sane way to test code that writes files. Fixtures with \`yield\` run teardown after the yield; scopes (\`function\`, \`module\`, \`session\`) control how often setup reruns. **monkeypatch** (another built-in) temporarily replaces attributes or environment variables for one test — \`monkeypatch.setenv("ANALYZER_LOG_LEVEL", "DEBUG")\` — and undoes it automatically. Mocking judgment in one line: replace things at your system's *boundaries* (network, clock, environment); when you find yourself mocking your own internals, the design is telling you to refactor, not the test to mock harder.

### Reading the crime-scene photo

A traceback lists frames oldest-first; read it **bottom-up**: the last line names the exception and message, the frame above it is where it was raised, and you walk upward until you reach the last frame in *your* code — that is usually where the wrong assumption lives. The exception message is evidence, not decoration: "KeyError: 'status'" tells you exactly which key was missing.

### The debugger and the method

Drop \`breakpoint()\` on any line; running the program pauses there in pdb. The commands that matter: \`p expr\` (print a value), \`l\` (show code), \`n\` (next line), \`s\` (step into a call), \`c\` (continue), \`q\` (quit). In pytest, \`pytest --pdb\` drops you into the debugger at the point of failure. The wider method: reproduce the bug with the smallest input that triggers it; bisect the suspects (comment out half, or \`git bisect\` across commits); explain the code line by line to a rubber duck — verbalizing forces the assumption you keep skipping into the open. Then: fix, and encode the bug as a regression test named after it, so the suite remembers what you learned.`,
    viz: null,
    guided: [
      {
        title: 'Fixtures + tmp_path: testing the I/O shell',
        minutes: 20,
        body: `1. In \`tests/test_io.py\`, write the \`sample_log\` fixture from the starter code, then tests for your analyzer's file-facing functions: reading a log file, and the missing-file behavior.
2. **Terminal:** run \`pytest tests/test_io.py -q\` — note each test got its own fresh tmp_path; print it with \`p = tmp_path; print(p)\` once to see where pytest puts it.
3. Add the monkeypatch test from the starter: it sets the \`ANALYZER_LOG_LEVEL\` env var and asserts your Day 16 \`get_log_level\` precedence function honors it — without polluting your real shell.
4. Add a teardown demo: a fixture with \`yield\` that prints "setup" before and "teardown" after; run with \`pytest -s\` once to watch the order. Delete the prints after.`,
        code: `import pytest
from loganalyzer.parser import read_records          # adapt names to yours
from loganalyzer.cli import get_log_level

@pytest.fixture
def sample_log(tmp_path):
    p = tmp_path / "sample.log"
    p.write_text("10.0.0.1 200 /home\n10.0.0.2 500 /api\nnot a line\n")
    return p

def test_read_records_skips_malformed(sample_log):
    records = read_records(sample_log)
    assert len(records) == 2

def test_missing_file_raises(tmp_path):
    ghost = tmp_path / "ghost.log"
    with pytest.raises(FileNotFoundError):
        read_records(ghost)

def test_env_var_sets_level(monkeypatch):
    monkeypatch.setenv("ANALYZER_LOG_LEVEL", "DEBUG")
    assert get_log_level(cli_value=None) == "DEBUG"

def test_cli_flag_beats_env(monkeypatch):
    monkeypatch.setenv("ANALYZER_LOG_LEVEL", "DEBUG")
    assert get_log_level(cli_value="ERROR") == "ERROR"`,
      },
      {
        title: 'The pdb tour of a real crash',
        minutes: 15,
        body: `1. Create \`crime_scene.py\` from the starter — it crashes. **Terminal:** run \`python crime_scene.py\` and read the traceback BOTTOM-UP: name the exception, the raising line, and the last frame in "your" code before looking further.
2. Add \`breakpoint()\` on the line above the crash site and rerun. You are now in pdb at the frozen scene.
3. Interrogate: \`p record\`, \`p record.get("status")\`, \`l\` to see surrounding code, \`n\` to step one line. Find the flawed assumption (some records have no status key).
4. Quit (\`q\`), fix the function to handle the missing key, remove breakpoint(), and rerun clean.
5. Now the professional finish: write the regression test \`test_summary_handles_record_without_status\` in your suite, watch it pass, and note it would have FAILED before your fix (check by temporarily reverting).`,
        code: `records = [
    {"ip": "10.0.0.1", "status": 200},
    {"ip": "10.0.0.2", "status": 500},
    {"ip": "10.0.0.3"},              # no status: the seed of the crime
]

def error_rate(records):
    errors = 0
    for record in records:
        # breakpoint()  # <- uncomment to freeze the scene here
        if record["status"] >= 500:   # KeyError on record 3
            errors += 1
    return errors / len(records)

print(f"error rate: {error_rate(records):.0%}")

# pdb cheat sheet:  p expr   l   n   s   c   q
# pytest variant:   pytest --pdb   (drops into pdb at first failure)`,
      },
    ],
    practice: [
      {
        title: 'Bisect the mystery',
        minutes: 20,
        body: `Download nothing — write \`mystery.py\`: a pipeline of six small functions chained together (normalize -> split -> filter -> parse -> aggregate -> format), where you deliberately plant one subtle bug in a function chosen by a coin flip (e.g. an off-by-one slice, a swapped comparison). Wait one hour if you can, or better: have the AI tutor plant the bug for you in a version you don't read.

Goal: find the buggy stage using bisection ONLY — check the intermediate value at the pipeline's midpoint, decide which half is guilty, and repeat. You get a maximum of 3 inspection points before naming the stage. Then confirm with pdb, fix, and write the regression test.

Hints: printing (or asserting on) the midpoint value tells you if corruption happened before or after it — that single bit halves the search space, exactly like Day 22's binary search will.`,
      },
    ],
    project: {
      title: 'Harden the analyzer suite',
      brief: `Extend your analyzer's test suite to cover the I/O shell: file reading via \`tmp_path\` fixtures (valid file, file with malformed lines, empty file, missing file), env-var config via \`monkeypatch\` (both precedence directions), and at least one regression test reproducing a real bug you have personally hit since Day 14 — named \`test_regression_<description>\`, with a one-line comment citing the original symptom. Refactor anything that resists testing (a function that opens files AND computes — split it). Target: 15+ total tests, all green, no test touching the real filesystem outside tmp_path. Commit. This suite is a Day 21 shipping requirement, and its green run becomes a CI gate on Day 152.`,
      rubric: [
        'File-facing behavior covered: valid, malformed-lines, empty, and missing file — all via tmp_path',
        'Config precedence tested both ways with monkeypatch, leaving the real environment untouched',
        'At least one regression test named after a real past bug, with the symptom documented',
        'No test reads or writes outside tmp_path; suite order-independent (pytest -p no:randomly not needed)',
        '15+ tests green; committed with tests and refactors together',
      ],
    },
    mistakes: [
      'Reading a traceback top-down and fixating on the first frame (often framework code). Read bottom-up: exception line first, then the deepest frame in YOUR code.',
      'Guess-editing before reproducing. If you cannot trigger the bug on demand with a minimal input, you cannot know your fix fixed it.',
      'Testing file code against real project files. They change, tests break mysteriously, and a buggy test can overwrite real data — tmp_path exists precisely for this.',
      'Mocking your own internals to force a test to pass. Boundary mocks (env, network, clock) are healthy; internal mocks mean the design needs splitting, not the test more magic.',
      'Deleting the breakpoint()-driven insight without capturing it. The bug you just fixed is the cheapest test case you will ever get — rig the alarm while the scene is fresh.',
      'Leaving breakpoint() calls in committed code. They freeze production processes; grep for breakpoint before every commit (a pre-commit hook can do this for you).',
    ],
    quiz: [
      {
        q: 'A test needs a log file on disk. The right approach is…',
        o: [
          'Write to ./test.log in the repo and delete it at the end',
          'Use the tmp_path fixture — a fresh disposable directory per test, cleaned up automatically',
          'Read a real log from production',
          'Skip testing file code; it cannot be tested',
        ],
        x: 1,
        w: 'tmp_path gives isolation (tests can\'t collide or pollute the repo) and automatic cleanup — manual ./test.log schemes leak files and create order dependence.',
        revisit: 19,
      },
      {
        q: 'Where do you look FIRST in a long traceback?',
        o: [
          'The first line — that is where it started',
          'The last line (exception type + message), then walk up to the deepest frame in your own code',
          'The middle frame',
          'The line numbers only',
        ],
        x: 1,
        w: 'The bottom names the crime; the frames above it show where. Framework frames near the top are usually victims, not culprits.',
        revisit: 19,
      },
      {
        q: 'You fixed a bug found in production. What turns that incident into permanent protection?',
        o: [
          'A comment explaining the fix',
          'A journal entry',
          'A regression test that reproduces the original bug and now passes',
          'Renaming the function',
        ],
        x: 2,
        w: 'Only an automated test re-checks the behavior on every future change. Comments and memories don\'t run in CI; regression tests do.',
        revisit: 19,
      },
    ],
    resources: [
      { label: 'pytest — How to use fixtures (official)', url: 'https://docs.pytest.org/en/stable/how-to/fixtures.html', type: 'docs', time: '30 min' },
      { label: 'MIT Missing Semester — debugging & profiling lecture', url: 'https://missing.csail.mit.edu/', type: 'course', time: '30 min' },
      { label: 'pytest Documentation — monkeypatch & tmp_path references', url: 'https://docs.pytest.org/en/stable/', type: 'docs', time: '15 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: due flashcards', minutes: 10 },
      { activity: 'ELI5 + tech read: fixtures, tracebacks, pdb, regression tests', minutes: 20 },
      { activity: 'Guided: tmp_path/monkeypatch tests + the pdb tour', minutes: 35 },
      { activity: 'Practice: bisect the mystery', minutes: 20 },
      { activity: 'Project: harden the analyzer suite to 15+ tests', minutes: 25 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'I/O shell tested end to end via tmp_path; env precedence via monkeypatch',
      'crime_scene.py debugged with pdb and its bug preserved as a passing regression test',
      'Mystery pipeline bug found within 3 bisection probes',
      'Suite at 15+ green tests, committed; quiz ≥ 2/3',
    ],
    connections: {
      back: 'Day 18 taught alarms for pure logic; today the I/O shell from Day 5 and the config code from Day 16 got their alarms too. The bisection method is Day 22\'s O(log n) insight applied to detective work.',
      forward: 'Day 21 ships only when this suite is green. git bisect (same idea across commits) appears when history gets long; on Day 141 a failing eval is bisected across prompt changes, and Day 172 runs this whole method inside a customer\'s locked-down environment.',
    },
    flashcards: [
      { f: 'How does a test get a fixture?', b: 'Declare it as a parameter; pytest builds and injects it. yield fixtures run teardown after the yield.' },
      { f: 'tmp_path gives you…?', b: 'A unique, auto-cleaned temporary directory per test — the only safe place for file-writing tests.' },
      { f: 'Traceback reading order?', b: 'Bottom-up: exception + message last line, then the deepest frame in your own code.' },
      { f: 'Five pdb commands?', b: 'p (print expr), l (list code), n (next line), s (step in), c (continue). Enter via breakpoint().' },
      { f: 'When is mocking a design smell?', b: 'When you mock your OWN internals. Mock boundaries (env, network, clock); refactor internals instead.' },
      { f: 'Regression test?', b: 'A test that reproduces a fixed bug so it can never return silently. Every fixed bug should leave one behind.' },
    ],
    deepDive: [
      { label: 'git bisect', note: 'When a bug appeared "sometime in the last 40 commits," git bisect binary-searches history: mark one good and one bad commit and it checks out midpoints until the guilty commit is found. Try it on your repo after Day 20 gives you more history.' },
    ],
  },
  {
    id: 'd020', day: 20, week: 3, phase: 1, kind: 'lesson',
    title: 'GitHub Collaboration',
    analogy: 'Working on the same house',
    objectives: [
      'Connect a local repo to GitHub over SSH and push/pull/fetch confidently',
      'Work on a feature branch and explain why main stays always-shippable',
      'Create a merge conflict on purpose, read the markers, and resolve it correctly',
      'Open a pull request, review a diff line by line, and merge it',
      'Distinguish merge from rebase as two histories of the same work',
    ],
    prereqs: [
      { day: 8, label: 'Git fundamentals — the time machine' },
      { day: 17, label: 'The packaged analyzer repo' },
    ],
    eli5: `Two carpenters renovating the same house can't both plane the same door at once — one of them ends up with wood shavings and no door. So real crews work differently: the site office holds the **master blueprint** (the GitHub remote), and each carpenter takes a copy, builds their piece in a separate room (**a branch**), and when the room is done, calls the site inspector for a walkthrough (**a pull request**) before the room is joined to the house. If two people did touch the same wall, the blueprints don't guess — they flag the wall with bright tape (**conflict markers**) and make a human decide which version stands, or how to combine them.

The crucial mindset shift from Day 8: git stops being your private time machine and becomes a **coordination protocol**. \`push\` mails your save points to the site office; \`fetch\` collects everyone else's without changing your room; \`pull\` collects AND applies them. And the house rule that makes it all work: the main blueprint must always describe a livable house — unfinished experiments live on branches, never on main.`,
    why: `Every job you will ever hold runs on this workflow — branch, PR, review, merge is how software teams breathe. Your GitHub profile is also your portfolio: from Day 21 onward, every project in this program ships there, and hiring managers genuinely read it (Day 180's checklist counts on that). The PR skills cut both ways: writing reviewable PRs gets your work merged; reviewing diffs carefully is how you'll catch a teammate's prompt regression on Day 141. Even solo, PRs against yourself add a deliberate review pause that catches what the writing brain missed.`,
    tech: `### Remotes and the three verbs

A **remote** is a named URL of another copy of the repo; \`origin\` is the conventional name for yours on GitHub. \`git clone URL\` copies a repo and wires origin automatically; for an existing repo, \`git remote add origin URL\` then \`git push -u origin main\` (the \`-u\` links your local branch to its remote counterpart, making future pushes plain \`git push\`). The three verbs differ precisely: **push** uploads your commits; **fetch** downloads remote commits into origin/main without touching your files; **pull** = fetch + merge into your current branch. When collaborating (or pushing from two machines), pull before you push — the remote rejects pushes that would discard commits it has and you don't.

### Branches and the two histories

\`git switch -c feature/top-ips\` creates and enters a branch — an independent line of commits. Merging brings it back: \`git switch main; git merge feature/top-ips\`. If main also moved, git creates a merge commit with two parents. **Rebase** (\`git rebase main\` while on the feature branch) instead replays your commits on top of main's latest, yielding a straight-line history with no merge commit. Mental model: merge records history as it happened; rebase rewrites your branch as if you had started it later. Both are legitimate; the one hard rule is never rebase commits you have already pushed for others to build on — rewriting shared history strands everyone else.

### Conflicts and pull requests

A conflict happens only when both sides changed the *same lines*. Git inserts markers — your version between \`<<<<<<<\` and \`=======\`, theirs between \`=======\` and \`>>>>>>>\` — and stops. You edit the file to the text that should win (often a hand-woven combination), delete all three marker lines, \`git add\` the file, and complete the merge with \`git commit\`. Nothing is lost; git just refuses to guess.

A **pull request** is GitHub's review room: it shows the full diff of a branch against main, hosts line-by-line comments, and (on teams) runs CI checks before allowing merge. Review etiquette that transfers everywhere: review the code, not the person; ask questions instead of issuing verdicts; small PRs get good reviews, thousand-line PRs get rubber stamps. Round out a public repo with a README (what, why, quickstart), a LICENSE (no license means "all rights reserved" — nobody can legally use it), and issues as the to-do list attached to the code.`,
    viz: null,
    guided: [
      {
        title: 'SSH keys and the first push',
        minutes: 20,
        body: `1. **Terminal:** generate an SSH key if you have none: \`ssh-keygen -t ed25519 -C "your_email@example.com"\` (accept defaults). Print the public half: \`cat ~/.ssh/id_ed25519.pub\`.
2. On github.com: Settings -> SSH and GPG keys -> New SSH key -> paste the public key. (Never paste the private file — the one without .pub.)
3. **Terminal:** verify the handshake: \`ssh -T git@github.com\` — expect a greeting with your username.
4. On GitHub, create an empty repo named \`loganalyzer\` (no README — your local repo already has history). **Terminal:** wire and push:
5. \`git remote add origin git@github.com:YOURUSER/loganalyzer.git\` then \`git push -u origin main\`. Refresh the GitHub page — your Day 14–19 commit history is now public. Read your own commit messages as a stranger would.`,
        code: `# The ritual, for reference:
ssh-keygen -t ed25519 -C "you@example.com"
cat ~/.ssh/id_ed25519.pub        # paste THIS one into GitHub
ssh -T git@github.com            # "Hi YOURUSER!" = success

git remote add origin git@github.com:YOURUSER/loganalyzer.git
git remote -v                    # sanity check the wiring
git push -u origin main          # -u links main <-> origin/main
git push                         # all future pushes are this short`,
      },
      {
        title: 'Manufacture a conflict, then resolve it like an adult',
        minutes: 20,
        body: `1. **Terminal:** create a branch and change the README's first line: \`git switch -c feature/readme-tagline\`, edit, commit.
2. Sabotage yourself: \`git switch main\`, edit the SAME first line to something different, commit. Two lines of history now disagree about one line of text.
3. \`git merge feature/readme-tagline\` — git stops: CONFLICT. Run \`git status\` (lists the conflicted file) and open it: find the \`<<<<<<<\`, \`=======\`, \`>>>>>>>\` markers and identify which block is whose.
4. Edit the file to the line that SHOULD exist (combine both ideas), delete all marker lines, then \`git add README.md\` and \`git commit\`. Run \`git log --oneline --graph\` — see the two lines of history joining in the merge commit.
5. Repeat the whole exercise once more but resolve by keeping the branch's version untouched — resolution is an editorial decision, not a fixed recipe.`,
        code: `git switch -c feature/readme-tagline
# edit README.md line 1 -> "Fast log analysis from the terminal"
git commit -am "readme: punchier tagline"
git switch main
# edit README.md line 1 -> "A log analyzer written in Python"
git commit -am "readme: clarify description"
git merge feature/readme-tagline
# CONFLICT (content): Merge conflict in README.md

# README.md now contains:
# <<<<<<< HEAD
# A log analyzer written in Python
# =======
# Fast log analysis from the terminal
# >>>>>>> feature/readme-tagline

# edit to the line you want, remove markers, then:
git add README.md
git commit
git log --oneline --graph --all`,
      },
    ],
    practice: [
      {
        title: 'The self-review PR',
        minutes: 20,
        body: `Ship a real improvement through the full workflow with no shortcuts: branch \`feature/errors-by-hour\` -> implement a small feature in the analyzer (e.g. group error counts by hour of day) WITH a test -> push the branch -> open a PR on GitHub with a description that states what changed and why -> then switch hats: review your own diff line by line on GitHub and leave at least two genuine line comments (one question, one improvement you then actually make and push) -> merge, then \`git pull\` on local main.

Constraints: the PR description must let a stranger understand the change without reading the code; the review comments must be ones you'd be comfortable receiving.

Hints: push the branch with \`git push -u origin feature/errors-by-hour\`; GitHub will offer the PR banner. Reviewing your own code works best after a 10-minute break.`,
      },
    ],
    project: {
      title: 'Make the repo public-grade',
      brief: `Turn the loganalyzer repo into something you would link in a job application: (1) a README with a one-line pitch, install instructions (\`pip install -e .\` in a venv), usage examples for each subcommand with real output, and a "running the tests" section; (2) a LICENSE file (MIT is the usual default — read its 3 clauses before adopting them); (3) a .gitignore audit (.venv/, __pycache__/, *.log); (4) two GitHub issues written as a real to-do list (one bug or improvement, one Day 21 shipping task); (5) all of it landed via a reviewed-and-merged PR, not direct pushes to main. From today, main in this repo stays always-shippable.`,
      rubric: [
        'README lets a stranger install and run the tool without asking you anything',
        'LICENSE present and you can state in one sentence what it permits',
        'SSH-based push works; git remote -v shows the origin wiring',
        'Feature merged through a PR containing at least two of your own line comments',
        'Two issues open with actionable titles; .gitignore audit committed',
      ],
    },
    mistakes: [
      'Committing directly to main out of habit. The always-shippable rule dies quietly this way; branch even for small changes — the workflow must be muscle memory before a team demands it.',
      'Confusing fetch and pull. fetch is always safe (downloads, touches nothing of yours); pull rewrites your working branch. When unsure of the remote\'s state, fetch first and look.',
      'Panicking at conflict markers and deleting one side blindly. The markers are a question, not an error — read both versions; the right answer is often a combination.',
      'Resolving a conflict but forgetting to remove the marker lines. <<<<<<< committed into a file is embarrassingly common — and your Day 18 tests will catch it only if a test touches that file.',
      'Rebasing a branch others (or another machine of yours) already pulled. Rewriting shared history forces everyone downstream into recovery surgery; rebase only unpushed local work.',
      'Pasting the private key into GitHub, or committing it. The .pub file is the shareable half; the other file never leaves your machine — treat it like a password.',
    ],
    quiz: [
      {
        q: 'git fetch vs git pull — the real difference?',
        o: [
          'They are synonyms',
          'fetch downloads remote commits without changing your branch; pull is fetch plus merging them into it',
          'pull downloads without changing anything; fetch merges',
          'fetch only works over SSH',
        ],
        x: 1,
        w: 'fetch updates your view of the remote (origin/main) and nothing else — always safe. pull additionally merges into your current branch, changing your files.',
        revisit: 20,
      },
      {
        q: 'When does a merge produce conflict markers?',
        o: [
          'Whenever two branches both have new commits',
          'Only when both branches changed the same lines of the same file',
          'Whenever files were renamed',
          'On every merge, by design',
        ],
        x: 1,
        w: 'Git auto-merges changes to different files or different regions silently. Only same-line disagreement makes it stop and ask a human.',
        revisit: 20,
      },
      {
        q: 'Your public repo has no LICENSE file. Legally, what can others do with the code?',
        o: [
          'Anything — public means free',
          'Use it with attribution',
          'Almost nothing: default copyright applies, so they may read but not legally reuse it',
          'Only fork it privately',
        ],
        x: 2,
        w: 'No license means all rights reserved. If you want your portfolio projects usable (and you do), add an explicit license like MIT.',
        revisit: 20,
      },
    ],
    resources: [
      { label: 'Learn Git Branching — interactive branch/merge/rebase levels', url: 'https://learngitbranching.js.org/', type: 'course', time: '30 min' },
      { label: 'GitHub Docs — Get Started (SSH, repos, pull requests)', url: 'https://docs.github.com/en/get-started', type: 'docs', time: '25 min' },
      { label: 'Pro Git — Chapter 3: Git Branching (free book)', url: 'https://git-scm.com/book/en/v2', type: 'book', time: '30 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: due flashcards (incl. Day 8 git deck)', minutes: 10 },
      { activity: 'ELI5 + tech read: remotes, branches, conflicts, PRs', minutes: 20 },
      { activity: 'Guided: SSH + first push, then the manufactured conflict', minutes: 40 },
      { activity: 'Practice: the self-review PR', minutes: 20 },
      { activity: 'Project: make the repo public-grade', minutes: 20 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'ssh -T git@github.com greets you by username; repo pushed with full history',
      'One conflict manufactured, read, and resolved — twice, with different editorial outcomes',
      'Feature merged via a PR with your own line comments; README/LICENSE/issues in place',
      'Quiz ≥ 2/3',
    ],
    connections: {
      back: 'Day 8 gave you commits as private save points; today they became a shared protocol. The README documents the CLI from Day 16 and the install flow from Day 17; the PR\'s diff discipline reuses Day 15\'s readability standards.',
      forward: 'Day 21 ships v0.1.0 through exactly this workflow. GitHub Actions turns PRs into CI gates on Day 152, eval gates ride those PRs on Day 141, and your green-squared profile is a first-class exhibit on Day 180.',
    },
    flashcards: [
      { f: 'push / fetch / pull in one line each?', b: 'push: upload commits. fetch: download remote state, touch nothing. pull: fetch + merge into current branch.' },
      { f: 'Conflict marker anatomy?', b: '<<<<<<< your side, ======= divider, >>>>>>> their side. Edit to the right text, delete markers, add, commit.' },
      { f: 'Merge vs rebase?', b: 'Merge records both lines joining (merge commit). Rebase replays your commits on top for straight-line history. Never rebase pushed/shared commits.' },
      { f: 'Why does main stay always-shippable?', b: 'Work happens on branches; only reviewed PRs land. main is the version anyone can deploy or clone right now.' },
      { f: 'Repo with no LICENSE — usable?', b: 'No: default copyright, all rights reserved. Add MIT (or similar) so portfolio code is legally reusable.' },
    ],
    deepDive: [
      { label: 'GitHub Actions preview', url: 'https://docs.github.com/en/actions', note: 'Peek at a minimal workflow YAML that runs pytest on every push. You\'ll build this properly on Day 152 — but even a 10-line version on your repo now means no broken main, ever.' },
    ],
  },
  {
    id: 'd021', day: 21, week: 3, phase: 1, kind: 'review',
    title: 'Week 3 Checkpoint: Ship a Tested Package',
    analogy: 'Your first shipped tool',
    objectives: [
      'Recall the week\'s core moves from memory: hints, logging, packaging, testing, PRs',
      'Rebuild the packaging ritual (venv → pyproject → editable install → console script) without notes',
      'Ship loganalyzer v0.1.0: packaged, typed, logged, tested, documented, on GitHub',
      'Diagnose your weakest topic from quiz history and close the gap today',
    ],
    prereqs: [
      { day: 15, label: 'Clean code & type hints' },
      { day: 17, label: 'Packaging & environments' },
      { day: 18, label: 'pytest fundamentals' },
      { day: 20, label: 'GitHub collaboration' },
    ],
    eli5: `There is a moment in every craftsperson's apprenticeship when a tool they made stops being "practice" and gets handed to a stranger to actually use. That moment changes everything about how you finish the work: the handle gets sanded because someone else's hand will hold it, the box gets a label because you won't be there to explain it. Today is that moment for your log analyzer — and for your brain.

The brain part first: this week you met six dense topics, and right now they sit in fresh, fragile memory. Today's recall drills force you to *reproduce* them — write the pyproject from memory, type the shell ritual blind — because the act of struggling to retrieve is what converts fragile memory into durable skill. Rereading feels better and works worse; you know this from Day 1. Then the shipping part: everything the week taught — types (Day 15), the flight recorder (16), the recipe box (17), the alarms (18–19), the shared house (20) — converges into one artifact a stranger could \`pip install\` and trust. Version 0.1.0. Your first shipped tool.`,
    why: `Two career muscles get built today. First, spaced retrieval: engineers who can rebuild a pyproject.toml or a fixture from memory move at a different speed than engineers who re-Google the skeleton every time — interviews measure exactly this. Second, the shipping standard: "packaged, typed, tested, documented, on GitHub" is the definition of done you will apply to every artifact through Day 180, including the capstone. Recruiters and customers never see effort; they see whether the repo installs cleanly and the tests pass. Today you set that bar and clear it once, completely.`,
    tech: `### Why review days work (the spacing effect, applied)

Memory research is unambiguous: retrieval practice (testing yourself) beats re-study, and spacing retrievals over days beats massing them. This week's material is at the steepest part of the forgetting curve — Day 15's TypedDict syntax and Day 19's fixture shapes are already blurring. Today's drills are timed retrievals with feedback: produce from memory, then diff against reality. The diff IS the lesson: every discrepancy marks exactly what your brain dropped, which is far more efficient than rereading everything. Your quiz history from the week gives the priority order — the \`revisit\` day attached to each missed question tells you where today's spare minutes go.

### The shipping checklist, assembled from the week

A shippable v0.1.0 in this program means, concretely: **structure** — src layout, \`pyproject.toml\` with metadata and a console-script entry point, installable with \`pip install -e .\` in a fresh venv (Day 17). **Correctness** — pytest suite green, ≥80% of the core parsing/reporting logic exercised, including tmp_path I/O tests and at least one regression test (Days 18–19). **Legibility** — mypy and ruff clean, public functions typed (Day 15). **Operability** — logging with the verbosity dial, subcommands with honest \`--help\`, exit codes 0/1/2 (Day 16). **Distribution** — on GitHub with README, LICENSE, and the final changes landed via a self-reviewed PR (Day 20).

### The release ritual

Tag the shipped commit so this exact state is retrievable forever: \`git tag v0.1.0\` then \`git push origin v0.1.0\`. Semver says the 0.x series makes no stability promises yet — honest for a three-week-old tool. The stranger test is the final gate, and it must be brutal: clone from GitHub (not your local copy) into a fresh venv in a fresh directory, install, run the command, run the tests. Anything you have to explain out loud is a README bug; anything you have to fix by hand is a packaging bug. Fix the artifact, not the demo.`,
    viz: null,
    guided: [
      {
        title: 'Closed-book rebuild: the packaging skeleton',
        minutes: 20,
        body: `1. Close every editor tab and note. In an empty folder \`recall-lab\`, write from memory: a \`pyproject.toml\` for a package named \`shipcheck\` with one console script \`shipcheck\`, and the matching \`src/shipcheck/cli.py\` with a minimal main().
2. **Terminal:** prove it from memory too: create a venv, activate, \`pip install -e .\`, run \`shipcheck\`. No peeking until it either works or you are truly stuck (then peek at ONE line, close the note, continue).
3. Diff your pyproject against Day 17's real one. List every field you forgot or misspelled — that list is your personal weak-spot map.
4. Score yourself: worked first try (mastered) / needed one peek (solid) / needed the notes open (revisit Day 17's flashcards tonight).`,
        code: `# Target shape to produce from memory (do NOT copy — this is for the diff step):
#
# pyproject.toml:  [build-system] requires + build-backend
#                  [project] name, version, requires-python, dependencies
#                  [project.scripts] shipcheck = "shipcheck.cli:main"
# src/shipcheck/__init__.py
# src/shipcheck/cli.py with a main() that prints something
#
# Terminal ritual: python -m venv .venv && source .venv/bin/activate
#                  pip install -e . && shipcheck`,
      },
      {
        title: 'Recall gauntlet: one rep per topic',
        minutes: 20,
        body: `Five two-to-four-minute reps, all from memory, each checked immediately against the real thing:

1. **Day 15:** annotate this signature fully: a function taking lines (list of strings) and a limit, returning the top counts mapping or None on empty input. Check with mypy.
2. **Day 16:** write the four-line logging setup (basicConfig with level + timestamped format + named logger) and state the five levels in order.
3. **Day 18:** write a parametrized test with three rows for a function \`is_error_status(code)\` — then implement it to make them pass.
4. **Day 19:** write a fixture that creates a two-line log file in tmp_path and a test using it.
5. **Day 20:** on paper, write the exact command sequence from "I have a new feature idea" to "merged PR" (branch → commit → push -u → PR → review → merge → pull). Check against your Day 20 practice.

Log each rep in your journal as mastered / solid / revisit.`,
      },
    ],
    practice: [
      {
        title: 'Close your weakest gap',
        minutes: 15,
        body: `Pull up your quiz results from Days 15–20 and the mastered/solid/revisit log from the gauntlet. Pick the single weakest topic — not the one you like least, the one with the most misses.

Goal: 15 focused minutes on that day's flashcards and its guided exercise, redone from scratch (not reread). Finish by writing one new flashcard in your own words that targets the exact confusion you had.

Hints: if two topics tie, pick the one Day 21's shipping checklist depends on more (packaging and testing outrank everything today).`,
      },
    ],
    project: {
      title: 'Ship loganalyzer v0.1.0',
      brief: `Assemble the week into a release. Work through the shipping checklist in tech order: structure, correctness, legibility, operability, distribution. Close the two GitHub issues you filed on Day 20 (do the work, reference the issue in the commit message, land via PR). Run the brutal stranger test — clone from GitHub into a fresh venv in a fresh directory, \`pip install -e .\`, run \`loganalyzer report sample.log\`, run \`pytest\` — and fix whatever it exposes at the source. Tag \`v0.1.0\` and push the tag. Then write the release note: a 5-line "what this tool does and what I learned building it" section at the top of your journal — the seed of the portfolio narrative you'll polish on Day 180.`,
      rubric: [
        'Fresh clone from GitHub installs and runs the console script with zero manual fixes',
        'pytest green from the fresh clone; suite covers parsing, reporting, I/O, config precedence, and one regression',
        'mypy and ruff clean; logging dial and exit codes work as specified on Day 16',
        'Both Day 20 issues closed via PRs that reference them',
        'v0.1.0 tag visible on GitHub; README accurate for the tagged state',
        'Journal release note written (5 lines: what it does, what you learned)',
      ],
    },
    mistakes: [
      'Rereading the week\'s lessons instead of doing the recall drills. Recognition masquerades as knowledge; only retrieval reveals (and repairs) what is actually missing.',
      'Running the stranger test from your local folder instead of a fresh GitHub clone. Your working directory hides sins — uncommitted files, stray configs — that the clone exposes.',
      'Treating ≥80% coverage as the goal instead of a floor. Ten meaningful behavior tests beat thirty asserting that constants equal themselves; coverage measures execution, not verification.',
      'Shipping with a stale README. Docs describing last Tuesday\'s interface are worse than none — the stranger test includes following your own README literally, step by step.',
      'Skipping the tag. Without v0.1.0 pinned, "the version I shipped" becomes archaeology in a month. Tags are free; do it every release from now on.',
      'Letting the checkpoint slip to "mostly done." A 90% shipped tool is 0% shipped — the discipline of finishing completely is the actual lesson of the day.',
    ],
    quiz: [
      {
        q: 'Why does today force you to WRITE the pyproject.toml from memory instead of rereading Day 17?',
        o: [
          'To save time',
          'Retrieval practice strengthens memory far more than rereading, and the failures map exactly what needs review',
          'Because the file changes every release',
          'To practice typing speed',
        ],
        x: 1,
        w: 'Testing yourself is the strongest known memory intervention; rereading mostly produces familiarity. The diff between your recall and reality is a precision-targeted study guide.',
        revisit: 21,
      },
      {
        q: 'The honest stranger test for your package is…',
        o: [
          'Running the tool from your project directory one more time',
          'Fresh clone from GitHub, fresh venv, pip install -e ., run the command and the tests — fixing failures in the artifact, not by hand',
          'Asking a friend if the README looks good',
          'pip install -e . in your existing venv',
        ],
        x: 1,
        w: 'Only a clean clone + clean environment simulates a real user. Your local setup hides uncommitted files and pre-installed dependencies.',
        revisit: 17,
      },
      {
        q: 'Your suite reports 85% coverage. What can you conclude?',
        o: [
          'The code is 85% bug-free',
          '85% of lines executed during tests — which says nothing by itself about whether behavior was meaningfully asserted',
          'The remaining 15% is dead code',
          'The suite is complete',
        ],
        x: 1,
        w: 'Coverage counts executed lines, not verified behavior. It is a floor-finder (what is UNtested), never a proof of quality.',
        revisit: 18,
      },
    ],
    resources: [
      { label: 'Packaging Python Projects — official tutorial (checklist reference)', url: 'https://packaging.python.org/en/latest/tutorials/packaging-projects/', type: 'docs', time: '15 min' },
      { label: 'pytest Documentation — reference while polishing the suite', url: 'https://docs.pytest.org/en/stable/', type: 'docs', time: '15 min' },
      { label: 'GitHub Docs — releases & tags', url: 'https://docs.github.com/en/get-started', type: 'docs', time: '10 min' },
      { label: 'Pro Git — tagging chapter', url: 'https://git-scm.com/book/en/v2', type: 'book', time: '15 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep drill: full Week 3 flashcard deck', minutes: 15 },
      { activity: 'Guided: closed-book packaging rebuild', minutes: 20 },
      { activity: 'Guided: recall gauntlet (5 topics)', minutes: 20 },
      { activity: 'Practice: close your weakest gap', minutes: 15 },
      { activity: 'Project: ship v0.1.0 (checklist + stranger test + tag)', minutes: 40 },
      { activity: 'Quiz + journal release note', minutes: 10 },
    ],
    completion: [
      'Recall gauntlet logged with mastered/solid/revisit per topic',
      'v0.1.0 tagged on GitHub and the brutal stranger test passed from a fresh clone',
      'Both Day 20 issues closed via PRs',
      'Quiz ≥ 2/3 and weakest-topic session done',
    ],
    connections: {
      back: 'This checkpoint is Days 15–20 compressed into one artifact: Day 15\'s types, Day 16\'s cockpit, Day 17\'s recipe box, Days 18–19\'s alarms, Day 20\'s shared house.',
      forward: 'Phase 2 starts tomorrow with Big O — and uses this repo as its gym: Day 22\'s complexity notes and Day 28\'s pattern log live here. The shipping checklist you ran today reappears, grown up, as the capstone\'s Definition of Done on Days 176–178.',
    },
    flashcards: [
      { f: 'Why retrieval beats rereading?', b: 'Struggling to recall strengthens memory (testing effect); rereading yields familiarity without storage. Diff recall vs reality to find gaps.' },
      { f: 'The five-part shipping checklist?', b: 'Structure (packaging), correctness (tests), legibility (types/lint), operability (logging/CLI/exit codes), distribution (GitHub/README/LICENSE).' },
      { f: 'Release ritual for v0.1.0?', b: 'git tag v0.1.0 && git push origin v0.1.0 — pins the exact shipped state forever.' },
      { f: 'What does the brutal stranger test require?', b: 'Fresh GitHub clone + fresh venv + install + run command + run tests, fixing the artifact not the demo.' },
      { f: 'What is 85% coverage evidence of?', b: 'Only that 85% of lines ran under tests. Says nothing about assertion quality — a floor-finder, not a grade.' },
    ],
    deepDive: [
      { label: 'GitHub Releases', note: 'Turn the v0.1.0 tag into a Release on GitHub with your release note as the description — it makes the repo read as maintained software rather than homework.' },
    ],
  },
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
  {
    id: 'd023', day: 23, week: 4, phase: 2, kind: 'lesson',
    title: 'Arrays & Hashing',
    analogy: 'Numbered shelves & straight-to-the-page',
    objectives: [
      'Explain how dynamic arrays resize and why append is amortized O(1)',
      'Describe the hash function → bucket → collision chain that makes dict/set O(1) average',
      'State why dict keys must be hashable and what load factor forces a resize',
      'Apply the three hashing patterns: frequency counting, dedupe/seen-sets, and canonical keys',
      'Solve Two Sum, Valid Anagram, and Group Anagrams in one pass each',
    ],
    prereqs: [
      { day: 4, label: 'Collections — lists and dicts' },
      { day: 22, label: 'Big O & complexity' },
    ],
    eli5: `A warehouse with numbered shelves is an **array**: tell the clerk "shelf 4,217" and she walks straight there — one step, no searching — because shelf positions are computed, not hunted for. But ask her "which shelf holds the red vase?" and she must walk every aisle: numbers give instant access by POSITION, and nothing by CONTENT.

Now the coat check at a theater. You hand over your coat; the attendant doesn't remember where every coat is — she runs a little rule on your ticket number ("ticket 731 → hook 31") and walks straight to the hook. That rule is a **hash function**: it converts the thing you're looking up into a shelf number, so content-based lookup becomes position-based lookup — straight to the page instead of reading the whole book. Occasionally two tickets map to the same hook (a **collision**); she hangs both coats there and checks the tags — still fast, as long as no hook gets overloaded. When the rack gets crowded, the theater installs a bigger rack and re-hangs everything (a **resize**). Python's dict and set are exactly this coat check, and they are the single most useful object in your interview toolkit.`,
    why: `Hashing is the workhorse of practical speed: the Day 22 fix ("replace the list scan with a set") IS this lesson, and it recurs everywhere — deduplicating documents in a RAG ingest pipeline (Day 113), caching LLM responses by prompt hash (Day 156), counting token frequencies (Day 96). In interviews, "can I trade O(n) memory for O(1) lookup?" is the first question to ask of almost every array problem — roughly a third of easy/medium problems fall to a hash map. Knowing WHY it's O(1) average (and when it isn't) is what separates users from engineers.`,
    tech: `### Dynamic arrays

A Python list is a dynamic array: a contiguous block of memory holding references. Contiguity is why \`nums[i]\` is O(1) — the address is computed as base + i × slot-size. When an append finds the block full, the list allocates a bigger block (roughly 1.125–2× over-allocation) and copies everything: that single append is O(n), but because capacity grows geometrically, the copies average out to **amortized O(1)** per append — the Day 22 deep-dive, now load-bearing. The costs to memorize: index/append O(1), \`insert(0, x)\` and \`pop(0)\` O(n) (everything shifts), \`x in list\` O(n).

### How dict and set actually work

A hash table is an array of **buckets**. To store a key: compute \`hash(key)\` (an integer), take it modulo the table size to pick a bucket, and place the entry there. Lookup replays the same computation — that is why it doesn't depend on how many entries exist: O(1) average. Two facts follow immediately. **Keys must be hashable**: the hash must never change while the key sits in the table, so mutable objects (list, dict, set) are banned as keys — use a tuple or frozenset instead. **Collisions** — two keys landing in one bucket — are handled by probing/chaining and stay cheap while the **load factor** (entries ÷ buckets) stays low; Python resizes the table when it passes about 2/3 full, re-inserting every key. Worst case, with adversarially colliding keys, lookup degrades to O(n) — say "O(1) average" like an honest engineer.

### The three patterns

1. **Frequency map**: one pass building \`counts[item] += 1\` (or \`collections.Counter\`) answers most-common, anagram, and majority questions in O(n).
2. **Seen-set**: "have I met this before?" — dedupe, cycle detection, Two Sum's complement trick: for each number, check whether \`target - num\` was already seen.
3. **Canonical key**: group things by a normalized signature — \`tuple(sorted(word))\` or a 26-slot count tuple sends all anagrams to the same bucket. Choosing the right canonical key IS the solution to a whole family of problems.`,
    viz: 'hash-buckets',
    guided: [
      {
        title: 'Build the coat check — a toy hash map',
        minutes: 25,
        body: `1. Create \`hashmap_lab.py\` and implement the \`ToyHashMap\` from the starter skeleton: 8 buckets, each a list of (key, value) pairs (chaining).
2. Fill in \`_bucket_index\`, \`put\`, and \`get\`. Run the test block at the bottom — all four asserts should pass.
3. Add a \`stats()\` method printing each bucket's length, then insert 20 string keys and look at the distribution — roughly even is the hash function doing its job.
4. Sabotage: replace \`hash(key)\` with \`len(key)\` in \`_bucket_index\` and re-run stats with 20 words of similar length. Watch one bucket swell — you have manufactured the O(n) worst case and now understand it forever. Restore \`hash\`.
5. In a comment, answer: why must the table also store the KEY in the bucket, not just the value?`,
        code: `class ToyHashMap:
    def __init__(self, n_buckets=8):
        self.buckets = [[] for _ in range(n_buckets)]

    def _bucket_index(self, key) -> int:
        return hash(key) % len(self.buckets)

    def put(self, key, value) -> None:
        bucket = self.buckets[self._bucket_index(key)]
        for i, (k, _) in enumerate(bucket):
            if k == key:                 # key exists: overwrite
                bucket[i] = (key, value)
                return
        bucket.append((key, value))      # new key: chain it

    def get(self, key, default=None):
        bucket = self.buckets[self._bucket_index(key)]
        for k, v in bucket:
            if k == key:
                return v
        return default

    def stats(self) -> None:
        for i, b in enumerate(self.buckets):
            print(f"bucket {i}: {len(b)} entries")

m = ToyHashMap()
m.put("ada", 1); m.put("alan", 2); m.put("ada", 3)
assert m.get("ada") == 3          # overwrite worked
assert m.get("alan") == 2
assert m.get("grace") is None
assert m.get("grace", 0) == 0
print("toy hash map: all asserts pass")`,
      },
      {
        title: 'The three patterns in anger',
        minutes: 15,
        body: `Solve the three classics in \`hashing_classics.py\`, each with a one-line pattern note before the function:

1. **Two Sum** (seen-set/complement): given nums and target, return indices of two numbers summing to target — one pass, store number → index, check for the complement BEFORE inserting.
2. **Valid Anagram** (frequency map): are two strings anagrams? Compare Counters — or two 26-slot tuples for the purist version.
3. **Group Anagrams** (canonical key): group a list of words so all anagrams share a list. Key: \`tuple(sorted(word))\`.

For each: state time and space complexity in a comment, and test with the provided cases plus one edge case you invent (empty string, duplicate numbers…).`,
        code: `from collections import Counter, defaultdict

# Pattern: seen-map with complements — O(n) time, O(n) space
def two_sum(nums: list[int], target: int) -> list[int]:
    seen: dict[int, int] = {}          # number -> index
    for i, num in enumerate(nums):
        if target - num in seen:
            return [seen[target - num], i]
        seen[num] = i
    return []

# Pattern: frequency map — O(n) time, O(1) space (26 letters)
def is_anagram(s: str, t: str) -> bool:
    return Counter(s) == Counter(t)

# Pattern: canonical key — O(n·k log k) time for n words of length k
def group_anagrams(words: list[str]) -> list[list[str]]:
    groups: dict[tuple, list[str]] = defaultdict(list)
    for w in words:
        groups[tuple(sorted(w))].append(w)
    return list(groups.values())

assert two_sum([2, 7, 11, 15], 9) == [0, 1]
assert two_sum([3, 3], 6) == [0, 1]        # duplicates: why check-before-insert matters
assert is_anagram("listen", "silent") and not is_anagram("rat", "car")
print(group_anagrams(["eat", "tea", "tan", "ate", "nat", "bat"]))`,
      },
    ],
    practice: [
      {
        title: 'Two on your own',
        minutes: 20,
        body: `No scaffolding. Solve both, stating complexity before you code:

(1) **First unique character**: given a string, return the index of the first character that appears exactly once, or -1. Target O(n) — two passes allowed.

(2) **Longest consecutive sequence**: given an unsorted list of ints, return the length of the longest run of consecutive values (e.g. [100, 4, 200, 1, 3, 2] → 4 for 1-2-3-4). Target O(n) — sorting is the O(n log n) trap.

Hints (only if stuck): for (2), put everything in a set; only start counting from numbers whose predecessor is NOT in the set — that guard is what keeps it linear.`,
      },
    ],
    project: {
      title: 'Start the pattern log',
      brief: `Create \`patterns.md\` in your practice repo — the living document that carries you to Day 179. Add today's first section, "Hashing," with: (1) a three-line summary of when to reach for a hash map (need content-based lookup / counting / grouping in O(1) per item); (2) your solved classics (Two Sum, Valid Anagram, Group Anagrams, plus today's practice pair) each with a one-line "the trick was…" note; (3) the recognition cues — phrases in a problem statement that smell like hashing ("appears once", "find pairs", "group by", "seen before"); (4) the honest costs: O(n) extra space, O(1) AVERAGE not worst, keys must be immutable. Commit it. Every pattern day this phase adds a section.`,
      rubric: [
        'patterns.md created with the Hashing section in the four-part structure',
        'All five problems solved and runnable in the repo with complexity stated per solution',
        'Longest-consecutive solution runs O(n) (predecessor-guard present), not sort-based',
        'ToyHashMap passes its asserts and the sabotage experiment is written up in two sentences',
        'Committed with a descriptive message',
      ],
    },
    mistakes: [
      'Using a list as a dict key and being surprised by TypeError: unhashable. Mutable objects can\'t promise a stable hash; convert to tuple (or frozenset) first.',
      'Calling dict lookup O(1) unconditionally. It is O(1) average; collisions make it O(n) worst-case — the sabotage step showed you exactly how.',
      'Solving Two Sum by inserting first, then checking — which matches a number with itself. Check for the complement before inserting the current number.',
      'Reaching for sorting when a frequency map answers in O(n). "Compare compositions" (anagrams) needs counts, not order.',
      'Forgetting that insert(0, x) and pop(0) on a list shift every element — O(n). If you need cheap operations at both ends, that is tomorrow\'s deque.',
      'Choosing a canonical key that isn\'t canonical: "".join(set(word)) loses counts and order — "aab" and "ab" collide. sorted-tuple or count-tuple, nothing cleverer.',
    ],
    quiz: [
      {
        q: 'Why is looking up a key in a dict O(1) on average, regardless of size?',
        o: [
          'Python keeps dicts sorted for binary search',
          'The hash of the key computes the bucket position directly — no scanning of other entries',
          'Dicts store at most a fixed number of keys',
          'The interpreter caches all lookups',
        ],
        x: 1,
        w: 'hash(key) mod table-size IS the address computation — content becomes position. Only same-bucket collisions require comparing entries, and resizing keeps buckets short.',
        revisit: 23,
      },
      {
        q: 'my_dict[[1, 2]] = "x" raises TypeError. Why?',
        o: [
          'Lists are too large to hash',
          'A list can mutate after insertion, which would silently change its bucket — so mutable types are unhashable by design',
          'Only strings can be dict keys',
          'It is a syntax error',
        ],
        x: 1,
        w: 'If the key mutated, the stored hash would point at the wrong bucket and the entry would be lost. Immutable keys (tuple, str, int, frozenset) make the promise a hash table needs.',
        revisit: 23,
      },
      {
        q: 'Best canonical key to group anagrams under one dict entry?',
        o: [
          'The first letter of the word',
          'len(word)',
          'tuple(sorted(word)) — identical for all anagrams, distinct otherwise',
          'The word itself',
        ],
        x: 2,
        w: 'A canonical key must be identical exactly for group members: sorting the letters (or a 26-count tuple) achieves that. First-letter and length collide across non-anagrams.',
        revisit: 23,
      },
    ],
    resources: [
      { label: 'VisuAlgo — hash table visualization (collisions & resizing live)', url: 'https://visualgo.net/en', type: 'tool', time: '15 min' },
      { label: 'OpenDSA — hashing chapter', url: 'https://opendsa-server.cs.vt.edu/', type: 'book', time: '25 min' },
      { label: 'NeetCode Roadmap — Arrays & Hashing section', url: 'https://neetcode.io/roadmap', type: 'course', time: '20 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: Day 22 ladder + Week 3 due cards', minutes: 10 },
      { activity: 'ELI5 + tech read, watch the hash-buckets visualizer', minutes: 20 },
      { activity: 'Guided: build the toy hash map + three classics', minutes: 40 },
      { activity: 'Practice: two problems solo', minutes: 20 },
      { activity: 'Project: start patterns.md (Hashing section)', minutes: 20 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'ToyHashMap works, sabotage experiment observed and explained',
      'Five classics solved with stated complexities; longest-consecutive is O(n)',
      'patterns.md committed with the Hashing section',
      'Quiz ≥ 2/3',
    ],
    connections: {
      back: 'Day 4 taught you to USE dict and set; today you know why they are fast and when they are not. Day 22\'s "swap the list scan for a set" now has a mechanism behind it.',
      forward: 'Tomorrow\'s sliding window pairs with a hash map for its hardest problems. The hash-as-address idea returns as cache keys on Day 156 and — transformed into geometry — as the "meaning-based index" of vector databases on Day 115.',
    },
    flashcards: [
      { f: 'Why is list append amortized O(1)?', b: 'Geometric over-allocation: occasional O(n) copies spread over many cheap appends.' },
      { f: 'Hash table lookup mechanism in one line?', b: 'hash(key) % buckets = position — content-based lookup becomes address computation.' },
      { f: 'Which types can be dict keys and why?', b: 'Immutable/hashable ones (str, int, tuple, frozenset): their hash can never change while stored.' },
      { f: 'Two Sum trick?', b: 'One pass; check if (target − num) is in the seen-map BEFORE inserting num — O(n).' },
      { f: 'Canonical key for anagrams?', b: 'tuple(sorted(word)) or a 26-slot count tuple — same key iff anagrams.' },
      { f: 'Load factor?', b: 'Entries ÷ buckets. Python resizes around 2/3 full to keep chains short and lookups O(1) average.' },
    ],
    deepDive: [
      { label: 'Python dict internals: compact dicts & insertion order', note: 'Since 3.7, dicts preserve insertion order via a compact two-array layout. Skim how the entries array + sparse index table work — it explains both the ordering guarantee and the memory win.' },
    ],
  },
  {
    id: 'd024', day: 24, week: 4, phase: 2, kind: 'lesson',
    title: 'Two Pointers & Sliding Window',
    analogy: 'Closing pincers & the moving spotlight',
    objectives: [
      'Explain the invariant that lets two pointers on a sorted array discard candidates safely',
      'Apply fast/slow pointers for in-place array work',
      'Build fixed-size window sums that reuse work instead of recomputing',
      'Grow-and-shrink a variable window while maintaining a constraint, with a hash map when needed',
      'Argue why a sliding window is O(n) even though it has two nested-looking loops',
    ],
    prereqs: [
      { day: 22, label: 'Big O & complexity' },
      { day: 23, label: 'Arrays & hashing' },
    ],
    eli5: `Two searchers at opposite ends of a sorted bookshelf want two prices summing to exactly 100. The left one stands at the cheapest book, the right one at the most expensive. Sum too small? Only the LEFT searcher steps inward — a bigger cheap book is the only move that raises the sum. Too big? Right steps inward. Like **closing pincers**, they meet in the middle having examined each book at most once — no pair-by-pair O(n²) grind, because sortedness lets each comparison eliminate a whole shelf-section of pairs at once.

The **moving spotlight**: a security guard checks every 30-meter stretch of a fence. The rookie walks to each position and re-inspects all 30 meters — repeating 29 meters of work per step. The veteran slides a spotlight: each step, one new meter enters the beam, one old meter leaves, and she updates her notes for just those two. Same answers, a fraction of the work. That is a sliding window: keep a running summary (a sum, a count-map) of the stretch you're looking at, and update it incrementally as the edges move. Both tricks are the same deep idea — **never re-examine what a pointer has already passed.**`,
    why: `These two patterns are interview currency — "longest substring without repeating characters" is among the most-asked questions anywhere — but they're also production patterns: rate limiters count events in a sliding time window (Day 45), streaming metrics compute windowed p95 latencies (Day 157), and context-window management for LLM conversations (Day 122) is literally a token budget window sliding over messages. The transferable skill is invariant thinking: stating what stays true at every step and letting that license each pointer move — the same reasoning that powers binary search on Day 33.`,
    tech: `### Sorted two-pointer: why discarding is safe

On sorted \`nums\`, start \`left = 0\`, \`right = len(nums) - 1\`. If \`nums[left] + nums[right] < target\`, then \`nums[left]\` paired with ANY element is too small (the right pointer already sits at the largest available) — so left++ discards all n pairs involving that element in one step. Symmetrically for too-big. Each step retires one element; total O(n), space O(1). The invariant: *the answer, if it exists, always lies between the pointers.* Every two-pointer solution stands on such a sentence, and writing it down is not optional — it is the solution.

**Fast/slow** is the other geometry: both pointers move the same direction at different speeds. In-place dedupe of a sorted array: slow marks the end of the clean prefix, fast scouts ahead for the next new value; when found, write it at slow+1. (The dramatic payoff — cycle detection — arrives with linked lists on Day 26.)

### Sliding window: fixed and variable

Fixed size k (max sum of any k consecutive elements): compute the first window's sum, then slide — \`window_sum += nums[i] - nums[i - k]\`. One add, one subtract per step: O(n) versus the rookie's O(n·k).

Variable size is the general machine, for "longest/shortest stretch satisfying a constraint":

~~~python
left = 0
for right in range(len(s)):        # grow: admit s[right]
    # ...update window state...
    while window_violates_constraint():
        # ...remove s[left]...     # shrink from the left
        left += 1
    best = max(best, right - left + 1)
~~~

It LOOKS nested, but count pointer movements, not iterations: \`right\` moves n times total, \`left\` moves at most n times total (it never goes backward) — so the body runs at most 2n times: **amortized O(n)**. This is the argument interviewers want stated. When the constraint concerns contents ("no repeated characters", "at most k distinct"), the window state is yesterday's frequency map — count characters in, count them out. Recognition cues: "contiguous", "substring", "subarray", "longest/shortest such that…" scream window; "sorted" plus "pair/triplet" screams pincers.`,
    viz: 'two-pointers',
    guided: [
      {
        title: 'Pincers on sorted data',
        minutes: 15,
        body: `1. In \`pointers_lab.py\`, implement \`pair_with_sum(sorted_nums, target)\` returning the two VALUES (or None). Before coding, write the invariant sentence as a comment — the starter shows the shape.
2. Test on the provided cases, including no-solution and duplicate-heavy inputs.
3. Implement \`is_palindrome_clean(s)\`: pointers from both ends, skipping non-alphanumeric characters, comparing lowercased. ("A man, a plan, a canal: Panama" → True.)
4. Implement \`dedupe_sorted_inplace(nums)\` with fast/slow: return the length of the unique prefix having moved every unique value forward. Verify against sorted(set(nums)).
5. For each function, add the complexity as a comment: all three are O(n) time; state each one\'s space.`,
        code: `# Invariant: if a valid pair exists, both members lie in nums[left..right].
# sum too small -> left += 1 (nums[left] can't pair with anything: right is max)
# sum too big   -> right -= 1 (symmetric)
def pair_with_sum(nums: list[int], target: int) -> tuple[int, int] | None:
    left, right = 0, len(nums) - 1
    while left < right:
        s = nums[left] + nums[right]
        if s == target:
            return nums[left], nums[right]
        if s < target:
            left += 1
        else:
            right -= 1
    return None

def dedupe_sorted_inplace(nums: list[int]) -> int:
    if not nums:
        return 0
    slow = 0                            # nums[0..slow] is the clean prefix
    for fast in range(1, len(nums)):
        if nums[fast] != nums[slow]:
            slow += 1
            nums[slow] = nums[fast]
    return slow + 1

assert pair_with_sum([1, 3, 4, 6, 8, 11], 10) == (4, 6)
assert pair_with_sum([1, 2, 3], 42) is None
nums = [1, 1, 2, 2, 2, 3]
assert dedupe_sorted_inplace(nums) == 3 and nums[:3] == [1, 2, 3]
print("pincers: all asserts pass")`,
      },
      {
        title: 'The spotlight, fixed then variable',
        minutes: 20,
        body: `1. In \`window_lab.py\`, implement \`max_window_sum(nums, k)\` the rookie way first (recompute each window: O(n·k)) and the veteran way (slide: O(n)). Time both on 100k elements with k=1000, Day 22 style — feel the difference.
2. Now the celebrity problem: \`longest_unique_substring(s)\` — length of the longest substring without repeating characters. Use the grow/shrink machine from the tech section with a seen-set (or last-index map) as window state.
3. Trace it by hand on "abcabcbb" in a comment: show left, right, window contents at each step for the first 5 steps. Hand-tracing once is what makes the machine yours.
4. State the amortized O(n) argument in a comment: how many times can each pointer move, total?`,
        code: `def max_window_sum(nums: list[int], k: int) -> int:
    window = sum(nums[:k])              # first window: the only full computation
    best = window
    for i in range(k, len(nums)):
        window += nums[i] - nums[i - k] # one enters, one leaves
        best = max(best, window)
    return best

def longest_unique_substring(s: str) -> int:
    seen: set[str] = set()              # window contents
    left = 0
    best = 0
    for right in range(len(s)):
        while s[right] in seen:         # shrink until the duplicate is gone
            seen.remove(s[left])
            left += 1
        seen.add(s[right])              # grow: admit s[right]
        best = max(best, right - left + 1)
    return best

assert max_window_sum([2, 1, 5, 1, 3, 2], 3) == 9
assert longest_unique_substring("abcabcbb") == 3
assert longest_unique_substring("bbbbb") == 1
assert longest_unique_substring("") == 0
print("spotlight: all asserts pass")`,
      },
    ],
    practice: [
      {
        title: 'Two solo, think-aloud protocol',
        minutes: 20,
        body: `Solve both using the interview protocol: (a) restate the problem in one sentence; (b) name the pattern and the invariant/window-state; (c) code; (d) state complexity; (e) test edges. Say steps a, b, d OUT LOUD — literally — this is rehearsal for Day 28's timed drill and every interview after.

(1) **Best time to buy/sell stock**: given prices, max profit from one buy then one sell. (Pattern: one pass tracking min-so-far — a degenerate fast/slow.)

(2) **Longest substring with at most k distinct characters**: the grow/shrink machine with a frequency map; shrink while the map holds more than k keys.

Hints: for (2), a count hitting zero must DELETE the key from the map, or len(map) lies about distinct count.`,
      },
    ],
    project: {
      title: 'Pattern log: pincers & spotlights',
      brief: `Add the "Two Pointers & Sliding Window" section to \`patterns.md\`, same four-part structure as Day 23: when to reach for each (sorted + pairs → pincers; contiguous-stretch superlatives → window), your five solved problems each with its invariant/window-state written as ONE sentence, recognition cues ("contiguous", "substring", "longest…such that", "sorted array…pair"), and honest costs (needs sortedness or contiguity; the while-inside-for needs the amortized argument stated or interviewers will call it O(n²)). Include your hand-trace of "abcabcbb" — future-you revising on Day 179 will thank present-you. Commit.`,
      rubric: [
        'Section added in the four-part structure with all five problems linked to runnable code',
        'Every solution has its invariant or window-state written as a single sentence',
        'The amortized O(n) argument for grow/shrink windows is stated correctly',
        'The timing comparison rookie vs veteran window is recorded with real numbers',
        'Committed with a descriptive message',
      ],
    },
    mistakes: [
      'Using the sorted two-pointer on unsorted data. The discard argument depends entirely on sortedness; without it the pincers silently skip valid pairs. Sort first (O(n log n)) or use Day 23\'s hash map.',
      'Calling the grow/shrink window O(n²) because of the nested while. Count total pointer movements: left never retreats, so ≤ 2n body executions — amortized O(n). Say it in interviews.',
      'Recomputing the window summary from scratch each step. The entire speedup is incremental update: add what enters, remove what leaves. If you recompute, you are the rookie guard.',
      'Forgetting to delete map keys whose count reaches zero. len(window_map) then overcounts distinct characters and the shrink condition misfires.',
      'Off-by-one on window length: it is right − left + 1 with inclusive pointers. Hand-trace one example rather than guessing.',
      'Shrinking with if instead of while. One removal may not restore the constraint; shrink until it holds.',
    ],
    quiz: [
      {
        q: 'Sorted two-pointer, sum too small. Why is left += 1 safe — no valid pair missed?',
        o: [
          'Because we will visit that pair later',
          'nums[left] paired with its largest possible partner (nums[right]) is still too small, so every pair using nums[left] fails — all discarded at once',
          'Because the array has no duplicates',
          'It is not safe in general, only a heuristic',
        ],
        x: 1,
        w: 'Right sits at the maximum remaining partner. If even that pairing undershoots, nums[left] is unusable — sortedness turns one comparison into a mass discard. That reasoning is the whole pattern.',
        revisit: 24,
      },
      {
        q: 'The grow/shrink window has a for-loop containing a while-loop, yet runs in O(n). Why?',
        o: [
          'The while rarely executes',
          'Python optimizes nested loops',
          'Each pointer only moves forward: right moves n times, left at most n times, so the body runs at most ~2n times in total',
          'It is actually O(n²) and people are careless',
        ],
        x: 2,
        w: 'Amortize over the whole run, not per iteration: total left-movements are bounded by total right-movements. ~2n steps = O(n).',
        revisit: 24,
      },
      {
        q: 'Which problem statement smells like a sliding window?',
        o: [
          'Find two values in a sorted array summing to k',
          'Longest contiguous substring containing at most 2 vowels',
          'Group words that are anagrams',
          'Is this string a palindrome?',
        ],
        x: 1,
        w: '"Longest contiguous … such that constraint" is the window signature. Sorted-pair is pincers, grouping is hashing (Day 23), palindrome is two-pointer from the ends.',
        revisit: 24,
      },
    ],
    resources: [
      { label: 'NeetCode Roadmap — Two Pointers & Sliding Window tracks', url: 'https://neetcode.io/roadmap', type: 'course', time: '25 min' },
      { label: 'Tech Interview Handbook — coding-patterns cheatsheets (repo)', url: 'https://github.com/yangshun/tech-interview-handbook', type: 'repo', time: '15 min' },
      { label: 'VisuAlgo — array visualizations for tracing', url: 'https://visualgo.net/en', type: 'tool', time: '10 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: Day 23 hashing cards + due deck', minutes: 10 },
      { activity: 'ELI5 + tech read, watch the two-pointers visualizer', minutes: 20 },
      { activity: 'Guided: pincers + the spotlight labs', minutes: 35 },
      { activity: 'Practice: two solo with think-aloud protocol', minutes: 20 },
      { activity: 'Project: pattern log section + hand-trace', minutes: 20 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'All lab asserts pass; rookie vs veteran timing recorded',
      'Both solo problems solved with the protocol steps spoken aloud',
      'patterns.md section committed with invariants and the amortized argument',
      'Quiz ≥ 2/3',
    ],
    connections: {
      back: 'The window\'s frequency map is Day 23\'s pattern embedded in a new machine, and the O(n·k) → O(n) win is Day 22\'s growth-shape thinking applied. Fast/slow dedupe reuses Day 4\'s in-place mutation understanding.',
      forward: 'Fast/slow returns with a twist for cycle detection on Day 26. Invariant thinking is the engine of binary search on Day 33. Windowed counting reappears in rate limiters (Day 45), streaming metrics (Day 157), and LLM context budgeting (Day 122).',
    },
    flashcards: [
      { f: 'When do closing pincers apply?', b: 'Sorted data + pair/palindrome questions: each comparison safely discards all pairs involving one element.' },
      { f: 'Sliding window recognition cues?', b: '"Contiguous", "substring/subarray", "longest/shortest such that constraint".' },
      { f: 'Why is grow/shrink O(n) despite nested loops?', b: 'Pointers only advance: ≤ n moves each, so ≤ ~2n body runs — amortized O(n).' },
      { f: 'Fixed-window update rule?', b: 'window += entering − leaving. Never recompute the whole window.' },
      { f: 'Window state for "at most k distinct"?', b: 'A frequency map; delete keys at count zero or len() lies. Shrink WHILE violated, not if.' },
    ],
    deepDive: [
      { label: 'Minimum window substring', note: 'The boss fight of this pattern (shortest window covering all of t\'s characters, with counts). Attempt only if today felt smooth — it combines every idea: variable window, frequency maps, and a satisfied-count trick.' },
    ],
  },
  {
    id: 'd025', day: 25, week: 4, phase: 2, kind: 'lesson',
    title: 'Stacks & Queues',
    analogy: 'Tray piles and lunch lines',
    objectives: [
      'State the LIFO and FIFO contracts and pick the right one from a problem description',
      'Implement a stack with a list and a queue with collections.deque, with correct costs',
      'Solve bracket-matching with a stack and explain why a counter is not enough',
      'Apply a monotonic stack to a next-greater-element problem',
      'Name three real systems built on each structure (undo, call stack, task queues…)',
    ],
    prereqs: [
      { day: 4, label: 'Collections — lists' },
      { day: 22, label: 'Big O & complexity' },
      { day: 23, label: 'Arrays & hashing' },
    ],
    eli5: `In a cafeteria, clean trays are stacked in a **pile**: the tray you take is the LAST one added — whatever is on top. Nobody excavates the bottom tray. That is a stack: Last In, First Out. It sounds trivially simple, but LIFO is exactly the shape of *interrupted work*: you're washing dishes, the phone rings, mid-call the doorbell goes — you answer the door, THEN finish the call, THEN return to dishes. Most-recently-interrupted resumes first. Your editor's undo, your browser's back button, and Python's function-call bookkeeping are all tray piles.

The **lunch line** is the other contract: First In, First Out. The person who arrived first is served first — anything else causes a riot. FIFO is the shape of *fairness and order-preservation*: print jobs, requests to a server, tickets in a support queue. Two dumb-simple rules — "take from the top" and "take from the front" — and the entire skill is recognizing which one a problem is secretly asking for: does the most RECENT thing matter first (nesting, undo, backtracking), or the OLDEST (scheduling, buffering, breadth-first anything)?`,
    why: `Stacks and queues are how systems you'll build actually organize work. Every task queue between your API and its workers (Day 47) is FIFO; every traceback you read (Day 19) is a printout of the call stack; agent frameworks (Day 120) maintain stacks of pending sub-tasks and queues of tool results. Interview-wise, bracket matching and monotonic stacks are perennial, and BFS — the algorithm that powers Day 31's shortest paths — is literally "a loop around a queue". Choosing deque over list.pop(0) is also a classic complexity trap you can now name on sight.`,
    tech: `### Stacks: Python lists are already one

\`append\` pushes and \`pop()\` pops from the end — both amortized O(1). The classic application is **matching nested structure**: walk a string of brackets; push every opener; on a closer, the stack's top must be the matching opener (pop it) or the string is invalid; at the end the stack must be empty. Why not just count? A counter accepts "([)]" — counting tracks *how many* are open but not *which order*; the stack remembers the exact nesting, and nesting is LIFO by nature. The same shape parses expressions, validates JSON, and implements undo (push each action; undo pops).

### Queues: the deque, and the list.pop(0) trap

A list makes a terrible queue: \`pop(0)\` shifts every remaining element left — O(n) per dequeue, O(n²) to drain. \`collections.deque\` is a doubly-linked block structure with O(1) \`append\` and \`popleft\`:

~~~python
from collections import deque
q = deque()
q.append("first"); q.append("second")
q.popleft()        # "first" — FIFO, O(1)
~~~

That is the entire API you need for **BFS** (Day 31 preview): seed the queue with a start node, repeatedly popleft, process, and append unvisited neighbors — the queue's FIFO order is precisely what makes exploration proceed level by level.

### Monotonic stacks: a taste

For "next warmer day" problems — for each element, find the next element greater than it — the brute force is O(n²). The monotonic stack does it in O(n): walk the array keeping a stack of *indices whose answer is still unknown*, maintained in decreasing value order. Each new element pops every smaller stack entry — the new element IS their answer — then pushes itself. Every index is pushed once and popped at most once: O(n) total, the same amortized argument as yesterday's window. The pattern smell: "next/previous greater/smaller element", "how long until X exceeds this".`,
    viz: 'stack-ops',
    guided: [
      {
        title: 'Brackets: the stack earns its keep',
        minutes: 15,
        body: `1. In \`stacks_lab.py\`, implement \`is_balanced(s)\` for the three bracket pairs using the starter's mapping trick.
2. Run the test block — including "([)]", the case that defeats counters. In a comment, explain in one sentence WHY the counter fails on it.
3. Extend: make it ignore non-bracket characters so real code snippets can be checked, and test it on a line of Python from your own repo.
4. Implement \`undo_demo()\`: a 10-line action history where each string command is pushed, and "undo" pops and prints what was reverted. Stacks stop being abstract the moment you build undo.`,
        code: `def is_balanced(s: str) -> bool:
    pairs = {")": "(", "]": "[", "}": "{"}
    stack: list[str] = []
    for ch in s:
        if ch in "([{":
            stack.append(ch)
        elif ch in pairs:
            if not stack or stack[-1] != pairs[ch]:
                return False
            stack.pop()
    return not stack        # leftovers mean unclosed openers

assert is_balanced("()[]{}")
assert is_balanced("{[()]}")
assert not is_balanced("([)]")   # right counts, wrong nesting: the counter-killer
assert not is_balanced("(((")
assert is_balanced("")
print("brackets: all asserts pass")`,
      },
      {
        title: 'Queues done right + the monotonic stack',
        minutes: 20,
        body: `1. In \`queues_lab.py\`, run the starter's timing comparison: drain a 100k-element queue via \`list.pop(0)\` vs \`deque.popleft()\`. Record both times and name the complexity of each drain (Day 22 reflex).
2. Implement \`daily_temperatures(temps)\`: for each day, how many days until a warmer one (0 if never). Use the monotonic stack of indices from the starter skeleton; trace [73, 74, 75, 71, 69, 72, 76, 73] by hand for the first four elements in a comment.
3. State the O(n) argument in a comment: how many times can each index be pushed and popped?
4. Bonus wiring for Day 31: write \`bfs_preview(grid_neighbors, start)\` — 6 lines: deque, seen-set, popleft loop — and run it on the tiny graph in the starter. You have just written the skeleton of every BFS you will ever need.`,
        code: `import time
from collections import deque

n = 100_000
lst = list(range(n))
t0 = time.perf_counter()
while lst:
    lst.pop(0)                      # shifts everything: O(n) each, O(n^2) drain
t_list = time.perf_counter() - t0

dq = deque(range(n))
t0 = time.perf_counter()
while dq:
    dq.popleft()                    # O(1) each, O(n) drain
t_deque = time.perf_counter() - t0
print(f"list.pop(0): {t_list:.3f}s   deque.popleft: {t_deque:.3f}s")

def daily_temperatures(temps: list[int]) -> list[int]:
    answer = [0] * len(temps)
    stack: list[int] = []           # indices with unknown answers, temps decreasing
    for i, t in enumerate(temps):
        while stack and temps[stack[-1]] < t:
            j = stack.pop()         # today is j's next warmer day
            answer[j] = i - j
        stack.append(i)
    return answer

assert daily_temperatures([73, 74, 75, 71, 69, 72, 76, 73]) == [1, 1, 4, 2, 1, 1, 0, 0]
print("monotonic stack: assert passes")`,
      },
    ],
    practice: [
      {
        title: 'Two solo',
        minutes: 20,
        body: `(1) **Queue via two stacks**: implement a class with enqueue and dequeue using ONLY two lists used as stacks (no deque, no pop(0)). Then make the amortized O(1) argument for dequeue: each element crosses from the in-stack to the out-stack at most once in its lifetime.

(2) **Min-stack**: a stack supporting push, pop, and get_min, all O(1). Constraint: no scanning on get_min.

Hints: for (1), only refill the out-stack when it is empty — that laziness is where the amortization comes from. For (2), keep a second stack recording the minimum *as of* each pushed element; pop them in lockstep.`,
      },
    ],
    project: {
      title: 'Pattern log: LIFO/FIFO section + systems inventory',
      brief: `Add the "Stacks & Queues" section to \`patterns.md\` with the usual four parts (when to reach for each contract, solved problems with one-line tricks, recognition cues — "nested", "most recent first", "in order of arrival", "next greater" — and honest costs, headlined by the list.pop(0) trap with YOUR measured timings). Then add a "in the wild" inventory: find three real stack appearances and three real queue appearances in systems you actually use or have built (traceback = call stack; git stash; your editor's undo; a printer spooler; the Day 16 logging handlers' internal queue…), each with one sentence on why that contract fits. Commit.`,
      rubric: [
        'Section committed in the four-part structure with all lab + practice problems runnable',
        'list vs deque timings recorded with the correct complexity labels on each',
        'Monotonic stack O(n) argument (each index pushed/popped once) stated correctly',
        'Six-item "in the wild" inventory with a fitting one-line justification each',
        'Queue-via-two-stacks amortized argument written in your own words',
      ],
    },
    mistakes: [
      'Using list.pop(0) for a queue. Every dequeue shifts the whole list: O(n) each, O(n²) to drain. deque.popleft() exists precisely for this — you timed the difference today.',
      'Matching brackets with counters. Counters verify quantity, not order: "([)]" balances every counter and is still invalid. Nesting is LIFO; only a stack remembers it.',
      'Forgetting the end-of-input check: a bracket string is valid only if the stack is EMPTY at the end. "(((" passes every per-character check and must still fail.',
      'Popping from an empty stack without a guard. Check `if not stack` before touching stack[-1] — the empty case is the first edge every interviewer probes.',
      'Storing values instead of indices in a monotonic stack. The answer is usually a distance or position; values alone cannot recover it.',
      'Reaching for a stack or queue when you need random access. They are access-DISCIPLINE structures; if you need the middle, you want yesterday\'s array or a dict.',
    ],
    quiz: [
      {
        q: 'Why does bracket matching need a stack rather than open/close counters?',
        o: [
          'Counters are slower',
          'Counters check quantity but not nesting order — "([)]" fools them; the stack remembers WHICH opener must close next',
          'Stacks use less memory',
          'It doesn\'t; counters work fine',
        ],
        x: 1,
        w: 'Nesting is inherently LIFO: the most recently opened bracket must close first. Only a stack encodes that order.',
        revisit: 25,
      },
      {
        q: 'Draining an n-element queue implemented as a Python list with pop(0) costs…',
        o: ['O(n)', 'O(n log n)', 'O(n²) — each pop(0) shifts all remaining elements', 'O(1)'],
        x: 2,
        w: 'pop(0) is O(n) because the array contents shift left; n such pops is O(n²). deque.popleft() makes the drain O(n).',
        revisit: 25,
      },
      {
        q: 'A problem asks: "for each element, find the NEXT element to its right that is larger." The efficient tool is…',
        o: [
          'Nested loops',
          'A sliding window',
          'A monotonic stack of indices — each element pops the smaller ones it answers',
          'Sorting the array first',
        ],
        x: 2,
        w: '"Next greater" is the monotonic-stack signature: each index is pushed and popped at most once, giving O(n). Sorting destroys the positional relationships the question is about.',
        revisit: 25,
      },
    ],
    resources: [
      { label: 'VisuAlgo — stack & queue operations, animated', url: 'https://visualgo.net/en', type: 'tool', time: '15 min' },
      { label: 'OpenDSA — stacks & queues chapters', url: 'https://opendsa-server.cs.vt.edu/', type: 'book', time: '25 min' },
      { label: 'NeetCode Roadmap — Stack section', url: 'https://neetcode.io/roadmap', type: 'course', time: '20 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: Days 23–24 cards + due deck', minutes: 10 },
      { activity: 'ELI5 + tech read, watch the stack-ops visualizer', minutes: 20 },
      { activity: 'Guided: brackets + deque timing + monotonic stack', minutes: 35 },
      { activity: 'Practice: queue-from-stacks + min-stack', minutes: 20 },
      { activity: 'Project: pattern log + in-the-wild inventory', minutes: 20 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'All lab asserts pass; list vs deque timings recorded',
      'Both practice structures work with their amortized/O(1) arguments written',
      'patterns.md section + six-item systems inventory committed',
      'Quiz ≥ 2/3',
    ],
    connections: {
      back: 'The monotonic stack\'s "pushed once, popped once" argument is Day 24\'s amortized reasoning reappearing within a day. The traceback you learned to read on Day 19 is a call-stack printout — today you know the structure behind it.',
      forward: 'Day 27 makes the call stack visible when recursion runs. Day 31 wraps a loop around today\'s deque and calls it BFS. Day 47 scales the lunch line into message queues between services, where FIFO plus retries powers real AI pipelines.',
    },
    flashcards: [
      { f: 'LIFO vs FIFO — one cue each?', b: 'LIFO (stack): most-recent-first — nesting, undo, backtracking. FIFO (queue): oldest-first — scheduling, buffering, BFS.' },
      { f: 'Queue in Python — with what and why?', b: 'collections.deque: append + popleft are O(1). list.pop(0) is O(n) — the classic trap.' },
      { f: 'Why is "([)]" invalid though counts balance?', b: 'Wrong nesting order. Only a stack tracks WHICH opener must close next.' },
      { f: 'Monotonic stack smell?', b: '"Next/previous greater/smaller element" — stack of unresolved indices, O(n) total.' },
      { f: 'Bracket check final condition?', b: 'Stack must be empty at end — unclosed openers fail even if no closer ever mismatched.' },
    ],
    deepDive: [
      { label: 'Largest rectangle in histogram', note: 'The monotonic stack\'s hardest classic. If daily_temperatures felt clean, study how the same "pop when a smaller bar arrives" idea computes rectangle areas — a genuinely beautiful O(n) algorithm.' },
    ],
  },
  {
    id: 'd026', day: 26, week: 4, phase: 2, kind: 'lesson',
    title: 'Linked Lists',
    analogy: 'Treasure hunts',
    objectives: [
      'Build singly linked lists from node objects and traverse them without losing the head',
      'Explain the array-vs-linked-list trade: O(1) index vs O(1) splice',
      'Reverse a linked list iteratively with the three-pointer dance',
      'Detect a cycle with Floyd\'s fast/slow pointers and explain why they must meet',
      'Sketch how a dict + linked list combine into an LRU cache',
    ],
    prereqs: [
      { day: 9, label: 'Object-oriented Python — classes & references' },
      { day: 22, label: 'Big O & complexity' },
      { day: 24, label: 'Fast/slow pointers' },
    ],
    eli5: `A treasure hunt: the first clue is in your hand, and each clue names WHERE THE NEXT ONE IS. Clue 1 → under the bridge; there you find clue 2 → inside the oak. You cannot jump to clue 7 — you must walk the chain. That is a **linked list**: each node holds a value and a pointer to the next node, and all you ever hold is the first clue (the **head**). Lose the head, lose the whole hunt.

Why organize anything this way, when numbered shelves (Day 23's arrays) let you jump anywhere instantly? Because of what INSERTING costs. Adding a shelf in the middle of a numbered warehouse means renumbering — shifting — everything after it. Adding a clue mid-hunt costs almost nothing: write one new clue, and change ONE existing clue to point to it. Nobody else in the chain even notices. That's the trade in full: arrays are instant to *read anywhere*, expensive to *splice*; linked lists are expensive to read anywhere, instant to splice — once you're standing at the right spot. Today's classic moves — reversing the hunt, detecting a prankster's clue-loop — are really exercises in pointer surgery: relinking "next" arrows without ever dropping the chain.`,
    why: `Honestly: you will rarely hand-build a linked list in production Python. You learn them for two real reasons. First, they are the purest gym for **reference reasoning** — the "names are pointers" model from Day 9 under load — and interviewers use them precisely because pointer bugs are unfakeable; reverse-a-list and detect-cycle remain screening staples. Second, the structure lives inside things you WILL use: deque (yesterday), the LRU caches behind functools.lru_cache (Day 12) and every serious caching layer (Day 47, Day 156) — dict for O(1) find + linked list for O(1) reorder is a genuinely great design you should be able to sketch.`,
    tech: `### Nodes and the reference model

~~~python
class ListNode:
    def __init__(self, val, next=None):
        self.val = val
        self.next = next
~~~

A list is just nodes chained by \`.next\`, ending in None. There is no container object unless you make one — "the list" IS a reference to its head node. Traversal is the universal loop: \`while node is not None: ...; node = node.next\` — O(n) to reach anything, versus an array's O(1) index. The compensation: given a node, splicing after it is O(1) — \`new.next = node.next; node.next = new\` — two assignments, no shifting. **Order of assignments is everything**: point the new node's next FIRST, or you orphan the rest of the chain. The **dummy-head trick** — a throwaway node before the real head — removes the "is it the first node?" special case from insert/delete code; return \`dummy.next\` at the end.

### Reversal: the three-pointer dance

Walk the chain flipping each arrow to point backward. You need three names — \`prev\`, \`current\`, and a saved \`nxt\` — because the moment you flip \`current.next = prev\`, you have destroyed your only route forward unless \`nxt\` already saved it:

~~~python
prev = None
current = head
while current is not None:
    nxt = current.next      # save the route forward
    current.next = prev     # flip the arrow
    prev = current          # advance both names
    current = nxt
# prev is the new head
~~~

O(n) time, O(1) space. Hand-trace it once on three nodes; the pattern never leaves you.

### Floyd's cycle detection — the fast/slow payoff

If a prankster makes the last clue point back into the middle, traversal never ends. Day 24's fast/slow pointers solve it in O(1) space: slow steps once, fast steps twice. In a cycle, fast gains one position on slow per step, so the gap shrinks by exactly 1 each step — they MUST land on the same node before the gap wraps; no cycle means fast simply hits None. Compare the Day 23 alternative — a seen-set of visited nodes — O(n) space for the same answer: a classic space-for-cleverness trade. The **LRU cache** sketch, for the road: dict maps key → node (O(1) find); doubly linked list keeps usage order (O(1) move-to-front, O(1) evict tail). Every operation O(1) — the design behind functools.lru_cache and most real cache layers.`,
    viz: 'linked-list',
    guided: [
      {
        title: 'Build, traverse, splice',
        minutes: 15,
        body: `1. In \`linked_lab.py\`, define \`ListNode\` and two helpers you will reuse all day: \`from_list(values)\` building a chain from a Python list, and \`to_list(head)\` doing the reverse. Test that they round-trip.
2. Write \`insert_after(node, val)\` — two assignments — and in a comment explain what breaks if you swap their order (draw the arrows if it helps).
3. Write \`delete_after(node)\` (one assignment: route around the victim). Note the asymmetry: with only "next" pointers, deleting a node you are STANDING ON requires knowing its predecessor — walk from the head or use a dummy.
4. Use the dummy-head trick to write \`delete_value(head, val)\` that works even when the head itself must go. Test deleting the head, a middle node, and a missing value.`,
        code: `class ListNode:
    def __init__(self, val, next=None):
        self.val = val
        self.next = next

def from_list(values):
    dummy = ListNode(None)
    tail = dummy
    for v in values:
        tail.next = ListNode(v)
        tail = tail.next
    return dummy.next

def to_list(head):
    out = []
    node = head
    while node is not None:
        out.append(node.val)
        node = node.next
    return out

def delete_value(head, val):
    dummy = ListNode(None, head)     # dummy erases the "head is special" case
    node = dummy
    while node.next is not None:
        if node.next.val == val:
            node.next = node.next.next   # route around it
            break
        node = node.next
    return dummy.next

assert to_list(from_list([1, 2, 3])) == [1, 2, 3]
assert to_list(delete_value(from_list([1, 2, 3]), 1)) == [2, 3]   # head case
assert to_list(delete_value(from_list([1, 2, 3]), 2)) == [1, 3]
assert to_list(delete_value(from_list([1, 2, 3]), 9)) == [1, 2, 3]
print("build/traverse/splice: all asserts pass")`,
      },
      {
        title: 'The reversal dance + the cycle detector',
        minutes: 20,
        body: `1. Implement \`reverse(head)\` from the tech section — but FIRST hand-trace it on paper for the 3-node list [1, 2, 3]: draw all three arrows at each of the three iterations. The paper trace is the exercise; the code is its transcript.
2. Test: reverse of [1..5], of [1], and of [] (None in, None out).
3. Implement \`has_cycle(head)\` with Floyd's fast/slow. Build a test cycle by hand: make the tail's next point at the second node. (Careful: to_list on a cyclic list runs forever — that is the point.)
4. In a comment, write the meeting argument in your own words: in a cycle, the gap between fast and slow shrinks by exactly 1 per step, so it reaches 0 — no skipping over.
5. Also write \`find_middle(head)\` in 5 lines: when fast hits the end, slow stands at the middle. Two uses of one pattern in one day.`,
        code: `def reverse(head):
    prev, current = None, head
    while current is not None:
        nxt = current.next
        current.next = prev
        prev = current
        current = nxt
    return prev

def has_cycle(head) -> bool:
    slow = fast = head
    while fast is not None and fast.next is not None:
        slow = slow.next
        fast = fast.next.next
        if slow is fast:          # identity, not equality: same NODE
            return True
    return False

def find_middle(head):
    slow = fast = head
    while fast is not None and fast.next is not None:
        slow = slow.next
        fast = fast.next.next
    return slow

assert to_list(reverse(from_list([1, 2, 3, 4, 5]))) == [5, 4, 3, 2, 1]
assert reverse(None) is None

cyclic = from_list([1, 2, 3, 4])
tail = cyclic
while tail.next: tail = tail.next
tail.next = cyclic.next            # 4 -> 2: a cycle
assert has_cycle(cyclic) and not has_cycle(from_list([1, 2, 3]))
assert find_middle(from_list([1, 2, 3, 4, 5])).val == 3
print("reversal + cycle: all asserts pass")`,
      },
    ],
    practice: [
      {
        title: 'Merge, and the space trade',
        minutes: 20,
        body: `(1) **Merge two sorted lists** into one sorted list by relinking existing nodes (no new nodes, no value copying). Use a dummy head and a tail pointer; state the complexity.

(2) Re-implement \`has_cycle_set(head)\` using a Day 23 seen-set of nodes, then write a three-sentence comparison: what does Floyd save, what does the set version win on (simplicity? finding WHERE the cycle starts?), and which would you write under interview pressure?

Hints: for (1) the loop compares the two current heads, links the smaller to the merged tail, and advances that list; when one list runs out, link the survivor whole — do not walk it.`,
      },
    ],
    project: {
      title: 'Pattern log: pointer surgery + the LRU sketch',
      brief: `Add the "Linked Lists" section to \`patterns.md\`: the array-vs-list trade table (index, search, splice-at-known-node, memory locality), your solved problems (delete-with-dummy, reverse, cycle, middle, merge) each with its one-line trick, recognition cues ("reverse in place", "cycle", "middle of", "merge lists", "O(1) removal"), and honest costs (O(n) access, cache-unfriendly memory scatter, Python overhead per node). Then the capstone of the section: a half-page **LRU cache design sketch** — a labeled drawing (ASCII art is fine) of dict + doubly-linked list, and a table showing get/put/evict all hitting O(1), with one sentence each on which structure provides it. Commit.`,
      rubric: [
        'Trade table filled with correct complexities for both structures',
        'All five problems runnable in the repo; reversal includes your paper hand-trace (photo or ASCII)',
        'Merge relinks nodes (verified: no ListNode constructor calls in the merge loop besides the dummy)',
        'Floyd vs seen-set comparison written with the space trade named',
        'LRU sketch shows both structures and attributes each O(1) operation to the right one',
      ],
    },
    mistakes: [
      'Losing the head: advancing your only reference during traversal, then having nothing to return. Keep a separate cursor name (node = head), or use a dummy whose .next you return.',
      'Flipping current.next before saving current.next. The three-pointer dance exists because that one assignment destroys your only route forward — save nxt first, always.',
      'Comparing nodes with == when you mean identity. Two nodes can hold equal values; cycle detection asks "same NODE?" — use `is`.',
      'Forgetting the null guards in fast/slow: fast and fast.next must both be checked before fast.next.next, or odd-length lists crash with AttributeError on None.',
      'Special-casing the head in insert/delete instead of using a dummy node. The dummy costs one line and deletes an entire class of off-by-one bugs.',
      'Concluding linked lists beat arrays because "insert is O(1)". That O(1) requires already standing at the splice point; finding it is O(n). Arrays with their cache-friendly layout win most real workloads — know the trade, not the slogan.',
    ],
    quiz: [
      {
        q: 'In the iterative reversal loop, why must nxt = current.next happen before current.next = prev?',
        o: [
          'For readability only',
          'Because flipping the arrow destroys the sole reference to the rest of the chain — nxt saves the route forward first',
          'Python requires assignments in alphabetical order',
          'It prevents the loop from being O(n²)',
        ],
        x: 1,
        w: 'current.next is the only path to the unvisited remainder. Overwrite it unsaved and the rest of the list is orphaned — the signature linked-list bug.',
        revisit: 26,
      },
      {
        q: 'Why must fast and slow pointers meet if the list has a cycle?',
        o: [
          'They might not — it is probabilistic',
          'Once both are in the cycle, fast closes the gap by exactly 1 node per step, so the gap reaches 0 without skipping',
          'Because the cycle must have even length',
          'Because slow eventually stops',
        ],
        x: 1,
        w: 'Relative speed is 1 node/step, so the separation decreases 1 at a time — it cannot jump over 0. Meeting is guaranteed, in O(n) time and O(1) space.',
        revisit: 26,
      },
      {
        q: 'An LRU cache needs O(1) get AND O(1) update of usage order. The classic design is…',
        o: [
          'A sorted list of timestamps',
          'A dict alone',
          'A dict (key → node) for O(1) find, plus a doubly linked list for O(1) move-to-front and tail eviction',
          'Two arrays',
        ],
        x: 2,
        w: 'Each structure covers the other\'s weakness: hashing finds the node instantly; the linked list reorders and evicts instantly. Neither alone does both.',
        revisit: 26,
      },
    ],
    resources: [
      { label: 'VisuAlgo — linked list operations, animated', url: 'https://visualgo.net/en', type: 'tool', time: '15 min' },
      { label: 'OpenDSA — linked lists chapter', url: 'https://opendsa-server.cs.vt.edu/', type: 'book', time: '25 min' },
      { label: 'NeetCode Roadmap — Linked List section', url: 'https://neetcode.io/roadmap', type: 'course', time: '20 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: Days 23–25 cards + due deck', minutes: 10 },
      { activity: 'ELI5 + tech read, watch the linked-list visualizer', minutes: 20 },
      { activity: 'Guided: build/splice + reversal dance + cycle detector', minutes: 35 },
      { activity: 'Practice: merge sorted lists + Floyd vs seen-set', minutes: 20 },
      { activity: 'Project: pattern log + LRU sketch', minutes: 20 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'All lab asserts pass, including the manufactured cycle',
      'Reversal hand-trace on paper completed before coding',
      'Merge relinks nodes without copying; comparison paragraph written',
      'patterns.md section + LRU sketch committed; quiz ≥ 2/3',
    ],
    connections: {
      back: 'Nodes are Day 9\'s objects; every .next is Day 9\'s "names are references" made structural. Fast/slow arrived on Day 24 as an array trick — today it earned its fame. The seen-set alternative is Day 23 again.',
      forward: 'Day 27\'s recursion traverses these same chains implicitly via the call stack. Trees (Day 29) are nodes with TWO nexts. The LRU sketch becomes working code when caching gets serious on Day 47 and pays LLM bills on Day 156.',
    },
    flashcards: [
      { f: 'Array vs linked list, the trade in one line?', b: 'Array: O(1) index, O(n) splice. Linked list: O(n) access, O(1) splice at a known node.' },
      { f: 'The three-pointer reversal dance?', b: 'nxt = cur.next (save!); cur.next = prev (flip); prev, cur advance. Save BEFORE flip.' },
      { f: 'Floyd\'s cycle argument?', b: 'Fast gains 1 node/step on slow inside a cycle — gap hits 0 exactly, so they must meet. O(1) space.' },
      { f: 'Dummy-head trick?', b: 'Throwaway node before head removes head-is-special cases from insert/delete; return dummy.next.' },
      { f: 'LRU cache design?', b: 'dict key→node (O(1) find) + doubly linked list (O(1) move-to-front, O(1) evict tail).' },
    ],
    deepDive: [
      { label: 'Reverse a linked list recursively', note: 'A perfect bridge to tomorrow: the recursive reversal is 5 lines, and understanding where the "work" happens (after the recursive call returns) previews the call-stack thinking Day 27 makes explicit.' },
    ],
  },
  {
    id: 'd027', day: 27, week: 4, phase: 2, kind: 'lesson',
    title: 'Recursion & Divide/Conquer',
    analogy: 'Russian dolls',
    objectives: [
      'Write recursive functions with an explicit base case and a shrinking recursive case',
      'Trace a recursive call on the call stack and predict its maximum depth',
      'Draw the call tree of naive fib and explain why memoization collapses it to O(n)',
      'Describe the divide-and-conquer shape (split, solve halves, combine) using merge sort',
      'Convert a recursion to iteration with an explicit stack, and say when you must',
    ],
    prereqs: [
      { day: 3, label: 'Functions & scope' },
      { day: 12, label: 'Decorators & lru_cache' },
      { day: 25, label: 'Stacks — the call stack\'s structure' },
    ],
    eli5: `A set of Russian dolls, and your job is to count them. The honest method: open the outermost doll, and inside you find… a slightly smaller version of THE EXACT SAME PROBLEM. So you apply the same move again. Eventually you reach the tiny solid doll that doesn't open — you don't recurse on it, you just say "one." That solid doll is the **base case**, and without it you'd be trying to open dolls forever. Then the answers reassemble on the way OUT: the innermost answer is 1, the next doll says "1 + what was inside me = 2," and so on outward until the outermost doll announces the total.

That's recursion: a function that calls itself on a *smaller* version of its problem, plus a smallest case solved directly. The half-opened dolls sitting on the table while you work inward? That's the **call stack** — Day 25's tray pile, holding every paused caller until its inner answer comes back. Stack too many dolls (no base case, or input too deep) and the table overflows — literally a *stack overflow*. **Divide and conquer** is the power move: instead of opening one doll at a time, split the problem in HALF, solve both halves the same way, and combine — halving is why these algorithms end up O(n log n) instead of O(n²).`,
    why: `Recursion is the native language of nested data, and your career is full of nested data: directory trees, JSON documents from every API (Day 41), abstract syntax trees, org charts — and next week's binary trees (Day 29) and graphs (Day 31) are traversed almost entirely by recursion. Merge sort's divide-and-conquer shape explains WHY sorting is O(n log n) (Day 32), and memoization is dynamic programming's front door (Day 34). Interviewers use recursion as a lens: a candidate who states the base case, the shrinking step, and the stack depth is demonstrating structured thinking, not syntax.`,
    tech: `### The two-part contract

Every correct recursion answers two questions: *what is the smallest input I solve directly?* (base case) and *how does each call shrink the problem toward it?* (recursive case). Miss the first and you get infinite descent; fail the second (recursing on an unshrunken input) and same result. Python enforces a recursion limit (~1000 frames) and raises \`RecursionError\` — a safety rail, not a bug in Python. Each active call occupies a **stack frame** holding its locals; depth = memory. Linear recursion on a million items will blow the stack; a loop won't. That is the conversion rule: recursion whose structure is a simple chain (factorial, list traversal) converts mechanically to a loop; recursion over branching structures converts to a loop + an explicit stack of pending work — Day 25's structure standing in for the call stack, with no depth limit but the heap.

### The call tree, and why naive fib is a scandal

\`fib(n) = fib(n-1) + fib(n-2)\` produces a call TREE, not a chain: fib(5) calls fib(4) and fib(3); fib(4) calls fib(3) *again*… The tree has ~2ⁿ nodes, recomputing the same subproblems exponentially many times. **Memoization** — caching results by argument — collapses it: each distinct input computed once, O(n) total. You already own the tool: Day 12's \`@functools.lru_cache\`. The insight to keep: exponential blowup from *overlapping subproblems* + a cache = linear. That sentence is Day 34's dynamic programming in embryo.

### Divide and conquer

The shape: **split** the input in half, **recurse** on both halves, **combine** the sub-answers. Merge sort is the archetype:

~~~python
def merge_sort(nums):
    if len(nums) <= 1:              # base case
        return nums
    mid = len(nums) // 2
    left = merge_sort(nums[:mid])   # solve halves
    right = merge_sort(nums[mid:])
    return merge(left, right)       # combine: O(n) two-pointer merge
~~~

The accounting (Day 22 meets Day 27): halving gives log n levels; each level does O(n) combine work; total O(n log n). The \`merge\` step is literally Day 24's two pointers and Day 26's merge — the toolkit composing. Divide and conquer wins when the combine step is cheap relative to the split's savings; binary search (Day 33) is the degenerate case where one half is *discarded* entirely — O(log n).`,
    viz: 'call-stack',
    guided: [
      {
        title: 'Watch the stack breathe',
        minutes: 20,
        body: `1. In \`recursion_lab.py\`, write \`countdown(n)\` (print n, recurse on n−1, base case n == 0 prints "liftoff") — then add the depth-printing version from the starter that indents by call depth. Run \`countdown(5)\` and watch the descent and return visually.
2. Write naive \`fib(n)\` with a global call counter. Run fib(10), fib(20), fib(25) and record the call counts — watch the explosion (fib(25) makes ~240k calls).
3. Add \`@functools.lru_cache\` above fib, reset the counter, rerun fib(25) — count the calls now (should be ≤ 49: each input once, plus lookups). Write the one-sentence explanation in a comment.
4. Trigger the safety rail on purpose: call \`countdown(20_000)\` and read the RecursionError. Then state in a comment which conversion (plain loop) fixes it and why the loop has no such limit.`,
        code: `import functools

def countdown(n: int, depth: int = 0) -> None:
    print("  " * depth + f"countdown({n})")
    if n == 0:                      # base case: the solid doll
        print("  " * depth + "liftoff")
        return
    countdown(n - 1, depth + 1)     # shrinking step
    print("  " * depth + f"returning from countdown({n})")

calls = 0
def fib(n: int) -> int:
    global calls
    calls += 1
    if n <= 1:
        return n
    return fib(n - 1) + fib(n - 2)

for n in [10, 20, 25]:
    calls = 0
    result = fib(n)
    print(f"fib({n}) = {result}  ({calls} calls)")

@functools.lru_cache(maxsize=None)
def fib_memo(n: int) -> int:
    if n <= 1:
        return n
    return fib_memo(n - 1) + fib_memo(n - 2)

print(f"fib_memo(80) = {fib_memo(80)}  (instant)")`,
      },
      {
        title: 'Recurse over real nested data + merge sort',
        minutes: 20,
        body: `1. Write \`total_size(data)\`: given arbitrarily nested lists of ints (e.g. [1, [2, [3, 4]], 5]), return the sum of all ints. Base case: an int. Recursive case: a list — sum the recursion over its elements. This is the JSON-walking shape you will use forever.
2. Write \`merge_sort\` from the tech section, plus the \`merge(left, right)\` combine using Day 24's two-pointer walk. Test against Python's sorted() on 100 random lists (starter shows the harness).
3. In a comment, do the Day 22 accounting: levels × work-per-level = O(n log n). Then answer: what is merge sort's space complexity, and where does it go?
4. Convert countdown to iteration two ways: a plain loop, and — overkill here but the general tool — an explicit stack of pending values (Day 25). The second version is the template for iterative tree traversal on Day 29.`,
        code: `import random

def total_size(data) -> int:
    if isinstance(data, int):           # base case
        return data
    return sum(total_size(item) for item in data)   # recurse over the nesting

def merge(left: list, right: list) -> list:
    out, i, j = [], 0, 0
    while i < len(left) and j < len(right):   # Day 24: two pointers
        if left[i] <= right[j]:
            out.append(left[i]); i += 1
        else:
            out.append(right[j]); j += 1
    out.extend(left[i:]); out.extend(right[j:])
    return out

def merge_sort(nums: list) -> list:
    if len(nums) <= 1:
        return nums
    mid = len(nums) // 2
    return merge(merge_sort(nums[:mid]), merge_sort(nums[mid:]))

assert total_size([1, [2, [3, 4]], 5]) == 15
assert total_size([]) == 0
for _ in range(100):
    nums = [random.randint(-99, 99) for _ in range(random.randint(0, 50))]
    assert merge_sort(nums) == sorted(nums)
print("nested sum + merge sort: all asserts pass")`,
      },
    ],
    practice: [
      {
        title: 'Two solo',
        minutes: 20,
        body: `(1) **Fast exponentiation**: pow_fast(x, n) for non-negative n in O(log n) multiplications. The divide: x^n = (x^(n/2))² when n is even; odd n peels one factor. Verify against x ** n and count the multiplications for n = 1000 (should be ~15, not 1000).

(2) **Flatten**: flatten(data) returning a flat list from arbitrarily nested lists — the total_size shape but building a list. Then state: what does the call stack's maximum depth depend on for this function (hint: nesting depth, not total length)?

Hints: for (1), recurse on n // 2 ONCE and square the result — recursing twice rebuilds the fib explosion you just escaped.`,
      },
    ],
    project: {
      title: 'Pattern log: the recursion section',
      brief: `Add "Recursion & Divide/Conquer" to \`patterns.md\`: the two-part contract (base case + shrinking step) as the checklist you run on every recursive function; your solved problems (nested sum, merge sort, fast pow, flatten) with one-line notes; the fib call-count table (naive vs memoized — real numbers from your run); recognition cues ("nested", "defined in terms of itself", "sorted halves", "same problem, smaller"); and honest costs (stack depth = memory, ~1000-frame limit, when to convert to iteration + explicit stack). Close with the bridge sentence to Day 34, written in your own words: overlapping subproblems + cache = dynamic programming. Commit — Week 4's toolkit is now complete for tomorrow's drill.`,
      rubric: [
        'Section committed with all four problems runnable in the repo',
        'fib table shows measured call counts, naive vs memoized, for at least three n values',
        'Merge-sort accounting (log n levels × O(n) merge = O(n log n)) written correctly',
        'Recursion-to-iteration conversion rule stated with the explicit-stack template included',
        'pow_fast verified O(log n) by multiplication count, not vibes',
      ],
    },
    mistakes: [
      'Writing the recursive case first and the base case as an afterthought. Write the base case FIRST — it is the answer\'s foundation, and forgetting it is the #1 cause of RecursionError.',
      'Recursing on an unshrunken input (fib(n) calling fib(n)). The base case only saves you if every call moves toward it — check the shrinking step explicitly.',
      'Treating RecursionError as "Python is broken." The ~1000-frame limit is a memory safety rail; deep linear recursions should be loops, deep branching ones explicit stacks.',
      'Recursing twice on the same half in fast exponentiation (return pow_fast(x, n//2) * pow_fast(x, n//2)). That recomputation rebuilds the exponential call tree — bind the result once, then square it.',
      'Believing memoization is free. lru_cache trades O(n) memory (and hashable-argument requirements) for the speedup — Day 22\'s space column applies.',
      'Slicing lists in recursive calls without noticing the cost: nums[:mid] copies O(n) per level. Fine for learning merge sort; production versions pass index bounds instead.',
    ],
    quiz: [
      {
        q: 'Naive recursive fib(40) is astronomically slower than fib(20). The root cause?',
        o: [
          'Python\'s recursion limit throttles it',
          'The call TREE recomputes the same subproblems exponentially many times — ~2ⁿ calls',
          'Function calls are slow in Python',
          'Integer overflow',
        ],
        x: 1,
        w: 'fib(n) spawns two subtrees that overlap massively: fib(38) alone is computed twice, fib(37) three times… Memoization computes each input once, collapsing 2ⁿ to n.',
        revisit: 27,
      },
      {
        q: 'Merge sort is O(n log n). Where do the two factors come from?',
        o: [
          'n comparisons times log n swaps',
          'log n levels of halving, each level doing O(n) total merge work',
          'It is actually O(n²) on average',
          'n from sorting, log n from recursion overhead',
        ],
        x: 1,
        w: 'Halving until size 1 takes log n levels; merging all the pieces at any level touches each element once, O(n). Levels × per-level = n log n — the divide-and-conquer accounting.',
        revisit: 27,
      },
      {
        q: 'A recursion must process a chain of 500,000 linked nodes. In Python you should…',
        o: [
          'Raise the recursion limit to a million and proceed',
          'Convert to iteration (a loop, or a loop + explicit stack) — half a million frames will exhaust the call stack',
          'Use lru_cache',
          'Use threads',
        ],
        x: 1,
        w: 'Frame depth is memory; the limit is a safety rail, and raising it that far invites a real crash. Linear recursions convert mechanically to loops; branching ones to a loop + explicit stack.',
        revisit: 27,
      },
    ],
    resources: [
      { label: 'OpenDSA — recursion chapter (with visual call traces)', url: 'https://opendsa-server.cs.vt.edu/', type: 'book', time: '25 min' },
      { label: 'CS50x Week 3 — recursion & merge sort segments', url: 'https://cs50.harvard.edu/x/', type: 'course', time: '30 min' },
      { label: 'VisuAlgo — sorting visualizer (watch merge sort\'s levels)', url: 'https://visualgo.net/en', type: 'tool', time: '10 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: Days 23–26 cards + due deck', minutes: 10 },
      { activity: 'ELI5 + tech read, watch the call-stack visualizer', minutes: 20 },
      { activity: 'Guided: stack breathing + nested data + merge sort', minutes: 40 },
      { activity: 'Practice: fast pow + flatten', minutes: 20 },
      { activity: 'Project: pattern log recursion section', minutes: 20 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'Call-count explosion measured naive vs memoized and recorded',
      'merge_sort passes 100 randomized tests against sorted()',
      'pow_fast verified O(log n) by multiplication count',
      'patterns.md recursion section committed; quiz ≥ 2/3',
    ],
    connections: {
      back: 'The call stack is Day 25\'s structure run by the interpreter; the merge step is Day 24\'s two pointers on Day 26\'s problem; lru_cache is Day 12\'s decorator finally showing its full power.',
      forward: 'Trees (Day 29) and graphs (Day 31) are traversed by exactly today\'s shapes. Day 32 builds on merge sort\'s accounting, Day 33 is divide-and-conquer with a discarded half, and Day 34 grows today\'s memoized-fib insight into dynamic programming proper.',
    },
    flashcards: [
      { f: 'The recursion contract?', b: 'A base case solved directly + a recursive case that provably shrinks toward it. Check both, base case first.' },
      { f: 'Why is naive fib exponential and memoized fib O(n)?', b: 'Overlapping subproblems recomputed ~2ⁿ times; a cache computes each distinct input once.' },
      { f: 'Merge sort accounting?', b: 'log n halving levels × O(n) merge work per level = O(n log n).' },
      { f: 'When must recursion become iteration in Python?', b: 'Deep inputs (~1000+ frames): linear → plain loop; branching → loop + explicit stack.' },
      { f: 'Fast exponentiation trick?', b: 'x^n = (x^(n//2))² (odd n peels one x): recurse ONCE and square — O(log n) multiplications.' },
      { f: 'RecursionError means…?', b: 'Frame depth hit the safety limit: missing/unreachable base case, or an input too deep for recursion.' },
    ],
    deepDive: [
      { label: 'Why Python has no tail-call optimization', note: 'Some languages reuse the current frame for tail calls, making recursion loop-cheap. Python deliberately refuses (Guido values honest tracebacks). Knowing this explains why the "convert to a loop" rule is Python-specific advice.' },
    ],
  },
  {
    id: 'd028', day: 28, week: 4, phase: 2, kind: 'review',
    title: 'Week 4 Checkpoint: Pattern Drill',
    analogy: 'The toolkit test',
    objectives: [
      'Recognize which pattern a fresh problem wants within 60 seconds of reading it',
      'Solve four problems under time pressure using the think-aloud protocol',
      'Grade your own solutions against a rubric covering correctness, complexity, and communication',
      'Start the interview error log — the living artifact you will keep through Day 179',
    ],
    prereqs: [
      { day: 22, label: 'Big O & complexity' },
      { day: 23, label: 'Arrays & hashing' },
      { day: 24, label: 'Two pointers & sliding window' },
      { day: 27, label: 'Recursion & divide/conquer' },
    ],
    eli5: `A mechanic's apprenticeship exam is never "name every tool on the wall." It is a car with four hidden faults and a ticking clock. The examiner isn't checking whether you own a torque wrench — they're checking whether, hearing a rattle, your hand moves toward the right drawer *without deliberation*. This week you filled five drawers: hashing, pointers and windows, stacks and queues, linked lists, recursion. Today is the car.

Two things make today different from just "more problems." First, **time pressure**, on purpose: recognition under pressure is a different skill from recognition at leisure, and it only develops under actual pressure. Second, the **error log** — the single highest-leverage habit in interview preparation. Every mistake you make today gets written down in a specific format: what the problem was, what you did, what you should have done, and the *cue you missed*. Champions in every field keep this log. Six months of "I keep missing the shrink-condition in windows" beats a thousand un-reflected practice problems, because the log turns each mistake from a repeated tax into a one-time tuition payment.`,
    why: `This drill is a dress rehearsal for real coding interviews (Days 35, 84, 179 escalate it), but the deeper skill is professional: pattern recognition under pressure is what an FDE does in a customer meeting when someone describes a slow pipeline and you hear "hidden O(n²), needs a hash map" in real time. The error log habit transfers even further — it is the same log→case→fix loop you'll run on production LLM failures on Day 143. Self-scoring against a rubric also builds the calibration muscle that Day 135's LLM-as-judge work demands: grading honestly is a skill, and it starts on your own work.`,
    tech: `### Why the drill works: retrieval, interleaved, under pressure

Three findings stack up today. **Retrieval practice**: solving from memory strengthens the pattern representations far more than re-reading patterns.md. **Interleaving**: this week you practiced each pattern in its own blocked session — but real problems arrive unlabeled, so today's set mixes patterns, forcing the *diagnosis* step that blocked practice skips. Diagnosis is the actual interview skill. **Pressure exposure**: mild time stress today inoculates against heavier stress later; the protocol (restate → pattern → plan → code → complexity → test) is your handrail when adrenaline narrows thinking.

### The recognition table you are testing

Condensed from the week — the cue on the left should fire the drawer on the right in under a minute: "count/group/seen before" → hash map or set (23). "Sorted + pair" → closing pincers (24). "Longest/shortest contiguous stretch such that…" → sliding window, likely with a frequency map (24). "Nested/matching/most-recent-first" → stack (25). "In arrival order / level by level" → queue (25). "Next greater/smaller" → monotonic stack (25). "Reverse in place / cycle / middle" → pointer surgery, fast/slow (26). "Same problem, smaller / nested data" → recursion, memoize if subproblems overlap (27). No cue firing? Start with brute force, state its complexity, and let the inefficiency point at the right drawer — "my inner loop is a membership scan" IS the cue.

### The error log format

One entry per miss, four fields: **Problem** (name + one-line statement). **What happened** (wrong pattern? right pattern, buggy code? timeout?). **Root cause** — be specific: "read \'substring\' but didn't register contiguity" not "was dumb". **The cue I'll use next time** — one sentence, future-tense, testable. Keep it in \`error_log.md\` next to patterns.md. Rule: every entry gets re-read at the start of the next drill (Day 35) — the log is a reading list, not a diary.`,
    viz: null,
    guided: [
      {
        title: 'Warm-up: the 60-second diagnosis drill',
        minutes: 15,
        body: `No coding — diagnosis only. For each problem statement below, write: the pattern, the key data structure, and expected complexity. 60 seconds each, timed. Answers at the bottom — score yourself before peeking.

1. Given a string, find the length of the longest substring containing at most two distinct characters.
2. Given a sorted array and a target, return whether any pair sums to it.
3. Given a list of temperatures, for each day find how many days until a warmer one.
4. Given a nested list of ints of arbitrary depth, return the maximum value.
5. Given an array, return true if any value appears at least twice.
6. Given a linked list, return the node where a cycle begins (or None).
7. Given a string of brackets, determine the minimum additions to make it valid.
8. Given an array, find the k most frequent elements.

Score: 7–8 = drawers are labeled; 5–6 = review the misses\' days tonight; ≤4 = redo the week\'s flashcard decks before the timed drill.`,
        code: `# Answers (peek only after committing your own):
# 1 variable sliding window + frequency map — O(n)          (Day 24)
# 2 closing pincers on sorted data — O(n)                    (Day 24)
# 3 monotonic stack of indices — O(n)                        (Day 25)
# 4 recursion over nesting: base=int, recurse=list — O(n)    (Day 27)
# 5 seen-set — O(n) time, O(n) space                         (Day 23)
# 6 fast/slow to detect, then two-pointer restart — O(n)     (Day 26)
# 7 stack (or open/close counters — order is enough here!) — O(n)  (Day 25)
# 8 frequency map + most_common — O(n log n) or O(n) bucket  (Day 23)`,
      },
      {
        title: 'Set up the error log',
        minutes: 10,
        body: `1. Create \`error_log.md\` in your practice repo with the four-field template from the tech section and a header explaining (to future-you) what this file is for.
2. Seed it with your first entries: any diagnosis you missed in the warm-up gets one, written in full format. If you went 8/8, log the SLOWEST diagnosis instead — hesitation is data too.
3. Add a standing section at the top called "Cues to re-read before every drill" — it starts empty and accumulates your personal misfire patterns.
4. Commit. This file gets an entry after every mock interview from now to Day 179 — treat its honesty as sacred: nobody reads it but you, so a flattering error log is a useless one.`,
      },
    ],
    practice: [
      {
        title: 'Spaced-rep sweep before the drill',
        minutes: 15,
        body: `Run the full Week 4 flashcard deck (Days 22–27, ~30 cards). For every card you fail, do a 60-second active repair: open that day\'s patterns.md section (not the full lesson), re-derive the idea, close it, and answer the card again from memory.

Goal: deck at ≥90% before the timed drill — going in warm is the point of a checkpoint day.

Hints: cards failed twice in a row get written on today\'s error log under "Cues to re-read" — a flashcard you keep failing is a cue you keep missing.`,
      },
    ],
    project: {
      title: 'The timed drill — four problems, 60 minutes, self-scored',
      brief: `Simulate the real thing: timer visible, no notes, no patterns.md, think-aloud protocol OUT LOUD for every problem. The set, one per drawer: (1) hashing — given two strings, return all characters that appear in both with the minimum of their two counts; (2) window — longest substring of s containing no character from a given banned set... wait, too easy? then: longest substring with at most k repeats of any single character; (3) stack — evaluate a postfix expression ("3 4 + 2 *" → 14); (4) recursion — given a nested list, return a flat list with all ints doubled. 15 minutes each. Then switch to examiner mode: score each against the rubric below, write error-log entries for everything that went wrong, and commit solutions + updated log. Your score is a baseline, not a verdict — Day 35 measures the delta.`,
      rubric: [
        'Each problem: correct on your own test cases including one edge case (empty input at minimum)',
        'Each problem: pattern named and complexity stated BEFORE coding (the protocol, spoken aloud)',
        'At least 3 of 4 completed within their 15-minute boxes',
        'Every failure or overrun has a four-field error-log entry with a specific, testable cue',
        'Solutions + error_log.md committed; baseline score recorded in your journal for Day 35 comparison',
      ],
    },
    mistakes: [
      'Skipping the think-aloud protocol when alone. The protocol under pressure is the skill being trained; silent solving trains a different (easier) skill and the gap shows up in real interviews.',
      'Grading yourself generously. "Almost worked" is a fail with a lesson in it; the error log only compounds if entries are honest. Nobody reads it but you.',
      'Writing error-log root causes like "careless" or "rushed". Those are moods, not causes. "Did not test the empty input" is a cause — it implies the fix.',
      'Treating a low baseline as bad news. Day 28 exists to LOCATE the gaps while they are one week old; the score that matters is the Day 35 delta.',
      'Reviewing by rereading patterns.md instead of re-solving. Recognition returns fast under rereading and vanishes under pressure — only retrieval sticks.',
      'Skipping the spaced-rep sweep to save time for the drill. Cold-start failure tells you less than warmed-up failure: the sweep separates "never learned" from "can\'t retrieve under pressure".',
    ],
    quiz: [
      {
        q: 'Problem: "longest contiguous run of days with total rainfall under X." First drawer to open?',
        o: [
          'Hash map for counting',
          'Variable sliding window — grow right, shrink while the sum violates the cap',
          'Monotonic stack',
          'Recursion over halves',
        ],
        x: 1,
        w: '"Longest contiguous … such that constraint" is the window signature (Day 24). Window state here is just the running sum.',
        revisit: 24,
      },
      {
        q: 'Why does today\'s drill MIX patterns instead of drilling one at a time like Days 23–27?',
        o: [
          'To make it harder for its own sake',
          'Blocked practice skips the diagnosis step; interleaved problems arrive unlabeled and force pattern RECOGNITION — the actual interview skill',
          'To cover more material per hour',
          'Because the problems are easier when mixed',
        ],
        x: 1,
        w: 'Interleaving is harder and feels worse, which is exactly why it works: it trains "which tool?" — the step blocked practice never exercises.',
        revisit: 28,
      },
      {
        q: 'The most useful field in an error-log entry is…',
        o: [
          'The date',
          'How you felt about the miss',
          'The specific, testable cue you\'ll use next time (root cause turned into a future trigger)',
          'The full correct solution pasted in',
        ],
        x: 2,
        w: 'The log\'s job is changing future behavior. "When I read \'substring\', I will check contiguity before choosing" is executable; feelings and pasted solutions are not.',
        revisit: 28,
      },
    ],
    resources: [
      { label: 'NeetCode Roadmap — practice pool for extra drill problems', url: 'https://neetcode.io/roadmap', type: 'course', time: '20 min' },
      { label: 'Tech Interview Handbook — coding interview best practices (repo)', url: 'https://github.com/yangshun/tech-interview-handbook', type: 'repo', time: '20 min' },
      { label: 'VisuAlgo — verify any structure you misremembered today', url: 'https://visualgo.net/en', type: 'tool', time: '10 min' },
    ],
    schedule: [
      { activity: 'Guided: 60-second diagnosis drill (timed)', minutes: 15 },
      { activity: 'Guided: set up error_log.md + seed entries', minutes: 10 },
      { activity: 'Practice: spaced-rep sweep of the Week 4 deck', minutes: 15 },
      { activity: 'Project: timed 4-problem drill (15 min each)', minutes: 60 },
      { activity: 'Self-scoring, error-log entries, commit', minutes: 15 },
      { activity: 'Quiz + journal baseline note', minutes: 10 },
    ],
    completion: [
      'Diagnosis drill scored; misses logged',
      'error_log.md created, seeded, and committed with the four-field format',
      'Timed drill done under real conditions: no notes, protocol aloud, timer visible',
      'Baseline recorded in journal; quiz ≥ 2/3',
    ],
    connections: {
      back: 'Everything drilled today was built Monday-to-Saturday: Day 22\'s complexity language, Day 23\'s hash patterns, Day 24\'s pointers and windows, Day 25\'s LIFO/FIFO, Day 26\'s pointer surgery, Day 27\'s recursion.',
      forward: 'Day 35 reruns the drill over trees, graphs, and DP and measures your delta. The error log rides along to every mock (Days 84, 179). Interleaved retrieval under pressure is also exactly how Day 134\'s eval mindset treats an LLM: fixed unlabeled cases, honest scoring, tracked over time.',
    },
    flashcards: [
      { f: 'Why interleave patterns in a drill?', b: 'Real problems arrive unlabeled — interleaving trains diagnosis, the step blocked practice skips.' },
      { f: 'Error-log entry: the four fields?', b: 'Problem · what happened · specific root cause · testable cue for next time.' },
      { f: 'No pattern cue fires — what do you do?', b: 'State brute force + its complexity; let the inefficiency (e.g. inner membership scan) point at the drawer.' },
      { f: 'A good root cause vs a bad one?', b: 'Good: "didn\'t test empty input" (implies a fix). Bad: "careless" (a mood, not a cause).' },
      { f: 'What is the Day 28 score for?', b: 'A located baseline. The metric that matters is the Day 35 delta after a week of tree/graph patterns.' },
    ],
    deepDive: [
      { label: 'Make the drill recurring', note: 'Schedule a weekly 30-minute mini-drill (two unlabeled problems from the NeetCode pool) every weekend through Phase 2. Small, repeated, interleaved doses beat cramming before Day 35 — the SM-2 principle applied to problem-solving itself.' },
    ],
  },
];
