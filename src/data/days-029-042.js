// Days 29–42 — Phase 2 (CS Core), Weeks 5–6.
// Week 5: trees, heaps/tries, graphs, sorting, binary search, DP, interview drill.
// Week 6: SQL, database internals, OS, concurrency/async, HTTP + FastAPI, mini-service.
export const DAYS_029_042 = [
  {
    id: 'd029', day: 29, week: 5, phase: 2, kind: 'lesson',
    title: 'Binary Trees & BSTs',
    analogy: 'Org charts with a sorting rule',
    objectives: [
      'Define tree anatomy precisely: root, leaf, depth, height, subtree',
      'Implement all four traversals (pre/in/post-order and level-order) from scratch',
      'Implement BST search and insert and state why both are O(h), not O(log n)',
      'Explain how a BST degenerates into a linked list and what that costs',
      'Solve max-depth, invert-tree, and validate-BST with clean recursion',
    ],
    prereqs: [
      { day: 26, label: 'Linked lists — nodes & pointers' },
      { day: 27, label: 'Recursion & divide/conquer' },
      { day: 25, label: 'Stacks & queues (BFS preview)' },
    ],
    eli5: `Picture a company org chart: one CEO at the top, each person managing at most two reports. That is a binary tree — every box is a node, the boxes under it are its children, and everything below one manager is that manager's subtree. Walking the chart top-to-bottom, level-by-level is one way to visit everyone; diving down one management chain before backing up is another.

Now add a sorting rule to the org chart: everyone to a manager's LEFT earns less, everyone to the RIGHT earns more — and the rule holds for the entire left and right sides, not just direct reports. That is a binary search tree. The rule is what makes it searchable: to find the person earning 72k you never interview the whole company — at each box you ask "less or more?" and discard half the chart, exactly like the phone-book halving you will formalize on Day 33. But the magic only works if the chart stays bushy. If every hire lands on the right side, your "tree" is really a queue of people in a hallway, and searching it means walking the whole hallway.`,
    why: `Trees are everywhere in your future stack: the JSON documents your APIs pass around are trees, HTML is a tree, Python parses your code into an abstract syntax tree, Postgres indexes are B-trees (Day 38), and the tries behind autocomplete (Day 30) are trees too. In interviews, tree questions are the single most common data-structure category, and they are really recursion questions in costume — the Day 27 skill cashed in. As an FDE you will also literally walk trees: extracting fields from deeply nested customer JSON payloads is a tree traversal you will write on-site.`,
    tech: `A binary tree is nodes with at most two children. Key vocabulary: the **root** has no parent; a **leaf** has no children; a node's **depth** is its distance from the root; the tree's **height** is the longest root-to-leaf path; a **subtree** is any node plus everything below it — and "any property of the tree" is usually "a recursive function of the subtrees."

### Traversals — four orders, two engines

Depth-first traversals differ only in when they visit the current node relative to its children: **pre-order** (node, left, right — good for copying/serializing), **in-order** (left, node, right — on a BST this yields sorted order, a fact interviewers adore), **post-order** (left, right, node — good when children must be processed first, like computing directory sizes or freeing nodes). All three are three-line recursive functions running on the call stack from Day 27. **Level-order** is different: it uses an explicit queue (Day 25) and visits nodes breadth-first, level by level — this is BFS, which graduates to graphs on Day 31.

### The BST invariant

A binary search tree adds the rule: for EVERY node, all keys in its left subtree are smaller and all keys in its right subtree are larger. Search and insert follow one root-to-leaf path, comparing and going left or right, so both cost O(h) where h is the height. In a **balanced** tree h ≈ log₂ n and you get O(log n). In a **degenerate** tree (insert sorted data and watch it happen) every node has one child, h = n, and the BST is a linked list with delusions of grandeur — O(n) search. Self-balancing trees (AVL, red-black) fix this by rotating on insert; you need the *why* and the vocabulary, not their implementation — Python dicts cover most needs, and databases use B-trees, their disk-friendly cousins (Day 38).

### The recursion recipe for tree problems

Almost every tree problem yields to: (1) what is the answer for an empty tree (base case)? (2) assuming my children already answered correctly, how do I combine their answers? Max depth: empty → 0; else 1 + max(left, right). Trust the recursion; do not trace every call.`,
    viz: 'bst-search',
    guided: [
      {
        title: 'Build a tree and walk it four ways',
        minutes: 20,
        body: `1. Create \`trees_lab.py\` and paste the starter code — a \`TreeNode\` class and a hand-built sample tree.
2. Implement \`inorder\`, \`preorder\`, and \`postorder\` as recursive functions that append to a result list. Each is three lines of real logic.
3. Predict on paper what each traversal prints for the sample tree BEFORE running. Diff your prediction against reality — mispredictions are where learning lives.
4. Implement \`level_order\` with \`collections.deque\`: pop from the left, append children on the right, collect values per level.
5. Sanity check: run \`inorder\` on the BST built by the starter's \`insert\` calls — the output must be sorted. Say out loud WHY (left < node < right, applied recursively).`,
        code: `from collections import deque

class TreeNode:
    def __init__(self, val, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

# hand-built tree:        4
#                        / \\
#                       2   7
#                      / \\   \\
#                     1   3   9
root = TreeNode(4, TreeNode(2, TreeNode(1), TreeNode(3)), TreeNode(7, None, TreeNode(9)))

def inorder(node, out=None):
    if out is None:
        out = []
    if node is None:
        return out
    inorder(node.left, out)
    out.append(node.val)
    inorder(node.right, out)
    return out

def preorder(node, out=None):
    # TODO: node first, then left, then right
    ...

def postorder(node, out=None):
    # TODO: left, right, then node
    ...

def level_order(root):
    if root is None:
        return []
    levels, q = [], deque([root])
    while q:
        level = []
        for _ in range(len(q)):   # exactly one level per outer pass
            node = q.popleft()
            level.append(node.val)
            if node.left:
                q.append(node.left)
            if node.right:
                q.append(node.right)
        levels.append(level)
    return levels

print("inorder:", inorder(root))        # [1, 2, 3, 4, 7, 9] -- sorted!
print("levels:", level_order(root))     # [[4], [2, 7], [1, 3], [9]]`,
      },
      {
        title: 'BST ops + three classics, think-aloud',
        minutes: 22,
        body: `Work each problem with the two-question recipe: base case? combine children's answers?

1. Implement \`bst_insert\` and \`bst_search\` (starter has signatures). Insert 50 sorted values into a fresh BST, then measure its height — you have just built the degenerate case. Insert the same values shuffled and compare heights.
2. **Classic 1 — Max depth.** Think aloud: "Empty tree is depth 0. Otherwise I am 1 + the deeper of my two subtrees." Write it in 3 lines.
3. **Classic 2 — Invert a tree.** Think aloud: "Swap my children, then ask each child to invert itself." Verify by printing level_order before/after.
4. **Classic 3 — Validate BST.** First write the TEMPTING wrong version (check each node against only its direct children), and break it with the starter's \`trap\` tree. Then write the correct version: pass down (lo, hi) bounds that every node must respect. This bug is the most common tree-interview mistake — earn the scar now.`,
        code: `def bst_insert(node, val):
    if node is None:
        return TreeNode(val)
    if val < node.val:
        node.left = bst_insert(node.left, val)
    else:
        node.right = bst_insert(node.right, val)
    return node

def bst_search(node, val):
    if node is None:
        return False
    if val == node.val:
        return True
    return bst_search(node.left if val < node.val else node.right, val)

def height(node):
    if node is None:
        return 0
    return 1 + max(height(node.left), height(node.right))

# the trap for naive validate: 5.left=3, 5.right=8, but 3.right=9
# every parent-child pair is fine; 9 in the LEFT subtree of 5 is not.
trap = TreeNode(5, TreeNode(3, TreeNode(1), TreeNode(9)), TreeNode(8))

def is_valid_bst(node, lo=float("-inf"), hi=float("inf")):
    if node is None:
        return True
    if not (lo < node.val < hi):
        return False
    return (is_valid_bst(node.left, lo, node.val)
            and is_valid_bst(node.right, node.val, hi))

print(is_valid_bst(trap))   # False -- bounds catch what parent-checks miss`,
      },
    ],
    practice: [
      {
        title: 'Kth smallest in a BST',
        minutes: 18,
        body: `Given the root of a BST and an integer k, return the kth smallest value (1-indexed). Solve it two ways: (1) the obvious way using a full traversal, then (2) an early-exit version that stops traversing the moment it has seen k values.

State the complexity of both. Test on a BST of 1..15 with k = 1, 7, 15.

Hints (only if stuck): which traversal visits BST values in sorted order? For early exit, a generator (Day 11) plus \`itertools.islice\` is elegant — or count down k inside the recursion.`,
      },
    ],
    project: {
      title: 'Tree toolkit for the interview repo',
      brief: `Create \`dsa/trees.py\` in your practice repo: \`TreeNode\`, all four traversals, \`bst_insert\`/\`bst_search\`, \`height\`, plus the three classics (max depth, invert, validate). Add \`test_trees.py\` with pytest cases including the degenerate BST (sorted inserts) and the validate-BST trap tree. In the module docstring, write a 5-line "when do I reach for a tree?" note in your own words. Commit — Day 35's drill and Day 179's interview gym pull problems straight from this file.`,
      rubric: [
        'All four traversals pass tests, including an empty tree and a single-node tree',
        'validate-BST test includes the trap tree that defeats the parent-only check',
        'Degenerate-vs-shuffled height test demonstrates O(n) vs ~O(log n) height',
        'Kth-smallest solution included with both versions and their complexities in comments',
        'Committed with a descriptive message; tests green via pytest',
      ],
    },
    mistakes: [
      'Validating a BST by comparing each node only with its children. The invariant covers WHOLE subtrees — pass down (lo, hi) bounds. This is the classic trap.',
      'Saying BST search is O(log n) unconditionally. It is O(h); only a balanced tree gives h ≈ log n. Sorted inserts give h = n.',
      'Confusing depth (node property, from root) with height (tree property, longest path down). Interviewers use both; know which is which.',
      'Forgetting the base case handles None, then crashing on leaf children. Every recursive tree function starts with the None check.',
      'Using level-order (queue) when a recursive DFS is three lines — or recursion when the problem says "by level", which is the queue\'s job.',
      'Tracing every recursive call by hand instead of trusting the recursive contract: assume children return correct answers, combine, done.',
    ],
    quiz: [
      {
        q: 'You run an in-order traversal on a valid BST. What comes out?',
        o: ['Values in insertion order', 'Values in sorted ascending order', 'Values level by level', 'The leaves only'],
        x: 1,
        w: 'In-order visits left subtree (all smaller), node, right subtree (all larger) — recursively, that is exactly ascending sorted order. A go-to interview fact.',
        revisit: 29,
      },
      {
        q: 'You insert 1, 2, 3, ..., 1000 into an empty BST in that order. Searching it now costs…',
        o: ['O(log n) — it is a BST', 'O(n) — the tree degenerated into a right-leaning chain', 'O(1)', 'O(n log n)'],
        x: 1,
        w: 'Sorted inserts always go right, producing a chain of height n. BST operations are O(h), and here h = n. Balanced trees (AVL/red-black) exist to prevent exactly this.',
        revisit: 29,
      },
      {
        q: 'A colleague validates a BST by checking node.left.val < node.val < node.right.val at each node. Why is this wrong?',
        o: [
          'It is correct',
          'It only checks direct children; a deep-left node can still exceed an ancestor. You must propagate (lo, hi) bounds',
          'It fails only on duplicate values',
          'It should use level-order instead',
        ],
        x: 1,
        w: 'The invariant constrains entire subtrees against every ancestor, not just the parent. A 9 hiding under the left child of 5 passes local checks but breaks the tree.',
        revisit: 29,
      },
    ],
    resources: [
      { label: 'VisuAlgo — Binary Search Tree visualization', url: 'https://visualgo.net/en/bst', type: 'tool', time: '15 min' },
      { label: 'OpenDSA — Binary Trees chapter', url: 'https://opendsa-server.cs.vt.edu/', type: 'book', time: '25 min' },
      { label: 'NeetCode Roadmap — Trees section (pick 2 to attempt)', url: 'https://neetcode.io/roadmap', type: 'course', time: '20 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: due cards from Week 4 (recursion, stacks, linked lists)', minutes: 10 },
      { activity: 'ELI5 + tech read; step through the BST-search visualizer', minutes: 18 },
      { activity: 'Guided: build & traverse, then BST ops + three classics', minutes: 42 },
      { activity: 'Practice: kth smallest in a BST', minutes: 18 },
      { activity: 'Project: tree toolkit + tests, commit', minutes: 22 },
      { activity: 'Quiz + add today\'s flashcards to the deck', minutes: 10 },
    ],
    completion: [
      'All four traversals implemented; in-order-on-BST-is-sorted verified',
      'Trap tree defeats the naive validator and passes the bounds version',
      'Kth smallest solved both ways with complexities stated',
      'Tree toolkit committed with green tests',
      'Quiz ≥ 2/3',
    ],
    connections: {
      back: 'Nodes-and-pointers come straight from Day 26\'s linked lists — a tree is a linked list that branches. Every traversal is Day 27\'s recursion recipe, and level-order is Day 25\'s queue earning its keep.',
      forward: 'Day 30 reshapes trees into heaps and tries. Day 31 generalizes traversal to graphs (BFS/DFS). Day 33 formalizes the halving idea BSTs rely on, and Day 38 reveals the B-tree — the BST\'s disk-based cousin inside every database index.',
    },
    flashcards: [
      { f: 'In-order traversal of a BST yields…?', b: 'Values in sorted ascending order (left < node < right, recursively).' },
      { f: 'BST search complexity — the honest answer?', b: 'O(h). Balanced: h ≈ log n. Degenerate (sorted inserts): h = n.' },
      { f: 'Correct way to validate a BST?', b: 'Pass (lo, hi) bounds down; every node must satisfy lo < val < hi. Parent-only checks miss deep violations.' },
      { f: 'Which traversal uses a queue instead of recursion?', b: 'Level-order (BFS): deque, popleft, append children, one level per pass.' },
      { f: 'Recursion recipe for tree problems?', b: 'Base case for None + combine children\'s answers, trusting they are correct.' },
      { f: 'Post-order traversal is the right tool when…?', b: 'Children must be processed before the parent (directory sizes, deleting nodes).' },
    ],
    deepDive: [
      { label: 'Self-balancing trees (AVL rotations) on VisuAlgo', url: 'https://visualgo.net/en/bst', note: 'Watch how a rotation restores balance after an insert. You need the concept, not the code — Day 38\'s B-trees solve balance for databases differently.' },
    ],
  },
  {
    id: 'd030', day: 30, week: 5, phase: 2, kind: 'lesson',
    title: 'Heaps, Priority Queues & Tries',
    analogy: 'The triage nurse & the autocomplete tree',
    objectives: [
      'Explain the heap property and why a heap lives happily inside a plain list',
      'Trace push and pop (sift-up / sift-down) by hand and state their O(log n) cost',
      'Use heapq for top-K problems and justify the O(n log k) pattern',
      'Implement a trie with insert, search, and prefix lookup',
      'Choose between heap, trie, sorted list, and dict for a given access pattern',
    ],
    prereqs: [
      { day: 29, label: 'Binary trees & BSTs' },
      { day: 23, label: 'Arrays & hashing' },
      { day: 22, label: 'Big O & complexity' },
    ],
    eli5: `An emergency room does not treat patients in arrival order — a triage nurse keeps the queue arranged so the most urgent case is always at the front. That is a priority queue, and the heap is the nurse's filing trick: not fully sorted (sorting everyone constantly would waste time nobody has), just organized enough that the most urgent patient is always instantly on top, and re-organizing after any arrival or discharge takes only a few swaps.

The trie is a different beast: the autocomplete tree. Imagine a tree where each branch is a LETTER. To store "cat", you walk c → a → t and plant a flag at the end. "car" shares the c → a corridor and branches at the last step. Now "every word starting with ca-" is not a search at all — you walk two steps and everything below you is the answer. The heap answers "who is most urgent right now?"; the trie answers "what starts with this?" Both answer their one question absurdly fast, and both are terrible at the other's question — choosing the structure that matches the question is the actual skill.`,
    why: `Priority queues run the world you are heading into: OS schedulers (Day 39) pick the next process from one, task queues process urgent jobs first (Day 47), and "top-K" is the shape of half of production analytics — top 10 errors, top 5 slowest endpoints, k most similar embeddings. When you meet vector search on Day 115, the k-nearest-neighbor engine keeps its candidate set in a heap. Tries power autocomplete, spell-check, and — surprisingly — the token vocabulary lookups inside LLM tokenizers you will study on Day 96. In interviews, "kth largest" and "top-k frequent" are near-guaranteed encounters.`,
    tech: `A **binary min-heap** is a complete binary tree where every parent ≤ its children. "Complete" (all levels full, last level packed left) is what lets it live in a flat list with zero pointers: the node at index i has children at 2i+1 and 2i+2, and its parent at (i-1)//2. The root — the minimum — is always index 0.

### Push and pop mechanics

**Push**: append to the end (preserving completeness), then **sift up** — swap with the parent while smaller than it. **Pop**: save the root, move the LAST element to the root, then **sift down** — swap with the smaller child while larger than either. Both walk at most the tree's height, and a complete tree is perfectly balanced, so both are honestly O(log n) — no degenerate case, unlike yesterday's BST. Peeking at the min is O(1). Note what a heap does NOT give you: it is not sorted, and finding an arbitrary element is O(n).

Python's \`heapq\` operates on plain lists: \`heappush(h, x)\`, \`heappop(h)\`, \`heapify(xs)\` (which is O(n), a classic interview surprise). It is min-only; for a max-heap, push negated values and negate on the way out. For compound priorities push tuples — \`(priority, item)\` — which compare element-wise.

### The top-K pattern

To find the k largest of n items, do NOT sort (O(n log n)). Keep a min-heap of size k: for each item, push, and if the heap exceeds k, pop the minimum. Whatever survives is the top k, at O(n log k) — for k = 10 and n = 10 million, log k ≈ 3.3 versus log n ≈ 23. \`heapq.nlargest(k, xs)\` wraps this pattern.

### Tries

A **trie** (prefix tree) maps strings character-by-character: each node holds a dict of children (Day 23's hashing, embedded in a tree) plus an end-of-word flag. Insert and lookup cost O(L) in the word's length — independent of how many words are stored, which is the whole point. Prefix queries walk the prefix then own the entire subtree. The cost is memory: one node per character-path, which is why real systems compress paths (radix trees).`,
    viz: 'heap-ops',
    guided: [
      {
        title: 'Build a heap by hand, then trust heapq',
        minutes: 20,
        body: `1. Create \`heaps_lab.py\`. Implement \`sift_up\` and \`sift_down\` for a list-based min-heap using the index arithmetic (children 2i+1 / 2i+2, parent (i-1)//2). The starter gives \`push\` and \`pop\` built on them.
2. Push 10 random numbers, popping all — verify they come out sorted (this is heapsort in disguise).
3. Draw the heap [1, 3, 2, 8, 5, 4] as a tree on paper. Push 0 and write each swap sift-up makes. Then verify with your code by printing the list after the push.
4. Redo the same operations with \`heapq\` and confirm identical list states — your implementation IS heapq's algorithm.
5. Max-heap detour: use \`heapq\` to pop the LARGEST of [7, 2, 9, 4] by negating on push and pop.`,
        code: `import heapq
import random

def sift_up(h, i):
    while i > 0:
        parent = (i - 1) // 2
        if h[i] < h[parent]:
            h[i], h[parent] = h[parent], h[i]
            i = parent
        else:
            break

def sift_down(h, i):
    n = len(h)
    while True:
        left, right, smallest = 2 * i + 1, 2 * i + 2, i
        if left < n and h[left] < h[smallest]:
            smallest = left
        if right < n and h[right] < h[smallest]:
            smallest = right
        if smallest == i:
            break
        h[i], h[smallest] = h[smallest], h[i]
        i = smallest

def push(h, x):
    h.append(x)
    sift_up(h, len(h) - 1)

def pop(h):
    h[0], h[-1] = h[-1], h[0]
    top = h.pop()
    if h:
        sift_down(h, 0)
    return top

mine, ref = [], []
values = [random.randint(0, 99) for _ in range(10)]
for v in values:
    push(mine, v)
    heapq.heappush(ref, v)
assert mine == ref, "same algorithm, same list layout"
print("popped:", [pop(mine) for _ in range(len(mine))])  # sorted!`,
      },
      {
        title: 'Two classics + a working trie',
        minutes: 22,
        body: `1. **Classic 1 — Kth largest element.** Think aloud: "Sorting is O(n log n) and wasteful — I only care about k survivors. Min-heap of size k: anything smaller than the heap's minimum can never be top-k, so pop it." Implement \`kth_largest(nums, k)\` and test against \`sorted(nums)[-k]\`.
2. **Classic 2 — Top-k frequent elements.** Think aloud: "Two structures, one per question: a Counter (Day 23) answers HOW OFTEN, a heap answers WHICH k. Push (count, item) tuples, keep size k." Implement and test on a word list.
3. Implement the \`Trie\` class in the starter: \`insert\`, \`search\` (whole word), \`starts_with\` (prefix). Each is a loop over characters walking child dicts.
4. Load the starter's mini word list and implement \`autocomplete(prefix)\`: walk to the prefix node, then DFS (Day 29's traversal!) collecting every flagged word below it.`,
        code: `import heapq
from collections import Counter

def kth_largest(nums, k):
    heap = []
    for x in nums:
        heapq.heappush(heap, x)
        if len(heap) > k:
            heapq.heappop(heap)     # evict the smallest survivor
    return heap[0]                  # min of the top k = kth largest

def top_k_frequent(items, k):
    counts = Counter(items)
    heap = []
    for item, c in counts.items():
        heapq.heappush(heap, (c, item))
        if len(heap) > k:
            heapq.heappop(heap)
    return [item for c, item in sorted(heap, reverse=True)]

class TrieNode:
    def __init__(self):
        self.children = {}   # char -> TrieNode
        self.is_word = False

class Trie:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, word):
        node = self.root
        for ch in word:
            node = node.children.setdefault(ch, TrieNode())
        node.is_word = True

    def _walk(self, s):
        node = self.root
        for ch in s:
            if ch not in node.children:
                return None
            node = node.children[ch]
        return node

    def search(self, word):
        node = self._walk(word)
        return node is not None and node.is_word

    def starts_with(self, prefix):
        return self._walk(prefix) is not None

t = Trie()
for w in ["cat", "car", "card", "care", "dog"]:
    t.insert(w)
print(t.search("car"), t.search("ca"), t.starts_with("ca"))  # True False True`,
      },
    ],
    practice: [
      {
        title: 'Autocomplete, ranked',
        minutes: 20,
        body: `Combine both structures: build \`suggest(prefix, k)\` that returns the k MOST FREQUENT words matching a prefix, given a list of (word, frequency) pairs. Load the starter word list from guided (invent frequencies), and make \`suggest("ca", 2)\` return the two most-searched ca- words.

Constraints: trie for the prefix walk, heap for the top-k — no sorting the full candidate list. State the complexity in terms of prefix length L, matches m, and k.

Hints: store frequency on the trie's end-of-word nodes. Collect matches with the DFS from guided, then run the size-k heap over them: O(L + m log k).`,
      },
    ],
    project: {
      title: 'Log triage: top-K everything',
      brief: `Revisit the Day 14 log analyzer with today's tools. Write \`dsa/topk_logs.py\`: stream the provided server log (or your Day 14 sample) and report the top 5 error messages, top 5 IPs, and top 3 slowest endpoints — all via the size-k heap pattern, never a full sort. Add a \`--prefix\` flag that autocompletes endpoint paths using a trie built from the log (so \`--prefix /api/u\` lists matching endpoints with hit counts). Commit with tests covering ties and k larger than the number of distinct items.`,
      rubric: [
        'Top-K uses a bounded heap (never sorts all distinct items); the heap never exceeds size k',
        'Handles k larger than the number of distinct values without crashing',
        'Trie-backed --prefix flag returns all matching endpoints with counts',
        'Complexity of each report stated in comments (O(n log k) etc.)',
        'Tests cover a tie in counts and an empty log; committed to the practice repo',
      ],
    },
    mistakes: [
      'Sorting the whole array to get the top k. The size-k min-heap gives O(n log k) — state the improvement out loud in interviews.',
      'Reaching for a MIN-heap of size k but popping the max, or vice versa. To keep the k LARGEST you evict the smallest — that is why the heap is a min-heap.',
      'Assuming the heap list is sorted. Only index 0 is special; h[1] is not the second-smallest. Pop repeatedly to consume in order.',
      'Forgetting heapq is min-only. Max-heap = push negatives, or push (-priority, item) tuples.',
      'Heapify confusion: heapq.heapify is O(n), not O(n log n) — a favorite interview follow-up.',
      'Trie node with a fixed 26-slot array when a dict of children handles any alphabet (unicode, digits, "/" in URL paths) for free in Python.',
    ],
    quiz: [
      {
        q: 'You need the 10 largest of 10 million numbers. Best approach and complexity?',
        o: [
          'Sort everything: O(n log n)',
          'Min-heap of size 10, evict the minimum when it grows past 10: O(n log k)',
          'Max-heap of all 10M items, pop 10: O(n + k log n)',
          'Scan 10 times for the max: O(10n)',
        ],
        x: 1,
        w: 'The bounded min-heap does n pushes/pops against a height-log k structure: O(n log k) with tiny constant memory. Option c also works but uses O(n) extra memory; b is the standard answer.',
        revisit: 30,
      },
      {
        q: 'In a list-based heap, where are the children of the node at index i?',
        o: ['i+1 and i+2', '2i+1 and 2i+2', '2i and 2i+1', 'i//2 and i//2+1'],
        x: 1,
        w: 'Completeness lets the tree pack into a list: children of i live at 2i+1 and 2i+2, parent at (i-1)//2. No pointers needed.',
        revisit: 30,
      },
      {
        q: 'Lookup cost for a word of length L in a trie holding one million words?',
        o: ['O(log n) — a million words is a big tree', 'O(L) — one child-dict hop per character, independent of vocabulary size', 'O(n)', 'O(L log n)'],
        x: 1,
        w: 'A trie walk touches one node per character. The number of stored words never appears in the cost — that independence is the trie\'s entire value proposition.',
        revisit: 30,
      },
    ],
    resources: [
      { label: 'VisuAlgo — Binary Heap visualization', url: 'https://visualgo.net/en/heap', type: 'tool', time: '15 min' },
      { label: 'heapq — official Python docs (theory notes at the bottom are gold)', url: 'https://docs.python.org/3/library/heapq.html', type: 'docs', time: '20 min' },
      { label: 'OpenDSA — Heaps & Priority Queues chapter', url: 'https://opendsa-server.cs.vt.edu/', type: 'book', time: '20 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: due cards (trees, hashing)', minutes: 10 },
      { activity: 'ELI5 + tech read; watch heap push/pop in the visualizer', minutes: 18 },
      { activity: 'Guided: hand-built heap, two classics, working trie', minutes: 42 },
      { activity: 'Practice: ranked autocomplete', minutes: 20 },
      { activity: 'Project: log triage with heaps + trie, commit', minutes: 20 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'Hand-rolled heap matches heapq state after identical operations',
      'kth-largest and top-k-frequent pass tests against a sorted-reference oracle',
      'Trie supports insert/search/starts_with; ranked autocomplete works',
      'Log-triage project committed with tie and small-k tests green',
      'Quiz ≥ 2/3',
    ],
    connections: {
      back: 'The heap is Day 29\'s complete binary tree flattened into Day 23\'s array; the trie is Day 29\'s tree whose edges are Day 23\'s dict lookups. Top-k-frequent chains Day 23\'s Counter into today\'s heap.',
      forward: 'Day 31\'s Dijkstra-flavored ideas and Day 39\'s OS scheduler both run on priority queues. Day 96\'s tokenizers do trie-like longest-prefix matching, and Day 115\'s k-nearest-neighbor search keeps candidates in exactly today\'s bounded heap.',
    },
    flashcards: [
      { f: 'Heap property (min-heap)?', b: 'Every parent ≤ its children; complete tree packed into a list. Root = min at index 0.' },
      { f: 'Top-k largest pattern?', b: 'Min-heap of size k; push each item, pop the min when size exceeds k. O(n log k).' },
      { f: 'heapq is min-only — max-heap how?', b: 'Push negated values (or (-priority, item) tuples); negate on the way out.' },
      { f: 'heapq.heapify complexity?', b: 'O(n) — cheaper than n pushes (O(n log n)). Classic interview follow-up.' },
      { f: 'Trie insert/lookup cost?', b: 'O(L) in word length — independent of vocabulary size. Prefix queries own a subtree.' },
      { f: 'Heap children/parent index math?', b: 'Children of i: 2i+1, 2i+2. Parent: (i-1)//2.' },
    ],
    deepDive: [
      { label: 'Radix trees & path compression', note: 'Real routers and tokenizers compress single-child trie chains into one edge. Read about radix/PATRICIA trees and connect them to URL routing in FastAPI (Day 41).' },
    ],
  },
  {
    id: 'd031', day: 31, week: 5, phase: 2, kind: 'lesson',
    title: 'Graphs, BFS & DFS',
    analogy: 'Friendship maps, ripples & corridors',
    objectives: [
      'Represent a graph as an adjacency list and say when a matrix wins instead',
      'Implement BFS with a queue and use it for shortest unweighted paths',
      'Implement DFS both recursively and with an explicit stack',
      'Detect cycles and count connected components',
      'Explain topological sort and where it applies (DAGs only)',
    ],
    prereqs: [
      { day: 25, label: 'Stacks & queues' },
      { day: 27, label: 'Recursion & divide/conquer' },
      { day: 29, label: 'Binary trees & BSTs' },
    ],
    eli5: `A friendship map: dots for people, lines for "knows each other." No root, no up or down, no rule about two children — just things and connections. That is a graph, and it is the most general shape data takes: cities and roads, packages and dependencies, web pages and links, tasks and prerequisites.

Two ways to explore it. **BFS is a ripple**: drop a stone at your starting person and the wave reaches all their friends first, then friends-of-friends, then friends-of-friends-of-friends. Because the ripple expands one ring at a time, the first time it touches someone is provably the SHORTEST path to them — that is BFS's superpower. **DFS is exploring corridors**: pick a hallway, follow it to the very end, back up to the last junction, try the next hallway. You do not find shortest paths this way, but you thoroughly map every reachable room — perfect for "is there any path?", "does this maze loop back on itself?", and "which rooms form one connected building?" One structure decides everything: a queue makes the ripple, a stack (or recursion — the call stack) makes the corridor-crawl.`,
    why: `Graphs are the interview category that separates prepared candidates, and they saturate real AI work: dependency resolution in build systems and package managers is topological sort; a multi-step agent's tool-call plan (Day 121) is a DAG; knowledge-graph RAG (Day 118) retrieves by walking edges; crawl-and-ingest pipelines for RAG corpora are literally BFS over hyperlinks. When your Day 148 Docker builds order their layers or your Day 152 CI pipeline orders its jobs, a topological sort ran. "Model the mess as nodes and edges, then BFS/DFS it" is a career-long move.`,
    tech: `A graph is vertices (nodes) plus edges (connections), directed or undirected, weighted or not. Trees are just graphs that are connected and acyclic with a chosen root — which is why yesterday's traversals generalize today.

### Representation

The **adjacency list** — in Python, a dict mapping each node to a list/set of neighbors — costs O(V + E) space and is the default: real graphs are sparse (far fewer edges than the V² maximum). The **adjacency matrix** (V×V grid of 0/1) answers "are u,v connected?" in O(1) but pays O(V²) space — worth it only for dense graphs or small V. Grids in problems ("number of islands") are implicit graphs: each cell is a node, its 4 neighbors are its edges — no structure to build, just neighbor arithmetic.

### BFS — the ripple

Queue seeded with the start node, a **visited set**, loop: pop left, process, push unvisited neighbors — marking visited WHEN ENQUEUED, not when popped, or the queue fills with duplicates. Because BFS explores in expanding rings, the first arrival at any node used a minimum-edge path: BFS **is** shortest-path for unweighted graphs. Track distance by level (Day 29's level-order) or store dist alongside each node. O(V + E) time.

### DFS — the corridor crawl

Recursive: visit, mark, recurse on unvisited neighbors — or iterative with an explicit stack (needed when depth might blow Python's ~1000-frame recursion limit, e.g. a 1000×1000 grid). DFS answers reachability, **connected components** (loop over all nodes, DFS from each unvisited one, count launches), and **cycle detection** — in a directed graph, keep a "currently on the recursion path" set; revisiting a node on the current path means a cycle.

### Topological sort — the gist

For a **DAG** (directed acyclic graph) only: an ordering where every edge points forward — prerequisites before dependents. Kahn's algorithm: repeatedly take a node with in-degree 0, remove it, decrement neighbors. If you cannot consume every node, the graph has a cycle — which is precisely how "can you finish all courses?" is solved.`,
    viz: 'graph-bfs',
    guided: [
      {
        title: 'Adjacency list + BFS shortest path',
        minutes: 20,
        body: `1. Create \`graphs_lab.py\`. Build the starter's small undirected graph as a dict-of-sets adjacency list.
2. Implement \`bfs_distances(graph, start)\` returning a dict node → distance. Discipline: mark visited when ENQUEUEING. Predict the distances from "a" on paper first.
3. Extend it to \`shortest_path(graph, start, goal)\` by also recording each node's parent when discovered, then walking parents backwards from the goal. Verify the path found for a → f is one of the shortest ones.
4. Break it on purpose: move the visited-marking to pop time on a graph with a cycle and print the queue's length over time. Watch the duplicate explosion — now you will never make that mistake under interview pressure.`,
        code: `from collections import deque

graph = {
    "a": {"b", "c"},
    "b": {"a", "d"},
    "c": {"a", "d", "e"},
    "d": {"b", "c", "f"},
    "e": {"c", "f"},
    "f": {"d", "e"},
}

def bfs_distances(graph, start):
    dist = {start: 0}
    q = deque([start])
    while q:
        node = q.popleft()
        for nb in graph[node]:
            if nb not in dist:          # 'in dist' doubles as the visited set
                dist[nb] = dist[node] + 1
                q.append(nb)            # marked at enqueue time
    return dist

def shortest_path(graph, start, goal):
    parent = {start: None}
    q = deque([start])
    while q:
        node = q.popleft()
        if node == goal:
            path = []
            while node is not None:
                path.append(node)
                node = parent[node]
            return path[::-1]
        for nb in graph[node]:
            if nb not in parent:
                parent[nb] = node
                q.append(nb)
    return None                          # unreachable

print(bfs_distances(graph, "a"))   # a:0 b:1 c:1 d:2 e:2 f:3
print(shortest_path(graph, "a", "f"))`,
      },
      {
        title: 'Number of Islands + cycle detection, think-aloud',
        minutes: 22,
        body: `1. **Classic 1 — Number of islands.** Think aloud: "The grid IS a graph — cells are nodes, 4-neighbors are edges. Each island is a connected component. Scan every cell; when I hit unvisited land, that is a NEW island: count it and flood-fill (DFS) the whole component so I never count it again." Implement \`count_islands\` with the starter grid; use an explicit stack so a huge grid cannot overflow recursion.
2. Trace your flood fill on the 3-island starter grid by hand for the first island — list the cells in the order visited.
3. **Classic 2 — Course Schedule.** Think aloud: "Courses and prerequisites form a directed graph. I can finish all courses if and only if there is no cycle." Implement \`can_finish\` with DFS three-state coloring: unvisited / on-current-path / done. Revisiting an on-path node = cycle.
4. Test with a cyclic prerequisite pair (A needs B, B needs A) and a valid chain. Then say the connection: three-state DFS and Kahn's algorithm are two roads to the same theorem — topological order exists iff no cycle.`,
        code: `def count_islands(grid):
    rows, cols = len(grid), len(grid[0])
    seen = set()
    def flood(r, c):
        stack = [(r, c)]
        while stack:
            cr, cc = stack.pop()
            if (cr, cc) in seen:
                continue
            seen.add((cr, cc))
            for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nr, nc = cr + dr, cc + dc
                if (0 <= nr < rows and 0 <= nc < cols
                        and grid[nr][nc] == "1" and (nr, nc) not in seen):
                    stack.append((nr, nc))
    count = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == "1" and (r, c) not in seen:
                count += 1
                flood(r, c)
    return count

grid = [list("11000"), list("11000"), list("00100"), list("00011")]
print(count_islands(grid))   # 3

def can_finish(num_courses, prereqs):
    graph = {i: [] for i in range(num_courses)}
    for course, needs in prereqs:
        graph[needs].append(course)
    state = {}                    # missing=unvisited, 1=on path, 2=done
    def has_cycle(node):
        state[node] = 1
        for nb in graph[node]:
            s = state.get(nb, 0)
            if s == 1:            # back to a node on the current path
                return True
            if s == 0 and has_cycle(nb):
                return True
        state[node] = 2
        return False
    return not any(state.get(n, 0) == 0 and has_cycle(n) for n in graph)

print(can_finish(2, [(1, 0)]))          # True
print(can_finish(2, [(1, 0), (0, 1)]))  # False -- cycle`,
      },
    ],
    practice: [
      {
        title: 'Rotting oranges (multi-source BFS)',
        minutes: 20,
        body: `A grid holds fresh oranges (1), rotten oranges (2), and empty cells (0). Every minute, rot spreads to 4-adjacent fresh oranges. Return the minutes until no fresh orange remains, or -1 if some orange can never rot.

Solve with BFS. The twist to discover: the ripple starts from ALL rotten oranges at once. Test on a grid where two rot sources race toward the same fresh orange, and on a grid with an unreachable orange.

Hints: seed the queue with every rotten cell (all at distance 0) before looping — multi-source BFS is ordinary BFS with a bigger starting ring. Count remaining fresh oranges to detect the -1 case.`,
      },
    ],
    project: {
      title: 'Graph toolkit + the import-dependency mapper',
      brief: `Two deliverables in \`dsa/graphs.py\`. First: today's core — \`bfs_distances\`, \`shortest_path\`, \`count_islands\`, \`can_finish\` — with pytest cases including a disconnected graph and a self-loop. Second, the fun one: \`import_graph(directory)\` walks your practice repo's Python files (pathlib from Day 5), regex-extracts local \`import\` statements (Day 13), builds a directed graph of module dependencies, and prints a topological order — or names the cycle if one exists. Run it on your own repo and commit the output in the docstring.`,
      rubric: [
        'BFS shortest path verified against a hand-computed answer on a 6+ node graph',
        'count_islands handles all-water, all-land, and diagonal-only grids (diagonals are NOT connected)',
        'can_finish detects a 3-node cycle and passes a valid DAG',
        'Import mapper produces a valid topological order on your real repo (every edge points forward)',
        'Tests green; committed with a descriptive message',
      ],
    },
    mistakes: [
      'Marking nodes visited at POP time instead of enqueue time — the queue floods with duplicates and BFS silently goes superlinear. Mark when enqueueing.',
      'Using DFS for shortest path. DFS finds A path, not the shortest; only BFS guarantees minimal edges in unweighted graphs.',
      'Forgetting the visited set entirely on cyclic graphs — infinite loop. Trees forgive this (no cycles); graphs never do.',
      'Recursion-depth crashes on big grids: a 1000×1000 grid can recurse a million deep. Know the iterative-stack DFS.',
      'Detecting directed cycles with a plain visited set. A visited node reached again via a DIFFERENT path is not a cycle — you need the "on current path" state.',
      'Trying to topologically sort a cyclic graph. Topo order exists only for DAGs; the algorithm failing IS your cycle detector.',
    ],
    quiz: [
      {
        q: 'Why does BFS — and not DFS — find shortest paths in unweighted graphs?',
        o: [
          'BFS is faster than DFS',
          'BFS explores in expanding distance rings, so the first arrival at a node used the fewest possible edges',
          'DFS cannot handle cycles',
          'BFS uses less memory',
        ],
        x: 1,
        w: 'The queue processes all nodes at distance d before any at d+1. First contact therefore happens along a minimal-edge path. Both run O(V+E); the ORDER is what differs.',
        revisit: 31,
      },
      {
        q: 'In BFS, when should a node be marked visited?',
        o: ['When popped from the queue', 'When enqueued', 'After all its neighbors are processed', 'It does not matter'],
        x: 1,
        w: 'Marking at enqueue prevents the same node being queued many times via different neighbors. Marking at pop still terminates but bloats the queue with duplicates.',
        revisit: 31,
      },
      {
        q: 'Course A requires B, B requires C, C requires A. What does topological sort do here?',
        o: [
          'Returns A, B, C',
          'Returns C, B, A',
          'Fails to order all nodes — which is exactly how you detect that the schedule is impossible (cycle)',
          'Picks an arbitrary starting course',
        ],
        x: 2,
        w: 'Topological order exists iff the directed graph is acyclic. A cycle means no node can legally come first among the three — Kahn\'s algorithm stalls with no in-degree-0 node, revealing the cycle.',
        revisit: 31,
      },
    ],
    resources: [
      { label: 'VisuAlgo — Graph traversal (DFS/BFS) visualization', url: 'https://visualgo.net/en/dfsbfs', type: 'tool', time: '15 min' },
      { label: 'OpenDSA — Graphs chapter', url: 'https://opendsa-server.cs.vt.edu/', type: 'book', time: '25 min' },
      { label: 'NeetCode Roadmap — Graphs section', url: 'https://neetcode.io/roadmap', type: 'course', time: '15 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: due cards (heaps, trees, queues)', minutes: 10 },
      { activity: 'ELI5 + tech read; run BFS in the visualizer and watch the rings', minutes: 18 },
      { activity: 'Guided: BFS shortest path, islands, cycle detection', minutes: 42 },
      { activity: 'Practice: rotting oranges (multi-source BFS)', minutes: 20 },
      { activity: 'Project: graph toolkit + import-dependency mapper', minutes: 20 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'BFS marks visited at enqueue; duplicate-explosion experiment observed and explained',
      'Number of islands and course schedule pass tests including edge cases',
      'Rotting oranges handles the unreachable-orange case (-1)',
      'Import-dependency mapper runs on your real repo; toolkit committed',
      'Quiz ≥ 2/3',
    ],
    connections: {
      back: 'BFS is Day 25\'s queue plus Day 29\'s level-order, generalized; DFS is Day 27\'s recursion with a visited set because graphs, unlike trees, can loop. The adjacency list is Day 23\'s dict-of-sets.',
      forward: 'Day 34\'s DP problems are often shortest paths on implicit DAGs. Day 118\'s graph-RAG retrieves by edge-walking, Day 121\'s agent plans are DAGs your topo-sort intuition will read, and Day 148\'s Docker layer graph and Day 152\'s CI job ordering are topological sorts in production clothing.',
    },
    flashcards: [
      { f: 'BFS vs DFS — one-line job descriptions?', b: 'BFS (queue): shortest unweighted path, level-by-level. DFS (stack/recursion): reachability, components, cycles.' },
      { f: 'When to mark a node visited in BFS?', b: 'At ENQUEUE time — marking at pop floods the queue with duplicates.' },
      { f: 'Connected components algorithm?', b: 'Loop all nodes; DFS/BFS from each unvisited one; number of launches = number of components.' },
      { f: 'Directed cycle detection needs what beyond visited?', b: 'An "on current recursion path" state — revisiting an on-path node means a cycle.' },
      { f: 'Topological sort applies to…?', b: 'DAGs only. If the algorithm cannot consume every node, there is a cycle.' },
      { f: 'Adjacency list vs matrix?', b: 'List: O(V+E) space, default for sparse graphs. Matrix: O(1) edge checks, O(V²) space, for dense/small graphs.' },
    ],
    deepDive: [
      { label: 'Dijkstra = BFS + a priority queue', note: 'Swap the BFS queue for Day 30\'s min-heap keyed by path cost and you get Dijkstra\'s algorithm for weighted graphs. Sketch the change on paper — it is a 5-line diff.' },
    ],
  },
  {
    id: 'd032', day: 32, week: 5, phase: 2, kind: 'lesson',
    title: 'Sorting',
    analogy: 'Lining up the kids',
    objectives: [
      'Implement insertion sort and merge sort from scratch and explain their complexities',
      'Explain quicksort\'s partition idea and its O(n²) worst case',
      'Define stability and demonstrate why it matters for multi-key sorts',
      'Explain why comparison sorting cannot beat O(n log n) and when counting sort escapes the bound',
      'Apply the sort-then-solve pattern to simplify problems (merge intervals)',
    ],
    prereqs: [
      { day: 22, label: 'Big O & complexity' },
      { day: 27, label: 'Recursion & divide/conquer' },
    ],
    eli5: `A teacher lines up kids by height. The rookie method: take each kid and walk them backwards down the line until they slot in front of the first taller kid — insertion sort. Fine for a small class; agonizing for a stadium, because each kid may shuffle past half the line (that is the n² handshake feeling from Day 22).

The clever method: split the stadium into two halves, get each half lined up (however — split again, recursively!), then MERGE: both lines face you, and you repeatedly wave forward whichever front kid is shorter. Merging two sorted lines is one easy pass — that is merge sort, and the split-solve-merge shape is exactly Day 27's divide and conquer. Quicksort plays it differently: pick one kid (the pivot), send everyone shorter to the left and taller to the right, then repeat inside each side.

One more idea hides in plain sight: if two kids are the SAME height, does the line-up keep them in their original order? A method that does is called *stable* — it sounds like trivia until you sort by height *and then* by age and discover only stable sorts let the two orderings compose.`,
    why: `You will almost never implement a sort in production — Python's Timsort has that covered — but sorting is the interview's favorite complexity playground, and "sort first, then the problem becomes easy" is a genuinely load-bearing pattern: merge intervals, meeting rooms, deduplication, ranking eval results (Day 140), ordering retrieved chunks by score before reranking (Day 117). Stability bites for real: sort a DataFrame by date then by customer, and whether within-customer date order survives depends on the sort being stable. Knowing WHY the default sort is O(n log n) — and when a counting sort beats it — is the difference between using tools and understanding them.`,
    tech: `### Three algorithms, three personalities

**Insertion sort** grows a sorted prefix: take the next element, walk it left until it fits. O(n²) worst/average, but O(n) on nearly-sorted data and unbeatable on tiny inputs — which is why production sorts use it as their base case.

**Merge sort** is divide and conquer (Day 27): split in half, recursively sort each, merge two sorted lists in one linear pass. Always O(n log n) — log n levels of splitting, O(n) merging per level — but needs O(n) auxiliary space. Merging is the reusable half: "merge two sorted sequences" appears alone in interviews.

**Quicksort** partitions around a pivot — smaller elements left, larger right — then recurses into each side; no merge needed, sorting happens in place. Average O(n log n) with great constants; worst case O(n²) when pivots split badly (e.g. first-element pivot on sorted input). Random pivots make the worst case vanishingly unlikely. Naive quicksort is also unstable.

### Stability and the real world

A **stable** sort preserves the original relative order of equal keys. Sort people by name, then stably by department: within each department, names stay alphabetized — multi-key sorting by composing single-key sorts. Python's \`sorted()\`/\`list.sort()\` are guaranteed stable, run **Timsort** — a merge/insertion hybrid that exploits existing sorted runs, hitting O(n) on already-sorted data — and take a \`key=\` function (Day 12), which is almost always better than writing comparison logic.

### The n log n floor — and the trapdoor

Any sort that learns only by COMPARING elements must distinguish n! possible orderings; each comparison splits the possibilities in two, so log₂(n!) ≈ n log n comparisons are required. That is a proved lower bound, not an engineering shortfall. The trapdoor: if keys are small integers (0..k), **counting sort** skips comparisons entirely — tally occurrences into k buckets, read them off in order, O(n + k), stable, and the engine inside radix sort. Sorting a million exam scores (0–100)? Count, don't compare.`,
    viz: 'sort-race',
    guided: [
      {
        title: 'Implement the three, race them',
        minutes: 22,
        body: `1. Create \`sorting_lab.py\`. Implement \`insertion_sort\` (in place) and \`merge_sort\` (returns a new list) — the starter gives \`merge\` scaffolding and a correctness checker against \`sorted()\`.
2. Implement \`quicksort\` with a RANDOM pivot in the simple three-way-list style shown.
3. Race all three plus built-in \`sorted()\` on: random data (n = 2000), already-sorted data, reverse-sorted data. Before running, predict the ranking in each scenario and write it down.
4. Explain your two most interesting results out loud — expected: insertion sort wins on already-sorted (O(n)); a FIRST-element-pivot quicksort would die on sorted input (try it at n = 900 and watch for RecursionError — why ~900? Python's recursion limit).
5. Note how absurdly fast \`sorted()\` is — C-speed Timsort. State when you would still hand-roll: never in production; always in interviews.`,
        code: `import random, time

def insertion_sort(a):
    for i in range(1, len(a)):
        x, j = a[i], i - 1
        while j >= 0 and a[j] > x:
            a[j + 1] = a[j]
            j -= 1
        a[j + 1] = x
    return a

def merge(left, right):
    out, i, j = [], 0, 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:          # <= keeps it STABLE
            out.append(left[i]); i += 1
        else:
            out.append(right[j]); j += 1
    out.extend(left[i:]); out.extend(right[j:])
    return out

def merge_sort(a):
    if len(a) <= 1:
        return a
    mid = len(a) // 2
    return merge(merge_sort(a[:mid]), merge_sort(a[mid:]))

def quicksort(a):
    if len(a) <= 1:
        return a
    pivot = random.choice(a)
    lt = [x for x in a if x < pivot]
    eq = [x for x in a if x == pivot]
    gt = [x for x in a if x > pivot]
    return quicksort(lt) + eq + quicksort(gt)

for name, data in [("random", [random.randint(0, 9999) for _ in range(2000)]),
                   ("sorted", list(range(2000))),
                   ("reversed", list(range(2000, 0, -1)))]:
    for fn in (insertion_sort, merge_sort, quicksort, sorted):
        arr = list(data)
        t0 = time.perf_counter()
        result = fn(arr)
        ms = (time.perf_counter() - t0) * 1000
        assert list(result if result is not None else arr) == sorted(data)
        print(f"{name:9s} {fn.__name__:15s} {ms:8.2f} ms")`,
      },
      {
        title: 'Stability you can see + counting sort',
        minutes: 16,
        body: `1. Build the starter's list of (name, grade) tuples. Sort by name first, then sort THAT result by grade using \`key=\`. Print it: within each grade, names are still alphabetical. That composition is stability at work — Python guarantees it.
2. Now shuffle and sort by grade in ONE pass with \`key=lambda p: (p[1], p[0])\` — the tuple-key trick. Confirm it matches the two-pass result, and note when each style wins (two stable passes when the sorts happen at different times/places; tuple key when you control one call).
3. Implement \`counting_sort(scores)\` for exam scores 0–100. Race it against \`sorted()\` on one million random scores. Say precisely why comparing was never necessary: the key space is tiny and known.
4. **Classic — merge intervals** (sort-then-solve): given [[1,3],[8,10],[2,6],[15,18]], merge overlaps. Think aloud: "Unsorted, every interval might overlap any other — O(n²) checks. Sorted by start, overlaps can only be adjacent: one linear pass, extending or appending." Implement and test with touching intervals like [1,4],[4,5].`,
        code: `students = [("dana", 3), ("alice", 2), ("bob", 3), ("carol", 2), ("evan", 1)]

by_name = sorted(students)                             # alphabetical
by_grade = sorted(by_name, key=lambda p: p[1])         # stable: names survive
print(by_grade)  # within grade 2: alice before carol; grade 3: bob before dana

def counting_sort(scores, k=101):
    counts = [0] * k
    for s in scores:
        counts[s] += 1
    out = []
    for value, c in enumerate(counts):
        out.extend([value] * c)
    return out

def merge_intervals(intervals):
    merged = []
    for start, end in sorted(intervals):               # sort by start
        if merged and start <= merged[-1][1]:          # overlaps the last one
            merged[-1][1] = max(merged[-1][1], end)    # extend
        else:
            merged.append([start, end])                # start a new block
    return merged

print(merge_intervals([[1, 3], [8, 10], [2, 6], [15, 18]]))
# [[1, 6], [8, 10], [15, 18]]`,
      },
    ],
    practice: [
      {
        title: 'Meeting rooms',
        minutes: 20,
        body: `Part 1: given meeting intervals, can one person attend them all? Part 2 (the real question): what is the MINIMUM number of rooms needed to host all meetings?

Constraints: aim for O(n log n); brute-force pairwise checking is disqualified. Test with back-to-back meetings ([1,5],[5,8] need one room) and a triple overlap.

Hints (only if stuck): Part 1 is merge-intervals thinking — sort by start, look for any overlap between neighbors. Part 2 has two elegant solutions: (a) a min-heap (Day 30!) of room end-times — reuse the room that frees earliest; (b) sort starts and ends separately and sweep with two pointers (Day 24). Implement one, understand both.`,
      },
    ],
    project: {
      title: 'Sorting field notes + the eval-results sorter',
      brief: `Two parts in your practice repo. (1) \`dsa/sorting.py\`: today's implementations plus \`merge_intervals\` and meeting rooms, tested. (2) \`sort_evals.py\`, a taste of Day 140: given the provided CSV of mock eval results (columns: model, task, score, latency_ms), print a leaderboard sorted by score DESCENDING with latency ASCENDING as tiebreak — one \`sorted()\` call with a clever key — plus a per-task top-3 using the stable two-pass composition. Add a docstring explaining which sorts had to be stable and why. Commit both.`,
      rubric: [
        'Insertion, merge, and quicksort all pass the correctness checker on random/sorted/reversed/duplicate-heavy inputs',
        'Race table recorded with a one-line explanation of each ranking',
        'merge_intervals handles touching intervals ([1,4],[4,5]) correctly',
        'Leaderboard sorts descending-score with ascending-latency tiebreak in one sorted() call',
        'Stability explanation in the docstring names where an unstable sort would corrupt results',
        'Committed with tests green',
      ],
    },
    mistakes: [
      'Writing comparison logic by hand when key= does it: sorted(rows, key=lambda r: (-r.score, r.latency)) beats any manual comparator.',
      'Assuming quicksort is always O(n log n). Bad pivots (first element on sorted data) hit O(n²); random or median-of-three pivots are the fix.',
      'Forgetting merge sort\'s O(n) extra space when the interviewer asks "can you sort in place?" — quicksort and heapsort can; classic merge sort cannot.',
      'Believing O(n log n) is the floor for ALL sorting. It is the floor for COMPARISON sorting; counting/radix escape when keys are small integers.',
      'Using strict < in a merge and silently losing stability — equal elements must prefer the LEFT run (<=).',
      'Sorting when a heap answers the actual question: "top 10 of a million" wants Day 30\'s O(n log k) heap, not an O(n log n) full sort.',
    ],
    quiz: [
      {
        q: 'You sort employee rows by hire date, then stably sort by department. What is true of the result?',
        o: [
          'Rows are ordered by hire date only',
          'Within each department, rows remain ordered by hire date',
          'The department sort destroyed the date order',
          'The result is unpredictable',
        ],
        x: 1,
        w: 'Stability preserves the relative order of equal keys — so within one department (equal keys for the second sort), the earlier date order survives. This composition is the practical payoff of stable sorts.',
        revisit: 32,
      },
      {
        q: 'Why can no comparison sort beat O(n log n) in the worst case?',
        o: [
          'Because merge sort is the best possible algorithm',
          'n! possible orderings exist and each comparison halves the candidates, so log₂(n!) ≈ n log n comparisons are needed',
          'Because of CPU cache behavior',
          'It can — quicksort averages better',
        ],
        x: 1,
        w: 'The decision-tree argument: distinguishing all n! permutations with binary answers requires log₂(n!) = Θ(n log n) comparisons. Counting sort escapes only by NOT comparing.',
        revisit: 32,
      },
      {
        q: 'A million integer scores in 0–100 need sorting. The strongest choice?',
        o: [
          'Timsort via sorted() — always optimal',
          'Quicksort with random pivots',
          'Counting sort — O(n + k) with k = 101, no comparisons needed',
          'Insertion sort — the data is small',
        ],
        x: 2,
        w: 'A tiny, known key range makes counting sort O(n + k), beating any O(n log n) comparison sort. sorted() is a fine default, but this is the trapdoor case.',
        revisit: 32,
      },
    ],
    resources: [
      { label: 'VisuAlgo — Sorting race visualization', url: 'https://visualgo.net/en/sorting', type: 'tool', time: '20 min' },
      { label: 'OpenDSA — Sorting chapter', url: 'https://opendsa-server.cs.vt.edu/', type: 'book', time: '25 min' },
      { label: 'CS50x Week 3 — Algorithms (sorting segment)', url: 'https://cs50.harvard.edu/x/', type: 'course', time: '30 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: due cards (graphs, heaps, Big O)', minutes: 10 },
      { activity: 'ELI5 + tech read; run the sort-race visualizer on 3 input shapes', minutes: 18 },
      { activity: 'Guided: implement & race, stability + counting sort + merge intervals', minutes: 38 },
      { activity: 'Practice: meeting rooms', minutes: 20 },
      { activity: 'Project: sorting field notes + eval-results sorter', minutes: 24 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'All three sorts pass correctness checks; race results recorded and explained',
      'Stability composition demonstrated and explained in your own words',
      'Meeting rooms solved at O(n log n) with the approach named',
      'Eval-results sorter committed with the stability docstring',
      'Quiz ≥ 2/3',
    ],
    connections: {
      back: 'Merge sort is Day 27\'s divide-and-conquer made concrete, the race harness is Day 22\'s timing lab, and meeting rooms reunites Day 30\'s heap with Day 24\'s two pointers.',
      forward: 'Day 33 exploits what sorting buys: binary search only works on sorted data. Day 66\'s pandas sort_values inherits stability semantics, Day 117 sorts retrieved chunks by rerank score, and Day 140\'s eval reports are the leaderboard you just built, for real.',
    },
    flashcards: [
      { f: 'Stable sort — definition and payoff?', b: 'Equal keys keep their original relative order; lets multi-key sorts compose (sort by B, then stably by A).' },
      { f: 'Quicksort worst case and the fix?', b: 'O(n²) on bad pivots (sorted input, first-element pivot). Fix: random pivot.' },
      { f: 'Why is comparison sorting Ω(n log n)?', b: 'Must distinguish n! orderings; each comparison halves candidates → log₂(n!) ≈ n log n.' },
      { f: 'When does counting sort win?', b: 'Small known integer key range: O(n + k), stable, no comparisons. Engine of radix sort.' },
      { f: 'What is Timsort?', b: 'Python\'s stable merge/insertion hybrid; exploits existing runs, O(n) on sorted data.' },
      { f: 'Sort-then-solve example?', b: 'Merge intervals: sorted by start, overlaps can only be adjacent — one linear pass.' },
    ],
    deepDive: [
      { label: 'Timsort\'s run detection', note: 'Timsort scans for pre-sorted "runs" and merges them cleverly. Skim the algorithm\'s description and connect it to why your already-sorted benchmark was near-instant.' },
    ],
  },
  {
    id: 'd033', day: 33, week: 5, phase: 2, kind: 'lesson',
    title: 'Binary Search & Variants',
    analogy: 'Halving the phone book',
    objectives: [
      'Write a bug-free classic binary search and defend every boundary choice',
      'Explain invariant thinking as the cure for off-by-one errors',
      'Implement first/last-occurrence (boundary) search',
      'Recognize and solve "search on the answer space" problems',
      'Use the bisect module for insertion points and range counting',
    ],
    prereqs: [
      { day: 22, label: 'Big O & complexity' },
      { day: 32, label: 'Sorting' },
      { day: 29, label: 'Binary trees & BSTs' },
    ],
    eli5: `Finding "Nakamura" in a paper phone book, nobody starts at page 1. You split the book in the middle — "Miller" — too early, so Nakamura lives strictly in the right half, and you have eliminated half the book with one glance. Split the survivor, glance, discard half again. A 1,000-page book takes ten glances; a million pages, twenty. That is binary search: each look kills half the possibilities, which is Day 22's O(log n) signature.

The famous catch: binary search is easy to describe and notoriously easy to implement wrong — the first published version took years to get right in print. The cure is not cleverness but a *promise you refuse to break*: "the answer, if it exists, is always inside [lo, hi]." Every line of the loop must keep that promise true — that is an invariant, and checking your code against it beats staring at ±1s.

The bigger unlock: the "phone book" does not have to be a list. Any question shaped "no no no no YES yes yes" — falses then trues — can be halved. "Can I ship all packages with capacity C?" is monotonic in C, so you binary-search over *candidate answers*, using a checker function as your glance.`,
    why: `O(log n) is the difference between touching 20 items and 20 million, which is why binary search underlies everything fast: Day 38's B-tree index descent is binary search adapted for disk pages, git bisect halves your commit history to find the breaking change (a debugging move you will use for real), and capacity tuning ("lowest rate limit that stops 429s", "largest chunk size that stays under the token budget" on Day 114) is search-on-answer thinking. In interviews, boundary variants ("first bad version", "search rotated array", "Koko eating bananas") are prized precisely because they punish sloppy invariants — the discipline is the skill being tested.`,
    tech: `### The classic, held together by an invariant

Search a sorted list for target: maintain \`lo, hi = 0, len(a) - 1\` with the invariant *"if target exists, its index is in [lo, hi]"*. Loop while \`lo <= hi\`; compute \`mid = (lo + hi) // 2\`; three-way compare: found → return; \`a[mid] < target\` → target is strictly right of mid, so \`lo = mid + 1\`; else \`hi = mid - 1\`. Both updates EXCLUDE mid — it was just ruled out — so the range strictly shrinks and the loop terminates. When the loop exits, the invariant says the target does not exist. Every off-by-one bug is a violated invariant: \`lo = mid\` risks an infinite loop on a two-element range; \`while lo < hi\` with the wrong exit can skip the last candidate. (Historical footnote: in fixed-width languages \`(lo+hi)/2\` can overflow; Python's ints are unbounded, but the \`lo + (hi-lo)//2\` idiom is worth recognizing.)

### Boundary search — first true / last true

With duplicates, "find 7" becomes "find the FIRST 7" — a different loop. Reframe as a predicate flipping false→true across the array and find the flip point: when \`a[mid]\` satisfies the predicate, RECORD mid as a candidate and keep searching left (\`hi = mid - 1\`); otherwise \`lo = mid + 1\`. Last-occurrence mirrors it. This "first index where P(i) is true" template solves first-bad-version, insertion points, and range counting — and is really what the classic search is a special case of.

### Search on the answer space

When the ANSWER is a number with a monotonic feasibility check — "minimum speed to finish in time", "smallest capacity that fits" — binary-search candidate answers: \`lo, hi\` bracket possible answers; \`feasible(mid)\` (an O(n) checker) plays the comparison; find the smallest feasible value with the boundary template. Cost: O(n log(answer range)). Recognizing this pattern is the day's biggest prize.

### bisect — the stdlib's version

\`bisect_left(a, x)\` returns the first index where x could insert keeping order (== index of first occurrence if present); \`bisect_right\` the last such index. Their difference counts occurrences; \`insort\` maintains a sorted list. Reach for bisect in real code; write the loop in interviews.`,
    viz: 'binary-search',
    guided: [
      {
        title: 'The classic + the boundary template',
        minutes: 20,
        body: `1. Create \`binary_search_lab.py\`. Write \`binary_search(a, target)\` from the invariant, narrating each branch: "mid is too small, so the answer lives in [mid+1, hi]".
2. Fuzz it — the starter compares your function against \`list.index\` on 1,000 random sorted lists including empties, singletons, missing targets, and duplicates. A subtle off-by-one WILL be caught here; fix by re-checking the invariant, not by trial-and-error ±1.
3. **Classic 1 — first and last occurrence.** Implement \`first_pos\` and \`last_pos\` with the record-and-continue boundary template. Test on [5, 7, 7, 7, 8] for target 7 → (1, 3), and on a missing target → (-1, -1).
4. Cross-check with \`bisect_left\`/\`bisect_right\` and confirm: count of 7s == bisect_right - bisect_left. Two lines, no loop — the stdlib version of what you just wrote.`,
        code: `import random
from bisect import bisect_left, bisect_right

def binary_search(a, target):
    lo, hi = 0, len(a) - 1
    while lo <= hi:                     # invariant: answer (if any) in [lo, hi]
        mid = (lo + hi) // 2
        if a[mid] == target:
            return mid
        if a[mid] < target:
            lo = mid + 1                # mid ruled out -> exclude it
        else:
            hi = mid - 1
    return -1

def first_pos(a, target):
    lo, hi, ans = 0, len(a) - 1, -1
    while lo <= hi:
        mid = (lo + hi) // 2
        if a[mid] == target:
            ans = mid                   # record, then keep pushing LEFT
            hi = mid - 1
        elif a[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return ans

# fuzzer: your search vs the naive truth
for trial in range(1000):
    a = sorted(random.sample(range(50), random.randint(0, 20)))
    t = random.randint(0, 50)
    got = binary_search(a, t)
    if t in a:
        assert a[got] == t, (a, t, got)
    else:
        assert got == -1, (a, t, got)
print("fuzz passed")

a = [5, 7, 7, 7, 8]
print(first_pos(a, 7), bisect_left(a, 7))          # 1 1
print(bisect_right(a, 7) - bisect_left(a, 7))      # 3 sevens`,
      },
      {
        title: 'Rotated arrays + Koko eats bananas, think-aloud',
        minutes: 22,
        body: `1. **Classic 2 — minimum of a rotated sorted array** ([4,5,6,7,0,1,2]). Think aloud: "Sorted-then-rotated means TWO sorted runs; the minimum is the seam. Compare a[mid] with a[hi]: if a[mid] > a[hi], the seam is strictly right of mid; else it is at mid or left." Implement \`find_min_rotated\` and test rotations 0..n-1 of range(8) exhaustively in a loop — the not-rotated-at-all case is the one that catches people.
2. **Classic 3 — Koko eating bananas** (search on answer). Koko has piles of bananas and h hours; eating speed k means each pile takes ceil(pile/k) hours. Find the MINIMUM k that finishes in time. Think aloud: "I cannot binary search the piles — but feasibility is monotonic in k: too slow fails, fast enough always works. So the answer space [1, max(pile)] is my phone book and feasible() is my glance."
3. Implement with the boundary template over the answer space. Test piles=[3,6,7,11], h=8 → 4.
4. State the complexity: O(n log max_pile) — and generalize aloud: "monotonic feasibility + numeric answer = binary search the answer."`,
        code: `def find_min_rotated(a):
    lo, hi = 0, len(a) - 1
    while lo < hi:                       # invariant: min is in [lo, hi]
        mid = (lo + hi) // 2
        if a[mid] > a[hi]:               # seam strictly right of mid
            lo = mid + 1
        else:                            # a[mid] could BE the min: keep it
            hi = mid
    return a[lo]

for r in range(8):                       # every rotation of 0..7
    a = list(range(8))[r:] + list(range(8))[:r]
    assert find_min_rotated(a) == 0, a
print("rotations passed")

def min_eating_speed(piles, h):
    def feasible(k):                     # can Koko finish at speed k?
        return sum((p + k - 1) // k for p in piles) <= h

    lo, hi, ans = 1, max(piles), max(piles)
    while lo <= hi:
        mid = (lo + hi) // 2
        if feasible(mid):
            ans = mid                    # record, try slower (smaller k)
            hi = mid - 1
        else:
            lo = mid + 1
    return ans

print(min_eating_speed([3, 6, 7, 11], 8))    # 4
print(min_eating_speed([30, 11, 23, 4, 20], 5))  # 30`,
      },
    ],
    practice: [
      {
        title: 'Ship packages within D days',
        minutes: 20,
        body: `A conveyor belt must ship packages (given weights, in order — no reordering) within D days. Each day you load consecutive packages up to a capacity limit. Find the minimum capacity that ships everything in D days.

Constraints: O(n log(sum of weights)). Identify lo (think: what capacity is forced by the heaviest single package?) and hi before coding. Test: weights 1..10, D=5 → 15.

Hints: this is Koko in a shipping costume — feasible(capacity) greedily fills days and checks days_used <= D. lo = max(weights) (a package cannot be split), hi = sum(weights) (one giant day).`,
      },
    ],
    project: {
      title: 'Binary search toolkit + a config auto-tuner',
      brief: `In \`dsa/binsearch.py\`, collect today's five functions (classic, first/last, rotated min, Koko, ship-capacity) with the fuzz tests. Then the transfer task, \`autotune.py\`: the starter's \`simulate(batch_size)\` function (provided stub — it mimics a service that gets faster with bigger batches until it starts failing past a hidden memory threshold) must be tuned. Binary-search the largest batch size whose simulate() call reports success, in at most 12 probes for a 1..4096 range. Print each probe — the log should read like a bisection. Commit; write one docstring line connecting this to git bisect.`,
      rubric: [
        'Classic search survives the 1,000-case fuzzer including empties and duplicates',
        'Rotated-min passes the exhaustive all-rotations test',
        'Koko and ship-capacity share a visibly identical boundary template',
        'Auto-tuner finds the hidden threshold in ≤ 12 probes with a printed probe log',
        'Committed with tests green and the git-bisect connection noted',
      ],
    },
    mistakes: [
      'Fixing off-by-ones by sprinkling ±1 until tests pass. State the invariant ("answer is in [lo, hi]") and derive every update from it — that is the actual skill.',
      'Writing lo = mid (not mid + 1) after ruling mid out — on a two-element range mid == lo and the loop never shrinks: infinite loop.',
      'Returning ANY match when the problem needs the FIRST. Duplicates demand the boundary template (record and continue), not the classic three-way search.',
      'Missing that binary search requires sorted data — or a monotonic predicate. On unsorted data it returns garbage without erroring.',
      'Not recognizing search-on-answer: if the answer is numeric and feasibility is monotonic ("if k works, k+1 works"), the answer space is the array.',
      'Confusing bisect_left and bisect_right: left = first insertion point (first occurrence); right = past the last. Their difference counts occurrences.',
    ],
    quiz: [
      {
        q: 'Your binary search loops forever on a = [3, 8] searching for 8. The most likely bug?',
        o: [
          'The list is too small',
          'An update like lo = mid that fails to exclude the ruled-out mid, so the range stops shrinking',
          'mid overflow',
          'Using while lo <= hi',
        ],
        x: 1,
        w: 'With lo=0, hi=1, mid=0: if the code sets lo = mid, the range [0,1] never shrinks. Every update must exclude mid once it is ruled out — that is what the invariant demands.',
        revisit: 33,
      },
      {
        q: 'Which problem is NOT solvable by binary search?',
        o: [
          'First version where the tests started failing (versions fail from some point on)',
          'Minimum eating speed with a monotonic feasibility check',
          'Find any target in an UNSORTED array without preprocessing',
          'First occurrence of a value in a sorted array with duplicates',
        ],
        x: 2,
        w: 'Binary search needs sortedness or a monotonic false→true structure to discard half. An unsorted array offers no basis for discarding anything — you cannot beat O(n) there.',
        revisit: 33,
      },
      {
        q: 'In sorted a with duplicates, what does bisect_right(a, x) - bisect_left(a, x) compute?',
        o: ['The index of x', 'The number of occurrences of x', 'Always 1', 'The insertion point'],
        x: 1,
        w: 'bisect_left is the first position of x, bisect_right one past the last — the difference is the count (0 if absent). A two-line range counter.',
        revisit: 33,
      },
    ],
    resources: [
      { label: 'bisect — official Python docs', url: 'https://docs.python.org/3/library/bisect.html', type: 'docs', time: '15 min' },
      { label: 'VisuAlgo — BST/search visualizations (watch the halving)', url: 'https://visualgo.net/en/bst', type: 'tool', time: '10 min' },
      { label: 'OpenDSA — Search chapter', url: 'https://opendsa-server.cs.vt.edu/', type: 'book', time: '20 min' },
      { label: 'NeetCode Roadmap — Binary Search section', url: 'https://neetcode.io/roadmap', type: 'course', time: '15 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: due cards (sorting, graphs, heaps)', minutes: 10 },
      { activity: 'ELI5 + tech read; step the visualizer and predict each probe', minutes: 18 },
      { activity: 'Guided: classic + boundaries, rotated + Koko', minutes: 42 },
      { activity: 'Practice: ship packages within D days', minutes: 20 },
      { activity: 'Project: toolkit + config auto-tuner', minutes: 20 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'Classic search passes the 1,000-case fuzzer untouched',
      'First/last occurrence matches bisect_left/bisect_right on all tests',
      'Koko and ship-capacity solved with the search-on-answer template',
      'Auto-tuner converges in ≤ 12 probes; toolkit committed',
      'Quiz ≥ 2/3',
    ],
    connections: {
      back: 'The halving is Day 22\'s O(log n) row made mechanical, Day 32\'s sorting is the precondition that makes it legal, and Day 29\'s BST search was this same walk through pointers instead of indexes.',
      forward: 'Day 38\'s B-tree index descent is binary search restructured for disk. Day 34 meets problems where halving fails and memoization takes over. The search-on-answer pattern returns for capacity planning on Day 160, and git bisect is this algorithm applied to your commit history.',
    },
    flashcards: [
      { f: 'The binary search invariant?', b: '"If the answer exists, it is inside [lo, hi]" — every update must preserve it and shrink the range.' },
      { f: 'Boundary template for FIRST occurrence?', b: 'On match: record mid, keep searching left (hi = mid - 1). Never return early.' },
      { f: 'When can you binary-search a non-array?', b: 'Numeric answer + monotonic feasibility check → search the answer space with feasible(mid) as the comparison.' },
      { f: 'bisect_left vs bisect_right?', b: 'Left: first valid insertion point (= first occurrence). Right: past the last. Difference = count.' },
      { f: 'Classic infinite-loop bug?', b: 'lo = mid after ruling mid out — range stops shrinking on 2 elements. Use mid + 1.' },
      { f: 'Cost of search-on-answer?', b: 'O(n log R): log R candidate answers, each checked by an O(n) feasibility scan.' },
    ],
    deepDive: [
      { label: 'git bisect on a real repo', note: 'Intentionally break a test in your practice repo several commits back, then use git bisect run pytest to find the culprit automatically. Binary search over history — 4 probes for 16 commits.' },
    ],
  },
  {
    id: 'd034', day: 34, week: 5, phase: 2, kind: 'lesson',
    title: 'Dynamic Programming Intro',
    analogy: 'Remembering solved puzzles',
    objectives: [
      'Identify overlapping subproblems and optimal substructure in a problem statement',
      'Convert an exponential recursion into memoized top-down DP',
      'Convert memoization into bottom-up tabulation and compare the trade-offs',
      'Solve the 1D classics (climbing stairs, house robber) and a 2D grid problem',
      'Judge when DP is overkill and brute force or greedy is fine',
    ],
    prereqs: [
      { day: 27, label: 'Recursion & divide/conquer (memoized fib)' },
      { day: 22, label: 'Big O & complexity' },
      { day: 12, label: 'Decorators & lru_cache' },
    ],
    eli5: `You are solving a jigsaw-puzzle marathon, and the organizers are lazy: many puzzles are repeats. The naive contestant re-solves every repeat from scratch. The smart one keeps a notebook — "puzzle #47: done, here is the picture" — and when a repeat appears, copies the answer in five seconds. That notebook is dynamic programming.

The trick only pays when two things are true. First, the same sub-puzzles must actually REPEAT — Day 27's fib exploded precisely because fib(40) re-solves fib(38) hundreds of thousands of times. Second, big answers must be buildable from small ones: "the best way up 10 stairs" is decided by the best ways up 8 and 9 — you never need to reconsider HOW you reached step 8, only the count. When both hold, an exponential mountain of repeated work collapses into a small table of distinct entries, each computed once.

Two ways to keep the notebook: solve top-down and jot answers as you happen to need them (memoization — recursion plus a cache), or fill the notebook in order from puzzle #1 up, knowing each entry only needs earlier ones (tabulation — a loop and an array). Same table, opposite directions.`,
    why: `DP is the interview boss battle — the topic hiring loops use to separate pattern-matchers from problem-solvers — and Day 35's drill and Day 179's gym both feature it. But you have already met production DP without the name: Day 12's lru_cache IS memoization, and caching expensive LLM calls keyed by input (Day 107, Day 156) is the same economics — pay once, look up forever, spend memory to buy time. Edit distance — a 2D DP — powers the fuzzy string matching inside spell-checkers and diff tools. The recognition skill ("these subproblems repeat") transfers to every caching decision you will ever make.`,
    tech: `DP applies when a problem has **overlapping subproblems** (the recursion tree revisits identical states — contrast merge sort, whose halves are disjoint, which is why it is divide-and-conquer, not DP) and **optimal substructure** (an optimal answer composes from optimal sub-answers).

### The four-step method

1. **Define the state**: what does dp[i] MEAN, in one sentence? ("dp[i] = number of distinct ways to reach step i.") Fuzzy state definitions are where DP attempts die.
2. **Write the recurrence**: dp[i] in terms of smaller states. Climbing stairs (1 or 2 steps at a time): dp[i] = dp[i-1] + dp[i-2] — the last move came from one of those two steps, and the two option sets are disjoint.
3. **Base cases**: the smallest states with known answers (dp[0] = 1, dp[1] = 1).
4. **Order + answer**: fill so dependencies come first; name which cell is the final answer.

### Memoization vs tabulation

**Top-down** keeps the natural recursion and adds a cache — \`@functools.lru_cache\` makes it a one-line change and only computes states actually reached. Costs: call-stack depth (recursion limits) and function-call overhead. **Bottom-up** replaces recursion with a loop filling an array in dependency order — no stack risk, often lets you shrink O(n) storage to O(1) when dp[i] depends only on a fixed window (stairs needs just two variables). Same asymptotics: O(states × work per state).

### The decision pattern — house robber

Adjacent houses cannot both be robbed. State: dp[i] = best loot from the first i houses. At house i, two choices: skip it (dp[i-1]) or take it, forfeiting house i-1 (dp[i-2] + value[i]). dp[i] = max of the two. This take-it-or-leave-it recurrence is the skeleton of a huge problem family (knapsack, scheduling).

### 2D and beyond

Grid paths: dp[r][c] = paths to reach cell (r, c) moving only right/down = dp[r-1][c] + dp[r][c-1]; edges are base cases. Two-sequence problems (longest common subsequence, edit distance) use dp[i][j] over prefix pairs — recognize the shape today; you will drill it during interview prep. And judgment: for small inputs with no repeated states, honest brute force beats a mis-specified DP every time.`,
    viz: 'dp-grid',
    guided: [
      {
        title: 'Exponential → memo → table, measured',
        minutes: 20,
        body: `1. Create \`dp_lab.py\`. Time naive \`climb(35)\` (starter) — the pure recursion. Feel the exponential pain (seconds).
2. Add \`@functools.lru_cache\` and re-time climb(35), then climb(500). From seconds to microseconds — say why in complexity terms: 2^n repeated calls collapsed into n distinct states, each O(1).
3. Now write \`climb_table(n)\` bottom-up with two variables (O(1) space). Verify all three agree on n = 1..20.
4. Try naive-recursive climb_memo(4000) — RecursionError — then climb_table(4000): instant. Record the lesson: memoization inherits recursion limits; tabulation does not.
5. Write the four-step method for stairs in comments ABOVE the code: state meaning, recurrence, bases, answer location. This writing habit is the interview skill.`,
        code: `import functools, time

def climb_naive(n):
    if n <= 1:
        return 1
    return climb_naive(n - 1) + climb_naive(n - 2)

@functools.lru_cache(maxsize=None)
def climb_memo(n):
    if n <= 1:
        return 1
    return climb_memo(n - 1) + climb_memo(n - 2)

def climb_table(n):
    # state: ways[i] = distinct ways to reach step i
    # recurrence: ways[i] = ways[i-1] + ways[i-2]; bases ways[0]=ways[1]=1
    prev2, prev1 = 1, 1
    for _ in range(2, n + 1):
        prev2, prev1 = prev1, prev1 + prev2
    return prev1

t0 = time.perf_counter()
print("naive(35):", climb_naive(35), f"{time.perf_counter() - t0:.2f}s")
t0 = time.perf_counter()
print("memo(500):", str(climb_memo(500))[:12] + "...", f"{time.perf_counter() - t0:.6f}s")
assert all(climb_memo(i) == climb_table(i) for i in range(1, 21))
print("table(4000) digits:", len(str(climb_table(4000))))`,
      },
      {
        title: 'House robber + grid paths, think-aloud',
        minutes: 22,
        body: `1. **Classic — house robber.** Think aloud through the four steps: "STATE: best[i] = max loot using houses 0..i. CHOICE at house i: skip → best[i-1], or rob → best[i-2] + v[i]. RECURRENCE: max of the two. BASES: best[0] = v[0], best[1] = max(v[0], v[1])." Implement bottom-up with two variables.
2. Test on [2, 7, 9, 3, 1] → 12 (rob 2+9+1) and the adversarial [2, 1, 1, 2] → 4 — the case that kills the "rob every other house" greedy. Say why greedy fails: local alternation is not optimal structure.
3. **Classic — unique grid paths.** Think aloud: "STATE: paths[r][c] = ways to reach (r, c) going only right/down. RECURRENCE: sum of the cell above and the cell to the left. BASES: top row and left column are all 1." Fill the table for a 3×7 grid → 28.
4. Print the filled 2D table as rows and trace one cell's value by pointing at its two parents — the dp-grid visualizer shows the same flow. Then the recognition drill: which earlier problem was secretly this? (Pascal's triangle; combinatorics C(m+n-2, m-1) — check it.)`,
        code: `def rob(values):
    if not values:
        return 0
    prev2, prev1 = 0, 0          # best up to i-2, i-1 (0 houses -> 0)
    for v in values:
        prev2, prev1 = prev1, max(prev1, prev2 + v)
    return prev1

assert rob([2, 7, 9, 3, 1]) == 12
assert rob([2, 1, 1, 2]) == 4    # greedy alternation gives 3 -- wrong

def unique_paths(rows, cols):
    dp = [[1] * cols for _ in range(rows)]     # edges: exactly one way
    for r in range(1, rows):
        for c in range(1, cols):
            dp[r][c] = dp[r - 1][c] + dp[r][c - 1]
    for row in dp:
        print(row)
    return dp[-1][-1]

print("paths 3x7:", unique_paths(3, 7))        # 28

import math
assert unique_paths(3, 7) == math.comb(3 + 7 - 2, 3 - 1)`,
      },
    ],
    practice: [
      {
        title: 'Coin change (fewest coins)',
        minutes: 20,
        body: `Given coin denominations and a target amount, return the FEWEST coins that make the amount, or -1 if impossible. Example: coins [1, 4, 5], amount 8 → 2 (4+4). Note the greedy trap: largest-coin-first gives 5+1+1+1 = 4 coins. Wrong.

Run the four-step method in comments before coding. Constraints: O(amount × coins) tabulation. Test: ([1,4,5], 8) → 2, ([2], 3) → -1, ([1], 0) → 0.

Hints: state dp[a] = fewest coins for amount a; recurrence dp[a] = 1 + min(dp[a - c] for usable c); base dp[0] = 0; use a sentinel (inf) for unreachable amounts and translate to -1 at the end.`,
      },
    ],
    project: {
      title: 'The DP recognition card + toolkit',
      brief: `Two deliverables. (1) \`dsa/dp.py\`: today's four problems (stairs, robber, grid paths, coin change), each with its four-step comment block and tests including the greedy-killer cases. (2) \`dp_recognition.md\`: your personal recognition card — the 4 signals a problem wants DP ("count the ways…", "min/max cost to reach…", choices with overlapping futures, feasibility of building a target), the memo-vs-table decision in two sentences, and the greedy-vs-DP lesson from coin change in your own words. This card gets drilled tomorrow (Day 35) and again on Day 179. Commit both.`,
      rubric: [
        'All four problems pass tests, including [2,1,1,2] for robber and the coin-change greedy trap',
        'Every solution has the four-step comment block (state, recurrence, bases, answer)',
        'Stairs and robber use O(1) space; grid paths and coin change use tabulation',
        'Recognition card lists ≥ 4 DP signals with one example problem each',
        'Committed; card is reachable from the repo README',
      ],
    },
    mistakes: [
      'Coding before defining the state in words. "dp[i] = …what exactly?" — if you cannot finish that sentence, the recurrence will be wrong.',
      'Calling any recursion+cache "DP" — merge sort\'s halves never repeat, so caching buys nothing. DP needs OVERLAPPING subproblems.',
      'Trusting greedy where DP is needed: coin change with [1,4,5] breaks largest-first. If a local choice can be globally wrong, you need DP (or a proof greedy works).',
      'Off-by-one base cases: is dp[0] "zero items" or "the first item"? Decide, write it down, and make tests hit n = 0 and n = 1.',
      'Memoizing on unhashable or unnecessary state — lru_cache needs hashable args, and dragging a whole list into the key when an index suffices explodes the state space.',
      'Forgetting that memoized recursion still hits Python\'s recursion limit (~1000 frames). Deep chains (n = 4000) want tabulation.',
    ],
    quiz: [
      {
        q: 'What TWO properties must a problem have for DP to beat brute force?',
        o: [
          'Sorted input and unique elements',
          'Overlapping subproblems and optimal substructure',
          'A recursive solution and a base case',
          'Small input and integer answers',
        ],
        x: 1,
        w: 'Subproblems must repeat (so caching pays) and optimal answers must compose from optimal sub-answers (so the recurrence is valid). Divide-and-conquer has the second but not the first.',
        revisit: 34,
      },
      {
        q: 'Memoized climb(4000) crashes with RecursionError but the tabulated version works. Why?',
        o: [
          'lru_cache has a size limit',
          'Top-down recursion stacks ~4000 frames, past Python\'s limit; bottom-up is a loop with no frame growth',
          'Tabulation has better time complexity',
          'The memo version computes wrong answers first',
        ],
        x: 1,
        w: 'Both are O(n) time. Memoization inherits the recursion depth of the call chain; tabulation replaces the stack with iteration — the classic practical reason to convert.',
        revisit: 34,
      },
      {
        q: 'For coins [1, 4, 5] and amount 8, greedy largest-first returns 4 coins (5,1,1,1). DP returns 2 (4,4). What does this show?',
        o: [
          'Greedy is always wrong',
          'DP explores all decompositions via the recurrence, while greedy commits to locally best choices that can be globally suboptimal',
          'The coin system is invalid',
          'DP got lucky',
        ],
        x: 1,
        w: 'The recurrence dp[8] = 1 + min(dp[7], dp[4], dp[3]) considers every last-coin choice; greedy never revisits its 5. Some coin systems are greedy-safe; arbitrary ones need DP.',
        revisit: 34,
      },
    ],
    resources: [
      { label: 'functools.lru_cache — official Python docs', url: 'https://docs.python.org/3/library/functools.html', type: 'docs', time: '10 min' },
      { label: 'OpenDSA — Dynamic Programming chapter', url: 'https://opendsa-server.cs.vt.edu/', type: 'book', time: '25 min' },
      { label: 'NeetCode Roadmap — 1-D Dynamic Programming section', url: 'https://neetcode.io/roadmap', type: 'course', time: '20 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: due cards (binary search, recursion, sorting)', minutes: 10 },
      { activity: 'ELI5 + tech read; watch values flow through the dp-grid visualizer', minutes: 18 },
      { activity: 'Guided: exponential→memo→table, robber + grid paths', minutes: 42 },
      { activity: 'Practice: coin change', minutes: 20 },
      { activity: 'Project: DP toolkit + recognition card', minutes: 20 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'Timed the exponential→memo collapse and explained it in complexity terms',
      'Robber passes [2,1,1,2]; coin change passes the greedy trap',
      'Every solution carries its four-step comment block',
      'Recognition card committed and linked from the README',
      'Quiz ≥ 2/3',
    ],
    connections: {
      back: 'Day 27\'s memoized fib was DP without the name, and Day 12\'s lru_cache is the memoization tool. Grid paths is Day 31\'s path-counting on an implicit DAG — tabulation IS topological order.',
      forward: 'Tomorrow\'s drill (Day 35) tests recognition under time pressure, and Day 179 drills the 2D family (LCS, edit distance). The pay-once-look-up-forever economics returns as response caching on Day 107 and semantic caching on Day 156.',
    },
    flashcards: [
      { f: 'Two properties that make DP apply?', b: 'Overlapping subproblems (repeats make caching pay) + optimal substructure (optimal composes from optimal).' },
      { f: 'The four-step DP method?', b: '1) define state in words, 2) recurrence, 3) base cases, 4) fill order + where the answer lives.' },
      { f: 'Memoization vs tabulation?', b: 'Top-down recursion + cache (lazy, stack-limited) vs bottom-up loop (no stack risk, enables O(1)-space windows).' },
      { f: 'House robber recurrence?', b: 'best[i] = max(best[i-1], best[i-2] + v[i]) — skip or take-and-forfeit-neighbor.' },
      { f: 'Why does greedy fail coin change [1,4,5] for 8?', b: 'Greedy commits to 5, forcing 5+1+1+1; DP\'s recurrence finds 4+4. Local best ≠ global best.' },
      { f: 'DP problem signals?', b: '"Count the ways", "min/max cost to reach", sequential choices with shared futures, target-building feasibility.' },
    ],
    deepDive: [
      { label: 'Edit distance — the 2D shape you will meet again', note: 'Sketch the dp[i][j] table for transforming "cat" → "cart" (insert/delete/replace). Same grid flow as unique paths, with a 3-way min. Full treatment lands in interview prep.' },
    ],
  },
  {
    id: 'd035', day: 35, week: 5, phase: 2, kind: 'review',
    title: 'Week 5 Checkpoint: Interview Drill I',
    analogy: 'The whiteboard warm-up',
    objectives: [
      'Retrieve Week 5\'s six topics from memory under light time pressure',
      'Complete a 3-problem timed mock (tree / graph / DP) with a think-aloud protocol',
      'Diagnose misses into a written error log with named causes',
      'Map each Week 5 pattern to its recognition signals',
      'Set up an ongoing NeetCode practice cadence for the rest of the program',
    ],
    prereqs: [
      { day: 29, label: 'Trees & BSTs' },
      { day: 31, label: 'Graphs, BFS & DFS' },
      { day: 33, label: 'Binary search' },
      { day: 34, label: 'Dynamic programming' },
    ],
    eli5: `A pianist does not prepare for a recital by reading sheet music one more time — they play the piece with the score CLOSED, hit the wrong notes, and drill exactly those bars. Today is your closed-score day. This week filled your hands with six instruments — trees, heaps, graphs, sorting, binary search, DP — and today you find out which ones you can actually play from memory, because "I recognized it when I saw the solution" and "I produced it from a blank page" are different skills stored in different places.

The science is boring and bulletproof: retrieval practice — struggling to pull something OUT of memory — strengthens it far more than re-reading, and the struggle works best right as you are starting to forget, which for Monday's trees is… today. So today you write traversals with the editor closed, solve three timed problems cold, and — the part most learners skip — write down *why* each miss happened. That error log becomes the most personally valuable document of your interview prep: a list of exactly your weak bars, updated every drill day until Day 179.`,
    why: `Interview coding rounds are retrieval under pressure with an audience — the only way to train that is to simulate it, which is why every drill day from here to Day 179 uses timed, closed-book mocks. The think-aloud protocol you practice today (restate → examples → brute force → pattern → complexity → code → trace) is scored by real interviewers as heavily as the code itself. And the error log habit compounds: by Day 179 it will tell you precisely which five patterns to cram in your final week instead of anxiously re-reading everything.`,
    tech: `### Why the drill works

Spaced repetition exploits the forgetting curve: memory decays roughly exponentially, and each successful retrieval at the edge of forgetting flattens the curve. Your deck's SM-2-lite scheduler surfaces cards near that edge — trust it over re-reading, which produces fluency illusions (the material feels known because it looks familiar). Testing yourself BEFORE you feel ready is the mechanism, not a nice-to-have.

### The pattern-recognition map — this week in one table

The durable asset from Week 5 is a set of triggers, not memorized solutions. Rehearse the mapping: **"by level" / shortest unweighted path** → BFS with a queue; **"any path / all configurations / components / cycles"** → DFS; **sorted input, or O(log n) demanded** → binary search; **numeric answer with monotonic feasibility** → binary-search the answer space; **"top k / kth largest / most frequent"** → bounded heap, O(n log k); **prefix queries** → trie; **"count the ways / min cost to reach"** with overlapping futures → DP; **intervals or pair-matching** → sort first, then sweep. When stuck in a real interview, run this list out loud — enumerating patterns IS the algorithm for choosing one.

### The think-aloud protocol for today's mock

1. Restate the problem in your own words; confirm constraints (n size bounds hint the target complexity — n ≤ 20 forgives brute force; n = 10⁵ demands n log n).
2. Work a small example BY HAND before any code.
3. Name the brute force and its cost — saying "naively O(n²) because all pairs" earns points even when you improve it.
4. Match against the pattern map; state the plan and complexity BEFORE coding.
5. Code cleanly; then trace your example through the code, hunting boundary bugs (empty, single, duplicate, the Day 33 off-by-ones).

### The error log format

For every miss: problem, what happened (blank / wrong pattern / right pattern-buggy code / too slow), the one-line cause, and the fix ritual (re-drill day N, add a flashcard, redo in 3 days). Causes repeat — that repetition is the signal worth mining.`,
    viz: null,
    guided: [
      {
        title: 'Closed-book recall drills',
        minutes: 15,
        body: `Editor closed for each recall, then open to diff. Score each honestly in your error log: clean / minor slips / needed the book.

1. On paper: write the BFS shortest-path skeleton (queue seeding, visited-at-enqueue, parent tracking). Diff against your Day 31 \`graphs.py\`.
2. On paper: the first-occurrence binary search boundary template. Diff against Day 33. Did you keep the invariant comment?
3. Out loud (60 seconds each, to your rubber duck or AI tutor in listen-only mode): why in-order traversal of a BST is sorted; why the top-k heap is a MIN-heap; why marking visited at pop time explodes the queue.
4. From memory: the four-step DP method, then the house-robber recurrence with its bases.
5. Run your spaced-rep deck for all Week 5 cards. Any card you fumble → mark for re-drill and note the day number.`,
      },
      {
        title: 'The timed mock — 3 problems, 40 minutes',
        minutes: 40,
        body: `Set a real timer: about 13 minutes per problem, think-aloud protocol throughout, no peeking at your toolkit files. Say steps 1–4 OUT LOUD before writing code.

1. **Tree (13 min):** Given a binary tree, return the sum of values of nodes at the DEEPEST level. (Pattern check: "by level" — which traversal?)
2. **Graph (13 min):** You are given a list of (employee, manager) pairs forming a hierarchy, plus one employee's name. Return how many levels below the CEO that employee sits. (Model it first: nodes? edges? which traversal answers "levels"?)
3. **DP (13 min):** A message was encoded by mapping A→1, ..., Z→26 and concatenating. Given a digit string like "226", count the decodings ("BZ", "VF", "BBF" → 3). Careful with the digit 0. (Four steps in comments FIRST.)
4. When the timer ends, STOP. Grade with the rubric: pattern named before coding (2 pts), working code (3), correct complexity stated (1), edge cases handled (2), clear narration (2) — per problem, out of 10.
5. For each problem scored < 7, write the error-log entry now, while the pain is fresh.`,
      },
    ],
    practice: [
      {
        title: 'Redo one, cold',
        minutes: 15,
        body: `Take your WORST mock problem, close everything, and re-solve it from a blank file — including narration. The goal is a clean 9–10/10 run within 12 minutes.

If you scored 9+ on all three (verify honestly against the rubric), instead attempt this stretch problem cold: given a sorted array and a target, return the COUNT of target's occurrences in O(log n) — then check it against your Day 33 toolkit.

No hints today. The struggle is the exercise.`,
      },
    ],
    project: {
      title: 'Error log v1 + your NeetCode practice contract',
      brief: `Create \`interview/error_log.md\` in your practice repo — the living document that follows you to Day 179. Sections: (1) today's mock scores with per-problem entries (miss type, cause, fix ritual); (2) the Week 5 pattern-recognition map written from memory in your own words; (3) your practice contract: open the NeetCode roadmap, locate the topics you have covered (arrays/hashing, two pointers, stack, trees, heaps, graphs, binary search, 1-D DP), and commit in writing to a cadence (recommended: 2 problems per week, one familiar pattern, one weak-area, logged here). Commit; you will update this file on Days 84, 112, and 179.`,
      rubric: [
        'Mock scored with the 10-point rubric for all three problems, honestly',
        'Every sub-7 problem has an error-log entry with a NAMED cause, not "was hard"',
        'Pattern map written from memory covers ≥ 7 trigger→tool pairs',
        'Practice contract names a weekly cadence and the first two problems chosen',
        'Committed to the practice repo and linked from its README',
      ],
    },
    mistakes: [
      'Re-reading lesson notes instead of retrieving. Familiarity is not recall — the closed-editor diff exposes the difference in minutes.',
      'Skipping the think-aloud steps to "save time." Naming the pattern before coding is the highest-scoring 30 seconds of a real interview.',
      'Logging "got it wrong" without a cause. "Marked visited at pop, queue exploded" is fixable; "messed up graphs" is not.',
      'Grading yourself on whether the idea was right while the code did not run. Interviews (and Day 42\'s TestClient) grade running code.',
      'Treating a bad mock score as verdict rather than diagnosis. Today\'s misses, drilled, are next month\'s clean solves — that is the entire mechanism.',
      'Setting an unrealistic practice contract (10 problems/week) that dies by Day 40. Two per week, kept, beats ten planned.',
    ],
    quiz: [
      {
        q: 'A problem says "return the minimum number of steps to transform A into B" and you notice sub-transformations repeat. First move?',
        o: [
          'Sort the input',
          'Write the four-step DP formulation: define the state in words, then the recurrence',
          'Run BFS immediately',
          'Binary-search the answer',
        ],
        x: 1,
        w: '"Min cost" + overlapping subproblems is the DP signal (Day 34). (BFS on a state graph can also work — but you would still define states first. Note: if steps are unweighted and states form a graph, min-steps IS BFS; the state definition comes first either way.)',
        revisit: 34,
      },
      {
        q: 'The problem guarantees the array is sorted and asks for O(log n). n = 10⁶. Which tool and why?',
        o: [
          'A hash set — O(1) lookups',
          'Binary search — sortedness plus the log bound are the explicit signals',
          'DFS',
          'A size-k heap',
        ],
        x: 1,
        w: 'Sorted input + logarithmic requirement is the least subtle signal in interviewing (Day 33). Hash sets give O(1) membership but cannot answer order-based queries like first/last occurrence.',
        revisit: 33,
      },
      {
        q: 'Why does the program schedule retrieval drills days after the lesson instead of the same evening?',
        o: [
          'To fit the calendar',
          'Retrieval strengthens memory most when it is effortful — near the edge of forgetting — which takes days to reach',
          'Because cramming works better',
          'Same-day review would be too easy to schedule',
        ],
        x: 1,
        w: 'The spacing effect: easy same-day recall barely strengthens the trace; effortful spaced recall flattens the forgetting curve. Your SM-2-lite deck automates finding that edge.',
        revisit: 35,
      },
    ],
    resources: [
      { label: 'NeetCode Roadmap — locate your covered topics, pick 2 problems', url: 'https://neetcode.io/roadmap', type: 'course', time: '20 min' },
      { label: 'Tech Interview Handbook (repo) — coding interview cheatsheet', url: 'https://github.com/yangshun/tech-interview-handbook', type: 'repo', time: '20 min' },
      { label: 'VisuAlgo — replay any structure that felt shaky today', url: 'https://visualgo.net/en', type: 'tool', time: '15 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep: full Week 5 deck, fumbles marked', minutes: 15 },
      { activity: 'Closed-book recall drills (paper + out-loud)', minutes: 15 },
      { activity: 'Timed mock: 3 problems, think-aloud, self-scored', minutes: 40 },
      { activity: 'Practice: redo your worst problem cold', minutes: 15 },
      { activity: 'Project: error log v1 + practice contract, commit', minutes: 15 },
      { activity: 'Cumulative quiz + schedule next drills', minutes: 10 },
    ],
    completion: [
      'All recall drills attempted closed-book with honest scores logged',
      'Timed mock completed within limits and rubric-scored',
      'Worst problem re-solved cold at 9+/10',
      'Error log committed with causes named and practice contract signed',
      'Cumulative quiz ≥ 2/3',
    ],
    connections: {
      back: 'Today drilled Days 29–34 as one toolkit and reused Day 28\'s drill format. The think-aloud protocol extends the rubber-duck habit from Day 19.',
      forward: 'The error log returns on Days 84, 112, and 179 (Interview Gym). Week 6 pivots from algorithms to systems — SQL tomorrow — but your practice contract keeps two DSA problems per week alive until interview season.',
    },
    flashcards: [
      { f: 'Retrieval practice vs re-reading?', b: 'Effortful recall strengthens memory; re-reading creates fluency illusions. Test before you feel ready.' },
      { f: 'Interview protocol before writing any code?', b: 'Restate → hand-worked example → name brute force + cost → name pattern + plan + complexity.' },
      { f: '"Top k most frequent" trigger →?', b: 'Counter + size-k min-heap: O(n log k) (Day 30).' },
      { f: '"Shortest path, unweighted" trigger →?', b: 'BFS with visited-at-enqueue (Day 31).' },
      { f: 'What makes an error-log entry useful?', b: 'A NAMED cause (wrong pattern / boundary bug / blank) plus a scheduled fix ritual.' },
      { f: 'Constraint n ≤ 20 vs n = 10⁵ tells you…?', b: 'Target complexity: tiny n forgives brute force / exponential; 10⁵ demands ~O(n log n).' },
    ],
    deepDive: [
      { label: 'Make It Stick — the testing effect', note: 'The research behind why today felt harder than re-reading and worked better. Optional: read a summary of Roediger & Karpicke\'s 2006 retrieval-practice studies.' },
    ],
  },
  {
    id: 'd036', day: 36, week: 6, phase: 2, kind: 'lesson',
    title: 'SQL I — Tables & Queries',
    analogy: 'Spreadsheets with a contract',
    objectives: [
      'Explain the relational model: tables, rows, columns, primary keys, constraints',
      'Create tables and insert data from Python with sqlite3 and parameter binding',
      'Write SELECT queries with WHERE, ORDER BY, LIMIT, and LIKE',
      'Aggregate with COUNT/SUM/AVG/MIN/MAX and group with GROUP BY/HAVING',
      'Predict how NULL behaves in comparisons, aggregates, and counts',
    ],
    prereqs: [
      { day: 5, label: 'Files, CSV & JSON' },
      { day: 4, label: 'Collections — lists and dicts' },
      { day: 22, label: 'Big O & complexity' },
    ],
    eli5: `A spreadsheet lets anyone type anything anywhere: a birthday in the salary column, a name spelled three ways, a row half-filled. A database table is a spreadsheet with a CONTRACT. Before any data arrives you declare the columns, their types, and the rules: "id is a unique number, title can never be empty, price must be positive." From then on, the database is a bouncer — rows that violate the contract are refused at the door, loudly, instead of quietly corrupting your data.

The second half of the deal: because the database knows the contract, you stop telling it HOW to find things and start telling it WHAT you want. "Give me the ten most expensive books published after 2015" is one declarative sentence — no loops, no index variables. The database's query planner picks the how. That is the deep mental shift from Python: SQL is you describing the shape of an answer, and the engine doing the walking. SQLite — the database used today — keeps the whole contract-and-contents in a single file on your laptop, no server, which is why it hides inside your phone, your browser, and roughly every device you own.`,
    why: `SQL is the closest thing software has to a universal language — every company you will ever consult for keeps its truth in relational tables, and "can you pull the numbers?" is an FDE question you will field in customer meetings for the rest of your career. Your AI work sits on it too: the Day 42 service, the capstone's metadata store, eval results on Day 140, and the structured half of "SQL + vectors" retrieval on Day 118 are all tables. Interviews test SQL directly (a screen of its own at many companies), and GROUP BY/HAVING plus NULL traps are precisely where candidates faceplant.`,
    tech: `### The relational contract

A **table** is a set of rows sharing typed columns, declared once in a **schema**. The **primary key** uniquely identifies each row (in SQLite, \`INTEGER PRIMARY KEY\` doubles as an auto-assigned rowid). **Constraints** enforce the contract at write time: \`NOT NULL\` (value required), \`UNIQUE\`, \`CHECK (price >= 0)\`, and \`DEFAULT\`. Rejecting bad data at the door beats discovering it in a report three months later — the same garbage-in economics you will meet again with pydantic on Day 68.

### Queries are pipelines

A SELECT reads like its logical processing order, which is NOT its written order: \`FROM\` (pick the table) → \`WHERE\` (filter rows) → \`GROUP BY\` (collapse into buckets) → \`HAVING\` (filter the buckets) → \`SELECT\` (choose/compute columns) → \`ORDER BY\` → \`LIMIT\`. Two consequences worth tattooing somewhere: WHERE runs before grouping, so it cannot see aggregates — filtering on \`COUNT(*)\` belongs in HAVING; and column aliases from SELECT are not reliably visible in WHERE, because WHERE ran first. Aggregates (\`COUNT, SUM, AVG, MIN, MAX\`) collapse many rows into one value; with GROUP BY they collapse per bucket, and every non-aggregated column in the SELECT must appear in the GROUP BY.

### NULL — the three-valued trap

NULL means "unknown," and unknowns are contagious: \`price = NULL\` is never true — not even for rows where price IS null — because comparing anything to an unknown yields UNKNOWN, and WHERE only passes TRUE. Test with \`IS NULL / IS NOT NULL\`. Aggregates silently skip NULLs: \`COUNT(*)\` counts rows, but \`COUNT(price)\` counts non-null prices, and \`AVG(price)\` divides by the non-null count — three different answers on the same table, all "correct."

### sqlite3 from Python

\`sqlite3.connect("app.db")\` opens (or creates) the file; \`conn.execute(sql, params)\` runs a statement; writes need \`conn.commit()\`. Always pass user values via \`?\` placeholders — string-formatting values into SQL is the injection vulnerability you will formally meet on Day 44, and it also breaks on the first title containing an apostrophe.`,
    viz: null,
    guided: [
      {
        title: 'Create the contract, load the shelf',
        minutes: 20,
        body: `1. Create \`sql_lab.py\` with the starter. Run it once: it builds \`books.db\`, creates the table with constraints, and seeds 12 rows — including some NULL page counts on purpose.
2. Prove the contract works: uncomment the two doomed inserts (empty title, negative price) and watch \`IntegrityError\` refuse them. This is the bouncer doing its job — read each error message fully.
3. Prove parameter binding matters: insert the book title "It's a Trap" via the \`?\` placeholder — works fine. Now TRY building the same INSERT with an f-string and watch the apostrophe shatter the SQL. Delete the f-string version; never write it again.
4. Run the four starter queries (WHERE, ORDER BY + LIMIT, LIKE, a computed column). Before each, say out loud what rows you expect; then run and check.
5. Open the db file with the \`sqlite3\` command-line tool too (\`sqlite3 books.db ".schema"\`) — same file, two clients. The database is the file.`,
        code: `import sqlite3

conn = sqlite3.connect("books.db")
conn.execute("DROP TABLE IF EXISTS books")
conn.execute("""
    CREATE TABLE books (
        id       INTEGER PRIMARY KEY,
        title    TEXT NOT NULL CHECK (length(title) > 0),
        author   TEXT NOT NULL,
        year     INTEGER,
        price    REAL NOT NULL CHECK (price >= 0),
        pages    INTEGER              -- nullable on purpose
    )
""")

seed = [
    ("Deep Work", "Cal Newport", 2016, 14.99, 296),
    ("Clean Code", "Robert Martin", 2008, 32.50, 464),
    ("The Pragmatic Programmer", "Andrew Hunt", 1999, 39.99, 352),
    ("Fluent Python", "Luciano Ramalho", 2022, 55.00, 1012),
    ("Designing Data-Intensive Applications", "Martin Kleppmann", 2017, 44.99, 616),
    ("The Mythical Man-Month", "Fred Brooks", 1975, 29.99, 336),
    ("Refactoring", "Martin Fowler", 2018, 47.99, None),
    ("A Philosophy of Software Design", "John Ousterhout", 2021, 21.99, 196),
    ("Grokking Algorithms", "Aditya Bhargava", 2016, 34.99, 256),
    ("Python Crash Course", "Eric Matthes", 2023, 39.99, None),
    ("The Design of Everyday Things", "Don Norman", 2013, 17.99, 368),
    ("Thinking, Fast and Slow", "Daniel Kahneman", 2011, 16.99, 499),
]
conn.executemany(
    "INSERT INTO books (title, author, year, price, pages) VALUES (?, ?, ?, ?, ?)",
    seed,
)
conn.commit()

# the bouncer at work -- uncomment one at a time:
# conn.execute("INSERT INTO books (title, author, price) VALUES ('', 'X', 1.0)")
# conn.execute("INSERT INTO books (title, author, price) VALUES ('Y', 'X', -5)")

def q(sql, params=()):
    print("\\n--", sql.strip().splitlines()[0])
    for row in conn.execute(sql, params):
        print("  ", row)

q("SELECT title, price FROM books WHERE price < 30 ORDER BY price")
q("SELECT title, year FROM books ORDER BY year DESC LIMIT 3")
q("SELECT title FROM books WHERE title LIKE '%Design%'")
q("SELECT title, round(price * 0.9, 2) AS sale_price FROM books WHERE year >= 2015", ())`,
      },
      {
        title: 'Aggregates, buckets & the NULL casino',
        minutes: 22,
        body: `1. Warm up with whole-table aggregates: count the books, the min/max/avg price. Predict avg price by eye first — being roughly right builds the sanity-check reflex.
2. **The three counts.** Run \`COUNT(*)\`, \`COUNT(pages)\`, and \`AVG(pages)\` in one query. Explain the difference out loud: 12 rows, 10 non-null page counts, and an average computed over 10, not 12. Which average did you WANT? (Business question, not SQL question — that is the point.)
3. **The NULL trap, personally experienced.** Run \`WHERE pages = NULL\` (zero rows — even though two rows have NULL pages!), then \`WHERE pages IS NULL\` (two rows). Say why: comparing to unknown is unknown, and WHERE only passes TRUE.
4. Group into buckets: books per author-era — use the starter's decade expression. Check that every SELECT column is either aggregated or in the GROUP BY.
5. **WHERE vs HAVING.** Find decades with more than 2 books, but only counting books under 50 dollars: price filter in WHERE (row-level, pre-bucket), count filter in HAVING (bucket-level). Swap them and observe the error / wrong result — the pipeline order is real.`,
        code: `q("SELECT COUNT(*), MIN(price), MAX(price), ROUND(AVG(price), 2) FROM books")

q("SELECT COUNT(*) AS rows, COUNT(pages) AS with_pages, ROUND(AVG(pages), 1) AS avg_pages FROM books")

q("SELECT title FROM books WHERE pages = NULL")     # zero rows, always
q("SELECT title FROM books WHERE pages IS NULL")    # the two real ones

q("""
    SELECT (year / 10) * 10 AS decade,
           COUNT(*)          AS n,
           ROUND(AVG(price), 2) AS avg_price
    FROM books
    GROUP BY decade
    ORDER BY decade
""")

q("""
    SELECT (year / 10) * 10 AS decade, COUNT(*) AS n
    FROM books
    WHERE price < 50            -- row filter: runs BEFORE grouping
    GROUP BY decade
    HAVING COUNT(*) > 2         -- bucket filter: runs AFTER grouping
    ORDER BY n DESC
""")`,
      },
    ],
    practice: [
      {
        title: 'The eight-query gauntlet',
        minutes: 20,
        body: `Answer each with ONE query against books.db (no Python post-processing): (1) titles containing "the" case-insensitively; (2) the three cheapest books from this millennium; (3) each author's book count and total spend to buy them all; (4) the average price of books WITH a known page count vs the overall average — two queries, explain the difference; (5) decades whose average price exceeds 30; (6) books priced above the table's average price (needs a subquery: WHERE price > (SELECT AVG(price) FROM books)); (7) the year span (max - min) of the collection; (8) authors with exactly one book, alphabetically.

Constraints: use ORDER BY + LIMIT, GROUP BY + HAVING, LIKE, and one subquery across the set. Hints: LIKE is case-insensitive for ASCII in SQLite by default; "this millennium" is year >= 2000; check each aggregate against the seed data by eye.`,
      },
    ],
    project: {
      title: 'Your dataset, under contract',
      brief: `Put real data under contract. Take the tasks from your Day 7 tracker, the log records from Day 14, or any CSV you have handy, and build \`my_data.py\`: a script that (1) creates a table whose constraints actually encode your data's rules (at least one CHECK, one NOT NULL beyond the key); (2) loads the data via executemany with placeholders; (3) proves the bouncer works with two intentionally-rejected rows in a try/except; (4) answers five questions you genuinely care about, each as one query, with the NULL behavior of at least one column explicitly tested. Commit the script (not the .db file — add it to .gitignore).`,
      rubric: [
        'Schema has a primary key, a CHECK, and a NOT NULL that fit the data\'s real rules',
        'All inserts use ? placeholders; no string-formatted SQL anywhere',
        'Two contract-violating rows demonstrably rejected and handled with try/except',
        'Five queries run, at least one using GROUP BY + HAVING and one using a subquery',
        'One query demonstrates IS NULL vs = NULL on your data; .db file gitignored, script committed',
      ],
    },
    mistakes: [
      'Filtering aggregates in WHERE ("WHERE COUNT(*) > 2"). WHERE runs before grouping and cannot see bucket values — that filter belongs in HAVING.',
      'Testing NULL with = or !=. Both return UNKNOWN and the row silently vanishes from results. Only IS NULL / IS NOT NULL work.',
      'Assuming COUNT(column) counts rows. It counts NON-NULL values in that column; COUNT(*) counts rows. Averages likewise skip NULLs.',
      'Building SQL with f-strings. The first apostrophe breaks it and user input owns your database (Day 44 makes this formal). Placeholders, always.',
      'Forgetting conn.commit() after writes and wondering why another connection sees nothing. Reads see your own uncommitted work; others do not.',
      'SELECT * in application code. Schema changes reorder/add columns and silently break positional row unpacking — name the columns you need.',
    ],
    quiz: [
      {
        q: 'You want product categories having more than 10 items priced under 20 dollars. Where do the two conditions go?',
        o: [
          'Both in WHERE',
          'price < 20 in WHERE (row-level, before grouping); COUNT(*) > 10 in HAVING (bucket-level, after)',
          'Both in HAVING',
          'price < 20 in HAVING; COUNT(*) > 10 in WHERE',
        ],
        x: 1,
        w: 'The pipeline runs FROM → WHERE → GROUP BY → HAVING. Row facts (price) filter before buckets form; bucket facts (counts) can only be filtered after.',
        revisit: 36,
      },
      {
        q: 'Two of 12 rows have NULL in bonus. What does SELECT COUNT(*), COUNT(bonus), AVG(bonus) return conceptually?',
        o: [
          '12, 12, average over 12 treating NULL as 0',
          '12, 10, average over the 10 non-null values',
          '10, 10, average over 10',
          'An error — NULLs cannot be aggregated',
        ],
        x: 1,
        w: 'COUNT(*) counts rows; COUNT(bonus) and AVG(bonus) skip NULLs. If you want NULL treated as zero, say so explicitly with COALESCE(bonus, 0).',
        revisit: 36,
      },
      {
        q: 'Why must user-supplied values go into queries via ? placeholders instead of f-strings?',
        o: [
          'Placeholders are faster to type',
          'The driver sends values separately from the SQL, so quotes in data cannot change the query\'s structure — no breakage, no injection',
          'f-strings do not work with sqlite3',
          'Placeholders auto-commit the transaction',
        ],
        x: 1,
        w: 'With binding, data stays data. With string-building, a value like "x\'; DROP TABLE books;--" becomes executable SQL — the injection attack formalized on Day 44.',
        revisit: 36,
      },
    ],
    resources: [
      { label: 'SQLBolt — interactive lessons 1–12', url: 'https://sqlbolt.com/', type: 'course', time: '30 min' },
      { label: 'sqlite3 — official Python docs (tutorial section)', url: 'https://docs.python.org/3/library/sqlite3.html', type: 'docs', time: '20 min' },
      { label: 'SQLite Documentation — language reference', url: 'https://www.sqlite.org/docs.html', type: 'docs', time: '15 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: due cards (Week 5 selections)', minutes: 10 },
      { activity: 'ELI5 + tech read: the contract and the pipeline order', minutes: 18 },
      { activity: 'Guided: build & seed the shelf, aggregates & NULL casino', minutes: 42 },
      { activity: 'Practice: the eight-query gauntlet', minutes: 20 },
      { activity: 'Project: your dataset under contract, commit', minutes: 20 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'Contract violations demonstrably rejected; placeholder-vs-f-string experiment run',
      'The three counts (rows / non-null / avg basis) explained in your own words',
      'Eight-query gauntlet answered with single queries each',
      'Personal dataset project committed with .db gitignored',
      'Quiz ≥ 2/3',
    ],
    connections: {
      back: 'The rows you seeded came from Day 5\'s CSV/JSON skills, the dict-like access patterns echo Day 4, and the query planner\'s freedom to choose HOW is the declarative cousin of Day 22\'s complexity thinking.',
      forward: 'Tomorrow (Day 37) splits data across tables and JOINs it back. Day 38 opens the hood on how these queries execute and when they need indexes. The Day 42 service persists through exactly this sqlite3 API, and Day 118 marries SQL tables to vector search.',
    },
    flashcards: [
      { f: 'Logical order of a SELECT?', b: 'FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT.' },
      { f: 'WHERE vs HAVING?', b: 'WHERE filters rows before grouping (no aggregates); HAVING filters buckets after (aggregates allowed).' },
      { f: 'Why does price = NULL match nothing?', b: 'Comparisons with NULL yield UNKNOWN, and WHERE passes only TRUE. Use IS NULL.' },
      { f: 'COUNT(*) vs COUNT(col)?', b: 'Rows vs non-NULL values of col. AVG also skips NULLs — COALESCE(col, 0) to change that.' },
      { f: 'How do user values safely enter SQL?', b: '? placeholders — the driver binds data separately from SQL structure. Never f-strings.' },
      { f: 'What enforces data quality at write time?', b: 'Constraints: PRIMARY KEY, NOT NULL, UNIQUE, CHECK, DEFAULT — the table\'s contract.' },
    ],
    deepDive: [
      { label: 'SQLite: how it stores your table', url: 'https://www.sqlite.org/docs.html', note: 'Skim the file-format overview: the whole database is B-tree pages in one file — vocabulary that pays off on Day 38.' },
    ],
  },
  {
    id: 'd037', day: 37, week: 6, phase: 2, kind: 'lesson',
    title: 'SQL II — Joins & Modeling',
    analogy: 'Matching guest lists',
    objectives: [
      'Write INNER and LEFT joins and predict their row counts before running them',
      'Model a many-to-many relationship with a junction table',
      'Use foreign keys to keep references honest',
      'Break a nested query into readable CTEs (WITH clauses)',
      'Apply a window function to answer a per-group ranking question',
    ],
    prereqs: [
      { day: 36, label: 'SQL I — tables & queries' },
      { day: 9, label: 'OOP I — modeling entities' },
    ],
    eli5: `You are running a wedding with two clipboards: the GUEST list (name, table number) and the RSVP list (name, meal choice). "Who is coming and what do they eat?" means walking both lists and MATCHING rows by name — that is a join, and the join condition ("same name") is the matching rule.

The interesting question is what to do with mismatches. Aunt Marta RSVP'd but is not on the guest list; cousin Theo is invited but never replied. An INNER join keeps only clean matches — Marta and Theo both vanish, silently. A LEFT join keeps EVERYONE on the left clipboard, padding missing right-side info with blanks (NULLs) — Theo appears with an empty meal box, which is exactly how you FIND the non-responders: look for the blanks. Choosing the join type is choosing which mismatches you care about.

Why two clipboards at all? Because one giant list repeats itself into chaos: write each guest's table number on every line they appear and someone WILL update one copy and not the other — now Theo sits at two tables. Splitting facts into separate lists so each fact lives exactly once, then joining on demand, is the whole idea of relational modeling.`,
    why: `Real schemas are always multiple tables, so real queries are always joins — the SQL interview screen is essentially a joins-and-groups exam, with "find rows that DIDN'T match" (the LEFT JOIN / IS NULL move) as its favorite trick. Modeling is the deeper FDE skill: on-site, your first hour with a customer's data is spent reading their schema like a map — junction tables reveal the many-to-many relationships, foreign keys reveal what references what. You will design schemas yourself for the Day 42 service and the capstone's document/chunk/citation store (Day 119), and a bad early model taxes every feature after it.`,
    tech: `### Joins are row-matching

\`A JOIN B ON A.x = B.y\` conceptually pairs every A-row with every B-row (a cross product) and keeps pairs where the ON condition is true. **INNER JOIN** keeps only matches. **LEFT JOIN** additionally keeps left rows with no match, padding B's columns with NULL — which enables the anti-join idiom: \`LEFT JOIN … WHERE B.id IS NULL\` finds left rows WITHOUT a partner ("customers with no orders"). RIGHT is LEFT with the tables swapped; FULL keeps orphans from both sides (SQLite supports both since 3.39). Predict row counts: joining on a one-to-many relationship multiplies — 3 orders per customer means the customer's data appears 3 times, and summing a joined column can silently double-count. Aggregate BEFORE joining (in a CTE) when in doubt.

### Modeling relationships

**One-to-many**: the "many" side carries a **foreign key** — \`orders.customer_id REFERENCES customers(id)\` — and the database (with \`PRAGMA foreign_keys = ON\` in SQLite) refuses orders pointing at ghost customers. **Many-to-many** (posts and tags, students and courses) cannot be drawn with a single foreign key in either table; it needs a **junction table** — \`post_tags(post_id, tag_id)\` — whose rows are the relationships themselves, with a composite primary key preventing duplicates. **Normalization**, informally: every fact stored once, referenced everywhere else. Denormalizing (duplicating for read speed) is a legitimate later optimization — after measurement, not before.

### CTEs and window functions

A **CTE** names a subquery: \`WITH big_spenders AS (SELECT …) SELECT … FROM big_spenders JOIN …\` — turning nested one-liners into readable pipelines, each stage testable alone. **Window functions** compute over related rows WITHOUT collapsing them: \`ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY total DESC)\` ranks each customer's orders in place. The taste-test question they answer: "top N per group" — impossible with plain GROUP BY, one CTE + window filter otherwise.`,
    viz: 'sql-join',
    guided: [
      {
        title: 'Two clipboards, four joins',
        minutes: 20,
        body: `1. Create \`joins_lab.py\` with the starter: customers and orders tables, foreign keys ON, seeded so that one customer has NO orders and several customers have many.
2. Before running the INNER join, predict its row count from the seed data (count the matches by eye). Run and check. Do the same for the LEFT join — whose meal box is empty?
3. Run the anti-join (LEFT JOIN … IS NULL) to find the customer with no orders. Say the idiom out loud — it is the single most-asked SQL interview move.
4. Demonstrate the multiplication hazard: SUM(orders.total) joined against customers is fine, but join customers to orders AND order_items (starter includes a mini version) and watch a naive SUM double-count. Fix it by aggregating orders in a CTE first.
5. Turn foreign keys OFF (comment the PRAGMA), insert an order for customer 999, turn them back on and try again. The refusal is the point.`,
        code: `import sqlite3

conn = sqlite3.connect(":memory:")     # throwaway db, lives in RAM
conn.execute("PRAGMA foreign_keys = ON")
conn.executescript("""
    CREATE TABLE customers (
        id   INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        city TEXT NOT NULL
    );
    CREATE TABLE orders (
        id          INTEGER PRIMARY KEY,
        customer_id INTEGER NOT NULL REFERENCES customers(id),
        total       REAL NOT NULL CHECK (total >= 0),
        placed_on   TEXT NOT NULL
    );
    INSERT INTO customers (id, name, city) VALUES
        (1, 'Amara', 'Lagos'), (2, 'Bo', 'Seoul'),
        (3, 'Chen', 'Taipei'), (4, 'Dee', 'Austin');   -- Dee: no orders
    INSERT INTO orders (customer_id, total, placed_on) VALUES
        (1, 120.0, '2026-07-01'), (1, 35.5, '2026-07-11'),
        (2, 89.9,  '2026-07-03'), (3, 240.0, '2026-07-08'),
        (3, 15.0,  '2026-07-15'), (3, 60.0,  '2026-08-01');
""")

def q(sql):
    print("\\n--", sql.strip().splitlines()[0])
    for row in conn.execute(sql):
        print("  ", row)

q("""
    SELECT c.name, o.total
    FROM customers c
    JOIN orders o ON o.customer_id = c.id      -- INNER: matches only (6 rows)
""")

q("""
    SELECT c.name, o.total
    FROM customers c
    LEFT JOIN orders o ON o.customer_id = c.id -- everyone; Dee gets NULL (7 rows)
""")

q("""
    SELECT c.name                              -- the anti-join idiom
    FROM customers c
    LEFT JOIN orders o ON o.customer_id = c.id
    WHERE o.id IS NULL
""")

q("""
    WITH spend AS (                            -- aggregate BEFORE joining
        SELECT customer_id, SUM(total) AS lifetime, COUNT(*) AS n
        FROM orders GROUP BY customer_id
    )
    SELECT c.name, COALESCE(s.lifetime, 0) AS lifetime, COALESCE(s.n, 0) AS orders
    FROM customers c LEFT JOIN spend s ON s.customer_id = c.id
    ORDER BY lifetime DESC
""")

try:
    conn.execute("INSERT INTO orders (customer_id, total, placed_on) VALUES (999, 1, '2026-01-01')")
except sqlite3.IntegrityError as e:
    print("\\nforeign key said no:", e)`,
      },
      {
        title: 'Many-to-many + a window function taste',
        minutes: 22,
        body: `1. Extend the lab: create \`tags\` and \`order_tags\` (junction) tables per the starter — an order can be "gift", "rush", AND "fragile"; a tag applies to many orders. Note the junction table's composite primary key: the relationship itself is the row, and duplicates are refused.
2. Query through the junction: all orders tagged "rush", then tag frequencies (tags LEFT JOIN order_tags GROUP BY tag — so unused tags show 0, not vanish).
3. Try to express "each customer's LARGEST order, with its date" using plain GROUP BY. Feel the wall: MAX(total) collapses the rows and you cannot recover WHICH row won (selecting placed_on alongside MAX is not guaranteed to match in general SQL). This wall is what windows break.
4. Now the window version from the starter: ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY total DESC) ranks orders per customer without collapsing; the CTE filters rank 1. Read the result row by row and say what PARTITION BY and ORDER BY each did.
5. Change it to top-2 per customer with one character. That flexibility is why analysts live inside window functions.`,
        code: `conn.executescript("""
    CREATE TABLE tags (
        id   INTEGER PRIMARY KEY,
        name TEXT NOT NULL UNIQUE
    );
    CREATE TABLE order_tags (
        order_id INTEGER NOT NULL REFERENCES orders(id),
        tag_id   INTEGER NOT NULL REFERENCES tags(id),
        PRIMARY KEY (order_id, tag_id)          -- the relationship IS the row
    );
    INSERT INTO tags (id, name) VALUES (1, 'gift'), (2, 'rush'), (3, 'fragile'), (4, 'bulk');
    INSERT INTO order_tags VALUES (1, 1), (1, 2), (3, 2), (4, 3), (5, 1), (5, 2), (5, 3);
""")

q("""
    SELECT o.id, c.name, o.total                -- orders tagged 'rush'
    FROM orders o
    JOIN order_tags ot ON ot.order_id = o.id
    JOIN tags t       ON t.id = ot.tag_id
    JOIN customers c  ON c.id = o.customer_id
    WHERE t.name = 'rush'
""")

q("""
    SELECT t.name, COUNT(ot.order_id) AS uses   -- unused tags show 0
    FROM tags t
    LEFT JOIN order_tags ot ON ot.tag_id = t.id
    GROUP BY t.name ORDER BY uses DESC
""")

q("""
    WITH ranked AS (
        SELECT customer_id, total, placed_on,
               ROW_NUMBER() OVER (
                   PARTITION BY customer_id     -- restart ranking per customer
                   ORDER BY total DESC          -- rank by size within each
               ) AS rk
        FROM orders
    )
    SELECT c.name, r.total, r.placed_on
    FROM ranked r JOIN customers c ON c.id = r.customer_id
    WHERE r.rk = 1                              -- change to <= 2 for top-2
    ORDER BY r.total DESC
""")`,
      },
    ],
    practice: [
      {
        title: 'Questions only joins can answer',
        minutes: 20,
        body: `Against the full lab schema, one query each: (1) each city's total revenue, including cities whose customers never ordered (must show 0); (2) customers whose EVERY order is tagged (hint: compare counts); (3) the most recent order per customer with its date — window function; (4) pairs of tags that co-occur on the same order (self-join the junction table; avoid duplicate pairs with tag_id < tag_id); (5) each customer's share of total revenue as a percentage (CTE for the grand total, then join or a window SUM() OVER ()).

Constraints: no Python-side computation; every answer is one statement. Check (1) and (5) by hand against the seed data.

Hints: (2) count orders vs count distinct tagged orders per customer; (4) the pair table is order_tags joined to itself on order_id.`,
      },
    ],
    project: {
      title: 'Schema design: the task tracker, relationally',
      brief: `Redesign your Day 7/9 task tracker as a relational schema in \`tracker_schema.py\`: users, projects, tasks (belonging to a project, assigned to a user, with status and due date), and labels with a task_labels junction — at minimum. Enforce the contract: foreign keys ON, CHECKs for status values, composite key on the junction. Seed realistic data (2 users, 2 projects, 8 tasks, overlapping labels), then answer five product questions with joins: open tasks per user, projects with no incomplete tasks, label frequencies, the most overdue task per project (window), and tasks sharing at least one label with a given task. Write one paragraph in the docstring: which facts live in exactly one place, and one duplication you deliberately avoided. Commit.`,
      rubric: [
        'Schema has ≥ 4 tables including a junction with a composite primary key',
        'Foreign keys enforced and demonstrated with one rejected orphan insert',
        'All five product questions answered in single statements; window function used for per-project overdue',
        'The no-incomplete-tasks query correctly uses an anti-join or NOT EXISTS',
        'Docstring paragraph explains single-source-of-truth choices; committed',
      ],
    },
    mistakes: [
      'Using INNER JOIN when the question includes zeros ("revenue per city, including cityless"). INNER silently drops non-matches; LEFT keeps them. Decide which mismatches matter BEFORE picking the join.',
      'Filtering the right table of a LEFT JOIN in WHERE (WHERE o.total > 50) — that turns it back into an INNER join by discarding the NULL-padded rows. Right-side filters belong in the ON clause.',
      'Summing across a one-to-many join and double-counting. Aggregate the many-side in a CTE first, then join once per entity.',
      'Modeling many-to-many with a comma-separated column ("tags: gift,rush"). It defeats indexing, joining, and constraints — the junction table is the relational answer.',
      'Forgetting PRAGMA foreign_keys = ON in SQLite — references are silently unenforced by default, and orphans creep in.',
      'Selecting a non-aggregated column alongside MAX() and trusting they come from the same row. Use a window function (ROW_NUMBER … rk = 1) for "the row that won."',
    ],
    quiz: [
      {
        q: 'Customers: 5 rows, one with no orders. Orders: 9 rows. How many rows do INNER and LEFT join (customers to orders) return?',
        o: ['5 and 5', '9 and 9', '9 and 10 — LEFT adds the orderless customer padded with NULLs', '10 and 9'],
        x: 2,
        w: 'INNER returns one row per match: 9. LEFT keeps all left rows: the 9 matches plus the orderless customer with NULL order columns = 10. Predicting counts is how you catch join bugs.',
        revisit: 37,
      },
      {
        q: 'Which schema correctly models posts that have many tags and tags used by many posts?',
        o: [
          'posts.tags as a comma-separated TEXT column',
          'tags.post_id foreign key',
          'A junction table post_tags(post_id, tag_id) with a composite primary key',
          'Duplicate the post row once per tag',
        ],
        x: 2,
        w: 'Many-to-many needs a table whose rows ARE the relationships. A single foreign key on either side caps one direction at "one"; CSV columns and row duplication break constraints and joins.',
        revisit: 37,
      },
      {
        q: '"Show each department\'s three highest-paid employees." What makes this a window-function problem?',
        o: [
          'It involves salaries',
          'GROUP BY collapses each department to one row, but you need ranked ROWS kept intact — ROW_NUMBER() OVER (PARTITION BY dept ORDER BY salary DESC) ranks without collapsing',
          'Window functions are faster than GROUP BY',
          'It is not — HAVING salary > 3 works',
        ],
        x: 1,
        w: 'Top-N-per-group needs both the grouping AND the individual rows. Windows compute per-partition values while every row survives; a CTE then filters rk <= 3.',
        revisit: 37,
      },
    ],
    resources: [
      { label: 'SQLBolt — lessons on JOINs (6–8) and review', url: 'https://sqlbolt.com/', type: 'course', time: '25 min' },
      { label: 'SQLite Documentation — SELECT & window functions', url: 'https://www.sqlite.org/docs.html', type: 'docs', time: '20 min' },
      { label: 'sqlite3 — official Python docs (placeholders, executescript)', url: 'https://docs.python.org/3/library/sqlite3.html', type: 'docs', time: '10 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: due cards (SQL I pipeline, NULL rules)', minutes: 10 },
      { activity: 'ELI5 + tech read; sketch the join visualizer\'s matching by hand', minutes: 18 },
      { activity: 'Guided: four joins + junction table + window taste', minutes: 42 },
      { activity: 'Practice: questions only joins can answer', minutes: 20 },
      { activity: 'Project: task-tracker schema design, commit', minutes: 20 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'Join row counts predicted correctly before running',
      'Anti-join and CTE-before-join patterns used and explained',
      'Junction table queried in both directions; window top-1 works',
      'Tracker schema committed with five product queries green',
      'Quiz ≥ 2/3',
    ],
    connections: {
      back: 'Yesterday\'s single-table contract (Day 36) becomes a multi-table map today; the entity thinking mirrors Day 9\'s classes (a table is a dataclass the database enforces). The NULL rules from Day 36 are exactly what makes LEFT-join padding work.',
      forward: 'Day 38 explains what these joins COST and how indexes rescue them. The Day 42 service persists into a two-table version of today\'s modeling, Day 66\'s pandas merge is this API in DataFrame clothing, and the capstone\'s documents/chunks/citations schema (Day 119) is a straight reuse.',
    },
    flashcards: [
      { f: 'INNER vs LEFT join?', b: 'INNER keeps only matches; LEFT keeps every left row, padding missing right columns with NULL.' },
      { f: 'Find customers with NO orders?', b: 'Anti-join: LEFT JOIN orders … WHERE orders.id IS NULL (or NOT EXISTS).' },
      { f: 'Many-to-many modeling?', b: 'Junction table (a_id, b_id) with composite primary key — rows ARE the relationships.' },
      { f: 'Why aggregate in a CTE before joining?', b: 'One-to-many joins duplicate rows; summing after the join double-counts.' },
      { f: 'ROW_NUMBER() OVER (PARTITION BY g ORDER BY v DESC) does what?', b: 'Ranks rows within each group without collapsing them — the top-N-per-group tool.' },
      { f: 'SQLite foreign-key gotcha?', b: 'Enforcement is OFF by default — PRAGMA foreign_keys = ON per connection.' },
    ],
    deepDive: [
      { label: 'Normalization, less informally', note: 'Look up 1NF/2NF/3NF with examples and translate each into the "every fact once" rule. Then read one argument FOR denormalization (read-heavy analytics) and note when you would break the rules knowingly.' },
    ],
  },
  {
    id: 'd038', day: 38, week: 6, phase: 2, kind: 'lesson',
    title: 'Database Internals',
    analogy: 'The index at the back of the book',
    objectives: [
      'Explain why databases use B-trees rather than binary trees or hash maps',
      'Read EXPLAIN QUERY PLAN output and tell a scan from an index search',
      'Create the right index for a query and measure the speedup',
      'Demonstrate a transaction\'s atomicity with a deliberate mid-way failure',
      'Recognize and fix the N+1 query problem',
    ],
    prereqs: [
      { day: 37, label: 'SQL II — joins & modeling' },
      { day: 29, label: 'Binary trees & BSTs' },
      { day: 33, label: 'Binary search' },
    ],
    eli5: `Find every mention of "entropy" in a 600-page textbook. Plan A: read all 600 pages — a full scan. Plan B: flip to the index at the back, which says "entropy: pages 214, 388" — three seconds. The index is a separate, alphabetically sorted mini-book of "term → where to find it," maintained precisely so you never have to read everything.

A database index is exactly that, with one twist driven by physics. Disks hand data over in big pages, not single words, so the index is built as a B-tree: like Day 29's search tree, but each node is a page holding HUNDREDS of sorted keys with hundreds of children. Hundreds of branches per step means a billion rows sit only three or four page-reads from the root — a binary tree would need thirty.

The catch is the same as a book index: every edit to the book means updating the index too. Write a row, update every index on that table. Indexes are a tax on writes to subsidize reads, and choosing WHICH columns deserve one is the craft. The other star today: transactions. Move money between accounts and crash halfway — the database promises all-or-nothing, so the half-finished transfer simply never happened.`,
    why: `"The app is slow" is, in an enormous fraction of real incidents, "a query is scanning instead of seeking" — and the fix is a one-line CREATE INDEX found by reading a query plan, one of the highest-leverage skills an engineer carries on-site. The N+1 problem is its evil twin: ORMs generate it silently, and you will diagnose it in customer codebases as an FDE. Transactions are why your Day 42 service can crash mid-write without corrupting data. And this whole toolbox transfers upward: Day 115's vector indexes make the same read-vs-write, exact-vs-fast trade-offs, and interviewers love "why B-trees and not hash maps?" as a systems probe.`,
    tech: `### B-trees: search trees shaped by disk

Storage hands over fixed-size pages (SQLite default 4KB), so the cost that matters is PAGE READS, not comparisons. A **B-tree** node fills a page with hundreds of sorted keys and child pointers; within a node you binary-search (Day 33), between nodes you descend (Day 29). Fanout of hundreds means height 3–4 covers millions of rows, and the tree self-balances on insert by splitting full pages — no degenerate case, unlike a BST. Tables themselves are B-trees keyed by rowid; a **secondary index** is another B-tree mapping column values to row locations. Range queries (\`WHERE year BETWEEN…\`, \`ORDER BY year\`) walk the sorted leaves — something a hash map fundamentally cannot do, which is the interview answer for "why not hashing?": hashes do exact-match only; B-trees do exact, range, prefix, and ordering.

A **covering index** contains every column a query needs, so the engine never visits the table at all. A composite index on (a, b) serves queries on a, and on a+b — but not b alone (it is sorted by a first; the phone book is useless for finding people by first name).

### Reading plans, paying for writes

\`EXPLAIN QUERY PLAN SELECT …\` shows SQLite's chosen strategy: \`SCAN table\` (read everything, O(n)) versus \`SEARCH table USING INDEX …\` (descend a B-tree, O(log n)). The optimizer only uses an index that matches the filter/join/order — and every index slows every write and costs space, so index deliberately: foreign keys, frequent WHERE columns, sort keys.

### Transactions and ACID

A **transaction** groups statements into an all-or-nothing unit: **A**tomic (crash mid-way → rolled back), **C**onsistent (constraints hold at commit), **I**solated (concurrent transactions do not see each other's half-done work — engines offer isolation LEVELS trading strictness for speed), **D**urable (committed means survives power loss). In Python: \`with conn:\` commits on success and rolls back on exception.

### N+1 and friends

Fetching 100 posts then looping to query each post's author issues 101 queries; each pays network/parse overhead. The fix is one JOIN (or one \`IN\` query). ORMs make N+1 easy to write accidentally — the cure is watching the actual SQL. Related hygiene: **connection pooling** (reuse expensive connections; matters for Postgres, moot for embedded SQLite) and **migrations** (schema changes as versioned, replayable scripts — you will use them properly with production databases later). SQLite vs Postgres in one line: same SQL brain, but SQLite is an in-process single-file engine (perfect for embedded, dev, and this course) while Postgres is a networked server built for many concurrent writers.`,
    viz: 'btree-index',
    guided: [
      {
        title: 'Watch an index change the physics',
        minutes: 22,
        body: `1. Create \`internals_lab.py\`. The starter builds a 200,000-row \`events\` table with random user_ids and timestamps. Run it (a few seconds).
2. Time the query "events for user 4242" and read its plan: \`EXPLAIN QUERY PLAN\` says \`SCAN events\` — the 600-page read.
3. Create the index on user_id. Re-run the SAME query: plan now says \`SEARCH events USING INDEX\`, and the timing drops by orders of magnitude. Record both numbers — this before/after is the most persuasive demo in databases.
4. Check the fine print: run a query filtering on \`kind\` (unindexed) — still a SCAN; the index on user_id is irrelevant. Then \`ORDER BY user_id LIMIT 10\` — the index serves ordering too. Explain both from the sorted-B-tree picture.
5. Measure the write tax: time inserting 20,000 more rows with the index present vs after \`DROP INDEX\` (starter has both paths). Writes pay for reads — say the trade out loud.`,
        code: `import random, sqlite3, time

conn = sqlite3.connect(":memory:")
conn.execute("""
    CREATE TABLE events (
        id      INTEGER PRIMARY KEY,
        user_id INTEGER NOT NULL,
        kind    TEXT NOT NULL,
        ts      TEXT NOT NULL
    )
""")
kinds = ["view", "click", "purchase"]
rows = [(random.randint(1, 20_000), random.choice(kinds),
         f"2026-{random.randint(1,12):02d}-{random.randint(1,28):02d}")
        for _ in range(200_000)]
conn.executemany("INSERT INTO events (user_id, kind, ts) VALUES (?, ?, ?)", rows)
conn.commit()

def timed(label, sql, params=()):
    t0 = time.perf_counter()
    n = len(conn.execute(sql, params).fetchall())
    ms = (time.perf_counter() - t0) * 1000
    plan = conn.execute("EXPLAIN QUERY PLAN " + sql, params).fetchall()
    print(f"{label:28s} {n:5d} rows  {ms:8.2f} ms   plan: {plan[0][3]}")

timed("no index", "SELECT * FROM events WHERE user_id = 4242")

conn.execute("CREATE INDEX idx_events_user ON events(user_id)")
timed("with index", "SELECT * FROM events WHERE user_id = 4242")
timed("unindexed column", "SELECT * FROM events WHERE kind = 'purchase'")
timed("order-by uses index", "SELECT * FROM events ORDER BY user_id LIMIT 10")

more = [(1, "view", "2026-09-01")] * 20_000
t0 = time.perf_counter()
conn.executemany("INSERT INTO events (user_id, kind, ts) VALUES (?, ?, ?)", more)
print(f"insert 20k WITH index:    {(time.perf_counter() - t0) * 1000:8.1f} ms")
conn.execute("DROP INDEX idx_events_user")
t0 = time.perf_counter()
conn.executemany("INSERT INTO events (user_id, kind, ts) VALUES (?, ?, ?)", more)
print(f"insert 20k WITHOUT index: {(time.perf_counter() - t0) * 1000:8.1f} ms")`,
      },
      {
        title: 'Atomic money + hunting the N+1',
        minutes: 20,
        body: `1. Add the accounts table (starter) with two accounts of 100 each and a CHECK (balance >= 0). Write \`transfer(a, b, amount)\` as two UPDATEs inside \`with conn:\`.
2. Transfer 150 — more than Amara has. The second UPDATE violates the CHECK, the exception fires, and \`with conn:\` rolls back BOTH updates: print balances and verify no money was created or destroyed. Now comment out the transaction (autocommit each UPDATE separately) and repeat — money vanishes. Restore the transaction and never speak of it again.
3. **The N+1 hunt.** The starter fetches 200 recent events, then loops fetching each event's user row — 201 queries. Time it.
4. Rewrite as ONE join query. Time it. On an in-process engine the gap is real but modest; say why it becomes catastrophic when each query crosses a network to Postgres (~1ms round trip × N).
5. Count queries with the starter's counter wrapper to prove it: 201 vs 1. That counter trick — logging actual query counts — is exactly how you will catch ORMs doing this behind your back.`,
        code: `conn.execute("""
    CREATE TABLE accounts (
        id      INTEGER PRIMARY KEY,
        name    TEXT NOT NULL,
        balance REAL NOT NULL CHECK (balance >= 0)
    )
""")
conn.execute("INSERT INTO accounts (id, name, balance) VALUES (1, 'Amara', 100), (2, 'Bo', 100)")
conn.commit()

def balances():
    return conn.execute("SELECT name, balance FROM accounts ORDER BY id").fetchall()

def transfer(frm, to, amount):
    with conn:                                # BEGIN; commit on success, rollback on error
        conn.execute("UPDATE accounts SET balance = balance - ? WHERE id = ?", (amount, frm))
        conn.execute("UPDATE accounts SET balance = balance + ? WHERE id = ?", (amount, to))

print("before:", balances())
try:
    transfer(1, 2, 150)                       # Amara only has 100 -> CHECK fails
except sqlite3.IntegrityError as e:
    print("rolled back:", e)
print("after: ", balances())                  # both balances unchanged

# ---- the N+1 problem ----
import time
t0 = time.perf_counter()
events = conn.execute("SELECT id, user_id FROM events LIMIT 200").fetchall()
for _id, uid in events:                       # 200 extra queries...
    conn.execute("SELECT COUNT(*) FROM events WHERE user_id = ?", (uid,)).fetchone()
print(f"N+1 style:  {(time.perf_counter() - t0) * 1000:7.1f} ms  (201 queries)")

t0 = time.perf_counter()
conn.execute("""
    SELECT e.id, e.user_id, u.n
    FROM (SELECT id, user_id FROM events LIMIT 200) e
    JOIN (SELECT user_id, COUNT(*) AS n FROM events GROUP BY user_id) u
      ON u.user_id = e.user_id
""").fetchall()
print(f"one query:  {(time.perf_counter() - t0) * 1000:7.1f} ms  (1 query)")`,
      },
    ],
    practice: [
      {
        title: 'The slow-query clinic, database edition',
        minutes: 20,
        body: `Three "production complaints" against your 200k-row events table. For each: read the plan, diagnose, fix, prove with before/after timings. (1) "The activity page is slow": SELECT * FROM events WHERE user_id = ? AND kind = 'purchase' — a single-column index exists on user_id; would a composite (user_id, kind) beat it, and does column order matter? Test both orders. (2) "The export is slow": SELECT user_id, ts FROM events WHERE user_id = ? — make the query covering so the plan says the table is never touched (add ts to the index) and find the plan's covering-index marker. (3) "Inserts got slow after we added five indexes": drop to the minimum set that keeps queries 1–2 fast, and defend your choice in two sentences.

Hints: EXPLAIN QUERY PLAN before and after every change; (user_id, kind) serves user_id-only queries too, so it can REPLACE the single-column index.`,
      },
    ],
    project: {
      title: 'Index audit of your tracker schema',
      brief: `Return to yesterday\'s task-tracker schema with today\'s eyes. In \`tracker_audit.py\`: (1) seed it up to ~50,000 tasks with realistic skew (a few users own most tasks); (2) take your five Day 37 product queries, EXPLAIN each, and record which ones SCAN; (3) design and create the minimal index set that turns every hot query into a SEARCH — with the reasoning for each index (and each index you deliberately did NOT add) as comments; (4) demonstrate one transaction: "complete task and log the completion" as an atomic pair with a forced failure showing rollback; (5) record before/after timings in the docstring. Commit — the Day 42 service inherits this schema and its indexes.`,
      rubric: [
        'All five queries EXPLAINed with plans recorded before and after indexing',
        'Every hot query shows SEARCH (or covering index) in its final plan',
        'At least one candidate index rejected in comments with a write-cost justification',
        'Atomic complete-and-log demonstrated with a forced rollback keeping data consistent',
        'Before/after timings in the docstring; committed to the practice repo',
      ],
    },
    mistakes: [
      'Indexing every column "to be safe." Each index taxes every INSERT/UPDATE and bloats the file; index the columns your actual queries filter, join, and sort on.',
      'Expecting an index on (a, b) to speed queries filtering only on b. Composite indexes sort by the FIRST column; b-only queries scan. Order composites by how you query.',
      'Believing a hash map would beat a B-tree for a database index. Hashes cannot do ranges, prefixes, or ORDER BY — the questions databases live on.',
      'Writing multi-statement changes without a transaction. A crash between the UPDATEs leaves half-transferred money; with conn: makes it all-or-nothing.',
      'Diagnosing slowness by staring at code instead of running EXPLAIN. The plan tells you scan-vs-search in one line; guessing tells you nothing.',
      'Shipping an ORM loop that queries per row (N+1) because each line "looks innocent." Count actual queries; fetch related rows in one JOIN or IN.',
    ],
    quiz: [
      {
        q: 'Why do databases build indexes as B-trees with huge nodes instead of binary search trees?',
        o: [
          'B-trees are easier to implement',
          'Storage is read in pages; filling each page-sized node with hundreds of keys gives massive fanout, so millions of rows need only 3–4 page reads instead of ~20 binary-tree hops',
          'Binary trees cannot store strings',
          'B-trees never need balancing',
        ],
        x: 1,
        w: 'The unit of cost is the page read. High fanout minimizes page reads; B-trees also stay balanced by splitting pages. (They DO balance — by splitting, not rotating.)',
        revisit: 38,
      },
      {
        q: 'EXPLAIN QUERY PLAN shows "SCAN orders" for WHERE customer_id = 7, and the query is slow. Best next move?',
        o: [
          'Add more RAM',
          'CREATE INDEX ON orders(customer_id), then re-EXPLAIN expecting SEARCH … USING INDEX',
          'Rewrite the query as a subquery',
          'Switch from SQLite to Postgres',
        ],
        x: 1,
        w: 'SCAN means every row is read. An index on the filtered column lets the engine descend a B-tree instead — verify by re-reading the plan, then re-timing.',
        revisit: 38,
      },
      {
        q: 'A crash occurs after "debit A" but before "credit B". With both UPDATEs in one transaction, what happens on restart?',
        o: [
          'A stays debited; B never gets credited',
          'The transaction was never committed, so atomicity rolls the debit back — as if the transfer never started',
          'The database replays the missing credit',
          'Both accounts are locked forever',
        ],
        x: 1,
        w: 'Atomicity means all-or-nothing AT COMMIT. An uncommitted transaction leaves no trace after recovery — this is the A and D of ACID working together.',
        revisit: 38,
      },
    ],
    resources: [
      { label: 'Use The Index, Luke — Anatomy of an Index', url: 'https://use-the-index-luke.com/', type: 'book', time: '30 min' },
      { label: 'SQLite — The Query Planner (official)', url: 'https://www.sqlite.org/queryplanner.html', type: 'docs', time: '20 min' },
      { label: 'CMU 15-445 — Database Systems (index lectures for the third hour)', url: 'https://15445.courses.cs.cmu.edu/', type: 'course', time: '20 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: due cards (joins, BSTs, binary search)', minutes: 10 },
      { activity: 'ELI5 + tech read; trace a key descent in the B-tree visualizer', minutes: 18 },
      { activity: 'Guided: index physics + atomic money + N+1 hunt', minutes: 42 },
      { activity: 'Practice: slow-query clinic', minutes: 20 },
      { activity: 'Project: index audit of the tracker schema', minutes: 20 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'Before/after index timings recorded with matching plan changes',
      'Write-tax measurement done and the trade-off stated',
      'Rollback demo leaves balances consistent; N+1 fixed and query-counted',
      'Index audit committed with reasoning for every index kept and rejected',
      'Quiz ≥ 2/3',
    ],
    connections: {
      back: 'The B-tree is Day 29\'s search tree re-engineered for Day 33\'s halving at page scale; the queries being accelerated are Day 36–37\'s. The timing-first discipline is Day 22\'s lab, pointed at storage.',
      forward: 'Day 42\'s service inherits this schema, its indexes, and EXPLAIN as its debugging tool. Day 47 adds caching in front of the database, Day 115\'s vector indexes rerun the same read/write trade-offs for embeddings, and Day 118 joins SQL filters with semantic search.',
    },
    flashcards: [
      { f: 'Why B-trees, not BSTs, for databases?', b: 'Cost unit is the page read; page-sized nodes give fanout in the hundreds → height 3–4 for millions of rows.' },
      { f: 'SCAN vs SEARCH in a query plan?', b: 'SCAN reads every row (O(n)); SEARCH descends an index B-tree (O(log n)). EXPLAIN QUERY PLAN shows which.' },
      { f: 'What is a covering index?', b: 'An index containing all columns the query needs — the table itself is never touched.' },
      { f: 'Composite index (a, b) serves which queries?', b: 'Filters on a, and on a AND b — not b alone (sorted by a first).' },
      { f: 'ACID in one line each?', b: 'Atomic: all-or-nothing. Consistent: constraints hold. Isolated: no half-done peeking. Durable: committed survives crashes.' },
      { f: 'The N+1 problem and fix?', b: 'One query for a list + one per item = N+1 round trips. Fix: a single JOIN or IN query.' },
    ],
    deepDive: [
      { label: 'Isolation levels, concretely', note: 'Look up read-uncommitted through serializable and the anomalies each allows (dirty read, non-repeatable read, phantom). Postgres defaults to READ COMMITTED — connect that to why Day 46 cares about concurrent writers.' },
    ],
  },
  {
    id: 'd039', day: 39, week: 6, phase: 2, kind: 'lesson',
    title: 'Operating Systems Essentials',
    analogy: 'The hotel manager',
    objectives: [
      'Distinguish processes from threads in terms of memory and failure isolation',
      'Explain virtual memory, the stack/heap split, and what the OOM killer does',
      'Inspect and manage live processes with ps, top, and kill',
      'Handle SIGTERM/SIGINT in Python and explain why SIGKILL cannot be handled',
      'Trace a file descriptor from open() to the 0/1/2 convention and redirection',
    ],
    prereqs: [
      { day: 6, label: 'The terminal & Linux' },
      { day: 16, label: 'Logging & exit codes' },
      { day: 5, label: 'Files & errors' },
    ],
    eli5: `A grand hotel runs hundreds of guests on one building's worth of resources, and the manager's genius is ISOLATION plus ILLUSION. Each guest gets a room with the same layout — bed here, desk there — and no guest can wander into another's room or even knows the others exist. That is a process: your program, convinced it owns the whole machine, actually living in one room whose "addresses" (virtual memory) the manager privately maps onto real physical space. Guest 1's desk and guest 2's desk are both "the desk," in different rooms.

Threads are roommates: several workers sharing ONE room. They coordinate cheaply — just talk across the room — but they share everything, so one roommate's mess (a corrupted shared structure, a crash) is everyone's mess. Separate rooms are safer; roommates are faster to coordinate. That trade drives tomorrow entirely.

The manager also runs the switchboard. Guests do not grab resources directly; they ring the front desk (system calls). Every room has numbered phone lines — line 0 for incoming (stdin), line 1 for outgoing (stdout), line 2 for complaints (stderr) — which is why Day 6's redirection worked: you were rerouting numbered lines. And when the hotel truly runs out of space, the manager evicts someone. Abruptly. That is the OOM killer, and your training job on Day 88 should not be the loudest guest.`,
    why: `Every mysterious production symptom bottoms out in OS concepts: "Killed" with exit code 137 is the OOM killer (you WILL meet it loading models on Day 103), "Too many open files" is file-descriptor leakage, a container that ignores docker stop for 10 seconds is a process mishandling SIGTERM, and 100% CPU with no progress is a scheduling story told by top. Day 40's concurrency choices (threads vs processes vs async) are unintelligible without today's process/thread model, and Day 148's containers are exactly this isolation machinery — namespaces and cgroups — productized. FDEs debug on customer machines where ps, top, and kill are the only tools you can assume exist.`,
    tech: `### Processes: the unit of isolation

A **process** is a running program plus its private virtual address space, open file descriptors, environment, and PID. The kernel time-slices the CPU across runnable processes (the **scheduler**), context-switching between them so fast that four cores impersonate hundreds of programs. Isolation is the headline: one process cannot scribble on another's memory, and one crash takes down only itself. Processes are created by forking and become **zombies** briefly at exit until their parent collects the exit code (Day 16's exit codes, from the other side). **Threads** live inside a process sharing its entire address space — cheap to create and to communicate through, but sharing means races (tomorrow's subject) and shared fate.

### Memory: the grand illusion

Each process sees a flat private address space, mapped by the kernel to physical RAM page by page. The **stack** holds function frames — allocation is free, lifetime ends on return, and Day 27's RecursionError is this region's guard rail. The **heap** holds everything dynamic: your objects, lists, and eventually model weights; Python's allocator and GC manage it. The kernel lazily assigns physical pages, may swap cold ones to disk, and when memory pressure becomes unbearable, the **OOM killer** picks a fat process and terminates it — dmesg shows the verdict, and your process saw exit code 137 (128 + signal 9).

### Signals and descriptors

**Signals** are the kernel's tap on the shoulder: Ctrl-C sends SIGINT (Python raises KeyboardInterrupt), \`kill PID\` sends SIGTERM (a polite, HANDLEABLE "please exit — flush your logs, close your files"), \`kill -9\` sends SIGKILL, which is delivered by the kernel without asking the process — unhandleable by design, for when politeness failed. Well-behaved services catch SIGTERM and exit cleanly; this is precisely what Docker sends before the 10-second SIGKILL deadline.

**File descriptors** are small integers naming a process's open I/O: 0 stdin, 1 stdout, 2 stderr, then every file, socket, and pipe you open. They are a finite resource (\`ulimit -n\`, often 1024): leak them in a loop and open() dies with "Too many open files" — the reason Day 5 taught \`with open(...)\`. Sockets count too, which is how HTTP client leaks bite on Day 41.`,
    viz: null,
    guided: [
      {
        title: 'Meet your processes',
        minutes: 20,
        body: `1. Create \`os_lab.py\` with the starter's \`burner\` script section — it prints its PID and burns CPU. Run it in one terminal; in another, find it with \`ps aux | grep burner\` and watch it in \`top\` (press P to sort by CPU). Confirm the PID matches what it printed.
2. Kill it politely: \`kill <PID>\` (SIGTERM). Note the exit. Restart it, now with the SIGTERM handler enabled (flip HANDLE_TERM to True): this time \`kill\` triggers the cleanup message and a tidy exit 0 — the behavior Docker will expect of your services.
3. Make it ignore SIGTERM (flip IGNORE_TERM): \`kill\` now does nothing. Escalate: \`kill -9\` ends it instantly — no cleanup line printed. Explain why no handler ran: SIGKILL never reaches the process; the kernel simply stops scheduling it.
4. Spawn children with the starter's \`subprocess\` section: parent prints its PID, launches two \`sleep 30\` children, and \`ps --forest\` (or \`pstree -p\`) shows the family tree. Kill the parent and check what happened to the children.
5. Write in your notes: the three signals you now know, who can handle them, and which one Docker sends first.`,
        code: `# --- burner section (run as: python os_lab.py burn) ---
import os, signal, subprocess, sys, time

HANDLE_TERM = False     # flip in step 2
IGNORE_TERM = False     # flip in step 3

def burn():
    print(f"burner pid={os.getpid()}  (kill me: kill {os.getpid()})")
    if HANDLE_TERM:
        def bye(signum, frame):
            print("SIGTERM received -- flushing logs, closing files, bye")
            sys.exit(0)
        signal.signal(signal.SIGTERM, bye)
    if IGNORE_TERM:
        signal.signal(signal.SIGTERM, signal.SIG_IGN)
    x = 0
    while True:                       # 100% of one core, on purpose
        x = (x + 1) % 1_000_000

def family():
    print(f"parent pid={os.getpid()}")
    kids = [subprocess.Popen(["sleep", "30"]) for _ in range(2)]
    print("children:", [k.pid for k in kids])
    print("now run:  ps --forest -o pid,ppid,cmd -g", os.getpgid(0))
    time.sleep(300)

if __name__ == "__main__":
    burn() if sys.argv[1:] == ["burn"] else family()`,
      },
      {
        title: 'Memory, descriptors & the evidence trail',
        minutes: 22,
        body: `1. **Stack vs heap, felt.** In a REPL: a deliberately unbounded recursion raises RecursionError near 1000 frames (stack guard); building a list of 100 million ints eats gigabytes of heap — watch RES climb for the python process in \`top\` while it builds, then free it with \`del\` and note that RES does not always shrink (allocators keep pages).
2. **Descriptor census.** Run the starter's fd section: it prints your process's open descriptors from \`/proc/self/fd\` — see 0, 1, 2 sitting there before you open anything. Open 10 files without closing; watch the census grow; close them; watch it shrink. Then read your limit with \`resource.getrlimit\`.
3. **The leak, simulated safely.** The starter lowers the fd limit to 64 for THIS process, then leaks descriptors in a loop until OSError "Too many open files" — catch it, print how many you got, and state the production moral (every leaked socket/file counts against this).
4. **Exit-code forensics.** From the shell: run \`python -c "import sys; sys.exit(3)"; echo $?\` → 3. Then kill a sleeping python with -9 from another terminal and check \`$?\` → 137. Decode: 128 + 9. You can now read the two most common mystery exits (137 OOM/SIGKILL, 139 segfault) from the number alone.`,
        code: `import os, resource

def fd_census(tag):
    fds = sorted(int(x) for x in os.listdir("/proc/self/fd"))
    print(f"{tag:20s} open fds: {fds[:12]}{' ...' if len(fds) > 12 else ''}  (n={len(fds)})")

fd_census("at start")                    # 0, 1, 2 (+ a few interpreter fds)

handles = [open(f"/tmp/fd_demo_{i}.txt", "w") for i in range(10)]
fd_census("after 10 opens")
for h in handles:
    h.close()
fd_census("after closing")

soft, hard = resource.getrlimit(resource.RLIMIT_NOFILE)
print(f"fd limit: soft={soft} hard={hard}")

resource.setrlimit(resource.RLIMIT_NOFILE, (64, hard))   # tighten for the demo
leaked = []
try:
    while True:
        leaked.append(open("/tmp/fd_leak.txt"))          # no close: the leak
except OSError as e:
    print(f"leaked {len(leaked)} fds, then: {e}")
finally:
    for h in leaked:
        h.close()
    resource.setrlimit(resource.RLIMIT_NOFILE, (soft, hard))`,
      },
    ],
    practice: [
      {
        title: 'Incident drill: the mystery hog',
        minutes: 18,
        body: `Simulate an on-call page. Copy the starter\'s burner into \`hog.py\`, but modify it to ALSO append 10 MB to a growing list every second (a CPU hog with a memory leak). Launch it detached (\`python hog.py &\`), close the terminal that started it if you like, and then — using only ps, top, and /proc — write down: its PID and parent PID, its CPU%, its RES memory trend over 30 seconds, and how many fds it has open. Then terminate it politely, verify it is gone, and write a four-line incident note: symptom, evidence, action, prevention.

Constraints: no killing by name (pkill) until you have identified the PID by evidence; the incident note must cite numbers you actually observed.

Hints: watch RES in top over time for the leak; cat /proc/<PID>/status shows VmRSS; ps -o pid,ppid,%cpu,rss,cmd -p <PID> is a compact one-liner.`,
      },
    ],
    project: {
      title: 'A graceful-shutdown harness you will reuse',
      brief: `Build \`graceful.py\`: a long-running "worker" that processes one queued job per second (simulated with sleep + a log line via Day 16\'s logging), and shuts down PROPERLY. Requirements: on SIGTERM or SIGINT it finishes the job in flight, logs how many jobs completed, closes its log file handler, and exits 0 — never mid-job. A --stubborn flag disables handling (for demonstrating kill -9). Include a README section: the exact kill commands to test each path, expected exit codes ($?), and the decoded meaning of 0, 130, 137. This harness is the shape of every service you will ship: Day 42\'s API, and the containers Docker stops on Day 148 get exactly 10 seconds of this politeness.`,
      rubric: [
        'SIGTERM and SIGINT both trigger the same clean shutdown path (finish job, log summary, exit 0)',
        'kill during a job demonstrably lets the job finish before exit — shown in logs with timestamps',
        'kill -9 on --stubborn mode leaves the "completed" log line missing, demonstrating why cleanup cannot rely on SIGKILL',
        'README documents observed exit codes 0, 130, and 137 with their decoding',
        'Committed to the practice repo with the incident note from practice included',
      ],
    },
    mistakes: [
      'Treating kill as "force kill." Plain kill sends SIGTERM — the polite, handleable request. kill -9 (SIGKILL) is the last resort, and cleanup code never runs under it.',
      'Registering cleanup on SIGKILL and wondering why it never fires. SIGKILL is delivered by the kernel without the process ever seeing it — that is the design.',
      'Reading VIRT in top as "memory used." VIRT is address space reserved; RES (resident) is actual RAM occupied — the number the OOM killer cares about.',
      'Confusing exit code conventions: 137 is not "error 137" — it is 128 + signal 9, meaning killed (usually OOM or docker stop timeout). 130 is 128 + SIGINT.',
      'Leaking descriptors in long-running services by skipping with-blocks "because the script is short." Services are never short; every socket counts against ulimit.',
      'Blaming Python when the OOM killer strikes. dmesg (or journalctl -k) names the victim and the score — check the kernel log before theorizing.',
    ],
    quiz: [
      {
        q: 'Your container ignores docker stop for 10 seconds, then dies losing its last batch of work. What is happening?',
        o: [
          'Docker is buggy',
          'The app never handles SIGTERM, so Docker waits its grace period and sends unhandleable SIGKILL — the fix is a SIGTERM handler that finishes and exits',
          'The app needed more memory',
          'docker stop always takes 10 seconds',
        ],
        x: 1,
        w: 'docker stop sends SIGTERM, waits (default 10s), then SIGKILLs. A handler that drains in-flight work and exits promptly is the contract — exactly today\'s graceful.py.',
        revisit: 39,
      },
      {
        q: 'A training script prints "Killed" and the shell reports exit code 137. Most likely cause and first place to check?',
        o: [
          'A Python syntax error; check the traceback',
          'The OOM killer terminated it (137 = 128 + SIGKILL); check dmesg / kernel logs for the OOM record',
          'A disk full error; check df',
          'The script called sys.exit(137)',
        ],
        x: 1,
        w: 'No traceback plus "Killed" plus 137 is the OOM killer\'s signature. The kernel log names the victim and its memory score — evidence first, then reduce memory use.',
        revisit: 39,
      },
      {
        q: 'Threads vs processes — which statement is correct?',
        o: [
          'Threads have private memory; processes share memory',
          'Threads share their process\'s address space (cheap communication, shared fate); processes are isolated (safe, but communication costs more)',
          'Processes cannot run in parallel',
          'A thread crash never affects other threads',
        ],
        x: 1,
        w: 'Sharing one address space is the thread\'s superpower and its danger: races and crashes are shared too. Isolation is what a process buys. Tomorrow builds directly on this trade.',
        revisit: 39,
      },
    ],
    resources: [
      { label: 'OSTEP — Processes & Address Spaces chapters (free book)', url: 'https://pages.cs.wisc.edu/~remzi/OSTEP/', type: 'book', time: '35 min' },
      { label: 'MIT Missing Semester — command environment & job control', url: 'https://missing.csail.mit.edu/', type: 'course', time: '20 min' },
      { label: 'signal — official Python docs', url: 'https://docs.python.org/3/library/signal.html', type: 'docs', time: '15 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: due cards (indexes, transactions, joins)', minutes: 10 },
      { activity: 'ELI5 + tech read: rooms, roommates, and numbered phone lines', minutes: 18 },
      { activity: 'Guided: signals & process tree, memory & descriptors', minutes: 42 },
      { activity: 'Practice: the mystery hog incident drill', minutes: 18 },
      { activity: 'Project: graceful-shutdown harness', minutes: 22 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'SIGTERM handled, ignored, and SIGKILLed — behaviors observed and explained',
      'fd census run; the simulated leak hit the limit and was diagnosed',
      'Incident note written with observed PIDs, CPU%, and memory numbers',
      'graceful.py committed; exit codes 0/130/137 demonstrated and decoded',
      'Quiz ≥ 2/3',
    ],
    connections: {
      back: 'Day 6\'s pipes and redirection were file descriptors all along; Day 16\'s exit codes are what parents collect from dying children; Day 27\'s RecursionError was the stack guard rail introduced properly today.',
      forward: 'Tomorrow (Day 40) races threads and processes using today\'s model. Day 41\'s servers are processes juggling socket descriptors, Day 148\'s containers are this isolation machinery with namespaces and cgroups, and Day 155\'s GPU memory pressure replays the OOM story on different silicon.',
    },
    flashcards: [
      { f: 'Process vs thread in one line?', b: 'Process: isolated address space, safe, own fate. Thread: shares its process\'s memory — cheap to coordinate, shared risk.' },
      { f: 'SIGTERM vs SIGKILL?', b: 'SIGTERM: polite, handleable — clean up and exit. SIGKILL (-9): kernel-enforced, no handler ever runs.' },
      { f: 'Exit code 137 means?', b: '128 + signal 9: SIGKILLed — usually the OOM killer or a stop-timeout. Check dmesg.' },
      { f: 'fds 0, 1, 2 are…?', b: 'stdin, stdout, stderr — every process starts with them; redirection reroutes these numbers.' },
      { f: 'Stack vs heap?', b: 'Stack: function frames, auto-freed on return, guarded (RecursionError). Heap: dynamic objects, GC-managed, where big data lives.' },
      { f: '"Too many open files" root cause?', b: 'Descriptor leak — opens (files/sockets) without closes exceeding ulimit -n. Fix: with-blocks / close in finally.' },
    ],
    deepDive: [
      { label: 'OSTEP — the scheduling chapters', url: 'https://pages.cs.wisc.edu/~remzi/OSTEP/', note: 'How the kernel decides who runs next: MLFQ and fairness. Optional but it makes top\'s numbers (load average, %CPU) meaningful.' },
    ],
  },
  {
    id: 'd040', day: 40, week: 6, phase: 2, kind: 'lesson',
    title: 'Concurrency & Async Python',
    analogy: 'One chef, many pots',
    objectives: [
      'Distinguish concurrency from parallelism and I/O-bound from CPU-bound work',
      'Explain what the GIL does and does not prevent',
      'Choose correctly among threads, processes, and asyncio for a given workload',
      'Write async/await code with gather, timeouts, and cancellation',
      'Demonstrate a race condition and fix it with a lock',
    ],
    prereqs: [
      { day: 39, label: 'OS essentials — processes & threads' },
      { day: 11, label: 'Iterators & generators' },
      { day: 12, label: 'Closures & decorators' },
    ],
    eli5: `Watch a good cook make a four-dish dinner. They do NOT cook dish one to completion, then start dish two — they put the rice on, and WHILE it simmers, chop vegetables; while the sauce reduces, sear the fish. One cook, many pots, zero waiting around. That is concurrency: making progress on many tasks by using the WAITING time of some to work on others. Parallelism is different — that is hiring three more cooks (more CPU cores) so four things literally happen at the same instant.

Which one you need depends on what is slow. Simmering (waiting on the network, the disk, a database, an LLM API) needs the one-clever-cook trick — most of the elapsed time is waiting, so one worker who never idles can juggle hundreds of pots. Nonstop chopping (pure computation) gains nothing from juggling — one pair of hands is busy every second — so only more cooks help.

Python's kitchen has a famous rule: the GIL, one "knife" that threads must hold to run Python code. So threads take turns chopping — fine for simmering-heavy work (waiting threads give up the knife), useless for chop-heavy work. Asyncio removes even the pretense of multiple cooks: one cook, an explicit to-do list (the event loop), and \`await\` marking every spot where they switch pots.`,
    why: `LLM applications are the most I/O-bound software mainstream engineering has ever produced: every call to a model API is seconds of pure waiting, and an app that embeds 500 chunks (Day 115) or fans one question out to three models sequentially is unusably slow — while the async version finishes in roughly the time of the slowest single call. This is why FastAPI (tomorrow) is async-native, why every serious LLM SDK ships an async client (Day 106), and why your capstone's ingest pipeline lives or dies by a semaphore. Interviewers, meanwhile, love "explain the GIL" precisely because it separates people who can parrot "Python can't do threads" from people who know threads are exactly right for I/O.`,
    tech: `### The decision, before any syntax

**Concurrency** is structuring work so tasks overlap in time; **parallelism** is executing simultaneously on multiple cores. Diagnose the workload first. **I/O-bound** (network calls, disk, databases — wall-clock dominated by waiting): concurrency wins; threads or asyncio. **CPU-bound** (parsing, math, tokenizing): only real parallelism helps; multiprocessing (each process has its own interpreter, own GIL, own core).

### The GIL, precisely

The Global Interpreter Lock lets only ONE thread execute Python bytecode at a time per process. Consequences: CPU-bound threads take turns and give you zero speedup (often a slight slowdown from switching); but a thread that BLOCKS on I/O releases the GIL, so I/O-bound threading genuinely overlaps waiting. (NumPy and friends also release it inside C loops, and Python 3.13+ ships an experimental free-threaded build — know the fact, plan for the classic GIL.) What the GIL does NOT give you: thread safety. \`counter += 1\` is read-modify-write, threads can interleave between those steps, and updates get lost — you still need a \`Lock\` around shared mutation.

### asyncio: cooperative single-threaded concurrency

An \`async def\` function returns a coroutine — a pausable function (a cousin of Day 11's generators). The **event loop** runs one coroutine until it hits \`await something_slow\`, parks it, and runs another; when the awaited I/O completes, the coroutine resumes. Switching happens ONLY at await — cooperative multitasking — which kills classic races (nothing preempts you mid-statement) but adds the cardinal sin: any BLOCKING call (\`time.sleep\`, \`requests.get\`, heavy CPU) freezes the entire loop, every task, because there is only one thread.

The working vocabulary: \`asyncio.run(main())\` starts the loop; \`asyncio.gather(*coros)\` runs coroutines concurrently and collects results in order; \`asyncio.wait_for(coro, timeout=s)\` raises TimeoutError and CANCELS the task (cancellation is delivered as CancelledError at the next await — handle it to clean up); \`asyncio.Semaphore(n)\` caps in-flight concurrency, the tool that keeps you under API rate limits forever after; \`loop.run_in_executor\` (or \`asyncio.to_thread\`) shunts unavoidable blocking work onto a thread so the loop keeps breathing.`,
    viz: 'async-loop',
    guided: [
      {
        title: 'The workload decides: threads vs processes vs the GIL',
        minutes: 20,
        body: `1. Create \`concurrency_lab.py\` with the starter: an I/O-bound task (sleep 0.5s, simulating an API call) and a CPU-bound task (summing 10 million numbers).
2. Predict BEFORE running: 8 I/O tasks sequentially vs with 8 threads; 4 CPU tasks sequentially vs with 4 threads vs with 4 processes. Write your predicted times down.
3. Run the harness. Expected shape: I/O with threads collapses ~4s to ~0.5s (waiting overlaps); CPU with threads is NO faster (the GIL); CPU with processes divides by your core count.
4. Explain each row of the printed table out loud using the GIL model: who was holding the knife, who was waiting, who had their own kitchen.
5. Note the pattern in the code: \`ThreadPoolExecutor\` and \`ProcessPoolExecutor\` share one API (\`executor.map\`) — the decision is one class name, so the THINKING is the deliverable.`,
        code: `import time
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor

def io_task(i):
    time.sleep(0.5)              # stands in for a network/API call
    return i

def cpu_task(i):
    return sum(range(10_000_000))  # pure computation: the GIL matters here

def timed(label, fn):
    t0 = time.perf_counter()
    fn()
    print(f"{label:35s} {time.perf_counter() - t0:6.2f}s")

if __name__ == "__main__":
    timed("io x8, sequential", lambda: [io_task(i) for i in range(8)])
    with ThreadPoolExecutor(max_workers=8) as ex:
        timed("io x8, 8 threads", lambda: list(ex.map(io_task, range(8))))

    timed("cpu x4, sequential", lambda: [cpu_task(i) for i in range(4)])
    with ThreadPoolExecutor(max_workers=4) as ex:
        timed("cpu x4, 4 threads (GIL!)", lambda: list(ex.map(cpu_task, range(4))))
    with ProcessPoolExecutor(max_workers=4) as ex:
        timed("cpu x4, 4 processes", lambda: list(ex.map(cpu_task, range(4))))`,
      },
      {
        title: 'asyncio for real + the race you must see once',
        minutes: 22,
        body: `1. In \`async_lab.py\`, write \`fetch(name, seconds)\` as an async coroutine (await asyncio.sleep to simulate an LLM API call). Run three sequentially with plain awaits, then concurrently with \`gather\` — 3.0s becomes ~1.2s (the slowest call). This is the shape of every multi-model / multi-chunk call you will ever make.
2. Add the cardinal-sin demo: replace one task's \`await asyncio.sleep\` with blocking \`time.sleep\` and watch EVERYTHING serialize — one blocked cook, whole kitchen frozen. Restore it and say the rule: never block the loop.
3. Add \`wait_for\` with a 1.0s timeout around a 5s task: TimeoutError fires, and the task's except CancelledError block runs its cleanup. Cancellation is cooperative — it arrives at the next await.
4. Add the semaphore: 10 tasks, \`asyncio.Semaphore(3)\`, and a live printout of in-flight count — never above 3. This is your future rate-limit governor, verbatim.
5. **The race.** Run the threaded counter in the starter: two threads each do 500,000 unguarded \`count += 1\`; the total comes up SHORT (run it thrice — different shortfalls, the signature of a race). Add the Lock and get exactly 1,000,000. State why the GIL did not save you: += is several bytecodes, and preemption lands between them.`,
        code: `import asyncio, threading, time

async def fetch(name, seconds):
    print(f"  -> {name} started")
    try:
        await asyncio.sleep(seconds)          # the polite, loop-friendly wait
    except asyncio.CancelledError:
        print(f"  !! {name} cancelled -- cleaning up")
        raise
    print(f"  <- {name} done")
    return name

async def main():
    t0 = time.perf_counter()
    await fetch("a", 1.0); await fetch("b", 1.2); await fetch("c", 0.8)
    print(f"sequential: {time.perf_counter() - t0:.2f}s")

    t0 = time.perf_counter()
    results = await asyncio.gather(fetch("a", 1.0), fetch("b", 1.2), fetch("c", 0.8))
    print(f"gather:     {time.perf_counter() - t0:.2f}s -> {results}")

    try:
        await asyncio.wait_for(fetch("slowpoke", 5.0), timeout=1.0)
    except asyncio.TimeoutError:
        print("timed out -- slowpoke was cancelled")

    sem = asyncio.Semaphore(3)                 # the rate-limit governor
    in_flight = 0
    async def governed(i):
        nonlocal in_flight
        async with sem:
            in_flight += 1
            print(f"  task {i} running ({in_flight} in flight)")
            await asyncio.sleep(0.5)
            in_flight -= 1
    await asyncio.gather(*(governed(i) for i in range(10)))

asyncio.run(main())

# ---- the race ----
count = 0
lock = threading.Lock()
USE_LOCK = False                               # flip after observing the loss

def bump():
    global count
    for _ in range(500_000):
        if USE_LOCK:
            with lock:
                count += 1
        else:
            count += 1                         # read-modify-write: interleavable

threads = [threading.Thread(target=bump) for _ in range(2)]
for t in threads: t.start()
for t in threads: t.join()
print(f"count = {count:,} (expected 1,000,000)")`,
      },
    ],
    practice: [
      {
        title: 'The polite crawler',
        minutes: 20,
        body: `Build \`crawler.py\`: given 20 simulated "URLs" (each fetch is \`asyncio.sleep(random.uniform(0.2, 1.5))\` returning fake content, with a 10% chance of raising a fake ConnectionError), fetch them all with: at most 4 in flight (semaphore), a 1.0s per-fetch timeout, ONE retry with a short backoff for failures/timeouts, and a final report — successes, failures, total elapsed vs the sum of individual times (your concurrency win).

Constraints: no fetch may block the loop; gather must not die because one URL failed (look up gather's return_exceptions=True, or wrap each fetch). Test that in-flight never exceeds 4 by printing a counter.

Hints: structure per-URL logic as its own coroutine (governed fetch → timeout → retry) and gather those. random.random() < 0.1 triggers the fake failure.`,
      },
    ],
    project: {
      title: 'The concurrency decision card + a benchmark you own',
      brief: `Two deliverables. (1) \`bench_concurrency.py\`: extend the guided harness into a clean, argparse-driven benchmark (\`--workload io|cpu --strategy seq|threads|processes|async --n 8\`) with logging (Day 16) and a results table; include asyncio for I/O workloads and note honestly why async has no CPU row. (2) \`concurrency_card.md\`: your decision card — the workload-diagnosis question, the three tools with one-line verdicts each, the GIL in two sentences YOU wrote, the cardinal sin of async, and the race-condition rule. This card is the reference you will consult on Day 107 (streaming clients), Day 115 (parallel embedding), and Day 155 (serving concurrency). Commit both.`,
      rubric: [
        'Benchmark runs all valid workload×strategy combos from the CLI and prints a comparison table',
        'I/O results show threads and async both collapsing wait time; CPU results show only processes scaling',
        'Race demo included with lock fix and a comment locating the interleaving point',
        'Decision card states the GIL\'s effect on I/O vs CPU threads correctly and in your own words',
        'Committed; card linked from the repo README',
      ],
    },
    mistakes: [
      'Saying "Python threads are useless because of the GIL." Blocked I/O releases the GIL — threads are exactly right for I/O-bound work. The GIL nullifies CPU threading only.',
      'Believing the GIL makes code thread-safe. count += 1 is multiple bytecodes; threads interleave between them and drop updates. Shared mutation needs a Lock regardless.',
      'Calling time.sleep or requests.get inside async code. One blocking call freezes every task on the loop — use await asyncio.sleep, an async client, or to_thread.',
      'Writing async def everywhere and awaiting each call in sequence — that is sequential code with extra keywords. The win comes from gather / TaskGroup running coroutines together.',
      'Unbounded gather over 5,000 URLs: you just DDoSed the API and blew through rate limits. A Semaphore capping in-flight work is not optional in production.',
      'Using multiprocessing for I/O-bound work: processes cost real memory and startup, and picklable-argument restrictions bite — threads or async do it cheaper.',
    ],
    quiz: [
      {
        q: 'Four CPU-heavy parsing jobs run in 4 threads and take the same time as sequential. Why, and what fixes it?',
        o: [
          'Threads are broken; use async',
          'The GIL lets only one thread run Python bytecode at a time, so CPU work serializes; ProcessPoolExecutor gives each job its own interpreter and core',
          'The jobs share memory badly',
          'You need more threads',
        ],
        x: 1,
        w: 'CPU-bound threads take turns holding the GIL — concurrency without parallelism. Separate processes each carry their own GIL and can truly run in parallel.',
        revisit: 40,
      },
      {
        q: 'One task in your asyncio app calls time.sleep(5). What happens?',
        o: [
          'Only that task pauses',
          'The entire event loop freezes for 5 seconds — every task stops, because blocking calls never yield control back to the single-threaded loop',
          'asyncio converts it to await automatically',
          'A deadlock error is raised',
        ],
        x: 1,
        w: 'Cooperative multitasking only switches at await. A blocking call holds the one thread hostage — the cardinal sin. Use await asyncio.sleep or to_thread.',
        revisit: 40,
      },
      {
        q: 'Two threads each increment a shared counter 500k times without a lock; the result is 861,204. What happened?',
        o: [
          'Python lost count due to integer overflow',
          'A race: += is read-modify-write, threads interleaved between the steps, and increments overwrote each other — the GIL does not make compound operations atomic',
          'One thread crashed silently',
          'The result is random but the code is correct',
        ],
        x: 1,
        w: 'Thread A reads 100, B reads 100, both write 101 — one increment lost. Wrap the mutation in a Lock (or design the sharing away). Lost-update shortfalls that vary run-to-run are the classic race signature.',
        revisit: 40,
      },
    ],
    resources: [
      { label: 'asyncio — official Python docs (coroutines & tasks)', url: 'https://docs.python.org/3/library/asyncio.html', type: 'docs', time: '30 min' },
      { label: 'threading — official Python docs (Lock, and the GIL notes)', url: 'https://docs.python.org/3/library/threading.html', type: 'docs', time: '15 min' },
      { label: 'OSTEP — Concurrency chapters (threads, locks)', url: 'https://pages.cs.wisc.edu/~remzi/OSTEP/', type: 'book', time: '25 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: due cards (processes, signals, fds)', minutes: 10 },
      { activity: 'ELI5 + tech read; watch the async-loop visualizer park and resume tasks', minutes: 18 },
      { activity: 'Guided: workload benchmark, asyncio toolkit + the race', minutes: 42 },
      { activity: 'Practice: the polite crawler', minutes: 20 },
      { activity: 'Project: benchmark CLI + decision card', minutes: 20 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'Benchmark table produced; every row explained via the GIL model',
      'gather, wait_for + cancellation cleanup, and semaphore all demonstrated',
      'Race observed (short count), then fixed exactly with a Lock',
      'Polite crawler respects max-4 in flight with timeout + retry; card committed',
      'Quiz ≥ 2/3',
    ],
    connections: {
      back: 'Threads and processes are Day 39\'s roommates-vs-rooms, now raced; coroutines are Day 11\'s pausable generators grown up; the with-lock pattern reuses Day 5\'s context-manager discipline.',
      forward: 'Tomorrow FastAPI runs your handlers on this exact event loop — the cardinal sin becomes a production outage. Day 107 streams LLM responses async, Day 115 embeds corpora under a semaphore, and Day 155 tunes serving concurrency with today\'s vocabulary.',
    },
    flashcards: [
      { f: 'I/O-bound vs CPU-bound → which tool?', b: 'I/O: threads or asyncio (overlap the waiting). CPU: multiprocessing (real cores). Diagnose before choosing.' },
      { f: 'What the GIL does — and does not — do?', b: 'One thread runs Python bytecode at a time (kills CPU threading; I/O releases it). Does NOT make compound ops thread-safe.' },
      { f: 'The cardinal sin of asyncio?', b: 'Blocking the loop (time.sleep, sync HTTP, heavy CPU) — every task freezes. Use await, async clients, to_thread.' },
      { f: 'asyncio.gather does what?', b: 'Runs coroutines concurrently, returns results in argument order; return_exceptions=True keeps one failure from killing all.' },
      { f: 'Cap concurrent API calls how?', b: 'asyncio.Semaphore(n) + async with — at most n in flight; the rate-limit governor.' },
      { f: 'Race condition signature and fix?', b: 'Shared counter comes up short, differently each run — interleaved read-modify-write. Fix: Lock around the mutation.' },
    ],
    deepDive: [
      { label: 'Structured concurrency: asyncio.TaskGroup', note: 'Python 3.11\'s TaskGroup scopes tasks to a block and propagates failures cleanly — the modern alternative to bare gather. Rewrite the polite crawler with it and compare error behavior.' },
    ],
  },
  {
    id: 'd041', day: 41, week: 6, phase: 2, kind: 'lesson',
    title: 'HTTP & Build Your First API',
    analogy: 'Ordering at the counter',
    objectives: [
      'Dissect an HTTP request and response: method, path, headers, status, body',
      'Choose correct methods and status codes for CRUD-style operations',
      'Use httpx to call APIs with params, headers, timeouts, and error handling',
      'Build a FastAPI service with path/query parameters and pydantic validation',
      'Explore your own API through its auto-generated docs',
    ],
    prereqs: [
      { day: 40, label: 'Concurrency & async' },
      { day: 10, label: 'OOP II — dataclasses (pydantic\'s shape)' },
      { day: 5, label: 'JSON handling' },
    ],
    eli5: `A coffee counter has a protocol everyone silently knows. You state a VERB and a THING: "GET me a latte." The barista replies with a STATUS before anything else — "coming up" (all good), "we don't have that" (your mistake), "the machine is broken" (their mistake) — and then, maybe, the drink. You can also hand things over: "POST: here's my custom order form." Neither of you remembers the last exchange; every order is complete in itself, which is why you repeat "for Priya, oat milk" every single time.

HTTP is exactly this, written down. The request line says the verb and the thing (\`GET /books/7\`); headers are the sticky notes on the order ("I speak JSON", "I'm Priya"); the body is the form you handed over. The response leads with a three-digit status — 2xx coming-up, 4xx your-mistake, 5xx our-mistake — then its own headers and body. Statelessness is the counter's amnesia: every request must carry everything needed to serve it.

Today you stand on BOTH sides of the counter: morning as the customer (httpx, the caller), afternoon as the barista (FastAPI, the server) — and the customer half is how you will talk to every LLM API for the rest of the program.`,
    why: `HTTP is the substrate of your entire future stack: every LLM call (Day 106) is an HTTP POST, every 429 you retry (Day 107), every webhook, every RAG service endpoint. Building the server side is just as core: the AI features you ship are consumed as APIs, and FastAPI is the Python default — async-native (yesterday's loop, now serving requests), pydantic-validated (the same contract thinking as Day 36's schemas, at the door of your service), with free interactive docs your customers and teammates will actually use. The Day 42 checkpoint, the Day 49 URL shortener, and the capstone's serving layer are all today's skeleton, thickened.`,
    tech: `### The wire format

A request: method, path (plus query string), protocol version; then headers (key: value metadata — \`Content-Type: application/json\`, \`Authorization: Bearer …\`, \`Accept\`); blank line; optional body. A response: status code, headers, body. **Methods** carry meaning by convention: GET reads (no body, safe to repeat and cache), POST creates or acts (not safely repeatable — the double-charge button), PUT replaces, PATCH partially updates, DELETE removes. GET/PUT/DELETE are **idempotent** — repeating them lands in the same state — which decides what is safe to auto-retry (Day 107 leans on this hard).

**Status codes** in the tiers that matter: 200 OK, 201 Created, 204 No Content; 301/302 redirects; 400 Bad Request (malformed), 401 Unauthenticated, 403 Forbidden, 404 Not Found, 422 Unprocessable (valid JSON, invalid content — FastAPI's validation verdict), 429 Too Many Requests (the LLM-era celebrity); 500 Internal Server Error, 502/503 upstream/overloaded. The client contract: branch on the tier, not just "did it work."

### httpx — the caller's side

\`httpx.get(url, params={...}, timeout=5.0)\` builds query strings and encodes for you; \`.json()\` parses the body; \`.raise_for_status()\` turns 4xx/5xx into exceptions — call it or check \`.status_code\` explicitly, because HTTP "succeeds" at transport even when the API says 404. ALWAYS set a timeout: the default patience of a network call is infinite, and a hung dependency becomes your hang. httpx matters over the older requests because it speaks async too — \`httpx.AsyncClient\` plugs into yesterday's event loop and tomorrow's tests.

### FastAPI — the barista's side

Declare a route with a decorator (\`@app.get("/books/{book_id}")\`); type hints do the rest: \`book_id: int\` converts and validates the path segment (a non-int returns 422 automatically), function parameters not in the path become query parameters, and a **pydantic** \`BaseModel\` parameter makes FastAPI parse, validate, and type the JSON body — your Day 36 "contract at the door," but for requests. Handlers can be \`async def\` (they run ON the event loop — never block them) or plain \`def\` (FastAPI runs those in a threadpool). \`uvicorn app:app --reload\` serves it, and \`/docs\` gives you a live, clickable OpenAPI console generated from your types — the fastest demo surface you own.`,
    viz: 'http-cycle',
    guided: [
      {
        title: 'Stand up the counter (FastAPI)',
        minutes: 22,
        body: `1. Install the day's tools in your venv: \`pip install fastapi uvicorn httpx\`. Create \`api.py\` from the starter — an in-memory books API (dict for storage; real persistence arrives tomorrow).
2. Run \`uvicorn api:app --reload\` and open http://127.0.0.1:8000/docs. Click through the auto-docs: expand GET /books, try it, read the curl it generated. This page came entirely from your type hints.
3. Poke the validation without writing any client code: try GET /books/abc (422 — path type failed), POST a book with a negative price (422 with a field-level error message locating exactly what and where), then a valid POST (201, echoing the created resource with its id).
4. Read the starter's status-code choices out loud and justify each: 201 for create, 404 for missing id, 422 arriving free from pydantic. Then add a DELETE route yourself returning 204 — and confirm in /docs that it appeared.
5. Watch the uvicorn console as you click: every line is method, path, status — the request log you will grep in production (Day 16 pays off here).`,
        code: `from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

app = FastAPI(title="Books API", version="0.1.0")

class BookIn(BaseModel):
    title: str = Field(min_length=1)
    author: str = Field(min_length=1)
    price: float = Field(ge=0)          # the contract at the door
    year: int | None = None

class Book(BookIn):
    id: int

_db: dict[int, Book] = {}
_next_id = 1

@app.get("/books")
def list_books(author: str | None = None, limit: int = 10) -> list[Book]:
    books = list(_db.values())          # author & limit are query params
    if author:
        books = [b for b in books if b.author == author]
    return books[:limit]

@app.get("/books/{book_id}")
def get_book(book_id: int) -> Book:     # /books/abc -> 422, automatically
    if book_id not in _db:
        raise HTTPException(status_code=404, detail="book not found")
    return _db[book_id]

@app.post("/books", status_code=201)
def create_book(book: BookIn) -> Book:  # body parsed & validated by pydantic
    global _next_id
    created = Book(id=_next_id, **book.model_dump())
    _db[_next_id] = created
    _next_id += 1
    return created

# your turn: DELETE /books/{book_id} -> 204, or 404 if missing`,
      },
      {
        title: 'Be the customer (httpx)',
        minutes: 20,
        body: `1. With the server still running, create \`client.py\`. Use one \`httpx.Client(base_url=..., timeout=5.0)\` for all calls (connection reuse — and a timeout, always).
2. POST three books, then GET the list with \`params={"author": ..., "limit": 2}\` — print the URL httpx actually built (response.request.url) to see query-string encoding done for you.
3. Handle failure tiers properly: GET /books/999 and branch on status_code — 404 is not an exception at transport level, and blind \`.json()["title"]\` on it would KeyError. Then use \`raise_for_status()\` in a try/except as the alternative style; print status_code and the error body from the exception.
4. Inspect a full exchange: print request method/URL/headers and response status/headers (find content-type and content-length). Match each piece to the request-anatomy diagram from the tech section.
5. Finish with the async version: rewrite the three POSTs with \`httpx.AsyncClient\` and \`asyncio.gather\` — yesterday's pattern, today against a real server. Time sequential vs gathered.`,
        code: `import asyncio, time
import httpx

BASE = "http://127.0.0.1:8000"

with httpx.Client(base_url=BASE, timeout=5.0) as client:
    for t, a, p in [("Deep Work", "Cal Newport", 14.99),
                    ("Digital Minimalism", "Cal Newport", 12.99),
                    ("Refactoring", "Martin Fowler", 47.99)]:
        r = client.post("/books", json={"title": t, "author": a, "price": p})
        r.raise_for_status()
        print("created:", r.status_code, r.json()["id"])

    r = client.get("/books", params={"author": "Cal Newport", "limit": 2})
    print("url built:", r.request.url)
    print("status:", r.status_code, "content-type:", r.headers["content-type"])
    for book in r.json():
        print("  ", book["title"])

    r = client.get("/books/999")
    if r.status_code == 404:                 # transport succeeded; API said no
        print("as expected:", r.status_code, r.json()["detail"])

async def create_many():
    async with httpx.AsyncClient(base_url=BASE, timeout=5.0) as ac:
        t0 = time.perf_counter()
        payloads = [{"title": f"Vol {i}", "author": "Bulk", "price": 1.0}
                    for i in range(20)]
        rs = await asyncio.gather(*(ac.post("/books", json=p) for p in payloads))
        print(f"20 concurrent creates: {time.perf_counter() - t0:.2f}s,",
              "all 201:", all(r.status_code == 201 for r in rs))

asyncio.run(create_many())`,
      },
    ],
    practice: [
      {
        title: 'The resilient client',
        minutes: 20,
        body: `Make your API flaky, then build the client that survives it. Add GET /flaky to api.py: 30% of calls return 503, 20% return 429 with a Retry-After: 1 header, the rest 200. Then write \`resilient.py\`: a \`get_with_retries(client, url, max_tries=4)\` function implementing exponential backoff with jitter (0.5s base, doubling, plus random 0–0.3s), honoring Retry-After when present, retrying ONLY retryable statuses (429, 502, 503 — never 404), and logging each attempt with its wait. Prove it: 50 calls through the wrapper should all eventually succeed; print the attempt histogram.

Constraints: timeouts on every call; a final failure after max_tries raises a clear exception. Think: why is retrying a GET always safe, and when would retrying a POST double-charge someone?

Hints: wait = base * 2**attempt + random.uniform(0, 0.3); Retry-After arrives as seconds in r.headers.`,
      },
    ],
    project: {
      title: 'Quotes API — designed, built, documented',
      brief: `Design and build \`quotes_api.py\` solo: a quotes service with POST /quotes (text, author, tags list — validated: non-empty text, at most 5 tags), GET /quotes (filterable by author and tag via query params, with limit/offset pagination), GET /quotes/{id}, DELETE /quotes/{id}, and GET /quotes/random. Correct status codes throughout (201/204/404/422). Then ship \`quotes_client.py\` exercising every route including the failure paths, using one Client with timeout. Screenshot or describe your /docs page in the README section. In-memory storage is fine — tomorrow it grows a real database and tests. Commit both files.`,
      rubric: [
        'All six routes work and return the specified status codes (checked via client, not just /docs)',
        'Pydantic rejects empty text and >5 tags with 422 field-level errors',
        'Pagination works: limit/offset slices verified with 10+ seeded quotes',
        'Client demonstrates the 404 branch and one validation failure without crashing',
        'Every client call sets a timeout; committed with a README note on your status-code choices',
      ],
    },
    mistakes: [
      'No timeout on HTTP calls. The default is to wait forever; one hung upstream hangs your service. timeout= on every client — non-negotiable from today.',
      'Assuming a 2xx because no exception was raised. httpx returns 404s and 500s as normal responses — check status_code or call raise_for_status().',
      'Using GET for state-changing actions ("GET /books/7/delete"). Crawlers, prefetchers, and retries will happily fire it repeatedly — verbs carry contracts.',
      'Returning 200 with {"error": "not found"} in the body. Clients branch on status codes; lying with 200 breaks every generic client, cache, and monitor downstream.',
      'Blocking inside an async def handler (sync DB call, time.sleep) — yesterday\'s cardinal sin, now freezing every concurrent request your server is juggling.',
      'Retrying non-idempotent POSTs blindly on timeout — the request may have succeeded before the timeout hit: double-charge. Retry idempotent calls freely; POSTs need idempotency keys (Day 107).',
    ],
    quiz: [
      {
        q: 'A client sends valid JSON to your FastAPI route, but price is -5 against Field(ge=0). What does FastAPI return?',
        o: [
          '500 — the server crashed',
          '422 Unprocessable Entity with a field-level error naming price — pydantic rejected the contract at the door',
          '400 with an empty body',
          '200 with price clamped to 0',
        ],
        x: 1,
        w: 'Validation failures are the CLIENT\'s error, reported precisely: which field, what rule. Your handler never even runs — the invalid data never crosses the threshold.',
        revisit: 41,
      },
      {
        q: 'Which request is safe to retry automatically after a timeout, and why?',
        o: [
          'POST /orders — it probably failed',
          'GET /orders/17 — GET is idempotent: repeating it cannot change state, so a retry risks nothing even if the first attempt actually succeeded',
          'Neither — never retry',
          'Both — timeouts mean nothing happened',
        ],
        x: 1,
        w: 'A timeout is ambiguous: the request MAY have been processed. Idempotent methods (GET/PUT/DELETE) land in the same state on repeat; a POST retry can duplicate the order.',
        revisit: 41,
      },
      {
        q: 'Your service calls a dependency that starts returning 503. The well-behaved client response is…',
        o: [
          'Retry instantly in a tight loop until it works',
          'Treat it as permanent and error out immediately',
          'Back off exponentially with jitter, retry a bounded number of times, honor Retry-After — 503 is transient by meaning',
          'Switch to GET requests',
        ],
        x: 2,
        w: '5xx/429 signal "try later"; tight-loop retries amplify the outage (and 429 means you specifically are the problem). Bounded exponential backoff with jitter is the standard — you built it today.',
        revisit: 41,
      },
    ],
    resources: [
      { label: 'MDN — An overview of HTTP', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview', type: 'docs', time: '20 min' },
      { label: 'FastAPI — official tutorial (first steps through body validation)', url: 'https://fastapi.tiangolo.com/tutorial/', type: 'docs', time: '30 min' },
      { label: 'httpx — official documentation (quickstart)', url: 'https://www.python-httpx.org/', type: 'docs', time: '15 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: due cards (async, GIL, semaphores)', minutes: 10 },
      { activity: 'ELI5 + tech read; trace one request through the http-cycle visualizer', minutes: 18 },
      { activity: 'Guided: build the counter, then be the customer', minutes: 42 },
      { activity: 'Practice: the resilient client', minutes: 20 },
      { activity: 'Project: quotes API + client', minutes: 20 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'Books API serving with /docs explored; DELETE route added and verified',
      'Client handles 404 and validation-failure branches without crashing',
      'Resilient wrapper survives 50 flaky calls with logged backoff',
      'Quotes API + client committed with correct status codes throughout',
      'Quiz ≥ 2/3',
    ],
    connections: {
      back: 'Handlers run on Day 40\'s event loop (its cardinal sin now a serving outage); pydantic models are Day 10\'s dataclasses with Day 36\'s contract enforcement; the JSON bodies are Day 5\'s serialization on the wire.',
      forward: 'Tomorrow this API gains a real database and TestClient tests. Day 43 opens the network layers beneath it, Day 44 adds auth, Day 45 hardens the architecture — and Day 106\'s LLM calls are exactly today\'s httpx POSTs with an Authorization header.',
    },
    flashcards: [
      { f: 'Status tiers in one line?', b: '2xx success, 3xx redirect, 4xx caller\'s mistake (400/401/403/404/422/429), 5xx server\'s mistake (500/502/503).' },
      { f: 'Idempotent methods and why retries care?', b: 'GET/PUT/DELETE — repeating lands in the same state, so auto-retry is safe. POST is not: duplicate risk.' },
      { f: 'What does pydantic give a FastAPI route?', b: 'Body parsing + validation from type hints; failures become 422 with field-level errors before your code runs.' },
      { f: 'Why set timeout= on every httpx call?', b: 'Default patience is infinite; a hung upstream hangs you. Timeouts convert hangs into handleable errors.' },
      { f: 'Correct client reaction to 429?', b: 'Back off (exponential + jitter), honor Retry-After, bound the retries — never tight-loop.' },
      { f: 'Where do FastAPI query params come from?', b: 'Typed function parameters not present in the path — with defaults, conversion, and validation for free.' },
    ],
    deepDive: [
      { label: 'FastAPI — async def vs def routes', url: 'https://fastapi.tiangolo.com/tutorial/', note: 'Read how FastAPI runs plain-def handlers in a threadpool but async handlers on the loop — then connect it to yesterday\'s blocking-call sin and decide which your DB calls need tomorrow.' },
    ],
  },
  {
    id: 'd042', day: 42, week: 6, phase: 2, kind: 'review',
    title: 'Week 6 Checkpoint: API + DB Mini-Service',
    analogy: 'The first backend',
    objectives: [
      'Retrieve Week 6\'s systems concepts (SQL, indexes, processes, async, HTTP) from memory',
      'Build a FastAPI notes service backed by SQLite with full CRUD and validation',
      'Test every route and failure path with FastAPI\'s TestClient',
      'EXPLAIN the service\'s hottest query and add the index it needs',
      'Ship the week\'s work as one committed, tested, documented artifact',
    ],
    prereqs: [
      { day: 36, label: 'SQL I — tables & queries' },
      { day: 38, label: 'Database internals — indexes & transactions' },
      { day: 40, label: 'Concurrency & async' },
      { day: 41, label: 'HTTP & FastAPI' },
    ],
    eli5: `All week you toured a restaurant's stations: the pantry with its labeled, contracted shelves (SQL), the index cards that find any ingredient in seconds (B-trees), the hotel-manager kitchen keeping cooks out of each other's pots (OS), the one clever chef juggling simmering pans (async), and the counter where orders are taken in a strict verb-and-status protocol (HTTP). Today you open the restaurant. Small menu — a notes service: write a note, find your notes, edit, delete — but every station wired together and actually serving.

This "boring CRUD app" is secretly the most-built object in software, and building it end-to-end forces the connections the week only implied: the request's JSON becomes a parameter-bound INSERT; the search endpoint becomes a WHERE that needs one of Day 38's indexes; the status code you return IS the contract with your caller. And because it is a review day, you build some of it with the book closed first — recalling the LEFT-join idiom or the 422-vs-404 decision from memory is today's spaced-repetition workout, hidden inside shipping something real.`,
    why: `"Build a small CRUD API against a database, with tests" is a literal take-home interview task at many companies — today is a dress rehearsal with a rubric. It is also the load-bearing skeleton of your future: Day 45 hardens exactly this service with auth and layers, Day 49's URL shortener re-runs the pattern under design constraints, and the capstone's serving layer (Day 119 onward) is this shape with retrieval inside. The TestClient habit you start today — testing the API contract, not the implementation — is what makes every later refactor (Day 45's, Day 148's containerization) safe.`,
    tech: `### The architecture of tiny-but-real

Three layers even at this size: **routes** (FastAPI handlers: HTTP in, HTTP out, no SQL), a thin **data layer** (functions that own all sqlite3 calls), and the **schema** (pydantic models at the door, CREATE TABLE contract behind). Keeping SQL out of handlers is not ceremony — it is what lets Day 45 swap storage and add services without touching routes, and what makes handlers readable in review.

### SQLite meets a server

Two production-flavored details. Connection handling: sqlite3 connections default to one-thread-only, and FastAPI's plain-def handlers run in a threadpool (Day 40) — the simplest correct pattern here is a fresh connection per request (cheap for an embedded DB) via a FastAPI **dependency** (\`Depends\`), which also makes tests trivially able to substitute a temporary database. Durability: writes happen inside \`with conn:\` transactions (Day 38), so a crash mid-update never half-writes a note.

### Testing an API without a network

\`fastapi.testclient.TestClient(app)\` drives your app in-process with the httpx interface — no server, no port, just \`client.post("/notes", json=…)\` returning real responses. Test the CONTRACT: happy paths (201 + echoed resource, 200 + list), failure paths (404 on missing id, 422 on invalid body), and behavior (search actually filters; delete actually deletes — verify with a follow-up GET). Use a pytest **fixture** (Day 19) to give each test a fresh temp-file database: isolation means no test order dependencies, ever.

### The performance ritual

Before shipping: seed realistically (thousands of notes), \`EXPLAIN QUERY PLAN\` the hottest query (search by tag or owner), read SCAN, add the index, read SEARCH, and record before/after timings in the README. Thirty seconds of ritual, and it is the exact motion you will perform on real customer databases as an FDE.`,
    viz: null,
    guided: [
      {
        title: 'Closed-book recall: wire the week together',
        minutes: 18,
        body: `Editor closed for each item; open only to check. Log misses in your error log with causes.

1. On paper, write the CREATE TABLE for notes (id, title, body, tag, created_at) with two constraints from memory, and the parameter-bound INSERT for it. Check against Day 36's rules — did you remember the ? placeholders and a CHECK?
2. On paper: the anti-join that finds tags never used by any note (two-table version), and where an index belongs if searches filter by tag. Check against Days 37–38.
3. Out loud, 60 seconds each: why a blocking call in an async handler freezes ALL requests (Day 40); what SIGTERM should make your uvicorn process do (Day 39); why DELETE returning 204 twice in a row is fine but POST retries are not (Day 41).
4. Run the week's flashcard deck. Under 80% → schedule the weak day's re-read before Day 43.`,
      },
      {
        title: 'Build milestone 1 — service + storage',
        minutes: 35,
        body: `Build \`notes_service/\` in your practice repo: \`app.py\`, \`db.py\`, \`test_app.py\`. Milestones, each verified before moving on:

1. \`db.py\`: \`init_db(path)\` creates the notes table (constraints from your recall drill — now checked); \`get_conn\` dependency yields a per-request connection; CRUD functions (\`create_note\`, \`list_notes\` with optional tag filter + limit/offset, \`get_note\`, \`update_note\`, \`delete_note\`) — all SQL lives here, all writes inside \`with conn:\`.
2. \`app.py\`: pydantic \`NoteIn\` (title 1–120 chars, body non-empty, optional tag) and routes: POST /notes → 201, GET /notes?tag=&limit=&offset=, GET /notes/{id} → 200/404, PUT /notes/{id} → 200/404, DELETE /notes/{id} → 204/404. Handlers call db.py functions only — no SQL in routes.
3. Run with uvicorn; create, search, update, and delete notes through /docs. Watch the request log tell the story.
4. Commit at this milestone before testing begins — working service, then safety net, two commits.`,
        code: `# db.py -- the only file that speaks SQL
import sqlite3

def init_db(path="notes.db"):
    conn = sqlite3.connect(path)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS notes (
            id         INTEGER PRIMARY KEY,
            title      TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 120),
            body       TEXT NOT NULL CHECK (length(body) > 0),
            tag        TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
    """)
    conn.commit()
    conn.close()

def create_note(conn, title, body, tag):
    with conn:                                    # atomic write
        cur = conn.execute(
            "INSERT INTO notes (title, body, tag) VALUES (?, ?, ?)",
            (title, body, tag),
        )
    return get_note(conn, cur.lastrowid)

def list_notes(conn, tag=None, limit=20, offset=0):
    sql, params = "SELECT * FROM notes", []
    if tag:
        sql += " WHERE tag = ?"
        params.append(tag)
    sql += " ORDER BY id DESC LIMIT ? OFFSET ?"
    params += [limit, offset]
    cols = ["id", "title", "body", "tag", "created_at"]
    return [dict(zip(cols, row)) for row in conn.execute(sql, params)]

def get_note(conn, note_id):
    row = conn.execute("SELECT * FROM notes WHERE id = ?", (note_id,)).fetchone()
    if row is None:
        return None
    cols = ["id", "title", "body", "tag", "created_at"]
    return dict(zip(cols, row))

def delete_note(conn, note_id):
    with conn:
        cur = conn.execute("DELETE FROM notes WHERE id = ?", (note_id,))
    return cur.rowcount > 0`,
      },
    ],
    practice: [
      {
        title: 'Build milestone 2 — the safety net and the index ritual',
        minutes: 35,
        body: `1. \`test_app.py\` with a fixture giving each test a TestClient wired to a fresh tmp_path database (override the get_conn dependency — look up app.dependency_overrides). Write the contract tests: create→201 with echoed fields; get missing→404; invalid body (empty title, 200-char title)→422; tag filter returns only matching; pagination slices correctly; update changes what it should; delete→204 then get→404; delete again→404. Aim for every route's happy AND failure path — about 10 tests.
2. Run pytest until green. Any bug you fix: add the regression test first (Day 19's habit).
3. The index ritual: seed 5,000 notes across 20 tags (script or fixture), EXPLAIN QUERY PLAN the tag search (SCAN), CREATE INDEX on tag, re-EXPLAIN (SEARCH), and record both plans plus timings in the README.
4. Commit. Two commits minimum today: service, then tests+index.

No hints beyond the milestones — the week taught every piece. Struggle first; your toolkit files second.`,
      },
    ],
    project: {
      title: 'Ship it: the Week 6 artifact',
      brief: `Finish the notes service as a portfolio-grade mini-repo: working CRUD API (SQL confined to db.py), ~10 passing TestClient tests covering all routes' happy and failure paths, the tag index justified by recorded EXPLAIN plans, and a README containing: how to run (venv, uvicorn, pytest), the API table (route, method, statuses), your index before/after evidence, and a five-line "what I'd harden next" list (auth? rate limits? — foreshadowing Days 44–45). Update your error log with today's recall misses. This repo is the direct ancestor of Day 45's hardened service and Day 49's URL shortener.`,
      rubric: [
        'All CRUD routes return specified statuses, verified by tests (not manually)',
        'Test suite ≥ 10 tests, isolated via fresh-database fixture, all green in one pytest run',
        'SQL exists only in db.py; handlers contain zero query strings',
        'EXPLAIN plans before/after the tag index recorded in the README with timings',
        'README complete enough that a stranger could run service and tests in 5 minutes',
        'Two+ commits with meaningful messages; error log updated',
      ],
    },
    mistakes: [
      'Testing by clicking /docs instead of writing TestClient tests. Manual checks vanish; the suite re-verifies the whole contract in seconds forever — and take-home graders read tests first.',
      'Sharing one module-level sqlite3 connection across threaded requests — sqlite3 objects default to single-thread use and will raise (or corrupt ordering). Per-request connections via a dependency.',
      'Letting tests share a database. Test A\'s leftover notes break test B only when order shifts — the classic flaky suite. Fresh tmp_path DB per test, via fixture.',
      'Skipping the 404/422/204 failure-path tests because "the happy path works." The failure contract IS half your API; it is also where regressions hide.',
      'Writing UPDATE without checking rowcount — updating a missing id "succeeds" silently and returns 200 for a note that does not exist. rowcount 0 → 404.',
      'Indexing before EXPLAINing (or after guessing). The ritual is: read the plan, see SCAN, add the index the plan needs, confirm SEARCH. Evidence, then action.',
    ],
    quiz: [
      {
        q: 'Your tag-search endpoint is slow with 50k notes. EXPLAIN QUERY PLAN says "SCAN notes". The fix and the proof?',
        o: [
          'Add more uvicorn workers',
          'CREATE INDEX ON notes(tag); re-EXPLAIN expecting SEARCH … USING INDEX, and re-time the query',
          'Switch to async handlers',
          'Cache everything',
        ],
        x: 1,
        w: 'SCAN means every row is read per request (Day 38). The filtered column gets the index; the plan flipping to SEARCH is the proof, the timing drop is the payoff. Workers and async do not fix an O(n) query.',
        revisit: 38,
      },
      {
        q: 'PUT /notes/9999 (nonexistent) runs an UPDATE that matches zero rows. Correct API behavior?',
        o: [
          '200 — the UPDATE executed without error',
          'Check cur.rowcount; zero rows matched means the resource does not exist → 404',
          '422 — the body must be invalid',
          '500 — something went wrong',
        ],
        x: 1,
        w: 'SQL happily updates zero rows. The HTTP contract (Day 41) is about resources: no resource, 404 — regardless of whether the SQL "succeeded". rowcount is the bridge between the two layers.',
        revisit: 41,
      },
      {
        q: 'Why must each test get a fresh database via fixture instead of sharing notes.db?',
        o: [
          'SQLite cannot handle multiple tests',
          'Shared state couples tests: one test\'s leftover rows change another\'s results depending on execution order — isolation makes every test deterministic alone',
          'Fixtures make tests run faster',
          'pytest requires it',
        ],
        x: 1,
        w: 'Test pollution is the root of flaky suites (Day 19). A tmp_path DB per test means any test can run alone, in any order, forever — the property that keeps refactors safe.',
        revisit: 42,
      },
    ],
    resources: [
      { label: 'FastAPI — Testing (official tutorial)', url: 'https://fastapi.tiangolo.com/tutorial/testing/', type: 'docs', time: '20 min' },
      { label: 'sqlite3 — official Python docs (transactions & placeholders refresher)', url: 'https://docs.python.org/3/library/sqlite3.html', type: 'docs', time: '10 min' },
      { label: 'pytest — fixtures documentation', url: 'https://docs.pytest.org/en/stable/', type: 'docs', time: '15 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep: full Week 6 deck, fumbles logged', minutes: 12 },
      { activity: 'Closed-book recall drills (schema, joins, async, HTTP)', minutes: 18 },
      { activity: 'Build milestone 1: service + storage, first commit', minutes: 35 },
      { activity: 'Build milestone 2: tests + index ritual, second commit', minutes: 35 },
      { activity: 'README, error log update, cumulative quiz', minutes: 15 },
    ],
    completion: [
      'Recall drills done closed-book; misses logged with causes',
      'Service runs; all routes behave per the API table',
      'pytest suite ≥ 10 tests, green, isolated by fixture',
      'Index evidence (plans + timings) in the README; two+ commits pushed',
      'Cumulative quiz ≥ 2/3',
    ],
    connections: {
      back: 'Today compiled the whole week into one artifact: Day 36–37\'s SQL behind Day 41\'s routes, Day 38\'s EXPLAIN ritual on Day 40\'s threadpool-served handlers, tested with Day 18–19\'s pytest discipline, shipped with Day 20\'s git habits.',
      forward: 'Day 45 hardens exactly this service (auth, layers, middleware); Day 49\'s URL shortener re-runs the build under design constraints; Day 148 containerizes it; and the capstone\'s API layer (Day 119+) is this skeleton with retrieval and citations inside.',
    },
    flashcards: [
      { f: 'Why confine SQL to db.py?', b: 'Routes stay HTTP-only; storage can change (Day 45) without touching handlers; each layer testable alone.' },
      { f: 'TestClient tests what, exactly?', b: 'The API contract in-process: statuses, bodies, failure paths — no server or network needed.' },
      { f: 'Per-test database isolation — how and why?', b: 'Fixture + tmp_path + dependency override; kills order-dependent flakiness permanently.' },
      { f: 'UPDATE matched zero rows — what should the API do?', b: 'cur.rowcount == 0 → 404: the resource does not exist, whatever SQL says.' },
      { f: 'The index ritual before shipping?', b: 'Seed realistically → EXPLAIN (see SCAN) → CREATE INDEX → re-EXPLAIN (see SEARCH) → record timings.' },
      { f: 'sqlite3 + threaded handlers — the safe simple pattern?', b: 'A connection per request via a FastAPI dependency; writes inside with conn: transactions.' },
    ],
    deepDive: [
      { label: 'Preview: dependency injection as architecture', url: 'https://fastapi.tiangolo.com/tutorial/', note: 'Your get_conn dependency is a first taste of DI — Day 45 generalizes it into the routes/services/repos layering. Skim FastAPI\'s Dependencies chapter with that lens.' },
    ],
  },
];
