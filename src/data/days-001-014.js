// Days 1–14 — Phase 1, Weeks 1–2: Python from zero + objects, iterators, and the time machine.
export const DAYS_001_014 = [
  {
    id: 'd001', day: 1, week: 1, phase: 1, kind: 'lesson',
    title: 'Your Machine, Your Map',
    analogy: 'Packing for the expedition',
    objectives: [
      'Install Python 3.12+ and VS Code, and verify both from the terminal',
      'Explain the difference between the REPL and a script, and run code in both',
      'Edit a program, rerun it, and read the error message when it breaks',
      'Describe the daily 2-hour protocol and why active recall beats rereading',
      'Ask the AI tutor for a hint on a stuck problem without asking for the answer',
    ],
    prereqs: [],
    eli5: `Before a long expedition, experienced hikers do something that looks boring: they lay every piece of gear out on the floor, light the stove once, fill the water filter once, and walk around the block with the loaded pack. Not to get anywhere — to make sure that on day 40, in the rain, nothing surprises them. Today is that floor. Your gear: **Python** (the stove — it turns your written instructions into action), **VS Code** (the multi-tool — where you write and edit those instructions), and the **terminal** (the map and compass — a text window where you tell the computer directly what to do).

A program is just a text file of instructions that Python reads from top to bottom and performs, one line at a time. You will write one today, break it on purpose, and fix it. That last part matters most: on this expedition, error messages are signposts, not injuries. By tonight, every tool will have been used at least once — which means day 40 can't ambush you.`,
    why: `Every AI engineer lives in exactly these three tools: an editor, a terminal, and a language runtime. Forward-deployed engineers feel it hardest — on a customer site you may have one hour to get a working environment on an unfamiliar laptop before a demo, and "it works on my machine" is not an answer you can give a client. The habits you set today (verify versions, run from the terminal, read errors calmly) are the same ones you will use on Day 151 when you deploy a real service to a cloud server you have never touched before.`,
    tech: `### What Python actually is

Python is an **interpreter**: a program that reads your text file line by line, translates each statement into machine actions, and executes it immediately. You interact with it two ways. The **REPL** (Read-Eval-Print Loop) starts when you type \`python\` (or \`python3\`) in a terminal with no filename: you type one expression, it evaluates and prints the result, and waits for the next. It is a scratchpad — perfect for testing one idea, useless for keeping work. A **script** is a saved \`.py\` file you run with \`python myfile.py\`; the interpreter executes the whole file top to bottom and exits. Scripts are how real software ships; the REPL is how you poke at things. One surprise: the REPL echoes the value of a bare expression, but a script prints nothing unless you explicitly call \`print()\`.

### The terminal in one paragraph

The terminal (also called shell or command line) is a program that takes typed commands and runs them. When you type \`python --version\`, the shell finds a program named \`python\` and passes it the instruction \`--version\`. You will learn it properly on Day 6; today you only need: open it, check versions, run scripts.

### How the 180 days work

Every day is ~2 focused hours in the same shape: a 10-minute spaced-repetition warm-up of old material, concept study, guided coding, independent practice, a small project, and a quiz. Two findings from learning science drive this design. **Active recall**: testing yourself strengthens memory far more than rereading, which mostly produces a feeling of familiarity. **Spaced repetition**: reviewing just before you would forget (1 day, 3 days, a week…) flattens the forgetting curve; the flashcards each day emits feed that scheduler. Corollary: when stuck, ask the AI tutor for a *hint* — "what should I check next?" — not the answer. Struggling briefly and then generating the solution yourself is what writes it into memory; pasting a provided answer writes nothing.`,
    viz: null,
    guided: [
      {
        title: 'Meet the REPL — the conversation window',
        minutes: 15,
        body: `1. Open a terminal (macOS: Terminal app; Windows: PowerShell; Linux: any terminal). Type \`python --version\` and press Enter. If that prints an error or Python 2.x, try \`python3 --version\`. You want 3.12 or newer.
2. Start the REPL: type \`python\` (or \`python3\`) with nothing after it. You should see a \`>>>\` prompt — Python is now listening.
3. Type each line below, pressing Enter after each, and watch what comes back. Predict the result BEFORE pressing Enter — that prediction habit is active recall and you will use it every day for 180 days.
4. Note the one that surprises you (for most people it is \`7 / 2\` vs \`7 // 2\`).
5. Exit the REPL with \`exit()\` — you are back in the shell. Notice the \`>>>\` prompt is gone: shell commands and Python code live in different worlds, and typing one into the other is the classic Day-1 error.`,
        code: `2 + 3
7 * 6
7 / 2        # division always gives a decimal (a "float")
7 // 2       # floor division chops the decimal off
2 ** 10      # ** is "to the power of"
print("hello, expedition")
"day " + "one"
"ha" * 3
# now make an error ON PURPOSE and read the message:
1 / 0
# ZeroDivisionError: division by zero  <- the LAST line names the problem`,
      },
      {
        title: 'Your first script — from scratchpad to saved program',
        minutes: 15,
        body: `1. In VS Code, create a folder called \`ai-engineer-journey\` somewhere you can find it (Desktop is fine). Open the folder in VS Code (File > Open Folder).
2. Create a new file named \`hello.py\` and type (do not paste — typing builds muscle memory) the starter code below.
3. Save it, open VS Code's built-in terminal (View > Terminal), and run it: \`python hello.py\`.
4. All four lines print in order — Python read your file top to bottom. Now edit line 2 to use your actual name, save, and run again. This edit-save-run loop is the fundamental rhythm of programming; you will do it thousands of times.
5. Add a fifth print line of your own that computes something (e.g. how many minutes 180 days of 2 hours is: \`print(180 * 120)\`). Run it. Congratulations — you extended a program.`,
        code: `print("=" * 40)
print("Expedition log: YOUR NAME HERE")
print("Day 1 of 180")
print("Hours of practice ahead:", 180 * 2)
print("=" * 40)`,
      },
      {
        title: 'Break it on purpose — error messages are signposts',
        minutes: 10,
        body: `1. Errors will happen every single day of this program, so meet the three most common ones now, in a safe place. In \`hello.py\` (or the REPL), cause each error below, one at a time.
2. For each, read the LAST line of the output first — that is the error type and description. Then look at the line number Python points to.
3. Write one sentence in your own words for each: what did Python object to?
4. Rule to keep forever: an error message is Python telling you exactly where it got confused. Read it before you change anything. Guess-and-retype without reading is the slowest possible way to debug.`,
        code: `# 1) SyntaxError — Python cannot even parse the line:
print("unclosed
# SyntaxError: unterminated string literal

# 2) NameError — you used a name that was never defined:
print(mesage)   # note the typo
# NameError: name 'mesage' is not defined

# 3) TypeError — you combined things that do not combine:
print("day " + 1)
# TypeError: can only concatenate str (not "int") to str
# fix it like this:
print("day " + str(1))    # str() converts the number to text`,
      },
    ],
    practice: [
      {
        title: 'The expedition manifest',
        minutes: 15,
        body: `Write a new script \`manifest.py\` from a blank file, without looking at \`hello.py\`.

Goal: print a 6-line "packing manifest" — a title line, your name, your target role (AI Engineer / FDE), today's date typed as text, the total study hours remaining (compute it with arithmetic: 179 days x 2 hours — let Python do the math, do not type 358), and a decorative border line made with string repetition (\`"-" * 40\`).

Constraints: at least one line must mix text and a computed number in one \`print\`, and you must run it from the terminal, not the editor's run button.

Hints (only if stuck): \`print\` takes several items separated by commas and puts spaces between them. Multiplying a string repeats it.`,
      },
    ],
    project: {
      title: 'Base camp: your journey folder',
      brief: `Set up the folder that every one of the next 180 days will use. Inside \`ai-engineer-journey\`, create a \`week-01\` subfolder and move today's scripts into it. Create a file \`journal.md\` at the top level and write your Day 1 entry: three sentences on why you are doing this program, the exact commands you used to check your Python version and run a script, and the one error message you met today with what it meant. Finally, run \`manifest.py\` from the terminal one more time, from OUTSIDE its folder (\`python week-01/manifest.py\`) — proof you understand that the terminal has a current location. On Day 8 this whole folder goes under version control, so keep it tidy from the start.`,
      rubric: [
        'python --version (or python3) prints 3.12 or newer in your terminal',
        'hello.py and manifest.py both run from the terminal without errors',
        'manifest.py computes 179 * 2 in code rather than hard-coding the number',
        'journal.md exists with the Day 1 entry including one error message and its meaning',
        'manifest.py successfully run from the parent folder using its week-01/ path',
      ],
    },
    mistakes: [
      'Typing Python code at the shell prompt (or shell commands at the >>> prompt). They are different programs: the shell runs commands, the REPL runs Python. Check which prompt you see before typing.',
      'Expecting a script to show values like the REPL does. The REPL echoes bare expressions; a script only shows what you pass to print().',
      'Guess-editing when an error appears instead of reading it. The last line of a traceback names the problem and the arrow points at the line — read first, edit second.',
      'Studying by rereading and highlighting. Familiarity is not memory. Predict-before-run, close-the-book recall, and the daily quiz are what actually store knowledge.',
      'Asking the AI tutor to "write it for me." You lose the exact struggle that builds skill. Ask "what should I look at?" or "why does this error happen?" instead.',
      'Having two Pythons installed and editing with one while running the other. Always verify with python --version in the same terminal you run scripts from.',
    ],
    quiz: [
      {
        q: 'You type 2 + 3 into a running Python REPL and press Enter. What happens?',
        o: [
          'Nothing — you must call print() to see output',
          'It prints 5, because the REPL evaluates and echoes each expression',
          'It saves 5 into a file',
          'SyntaxError — the REPL only accepts complete programs',
        ],
        x: 1,
        w: 'The REPL is a Read-Eval-Print Loop: it evaluates each expression and prints the result immediately. In a script, the same line would compute 5 and silently discard it — that is the REPL/script difference.',
        revisit: 1,
      },
      {
        q: 'Your script crashes with a screenful of text. Where do you look first?',
        o: [
          'The first line of the output',
          'The last line — it names the error type and what went wrong',
          'Nowhere — rerun it, it might pass',
          'The line count of the file',
        ],
        x: 1,
        w: 'Tracebacks are read bottom-up: the final line gives the error type and message, and just above it Python points at the file and line where it got confused.',
        revisit: 1,
      },
      {
        q: 'Why does this program schedule a 10-minute flashcard review at the start of every day?',
        o: [
          'To fill time before the real content',
          'Because rereading old notes is the strongest form of learning',
          'Because recalling material just before you would forget it flattens the forgetting curve',
          'To make the schedule add up to two hours',
        ],
        x: 2,
        w: 'Spaced repetition schedules recall right before forgetting. Combined with active recall (retrieving, not rereading), it is the highest-leverage study technique known — which is why it is built into all 180 days.',
        revisit: 1,
      },
    ],
    resources: [
      { label: 'Python Tutorial — Using the Python Interpreter (REPL vs scripts)', url: 'https://docs.python.org/3/tutorial/interpreter.html', type: 'docs', time: '15 min' },
      { label: 'VS Code — Getting Started with Python (official setup walkthrough)', url: 'https://code.visualstudio.com/docs/python/python-tutorial', type: 'docs', time: '20 min' },
      { label: 'Automate the Boring Stuff — Ch. 0: Introduction (why program at all)', url: 'https://automatetheboringstuff.com/2e/chapter0/', type: 'book', time: '15 min' },
      { label: 'MIT Missing Semester — the tools course this program borrows from', url: 'https://missing.csail.mit.edu/', type: 'course', time: '10 min' },
    ],
    schedule: [
      { activity: 'Orientation: read the ELI5 + why + how the 2-hour protocol works', minutes: 15 },
      { activity: 'Install & verify: Python 3.12+, VS Code, open a terminal', minutes: 25 },
      { activity: 'Guided: REPL session, first script, break-it-on-purpose', minutes: 40 },
      { activity: 'Practice: the expedition manifest', minutes: 15 },
      { activity: 'Project: base camp folder + journal entry', minutes: 15 },
      { activity: 'Quiz + make your first flashcards', minutes: 10 },
    ],
    completion: [
      'python --version shows 3.12+ and both scripts run from the terminal',
      'All three guided exercises done, including all three deliberate errors read and explained',
      'Base camp folder exists with journal.md Day 1 entry',
      'Quiz ≥ 2/3 (reread the tech section and retake if lower)',
    ],
    connections: {
      back: 'This is Day 1 — nothing behind you but the decision to start. Everything ahead compounds from the edit-save-run loop and the recall habit you set today.',
      forward: 'On Day 6 the terminal you only peeked at becomes a full lesson, and on Day 8 this exact folder goes under git — your first commit will be the journal you started tonight. The error-reading ritual pays off daily, and becomes a formal debugging method on Day 19.',
    },
    flashcards: [
      { f: 'REPL vs script?', b: 'REPL: interactive prompt, evaluates and echoes each expression. Script: saved .py file run top-to-bottom; only print() produces output.' },
      { f: 'Where do you read a Python error first?', b: 'The LAST line of the traceback — it names the error type and message; above it is the file and line number.' },
      { f: 'Active recall vs rereading?', b: 'Retrieving from memory strengthens it; rereading only builds familiarity. Predict-before-run, quiz, flashcards = recall.' },
      { f: 'What does spaced repetition do?', b: 'Schedules review just before forgetting (1d, 3d, 1w...), flattening the forgetting curve with minimal time.' },
      { f: 'How to ask the AI tutor when stuck?', b: 'Ask for a hint or a pointer ("what should I check?"), never the full answer — generating the fix yourself is what builds memory.' },
    ],
    deepDive: [
      { label: 'What happens between your .py file and the CPU?', note: 'CPython compiles your source to bytecode (.pyc files in __pycache__) and a virtual machine executes that. You will care about this again on Day 39 (processes) and Day 40 (the GIL).' },
    ],
  },
  {
    id: 'd002', day: 2, week: 1, phase: 1, kind: 'lesson',
    title: 'Variables, Types & Control Flow',
    analogy: 'Labeled boxes and forks in the road',
    objectives: [
      'Create variables and explain binding a name vs the value it points to',
      'Identify and convert between int, float, str, bool, and None',
      'Write branching logic with if/elif/else, including compound conditions',
      'Repeat work with while and for/range, controlling loops with break and continue',
      'Format output with f-strings and read user input with input()',
    ],
    prereqs: [
      { day: 1, label: 'Setup, REPL vs scripts, running programs' },
    ],
    eli5: `Picture a warehouse of boxes, each with a name label stuck on the front. A **variable** is the label, not the box: \`age = 30\` writes "age" on a sticky label and slaps it on a box containing 30. Later, \`age = 31\` peels the label off and sticks it on a different box — the old box is unchanged, the label just moved. Boxes come in kinds — whole numbers (int), decimals (float), text (str), yes/no switches (bool), and a special "nothing here" marker (None) — and the kind decides what you can do: you can add number boxes, but adding a number box to a text box makes Python object.

Now the second half: a program is normally a straight road, executed top to bottom. **Control flow** adds forks and roundabouts. \`if\` is a fork — "if it's raining, take the left path, else the right." \`while\` and \`for\` are roundabouts — "keep circling until the condition says stop" or "go around once per item." With labels for memory and forks for decisions, your programs stop being recited lines and start being behavior.`,
    why: `Every system you will ever build is variables plus branches plus loops wearing increasingly fancy costumes. The agent loop you build on Day 120 is literally a while-loop with an if inside: "while the task is not done, decide the next action." Retry logic on Day 107 is a for-loop with a break. On customer calls, an FDE constantly sight-reads unfamiliar code — "what does this branch do when the value is None?" — and today's material is exactly that reading skill. Types matter early too: half of all beginner bugs (and plenty of production ones) are a str pretending to be an int.`,
    tech: `### Names and values

\`x = 5\` is a **binding**: the name x now refers to an int object holding 5. Reassigning rebinds the name; it does not modify the old value. Python is **dynamically typed** — a name can be rebound to a value of a different type — but every *value* has a definite type, and operations check it: \`"3" + 4\` raises TypeError. Convert explicitly with \`int("3")\`, \`float("2.5")\`, \`str(7)\`. Beware: \`input()\` ALWAYS returns a str, even when the user types 42 — forgetting this is the most common Week-1 bug. \`None\` is a real value meaning "nothing here"; test for it with \`x is None\`.

### Truthiness and conditions

Comparisons (\`==\`, \`!=\`, \`<\`, \`>=\`) produce bools. Combine them with \`and\`, \`or\`, \`not\`. In a condition, Python also accepts non-bools and applies **truthiness**: 0, 0.0, empty string, and None count as False; everything else is True. So \`if name:\` reads "if name is non-empty." Use \`==\` for comparison — a single \`=\` is assignment and is a SyntaxError inside an if.

### Blocks are indentation

An \`if\`, \`elif\`, \`else\`, \`while\`, or \`for\` line ends with a colon, and the lines it controls are indented (4 spaces, consistently). Indentation is not decoration in Python — it IS the block structure. Dedenting ends the block.

### Loops

\`while condition:\` repeats as long as the condition holds — you must change something inside the loop or it spins forever (Ctrl+C interrupts a runaway program). \`for i in range(5):\` visits 0,1,2,3,4 — range(start, stop) stops BEFORE stop, which keeps counting consistent across Python. \`break\` exits the loop immediately; \`continue\` skips to the next iteration. Finally, **f-strings** are how you build output: \`f"score: {score}"\` inserts the value of score into the text — put an f before the opening quote and braces around any expression.`,
    viz: 'cells-vars',
    guided: [
      {
        title: 'Boxes lab — bindings, types, conversions',
        minutes: 15,
        body: `1. Create \`boxes.py\` in week-01 and work through the starter code, running after each numbered section (comment out later sections until you get there).
2. Section 1: predict each printed type before running. \`type(x)\` tells you what kind of box a name points to.
3. Section 2: the rebinding demo — convince yourself the label moved and no box changed.
4. Section 3: fix the deliberately broken conversion line so it prints the right total. This is the input()-returns-str trap; you are meeting it today so it cannot ambush you on Day 7.
5. In one comment at the bottom, answer: what type does input() return, always?`,
        code: `# --- section 1: every value has a type
print(type(42))        # int
print(type(3.14))      # float
print(type("hi"))      # str
print(type(True))      # bool
print(type(None))      # NoneType

# --- section 2: rebinding moves the label, not the box
x = 10
y = x          # y labels the SAME value 10
x = 99         # x moves to a new box...
print(x, y)    # 99 10  ...y still points at the old one

# --- section 3: the input() trap (fix me!)
age_text = "29"          # pretend this came from input()
next_year = age_text + 1          # TypeError! str + int
# fix: convert first ->  next_year = int(age_text) + 1
print(f"next year you will be {next_year}")`,
      },
      {
        title: 'Forks in the road — an advice machine',
        minutes: 15,
        body: `1. Create \`advice.py\`. It reads a temperature and prints clothing advice. Type the starter code and run it a few times with different numbers.
2. Trace the flow: exactly ONE branch runs — Python checks conditions top to bottom and takes the first true one. Reorder the first two branches and observe how a temperature of 35 now gets the wrong advice; order matters.
3. Add a new elif for temperatures below -10 ("stay home"). Where must it go to ever be reached?
4. Extend the final print with a compound condition: if it is between 18 and 24 inclusive (\`18 <= t <= 24\`), also print "perfect t-shirt weather".
5. If your environment does not support input(), replace the input line with \`t = 21\` and rerun with several hard-coded values — the logic is the lesson, not the typing.`,
        code: `t = float(input("Temperature in C: "))   # input() gives a str; float() converts

if t >= 30:
    print("Shorts. Hydrate.")
elif t >= 20:
    print("T-shirt weather.")
elif t >= 10:
    print("Light jacket.")
elif t >= 0:
    print("Proper coat.")
else:
    print("Everything you own, all at once.")

if t < 0 and t >= -10:
    print("Also: gloves.")`,
      },
      {
        title: 'Roundabouts — while, for, break, continue',
        minutes: 15,
        body: `1. Create \`loops.py\` with the starter code. Section 1 is a countdown: predict the last number printed before running (hint: the condition is checked BEFORE each pass).
2. Section 2: for + range. Change it to range(1, 11) and then range(0, 30, 5) — write down what the third argument does.
3. Section 3: a search loop with break. Add a print AFTER the loop showing whether the target was found (set a variable \`found = True\` inside).
4. Section 4: continue — the loop skips multiples of 3. Flip it to instead skip everything EXCEPT multiples of 3.
5. Deliberately create an infinite loop (remove the \`n = n - 1\` line in section 1), run it, and stop it with Ctrl+C. Every programmer does this weekly; now it holds no fear.`,
        code: `# --- 1: while counts down
n = 5
while n > 0:
    print("T-minus", n)
    n = n - 1        # without this line: infinite loop
print("liftoff!")

# --- 2: for visits each number range() hands it
for i in range(5):           # 0,1,2,3,4 — stops BEFORE 5
    print("lap", i)

# --- 3: break exits early
for i in range(1, 100):
    if i * i > 50:
        print("first square over 50 is", i * i)
        break

# --- 4: continue skips one lap
for i in range(1, 10):
    if i % 3 == 0:           # % is remainder: 6 % 3 == 0
        continue
    print(i, "is not a multiple of 3")`,
      },
    ],
    practice: [
      {
        title: 'The guessing game',
        minutes: 20,
        body: `Build \`guess.py\`: the classic number-guessing game, from a blank file.

Goal: the program holds a secret number (hard-code \`secret = 37\` or use \`import random\` and \`random.randint(1, 100)\` — a preview of Day 3). It repeatedly asks the player for a guess, replies "higher" or "lower", and congratulates them when correct — including how many guesses it took.

Constraints: use a while loop; count attempts in a variable; use f-strings for every message; the reply for a correct guess must break out of the loop. Bonus: after 7 wrong guesses, print a mercy hint (is the secret even or odd? \`secret % 2\`).

Hints (only if stuck): the loop condition can be \`while True:\` with a break on success. Remember what type input() returns before you compare it to a number.`,
      },
    ],
    project: {
      title: 'Choose-your-path quiz',
      brief: `Build \`pathquiz.py\`: a five-question command-line quiz about anything you like (Day 1–2 material is a good default). Each question prints, reads an answer with input(), compares case-insensitively where sensible, and updates a running score. Wrong answers print the correct one — the quiz should teach, like this program's own quizzes do. After question five, print a summary with an f-string ("You scored 4/5") and use if/elif/else to award a verdict tier (5 = "expedition ready", 3–4 = "solid", under 3 = "revisit today's notes"). Use at least one loop (e.g. re-ask a question until the answer is non-empty). Save it in week-01; tomorrow you will refactor it with functions.`,
      rubric: [
        'Runs start to finish with no errors for both a perfect and an imperfect player',
        'Score is computed in a variable, never hand-tallied by the player',
        'Wrong answers display the correct answer before moving on',
        'Verdict uses if/elif/else and every tier is reachable (test all three)',
        'All player-facing messages are f-strings, and at least one loop is used',
      ],
    },
    mistakes: [
      'Forgetting that input() returns a str: comparing input("guess: ") == 37 is always False because "37" is not 37. Convert with int() first.',
      'Using = when you mean ==. Single = binds a name; double == compares. Inside an if, = is a SyntaxError — Python catches this one for you.',
      'Believing reassignment changes the old value. x = 99 rebinds the label x; anything else pointing at the old value still sees it. (This distinction gets sharper with lists on Day 4.)',
      'Off-by-one with range: range(5) is 0..4, and range(1, 5) is 1..4 — the stop value is never included. Say the sequence out loud before trusting a loop.',
      'Writing a while loop that never changes its condition variable — an infinite loop. Ask of every while: what line in the body moves it toward False?',
      'Testing if x == True instead of if x, or if name != "" instead of if name. Truthiness exists so conditions read cleanly; use it.',
    ],
    quiz: [
      {
        q: 'What does this print? \n x = "5" \n y = x + x \n print(y)',
        o: ['10', '55', 'TypeError', '"5" + "5"'],
        x: 1,
        w: '"5" is a str, and + on strings concatenates: "5" + "5" is "55". To get 10 you would convert first: int(x) + int(x). Type determines behavior.',
        revisit: 2,
      },
      {
        q: 'How many times does this loop print? \n for i in range(2, 8):',
        o: ['8', '7', '6', '5'],
        x: 2,
        w: 'range(2, 8) yields 2,3,4,5,6,7 — six values. The stop value is never included. Counting "stop minus start" gives loop length for a step of 1.',
        revisit: 2,
      },
      {
        q: 'In an if/elif/elif/else chain where several conditions are true, what runs?',
        o: [
          'Every branch whose condition is true',
          'Only the first true branch, checked top to bottom',
          'Only the else branch',
          'Python raises an error for ambiguity',
        ],
        x: 1,
        w: 'The chain is checked in order and exactly one branch executes — the first whose condition is true. That is why branch ORDER matters, as you saw when reordering the temperature advice.',
        revisit: 2,
      },
    ],
    resources: [
      { label: 'Python Tutorial — An Informal Introduction (numbers, strings, first steps)', url: 'https://docs.python.org/3/tutorial/introduction.html', type: 'docs', time: '25 min' },
      { label: 'Python Tutorial — More Control Flow Tools (if, for, range)', url: 'https://docs.python.org/3/tutorial/controlflow.html', type: 'docs', time: '20 min' },
      { label: 'Automate the Boring Stuff — Ch. 1: Python Basics', url: 'https://automatetheboringstuff.com/2e/chapter1/', type: 'book', time: '30 min' },
      { label: 'Automate the Boring Stuff — Ch. 2: Flow Control', url: 'https://automatetheboringstuff.com/2e/chapter2/', type: 'book', time: '30 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: Day 1 flashcards', minutes: 10 },
      { activity: 'Concept study: ELI5 + tech, with the cells-vars visualizer', minutes: 20 },
      { activity: 'Guided: boxes lab, advice machine, loops', minutes: 45 },
      { activity: 'Practice: the guessing game', minutes: 20 },
      { activity: 'Project: choose-your-path quiz', minutes: 20 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'All three guided scripts run; the input() trap fix explained in a comment',
      'Guessing game works including the attempt counter',
      'Path quiz passes all five rubric checks',
      'Quiz ≥ 2/3 (revisit the tech section on types or loops if lower)',
    ],
    connections: {
      back: 'On Day 1 you learned to run code and read errors; today the code started making decisions. The TypeError you caused deliberately yesterday is the same one the input() trap produces.',
      forward: 'Day 3 wraps today\'s logic into reusable functions — your path quiz gets refactored. The while-plus-if shape you wrote in the guessing game is, at full scale, the agent loop of Day 120, and truthiness returns everywhere from Day 4 collections to Day 110 validation code.',
    },
    flashcards: [
      { f: 'What type does input() return?', b: 'Always str — convert with int()/float() before doing math or numeric comparison.' },
      { f: 'range(2, 8) yields…?', b: '2,3,4,5,6,7 — start included, stop excluded. Six values.' },
      { f: 'Falsy values in Python?', b: '0, 0.0, "" (empty string), None, False (and empty collections — Day 4). Everything else is truthy.' },
      { f: 'break vs continue?', b: 'break exits the loop entirely; continue skips the rest of THIS iteration and loops again.' },
      { f: '= vs ==?', b: '= binds a name to a value (assignment); == compares two values (yields a bool).' },
      { f: 'f-string syntax?', b: 'f"text {expression} text" — the f prefix plus braces interpolates values into the string.' },
    ],
    deepDive: [
      { label: 'match/case — structural pattern matching', note: 'Python 3.10+ has a match statement, a supercharged if/elif for matching shapes of data. Skim the tutorial section on it once if/elif feels comfortable; you will see it in modern codebases.' },
    ],
  },  {
    id: 'd003', day: 3, week: 1, phase: 1, kind: 'lesson',
    title: 'Functions, Scope & Modules',
    analogy: 'Recipes and kitchens',
    objectives: [
      'Define functions with parameters, defaults, *args and **kwargs, and call them correctly',
      'Explain the difference between returning a value and printing it, and choose the right one',
      'Predict which variable a name refers to using the LEGB scope rule',
      'Import and use standard-library modules (math, random, datetime)',
      'Write a module with a docstring and an if __name__ == "__main__" block',
    ],
    prereqs: [
      { day: 1, label: 'Running scripts and reading errors' },
      { day: 2, label: 'Variables, types, and control flow' },
    ],
    eli5: `A recipe is instructions written once and cooked many times. You don't rewrite "how to make stock" inside every soup recipe — you write it on its own card, give it a name, and say "make stock" whenever you need it. A **function** is that card: \`def make_stock(bones, hours):\` names the recipe and lists its ingredient slots (**parameters**). Calling \`make_stock(chicken, 3)\` fills the slots and runs the card. Crucially, a good recipe *hands you the dish* at the end — that is \`return\`. Printing is different: it's the cook shouting "the stock is done!" from the kitchen. Nice to hear, but you can't pour a shout into tomorrow's soup. Return hands the value back so other code can use it.

Each time a recipe runs, it gets a clean **kitchen counter**: the bowls and spoons it uses (local variables) exist only during that cooking session and are cleared afterward. That's **scope** — names inside a function don't leak out and don't collide with yours. And a **module** is a whole recipe *book*: someone else's tested collection (\`import math\`) or your own file of recipes that any script can open.`,
    why: `Functions are the unit of everything you will ship. Every API endpoint (Day 41), every tool you hand an LLM agent (Day 111), every test you write (Day 18) is "a function with a clear input and a returned output." The return-vs-print distinction is the first hard line between toy scripts and real software: code that prints can only be watched, code that returns can be tested, composed, and called by other systems. And FDEs live in other people's modules — on-site you'll read an unfamiliar codebase and your first question is always "what does this function take and what does it return?"`,
    tech: `### Defining and calling

\`def area(width, height):\` opens a function; the indented block is its body; \`return width * height\` ends the call and hands back a value. A function with no \`return\` (or a bare \`return\`) returns \`None\` — silently, which is why "why is my variable None?" is usually "you forgot to return." Parameters can have **defaults** (\`def greet(name, punct="!")\`), and callers can pass by position or by keyword (\`greet(name="Ada")\`). Two collector forms handle "any number of arguments": \`*args\` gathers extra positional arguments into a tuple, \`**kwargs\` gathers extra keyword arguments into a dict. You'll meet them constantly when reading library code, and you'll write them yourself on Day 12 when a decorator must accept *anything*.

### Scope: the LEGB rule

When Python sees a name, it searches four kitchens in order: **L**ocal (the current function), **E**nclosing (any function this one is nested inside), **G**lobal (the module file), **B**uilt-in (\`print\`, \`len\`...). First match wins. Assignment inside a function creates a *local* name by default — even if a global with the same name exists — which produces the classic surprise: reading a global works fine, but assigning to it inside a function creates a new local instead (or raises UnboundLocalError if you read-then-assign). The professional habit: functions take inputs as parameters and hand results back with return; they don't reach out and modify globals.

### Modules and the main guard

Every \`.py\` file is a module. \`import math\` runs \`math.py\` once and gives you a namespace: \`math.sqrt(2)\`. The standard library ships hundreds of these — today you'll use \`math\` (constants, sqrt), \`random\` (randint, choice, shuffle), and \`datetime\` (dates, arithmetic on time). When you import *your own* file, Python executes it top to bottom — including any test/demo code at the bottom, which you usually don't want. The guard \`if __name__ == "__main__":\` solves this: inside a directly-run script, \`__name__\` is the string \`"__main__"\`; inside an imported module, it's the module's filename. Demo code under the guard runs only when the file is executed directly (\`python toolbox.py\` or \`python -m toolbox\`), never on import. A triple-quoted string as the first line of a function or module is its **docstring** — documentation that tools (and Day 18's tests, and future-you) can read.`,
    viz: null,
    guided: [
      {
        title: 'Recipe cards — define, call, return',
        minutes: 15,
        body: `1. Create \`week-01/recipes.py\` and type the starter code. Run it, then read the output against the code — match each printed line to the call that produced it.
2. The \`shout_area\` vs \`area\` pair is today's core lesson. Add the line \`x = shout_area(3, 4)\` then \`print(x)\` — it prints None, because shouting isn't returning. Write one comment explaining why.
3. Call \`greet\` three ways: \`greet("Ada")\`, \`greet("Ada", "?")\`, \`greet(punct="...", name="Ada")\`. Predict each output first.
4. Add a new function \`total_minutes(days, hours_per_day=2)\` that RETURNS days * hours_per_day * 60. Use it to print the minutes in this 180-day program without typing the answer yourself.
5. Delete the return line from \`area\`, rerun, and watch the arithmetic downstream break with a TypeError about NoneType — meet this error today so you recognize it forever.`,
        code: `def area(width, height):
    """Return the area of a rectangle."""
    return width * height

def shout_area(width, height):
    # prints instead of returning -- the cook shouting from the kitchen
    print("The area is", width * height)

def greet(name, punct="!"):
    return "Hello, " + name + punct

# returned values can flow onward:
a = area(3, 4)
print("area:", a)
print("double:", a * 2)       # we can keep computing with it

shout_area(3, 4)              # you hear it...
# ...but there is nothing to catch:
# x = shout_area(3, 4)  ->  x is None

print(greet("Ada"))
print(greet("Grace", "?!"))`,
      },
      {
        title: 'Whose kitchen? — scope experiments',
        minutes: 15,
        body: `1. Create \`scope_lab.py\` with the starter code, but DO NOT run it yet. Write your prediction for each numbered print as a comment.
2. Run it. Section 1 shows locals dying with the call — the NameError at the end is correct behavior, not a bug. Comment out that line after reading the error.
3. Section 2 is the shadowing trap: assigning \`score = ...\` inside the function created a brand-new local; the global never changed. Confirm by reading the two printed values.
4. Section 3: fix \`add_bonus\` the professional way — take \`score\` as a parameter and return the new value, then rebind at the call site (\`score = add_bonus(score)\`). No \`global\` keyword needed, today or (almost) ever.
5. In one sentence at the bottom: what does LEGB stand for, and which wins?`,
        code: `# --- 1: locals live only during the call
def bake():
    secret = "flour"          # local to bake()
    print("inside:", secret)

bake()
print("outside:", secret)     # NameError! the counter was wiped

# --- 2: assignment makes a LOCAL, shadowing the global
score = 100

def add_bonus():
    score = 100 + 10          # new LOCAL score, global untouched
    print("inside:", score)   # 110

add_bonus()
print("outside:", score)      # still 100!

# --- 3: the right way -- parameters in, return out
def add_bonus_fixed(score):
    return score + 10

score = add_bonus_fixed(score)
print("fixed:", score)        # 110, cleanly`,
      },
      {
        title: 'The recipe books — stdlib tour and the main guard',
        minutes: 15,
        body: `1. Create \`toolbox.py\` with the starter code and run it directly: \`python toolbox.py\`. The demo lines under the guard print.
2. Now create a second file \`use_toolbox.py\` containing just: \`import toolbox\` and \`print(toolbox.roll(20))\`. Run it — notice the demo lines did NOT print. Explain in a comment why the guard made that happen.
3. In the REPL, take a 5-minute stdlib field trip: \`import math\` then try \`math.pi\`, \`math.sqrt(2)\`, \`math.ceil(3.2)\`. Then \`import random\` and run \`random.choice(["tea", "coffee"])\` three times.
4. Add a function \`days_until_done(current_day)\` to toolbox.py that returns 180 minus current_day, with a one-line docstring. Add a demo call for it under the guard.
5. Run \`python -m toolbox\` from the same folder — the -m flag runs a module by name instead of by filename; it behaves the same here and matters more once packages arrive on Day 17.`,
        code: `"""toolbox.py -- my personal utility recipes (started Day 3)."""
import random
import datetime

def roll(sides=6):
    """Return a random die roll from 1 to sides."""
    return random.randint(1, sides)

def today_stamp():
    """Return today's date as an ISO string like 2026-08-11."""
    return datetime.date.today().isoformat()

if __name__ == "__main__":
    # demo code: runs when executed directly, NOT on import
    print("demo: rolled a", roll())
    print("demo: today is", today_stamp())`,
      },
    ],
    practice: [
      {
        title: 'Refactor the path quiz',
        minutes: 20,
        body: `Open yesterday's \`pathquiz.py\`. It works, but it's one long scroll of repeated code — exactly what functions exist to fix.

Goal: refactor it so the quiz logic lives in functions: \`ask_question(prompt, answer)\` returns True/False for one question (case-insensitive comparison inside), \`verdict(score, total)\` returns the tier string, and a \`main()\` function runs the whole quiz. The bottom of the file should be nothing but the main guard calling \`main()\`. Behavior must be identical to yesterday's version.

Constraints: no \`global\` anywhere; the score is a local in \`main()\` updated from ask_question's return value; every function has a one-line docstring.

Hints (only if stuck): a function returning a bool can be used directly — \`if ask_question(...): score = score + 1\`. Test verdict() alone in the REPL by importing it: that's the payoff of the guard.`,
      },
    ],
    project: {
      title: 'Your toolbox module',
      brief: `Grow \`toolbox.py\` into a real personal module you will import for weeks. It must contain at least five functions, each with a docstring and a return value (no print-only functions): \`roll(sides=6)\`, \`today_stamp()\`, \`days_until_done(current_day)\`, \`clamp(value, low, high)\` (returns value pinned into the range), and one function of your own invention. Add a demo block under \`if __name__ == "__main__":\` that exercises all five. Prove it works both ways: run it directly, then write \`use_toolbox.py\` that imports it and uses two functions without triggering the demo. Log in journal.md which function was hardest and why.`,
      rubric: [
        'All five functions return values; none rely on print for their result',
        'Every function has a docstring stating what it returns',
        'clamp(5, 1, 10) -> 5, clamp(-3, 1, 10) -> 1, clamp(99, 1, 10) -> 10 all verified in the REPL',
        'Demo block runs on python toolbox.py but not on import (shown via use_toolbox.py)',
        'pathquiz.py refactor passes: same behavior, zero globals, main() + guard structure',
      ],
    },
    mistakes: [
      'Confusing printing with returning. print() shows a value to a human; return hands it to the calling code. A function that only prints cannot be tested, composed, or reused — and a forgotten return means the caller silently receives None.',
      'Assigning to a global inside a function and expecting it to change. Assignment creates a local; the global is shadowed, not updated. Pass values in as parameters and return the result instead.',
      'Using a mutable default like def add(item, bucket=[]). Defaults are evaluated ONCE at definition time, so every call shares the same list. Use bucket=None and create the list inside. (This bites harder after Day 4 — remember it.)',
      'Putting demo/test code at module top level with no main guard, so it runs on every import. Guard it with if __name__ == "__main__".',
      'Writing one 80-line function instead of several small ones. If you can\'t name what a function does in one short sentence, it\'s doing too much — split it.',
      'Naming a script after a stdlib module (random.py, math.py). Your file shadows the real module and imports break with confusing errors. Check names before saving.',
    ],
    quiz: [
      {
        q: 'def double(x): print(x * 2) — then y = double(4). What is y?',
        o: ['8', 'None — the function prints but never returns', '"8"', 'A SyntaxError'],
        x: 1,
        w: 'The function prints 8 to the screen but has no return statement, so the call evaluates to None and that is what y receives. Return, not print, hands values back.',
        revisit: 3,
      },
      {
        q: 'score = 10 at module level. Inside a function you write score = score + 1 and get UnboundLocalError. Why?',
        o: [
          'Functions can never see global variables',
          'The assignment makes score local to the function, so the read happens before the local exists',
          'Integers cannot be modified in Python',
          'You must declare types before assignment',
        ],
        x: 1,
        w: 'Assignment anywhere in a function makes that name local for the WHOLE function. The right-hand read then refers to the not-yet-assigned local. Fix: pass score in and return the new value.',
        revisit: 3,
      },
      {
        q: 'What does if __name__ == "__main__": accomplish?',
        o: [
          'It makes the file run faster',
          'It marks the function Python calls first, like main() in C',
          'Its block runs only when the file is executed directly, not when imported',
          'It prevents the module from ever being imported',
        ],
        x: 2,
        w: 'When a file runs directly, __name__ is "__main__"; when imported, it is the module name. The guard keeps demo/script code from executing as an import side effect.',
        revisit: 3,
      },
    ],
    resources: [
      { label: 'Python Tutorial — Defining Functions (4.7–4.9)', url: 'https://docs.python.org/3/tutorial/controlflow.html#defining-functions', type: 'docs', time: '25 min' },
      { label: 'Python Tutorial — Modules and the import system', url: 'https://docs.python.org/3/tutorial/modules.html', type: 'docs', time: '20 min' },
      { label: 'Automate the Boring Stuff — Ch. 3: Functions', url: 'https://automatetheboringstuff.com/2e/chapter3/', type: 'book', time: '30 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: Day 1–2 flashcards', minutes: 10 },
      { activity: 'Concept study: ELI5 + tech (return vs print, LEGB, modules)', minutes: 20 },
      { activity: 'Guided: recipe cards, scope experiments, stdlib tour', minutes: 45 },
      { activity: 'Practice: refactor the path quiz into functions', minutes: 20 },
      { activity: 'Project: the toolbox module', minutes: 15 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'All three guided scripts run; the None-from-print experiment explained in a comment',
      'pathquiz.py refactored: main() + guard, no globals, identical behavior',
      'toolbox.py has 5 documented returning functions and imports cleanly from use_toolbox.py',
      'Quiz ≥ 2/3 (reread the scope section and retake if lower)',
    ],
    connections: {
      back: 'Day 2\'s quiz project becomes today\'s refactoring material — the same behavior, restructured into named, reusable pieces. The TypeError-with-NoneType you triggered traces straight back to Day 1\'s error-reading ritual.',
      forward: 'toolbox.py grows for weeks and gets packaged properly on Day 17. Functions with clear inputs and returns are exactly what Day 18 tests, what Day 41 turns into API endpoints, and what Day 111 hands to an LLM as tools. Day 12 revisits functions as VALUES you can wrap and pass around.',
    },
    flashcards: [
      { f: 'return vs print?', b: 'return hands the value to the calling code (composable, testable); print only displays it. No return means the call yields None.' },
      { f: 'LEGB rule?', b: 'Name lookup order: Local -> Enclosing -> Global -> Built-in. First match wins.' },
      { f: 'What do *args and **kwargs collect?', b: '*args: extra positional args as a tuple. **kwargs: extra keyword args as a dict.' },
      { f: 'Why does assigning inside a function not change a global?', b: 'Assignment creates a LOCAL name that shadows the global. Pass in and return instead.' },
      { f: 'if __name__ == "__main__" does what?', b: 'Runs its block only on direct execution, not on import — keeps demo code out of importers.' },
      { f: 'Mutable default argument trap?', b: 'Defaults evaluate once at def time; a shared list persists across calls. Use None and create inside.' },
    ],
    deepDive: [
      { label: 'Keyword-only and positional-only parameters', note: 'The / and * markers in signatures restrict how arguments may be passed — you will see them all over stdlib docs. Skim the "Special parameters" section of the functions tutorial once.' },
    ],
  },
  {
    id: 'd004', day: 4, week: 1, phase: 1, kind: 'lesson',
    title: 'Collections',
    analogy: 'Bookshelves and dictionaries',
    objectives: [
      'Choose the right structure — list, tuple, set, or dict — for a given job and justify it',
      'Index and slice lists and strings without off-by-one errors',
      'Explain aliasing: predict when two names see the same mutation',
      'Build and query dicts, including safe lookup with .get and iteration over items',
      'Rewrite simple loops as list and dict comprehensions',
    ],
    prereqs: [
      { day: 2, label: 'Variables, types, and loops' },
      { day: 3, label: 'Functions and return values' },
    ],
    eli5: `A **list** is a bookshelf: books in a fixed order, each slot numbered (starting at 0, the ground floor), and you fetch a book by its position — "give me shelf slot 2." You can add books, remove them, or swap one out; the shelf itself stays put. A **tuple** is a shelf sealed behind glass: same idea, but nothing can be added or swapped after it's built — great for things that must not change. A **dict** works like a real dictionary: you don't ask for "the word on page 305," you ask for "the definition of *serendipity*" — you look things up by a meaningful **key**, not a position. And a **set** is a bag that refuses duplicates: throw in "apple" twice, it keeps one — perfect for "have I seen this before?"

One warehouse warning from Day 2's labels-on-boxes: two labels can point at the *same shelf*. If your friend rearranges the books using their label, your label sees the rearranged shelf too — because there is only one shelf. That's **aliasing**, and it's today's most valuable lesson.`,
    why: `Choosing structures is half of programming. The interview classic "why is your code slow?" is usually "you used a list where a set/dict belonged" — that exact trade-off gets a price tag on Day 22 (Big O) and powers the hashing patterns of Day 23. Everything you'll touch as an AI engineer is nested lists-and-dicts: every JSON API response (Day 41), every LLM chat request — a list of message dicts (Day 106) — every RAG chunk with its metadata (Day 114). Aliasing bugs, meanwhile, are the classic "my function mysteriously changed my caller's data" production incident. Learn to see references today and that bug loses its magic.`,
    tech: `### Lists: ordered, mutable, sliceable

\`nums = [10, 20, 30, 40]\`. Index from zero: \`nums[0]\` is 10; negatives count from the end: \`nums[-1]\` is 40. **Slicing** \`nums[1:3]\` returns a NEW list \`[20, 30]\` — start included, stop excluded, exactly like range from Day 2. \`nums[:2]\` takes from the front, \`nums[2:]\` to the end, \`nums[:]\` copies the whole thing. Mutation methods change the list in place: \`.append(x)\`, \`.insert(i, x)\`, \`.pop()\`, \`.remove(x)\`, \`.sort()\`. Note the split: \`nums.sort()\` mutates and returns None, while \`sorted(nums)\` leaves the original alone and returns a new sorted list — mixing these up is a classic bug.

### Aliasing and copies

\`b = a\` does NOT copy a list — it makes a second label for the same shelf. Mutate through either name and both see it. \`b = a.copy()\` (or \`a[:]\`) makes a **shallow** copy: a new outer shelf, but any nested lists inside are still shared. Equality vs identity: \`==\` asks "same contents?", \`is\` asks "same object?". This is Day 2's binding story completing itself: rebinding a name never affects others; *mutating a shared object* affects everyone holding it.

### Dicts and sets: lookup by meaning

\`ages = {"ada": 36, "grace": 45}\` maps keys to values. \`ages["ada"]\` fetches; a missing key raises KeyError, so use \`ages.get("bob", 0)\` when absence is normal. Assigning \`ages["bob"] = 79\` inserts or overwrites. Iterate with \`for name, age in ages.items():\`. Keys must be immutable (strings, numbers, tuples — not lists). Sets: \`seen = set()\`, \`seen.add(x)\`, and the star operation \`x in seen\` — membership checks on sets and dicts are near-instant regardless of size, while \`x in some_list\` must scan. That one sentence becomes a whole lesson on Day 22.

### Comprehensions

A comprehension builds a collection from a loop in one readable line: \`[n * n for n in nums]\`, with an optional filter: \`[n for n in nums if n % 2 == 0]\`. Dict form: \`{word: len(word) for word in words}\`. Use them when the transformation is simple; the moment logic needs multiple steps, a plain loop reads better.`,
    viz: 'cells-index',
    guided: [
      {
        title: 'The shelf lab — indexing, slicing, mutating',
        minutes: 15,
        body: `1. Create \`week-01/shelves.py\` with the starter code. Before running each section, write your predicted output as a comment — the visualizer view (cells-index) shows the numbered slots if you want to check your mental picture.
2. Section 1: verify the negative-index and slicing predictions. Then answer in a comment: why does nums[1:3] contain two items, not three?
3. Section 2: run the sort trap. Explain in a comment what mystery is and why.
4. Section 3: practice mutations — append a value, pop the last, insert at the front, remove by value. Print after each so you can watch the shelf change.
5. Finish with: build a list of the first 10 square numbers using a loop and .append(). Keep it — you'll rewrite it as a comprehension in exercise 3.`,
        code: `# --- 1: indexing and slicing
nums = [10, 20, 30, 40, 50]
print(nums[0], nums[4], nums[-1])   # predict all three
print(nums[1:3])                    # start IN, stop OUT
print(nums[:2], nums[2:])           # front slice, back slice

# --- 2: the sort trap
scores = [3, 1, 2]
mystery = scores.sort()             # sorts IN PLACE...
print(scores)                       # [1, 2, 3]
print(mystery)                      # ...and returns None!
fresh = sorted([3, 1, 2])           # non-mutating cousin
print(fresh)

# --- 3: mutations, one at a time
shelf = ["hobbit", "dune"]
shelf.append("neuromancer")
shelf.insert(0, "iliad")
last = shelf.pop()
shelf.remove("dune")
print(shelf, "| popped:", last)`,
      },
      {
        title: 'One shelf, two labels — the aliasing lab',
        minutes: 15,
        body: `1. Create \`aliasing.py\` with the starter code. This is the most important 15 minutes of the week — go slowly and predict before every print.
2. Section 1: a and b are two labels on ONE list. Confirm both names see the append. Then check \`a is b\` (True) versus the copied c: \`a == c\` (True) but \`a is c\` (False) — same contents, different shelves.
3. Section 2: the function-mutates-argument trap. The caller's list changed even though the function never returned anything. Write one sentence: why? (Hint: the parameter is another label on the same shelf.)
4. Section 3: shallow copy — the outer list was copied, the inner list is still shared. Sketch the two shelves on paper with an arrow to the shared inner list; this diagram IS the mental model.
5. Fix the function in section 2 so it does NOT mutate its input: make a copy inside, or better, build and return a new list. Professional default: functions don't surprise their callers.`,
        code: `# --- 1: two labels, one shelf
a = [1, 2, 3]
b = a               # alias, not a copy
b.append(4)
print(a)            # [1, 2, 3, 4] -- a sees it!
c = a.copy()
c.append(99)
print(a, c)         # a unchanged; c went its own way
print(a is b, a is c, a == c)

# --- 2: functions receive labels too
def add_done_flag(tasks):
    tasks.append("DONE")     # mutates the caller's list!

todo = ["write code", "test code"]
add_done_flag(todo)
print(todo)         # surprise: caller's data changed

# --- 3: shallow copy shares nested shelves
grid = [[1, 2], [3, 4]]
grid2 = grid.copy()
grid2[0].append(99)          # mutate a SHARED inner list
print(grid)          # [[1, 2, 99], [3, 4]] -- leaked through!`,
      },
      {
        title: 'Dicts, sets & comprehensions in anger',
        minutes: 15,
        body: `1. Create \`lookup.py\` with the starter code. Section 1 builds the classic word-frequency counter — the single most reused dict pattern in this program (it returns in Day 23's hashing patterns and Day 96's tokenizer lab).
2. Trace the .get(word, 0) + 1 line by hand for the first three words, writing the dict's state after each. This trace is the lesson.
3. Section 2: sets — dedupe the word list and test membership. Add a check: which words appear more than once? (Every word whose count is > 1.)
4. Section 3: comprehensions. Rewrite your squares loop from exercise 1 as a comprehension, then build a dict comprehension mapping each word to its length, then filter: words longer than 3 letters.
5. In a final comment, answer: for looking up a user's age by name, why is a dict the right shelf and a list of pairs the wrong one?`,
        code: `text = "the quick brown fox jumps over the lazy dog the fox"
words = text.split()          # str -> list of words

# --- 1: frequency counting, THE dict pattern
counts = {}
for word in words:
    counts[word] = counts.get(word, 0) + 1
print(counts)

# --- 2: sets -- dedupe and membership
unique = set(words)
print(len(words), "words,", len(unique), "unique")
print("fox" in unique, "cat" in unique)
repeated = [w for w, n in counts.items() if n > 1]
print("repeated:", repeated)

# --- 3: comprehensions
squares = [n * n for n in range(1, 11)]
lengths = {w: len(w) for w in unique}
longish = [w for w in unique if len(w) > 3]
print(squares)
print(lengths)
print(longish)`,
      },
    ],
    practice: [
      {
        title: 'The gradebook',
        minutes: 20,
        body: `Build \`gradebook.py\` from a blank file.

Goal: start from \`grades = {"ada": [92, 88, 99], "grace": [85, 91, 78], "alan": [70, 95, 88]}\`. Write three functions: \`average(scores)\` returns the mean of a list; \`report(grades)\` returns a NEW dict mapping each name to their average (dict comprehension encouraged); \`top_student(grades)\` returns the name with the highest average. Print a formatted line per student plus a winner line.

Constraints: no function may mutate the grades dict; averages computed with sum() and len(), not hand-typed; use .items() for iteration.

Hints (only if stuck): top_student can loop over report(grades).items() keeping a best-so-far name and score — the same keep-the-best shape as Day 2's guessing game logic.`,
      },
    ],
    project: {
      title: 'Study-log data model',
      brief: `Design the data structure your task tracker (Day 7) will be built on. Create \`studylog.py\` holding a list of dicts, one per completed day so far, e.g. \`{"day": 1, "title": "Your Machine, Your Map", "minutes": 120, "topics": ["setup", "repl"]}\` — fill in your real Days 1–3, estimating minutes honestly. Write functions: \`add_day(log, day, title, minutes, topics)\` (appends and returns the log), \`total_minutes(log)\`, \`find_day(log, day_number)\` (returns the dict or None), and \`all_topics(log)\` (returns a sorted list of unique topics across all days — a set does the dedupe). Demo all four under a main guard. This list-of-dicts shape is exactly how you'll hold tasks on Day 7, rows from a database on Day 36, and chat messages on Day 106.`,
      rubric: [
        'Log holds one dict per day with all four keys, for at least Days 1–3',
        'find_day returns None (not a crash) for a day not in the log',
        'all_topics returns sorted, deduplicated topics — verified with a duplicate topic present',
        'No function mutates its input except add_day, whose mutation is intentional and documented in its docstring',
        'Demo under the main guard exercises all four functions',
      ],
    },
    mistakes: [
      'Writing b = a and believing you copied the list. You copied the LABEL; both names point at one object. Use .copy(), a[:], or list(a) — and remember even those are shallow.',
      'Using x = x.sort() or x = x.append(3). Mutation methods return None, so x becomes None. Either mutate (x.sort()) or rebuild (x = sorted(x)) — never both.',
      'Reaching for grades["bob"] when the key might be absent, then crashing with KeyError. Use .get(key, default) when missing is normal; use [] when missing is a bug you WANT to hear about.',
      'Membership-testing a huge list (x in big_list) inside a loop. Lists scan every element; sets and dicts jump straight there. This becomes the O(n²)-vs-O(n) story of Day 22.',
      'Mutating a list while looping over it (removing items mid-iteration skips elements). Loop over a copy, or build a new filtered list with a comprehension.',
      'Using a list as a dict key. Keys must be immutable (hashable) — use a tuple instead. This is WHY tuples exist alongside lists.',
    ],
    quiz: [
      {
        q: 'a = [1, 2]; b = a; b.append(3). What is a?',
        o: ['[1, 2]', '[1, 2, 3]', '[3]', 'NameError'],
        x: 1,
        w: 'b = a aliases the same list object, so the append through b is visible through a. To keep a unchanged you needed b = a.copy().',
        revisit: 4,
      },
      {
        q: 'You need "have we already processed this ID?" checks on millions of IDs. Best structure?',
        o: [
          'A list, checking with "in"',
          'A set, checking with "in"',
          'A tuple, checking with a loop',
          'A string of all IDs joined together',
        ],
        x: 1,
        w: 'Sets give near-instant membership tests regardless of size; a list must scan every element each time. Day 22 gives this exact gap its name: O(1) vs O(n).',
        revisit: 4,
      },
      {
        q: 'What does nums[1:3] return for nums = [5, 6, 7, 8]?',
        o: ['[6, 7, 8]', '[5, 6, 7]', '[6, 7]', '[7, 8]'],
        x: 2,
        w: 'Slices include the start index and exclude the stop: positions 1 and 2, values 6 and 7. Same convention as range() — start in, stop out.',
        revisit: 4,
      },
    ],
    resources: [
      { label: 'Python Tutorial — Data Structures (lists, sets, dicts, comprehensions)', url: 'https://docs.python.org/3/tutorial/datastructures.html', type: 'docs', time: '30 min' },
      { label: 'Automate the Boring Stuff — Ch. 4: Lists (includes references/aliasing)', url: 'https://automatetheboringstuff.com/2e/chapter4/', type: 'book', time: '30 min' },
      { label: 'Automate the Boring Stuff — Ch. 5: Dictionaries', url: 'https://automatetheboringstuff.com/2e/chapter5/', type: 'book', time: '25 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: Days 1–3 flashcards', minutes: 10 },
      { activity: 'Concept study: ELI5 + tech, with the cells-index visualizer', minutes: 20 },
      { activity: 'Guided: shelf lab, aliasing lab, dicts & comprehensions', minutes: 45 },
      { activity: 'Practice: the gradebook', minutes: 20 },
      { activity: 'Project: study-log data model', minutes: 15 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'All three guided scripts run with written predictions checked against reality',
      'The shallow-copy diagram sketched and the mutating function fixed',
      'Gradebook functions work without mutating their input',
      'studylog.py passes all five rubric checks',
      'Quiz ≥ 2/3 (redo the aliasing lab if you missed question 1)',
    ],
    connections: {
      back: 'Day 2 taught that rebinding a label never touches the old box; today added the twist — MUTATING a shared box changes it for every label. Day 3\'s "functions shouldn\'t surprise callers" rule got teeth: passing a list passes a label.',
      forward: 'This list-of-dicts model IS Day 7\'s task tracker, Day 36\'s database rows, and Day 106\'s chat messages. The set-vs-list membership gap becomes Day 22\'s central example and Day 23\'s hashing lesson. Shallow-vs-deep copying returns when you handle nested API payloads on Day 41.',
    },
    flashcards: [
      { f: 'b = a for a list — copy or alias?', b: 'Alias: two names, one object. Mutations through either are seen by both. .copy() makes a (shallow) copy.' },
      { f: 'nums.sort() vs sorted(nums)?', b: '.sort() mutates in place and returns None; sorted() returns a new sorted list, original untouched.' },
      { f: 'Safe dict lookup when a key may be missing?', b: 'd.get(key, default) — returns default instead of raising KeyError.' },
      { f: 'When is a set the right structure?', b: 'Dedupe and fast membership tests ("seen before?") — near-instant "in" regardless of size.' },
      { f: 'Why do tuples exist?', b: 'Immutable sequences: safe to share, usable as dict keys, signal "this shouldn\'t change".' },
      { f: 'List comprehension for even squares?', b: '[n * n for n in nums if n % 2 == 0] — build + filter in one line.' },
    ],
    deepDive: [
      { label: 'Python Tutor — visualize references step by step', url: 'https://pythontutor.com/', note: 'Paste the aliasing lab in and watch the arrows: names point at objects. Ten minutes here makes shallow copy permanently obvious.' },
    ],
  },
  {
    id: 'd005', day: 5, week: 1, phase: 1, kind: 'lesson',
    title: 'Strings, Files & Errors',
    analogy: 'Paper trails and safety nets',
    objectives: [
      'Transform text with the core string methods: strip, split, join, replace, lower, startswith',
      'Read and write files safely using pathlib and the with statement',
      'Round-trip Python data through JSON and CSV files',
      'Handle failures with try/except/else/finally and raise your own exceptions',
      'Explain EAFP vs LBYL and pick the Pythonic option for a given situation',
    ],
    prereqs: [
      { day: 2, label: 'Types and control flow' },
      { day: 4, label: 'Lists and dicts' },
    ],
    eli5: `Everything your programs have made so far lives on a whiteboard: the moment the script ends, the janitor wipes it clean. Variables are whiteboard scribbles. A **file** is the paper trail — write it down on paper, put it in the filing cabinet (your disk), and it's still there tomorrow, next week, after a reboot. Today your programs learn to leave paper trails: reading files in, writing results out, and using two standard "paper formats" — CSV (a spreadsheet as plain text) and JSON (lists-and-dicts as plain text, the lingua franca of the internet).

The second half is the safety net. A trapeze artist doesn't pretend falls never happen; they hang a net so a fall is an event, not a catastrophe. In Python, things WILL go wrong at runtime — a file is missing, a line isn't a number — and each fall is an **exception**. \`try\` is the trapeze act, \`except\` is the net: catch the specific fall you expect, deal with it, and keep the show going. The alternative — checking every possible problem before every move — is exhausting and full of gaps. Often it's easier to ask forgiveness than permission.`,
    why: `Files and errors are where programs meet the messy world, and AI engineering is unusually messy: Day 113's RAG pipeline is "read a pile of files, clean the text, handle the broken ones"; every LLM API call returns JSON and can fail mid-flight (Day 107's whole lesson is retrying those failures gracefully). FDEs feel it hardest — customer data is never clean, and the difference between a demo that dies on row 3 and one that reports "skipped 3 malformed rows" is the difference between losing and keeping the room. Exception discipline — catch specifically, fail loudly, never bare-except — is a hiring signal all by itself.`,
    tech: `### Strings are immutable toolkits

Strings can't be changed in place — every method returns a NEW string, so chain them: \`line.strip().lower()\`. The daily six: \`.strip()\` (trim whitespace/newlines — do this to every line you read from a file), \`.split(",")\` (string to list), \`", ".join(items)\` (list to string — note it's a method on the *separator*), \`.replace(old, new)\`, \`.lower()\`/\`.upper()\`, \`.startswith(x)\`/\`.endswith(x)\`. Text on disk is bytes; an **encoding** (use UTF-8, always) maps bytes to characters. Pass \`encoding="utf-8"\` when opening text files and you can ignore the topic until it matters.

### Files, pathlib, and the with statement

\`from pathlib import Path\` gives you objects for locations: \`Path("data") / "notes.txt"\` builds paths portably, \`.exists()\`, \`.mkdir()\`, \`.glob("*.txt")\` do the classic filesystem chores. Open files with a context manager: \`with open(path, encoding="utf-8") as f:\` guarantees the file closes even if an exception fires inside the block. Modes: \`"r"\` read (default), \`"w"\` write (TRUNCATES existing content — the most destructive letter in Python), \`"a"\` append. Iterate a file directly — \`for line in f:\` — rather than reading everything when files are big (a habit Day 11 turns into a superpower).

### Structured formats

\`import json\`: \`json.dump(data, f, indent=2)\` writes lists/dicts to a file; \`json.load(f)\` reads them back into Python objects. That pair is your persistence layer until databases arrive on Day 36. \`import csv\`: \`csv.DictReader(f)\` yields one dict per row with the header as keys — resist the temptation to .split(",") yourself; quoted commas will betray you.

### Exceptions

When something impossible happens, Python raises an exception that unwinds the call stack until something catches it (or the program dies with the traceback you've been reading since Day 1). Catch narrowly: \`except FileNotFoundError:\` — not bare \`except:\`, which swallows even typos (NameError) and the Ctrl+C interrupt. Full shape: \`try\` / \`except ValueError as e\` / \`else\` (runs if nothing raised) / \`finally\` (runs no matter what). Raise your own with \`raise ValueError("day must be 1..180")\` when callers pass garbage. **EAFP** (Easier to Ask Forgiveness than Permission — just try it, catch the failure) is idiomatic Python; **LBYL** (Look Before You Leap — check first) suits cases where failure is expensive or race-prone. Trying to convert user input? EAFP. Deleting a directory? Look first.`,
    viz: null,
    guided: [
      {
        title: 'The string toolbox — clean a messy roster',
        minutes: 15,
        body: `1. Create \`week-01/strings_lab.py\` with the starter code — a messy roster of "name, score" lines with stray spaces and inconsistent case, as if pasted from a spreadsheet.
2. Run the cleaning pipeline and inspect each intermediate print. For the first line, write the value after each method in a comment: raw -> stripped -> split -> each piece stripped.
3. The chain line.strip().split(",") works because each method RETURNS a new string. Prove immutability in the REPL: s = "hi"; s.upper(); print(s) — s is unchanged until you rebind.
4. Add a check that skips lines that don't contain a comma (use "," in line) and count how many were skipped.
5. Finish by rebuilding output with join: one line "ada, grace, alan" from the cleaned names. Remember join hangs off the SEPARATOR string.`,
        code: `raw_lines = [
    "  Ada Lovelace , 92 ",
    "GRACE hopper,85",
    "this line is junk",
    " Alan Turing ,  88",
]

names = []
scores = []
skipped = 0
for line in raw_lines:
    if "," not in line:
        skipped = skipped + 1
        continue
    name_part, score_part = line.split(",")
    name = name_part.strip().title()     # "ada lovelace" -> "Ada Lovelace"
    score = int(score_part.strip())
    names.append(name)
    scores.append(score)
    print(name, "->", score)

print("skipped", skipped, "junk lines")
print("roster:", ", ".join(names))
print("average:", sum(scores) / len(scores))`,
      },
      {
        title: 'Paper trails — write, read, append with pathlib',
        minutes: 15,
        body: `1. Create \`files_lab.py\` with the starter code and run it TWICE. Before the second run, predict: how many lines will log.txt hold? (The append mode is the key.)
2. Open log.txt in VS Code and confirm. Now change "a" to "w", run twice more, and see the difference — "w" truncates on every open. Write the rule in a comment: w wipes, a appends.
3. The with block is the safety guarantee: the file closes even if the code inside crashes. Prove the loop-over-file pattern: read the file back line by line, stripping each line (every line arrives with its newline attached).
4. Use Path.glob to list every .py file in your week-01 folder — your first taste of filesystem automation.
5. In a comment: why is for line in f better than f.read() for a 10 GB file? (Day 11 makes this rigorous.)`,
        code: `from pathlib import Path
import datetime

folder = Path("data")
folder.mkdir(exist_ok=True)          # create if missing, no error if present
log_path = folder / "log.txt"        # paths join with /

stamp = datetime.datetime.now().isoformat(timespec="seconds")
with open(log_path, "a", encoding="utf-8") as f:   # "a" = append
    f.write("ran at " + stamp + "\\n")

print("--- contents of", log_path, "---")
with open(log_path, encoding="utf-8") as f:
    for line in f:                   # one line at a time, memory-friendly
        print(line.strip())          # strip the trailing newline

print("--- python files here ---")
for p in Path(".").glob("*.py"):
    print(p.name)`,
      },
      {
        title: 'JSON round-trip with a safety net',
        minutes: 15,
        body: `1. Create \`json_lab.py\` with the starter code. It saves your Day 4 study-log shape to disk and loads it back — your first real persistence.
2. Run it, then open studylog.json and admire the format: it IS your list of dicts, as text. Change a value in the FILE by hand, rerun, and watch Python see your edit — the paper trail is real.
3. Now the safety nets. Delete studylog.json and rerun: the FileNotFoundError branch supplies a fresh empty log instead of crashing. This try/except-returns-default shape is the standard "first run" pattern.
4. Break the JSON on purpose (delete a comma in the file) and rerun: the JSONDecodeError branch catches it. Note how each except names ONE specific failure with its own response.
5. Add validation with raise: in add_entry, raise ValueError if minutes is negative. Trigger it once, read your own traceback, then wrap that call in try/except to handle it. You have now been on both ends of an exception.`,
        code: `import json
from pathlib import Path

LOG_PATH = Path("studylog.json")

def load_log():
    """Return the saved log, or a fresh one if missing/corrupt (EAFP)."""
    try:
        with open(LOG_PATH, encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        print("no log yet -- starting fresh")
        return []
    except json.JSONDecodeError as e:
        print("log file is corrupt:", e)
        return []

def save_log(log):
    with open(LOG_PATH, "w", encoding="utf-8") as f:
        json.dump(log, f, indent=2)

def add_entry(log, day, title, minutes):
    if minutes < 0:
        raise ValueError("minutes cannot be negative")
    log.append({"day": day, "title": title, "minutes": minutes})

log = load_log()
add_entry(log, 5, "Strings, Files & Errors", 120)
save_log(log)
print("log now has", len(log), "entries")`,
      },
    ],
    practice: [
      {
        title: 'The resilient summer',
        minutes: 20,
        body: `Build \`sumfile.py\` from scratch.

Goal: first, write a small setup block (or separate script) that creates \`numbers.txt\` containing one value per line — mostly numbers, but include junk: an empty line, the word "twelve", a number with spaces around it. Then write \`sum_file(path)\` that reads the file and returns a tuple \`(total, good_count, bad_count)\`, skipping unparseable lines without crashing. Print a report: total, lines counted, lines skipped.

Constraints: use EAFP — try float(line) and catch ValueError; no checking line contents with if-tests first. Handle a missing file with its own except that prints a helpful message and exits cleanly. Use with open everywhere.

Hints (only if stuck): strip each line before converting; an empty string raises ValueError too, which is exactly what you want. Tuples return multiple values: return total, good, bad.`,
      },
    ],
    project: {
      title: 'The journal goes digital',
      brief: `Upgrade your paper-trail habits: build \`journal_tool.py\`, a small program that manages journal entries in \`journal.json\`. Running it appends one entry: it asks for today's summary line with input(), stamps it with the date (toolbox.py's today_stamp — import your own module!), and saves. Before appending it must load existing entries, surviving both a missing file and a corrupt file (each with its own except and message). After saving, it prints all entries oldest-first, formatted "2026-08-11 — summary text". Use it for real: add today's entry. From now on, this is your journal. On Day 7 you will reuse this exact load/save pattern for the task tracker.`,
      rubric: [
        'First run creates journal.json; second run appends rather than overwrites — verified by running twice',
        'Missing file and corrupt file each handled by a specific except (no bare except anywhere)',
        'Entries persist with date stamps and print formatted, oldest first',
        'Imports and uses your own toolbox module for the date stamp',
        'sumfile.py practice passes: correct totals with junk lines skipped and counted',
      ],
    },
    mistakes: [
      'Opening with "w" when you meant "a". Write mode truncates the file the instant it opens — the classic way to delete your own data. Append for logs and journals; write only for full rewrites.',
      'Forgetting that every line read from a file ends with a newline character. Compare or convert without .strip() and "42\\n" ruins your day. Strip first, always.',
      'Using a bare except: — it silently swallows typos (NameError), Ctrl+C, everything. Catch the specific exception you expect; let the rest crash loudly so you can fix them.',
      'Catching an exception just to pass. Silent failure is worse than a crash: the program lies about being fine. At minimum, print or log what happened and count it.',
      'Building CSV by hand with .split(",") / string concatenation. Quoted fields with embedded commas break both directions. Use the csv module — DictReader/DictWriter.',
      'Expecting json.load to preserve tuples or datetime objects. JSON only knows objects, arrays, strings, numbers, booleans, null — tuples come back as lists, dates must be stored as strings.',
    ],
    quiz: [
      {
        q: 'Why is "with open(path) as f:" preferred over f = open(path)?',
        o: [
          'It reads the file faster',
          'It guarantees the file is closed even if an exception occurs in the block',
          'It automatically strips newlines',
          'It creates the file if missing',
        ],
        x: 1,
        w: 'with is a context manager: on leaving the block — normally or via an exception — the file is closed. Unclosed files leak resources and can lose buffered writes.',
        revisit: 5,
      },
      {
        q: 'Which is the EAFP way to parse user input as an int?',
        o: [
          'Check text.isdigit() first, then convert',
          'try: n = int(text) / except ValueError: handle it',
          'Convert only if len(text) > 0',
          'Use a regex to validate before converting',
        ],
        x: 1,
        w: 'EAFP = just attempt the operation and catch the specific failure. It is idiomatic Python and handles cases pre-checks miss (like "-3", which isdigit() rejects despite being a valid int).',
        revisit: 5,
      },
      {
        q: 'You json.dump a dict, then json.load it back. What do you get?',
        o: [
          'A string you must parse yourself',
          'An equivalent dict (with JSON-representable values)',
          'The identical object, same id()',
          'A list of key-value tuples',
        ],
        x: 1,
        w: 'json.load rebuilds Python objects from the text: dicts, lists, strings, numbers, bools, None. It is an equivalent NEW object, not the original — and JSON-unaware types (tuples, dates) need conversion.',
        revisit: 5,
      },
    ],
    resources: [
      { label: 'Python Tutorial — Input and Output (formatting, reading/writing files)', url: 'https://docs.python.org/3/tutorial/inputoutput.html', type: 'docs', time: '25 min' },
      { label: 'Python Tutorial — Errors and Exceptions', url: 'https://docs.python.org/3/tutorial/errors.html', type: 'docs', time: '25 min' },
      { label: 'Automate the Boring Stuff — Ch. 9: Reading and Writing Files', url: 'https://automatetheboringstuff.com/2e/chapter9/', type: 'book', time: '30 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: Days 1–4 flashcards', minutes: 10 },
      { activity: 'Concept study: ELI5 + tech (files, JSON, exceptions, EAFP)', minutes: 20 },
      { activity: 'Guided: string toolbox, paper trails, JSON round-trip', minutes: 45 },
      { activity: 'Practice: the resilient summer', minutes: 20 },
      { activity: 'Project: the journal goes digital', minutes: 15 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'All three guided scripts run; the w-vs-a experiment and both broken-file recoveries demonstrated',
      'sumfile.py returns correct (total, good, bad) on a file with junk lines',
      'journal_tool.py used for a real entry; runs twice without data loss',
      'Quiz ≥ 2/3 (reread the exceptions section if you missed 1 or 2)',
    ],
    connections: {
      back: 'The list-of-dicts you designed on Day 4 just became a FILE — json.dump/load is the bridge. The line-cleaning pipeline is Day 2\'s string knowledge industrialized, and every safety net catches the same exceptions you have been reading since Day 1.',
      forward: 'Day 7\'s task tracker is today\'s journal pattern with more commands. Day 11 turns for-line-in-f into full lazy pipelines; Day 13 adds regex to the text toolbox; Day 16 replaces print-debugging with real logging. And every API you call from Day 41 onward speaks the JSON you round-tripped today.',
    },
    flashcards: [
      { f: 'File mode "w" vs "a"?', b: '"w" truncates (wipes) the file on open; "a" appends to the end. Logs and journals use "a".' },
      { f: 'Why strip() lines read from a file?', b: 'Every line arrives with its trailing newline; comparisons and conversions fail until you strip it.' },
      { f: 'EAFP vs LBYL?', b: 'EAFP: try it, catch the specific exception (Pythonic default). LBYL: check preconditions first — for expensive or race-prone failures.' },
      { f: 'Why never bare except:?', b: 'It swallows every error including typos and Ctrl+C. Catch the specific exception; let surprises crash loudly.' },
      { f: 'JSON <-> Python bridge functions?', b: 'json.dump(obj, f) / json.load(f) for files; dumps/loads for strings. Dicts, lists, str, numbers, bool, None only.' },
      { f: '", ".join(names) — method on what?', b: 'On the SEPARATOR string. Joins a list of strings into one string.' },
    ],
    deepDive: [
      { label: 'What is an encoding, really?', note: 'UTF-8 maps every character to 1–4 bytes and dominates the web. Skim the Unicode HOWTO in the Python docs once; you mostly just pass encoding="utf-8" and move on. Tokenizers (Day 96) revisit bytes-vs-characters with money on the line.' },
    ],
  },
  {
    id: 'd006', day: 6, week: 1, phase: 1, kind: 'lesson',
    title: 'The Terminal & Linux',
    analogy: 'The workshop',
    objectives: [
      'Navigate the filesystem tree with pwd/ls/cd and manipulate it with mkdir/cp/mv/rm',
      'Inspect files with cat, less, head, and tail without opening an editor',
      'Chain tools with pipes and redirect output with > and >>',
      'Search content with grep and find files by name with find',
      'Read and change permissions, use environment variables and PATH, and write a runnable shell script',
    ],
    prereqs: [
      { day: 1, label: 'Opening a terminal, running scripts' },
      { day: 5, label: 'Files and paths' },
    ],
    eli5: `Your computer's desktop — windows, icons, double-clicks — is the showroom: polished, safe, and slow. The **terminal** is the workshop out back, where the real tools hang on the wall. Each tool does exactly one job and does it fast: \`ls\` lists what's on the bench, \`grep\` is a magnet that pulls matching lines out of any pile, \`head\` snips the first few lines off. In the showroom you'd click through folders for a minute; in the workshop you type one line and you're done.

The workshop's superpower is the **conveyor belt**: the pipe symbol \`|\` feeds one tool's output straight into the next. "Take this log, keep only the ERROR lines, count them" is \`cat log | grep ERROR | wc -l\` — three small tools snapped together into a machine nobody had to build in advance. That composability is why, fifty years on, this is still how professionals drive computers. Every cloud server you will ever touch (Day 151) has no showroom at all — only the workshop. Today you earn your keys to it.`,
    why: `AI engineers live in terminals: every deploy, every docker command (Day 148), every git operation (Day 8), every SSH session into a customer's VPC (Day 170) is terminal work. Production servers have no GUI — when an FDE debugs a live incident, it's tail on a log file and grep for the error ID, under time pressure, on a machine they've never seen. Interviewers notice terminal fluency in the first five minutes of a pairing session; it reads as "has actually operated software," which is precisely the signal FDE hiring screens for. The pipes-and-filters idea also returns as Day 11's generator pipelines — same design, inside Python.`,
    tech: `### The tree and how to move through it

The filesystem is one tree rooted at \`/\`. Your home directory is \`~\`. Every terminal session sits somewhere in the tree — \`pwd\` prints where. Paths are **absolute** (start with \`/\`) or **relative** (from here): \`.\` is here, \`..\` is the parent. Move with \`cd\`, look around with \`ls\` (\`-l\` long details, \`-a\` include hidden dotfiles). Create and destroy: \`mkdir -p a/b\` (parents too), \`cp file dest\` (\`-r\` for folders), \`mv\` (moves AND renames — same command), \`rm\` (\`-i\` asks first; there is NO trash can here — rm is forever). Tab completes names; the up arrow replays history; Ctrl+C kills the running command; Ctrl+R searches history.

### Inspecting and composing

\`cat file\` dumps a file; \`less file\` pages through it (q to quit, / to search); \`head -n 20\` and \`tail -n 20\` show the ends — \`tail -f\` follows a growing log live, the production-debugging classic. Every command has three streams: stdin, stdout, stderr. **Redirection** sends stdout to a file: \`>\` overwrites, \`>>\` appends (the same wipe-vs-append trap as Day 5's "w" and "a"). The **pipe** \`|\` connects stdout of one command to stdin of the next. \`grep -i error app.log\` prints matching lines (\`-i\` ignore case, \`-c\` count, \`-v\` invert, \`-n\` line numbers, \`-r\` recurse a folder). \`find . -name "*.py"\` walks the tree matching names. \`sort\`, \`uniq -c\`, and \`wc -l\` finish the classic pipelines: \`grep ERROR app.log | sort | uniq -c\` is a report, not a program.

### Permissions, environment, and scripts

\`ls -l\` shows permissions like \`rwxr-xr--\`: read/write/execute for owner, group, others. \`chmod +x script.sh\` makes a file executable. **Environment variables** are named settings every program inherits: \`echo $HOME\`, set one with \`export API_KEY=abc123\` (lasts for this session — this is exactly how you'll provide secrets to programs on Day 16 and beyond, instead of hardcoding them). \`PATH\` is the list of directories the shell searches for commands — the reason typing \`python\` works at all, and the thing that's wrong when "command not found" lies to you. A **shell script** is commands in a file: start it with the shebang line \`#!/bin/bash\`, \`chmod +x\` it, run it as \`./backup.sh\`. \`man cmd\` (or \`cmd --help\`) is the built-in manual — professionals read it constantly.`,
    viz: null,
    guided: [
      {
        title: 'Navigation drill — moving without the mouse',
        minutes: 15,
        body: `1. Open a terminal (Windows users: use WSL or Git Bash for today — the commands below are the Unix set used on every server). Run pwd, then ls, then ls -la. Identify one hidden file (starts with a dot).
2. cd to your ai-engineer-journey folder using tab-completion the whole way — type the first 2–3 letters of each folder and hit Tab. From now on, typing a full folder name by hand is a foul.
3. Build a sandbox to destroy: mkdir -p sandbox/inner, then cd sandbox. Create files fast with: echo "hello from the workshop" > a.txt and cp a.txt b.txt. Rename with mv b.txt notes.txt. Check each step with ls.
4. Practice relative paths: from inside inner/, run ls .. then cat ../a.txt then cd ../.. and pwd. Say each path out loud as a sentence ("the parent's a.txt").
5. Destroy the sandbox: cd out of it, then rm -ri sandbox — answer the prompts. Note the feeling: rm has no undo, so -i (interactive) is your seatbelt while learning.`,
        code: `pwd
ls -la
cd ai-engineer-journey        # tab-complete it!
mkdir -p sandbox/inner
cd sandbox
echo "hello from the workshop" > a.txt
cp a.txt b.txt
mv b.txt notes.txt
ls
cd inner
cat ../a.txt
cd ../..
rm -ri sandbox`,
      },
      {
        title: 'Pipes and grep — build report machines',
        minutes: 20,
        body: `1. First, manufacture a realistic log to practice on. Save the Python snippet below as make_log.py in week-01 and run it — it writes app.log with 200 timestamped lines (INFO/WARN/ERROR from a handful of fake IPs).
2. Inspect without an editor: head -n 5 app.log, tail -n 5 app.log, less app.log (search inside less by typing /ERROR, n for next match, q to quit).
3. Build up a pipeline one stage at a time, running after each: grep ERROR app.log — then add | wc -l to count. Then the report classic: grep ERROR app.log | sort | uniq -c | sort -rn | head -n 3 (top repeated error lines). Read it left to right as a conveyor belt.
4. Save a report: grep -c ERROR app.log > report.txt, then APPEND the warning count with >>. cat report.txt to verify both lines landed.
5. Two more reps: grep -v INFO app.log | head (everything except INFO), and find ~ -name "*.json" 2>/dev/null | head (where did your JSON files land this week? — the 2>/dev/null discards permission-denied noise from stderr).`,
        code: `# make_log.py -- run once: python make_log.py
import random

levels = ["INFO"] * 7 + ["WARN"] * 2 + ["ERROR"]
msgs = {
    "INFO": ["request ok", "user login", "cache hit"],
    "WARN": ["slow response", "retrying request"],
    "ERROR": ["db timeout", "null reference", "disk full"],
}
ips = ["10.0.0.5", "10.0.0.9", "172.16.3.2", "192.168.1.7"]

with open("app.log", "w", encoding="utf-8") as f:
    for i in range(200):
        level = random.choice(levels)
        line = "2026-08-{:02d} 10:{:02d}:{:02d} {} {} {}".format(
            random.randint(1, 28), i // 60, i % 60,
            level, random.choice(ips), random.choice(msgs[level]))
        f.write(line + "\\n")
print("wrote app.log")`,
      },
      {
        title: 'Permissions, PATH & your first shell script',
        minutes: 15,
        body: `1. Run ls -l app.log and decode the permission string in a comment-line of your journal: who can read it? Write to it? Execute it?
2. Explore your environment: echo $HOME, echo $PATH (note the colon-separated directories), and which python — that answer is PATH doing its job: the shell searched those directories in order.
3. Set a variable and prove inheritance: export GREETING="hello from the environment", then run python -c "import os; print(os.environ['GREETING'])". This export-then-read pattern is exactly how API keys reach your code from Day 16 onward.
4. Create greet.sh with the code below (nano greet.sh or use VS Code). Try ./greet.sh — permission denied. Fix it: chmod +x greet.sh, run again. That two-step (write script, make executable) is a ritual you'll repeat for years.
5. Read one man page for real: man grep, find the -c flag inside it (type /-c then Enter), then quit with q.`,
        code: `#!/bin/bash
# greet.sh -- my first shell script
echo "Workshop online for: $USER"
echo "Today is: $(date +%F)"
echo "Python here is: $(which python || which python3)"
echo "Journey files:"
ls *.py | head -n 5`,
      },
    ],
    practice: [
      {
        title: 'The scavenger hunt',
        minutes: 15,
        body: `Answer every question below using ONLY the terminal — no editor, no file manager. Record each command and answer in scavenger.txt (build it up with >> redirection).

1. How many .py files exist anywhere under your ai-engineer-journey folder?
2. Which of your Python files contain the word "json" (case-insensitive), and on which line numbers?
3. What are the 3 most frequent IP addresses in app.log? (Hint: ERROR lines or all lines — your choice, but the pipeline is grep/awk-free: you can cut with spaces or just sort | uniq -c the full lines from a grep for one IP at a time... or discover the cut command with man cut for style points.)
4. How many TOTAL lines of Python have you written this week? (find + cat + wc, or discover xargs.)
5. What is the newest file in your week-01 folder? (man ls — look for a sort-by-time flag.)

Constraints: every answer line in scavenger.txt must be appended with >>, never >. If you wipe the file, that's the Day 5 lesson billing you twice.`,
      },
    ],
    project: {
      title: 'The backup ritual',
      brief: `Write \`backup.sh\`, a shell script that snapshots your journey folder. It must: (1) build a timestamped folder name like backups/journey-2026-08-11 using $(date +%F); (2) create the backups directory with mkdir -p; (3) copy week-01 into it with cp -r; (4) append one line to backups/backup.log recording the date and how many files were copied (find + wc -l); (5) print a friendly done message. Make it executable, run it, verify with ls and cat. Run it again tomorrow morning — rituals only count if repeated. Keep backups/ OUT of the folder being copied (put it as a sibling), or your backups will recursively swallow themselves — reason it out before you run.`,
      rubric: [
        'Script starts with a shebang and runs via ./backup.sh after chmod +x',
        'Backup folder is dated via command substitution, not typed by hand',
        'backup.log grows by exactly one appended line per run (>> not >)',
        'Running it twice creates two snapshots and never overwrites or nests backups inside backups',
        'scavenger.txt contains all five hunt answers with the commands used',
      ],
    },
    mistakes: [
      'Running rm without thinking. There is no trash can — rm is permanent. Use rm -i while learning, and treat rm -rf as a loaded tool: read the path twice, especially with wildcards.',
      'Using > when you meant >>. Same trap as Day 5\'s "w" vs "a": one character silently wipes the file. Appending logs and reports is almost always what you want.',
      'Putting spaces around = in shell assignments: NAME = "x" fails; it must be NAME="x". The shell parses spaces as argument separators, not decoration.',
      'Believing "command not found" means the tool is missing. Often it exists but is not on PATH, or your PATH differs between terminals. which and echo $PATH diagnose it — the Day 1 two-Pythons problem was this in disguise.',
      'Ignoring stderr. 2>/dev/null hides errors from a pipeline — great for find\'s permission noise, terrible as a habit. Know which stream your output is on before you silence one.',
      'Editing PATH or shell config by copy-pasting internet advice without reading it. One bad line in your shell profile breaks every future terminal. Change one thing, open a new terminal, verify.',
    ],
    quiz: [
      {
        q: 'What does the pipeline "grep ERROR app.log | wc -l" print?',
        o: [
          'Every ERROR line in the file',
          'The number of lines containing ERROR',
          'The number of words in the file',
          'The first ERROR line only',
        ],
        x: 1,
        w: 'grep emits only the matching lines; the pipe feeds them to wc -l, which counts lines. Small tools composed with | — that is the whole terminal philosophy.',
        revisit: 6,
      },
      {
        q: 'You create script.sh and type ./script.sh — "Permission denied". The fix?',
        o: [
          'Rename it to script.py',
          'Run chmod +x script.sh to add the execute permission',
          'Move it to the home directory',
          'Reinstall bash',
        ],
        x: 1,
        w: 'Files are not executable by default. chmod +x sets the execute bit; the shebang line then tells the kernel which interpreter runs it.',
        revisit: 6,
      },
      {
        q: 'What is PATH?',
        o: [
          'The current directory the terminal is in',
          'A list of directories the shell searches, in order, to find commands you type',
          'The location of the Python standard library',
          'A file that logs every command you run',
        ],
        x: 1,
        w: 'When you type python, the shell walks the colon-separated directories in PATH and runs the first match. That is why which python and echo $PATH are the first diagnostics for "wrong version" mysteries.',
        revisit: 6,
      },
    ],
    resources: [
      { label: 'MIT Missing Semester — Course overview + the shell', url: 'https://missing.csail.mit.edu/2020/course-shell/', type: 'course', time: '50 min' },
      { label: 'MIT Missing Semester — Shell tools and scripting', url: 'https://missing.csail.mit.edu/2020/shell-tools/', type: 'course', time: '45 min' },
      { label: 'MIT Missing Semester — full course index (bookmark it)', url: 'https://missing.csail.mit.edu/', type: 'course', time: '5 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: Days 1–5 flashcards', minutes: 10 },
      { activity: 'Concept study: ELI5 + tech (tree, pipes, permissions, PATH)', minutes: 20 },
      { activity: 'Guided: navigation drill, pipeline lab, first shell script', minutes: 50 },
      { activity: 'Practice: the scavenger hunt', minutes: 15 },
      { activity: 'Project: the backup ritual', minutes: 15 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'Navigation drill done with tab-completion throughout; sandbox created and removed',
      'Top-3-errors pipeline built stage by stage and explained aloud',
      'greet.sh and backup.sh both executable and run successfully',
      'All five scavenger answers recorded via >> in scavenger.txt',
      'Quiz ≥ 2/3 (rerun the pipeline lab if you missed question 1)',
    ],
    connections: {
      back: 'The > vs >> trap is Day 5\'s "w" vs "a" wearing overalls, and echo $GREETING reaching Python closes the loop on Day 1\'s "shell and REPL are different worlds" — now you pass data between them deliberately.',
      forward: 'Day 8\'s git lives entirely in this terminal. Day 16 reads config from the environment variables you exported today; Day 39 explains what processes and file descriptors really are; Day 148\'s Docker containers are driven by these exact commands; and tail -f on a production log is how Day 172\'s customer debugging sessions actually look.',
    },
    flashcards: [
      { f: 'What does | (pipe) do?', b: 'Connects one command\'s stdout to the next command\'s stdin — small tools composed into pipelines.' },
      { f: '> vs >> ?', b: '> redirects and OVERWRITES the file; >> appends. Same trap as Python\'s "w" vs "a".' },
      { f: 'Count lines matching ERROR in app.log?', b: 'grep -c ERROR app.log (or grep ERROR app.log | wc -l).' },
      { f: 'Make a script runnable?', b: 'Add shebang #!/bin/bash, then chmod +x script.sh, run with ./script.sh.' },
      { f: 'What is PATH?', b: 'Ordered list of directories the shell searches for commands. Diagnose with echo $PATH and which cmd.' },
      { f: '. and .. in paths?', b: '. = current directory, .. = parent. Relative paths start from where pwd says you are.' },
    ],
    deepDive: [
      { label: 'tail -f and following live logs', note: 'Start python make_log.py in one terminal modified to write slowly in a loop, and tail -f app.log in another. Watching a log grow in real time is the primal production-debugging experience — Day 142 gives it structure with tracing.' },
    ],
  },
  {
    id: 'd007', day: 7, week: 1, phase: 1, kind: 'review',
    title: 'Week 1 Checkpoint: CLI Task Tracker',
    analogy: 'First checkpoint',
    objectives: [
      'Recall Week 1 material from memory: types, loops, functions, collections, files, exceptions, terminal',
      'Diagnose your weak spots with the cumulative quiz and schedule their revisits',
      'Build a complete CLI task tracker with JSON persistence from a spec',
      'Practice blank-page recall: write core patterns without looking, then diff against notes',
    ],
    prereqs: [
      { day: 2, label: 'Control flow' },
      { day: 3, label: 'Functions' },
      { day: 4, label: 'Collections' },
      { day: 5, label: 'Files, JSON, exceptions' },
    ],
    eli5: `On a real expedition, every few days you reach a checkpoint: you stop walking, unpack the whole bag, check every item, and repack it properly. Not glamorous — but the hikers who skip it are the ones who discover at the river crossing that their rope frayed three days ago. Today is that stop. No new terrain; instead you unpack everything from Week 1 and *handle each piece again*.

Why does this work? Memory is a path through a field: walk it once and the grass springs back by morning. The forgetting curve is steep — most of what you met on Monday is fading right now. But each time you *recall* something (not reread it — pull it out of your own head), the path gets more trodden, and the next forgetting takes weeks instead of days. That's why today starts with flashcards and a blank-page drill before any notes are opened. Then comes the checkpoint's real test: a project — the CLI task tracker — that quietly requires every single thing from this week at once. If you can build it, Week 1 is genuinely in the bag.`,
    why: `Retrieval practice is the highest-effect-size study technique known, and review days are where this program cashes it in — skipping them is how people reach Day 90 with Day-4 gaps. The tracker itself is a rite of passage: "CRUD app with persistence" is the atom of software; every service you build later (Day 42's API, Day 119's capstone) is this pattern scaled up. And practicing building-from-a-spec matters professionally: FDEs receive requirement lists, not tutorials, and the gap between "followed a walkthrough" and "shipped from a spec" is exactly what hiring managers probe.`,
    tech: `### How to run a review day

Order matters: **recall first, notes second**. Start with the due flashcard deck (every Week 1 card). For each card, answer OUT LOUD before flipping — the strain of retrieval is the mechanism, so a card that feels hard is a card that's working. Sort misses into a pile and re-drill them at the end. Next, the blank-page protocol: with everything closed, write the week's core patterns from memory (the guided drill lists them). Only THEN open your notes and diff: every discrepancy is gold — it's a precise map of what your brain dropped, unavailable any other way. Finally the cumulative quiz; each miss names the day to restudy.

### The tracker spec

Build \`tracker.py\` in a new \`week-01/tracker/\` folder. It manages tasks in \`tasks.json\` and runs in a loop, prompting for commands:

~~~text
add <text>   -> add a task (auto-assigned id, done=False)
list         -> show tasks: id, [x] or [ ], text
done <id>    -> mark that task complete
delete <id>  -> remove it
quit         -> save and exit
~~~

Each task is a dict: \`{"id": 3, "text": "buy rope", "done": false}\`. The whole list round-trips through JSON on every change (save early, save often — a crash mid-session should lose almost nothing). Structure it as functions: \`load_tasks()\` / \`save_tasks(tasks)\` (Day 5's safety-net pattern, verbatim), \`add_task(tasks, text)\`, \`complete_task(tasks, task_id)\`, \`delete_task(tasks, task_id)\`, \`render(tasks)\`, and a \`main()\` loop under a guard (Day 3). Parse commands with \`.split(" ", 1)\` — the command word, then everything after as the payload (Day 5's string toolbox). Handle every foreseeable failure without crashing: unknown commands, non-numeric ids, ids that don't exist, missing/corrupt JSON (Day 5), and ids arriving as strings from input() (Day 2's oldest trap). The next id is one more than the current maximum — careful when the list is empty.`,
    viz: null,
    guided: [
      {
        title: 'Deck drill — the whole week, out loud',
        minutes: 15,
        body: `1. Run through every flashcard from Days 1–6 (about 30 cards). Answer each aloud BEFORE flipping. No skipping cards that "feel known" — feeling known and being retrievable are different things, and the flip is the referee.
2. Make two piles: instant-and-right vs hesitated-or-wrong. Be honest; hesitation counts as a miss.
3. Re-drill the miss pile twice, shuffled.
4. For the three cards you missed hardest, write each answer out by hand once — writing recruits another memory channel.
5. Note your miss count in journal.md; Day 14 will ask you to beat it.`,
      },
      {
        title: 'Blank-page protocol — write the patterns from memory',
        minutes: 20,
        body: `1. Close every file, note, and browser tab. Open one empty recall.py. From memory ONLY, write: (a) a function that safely converts a string to int, returning None on failure (try/except); (b) the load-or-default JSON pattern (open, load, FileNotFoundError -> []); (c) a word-frequency counter with .get; (d) a loop printing index and value of a list without range(len(...)) — if you never met enumerate, invent your notation and look it up after; (e) the main-guard skeleton.
2. Run it. Fix only what the interpreter forces you to fix — errors here are the drill working, not failing.
3. Now open your week's files and diff honestly. Mark every gap with a comment: # FORGOT: strip before int, etc.
4. The FORGOT lines are your personal Week 1 syllabus. Copy them into journal.md.
5. Total time cap: 20 minutes. Perfection is not the goal; the retrieval attempt is.`,
      },
    ],
    practice: [
      {
        title: 'Terminal reps under the clock',
        minutes: 10,
        body: `Ten minutes, terminal only, from memory: (1) create a folder drills/ with a subfolder day7/ in one command; (2) write "checkpoint" into a file in it using echo and redirection; (3) append a second line; (4) count the lines matching "check" in that file; (5) list every .json file under your journey folder; (6) make backup.sh run and verify a new snapshot appeared.

Constraints: no notes for the first pass. Anything you can't produce, look up AFTER finishing the rest, then do the whole sequence again clean.

Hints: this is Days 5–6 material — mkdir -p, >>, grep -c, find -name.`,
      },
    ],
    project: {
      title: 'The CLI task tracker',
      brief: `Build the tracker exactly to the spec in the tech section: five commands, JSON persistence, function-per-operation structure, main loop under a guard, and graceful handling of every listed failure. Work from the spec like it's a client requirement doc — resist peeking at tutorials; everything needed was built this week (the journal tool is 60% of it). Test it like a hostile user: add three tasks, quit, relaunch (they must survive), complete one, delete one, then try to break it — "done banana", "done 999", an empty add, a hand-corrupted tasks.json. Stretch goal if time remains: an optional due date on add, shown in list. Tomorrow this folder becomes your first git repository, so leave it clean.`,
      rubric: [
        'All five commands work; tasks survive quit-and-relaunch (JSON persistence verified)',
        'Non-numeric ids, unknown ids, unknown commands, and empty input all produce messages, never tracebacks',
        'Corrupt or missing tasks.json handled with specific excepts (Day 5 pattern)',
        'Logic lives in per-operation functions; main() is a thin loop; guard present; no globals mutated',
        'ids are unique and stable — deleting task 2 never renumbers task 3',
        'A hostile 2-minute test session by you produces zero crashes',
      ],
    },
    mistakes: [
      'Rereading notes instead of recalling. Review means retrieval: cards answered before flipping, patterns written on a blank page. Rereading produces familiarity, which feels like knowledge and isn\'t.',
      'Comparing input() ids to stored int ids without converting — "3" != 3. The Week 1 boss trap, now inside your own project.',
      'Computing the next id as len(tasks) + 1. After deletions this collides with existing ids. Use max of current ids + 1 (guarding the empty list).',
      'Saving only at quit. A crash mid-session then loses the whole session. Save after every mutation — cheap insurance, one function call.',
      'Letting main() grow into a 60-line blob. The command loop should dispatch to functions; if an operation\'s logic lives inline in the loop, extract it.',
      'Skipping the hostile-user test because "it works when I use it correctly." Users never use things correctly; neither do customers, nor LLM agents calling your tools on Day 111.',
    ],
    quiz: [
      {
        q: 'tasks = load_tasks(); tasks2 = tasks; add_task(tasks2, "x"). Does tasks see the new task?',
        o: [
          'No — tasks2 is a copy',
          'Yes — both names alias the same list, and append mutates it',
          'Only after saving and reloading',
          'It raises an error',
        ],
        x: 1,
        w: 'Assignment aliases; append mutates the one shared list, so both names see it. If this surprised you, redo Day 4\'s aliasing lab before building today\'s project.',
        revisit: 4,
      },
      {
        q: 'Your tracker must not crash when tasks.json is missing on first run. The Pythonic pattern?',
        o: [
          'Check os.path.exists before every operation',
          'try: open and json.load; except FileNotFoundError: return an empty list',
          'Create the file at install time and never handle it',
          'Wrap main() in try: ... except: pass',
        ],
        x: 1,
        w: 'EAFP: attempt the load and catch the specific exception with a sensible default. The bare except in option 4 would also hide every real bug — the anti-pattern from Day 5.',
        revisit: 5,
      },
      {
        q: 'Command parsing: "add buy rope for the crossing".split(" ", 1) gives…',
        o: [
          '["add", "buy", "rope", "for", "the", "crossing"]',
          '["add buy rope for the crossing"]',
          '["add", "buy rope for the crossing"]',
          'A ValueError',
        ],
        x: 2,
        w: 'The second argument caps the number of splits at 1: one cut at the first space, leaving the command word and the untouched remainder — exactly what a command parser needs.',
        revisit: 5,
      },
    ],
    resources: [
      { label: 'Python Tutorial — Data Structures (review the sections you diffed wrong)', url: 'https://docs.python.org/3/tutorial/datastructures.html', type: 'docs', time: '15 min' },
      { label: 'json module — official docs (dump/load reference)', url: 'https://docs.python.org/3/library/json.html', type: 'docs', time: '10 min' },
      { label: 'Automate the Boring Stuff — Ch. 9 (files, if the tracker persistence fought you)', url: 'https://automatetheboringstuff.com/2e/chapter9/', type: 'book', time: '20 min' },
    ],
    schedule: [
      { activity: 'Deck drill: all Week 1 flashcards, misses re-drilled', minutes: 15 },
      { activity: 'Blank-page protocol: patterns from memory + diff', minutes: 20 },
      { activity: 'Terminal reps under the clock', minutes: 10 },
      { activity: 'Project: build the task tracker from the spec', minutes: 55 },
      { activity: 'Cumulative quiz + schedule revisits for misses', minutes: 10 },
      { activity: 'Journal: checkpoint entry + Week 2 preview', minutes: 10 },
    ],
    completion: [
      'Flashcard miss count recorded; miss pile re-drilled to clean',
      'recall.py written blind, diffed, FORGOT-list copied to journal',
      'Tracker passes all six rubric checks including the hostile test',
      'Quiz ≥ 2/3 and each miss\'s revisit day noted in the journal',
    ],
    connections: {
      back: 'The tracker is Week 1 in one artifact: Day 2\'s loop and input, Day 3\'s functions and guard, Day 4\'s list-of-dicts, Day 5\'s JSON safety nets, run from Day 6\'s terminal.',
      forward: 'Tomorrow this exact folder becomes your first git repository, and Day 9 rebuilds its task dicts as a Task class. Day 21 ships a tested, packaged version of a bigger sibling. The recall protocol you ran today repeats every 7th day for 25 weeks.',
    },
    flashcards: [
      { f: 'Why recall before rereading on review days?', b: 'Retrieval strengthens memory; rereading only builds familiarity. The strain of recall IS the mechanism.' },
      { f: 'Next-id bug: len(tasks) + 1 fails when?', b: 'After deletions — ids collide. Use max(existing ids) + 1, guarding the empty case.' },
      { f: 's.split(" ", 1) does what?', b: 'Splits at most once: ["command", "rest of the string"] — the command-parsing idiom.' },
      { f: 'When should a CLI app save its data?', b: 'After every mutation, not just at exit — crashes then lose almost nothing.' },
      { f: 'What is CRUD?', b: 'Create, Read, Update, Delete — the four operations of data apps. The tracker is CRUD with JSON persistence.' },
    ],
    deepDive: [
      { label: 'The testing effect (retrieval practice) in one paper', note: 'Roediger & Karpicke 2006 showed testing beats restudying for retention — the result this whole program is built on. Search the title if curious; the design of Day 7, 14, 21... is applied cognitive science, not tradition.' },
    ],
  },
  {
    id: 'd008', day: 8, week: 2, phase: 1, kind: 'lesson',
    title: 'Git — Your Time Machine',
    analogy: 'Save points for your work',
    objectives: [
      'Explain the three areas — working directory, staging area, history — and move changes between them',
      'Run the core cycle fluently: status, add, commit, log, diff',
      'Write commit messages that explain why, and stage related changes together',
      'Ignore generated files with .gitignore',
      'Undo safely: restore a file, unstage a change, and explain what reset does',
    ],
    prereqs: [
      { day: 6, label: 'Terminal fluency' },
      { day: 7, label: 'The task tracker (today\'s repo)' },
    ],
    eli5: `Every video game worth playing has save points. Before the boss fight, you save; if it goes badly, you reload and nothing is truly lost. Now recall Saturday's fear: you're about to refactor a working program, and the only "undo" is Ctrl+Z until your wrist hurts — and none at all once the editor closes. **Git** gives your project save points. A **commit** is a snapshot of your entire project at one moment, stamped with a message, an author, and a timestamp, kept forever in the project's history. Break everything an hour later? Reload the save.

Git's one genuinely odd idea is the **staging area**. You don't snapshot everything that changed — you first *frame the shot*. \`git add\` places chosen changes onto the tripod; \`git commit\` clicks the shutter. That's what lets one messy afternoon become three tidy save points: "fix the id bug", "add due dates", "update README" — each a story someone can follow later. The someone is usually you, in three weeks, at midnight, hunting for what broke.`,
    why: `Git is the closest thing software has to a universal requirement: every job, every team, every open-source project. From today, everything you build lives in git — by Day 20 you'll collaborate through GitHub, by Day 141 your commits will trigger eval gates in CI, and on Day 152 a push to main will deploy a real service. For AI engineers specifically, git is how prompts and eval sets get versioned and reviewed (Day 109) — "which prompt version caused this regression?" is answered by git log or not at all. And your GitHub history becomes your portfolio: hiring managers really do read it.`,
    tech: `### The three areas

Git tracks your project through three zones. The **working directory** is your files as they are right now. The **staging area** (index) is the loading dock: changes you've marked for the next snapshot. The **history** is the chain of commits — immutable, each pointing at its parent, forming the graph the git-graph visualizer draws. The flow is always: edit (working) → \`git add\` (staging) → \`git commit\` (history). \`git status\` reports the state of all three zones and literally prints the commands you might want next — read its output; it's the best teacher in the toolchain.

### The daily cycle

\`git init\` turns a folder into a repository (everything lives in a hidden \`.git/\`). One-time setup: \`git config --global user.name\` and \`user.email\` — every commit is signed with these. Then, forever: \`git status\` → \`git diff\` (what changed, unstaged) → \`git add file\` (or \`-p\` to stage hunk by hunk) → \`git diff --staged\` (what's about to be committed) → \`git commit -m "message"\` → \`git log --oneline\`. A good message finishes the sentence "if applied, this commit will…": *Fix crash when tasks.json is empty*. The first line stays under ~50 characters; the *why* goes in the body if needed. Commit related changes together and unrelated changes separately — small, coherent commits are the hygiene that makes history useful.

### Ignoring and undoing

\`.gitignore\` lists patterns git should never track: \`__pycache__/\`, \`*.pyc\`, \`.env\`, \`data/*.log\`. Commit the .gitignore itself. For undo, learn three tools and their blast radius: \`git restore file\` throws away *uncommitted* working-directory changes to that file (destructive to unsaved work — this is the reload button); \`git restore --staged file\` merely unstages, leaving your edits intact; \`git reset\` moves what the current branch points at and is the "I need to rewrite recent history" tool — for now, know it exists, prefer \`revert\`-style thinking, and never rewrite commits you've shared. \`git show HEAD\` displays the last commit; \`HEAD\` is simply "where you are now" — a name you'll use daily once branches arrive on Day 20.`,
    viz: 'git-graph',
    guided: [
      {
        title: 'First repository — snapshot the tracker',
        minutes: 15,
        body: `1. One-time setup: git config --global user.name "Your Name" and git config --global user.email "you@example.com" (use your real email — Day 20 ties it to GitHub).
2. cd into week-01/tracker/ and run git init. Run ls -la and find the .git folder — that IS the repository; delete it and the history is gone (don't).
3. Run git status and read every line out loud. tracker.py and tasks.json are "untracked" — git sees them but has never snapshotted them.
4. Stage and shoot: git add tracker.py, then git status again (notice tasks.json stayed untracked — you chose the frame). Commit: git commit -m "Add task tracker CLI from Week 1 checkpoint".
5. Run git log and read your first commit: hash, author, date, message. That 40-character hash is the save point\'s name forever.`,
        code: `git config --global user.name "Your Name"
git config --global user.email "you@example.com"
cd week-01/tracker
git init
git status                 # read it! untracked files listed
git add tracker.py
git status                 # tracker.py staged, tasks.json not
git commit -m "Add task tracker CLI from Week 1 checkpoint"
git log --oneline`,
      },
      {
        title: 'The cycle in anger — edit, diff, stage, commit',
        minutes: 20,
        body: `1. Make a real change: in tracker.py, improve one user-facing message (e.g. the unknown-command reply). Run git status (modified), then git diff — read the minus/plus lines; this is your change as git sees it.
2. Stage it, then run git diff (empty now) versus git diff --staged (your change). Write the rule in your journal: diff shows working-vs-staged, diff --staged shows staged-vs-history.
3. Commit with a message that finishes "if applied, this commit will…". Then make TWO unrelated changes: fix a typo in a message AND add a comment block at the top. Stage and commit them SEPARATELY (git add -p lets you pick hunks if they're in one file) — two commits, two stories.
4. Run git log --oneline: you should have 4+ commits reading like a changelog.
5. Inspect: git show HEAD to see the newest snapshot's diff, then git show with the hash of your first commit. You just time-traveled — read-only, zero risk.`,
        code: `git status
git diff                       # unstaged changes
git add tracker.py
git diff --staged              # what the next commit will contain
git commit -m "Clarify unknown-command message"
# ...make two unrelated edits, then:
git add -p                     # stage hunk by hunk: y / n / s(plit)
git commit -m "Fix typo in delete confirmation"
git add tracker.py
git commit -m "Add file header comment"
git log --oneline
git show HEAD`,
      },
      {
        title: 'Ignore and undo — the safety drills',
        minutes: 15,
        body: `1. Run the tracker once so __pycache__/ or stray files might appear, and notice tasks.json changes on every run. Data files and caches don't belong in history. Create .gitignore containing the starter patterns, then git status — ignored files vanish from the listing. Add and commit the .gitignore itself.
2. Undo drill 1 (working directory): deliberately vandalize tracker.py — delete half the file, save. Breathe. git restore tracker.py — vandalism gone, file restored to the last commit. This is the reload-the-save-point move.
3. Undo drill 2 (staging): make a small edit, git add it, then unstage with git restore --staged tracker.py. Confirm with git status: the edit survives in the working directory, it's just off the tripod.
4. Undo drill 3 (knowledge only): read what git reset --hard HEAD would do (working directory AND staging forced back to the last commit). Write one sentence on when it's dangerous — you'll use it deliberately on Day 20, never accidentally.
5. Final check: git status is clean, git log tells this morning's story in order.`,
        code: `# .gitignore for a Python project (commit this file)
__pycache__/
*.pyc
.env
tasks.json          # runtime data, not source

# the three undo drills:
git restore tracker.py            # discard working-dir changes (destructive!)
git restore --staged tracker.py   # unstage; edits kept
# git reset --hard HEAD           # nuke working+staging back to HEAD (read, don't run)`,
      },
    ],
    practice: [
      {
        title: 'Commit surgery',
        minutes: 15,
        body: `Simulate the messy afternoon every developer has: in your tracker repo, make three UNRELATED changes in one sitting — (a) add a "count" command that prints how many tasks are open, (b) rename a poorly-named variable throughout, (c) add usage instructions as comments or a docstring.

Goal: turn that mess into exactly three commits, each containing only its own change, each with a message that finishes "if applied, this commit will…". Use git add -p to split changes living in the same file. Finish with git log --oneline reading like a clean changelog, and git show on each commit proving nothing leaked between them.

Hints (only if stuck): in add -p, y stages a hunk, n skips it, s splits a big hunk. If two changes touch the same line, commit one, then make the other.`,
      },
    ],
    project: {
      title: 'Bring the whole journey under version control',
      brief: `Promote git from experiment to habit: turn your entire ai-engineer-journey folder into a repository (either move the tracker repo up or init at the top level — decide and write one journal sentence on why). Create a proper top-level .gitignore (pycache, .env, backups/, app.log, data files you consider disposable — decide deliberately for each). Then build history that tells the true story in 4–6 commits: week-01 scripts, the journal, the toolbox module, the tracker, config files — grouped logically, not alphabetically. Every commit message must pass the "if applied, this commit will…" test. From tomorrow onward, the day isn't done until it's committed — that rule now applies for 172 more days.`,
      rubric: [
        'git log --oneline shows 4–6 logically grouped commits with imperative, informative messages',
        '.gitignore excludes caches, secrets, backups, and disposable data — and is itself committed',
        'git status is clean at the end (nothing untracked that should be tracked, nothing tracked that shouldn\'t)',
        'Commit-surgery practice produced three isolated commits verified with git show',
        'You can answer from memory: what do restore, restore --staged, and reset --hard each touch?',
      ],
    },
    mistakes: [
      'Committing everything with git add . as a reflex. You\'ll snapshot caches, secrets, and half-finished junk together. Status first, stage deliberately, commit related changes together.',
      'Messages like "fix", "wip", "stuff". A message that doesn\'t say what changed makes history worthless for the person who needs it most — future you at midnight. Finish the sentence "this commit will…".',
      'Tracking generated or secret files (pycache, .env, API keys). Once a secret is committed it lives in history even after deletion — Day 44 covers why that\'s a real incident, not a nuisance. Ignore them from day one.',
      'Fearing commits because "it\'s not finished." Commits are save points, not press releases. Commit small and often; you can tidy before sharing (Day 20).',
      'Confusing restore with restore --staged. Plain restore DESTROYS uncommitted edits; --staged merely unstages. Read the command twice when the working directory holds unsaved work.',
      'Treating git as a backup that syncs somewhere. Local git protects against your own mistakes, not a dying disk — remote push (Day 20) adds the offsite copy.',
    ],
    quiz: [
      {
        q: 'You edited tracker.py and ran git add tracker.py, then edited it AGAIN. What does git commit snapshot?',
        o: [
          'Both edits — commit takes the file as it is on disk',
          'Only the first edit — commit snapshots what was staged when you ran add',
          'Neither — the second edit blocks the commit',
          'It raises a merge conflict',
        ],
        x: 1,
        w: 'Commit photographs the staging area, not the working directory. The second edit sits unstaged until you add again — exactly why git status shows a file as both "staged" and "modified" simultaneously.',
        revisit: 8,
      },
      {
        q: 'Which command throws away your UNCOMMITTED changes to notes.py, restoring the last committed version?',
        o: [
          'git restore --staged notes.py',
          'git restore notes.py',
          'git log notes.py',
          'git diff notes.py',
        ],
        x: 1,
        w: 'git restore <file> resets the working copy to HEAD — destructive to unsaved work, by design. The --staged variant only unstages, keeping your edits.',
        revisit: 8,
      },
      {
        q: 'Why put tasks.json and .env in .gitignore?',
        o: [
          'Git cannot store JSON files',
          'They change too often for git to handle',
          'Runtime data and secrets don\'t belong in history — secrets especially, since history keeps them even after deletion',
          'To make commits faster',
        ],
        x: 2,
        w: 'History is forever: a committed secret remains in old commits after you delete the file. Generated data just adds noise. Track source, ignore artifacts and secrets.',
        revisit: 8,
      },
    ],
    resources: [
      { label: 'Pro Git — 2.2 Recording Changes to the Repository', url: 'https://git-scm.com/book/en/v2/Git-Basics-Recording-Changes-to-the-Repository', type: 'book', time: '25 min' },
      { label: 'MIT Missing Semester — Version Control (git\'s data model, brilliantly)', url: 'https://missing.csail.mit.edu/2020/version-control/', type: 'course', time: '50 min' },
      { label: 'Learn Git Branching — Introduction sequence (interactive)', url: 'https://learngitbranching.js.org/', type: 'course', time: '20 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: Week 1 misses + due cards', minutes: 10 },
      { activity: 'Concept study: ELI5 + tech, watch the git-graph visualizer', minutes: 20 },
      { activity: 'Guided: first repo, the cycle, ignore & undo drills', minutes: 50 },
      { activity: 'Practice: commit surgery', minutes: 15 },
      { activity: 'Project: the journey under version control', minutes: 15 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'Journey repo initialized; log reads as a story; status clean',
      'All three undo drills performed (restore, restore --staged, reset read-only)',
      'Commit surgery: three isolated commits verified with git show',
      'The commit-every-day rule written into journal.md',
      'Quiz ≥ 2/3 (redo the cycle drill if you missed question 1)',
    ],
    connections: {
      back: 'Git lives in Day 6\'s terminal, and its first cargo is Day 7\'s tracker. The staging area\'s frame-the-shot discipline is Day 8\'s version of small functions from Day 3: coherent units, deliberately chosen.',
      forward: 'Day 14\'s checkpoint requires a clean history, graded. Day 20 adds remotes, branches, and pull requests; Day 21 ships a package from this repo. From Day 141, commits trigger eval gates in CI, and on Day 152 a push deploys to production — the same three commands you learned today, with higher stakes.',
    },
    flashcards: [
      { f: 'The three areas of git?', b: 'Working directory (files now) -> staging area (chosen changes) -> history (committed snapshots). add moves 1->2, commit moves 2->3.' },
      { f: 'git diff vs git diff --staged?', b: 'diff: working vs staging (unstaged edits). --staged: staging vs last commit (what will be committed).' },
      { f: 'A good commit message finishes what sentence?', b: '"If applied, this commit will …" — imperative, specific, ~50-char first line.' },
      { f: 'git restore file vs restore --staged file?', b: 'restore: discards working-dir edits (destructive). --staged: unstages only, edits kept.' },
      { f: 'What belongs in .gitignore?', b: 'Generated files, caches, runtime data, and ALL secrets (.env) — history keeps committed secrets forever.' },
      { f: 'What is HEAD?', b: 'The commit you currently stand on — the tip of your current line of history.' },
    ],
    deepDive: [
      { label: 'Pro Git 10.2 — Git objects: it\'s all content-addressed snapshots', url: 'https://git-scm.com/book/en/v2/Git-Internals-Git-Objects', note: 'Commits point to trees pointing to blobs, all named by hashes. Twenty minutes here and git stops being magic — branches (Day 20) become "just movable pointers".' },
    ],
  },
  {
    id: 'd009', day: 9, week: 2, phase: 1, kind: 'lesson',
    title: 'Object-Oriented Python I',
    analogy: 'Blueprints and houses',
    objectives: [
      'Define a class with __init__ and explain what self refers to in every method',
      'Distinguish attributes (state) from methods (behavior) and instances from the class',
      'Implement __repr__ and __eq__ and explain what Python does without them',
      'Use class attributes for shared data and explain how they differ from instance attributes',
      'Convert a dict-based design (the tracker\'s tasks) into a class-based one',
    ],
    prereqs: [
      { day: 3, label: 'Functions and scope' },
      { day: 4, label: 'Dicts and aliasing' },
      { day: 7, label: 'The task tracker (today\'s refactor target)' },
    ],
    eli5: `An architect draws ONE blueprint for a house design; a builder then builds twenty houses from it. Each house has the same rooms in the same layout — but each has its own address, its own paint color, its own family inside. Change the paint on house #7 and house #12 is unaffected. A **class** is the blueprint: it defines what every instance will have (attributes — the rooms) and what it can do (methods — the built-in machinery: heating, plumbing). An **instance** is one actual house built from that blueprint, with its own values filled in.

You've already been living in this idea: every string is an instance of the \`str\` blueprint, which is why \`"hi".upper()\` works — \`upper\` is machinery installed in every house that blueprint builds. Today you stop renting other people's blueprints and draw your own. The word \`self\` is just the machinery asking "which house am I in right now?" — when you call \`task.complete()\`, self IS that particular task, so the method reads and changes *that house's* rooms and nobody else's.`,
    why: `Classes are how Python's ecosystem speaks. Every tool you'll touch is classes: pydantic models validating API requests (Day 41), PyTorch's nn.Module holding your neural network (Day 87), every SDK client (Day 106). If self and __init__ aren't automatic, you'll be fighting syntax while trying to learn transformers. Bundling state with behavior is also how real systems stay sane — "the Task knows how to complete itself" beats "seventeen functions that all take a task dict and hope it has the right keys." Interviews check this directly: "model X as classes" is a standard screen, and __repr__/__eq__ questions expose who has actually built objects.`,
    tech: `### Class, instance, __init__, self

~~~python
class Task:
    def __init__(self, task_id, text):
        self.id = task_id      # instance attributes: this object's state
        self.text = text
        self.done = False
~~~

\`class Task:\` opens the blueprint. \`Task(3, "buy rope")\` builds an instance: Python allocates a fresh empty object, then calls \`__init__(self, 3, "buy rope")\` with \`self\` bound to that new object; each \`self.x = ...\` line installs a room. Methods are just functions defined in the class body whose first parameter is the instance: \`task.complete()\` is sugar for \`Task.complete(task)\` — that's all self is, the instance passed in first, automatically. There is nothing magic about the name (it's convention, not keyword), but never rename it. Attributes are read and written with dot notation: \`task.done = True\`. Forgetting \`self.\` inside a method creates a local variable that evaporates at return — the day's classic bug.

### __repr__ and __eq__: teaching Python about your type

Print a bare instance and you get \`<__main__.Task object at 0x7f...>\` — useless. Define \`__repr__(self)\` to return a developer-facing string, conventionally looking like the constructor call: \`Task(3, 'buy rope', done=False)\`. Now printing, lists of tasks, and debugger views all become readable — implement it on every class you ever write; it pays rent daily. Equality: by default \`==\` on objects means *identity* (same object in memory, like \`is\`), so two Tasks with identical data compare unequal. Define \`__eq__(self, other)\` to compare by value — and compare \`type(other)\` or return NotImplemented for foreign types. These double-underscore ("dunder") methods are Python's protocol system: you'll add \`__iter__\` on Day 11 and meet dozens more; \`len()\`, \`in\`, \`for\`, \`+\` are ALL dunder calls under the hood.

### Class attributes vs instance attributes

An assignment in the class body — outside any method — is a **class attribute**, shared by every instance: perfect for constants (\`MAX_TEXT_LEN = 200\`) or counters (\`Task.count\`). Lookup falls through: \`task.x\` checks the instance first, then the class. The trap: a *mutable* class attribute (a list in the class body) is ONE list shared by all instances — Day 4's aliasing lesson striking from a new angle. Per-instance state always gets created in __init__.`,
    viz: 'oop-objects',
    guided: [
      {
        title: 'Draw the blueprint — your first class',
        minutes: 15,
        body: `1. Create \`week-02/task_class.py\` with the starter code. Read it top to bottom, then run it.
2. Trace the construction: when Task(1, "buy rope") runs, what does Python do first, and what is self during __init__? Write the two-step answer as a comment (allocate fresh object; run __init__ with self = that object).
3. Prove instances are independent houses: complete t1 and print both tasks' done flags. Then prove methods are functions in disguise: call Task.complete(t2) — the explicit form of t2.complete() — and verify it worked.
4. Introduce the classic bug on purpose: in rename(), drop the self. prefix (text = new_text), rerun, and observe the method silently doing nothing. Restore it. You will hit this bug for real within a week; now you'll recognize the symptom (method runs, state unchanged).
5. Add a method is_overdue(self, current_day) that returns True if the task has a due_day attribute set and current_day is past it. Default due_day to None in __init__ and handle it.`,
        code: `class Task:
    def __init__(self, task_id, text):
        self.id = task_id
        self.text = text
        self.done = False

    def complete(self):
        self.done = True

    def rename(self, new_text):
        self.text = new_text     # drop "self." to see the silent bug

t1 = Task(1, "buy rope")
t2 = Task(2, "check the map")
t1.complete()
print(t1.id, t1.text, t1.done)   # 1 buy rope True
print(t2.id, t2.text, t2.done)   # 2 check the map False
Task.complete(t2)                # same as t2.complete()
print(t2.done)                   # True`,
      },
      {
        title: 'Civilize your objects — __repr__ and __eq__',
        minutes: 15,
        body: `1. In the same file, print a raw task: print([t1, t2]). Behold the <object at 0x...> junk — that's what you're fixing.
2. Add the __repr__ from the starter below. Print the list again: readable. Rule to keep: every class you ever write gets a __repr__ within five minutes of existing.
3. Now equality: construct t3 = Task(1, "buy rope"); t3.complete(). Compare t1 == t3 — False?! Default == is identity. Add the __eq__ below and compare again.
4. Test the foreign-type edge: t1 == "banana" must be False, not a crash — confirm the isinstance guard handles it.
5. Think ahead in a comment: your tracker saves JSON. Add to_dict(self) returning the task as a plain dict, and a from_dict classmethod-style helper (a plain function make_task(d) is fine today). Round-trip one task: Task -> dict -> Task and verify == says they match. You just built the bridge between objects and Day 5's persistence.`,
        code: `    def __repr__(self):
        return "Task({!r}, {!r}, done={!r})".format(self.id, self.text, self.done)

    def __eq__(self, other):
        if not isinstance(other, Task):
            return NotImplemented
        return (self.id, self.text, self.done) == (other.id, other.text, other.done)

    def to_dict(self):
        return {"id": self.id, "text": self.text, "done": self.done}

def make_task(d):
    t = Task(d["id"], d["text"])
    t.done = d["done"]
    return t`,
      },
      {
        title: 'Shared rooms — class attributes and the counter',
        minutes: 15,
        body: `1. Create \`counter_lab.py\` with the starter code. Predict the three printed counts before running.
2. Explain in a comment why count lives on the CLASS: it's state about all tasks, owned by the blueprint, not any one house.
3. Lookup fall-through drill: print(t1.MAX_TEXT_LEN) — found on the class via the instance. Now set t1.MAX_TEXT_LEN = 999 and print Task.MAX_TEXT_LEN and t2.MAX_TEXT_LEN — the class is untouched; you created an instance attribute that SHADOWS it. Connect this to Day 3's LEGB shadowing in one sentence.
4. The shared-mutable trap: run section 2 and explain the spooky result — tags defined in the class body is ONE list, aliased by every instance (Day 4's lesson in a new costume). Fix it: move tags into __init__ as self.tags = []. Verify independence.
5. Close the file with the rule: constants and counters on the class; every mutable, per-object value born in __init__.`,
        code: `class Task:
    MAX_TEXT_LEN = 200        # class attribute: shared constant
    count = 0                 # class attribute: shared counter
    tags = []                 # BUG BAIT: shared mutable! (section 2)

    def __init__(self, text):
        self.text = text[:Task.MAX_TEXT_LEN]
        Task.count = Task.count + 1

# --- 1: the counter
print(Task.count)             # 0
t1 = Task("buy rope")
t2 = Task("check map")
print(Task.count)             # 2
print(t1.MAX_TEXT_LEN)        # 200, found on the class

# --- 2: the shared-mutable trap
t1.tags.append("urgent")
print(t2.tags)                # ['urgent'] ?! one shared list`,
      },
    ],
    practice: [
      {
        title: 'The flashcard class',
        minutes: 20,
        body: `Model the spaced-repetition card you use every morning. Build \`flashcard.py\` from scratch.

Goal: a Flashcard class with attributes front, back, streak (consecutive correct answers, starts 0), and due_in (days until next review, starts 0). Methods: review(correct) — if correct, streak += 1 and due_in doubles from a base of 1 (1, 2, 4, 8...); if wrong, streak resets to 0 and due_in to 1. Plus __repr__, __eq__ (front/back define identity — streak doesn't), and to_dict. Write a short demo: three cards, a mixed run of reviews, print the deck sorted by due_in (sorted with key=lambda c: c.due_in — a Day 12 preview).

Constraints: no globals; the doubling logic must be in the method, not the demo; t == t2 for same front/back but different streaks must be True.

Hints (only if stuck): due_in after a correct answer can be max(1, due_in * 2). That IS the gist of the SM-2-lite scheduler this program runs on you.`,
      },
    ],
    project: {
      title: 'The tracker gets a Task class',
      brief: `Refactor Day 7's tracker: replace task dicts with the Task class (id, text, done, optional due_day; complete(), rename(), __repr__, __eq__, to_dict(), plus make_task(d) for loading). The command loop and JSON files must keep working exactly as before — load turns each stored dict into a Task, save turns each Task back into a dict. This dict-object-dict bridge is the everyday shape of real systems (database row -> object -> API response). Commit in at least two steps on top of yesterday's history: "Add Task class with repr/eq/serialization" then "Refactor tracker to use Task objects". Behavior-preserving refactors with clean commits are exactly what Day 15 turns into a discipline.`,
      rubric: [
        'Tracker behavior is unchanged from Day 7 — all five commands, persistence intact (verified by a quit-and-relaunch test)',
        'Task class owns its behavior: complete/rename are methods, not loop code poking .done',
        'print of the task list is readable via __repr__',
        'Round-trip integrity: save then load yields Tasks that compare == to the originals',
        'Two clean commits with imperative messages on top of Day 8\'s history',
      ],
    },
    mistakes: [
      'Forgetting self. when setting state in a method (text = new_text). It creates a local that vanishes at return — the method "runs but nothing happens." If state didn\'t change, hunt for a missing self.',
      'Forgetting self in the method signature (def complete():). The call task.complete() then explodes with "takes 0 positional arguments but 1 was given" — that mysterious 1 IS self being passed automatically.',
      'Calling __init__ a constructor that returns the object. It initializes an already-created object and must return None. Task(...) does allocate-then-init; return self from __init__ is an error.',
      'Putting a mutable default in the class body (tags = []). One list, shared by every instance — Day 4 aliasing in disguise. Per-instance mutables are born in __init__.',
      'Skipping __repr__ because "print works eventually." Debugging a list of <object at 0x...> wastes minutes every day; the five-minute __repr__ pays for itself same-day.',
      'Writing classes for everything now that you have them. A function that takes data and returns data is often better (Day 10 makes this judgment call explicit). Classes earn their keep when state and behavior genuinely belong together.',
    ],
    quiz: [
      {
        q: 'In t = Task(1, "rope"); t.complete() — what is self inside complete()?',
        o: [
          'The Task class itself',
          'The instance t — the call is sugar for Task.complete(t)',
          'A copy of t',
          'A keyword with no value',
        ],
        x: 1,
        w: 'Methods receive the instance as their first argument automatically; self is simply that parameter. That is why Task.complete(t) and t.complete() are identical.',
        revisit: 9,
      },
      {
        q: 'Two Tasks hold identical data. Without __eq__, t1 == t2 is…',
        o: [
          'True — Python compares attributes automatically',
          'False — default equality is identity: are they the same object?',
          'An AttributeError',
          'True only if __repr__ is defined',
        ],
        x: 1,
        w: 'Default == falls back to identity (like is). Value equality is opt-in via __eq__ — which is why your round-trip test needed it.',
        revisit: 9,
      },
      {
        q: 'class Task: tags = [] — then t1.tags.append("x"). What does t2.tags show?',
        o: [
          '[] — each instance gets its own list',
          '["x"] — the class-body list is one object shared (aliased) by all instances',
          'An AttributeError',
          '["x"] but only until t2 is created',
        ],
        x: 1,
        w: 'Class attributes are evaluated once and shared; a mutable one is a single aliased object (Day 4\'s lesson). Per-instance mutables belong in __init__: self.tags = [].',
        revisit: 4,
      },
    ],
    resources: [
      { label: 'Python Tutorial — 9. Classes (through 9.4)', url: 'https://docs.python.org/3/tutorial/classes.html', type: 'docs', time: '35 min' },
      { label: 'Python Data Model — special method names (skim __repr__ and __eq__)', url: 'https://docs.python.org/3/reference/datamodel.html#special-method-names', type: 'docs', time: '15 min' },
      { label: 'Python Tutor — step through the blueprint lab visually', url: 'https://pythontutor.com/', type: 'tool', time: '10 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: due cards (watch for Day 4 aliasing cards)', minutes: 10 },
      { activity: 'Concept study: ELI5 + tech, with the oop-objects visualizer', minutes: 20 },
      { activity: 'Guided: blueprint, repr/eq, class-attribute labs', minutes: 45 },
      { activity: 'Practice: the flashcard class', minutes: 20 },
      { activity: 'Project: refactor the tracker to Task objects', minutes: 15 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'All three guided labs run, including both deliberate bugs (missing self., shared tags) triggered and fixed',
      'Flashcard class passes its own demo including equality-ignores-streak',
      'Tracker refactor: behavior unchanged, round-trip verified, two clean commits',
      'Quiz ≥ 2/3 (redo the counter lab if you missed question 3)',
    ],
    connections: {
      back: 'self.x = value is Day 2\'s binding aimed at an object instead of a namespace; the shared-mutable trap is Day 4\'s aliasing; methods are Day 3\'s functions with the instance passed first; and the refactor target is Day 7\'s tracker, preserved by Day 8\'s commits.',
      forward: 'Day 10 adds inheritance, dataclasses (which write __init__/__repr__/__eq__ for you — earn them today, enjoy them tomorrow), and the composition judgment. Day 11\'s iterator protocol is more dunder methods; pydantic (Day 41) and nn.Module (Day 87) are this exact material, industrialized.',
    },
    flashcards: [
      { f: 'What is self?', b: 'The instance a method was called on — t.complete() is Task.complete(t). Just the first parameter, passed automatically.' },
      { f: 'What does __init__ do (and not do)?', b: 'Initializes an already-allocated instance (installs attributes). It does not create or return the object.' },
      { f: 'Default == between two objects?', b: 'Identity — same object in memory. Value equality requires defining __eq__.' },
      { f: '__repr__ convention?', b: 'Return a developer-readable string resembling the constructor call: Task(3, "rope", done=False). Write it for every class.' },
      { f: 'Class attribute vs instance attribute lookup?', b: 'Instance checked first, then class. Assigning via the instance shadows the class value.' },
      { f: 'Symptom of a missing self. in a method?', b: 'Method runs without error but state never changes — you assigned to a local that vanished.' },
    ],
    deepDive: [
      { label: 'How "hi".upper() finds upper', note: 'Attribute lookup walks instance -> class -> base classes (the MRO). Everything in Python is an object with a class, including classes and functions themselves — type(type) is type. Pull that thread once; it makes Day 10\'s inheritance obvious.' },
    ],
  },
  {
    id: 'd010', day: 10, week: 2, phase: 1, kind: 'lesson',
    title: 'Object-Oriented Python II',
    analogy: 'Family trees vs Lego',
    objectives: [
      'Create subclasses that override methods and call up with super()',
      'Decide between inheritance ("is-a") and composition ("has-a") for a given design and defend the choice',
      'Replace boilerplate classes with dataclasses, including defaults and field',
      'Expose computed values as properties instead of getter methods',
      'Explain duck typing and why Python functions rarely check types',
    ],
    prereqs: [
      { day: 9, label: 'Classes, self, dunder methods' },
      { day: 4, label: 'Collections (composition builds on them)' },
    ],
    eli5: `There are two ways to build a new thing from existing things. The **family tree** way: a child inherits everything from a parent, then differs where it must. A Sheepdog *is a* Dog — it gets bark() for free and overrides herd(). That's **inheritance**: powerful when the family resemblance is real, miserable when it isn't — force a Robot into the Dog family for reuse of walk() and you'll spend your life apologizing for it barking.

The **Lego** way: snap independent pieces together. A camper van *has an* engine, *has a* kitchen, *has a* bed — nobody insists a camper van is a kind of kitchen. That's **composition**: your Tracker HAS a list of Tasks and HAS a storage backend; swap the storage brick for a database later and nothing else moves. The modern rule of thumb, worth tattooing somewhere: reach for Lego first, family trees only when the "is-a" sentence is genuinely true and the family shares real behavior. Python also throws in a labor-saving gift today — **dataclasses**, which write yesterday's __init__/__repr__/__eq__ boilerplate for you from a simple list of fields.`,
    why: `This is the day you learn to *judge* designs, not just write them — and design judgment is what code reviews, systems interviews, and FDE work actually test. Deep inheritance towers are the most common legacy-code pathology you'll meet in customer codebases; recognizing "this should have been composition" is a consulting skill with a billing rate. Dataclasses, meanwhile, are modern Python's default way to model data — config objects, API payloads, RAG chunks (Day 114) — and they're the on-ramp to pydantic (Day 41), which powers FastAPI and most structured-output LLM work (Day 110). Duck typing explains why Python libraries compose so freely — and why type hints (Day 15) add guardrails.`,
    tech: `### Inheritance and overriding

\`class EmailNotifier(Notifier):\` makes EmailNotifier inherit every attribute and method of Notifier. The subclass **overrides** a method by redefining it; the override can extend rather than replace by calling \`super().method(...)\` — most commonly in \`__init__\`, where the child adds fields after \`super().__init__(...)\` sets up the parent's. Lookup order is instance → class → parent chain (the MRO). \`isinstance(obj, Notifier)\` is True for subclass instances too — that's the "is-a" contract made checkable. Keep hierarchies shallow (one level, occasionally two); if you're overriding a method to do *nothing*, the family resemblance was a lie.

### Composition and the judgment call

Composition stores other objects as attributes: \`self.storage = JsonStorage(path)\`. The owner delegates: \`def save(self): self.storage.write(self.tasks)\`. Prefer it because bricks are swappable (JsonStorage → SqliteStorage on Day 36 without touching Tracker), testable in isolation (Day 19 hands you a fake storage), and free of the fragile-base-class problem where a parent's innocent change breaks distant children. The test: say the sentence aloud. "A Tracker is a list" — no; it *has* tasks. Inheriting from list to get append() for free is the canonical anti-pattern.

### Dataclasses and properties

~~~python
from dataclasses import dataclass, field

@dataclass
class Task:
    id: int
    text: str
    done: bool = False
    tags: list = field(default_factory=list)
~~~

The \`@dataclass\` decorator (a preview of Day 12) generates \`__init__\`, \`__repr__\`, and \`__eq__\` from the field list — yesterday's labor, automated. Note \`field(default_factory=list)\`: dataclasses *refuse* a bare mutable default, structurally fixing the shared-list trap from Days 3 and 9. A **property** makes a computed value look like an attribute: decorate a method with \`@property\` and \`tracker.open_count\` (no parentheses) runs it — callers get clean syntax, you keep the freedom to compute.

### Duck typing

Python functions don't demand types; they demand *behavior*. \`def notify_all(notifiers, msg)\` works on anything with a \`.send(msg)\` — Email, SMS, a test fake — no shared parent required. "If it quacks like a duck…" This is why composition thrives here, and it has a modern formalization (Protocol classes, Day 15's typing lesson) that documents the required quack without imposing a family tree.`,
    viz: null,
    guided: [
      {
        title: 'The family tree — Notifier and its children',
        minutes: 15,
        body: `1. Create \`week-02/notifiers.py\` with the starter code and run it. Note what SMSNotifier inherits without writing: __init__ and the ready() method, straight from the parent.
2. Trace the override: notify_all calls .send on each object; Python finds EmailNotifier's send for the first, SMSNotifier's for the second. Same call, different behavior — that's polymorphism, and you've used it since "x".upper() vs [].copy().
3. Add super() practice: give EmailNotifier its own __init__ taking (name, address) that calls super().__init__(name) then sets self.address. Update the demo. Rule: child __init__ almost always starts with super().__init__.
4. Check the contract: print isinstance(email, Notifier) and isinstance("hello", Notifier).
5. Now the duck: add class FakeNotifier with a send(msg) that just appends to self.sent — NO inheritance from Notifier. Add it to the notify_all list. It works! Write the one-line lesson: notify_all never needed the family, only the quack. (Day 19 uses exactly this trick to test without sending real messages.)`,
        code: `class Notifier:
    def __init__(self, name):
        self.name = name

    def ready(self):
        return True

    def send(self, msg):
        print("[base] pretend-sending:", msg)

class EmailNotifier(Notifier):
    def send(self, msg):                    # override
        print("EMAIL to", self.name + ":", msg)

class SMSNotifier(Notifier):
    def send(self, msg):                    # override
        print("SMS to", self.name + ":", msg[:20], "...")

def notify_all(notifiers, msg):
    for n in notifiers:
        n.send(msg)                         # polymorphism

team = [EmailNotifier("ada"), SMSNotifier("grace")]
notify_all(team, "Checkpoint tonight: commit your tracker!")`,
      },
      {
        title: 'Dataclasses — delete your boilerplate',
        minutes: 15,
        body: `1. Create \`dataclass_lab.py\`. Start by pasting your Day 9 Task class (with its handwritten __init__, __repr__, __eq__). Count its lines.
2. Below it, write the dataclass version from the starter code. Count again. Run the demo: construction, printing, and == all behave like yesterday's handwritten versions — generated for you from the field list.
3. Try the trap on purpose: change tags to tags: list = [] and run. Read the ValueError — dataclasses structurally BAN the shared-mutable-default bug you met on Day 9. Restore default_factory and salute the language designers.
4. Add a method — dataclasses are still classes: def complete(self): self.done = True. Methods and generated code coexist.
5. Convert your Day 9 Flashcard to a dataclass. One wrinkle to solve: __eq__ should ignore streak — check the dataclass docs for field(compare=False) and apply it. Ten minutes, and you now know how to steer the generated code.`,
        code: `from dataclasses import dataclass, field

@dataclass
class Task:
    id: int
    text: str
    done: bool = False
    tags: list = field(default_factory=list)

    def complete(self):
        self.done = True

t1 = Task(1, "buy rope")
t2 = Task(1, "buy rope")
print(t1)             # Task(id=1, text='buy rope', done=False, tags=[])
print(t1 == t2)       # True -- __eq__ generated from the fields
t1.complete()
t1.tags.append("gear")
print(t2.tags)        # [] -- default_factory: each instance its OWN list`,
      },
      {
        title: 'Lego assembly — composition and a property',
        minutes: 15,
        body: `1. Create \`composed_tracker.py\` with the starter code — a Tracker built the Lego way: it HAS tasks and HAS a storage brick.
2. Run it and trace one save: Tracker.add calls self.storage.save — the Tracker knows WHAT to persist, the brick knows HOW. Neither knows the other's internals.
3. Feel the swap: write class MemoryStorage with load()/save(data) that just keeps a list in an attribute — five lines. Build Tracker(MemoryStorage()) and confirm identical behavior with no files touched. You just did what Day 19 calls "injecting a test double" and what Day 36 will do with a database — zero Tracker edits either time.
4. The property: open_count is computed from tasks on demand, but reads as an attribute (no parens). Add a second property, done_count. Why not store counts as attributes? Write the answer: stored copies drift out of sync; computed values can't.
5. Contrast exercise, on paper: sketch the inheritance version (class Tracker(list)). List two concrete ways it goes wrong (hint: tracker.clear() from any caller; every list method becomes your public API whether it makes sense or not).`,
        code: `import json
from dataclasses import dataclass, asdict
from pathlib import Path

@dataclass
class Task:
    id: int
    text: str
    done: bool = False

class JsonStorage:
    def __init__(self, path):
        self.path = Path(path)

    def load(self):
        try:
            with open(self.path, encoding="utf-8") as f:
                return [Task(**d) for d in json.load(f)]
        except FileNotFoundError:
            return []

    def save(self, tasks):
        with open(self.path, "w", encoding="utf-8") as f:
            json.dump([asdict(t) for t in tasks], f, indent=2)

class Tracker:
    def __init__(self, storage):
        self.storage = storage            # HAS-A brick, swappable
        self.tasks = self.storage.load()

    def add(self, text):
        next_id = max((t.id for t in self.tasks), default=0) + 1
        self.tasks.append(Task(next_id, text))
        self.storage.save(self.tasks)

    @property
    def open_count(self):                 # computed, reads like an attribute
        return sum(1 for t in self.tasks if not t.done)

tracker = Tracker(JsonStorage("tasks.json"))
tracker.add("test the lego build")
print("open tasks:", tracker.open_count)  # no parentheses`,
      },
    ],
    practice: [
      {
        title: 'Refactor the family tree that lied',
        minutes: 20,
        body: `You inherit this design (type it out): class Report with load_data(), format_text(), and send_email() all in one class; class PdfReport(Report) overriding format_text; class SlackReport(Report) overriding send_email AND overriding format_text to raise NotImplementedError("slack uses blocks"); class CsvReport(Report) overriding send_email to do nothing because CSVs get saved, not sent.

Goal: the NotImplementedError and the do-nothing override are the tells of a lying hierarchy. Redesign with composition: a Report that HAS a formatter brick and HAS a delivery brick (each a tiny class with one method — duck-typed, no base class needed). Build three concrete combinations matching the originals, working end to end with print-based stubs.

Constraints: zero inheritance in the final design; adding a "markdown formatter delivered to slack" combination must require ONE new class and ONE changed line.

Hints (only if stuck): Report.__init__(self, formatter, delivery); run() calls self.formatter.format(data) then self.delivery.send(result).`,
      },
    ],
    project: {
      title: 'Tracker v3 — dataclass + Lego edition',
      brief: `Rebuild the tracker on today's foundations, in \`week-02/tracker_v3/\`: Task as a dataclass (id, text, done, tags with default_factory, optional due_day); a JsonStorage brick owning ALL file I/O; a Tracker class composing storage + tasks with add/complete/delete/rename methods and two properties (open_count, done_count); the CLI loop from Day 7 driving it, now three thin layers (interface → Tracker → storage). Then prove the Lego: add MemoryStorage and a --demo flag (or a DEMO constant) that runs the tracker against it, touching no files. Commit in logical steps as usual. Write three sentences in journal.md: one design decision you made, one thing composition made easier, one thing that felt like overkill at this size — honest judgment is the skill.`,
      rubric: [
        'Task is a dataclass with a default_factory list and no handwritten __init__/__repr__/__eq__',
        'No file I/O outside JsonStorage — verified by searching for "open(" in the other classes',
        'Tracker works identically with JsonStorage and MemoryStorage (demo mode shown)',
        'open_count and done_count are properties, computed not stored',
        'Practice refactor: composition version passes, and the one-class-one-line extensibility check holds',
        'Clean commits; journal reflection written',
      ],
    },
    mistakes: [
      'Inheriting to reuse code when the "is-a" sentence is false (Tracker extends list, Robot extends Dog). You inherit the parent\'s entire public API and its future changes. Compose instead; delegate the one method you wanted.',
      'Forgetting super().__init__ in a subclass __init__ — the parent\'s attributes never get created, and errors surface later, far from the cause.',
      'Overriding a method to raise NotImplementedError or pass. That\'s the hierarchy confessing it\'s wrong: the child was never really a parent. Restructure.',
      'Writing tags: list = [] in a dataclass. It refuses to run — by design. Use field(default_factory=list) and be grateful the Day 9 trap is now a compile-time error.',
      'Storing computed values as attributes and updating them manually (self.open_count everywhere). They drift out of sync. Compute them in a @property.',
      'isinstance-checking every argument "for safety." Duck typing is the design: document the behavior you need, accept anything providing it — your notify_all took a test fake precisely because it did NOT check.',
    ],
    quiz: [
      {
        q: 'A CachedStorage should reuse JsonStorage\'s behavior but keep recent reads in memory. Best structure?',
        o: [
          'class CachedStorage(JsonStorage) — inheritance for free reuse',
          'CachedStorage HAS a JsonStorage (composition) and delegates on cache miss',
          'Copy JsonStorage\'s code into CachedStorage',
          'Add caching directly inside Tracker',
        ],
        x: 1,
        w: 'A cache is not a kind of JSON file — it WRAPS a storage. Composition lets it wrap MemoryStorage or SqliteStorage tomorrow, unchanged. ("Is-a" fails, "has-a" reads perfectly.)',
        revisit: 10,
      },
      {
        q: 'What does @dataclass generate from the field list?',
        o: [
          'Only __init__',
          '__init__, __repr__, and __eq__ (by default)',
          'Getters and setters for every field',
          'JSON serialization methods',
        ],
        x: 1,
        w: 'The default trio is init, repr, and value-based eq — exactly what you handwrote on Day 9. Serialization needs dataclasses.asdict; other dunders are opt-in flags.',
        revisit: 10,
      },
      {
        q: 'Why does notify_all(notifiers, msg) work on a FakeNotifier that inherits from nothing?',
        o: [
          'Python secretly adds a common base class',
          'Duck typing: the function only requires a .send method, and the fake provides one',
          'It works but is undefined behavior',
          'Because FakeNotifier is defined in the same file',
        ],
        x: 1,
        w: 'Python resolves n.send(msg) at call time on the actual object; any object with a matching method satisfies the caller. Behavior, not ancestry, is the contract.',
        revisit: 10,
      },
    ],
    resources: [
      { label: 'Python Tutorial — 9.5 Inheritance', url: 'https://docs.python.org/3/tutorial/classes.html#inheritance', type: 'docs', time: '15 min' },
      { label: 'dataclasses — official docs (through field())', url: 'https://docs.python.org/3/library/dataclasses.html', type: 'docs', time: '20 min' },
      { label: 'Built-in functions — property (the official example is excellent)', url: 'https://docs.python.org/3/library/functions.html#property', type: 'docs', time: '10 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: due cards (Day 9 dunders will appear)', minutes: 10 },
      { activity: 'Concept study: ELI5 + tech — say the is-a/has-a sentences aloud', minutes: 20 },
      { activity: 'Guided: family tree, dataclasses, Lego assembly', minutes: 45 },
      { activity: 'Practice: refactor the lying hierarchy', minutes: 20 },
      { activity: 'Project: tracker v3', minutes: 15 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'Notifier lab run including the duck-typed FakeNotifier',
      'Dataclass lab done; the banned-mutable-default error triggered and understood',
      'MemoryStorage swap works with zero Tracker changes',
      'Practice refactor passes the one-class-one-line extensibility test',
      'Tracker v3 committed; journal judgment written; quiz ≥ 2/3',
    ],
    connections: {
      back: 'Dataclasses automate exactly the __init__/__repr__/__eq__ you handwrote on Day 9 — and their default_factory rule is the language fixing Day 4\'s aliasing trap. The storage brick is Day 5\'s JSON code, given a wall around it.',
      forward: 'The @dataclass and @property decorators get demystified on Day 12 (you\'ll write your own). The swappable-brick move returns as dependency injection on Day 45 and test doubles on Day 19. pydantic (Day 41) is dataclasses with validation; Protocol (Day 15) formalizes today\'s ducks.',
    },
    flashcards: [
      { f: 'Inheritance vs composition — the test?', b: 'Say it aloud: "X is a Y" (inherit) vs "X has a Y" (compose). Default to composition; inherit only for true is-a with shared behavior.' },
      { f: 'What must a subclass __init__ usually do first?', b: 'Call super().__init__(...) so the parent\'s attributes exist before the child adds its own.' },
      { f: 'Mutable default in a dataclass?', b: 'field(default_factory=list) — a bare [] is banned by design (shared-mutable trap).' },
      { f: '@property does what?', b: 'Makes a method readable as an attribute: tracker.open_count runs code, no parentheses. Computed > stored-and-drifting.' },
      { f: 'Duck typing in one line?', b: 'Callers require behavior (a .send method), not ancestry. Any object with the right methods qualifies.' },
      { f: 'Smell: an override that raises NotImplementedError?', b: 'The hierarchy is lying — the child is not truly a parent. Refactor to composition.' },
    ],
    deepDive: [
      { label: 'Composition over inheritance — the classic argument', note: 'The principle predates Python (Gang of Four, 1994: "favor object composition over class inheritance"). Search the phrase and read one good essay; then reread your practice refactor and notice you rediscovered every point yourself.' },
    ],
  },
  {
    id: 'd011', day: 11, week: 2, phase: 1, kind: 'lesson',
    title: 'Iterators & Generators',
    analogy: 'Conveyor belts',
    objectives: [
      'Explain the iteration protocol — iter(), next(), StopIteration — and desugar a for loop by hand',
      'Write generator functions with yield and predict exactly when their code runs',
      'Replace list-building loops with generator expressions where laziness pays',
      'Chain generators into a streaming pipeline that processes a large file in constant memory',
      'Use itertools (islice, count, chain) to manipulate streams without materializing them',
    ],
    prereqs: [
      { day: 4, label: 'Collections and iteration' },
      { day: 5, label: 'Reading files line by line' },
      { day: 9, label: 'Dunder methods (the protocol)' },
    ],
    eli5: `A warehouse approach to making a million sandwiches: make all million first, stack them to the ceiling, then start serving. You'll need a warehouse (memory), and the first customer waits until the last sandwich is made. The **conveyor belt** approach: make one sandwich when a customer actually asks, hand it over, make the next on the next request. No warehouse. First customer served instantly. And if only ten customers show up, you made ten sandwiches, not a million.

A Python list is the warehouse: every element exists in memory at once. A **generator** is the conveyor belt: a function with \`yield\` that produces one item on demand, then *freezes mid-sentence* — variables intact — until asked again. Nothing runs until someone asks; asking is \`next()\`; and a \`for\` loop is just polite, repeated asking. Belts also snap together: one belt reads lines from a huge file, the next keeps only errors, the next extracts a field — and one item flows through the whole chain at a time. A 10 GB file streams through a pipeline like that using a few kilobytes of memory. That's the trick warehouses can never do.`,
    why: `Streaming is a production survival skill: "load it all into memory" is exactly how services die at 3am when a customer's export is 100x your test file — the OOM killer (Day 39) has no mercy. You've already relied on this material: for-line-in-f (Day 5) works because files are iterators. It's also the native shape of AI engineering: LLM responses arrive as token streams (Day 107), Dataset/DataLoader pipelines feed training loops one batch at a time (Day 88), and RAG ingestion (Day 113) is read-chunk-embed as a stream because corpora don't fit in RAM. Interviewers probe it with one cheap question: "what does yield do?"`,
    tech: `### The protocol under every for loop

\`for x in thing:\` desugars to: call \`iter(thing)\` to get an **iterator**, call \`next(it)\` repeatedly binding each result to x, stop cleanly when \`next\` raises **StopIteration**. An *iterable* is anything iter() accepts (lists, dicts, files, strings); an *iterator* is the stateful cursor iter() returns — it remembers position and can only move forward. Lists hand out a fresh iterator per loop, which is why you can loop a list twice. An iterator is its own iterator, which is why you CAN'T loop one twice — once exhausted, it's done. This protocol is just dunder methods (\`__iter__\`, \`__next__\`) from Day 9, which means your own classes can be iterable too.

### Generators: functions that pause

~~~python
def countdown(n):
    while n > 0:
        yield n
        n -= 1
~~~

Calling \`countdown(3)\` runs NONE of the body — it returns a generator object (an iterator). Each \`next()\` runs until the next \`yield\`, hands out that value, and freezes with all locals intact; the next \`next()\` resumes right after the yield. When the function falls off the end, StopIteration fires and the for loop ends. This inversion — *code runs only when values are demanded* — is called laziness. **Generator expressions** are one-line generators: \`(n * n for n in nums)\` — parentheses instead of brackets, no list built. Feed them straight into consumers: \`sum(n * n for n in nums)\`, \`max(...)\`, \`any(...)\`.

### Pipelines and itertools

Because generators consume iterables and are iterables, they chain:

~~~python
lines = (line.strip() for line in open("app.log", encoding="utf-8"))
errors = (ln for ln in lines if "ERROR" in ln)
ips = (ln.split()[3] for ln in errors)
~~~

Nothing has executed yet — three belts, zero items moved. Iterating \`ips\` pulls one line through all three stages at a time: constant memory regardless of file size, first result immediately. This is Day 6's shell pipeline (\`cat | grep | cut\`) rebuilt inside Python — same architecture, same virtues. \`itertools\` supplies pre-built belts: \`islice(gen, 10)\` takes the first ten (a "head" for streams — you can't index a generator), \`count(1)\` yields 1,2,3… forever (infinite is fine — laziness means you only pay for what you pull), \`chain(a, b)\` glues streams end to end. One warning owed to Day 4: generators are single-pass. Need the data twice? Materialize deliberately — \`list(gen)\` — and know you just chose the warehouse.`,
    viz: null,
    guided: [
      {
        title: 'Pull back the curtain — the protocol by hand',
        minutes: 15,
        body: `1. Create \`week-02/protocol_lab.py\` with the starter code. Section 1: drive a list's iterator manually with iter/next until StopIteration fires. You are being the for loop.
2. Confirm the two-loops mystery: loop the LIST twice (works — fresh iterator each time), then loop the same ITERATOR twice (second loop gets nothing). Write the rule as a comment.
3. Section 2: files are iterators. Open your Day 6 app.log and pull exactly three lines with next(f). Close and reopen to reset — there is no rewind button on a belt.
4. Section 4: your OWN class joins the protocol — a Countdown whose __iter__ returns a generator. Loop over an instance of it. Day 9's dunder story completes: for works on anything that plays the protocol.
5. In one sentence: what does a for loop do when next() raises StopIteration? (It catches it and ends cleanly — the exception is the protocol's "belt is empty" signal, not an error.)`,
        code: `# --- 1: being the for loop
nums = [10, 20, 30]
it = iter(nums)
print(next(it))    # 10
print(next(it))    # 20
print(next(it))    # 30
# print(next(it))  # StopIteration -- uncomment once to see it

# --- 2: iterators exhaust
it2 = iter(nums)
print(list(it2))   # [10, 20, 30]
print(list(it2))   # [] -- spent!

# --- 3: files are iterators
f = open("app.log", encoding="utf-8")
print(next(f).strip())
print(next(f).strip())
f.close()

# --- 4: your class joins the protocol
class Countdown:
    def __init__(self, start):
        self.start = start
    def __iter__(self):
        n = self.start
        while n > 0:
            yield n
            n -= 1

for x in Countdown(3):
    print("T-minus", x)`,
      },
      {
        title: 'Watch it freeze — generator mechanics',
        minutes: 15,
        body: `1. Create \`gen_lab.py\` with the starter code — a generator with loud print statements so you can SEE the pausing. Before running, write down the exact order of output you expect.
2. Run it. The headline observations: "STARTING" prints only at the first next(), not at the call; between yields the function is frozen; "FINISHED" prints during the final, StopIteration-raising next. If any of the three surprised you, run it again stepping through in your head.
3. Prove locals survive the freeze: add a running total variable inside the generator that accumulates across yields, and yield it at the end.
4. Convert: rewrite squares_list (builds a warehouse) as a generator expression, and get the sum of the first 1000 squares without a list: sum(n * n for n in range(1000)).
5. Meet infinity safely: from itertools import count, islice; take the first 5 from naturals = count(1). Then try list(count(1)) — actually, DON'T; write a comment explaining what would happen and why islice makes infinite belts usable.`,
        code: `def noisy_countdown(n):
    print("STARTING the belt")
    while n > 0:
        print("  about to yield", n)
        yield n
        print("  resumed after yielding", n)
        n -= 1
    print("FINISHED -- belt empty")

print("calling the function...")
gen = noisy_countdown(2)
print("...nothing has run yet!")
print("first next():", next(gen))
print("second next():", next(gen))
try:
    next(gen)
except StopIteration:
    print("third next() raised StopIteration")

from itertools import count, islice
naturals = count(1)               # 1, 2, 3, ... forever
first_five = list(islice(naturals, 5))
print(first_five)`,
      },
      {
        title: 'Build the belt line — a streaming log pipeline',
        minutes: 15,
        body: `1. First, manufacture a BIG log: adapt Day 6's make_log.py to write 200_000 lines (bump the range). Note the file size with ls -l.
2. Create \`pipeline_lab.py\` with the starter code — three chained generator stages ending in a frequency count. Run it and note: results appear fast, and memory stays flat no matter the file size.
3. Prove the laziness: add a print("parsing!") inside the parse stage, then run only the first three lines of the pipeline (build the generators, iterate nothing). Silence. Then pull one item with next(). One "parsing!". Demand drives the belt.
4. Compare with the warehouse: write the same logic with lists at each stage (read all lines, filter all, split all). On 200k lines both may finish — now imagine 200 GB and write one sentence on which version survives (and connect it to for-line-in-f from Day 5).
5. Extend the pipeline with one more stage: keep only errors from IPs starting "10." and report the top offender. One new generator line, no other changes — that pluggability is the payoff of belts.`,
        code: `def read_lines(path):
    with open(path, encoding="utf-8") as f:
        for line in f:
            yield line.strip()

def only_errors(lines):
    for ln in lines:
        if " ERROR " in ln:
            yield ln

def extract_ip(lines):
    for ln in lines:
        parts = ln.split()
        yield parts[3]            # the IP field from Day 6's log format

# snap the belts together -- nothing runs yet:
pipeline = extract_ip(only_errors(read_lines("app.log")))

# ...until we consume it:
counts = {}
for ip in pipeline:
    counts[ip] = counts.get(ip, 0) + 1

for ip, n in sorted(counts.items(), key=lambda kv: kv[1], reverse=True):
    print(ip, n)`,
      },
    ],
    practice: [
      {
        title: 'The memory showdown',
        minutes: 20,
        body: `Settle warehouse-vs-belt with numbers. Build \`showdown.py\`.

Goal: compute the sum of squares of the first 10 million integers two ways — (a) build the full list then sum it; (b) sum a generator expression. Measure both: wall time with time.perf_counter (Day 22 formalizes this harness), and peak memory with tracemalloc (start it, run one version, take tracemalloc.get_traced_memory(), reset between runs). Print a two-row comparison table and write the conclusion as a comment: how many times more memory did the warehouse cost, and was it faster or slower?

Constraints: measure the two versions in separate runs or reset tracemalloc carefully between them; report peak (the second number), in MB.

Hints (only if stuck): import tracemalloc; tracemalloc.start(); ...; current, peak = tracemalloc.get_traced_memory(); tracemalloc.stop(). Expect the list to cost hundreds of MB; the generator, kilobytes.`,
      },
    ],
    project: {
      title: 'streamstats — constant-memory file statistics',
      brief: `Build \`streamstats.py\`, a tool that reports statistics for a numbers file of ANY size: count, min, max, mean — in one pass, in constant memory, skipping junk lines (Day 5's resilient-summer rules). Structure it as belts: a generator reading raw lines, a generator that yields successfully-parsed floats (EAFP inside), and a consumer loop that updates running count/min/max/total — no list of values may ever exist. Generate a test file with 1 million values (plus sprinkled junk) to prove it, and verify against sum()/len() on a small file where a warehouse is checkable. Stretch: use islice to add a --preview mode showing the first 5 parsed values. Commit it — Day 14's log analyzer will reuse the read-parse-consume skeleton verbatim.`,
      rubric: [
        'Handles the 1M-value file with flat memory (spot-check with tracemalloc) and one pass',
        'Junk lines skipped and counted via EAFP inside the parsing generator — no pre-checks',
        'Running mean matches sum/len on the small verification file',
        'No stage builds a list; grep for "[" as a sanity pass (comprehensions allowed only in preview mode)',
        'Preview mode uses islice without disturbing the main pass (fresh generator)',
        'Committed with a message that passes the Day 8 test',
      ],
    },
    mistakes: [
      'Expecting the body to run when you call a generator function. Calling builds the belt; only next() (or a for loop) runs code. Print-debug inside one and silence means nobody has pulled yet.',
      'Iterating a generator twice. It exhausts; the second loop silently gets nothing — no error, just wrong results. Recreate it, or materialize ONCE with list() if you truly need two passes.',
      'Calling len() or indexing on a generator. Streams have no length or random access. islice for slicing; count-as-you-go for length; or admit you need a list.',
      'Materializing by reflex: list(gen) then a loop. You just bought the warehouse to use a belt. Feed generators directly to for, sum, max, any.',
      'Using a genexp when you need the data twice (checking "if x in gen" then looping gen). First use consumed part of it. Single-pass means SINGLE pass.',
      'Returning a value with return inside a generator expecting callers to see it. return in a generator just stops the belt (it rides inside StopIteration). Yield results; don\'t return them.',
    ],
    quiz: [
      {
        q: 'g = countdown(3) — the generator function with yield. What has executed?',
        o: [
          'The whole body; g holds the results',
          'The body up to the first yield',
          'Nothing — g is a paused belt; code runs at the first next()',
          'Only the print statements',
        ],
        x: 2,
        w: 'Calling a generator function constructs the generator without running any body code. Execution is demand-driven: each next() runs to the following yield and freezes.',
        revisit: 11,
      },
      {
        q: 'Processing a 50 GB log on a 16 GB machine. Which works?',
        o: [
          'lines = f.readlines(), then loop the list',
          'A chain of generators pulling one line at a time through parse and filter stages',
          'f.read().split("\\n")',
          'Loading it into one giant string and using slicing',
        ],
        x: 1,
        w: 'readlines() and read() materialize the file in memory and die at 16 GB. A generator pipeline holds one item in flight — memory is constant no matter the file size.',
        revisit: 11,
      },
      {
        q: 'evens = (n for n in nums if n % 2 == 0); print(list(evens)); print(list(evens)). Second print?',
        o: [
          'The same even numbers again',
          '[] — the generator was exhausted by the first list()',
          'A TypeError',
          'The odd numbers',
        ],
        x: 1,
        w: 'Generators are single-pass iterators: the first list() drained the belt, and the second finds it empty — silently. The number-one generator bug in real code.',
        revisit: 11,
      },
    ],
    resources: [
      { label: 'Python Tutorial — 9.8/9.9: Iterators, Generators, Generator Expressions', url: 'https://docs.python.org/3/tutorial/classes.html#iterators', type: 'docs', time: '20 min' },
      { label: 'itertools — official docs (skim the recipes section especially)', url: 'https://docs.python.org/3/library/itertools.html', type: 'docs', time: '20 min' },
      { label: 'Functional Programming HOWTO — iterators & generators sections', url: 'https://docs.python.org/3/howto/functional.html', type: 'docs', time: '25 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: due cards', minutes: 10 },
      { activity: 'Concept study: ELI5 + tech — desugar a for loop on paper', minutes: 20 },
      { activity: 'Guided: protocol by hand, freeze-frame, pipeline build', minutes: 45 },
      { activity: 'Practice: the memory showdown', minutes: 20 },
      { activity: 'Project: streamstats', minutes: 15 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'Protocol lab done: manual next() drill, exhaustion rule written, custom iterable class works',
      'Noisy-generator output order predicted correctly (or the miss explained)',
      'Pipeline processes the 200k-line log with a stage added painlessly',
      'Showdown table produced with real memory numbers and a written conclusion',
      'streamstats committed and verified against the small file; quiz ≥ 2/3',
    ],
    connections: {
      back: 'for-line-in-f from Day 5 was this lesson in disguise — files are iterators. The pipeline architecture is Day 6\'s shell pipes rebuilt in Python, and __iter__ completes the dunder-protocol story Day 9 started.',
      forward: 'Day 12 wraps functions around functions the way today chained belts. The streaming mindset returns with money attached: Day 40\'s async streams, Day 88\'s DataLoaders, Day 107\'s token-by-token LLM responses, and Day 113\'s RAG ingestion are all conveyor belts. Day 22 prices the warehouse in Big O terms.',
    },
    flashcards: [
      { f: 'What does yield do?', b: 'Pauses the function, hands out a value, keeps all locals frozen; next() resumes after the yield. Calling the function runs nothing.' },
      { f: 'The iteration protocol?', b: 'iter(x) -> iterator; next(it) -> items; StopIteration ends it. A for loop is exactly this, with the exception caught.' },
      { f: 'Loop a list twice vs an iterator twice?', b: 'List: fine, fresh iterator each loop. Iterator/generator: single-pass — second loop gets nothing, silently.' },
      { f: '[x for ...] vs (x for ...)?', b: 'Brackets build a list now (memory ∝ n); parens build a lazy generator (constant memory, single pass).' },
      { f: 'First 10 items of a generator?', b: 'itertools.islice(gen, 10) — generators can\'t be indexed or sliced directly.' },
      { f: 'Why do generator pipelines use constant memory?', b: 'One item flows through all stages at a time; no stage stores the whole stream.' },
    ],
    deepDive: [
      { label: 'yield as a two-way street', note: 'Generators can also RECEIVE values (gen.send(x)) and delegate (yield from) — the machinery Python\'s async/await (Day 40) was originally built on. Skim the "yield expressions" reference once so Day 40 feels like a reunion.' },
    ],
  },
  {
    id: 'd012', day: 12, week: 2, phase: 1, kind: 'lesson',
    title: 'Closures, Decorators & Functional Style',
    analogy: 'Gift-wrapping functions',
    objectives: [
      'Treat functions as values: store them, pass them, return them from other functions',
      'Explain what a closure captures and predict what an inner function will see',
      'Write decorators (timing, retry) using *args/**kwargs and functools.wraps',
      'Apply functools.lru_cache and measure the speedup on a recursive function',
      'Use sorted with key= and judge when lambda helps versus hurts readability',
    ],
    prereqs: [
      { day: 3, label: 'Functions, scope, *args/**kwargs' },
      { day: 10, label: 'You already used decorators: @dataclass, @property' },
      { day: 11, label: 'Laziness and wrapping behavior' },
    ],
    eli5: `A plain gift is a watch. A wrapped gift is still a watch — but now opening it involves ribbon, paper, and a card that says who it's from. The watch inside is untouched; the *experience around it* changed. A **decorator** gift-wraps a function: same function inside, but now calling it also starts a stopwatch, or retries on failure, or writes a log line. The wrapping is reusable — one \`@timed\` wrapper can wrap any function in your codebase, because the wrapper doesn't care what's inside the box.

Two ideas make the wrapping possible. First: in Python, functions are things — values you can put in a variable, pass to another function, or hand back as a return value, exactly like numbers and lists. Second: a **closure** — when a function is created inside another function, it keeps a backpack containing the variables from its birthplace, even after the birthplace has returned. The wrapper function keeps the original function in its backpack; that's how the gift stays inside the wrapping. You've already been *using* decorators (\`@dataclass\`, \`@property\` yesterday) — today you find out they were never magic, just backpacks and wrapping paper.`,
    why: `Cross-cutting behavior — timing, retries, caching, logging, auth — is the same everywhere: you need it on many functions without editing any of them. Decorators are Python's answer, and the ecosystem runs on them: FastAPI routes are decorators (Day 41), pytest fixtures (Day 19), and your Day 107 LLM client wrapper is essentially today's @retry with backoff attached — network calls to model APIs fail routinely, and retry-wrapping is the difference between a flaky demo and a robust one. Caching via lru_cache is the one-line performance fix interviewers love, and closures explain half the "why does this variable have that value?!" mysteries in real callback-heavy code.`,
    tech: `### Functions are values; closures carry backpacks

\`def shout(s): ...\` creates a function object bound to the name shout — no different from binding a list. So \`f = shout\`, \`funcs = {"loud": shout}\`, and \`apply(shout, data)\` all work. A function defined inside another function can reference the enclosing function's variables (the E in Day 3's LEGB); if the inner function outlives the outer one, those variables ride along in a **closure**:

~~~python
def make_counter():
    count = 0
    def bump():
        nonlocal count
        count += 1
        return count
    return bump
~~~

Each \`make_counter()\` call creates a fresh backpack — two counters don't share state. \`nonlocal\` is the assignment permission slip: without it, \`count += 1\` would create a local (Day 3's shadowing rule, one level up).

### Decorators: the wrapping pattern

A decorator is a function that takes a function and returns a replacement — usually a wrapper that adds behavior, then delegates:

~~~python
import functools, time

def timed(fn):
    @functools.wraps(fn)
    def wrapper(*args, **kwargs):
        t0 = time.perf_counter()
        result = fn(*args, **kwargs)
        ms = (time.perf_counter() - t0) * 1000
        print(fn.__name__, "took", round(ms, 2), "ms")
        return result
    return wrapper
~~~

\`@timed\` above a def is pure sugar for \`slow_fn = timed(slow_fn)\`. The wrapper signature \`(*args, **kwargs)\` (Day 3's collectors) lets one wrapper fit ANY function; it must pass through the return value, or every wrapped function silently returns None. \`functools.wraps\` copies the original's name and docstring onto the wrapper — skip it and stack traces, help(), and debuggers all report "wrapper", which you will hate precisely once.

### The functools toolbox and functional style

\`@functools.lru_cache(maxsize=None)\` memoizes: repeated calls with the same arguments return the stored answer — turning exponential recursive fib into linear (arguments must be hashable; Day 4 explains why lists can't be keys). For style: \`sorted(tasks, key=lambda t: t.due_day)\` — key= takes a function extracting the sort value; a lambda is a one-expression anonymous function perfect here and unreadable beyond that (multi-step logic deserves a def with a name). Prefer comprehensions over map/filter in modern Python; know map/filter exist for reading others' code.`,
    viz: null,
    guided: [
      {
        title: 'Functions in boxes, functions in backpacks',
        minutes: 15,
        body: `1. Create \`week-02/closures_lab.py\` with the starter code. Section 1: functions as values — alias one, store two in a dict, dispatch by key. Notice shout vs shout(): the function itself versus the result of calling it. Mixing those up is a daily-life bug.
2. Section 2: run make_counter twice and confirm the two counters are independent — separate backpacks, packed at creation time.
3. Remove nonlocal, rerun, and read the UnboundLocalError. Connect it in a comment to Day 3's shadowing rule (assignment makes a local unless told otherwise).
4. Section 3: make_multiplier — the classic closure factory. Build double and triple from ONE definition. What exactly is in each backpack? Print double.__closure__[0].cell_contents to literally look inside.
5. Write one sentence: why does the backpack survive after make_multiplier has returned? (The inner function holds a reference; Day 4's object-lifetime rules apply to variables too.)`,
        code: `# --- 1: functions are values
def shout(s):
    return s.upper() + "!"

def whisper(s):
    return s.lower() + "...";

styles = {"loud": shout, "soft": whisper}
print(styles["loud"]("checkpoint saved"))

# --- 2: closures with state
def make_counter():
    count = 0
    def bump():
        nonlocal count
        count += 1
        return count
    return bump

a = make_counter()
b = make_counter()
print(a(), a(), a())   # 1 2 3
print(b())             # 1 -- separate backpack

# --- 3: the factory
def make_multiplier(factor):
    def multiply(x):
        return x * factor
    return multiply

double = make_multiplier(2)
triple = make_multiplier(3)
print(double(10), triple(10))
print(double.__closure__[0].cell_contents)   # peek in the backpack`,
      },
      {
        title: 'Wrap your first gifts — @timed, properly',
        minutes: 15,
        body: `1. Create \`decorators_lab.py\`. Build @timed in three steps, feeling each problem before fixing it. Step 1: write the naive version WITHOUT *args/**kwargs (wrapper() taking nothing) and wrap a function that takes an argument. Watch it explode. Fix with the collectors.
2. Step 2: forget the return (call fn but don't return its result). Wrap a function that returns a value, print the result: None. Fix it. These two bugs are 90% of all broken decorators ever written.
3. Step 3: print slow_add.__name__ — it says "wrapper". Add @functools.wraps(fn) and check again. Now the finished decorator matches the starter code below.
4. Desugar once by hand: define a function plain(), then wrap it without the @ sign: plain = timed(plain). Verify @ was pure sugar.
5. Wrap three different functions — one fast, one slow (time.sleep(0.3)), one taking kwargs — with the SAME @timed. One wrapper fits all: that's what *args/**kwargs bought.`,
        code: `import functools
import time

def timed(fn):
    @functools.wraps(fn)
    def wrapper(*args, **kwargs):
        t0 = time.perf_counter()
        result = fn(*args, **kwargs)
        ms = (time.perf_counter() - t0) * 1000
        print("[timed]", fn.__name__, round(ms, 2), "ms")
        return result
    return wrapper

@timed
def slow_add(a, b):
    time.sleep(0.3)
    return a + b

print(slow_add(2, 3))        # timing line, then 5
print(slow_add.__name__)     # "slow_add" thanks to wraps`,
      },
      {
        title: '@retry and @lru_cache — wrappers that earn money',
        minutes: 15,
        body: `1. Still in decorators_lab.py: build @retry from the starter code. The flaky() function fails randomly ~60% of the time — exactly how networks behave. Run it several times; watch retries save the call.
2. Note the decorator-with-arguments shape: retry(times=3) is a function returning a decorator returning a wrapper — three layers. Trace which layer runs at decoration time vs call time (add prints if unsure). This shape is everywhere in libraries; recognize it rather than memorizing it.
3. lru_cache: implement naive_fib(n), time naive_fib(32) with your own @timed. Then add @functools.lru_cache(maxsize=None) above it and time again. Record both numbers — you should see roughly a thousand-fold difference. One line. (Day 27 explains the exponential tree you just pruned; Day 34 builds memoization by hand.)
4. sorted-with-key reps: given tasks = [("rope", 2), ("map", 1), ("tent", 3)], sort by the number with key=lambda t: t[1], then descending. Then sort your Day 9 Flashcards by due_in.
5. Judgment line in a comment: one place lambda was perfect here, and one kind of place it wouldn\'t be (multi-line logic — give it a def and a name).`,
        code: `import functools
import random
import time

def retry(times=3, delay=0.1):
    def decorator(fn):
        @functools.wraps(fn)
        def wrapper(*args, **kwargs):
            for attempt in range(1, times + 1):
                try:
                    return fn(*args, **kwargs)
                except Exception as e:
                    print("attempt", attempt, "failed:", e)
                    if attempt == times:
                        raise
                    time.sleep(delay)
        return wrapper
    return decorator

@retry(times=3)
def flaky():
    if random.random() < 0.6:
        raise ConnectionError("network hiccup")
    return "success!"

print(flaky())

@functools.lru_cache(maxsize=None)
def fib(n):
    if n < 2:
        return n
    return fib(n - 1) + fib(n - 2)

print(fib(60))    # instant -- try THAT without the cache`,
      },
    ],
    practice: [
      {
        title: 'The @logged decorator',
        minutes: 20,
        body: `Build the third member of your wrapper toolkit, unguided.

Goal: @logged appends one line per call to calls.log (Day 5's append mode): timestamp, function name, arguments, and the returned value — or the exception type if it raised (re-raise it after logging; never swallow). Then stack it: put @timed AND @logged on one function and check both effects fire.

Constraints: use functools.wraps; the log line must include the real function name even when stacked under @timed; exceptions must propagate after logging.

Hints (only if stuck): repr(args) and repr(kwargs) make loggable strings. For stacking order: decorators apply bottom-up — @timed above @logged wraps the logged version. Try both orders and read the log to see the difference (this exact stacking question is a favorite interview aside).`,
      },
    ],
    project: {
      title: 'wrappers.py — your instrumentation toolkit',
      brief: `Assemble today's work into a module you will import for the rest of the program: \`wrappers.py\` containing @timed, @retry(times, delay), and @logged, each with docstrings and functools.wraps, plus a demo under a main guard exercising all three (including a stacked example and a flaky function saved by retry). Then put it to work: wrap your streamstats parsing run (Day 11) with @timed, and wrap the tracker's save function with @logged. Commit. On Day 107 you will meet this module's grown-up sibling — an LLM API client wrapped with retry/backoff/timing — and recognize every moving part.`,
      rubric: [
        'All three decorators preserve name/docstring (verified via __name__ and help())',
        'Wrapped functions return their values and propagate exceptions correctly',
        '@retry gives up after N attempts and re-raises the final exception',
        'Stacked decorators work; the order difference is demonstrated in the demo',
        'streamstats and tracker actually import from wrappers.py (no copy-paste)',
        'Committed with a clean message',
      ],
    },
    mistakes: [
      'Writing shout when you mean shout() or vice versa. Without parens you have the function object; with them, its result. Passing shout() to sorted\'s key= calls it immediately and passes the result — usually a crash.',
      'A wrapper that forgets to return fn(...)\'s result. Every function you wrap silently starts returning None. Always capture and return.',
      'Wrapper signature that isn\'t (*args, **kwargs). Your decorator only fits functions with one exact shape and breaks on everything else.',
      'Skipping functools.wraps. Tracebacks, help(), and logs all report "wrapper" for every decorated function — debugging misery on a delay timer.',
      'Assigning to a closed-over variable without nonlocal. You get UnboundLocalError or a shadow local — Day 3\'s rule operating at the enclosing level.',
      'lru_cache on functions with list/dict arguments (unhashable — TypeError) or on functions with side effects (the effect fires once, then never again). Cache pure computations only.',
    ],
    quiz: [
      {
        q: '@timed above def slow(): is exactly equivalent to…',
        o: [
          'slow = timed(slow) after the def',
          'timed(slow()) — calling slow inside timed',
          'Registering slow to run at import time',
          'Inheriting slow from timed',
        ],
        x: 0,
        w: 'The @ syntax is sugar: define the function, pass it to the decorator, rebind the name to what comes back. No magic — which is why you could desugar it by hand.',
        revisit: 12,
      },
      {
        q: 'make_counter() returns bump, which uses count. After make_counter returns, count is…',
        o: [
          'Garbage-collected — bump crashes on first call',
          'Alive in bump\'s closure; each make_counter() call gets an independent one',
          'A global shared by all counters',
          'Reset to 0 on every bump() call',
        ],
        x: 1,
        w: 'The inner function holds a reference to its enclosing variables — the backpack. Each factory call packs a fresh one, which is why a and b counted independently.',
        revisit: 12,
      },
      {
        q: 'A wrapped function returns None even though its body returns a value. Most likely cause?',
        o: [
          'functools.wraps was omitted',
          'The wrapper called fn(*args, **kwargs) but didn\'t return the result',
          'The decorator needs arguments',
          'lru_cache swallowed the value',
        ],
        x: 1,
        w: 'The classic decorator bug: the wrapper runs the function, drops the result, and implicitly returns None. wraps omission breaks names, not values.',
        revisit: 12,
      },
    ],
    resources: [
      { label: 'functools — official docs (wraps, lru_cache)', url: 'https://docs.python.org/3/library/functools.html', type: 'docs', time: '20 min' },
      { label: 'Sorting HOWTO — key functions done right', url: 'https://docs.python.org/3/howto/sorting.html', type: 'docs', time: '15 min' },
      { label: 'Functional Programming HOWTO — the wider ideas', url: 'https://docs.python.org/3/howto/functional.html', type: 'docs', time: '20 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: due cards (LEGB from Day 3 will resurface)', minutes: 10 },
      { activity: 'Concept study: ELI5 + tech — desugar one @ by hand on paper', minutes: 20 },
      { activity: 'Guided: closures, @timed build, @retry + lru_cache', minutes: 45 },
      { activity: 'Practice: the @logged decorator', minutes: 20 },
      { activity: 'Project: wrappers.py toolkit', minutes: 15 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'Both closure factories built; backpack inspected via __closure__',
      '@timed built through all three deliberate-bug steps',
      'fib timing recorded with and without lru_cache',
      '@logged works stacked, with exceptions logged and re-raised',
      'wrappers.py committed and imported by two real scripts; quiz ≥ 2/3',
    ],
    connections: {
      back: 'Closures are Day 3\'s LEGB rule bearing fruit — the E finally matters. *args/**kwargs from Day 3 became load-bearing. And @dataclass/@property from Day 10 just lost their mystery: functions transforming functions/classes, nothing more.',
      forward: 'pytest fixtures (Day 19) and FastAPI routes (Day 41) are decorators; Day 27 revisits lru_cache when recursion trees get pruned; Day 34 builds memoization by hand. Day 107\'s production LLM client is @retry with exponential backoff and a budget — today\'s wrapper, promoted to revenue-critical.',
    },
    flashcards: [
      { f: 'What is a closure?', b: 'An inner function plus the captured variables of its birthplace — the backpack survives after the outer function returns.' },
      { f: '@decorator is sugar for…?', b: 'fn = decorator(fn) — define, transform, rebind. No magic.' },
      { f: 'Two classic wrapper bugs?', b: '(1) not returning fn\'s result — everything returns None; (2) fixed signature instead of *args/**kwargs.' },
      { f: 'What does functools.wraps do?', b: 'Copies name/docstring/metadata from the wrapped function onto the wrapper — keeps tracebacks and help() honest.' },
      { f: 'What does lru_cache require of arguments?', b: 'Hashability (no lists/dicts) — and the function should be pure; side effects fire only on cache misses.' },
      { f: 'nonlocal does what?', b: 'Lets an inner function ASSIGN to an enclosing variable instead of creating a shadow local.' },
    ],
    deepDive: [
      { label: 'Decorators with state: class-based decorators', note: 'A class with __call__ can decorate too, holding state in self (call counts, rate limits). Ties Day 9 to today — try rewriting @timed as a class in ten lines.' },
    ],
  },
  {
    id: 'd013', day: 13, week: 2, phase: 1, kind: 'lesson',
    title: 'Regex & Text Processing',
    analogy: 'Find-and-replace with superpowers',
    objectives: [
      'Read and write patterns using literals, character classes, quantifiers, groups, and anchors',
      'Choose correctly among re.search, re.findall, re.finditer, and re.sub',
      'Extract structured fields from log lines using named groups',
      'Explain greedy vs lazy matching and fix a pattern that over-matches',
      'Judge when regex is the wrong tool and use string methods or a parser instead',
    ],
    prereqs: [
      { day: 5, label: 'String methods and text files' },
      { day: 11, label: 'Streaming lines (today\'s patterns plug into those pipelines)' },
    ],
    eli5: `Your editor's find box matches exact text: search "cat" and you get "cat". A **regular expression** is a find box that speaks in *shapes*: "find me a 4-digit number", "find anything shaped like an email address", "find ERROR, but only at the start of a line". You describe the shape once — \`\\d\` means "any digit", \`+\` means "one or more of the previous thing", so \`\\d+\` is "a run of digits" — and the regex engine hunts every match in a haystack of any size.

Think of it as describing a suspect to a sketch artist instead of showing a photo. A photo ("cat") matches one face. A description ("digits, then a dash, then digits") matches every phone number, invoice ID, or date range that fits the shape. **Groups** — parentheses — add a second superpower: capture the parts you care about. "Match date-space-level-space-message, and hand me the three pieces separately" turns a raw log line into structured data, one line of code. The catch: regex is a language of pure punctuation, write-only if you're careless. Today you learn to read it, write it politely, and — just as important — recognize the jobs it should refuse.`,
    why: `Text is the substrate of AI engineering: cleaning documents before chunking (Day 114), scrubbing PII with redaction patterns (Day 132's guardrails are regex at the front line), extracting fields from semi-structured LLM output when JSON mode isn't available, and parsing logs during incidents (Day 172 — the customer's log format is always slightly weird, and the FDE who can regex it live looks like a wizard). Tomorrow's checkpoint project runs on today's named groups. And "write a pattern to match X" still appears in screening interviews because it cheaply reveals who has processed real text.`,
    tech: `### The pattern language, in working order

**Literals** match themselves: \`ERROR\`. **Character classes** match one character from a set: \`[abc]\`, ranges \`[0-9]\`, negation \`[^,]\` (anything but a comma), and the shorthands \`\\d\` (digit), \`\\w\` (word character: letters, digits, underscore), \`\\s\` (whitespace), with capitalized negations (\`\\D\`, \`\\W\`, \`\\S\`). The wildcard \`.\` matches any character except newline. **Quantifiers** repeat the previous item: \`*\` (0+), \`+\` (1+), \`?\` (0 or 1), \`{3}\` (exactly 3), \`{1,3}\` (1 to 3). **Anchors** match positions, not characters: \`^\` start, \`$\` end, \`\\b\` word boundary (\`\\berror\\b\` won't match "terrors"). **Groups** \`( )\` capture what they enclose, numbered from 1; **named groups** \`(?P<level>...)\` capture into a name — always prefer names when extracting more than one field. Alternation \`a|b\` picks either; escape metacharacters to match them literally: \`\\.\` for a real dot. Always write patterns as raw strings — \`r"\\d+"\` — so Python's own backslash rules stay out of the way.

### The re module's four verbs

\`re.search(pat, s)\` finds the FIRST match anywhere, returning a match object or None — so the idiom is walrus-free and simple: \`m = re.search(...)\`, then \`if m:\` before using \`m.group("level")\`. \`re.findall\` returns all matches as strings (or tuples when the pattern has groups — a classic surprise). \`re.finditer\` yields match objects lazily — the generator-friendly choice for big streams (Day 11). \`re.sub(pat, repl, s)\` replaces matches, with \`\\g<name>\` backreferences in the replacement. Compile once with \`pat = re.compile(r"...")\` when a pattern runs in a loop.

### Greedy vs lazy, and taste

Quantifiers are **greedy**: they grab the longest match that still lets the pattern succeed. On \`"<b>bold</b> and <i>italic</i>"\`, the pattern \`<.*>\` matches the WHOLE string — the \`.*\` sprinted to the last \`>\`. The lazy variant \`<.*?>\` (quantifier + \`?\`) takes the shortest match: each tag separately. Better still: be specific — \`<[^>]+>\` ("one or more non-> characters") says what you mean and outruns both. Judgment rules: if \`in\`, \`.startswith\`, or \`.split\` solves it, regex is showing off; if the format is a real language with nesting (HTML, JSON, Python), regex structurally cannot parse it — use a real parser (json.loads exists; Day 41 gives you more). Regex earns its keep in the middle: flat, patterned text. For anything beyond one line of pattern, use \`re.VERBOSE\` to add whitespace and comments — patterns are code and deserve readability too.`,
    viz: null,
    guided: [
      {
        title: 'Shapes, not photos — first patterns',
        minutes: 15,
        body: `1. Create \`week-02/regex_lab.py\` with the starter code. Run section 1 and match each result to its pattern. For each of the five patterns, say the shape ALOUD in English before looking at the output ("one or more digits", "the word ERROR at the start of a line"...). Verbalizing patterns is the actual skill.
2. Predict-then-run: before section 2 executes, write what findall will return for each call as a comment. The \\berror\\b vs error distinction ("terrors"!) is the one to get right.
3. Modify: change the year pattern to match BOTH 2-digit and 4-digit years (quantifier range {2,4}).
4. Add one pattern of your own: match a version string like v1.12.3 (hint: escape the dots, or they match anything).
5. Keep the file open — the next two exercises extend it.`,
        code: `import re

text = """2026-08-11 ERROR db timeout after 30s
2026-08-11 INFO user ada logged in from 10.0.0.5
2026-08-12 WARN retrying request id=4471
errors and terrors are different words
contact: ada@example.com or grace@lab.example.org"""

# --- 1: five shapes
print(re.findall(r"\\d+", text))              # runs of digits
print(re.findall(r"\\d{4}-\\d{2}-\\d{2}", text)) # ISO dates
print(re.findall(r"^ERROR", text))            # nothing! ^ = start of STRING...
print(re.findall(r"(?m)^\\d{4}.*ERROR.*$", text)) # (?m): ^ = start of each LINE
print(re.findall(r"\\berror\\b", text, re.IGNORECASE))

# --- 2: predict these before running
print(re.findall(r"error", text))             # matches inside "terrors"?
print(re.findall(r"\\w+@[\\w.]+", text))        # rough email shape
print(re.findall(r"id=\\d+", text))`,
      },
      {
        title: 'Groups — from matching to extracting',
        minutes: 15,
        body: `1. Extend the lab with the starter code below: a log-line pattern with three NAMED groups. Run it and inspect the dict each line produces.
2. Walk the pattern left to right and annotate every piece with a comment: what does (?P<date>\\d{4}-\\d{2}-\\d{2}) capture? Why [A-Z]+ for the level? Why does message use .* and why is it safe HERE (anchored at the end, nothing after it)?
3. The if m: guard matters — feed the pattern the junk line and confirm it returns None instead of crashing. Never call .group on a None: that AttributeError is the most common regex crash in production code.
4. re.sub practice: redact both email addresses in the text to <redacted>, then a harder one: keep the domain, redacting only the user part (capture the domain in a group, use \\g<domain> in the replacement). PII redaction, ten weeks early.
5. Convert your findall calls from exercise 1 into finditer where you use the match objects — print each match's .start() position too. finditer is the streaming-friendly form you'll want tomorrow.`,
        code: `line_pat = re.compile(
    r"(?P<date>\\d{4}-\\d{2}-\\d{2}) (?P<level>[A-Z]+) (?P<message>.*)"
)

for line in text.splitlines():
    m = line_pat.search(line)
    if m:                                  # junk lines return None
        print(m.groupdict())
    else:
        print("no match:", line[:40])

# redaction with a kept group:
redacted = re.sub(r"\\w+@(?P<domain>[\\w.]+)", r"<user>@\\g<domain>", text)
print(redacted)`,
      },
      {
        title: 'Greed, laziness & verbose patterns',
        minutes: 15,
        body: `1. New section in the lab: run the greedy-vs-lazy demo on the tags string. Three patterns, three results — greedy .*, lazy .*?, and the specific [^>]+. Write one line on why the specific version is the professional default (it can't backtrack pathologically and it documents intent).
2. Feel the over-match in realistic data: extract quoted strings from the config line with "(.*)" (wrong — one giant match) then "([^"]*)" (right). Quoted-field extraction is where greed bites everyone once.
3. Rewrite the log-line pattern from exercise 2 in re.VERBOSE form using the starter below — same pattern, now with comments and breathing room. This is how patterns get code-reviewed.
4. When NOT to use regex, hands-on: try to imagine matching nested brackets like ((a(b))c) — write in a comment why no regex can count nesting depth (finite automata have no stack). Then note the right tools: json.loads for JSON, an HTML parser for HTML.
5. Speed habit: for the pattern used in a loop over 200k lines tomorrow, confirm you compiled it once outside the loop.`,
        code: `tags = "<b>bold</b> and <i>italic</i>"
print(re.findall(r"<.*>", tags))     # greedy: one huge match
print(re.findall(r"<.*?>", tags))    # lazy: shortest matches
print(re.findall(r"<[^>]+>", tags))  # specific: says what it means

config = 'name="tracker" version="1.2" author="ada"'
print(re.findall(r'"(.*)"', config))    # greedy disaster
print(re.findall(r'"([^"]*)"', config)) # correct fields

line_pat_verbose = re.compile(r"""
    (?P<date>\\d{4}-\\d{2}-\\d{2})   # ISO date
    \\s
    (?P<level>[A-Z]+)              # INFO / WARN / ERROR
    \\s
    (?P<message>.*)                # everything else on the line
""", re.VERBOSE)`,
      },
    ],
    practice: [
      {
        title: 'The extraction gauntlet',
        minutes: 20,
        body: `Build \`gauntlet.py\` against the messy text below (paste it as a triple-quoted string):

"Order #4471 shipped to ada@example.com on 2026-08-11. Card ending 4242. Support: +1-555-0134 or +44 20 7946 0958. Order #4472 pending. Ref: v2.1.0-beta. Visit https://status.example.com/incidents?id=99 for updates. Contact grace.hopper@lab.example.org (backup: g.hopper@navy.mil)."

Goal: extract, each with its own compiled pattern: (1) all order numbers; (2) all email addresses — including dotted user parts; (3) all dates; (4) the URL; (5) all phone numbers (both formats — this one is genuinely hard; get the two shown, don't chase perfection); then (6) produce a PII-safe version: emails and card reference redacted, order numbers kept.

Constraints: raw strings everywhere; named groups where you extract sub-parts; every pattern preceded by a comment stating its shape in English.

Hints (only if stuck): phone numbers — alternation of two explicit shapes beats one clever mega-pattern. Perfect email regex doesn't exist (truly matching the spec takes pages); "good enough for this text" is the professional answer — write down that lesson.`,
      },
    ],
    project: {
      title: 'logparse.py — the parser Day 14 will import',
      brief: `Build tomorrow's engine today: \`logparse.py\` with a compiled VERBOSE pattern for the app.log format from Day 6 (date, time, level, IP, message) using named groups; a function \`parse_line(line)\` returning the groupdict (with the time field split out) or None for junk; and \`parse_lines(lines)\` — a GENERATOR (Day 11) that takes an iterable of lines and yields parsed dicts, silently counting junk lines in a parse_lines.skipped attribute or returned counter. Include a main-guard demo running it over app.log via a streaming pipeline and printing the first 5 parsed dicts (islice) plus the junk count. Add asserts for three sample lines (one of each level) and one junk line — your first taste of Day 18\'s testing habit. Commit it.`,
      rubric: [
        'Pattern is re.VERBOSE with a comment per field and compiled once at module level',
        'parse_line returns a dict with date, time, level, ip, message keys — or None, never a crash',
        'parse_lines is a true generator: works inside an islice pipeline without reading the whole file',
        'Junk lines counted, not raised or printed per-line',
        'All four asserts pass; running the module directly demos on real app.log',
        'Committed — Day 14 imports this file unchanged',
      ],
    },
    mistakes: [
      'Forgetting the r prefix. "\\d" survives by luck but "\\b" becomes a backspace character and your word-boundary pattern silently never matches. Raw strings for every pattern, no exceptions.',
      'Calling .group() on the result of a failed search. re.search returns None on no-match; guard with if m: first. The AttributeError-on-None is the signature regex crash.',
      'Using .* between fields and wondering why it swallowed half the line. Greedy quantifiers grab maximally; prefer the specific class ([^,]+, [^>]+) that states what the field CAN contain.',
      'findall with groups returning tuples (or just the group) when you expected whole matches. Groups change findall\'s return shape — use finditer with .group(0) when you want full matches AND groups.',
      'Parsing HTML/JSON/nested anything with regex. No regex can count nesting. json.loads and real parsers exist; regex handles flat, line-shaped text.',
      'Gold-plating patterns to handle every theoretical input (the "perfect email regex"). Match the data you actually have, guard the None case, count the misses — the junk counter tells you if reality disagrees.',
    ],
    quiz: [
      {
        q: 'Which strings does r"\\d{4}-\\d{2}" fully match?',
        o: [
          '"2026-08" and "1999-12"',
          '"202-08"',
          '"20260-8"',
          'Any text containing a dash',
        ],
        x: 0,
        w: '\\d{4} demands exactly four digits, then a literal dash, then exactly two: the year-month shape. The other options break the counts.',
        revisit: 13,
      },
      {
        q: 'On "<b>hi</b>", the pattern <.*> matches…',
        o: [
          '"<b>" only',
          '"<b>" and "</b>" separately',
          'The entire "<b>hi</b>" — greedy .* runs to the LAST >',
          'Nothing — dots don\'t match letters',
        ],
        x: 2,
        w: 'Greedy quantifiers take the longest match that still succeeds, so .* sprints to the final >. Lazy .*? or the specific [^>]+ gives the per-tag matches.',
        revisit: 13,
      },
      {
        q: 'You need each match\'s captured fields while streaming a 5 GB log. Best verb?',
        o: [
          're.findall on the whole file read into memory',
          're.finditer per line inside a generator pipeline',
          're.sub with a print in the replacement',
          'str.split(" ") on every line',
        ],
        x: 1,
        w: 'finditer yields match objects lazily and composes with Day 11\'s constant-memory pipelines; findall-on-everything is the warehouse move that dies at scale.',
        revisit: 11,
      },
    ],
    resources: [
      { label: 'Python Regular Expression HOWTO (the official tutorial)', url: 'https://docs.python.org/3/howto/regex.html', type: 'docs', time: '40 min' },
      { label: 're module — official reference (keep open while writing patterns)', url: 'https://docs.python.org/3/library/re.html', type: 'docs', time: '15 min' },
      { label: 'Automate the Boring Stuff — Ch. 7: Pattern Matching with Regular Expressions', url: 'https://automatetheboringstuff.com/2e/chapter7/', type: 'book', time: '35 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: due cards', minutes: 10 },
      { activity: 'Concept study: ELI5 + tech — say five patterns aloud in English', minutes: 20 },
      { activity: 'Guided: shapes, groups, greed & verbose', minutes: 45 },
      { activity: 'Practice: the extraction gauntlet', minutes: 20 },
      { activity: 'Project: logparse.py for tomorrow', minutes: 15 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'All three labs run with predictions written before outputs',
      'Gauntlet extracts all six targets; the "good enough" lesson written down',
      'logparse.py asserts pass; streaming demo works on app.log',
      'Redaction exercise produces the PII-safe text with domains kept',
      'Quiz ≥ 2/3 (redo the greed demo if you missed question 2)',
    ],
    connections: {
      back: 'Regex picks up where Day 5\'s string methods stopped — split and startswith for structure you know, patterns for structure you must DESCRIBE. parse_lines is a Day 11 conveyor belt with a pattern inside, and the raw log is Day 6\'s own app.log.',
      forward: 'Day 14\'s analyzer imports logparse.py unchanged. Redaction patterns return as Day 132\'s PII guardrails; log forensics with patterns is Day 172\'s customer-debugging bread and butter; and when LLMs emit almost-structured text, Day 110 pairs schema validation with exactly these extraction fallbacks.',
    },
    flashcards: [
      { f: '\\d, \\w, \\s mean…?', b: 'Digit, word character (letter/digit/underscore), whitespace. Capitals negate: \\D, \\W, \\S.' },
      { f: 'Why raw strings for patterns?', b: 'r"\\b" keeps the backslash for the regex engine; "\\b" is a backspace character — silent pattern death.' },
      { f: 'Greedy vs lazy vs specific?', b: '.* grabs longest, .*? shortest, [^X]+ states what the field contains — prefer specific.' },
      { f: 'search vs findall vs finditer?', b: 'search: first match object or None. findall: all as strings/tuples. finditer: lazy match objects — streaming-friendly.' },
      { f: 'Named group syntax and extraction?', b: '(?P<level>[A-Z]+) in the pattern; m.group("level") or m.groupdict() to extract.' },
      { f: 'When must you NOT use regex?', b: 'Nested formats (HTML, JSON, code) — regex can\'t count depth. Use a real parser; regex is for flat, patterned text.' },
    ],
    deepDive: [
      { label: 'Catastrophic backtracking', note: 'Patterns like (a+)+$ on a long non-matching string can run for centuries — ambiguous nesting makes the engine try exponential paths. This is a real DoS class (ReDoS). The fix is the habit you learned today: specific classes over stacked greedy quantifiers.' },
    ],
  },
  {
    id: 'd014', day: 14, week: 2, phase: 1, kind: 'review',
    title: 'Week 2 Checkpoint: Log Analyzer',
    analogy: 'Second checkpoint',
    objectives: [
      'Recall Week 2 material from memory: git, classes, dataclasses, generators, decorators, regex',
      'Rebuild the week\'s core patterns on a blank page and diff against reality',
      'Build an object-oriented, streaming log analyzer from a spec, reusing Day 13\'s parser',
      'Ship it with a clean, story-telling git history',
    ],
    prereqs: [
      { day: 8, label: 'Git (clean history is graded)' },
      { day: 10, label: 'Dataclasses and composition' },
      { day: 11, label: 'Generator pipelines' },
      { day: 13, label: 'logparse.py (today\'s engine)' },
    ],
    eli5: `Second checkpoint on the trail — and this one has a twist. At the first checkpoint you repacked the bag you'd been carrying for a week. This week you didn't just collect more gear; you built *machines*: a time machine (git), blueprints (classes), conveyor belts (generators), gift-wrap (decorators), and a sketch-artist's eye (regex). Machines rust differently than facts. You don't check a machine by reciting its manual — you check it by *running it on a real job* and seeing what grinds.

So today's checkpoint is a real job: a server has been writing a log for weeks — thousands of lines, most routine, some alarming, some junk. Your task is the analyst's: stream through it without loading it whole (belts), parse each line into structured objects (blueprints + the sketch artist), and produce the report a human actually wants — which errors dominate? which IPs are hammering us? — with a commit history that tells the story of how you built it (time machine). Every machine from the week, one assembly. First, though: flashcards and a blank page. Recall before reference — the checkpoint rule, forever.`,
    why: `This project is a rite of passage because it's REAL — "analyze this log and tell me what's wrong" is a task you will do professionally dozens of times, including under incident pressure with a customer watching (Day 172). It's also the week's material proving it composes: classes holding parsed data, generators keeping memory flat, regex doing extraction, git making the work reviewable. That composition is what interviews probe with take-home projects, and what Day 21 will formalize into a shipped, tested package. The recall drills matter just as much: Week 2's abstractions (closures, protocols) decay fastest without retrieval.`,
    tech: `### Review protocol (first 45 minutes, before any building)

Same order as Day 7, sharpened. (1) **Deck drill**: all due cards, Weeks 1–2, answered aloud, misses re-piled and re-drilled; try to beat your Day 7 miss count — it's in your journal. (2) **Blank-page protocol**, five prompts from memory in a fresh recall2.py: a dataclass with a default_factory field; a generator function and the rule for when its body runs; the three-layer @timed decorator with wraps; a compiled named-group pattern for "LEVEL: message" lines; and the git command sequence from edit to committed (with the two diff variants). (3) Diff against your week's files; harvest FORGOT lines into the journal. (4) Cumulative quiz — every miss maps to a revisit day; schedule them.

### The analyzer spec

Build in \`week-02/analyzer/\` as a small composed system (Day 10's Lego, not one blob):

- **LogEntry** — a dataclass: date, time, level, ip, message. Built via \`LogEntry(**d)\` from Day 13's parse dicts.
- **LogReader** — wraps a path; its \`entries()\` method is a generator: streams lines (Day 11's read pattern), feeds them through \`logparse.parse_lines\`, yields LogEntry objects, and tracks a junk-line count. No list of all entries may ever exist.
- **Report** — consumes an entry stream once and accumulates: counts by level, top-5 error messages, top-5 IPs overall, plus the junk count. Render as aligned text via a \`render()\` method (f-string width specs like {n:>5} are worth two minutes of docs).
- **analyzer.py** — the CLI face: takes the log path as a command-line argument (sys.argv[1] is fine today; argparse arrives Day 16), wires reader into report, prints. Wrap the run with your @timed from wrappers.py.

Test data: regenerate app.log at 200k+ lines with Day 6's generator script, and hand-append a few junk lines. **Git discipline is graded**: build in 4–6 commits that tell the story — scaffold, LogEntry + reader, report, CLI + polish — each message passing the "if applied…" test. A reviewer reading \`git log --oneline\` should follow your reasoning without opening a single diff.`,
    viz: null,
    guided: [
      {
        title: 'Deck drill + blank-page protocol',
        minutes: 25,
        body: `1. Flashcards first: every due card from Weeks 1–2, answered aloud before flipping. Two piles, honest hesitation counts as a miss. Re-drill the miss pile twice. Record the count next to Day 7\'s in journal.md — the trend is the point.
2. Blank page: close everything. In recall2.py write from memory the five prompts from the tech section. Run what's runnable; let errors teach.
3. Diff against your real files from the week. Every discrepancy becomes a # FORGOT line; copy them to the journal. Common finds: forgotten functools.wraps, missing default_factory, the r-prefix on patterns, diff vs diff --staged.
4. For your two worst FORGOT items, write the pattern out correctly one extra time, by hand.
5. Time-box the whole drill to 25 minutes — imperfect recall harvested beats perfect notes reread.`,
      },
      {
        title: 'Warm up the machines — parser smoke test',
        minutes: 10,
        body: `1. Regenerate the big log: bump make_log.py to 200_000 lines and run it. Append 3 junk lines by hand (echo "not a log line" >> app.log — Day 6 reps).
2. Smoke-test yesterday's engine before building on it: python logparse.py should run its demo — first five parsed dicts plus the junk count. If anything fails, fix logparse.py FIRST and commit the fix separately ("Fix logparse junk handling for empty lines" or similar).
3. In the REPL, time one full streaming pass: import your parser, run sum(1 for _ in parse_lines(open("app.log", encoding="utf-8"))) — note the seconds and the fact that memory stayed flat.
4. Sketch the analyzer's three components on paper with arrows: path -> LogReader.entries() -> Report.consume() -> render(). Thirty seconds of diagram saves thirty minutes of tangle — a habit that scales all the way to Day 165's architecture docs.`,
      },
    ],
    practice: [
      {
        title: 'Git story check',
        minutes: 10,
        body: `Before starting the project, rehearse the history you intend to write. In your journal, draft the 4–6 commit messages you EXPECT to make for the analyzer, in order, each finishing "if applied, this commit will…". Then, as you build, hold yourself to committing at those seams (adjusting is fine; the plan is the practice).

After the build: run git log --oneline and compare against the plan. Score yourself: did any commit mix two stories? Would a stranger follow the sequence? Fix nothing retroactively today — just observe and note one improvement for Day 21\'s shipped project.

Hints: the natural seams are the component boundaries — that\'s not a coincidence; commits and components both follow "one responsibility".`,
      },
    ],
    project: {
      title: 'The log analyzer',
      brief: `Build the analyzer exactly to the tech-section spec: LogEntry dataclass, streaming LogReader composed around Day 13\'s parse_lines, an accumulate-once Report with counts by level, top-5 error messages, top-5 IPs, junk count, and an aligned-text render; CLI entry taking the log path, run wrapped in @timed; verified on a 200k-line log with hand-planted junk. Then the analyst's minute: read your own report and write three sentences in journal.md answering "what would I tell the team?" (which error dominates, which IP looks suspicious, what you'd investigate next). The tool is the deliverable; the reading of it is the job. Commit history per the plan — it is graded as part of the project.`,
      rubric: [
        'Processes 200k+ lines in one streaming pass — no list of all entries anywhere (grep for readlines/list( to self-audit)',
        'LogEntry is a dataclass built from parse dicts; Report consumes the stream exactly once',
        'Report shows counts by level, top-5 error messages, top-5 IPs, and the junk count, with aligned columns',
        'Junk lines counted and reported, never crashing the run',
        'git log --oneline reads as a 4–6 commit story matching component seams',
        'The three-sentence analyst\'s summary is written and specific (names the top error and IP)',
      ],
    },
    mistakes: [
      'Building first, reviewing later ("the project is the review"). The recall drills are the review; the project is the integration test. Skip the drills and Week 2\'s abstractions quietly rot until Day 21 exposes it.',
      'Materializing the stream for convenience (entries = list(reader.entries()) "just to check the length"). One reflex list() and constant memory is gone. Count as you consume.',
      'Consuming the generator twice — once for levels, once for IPs — and getting empty second results (Day 11\'s exhaustion rule). One pass, all accumulators updated together.',
      'Re-compiling the regex per line, or worse, re-writing the pattern inline instead of importing logparse.py. You built the engine yesterday precisely so today composes it.',
      'One giant analyze() function instead of Reader/Report components. It works — and it\'s unreviewable, untestable (Day 18 will want components), and un-commit-able at clean seams.',
      'Commit messages written after the fact as "add analyzer stuff". You drafted the story in advance; the history should read like it.',
    ],
    quiz: [
      {
        q: 'Report needs level counts AND top IPs from reader.entries(). Correct structure?',
        o: [
          'Loop the generator twice, once per statistic',
          'One loop updating both accumulators per entry — generators are single-pass',
          'Convert to a list and loop that twice',
          'Open the file twice inside Report',
        ],
        x: 1,
        w: 'A generator exhausts after one pass — the second loop would silently see nothing (Day 11). Streaming design means one pass feeding every accumulator; a list would work but abandons constant memory.',
        revisit: 11,
      },
      {
        q: 'LogEntry(**d) where d = {"date": ..., "time": ..., "level": ..., "ip": ..., "message": ...} does what?',
        o: [
          'Passes the dict as one positional argument',
          'Unpacks the dict into keyword arguments matching the dataclass fields',
          'Creates a dict subclass',
          'Fails — dataclasses only take positional arguments',
        ],
        x: 1,
        w: 'The ** operator unpacks a dict into keyword arguments (Day 3\'s **kwargs, from the calling side) — the standard bridge from parsed dicts to typed objects.',
        revisit: 10,
      },
      {
        q: 'Your word-boundary pattern works in the REPL but never matches when moved into the script as "\\berror\\b" (no r prefix). Why?',
        o: [
          'Word boundaries only work in the REPL',
          'Without the r prefix, \\b is a backspace character, not a boundary assertion',
          'The pattern needs re.MULTILINE',
          'findall doesn\'t support \\b',
        ],
        x: 1,
        w: 'Python\'s string rules eat the backslash before the regex engine sees it: "\\b" is backspace. Raw strings (r"...") exist for exactly this — the Day 13 rule with no exceptions.',
        revisit: 13,
      },
    ],
    resources: [
      { label: 'Python Regex HOWTO (revisit the sections your FORGOT list names)', url: 'https://docs.python.org/3/howto/regex.html', type: 'docs', time: '15 min' },
      { label: 'itertools recipes (see how the pros compose streams)', url: 'https://docs.python.org/3/library/itertools.html#itertools-recipes', type: 'docs', time: '15 min' },
      { label: 'Pro Git — 2.2 (if your history discipline slipped this week)', url: 'https://git-scm.com/book/en/v2/Git-Basics-Recording-Changes-to-the-Repository', type: 'book', time: '15 min' },
    ],
    schedule: [
      { activity: 'Deck drill: Weeks 1–2 cards, misses re-drilled, count recorded', minutes: 15 },
      { activity: 'Blank-page protocol: five prompts + diff + FORGOT harvest', minutes: 10 },
      { activity: 'Warm-up: regenerate log, smoke-test parser, sketch components', minutes: 10 },
      { activity: 'Git story check: draft the commit plan', minutes: 10 },
      { activity: 'Project: build the analyzer to spec', minutes: 55 },
      { activity: 'Cumulative quiz + analyst\'s summary + revisit scheduling', minutes: 15 },
    ],
    completion: [
      'Flashcard miss count recorded and compared to Day 7',
      'recall2.py written blind; FORGOT lines harvested to journal',
      'Analyzer passes all six rubric checks on the 200k-line log',
      'History matches the drafted commit plan (or the deviation is explained in journal)',
      'Quiz ≥ 2/3 with revisit days scheduled for any miss',
    ],
    connections: {
      back: 'One build, five machines: Day 8\'s git telling the story, Day 10\'s dataclass-and-composition structure, Day 11\'s single-pass streaming, Day 12\'s @timed on the run, Day 13\'s parser imported whole. Even the log came from Day 6\'s workshop.',
      forward: 'Week 3 turns this artifact professional: Day 15 refactors it with types and clean-code rules, Day 16 gives it real logging and argparse, Day 18–19 test it, and Day 21 ships it as an installable package on GitHub — the analyzer is your portfolio seed. The streaming-parse-report shape returns at scale in Day 143\'s log mining.',
    },
    flashcards: [
      { f: 'Why one pass over a generator with multiple accumulators?', b: 'Generators exhaust; a second loop sees nothing. Update all statistics in the single pass.' },
      { f: 'LogEntry(**d) — what is ** doing?', b: 'Unpacking a dict into keyword arguments — the parsed-dict-to-object bridge.' },
      { f: 'The review-day order?', b: 'Recall first (cards aloud, blank page), reference second (diff, FORGOT list), then build. Never reread first.' },
      { f: 'What makes a commit history "tell a story"?', b: 'Commits at component seams, imperative messages, one responsibility each — reviewable from log --oneline alone.' },
      { f: 'Top-5 from a counts dict?', b: 'sorted(counts.items(), key=lambda kv: kv[1], reverse=True)[:5] — the Day 12 key= idiom.' },
    ],
    deepDive: [
      { label: 'collections.Counter — the accumulator you hand-rolled', note: 'Counter(seq).most_common(5) replaces your counts-dict-plus-sorted dance. You built it by hand first on purpose; from Day 15 onward, use the stdlib version and enjoy knowing what\'s inside.' },
    ],
  },
];
