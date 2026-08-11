// Days 85–98 — Phase 5, Weeks 13–14: Neural networks from scratch, PyTorch,
// MNIST, embeddings, attention, the transformer, tokenization, and a tiny GPT.
// Schema per docs/authoring-guide.md.
export const DAYS_085_098 = [
  {
    id: 'd085', day: 85, week: 13, phase: 5, kind: 'lesson',
    title: 'Neurons & Forward Pass',
    analogy: 'Layers of dials',
    objectives: [
      'Compute a neuron\'s output by hand: weighted sum, bias, nonlinearity',
      'Explain why stacking linear layers without nonlinearities collapses to one linear layer',
      'Implement a full forward pass for a 2-2-1 network in pure NumPy and verify it against hand math',
      'Count the parameters of any dense network from its layer sizes',
      'Describe how depth lets a network bend decision boundaries that a line cannot',
    ],
    prereqs: [
      { day: 51, label: 'Matrices as transformations' },
      { day: 53, label: 'Derivatives & gradients' },
      { day: 64, label: 'NumPy vectorization & broadcasting' },
      { day: 72, label: 'Logistic regression & sigmoid' },
    ],
    eli5: `Picture a sound engineer's mixing desk: rows and rows of dials. Each dial takes one incoming signal and decides how loudly it contributes to the mix — turn it up, turn it down, or flip it negative to subtract. One "neuron" is exactly one channel strip: it takes all its inputs, scales each by its own dial (a weight), adds a base level (the bias), and then runs the sum through a gate that only lets strong signals pass (the activation function). A layer is a whole row of these channel strips listening to the same inputs; a network is several rows chained, so each row remixes the mix of the row before.

Here is the trick that makes it more than a fancy mixer: the gate between rows is *nonlinear*. Without it, ten rows of dials would collapse into one big row — mixing a mix is still just a mix. With the gates, each layer can carve, fold, and bend the signal, and stacked bends can trace shapes no single straight cut ever could. Today you turn every dial by hand once, so the machinery is never mystical again.`,
    why: `Every model you will touch from here to Day 180 — MNIST classifiers, word2vec, GPT, the embedding models behind your Day-115 vector database — is layers of weighted sums and nonlinearities. When a customer asks "but what is the model actually doing?", the FDE who can sketch a neuron on a whiteboard in ninety seconds owns the room. And when a PyTorch shape error explodes on Day 87, you will debug it by replaying today's matrix dimensions in your head: (batch, in) times (in, out) or nothing works.`,
    tech: `A neuron computes z = w·x + b, then a = g(z), where g is a nonlinear activation. That is the whole unit: a dot product (Day 50), a shift, a squash.

### Layers are matrix multiplies

A layer of m neurons over n inputs is a weight matrix W of shape (m, n) and a bias vector b of length m: z = Wx + b, a = g(z), computed for all m neurons at once. This is why Day 51 mattered — a linear layer IS a matrix transformation, and why GPUs (matmul machines) run these models. Batching stacks inputs into X of shape (batch, n) and computes A = g(XWᵀ + b) in one shot; NumPy broadcasting adds b to every row.

### Activations: the ladder you will actually meet

- **sigmoid** — squashes to (0, 1); historically everywhere, now mostly an output layer for binary probability (Day 72 payoff). Saturates: near 0 or 1 its slope is ~0, which will haunt gradients tomorrow.
- **tanh** — squashes to (−1, 1), zero-centered; still used in small nets and gates.
- **ReLU** — max(0, z). The workhorse: cheap, does not saturate for positive z, and its kink is exactly the nonlinearity the network needs.

Why nonlinearity is non-negotiable: composing linear maps yields a linear map — W₂(W₁x) = (W₂W₁)x. A 100-layer purely linear network can only ever draw a straight decision boundary, same as Day 71's regression. One hidden nonlinear layer already lets the network bend the boundary; with enough hidden units it can approximate any reasonable function (universal approximation — an existence claim, not a training guarantee).

### The forward pass, concretely

For a 2-2-1 network: hidden z₁ = W₁x + b₁ (shape 2), a₁ = ReLU(z₁), output y = w₂·a₁ + b₂. Parameter count: each dense layer has in·out weights + out biases, so 2-2-1 has (2·2+2) + (2·1+1) = 9 parameters. A 784-128-10 MNIST net (Day 90) has 784·128+128 + 128·10+10 = 101,770 — you should be able to produce that number on sight. Nothing is learned yet; today the dials are set by hand. Tomorrow you learn how blame for a wrong answer flows backwards to turn each one.`,
    viz: 'nn-forward',
    guided: [
      {
        title: 'One forward pass by hand, then let NumPy check you',
        minutes: 20,
        body: `1. Take input x = [1, 2] into a 2-2-1 net with ReLU on the hidden layer.
2. Hidden neuron 1: weights [1, -1], bias 0. Hidden neuron 2: weights [0.5, 1], bias -1. Output neuron: weights [2, 1], bias 0.5.
3. On paper: compute z1 = 1*1 + (-1)*2 + 0 = -1 and z2 = 0.5*1 + 1*2 - 1 = 1.5. Apply ReLU: a1 = 0, a2 = 1.5.
4. Output: y = 2*0 + 1*1.5 + 0.5 = 2.0. Every arrow in the network now has a number on it.
5. Run the starter code and confirm NumPy agrees with your paper. Then change ReLU to the identity function and recompute — note that the network becomes a single linear formula in x.`,
        code: `import numpy as np

def relu(z):
    return np.maximum(0, z)

x = np.array([1.0, 2.0])

W1 = np.array([[1.0, -1.0],    # hidden neuron 1's weights
               [0.5,  1.0]])   # hidden neuron 2's weights
b1 = np.array([0.0, -1.0])

w2 = np.array([2.0, 1.0])      # output neuron's weights
b2 = 0.5

z1 = W1 @ x + b1               # -> [-1.0, 1.5]
a1 = relu(z1)                  # -> [ 0.0, 1.5]
y  = w2 @ a1 + b2              # -> 2.0

print('z1 =', z1)
print('a1 =', a1)
print('y  =', y)               # must match your paper: 2.0`,
      },
      {
        title: 'Watch the boundary bend',
        minutes: 20,
        body: `1. XOR is the classic function no straight line can separate: (0,0)->0, (1,1)->0, (0,1)->1, (1,0)->1.
2. Run the starter: it evaluates a hand-set 2-2-1 tanh network on a grid of points and prints an ASCII map of where the output is above 0.5.
3. Confirm the four XOR corners are classified correctly — the '#' region must cover (0,1) and (1,0) but not (0,0) or (1,1). A straight line cannot do that; two bent half-planes can.
4. Set the hidden activation to identity (linear) and rerun. The map degenerates into a single straight split and XOR breaks. Write one sentence: which ingredient did you just remove?`,
        code: `import numpy as np

# Hand-set weights that solve XOR with a 2-2-1 tanh network
W1 = np.array([[ 4.0,  4.0],
               [-4.0, -4.0]])
b1 = np.array([-2.0,  6.0])
w2 = np.array([ 4.0,  4.0])
b2 = -6.0

def forward(x, hidden=np.tanh):
    a1 = hidden(W1 @ x + b1)
    return 1 / (1 + np.exp(-(w2 @ a1 + b2)))   # sigmoid output

for x in [(0,0), (0,1), (1,0), (1,1)]:
    p = forward(np.array(x, dtype=float))
    print(x, '->', round(float(p), 3))

# ASCII decision map over [0,1] x [0,1]
for i in range(10, -1, -1):
    row = ''
    for j in range(11):
        p = forward(np.array([j/10, i/10]))
        row += '#' if p > 0.5 else '.'
    print(row)`,
      },
    ],
    practice: [
      {
        title: 'A forward pass for any architecture',
        minutes: 20,
        body: `Write \`forward(x, layers)\` where \`layers\` is a list of (W, b) tuples, applying ReLU between layers but not after the last. It must work for ANY chain of compatible shapes — 2-2-1, 4-8-8-3, whatever. Then write \`count_params(layers)\` and verify it gives 9 for the 2-2-1 net and 101,770 for 784-128-10 (create the matrices with \`np.random.randn\` at the right shapes).

Constraints: no loops over individual neurons — matrix operations only; handle a batch X of shape (batch, n_in) as well as a single vector.

Hints (only if stuck): store W as (out, in) and compute X @ W.T + b for batches; parameter count per layer is W.size + b.size.`,
      },
    ],
    project: {
      title: 'Your forward-pass library, v0',
      brief: `Create \`nn_forward.py\` in your practice repo: a \`Layer\` class holding W and b (initialized with \`np.random.randn(out, in) * 0.1\`), a \`forward\` method, and an \`MLP\` class chaining layers with ReLU. Include a \`__main__\` block that (a) reproduces the hand-computed 2-2-1 example exactly by setting the weights manually, (b) prints the parameter count for 784-128-10, and (c) prints the XOR ASCII map from guided exercise 2. This file is not throwaway — Day 86 adds gradients to it, and Day 87 rebuilds it in PyTorch to show what you earned.`,
      rubric: [
        'Layer and MLP classes run for arbitrary compatible layer sizes',
        'Hand-set 2-2-1 example prints exactly y = 2.0',
        'count of 101,770 parameters reproduced for 784-128-10',
        'XOR map correct with tanh/ReLU and visibly broken with identity activation',
        'Handles both a single vector and a (batch, n) matrix input',
        'Committed with a message describing the forward-pass contract',
      ],
    },
    mistakes: [
      'Thinking the activation is optional polish. Without it the whole stack collapses to one linear map — depth buys you literally nothing.',
      'Confusing weight shape conventions. If W is (out, in), a vector goes through as W @ x but a batch goes through as X @ W.T. Mixing these is the #1 shape bug on Day 87.',
      'Forgetting the bias. Without b every layer\'s output must pass through the origin; the XOR solution above is impossible.',
      'Believing "universal approximation" means any net trains easily. It says a wide-enough net CAN represent the function, not that gradient descent will find it.',
      'Counting parameters as just weights. Each layer adds out_features biases too — interviewers check.',
      'Treating sigmoid as the default hidden activation. It saturates; modern default is ReLU in hidden layers, sigmoid/softmax only at the output when you need probabilities.',
    ],
    quiz: [
      {
        q: 'A 10-layer network uses no activation functions anywhere. What can it represent?',
        o: [
          'Anything, given enough layers',
          'Exactly what a single linear layer can — the composition collapses',
          'Any smooth function but not discontinuous ones',
          'Nothing useful at all',
        ],
        x: 1,
        w: 'Composing linear maps gives a linear map: W2(W1 x) = (W2 W1) x. Ten linear layers equal one. The nonlinearity between layers is what makes depth count.',
        revisit: 85,
      },
      {
        q: 'How many parameters does a dense 3-4-2 network have (weights + biases)?',
        o: ['20', '24', '26', '30'],
        x: 2,
        w: 'Layer 1: 3·4 weights + 4 biases = 16. Layer 2: 4·2 weights + 2 biases = 10. Total 26. Per layer: in·out + out.',
        revisit: 85,
      },
      {
        q: 'Hidden pre-activations come out as z = [-2.0, 0.0, 3.5]. After ReLU, the activations are…',
        o: ['[-2.0, 0.0, 3.5]', '[0.0, 0.0, 3.5]', '[2.0, 0.0, 3.5]', '[0.12, 0.5, 0.97]'],
        x: 1,
        w: 'ReLU is max(0, z) elementwise: negatives become 0, non-negatives pass through unchanged. The last option is what a sigmoid would do.',
        revisit: 85,
      },
    ],
    resources: [
      { label: '3Blue1Brown — But what is a neural network? (ch. 1 of the NN playlist)', url: 'https://www.youtube.com/playlist?list=PLZHQObOWTQDNU6R1_67000Dx_ZCJB-3pi', type: 'video', time: '20 min' },
      { label: 'NumPy — the absolute basics (broadcasting refresher)', url: 'https://numpy.org/doc/stable/user/absolute_beginners.html', type: 'docs', time: '15 min' },
      { label: 'Dive into Deep Learning — multilayer perceptrons', url: 'https://d2l.ai/', type: 'book', time: '25 min' },
      { label: 'Karpathy — Neural Networks: Zero to Hero (course hub for this fortnight)', url: 'https://karpathy.ai/zero-to-hero.html', type: 'course', time: '5 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: due cards from Weeks 11–12', minutes: 10 },
      { activity: 'ELI5 + tech read; watch 3B1B chapter 1; study the nn-forward visualizer', minutes: 25 },
      { activity: 'Guided: hand-computed forward pass + XOR boundary', minutes: 40 },
      { activity: 'Practice: generic forward + parameter counting', minutes: 20 },
      { activity: 'Project: nn_forward.py committed', minutes: 15 },
      { activity: 'Quiz + write flashcards', minutes: 10 },
    ],
    completion: [
      'Hand computation matches NumPy on the 2-2-1 example (y = 2.0)',
      'XOR boundary demo run with nonlinear AND linear activation, difference explained in one sentence',
      'nn_forward.py committed with all three __main__ demos passing',
      'Quiz ≥ 2/3',
    ],
    connections: {
      back: 'A layer is Day 51\'s matrix transformation wearing a new hat, the dot product inside each neuron is Day 50\'s alignment score, and the sigmoid output is Day 72\'s logistic regression — a neural net\'s last layer IS logistic regression on learned features.',
      forward: 'Tomorrow (Day 86) blame flows backwards through exactly the graph you built today. Day 87 rebuilds it in PyTorch, Day 90 scales it to MNIST, and Day 94\'s attention scores are the same dot products with a starring role.',
    },
    flashcards: [
      { f: 'One neuron, one formula?', b: 'a = g(w·x + b) — weighted sum, add bias, nonlinear activation g.' },
      { f: 'Why are nonlinear activations mandatory?', b: 'Linear compositions collapse: W2(W1x) = (W2W1)x. Without g, any depth equals one linear layer.' },
      { f: 'Parameter count of a dense layer in→out?', b: 'in·out weights + out biases.' },
      { f: 'ReLU definition and its selling points?', b: 'max(0, z). Cheap, non-saturating for z>0; the modern default hidden activation.' },
      { f: 'Batch forward pass in one line (W stored out×in)?', b: 'A = g(X @ W.T + b), broadcasting b across the batch rows.' },
      { f: 'What does universal approximation actually promise?', b: 'A wide-enough net CAN represent the function. It says nothing about training finding it.' },
    ],
    deepDive: [
      { label: 'Why initialization scale matters', note: 'Multiply randn weights by 1.0 instead of 0.1 in a 10-layer net and print activation magnitudes per layer — they explode. This foreshadows Day 89\'s training-stability toolkit.' },
    ],
  },
  {
    id: 'd086', day: 86, week: 13, phase: 5, kind: 'lesson',
    title: 'Backpropagation from Scratch',
    analogy: 'Blame flows backwards',
    objectives: [
      'Explain backprop as the chain rule applied over a computational graph, node by node',
      'Derive the local gradient rules for +, ×, and tanh and apply them by hand',
      'Build a complete micrograd-style scalar autograd engine in ~60 lines of pure Python',
      'Verify analytic gradients against numerical gradients (gradient checking)',
      'Train a tiny neuron with your own engine and watch the loss fall',
    ],
    prereqs: [
      { day: 54, label: 'Chain rule & computational graphs' },
      { day: 55, label: 'Gradient descent lab' },
      { day: 85, label: 'Neurons & the forward pass' },
    ],
    eli5: `A restaurant serves a bad dish and the review comes in: 2 stars. Who gets the blame? The head chef doesn't yell at everyone equally — blame flows backwards along the assembly line. The plating station passes most of the blame to the sauce station ("the dish was fine until the sauce"), the sauce station splits it between the salt and the cream, and by the end every single station knows exactly how much IT contributed to the bad review — and, crucially, in which direction to adjust. Too much salt gets "use less"; undercooked base gets "cook longer."

Backpropagation is precisely this blame audit, run on the network you built yesterday. The loss is the bad review. Each operation in the forward pass (every add, every multiply, every tanh) knows its own tiny local rule for passing blame to its inputs. Chain those local rules from the loss backwards to every weight and you get, for each dial on the mixing desk, a number: "turn me this way, this much, and the review improves." Gradient descent (Day 55) then turns every dial a little. Repeat ten thousand times and the network has learned. Today you build the blame-routing machinery yourself, in sixty lines of Python, and it is the same machinery inside PyTorch.`,
    why: `"Just use autograd" is fine until a gradient silently becomes zero, a loss plateaus, or a customer asks why fine-tuning diverges — then the engineers who understand blame-flow debug in minutes while others tweak randomly for days. This lesson is also the single highest-leverage interview topic in deep learning: "explain backprop" appears in nearly every ML-adjacent loop, and having WRITTEN one beats having read about one. Day 87's PyTorch will feel like a familiar machine with a nicer case, because you built the engine.`,
    tech: `### The graph and the two passes

Every computation is a directed acyclic graph: leaves are inputs and weights, internal nodes are operations, the root is the loss L. The forward pass computes values left to right. The backward pass computes dL/dnode for every node, right to left, starting from dL/dL = 1.

Each operation only needs its LOCAL derivative; the chain rule (Day 54) glues them:

- **Addition** c = a + b: dc/da = 1, dc/db = 1. Addition is a blame *router* — it passes the incoming gradient through unchanged to both inputs.
- **Multiplication** c = a·b: dc/da = b, dc/db = a. Each input's blame is scaled by the OTHER input's value — which is why a weight's gradient is proportional to its input's activation, and a zero activation means zero learning for that weight.
- **tanh** a = tanh(z): da/dz = 1 − a². Near saturation (a ≈ ±1) this is ~0: blame dies at saturated units. This is the vanishing-gradient seed.

So the rule at every node: grad_input += local_derivative × grad_output. The += matters — if a value feeds two downstream paths, blame arrives from both and must accumulate.

### The engine

A micrograd-style engine wraps every number in a \`Value\` object recording (data, children, local backward function). Operators build the graph as a side effect of ordinary arithmetic. \`backward()\` topologically sorts the graph, seeds the root gradient with 1.0, and calls each node's \`_backward\` in reverse topological order — guaranteeing every node's output gradient is complete before its own rule fires.

### Gradient checking — trust, then verify

The numerical gradient (f(w + h) − f(w − h)) / 2h with h ≈ 1e-6 approximates the true derivative with no calculus. It is too slow for training (one forward pass per parameter per step) but perfect for testing: if analytic and numerical disagree beyond ~1e-4 relative error, your backward rule is wrong. Every serious framework was validated this way, and on Day 91 you will re-derive this whole page from memory.`,
    viz: 'backprop-flow',
    guided: [
      {
        title: 'Build the Value engine (the whole thing)',
        minutes: 25,
        body: `1. Create \`micrograd_mine.py\` (or a browser Python cell) and type — do not paste — the Value class below. Typing it is the lesson.
2. Reproduce this tiny graph: a = Value(2.0), b = Value(-3.0), c = Value(10.0), d = a*b + c, L = d * Value(-2.0).
3. Before calling backward, predict on paper: dL/dd = -2; dL/dc = -2 (addition routes); dL/da = b · dL/dd = -3 · -2 = 6; dL/db = a · dL/dd = 2 · -2 = -4.
4. Call L.backward() and confirm all four predictions.
5. Add a tanh to the chain and confirm blame shrinks by (1 - tanh²) at that node.`,
        code: `import math

class Value:
    """A scalar with a gradient, recording the graph that produced it."""

    def __init__(self, data, _children=()):
        self.data = data
        self.grad = 0.0
        self._backward = lambda: None
        self._prev = set(_children)

    def __add__(self, other):
        other = other if isinstance(other, Value) else Value(other)
        out = Value(self.data + other.data, (self, other))
        def _backward():
            self.grad  += 1.0 * out.grad   # addition routes blame through
            other.grad += 1.0 * out.grad
        out._backward = _backward
        return out

    def __mul__(self, other):
        other = other if isinstance(other, Value) else Value(other)
        out = Value(self.data * other.data, (self, other))
        def _backward():
            self.grad  += other.data * out.grad  # scaled by the OTHER input
            other.grad += self.data * out.grad
        out._backward = _backward
        return out

    def tanh(self):
        t = math.tanh(self.data)
        out = Value(t, (self,))
        def _backward():
            self.grad += (1 - t * t) * out.grad  # dies near saturation
        out._backward = _backward
        return out

    def __neg__(self): return self * -1
    def __sub__(self, other): return self + (-other)
    def __radd__(self, other): return self + other
    def __rmul__(self, other): return self * other

    def backward(self):
        topo, visited = [], set()
        def build(v):
            if v not in visited:
                visited.add(v)
                for child in v._prev:
                    build(child)
                topo.append(v)
        build(self)
        self.grad = 1.0                      # dL/dL = 1
        for node in reversed(topo):
            node._backward()

a = Value(2.0); b = Value(-3.0); c = Value(10.0)
d = a * b + c
L = d * Value(-2.0)
L.backward()
print('dL/dd =', d.grad, ' dL/dc =', c.grad)   # -2, -2
print('dL/da =', a.grad, ' dL/db =', b.grad)   # 6, -4`,
      },
      {
        title: 'Gradient-check your engine',
        minutes: 15,
        body: `1. Write \`numerical_grad(f, x, h=1e-6)\` returning (f(x+h) - f(x-h)) / (2*h) for a plain-float function f.
2. Check dL/da from exercise 1: define f(a_val) that rebuilds the whole expression with a = Value(a_val) and returns L.data. Compare against a.grad = 6.
3. Repeat for b and c. All three must agree to ~1e-6.
4. Now sabotage the engine: change addition's backward rule to route 0.5 instead of 1.0 and rerun the check. Watch the checker catch the bug — this is exactly how framework authors test autograd.
5. Restore the correct rule.`,
        code: `def numerical_grad(f, x, h=1e-6):
    return (f(x + h) - f(x - h)) / (2 * h)

def loss_given_a(a_val):
    a = Value(a_val); b = Value(-3.0); c = Value(10.0)
    return ((a * b + c) * Value(-2.0)).data

analytic = 6.0   # from exercise 1
numeric = numerical_grad(loss_given_a, 2.0)
print('numeric dL/da =', numeric)
assert abs(numeric - analytic) < 1e-4, 'gradient check FAILED'
print('gradient check passed')`,
      },
      {
        title: 'A neuron learns with your engine',
        minutes: 15,
        body: `1. Build one neuron from Value objects: two weights, one bias, tanh activation.
2. Training set: the four XOR-ish points below with targets in {-1, 1} (a single neuron can only fit the linearly separable subset — that is part of the lesson).
3. Loop 50 times: forward on all points, squared-error loss, zero all grads (set .grad = 0.0 on every parameter — forgetting this is THE classic bug), backward, then nudge each parameter by -0.1 * grad.
4. Print the loss every 10 steps. It must fall.
5. In one sentence: why must gradients be zeroed each step, given the += in your backward rules?`,
        code: `import random
random.seed(0)

w1 = Value(random.uniform(-1, 1))
w2 = Value(random.uniform(-1, 1))
b  = Value(0.0)
params = [w1, w2, b]

data = [((0.0, 0.0), -1.0), ((1.0, 0.0), 1.0),
        ((0.0, 1.0), 1.0), ((1.0, 1.0), 1.0)]  # OR-like: separable

for step in range(50):
    loss = Value(0.0)
    for (x1, x2), target in data:
        pred = (w1 * x1 + w2 * x2 + b).tanh()
        err = pred - target
        loss = loss + err * err
    for p in params:
        p.grad = 0.0            # zero_grad — grads ACCUMULATE otherwise
    loss.backward()
    for p in params:
        p.data -= 0.1 * p.grad  # gradient descent, Day 55
    if step % 10 == 0:
        print(f'step {step:2d}  loss {loss.data:.4f}')`,
      },
    ],
    practice: [
      {
        title: 'Extend the engine',
        minutes: 20,
        body: `Add two operations to your Value class: \`relu()\` and \`__pow__(self, k)\` for a constant float k (enough to write x**2 for losses). Then gradient-check both with your numerical checker on at least two input values each — including x = -1.5 for relu, where the gradient must be exactly 0.

Constraints: follow the same pattern (compute out, define _backward with +=, attach). No peeking at the micrograd repo until your checks pass.

Hints: d(relu)/dz is 1 if z > 0 else 0; d(x^k)/dx = k·x^(k-1). For relu at exactly 0, pick either convention — note which you chose and why it rarely matters in practice.`,
      },
    ],
    project: {
      title: 'micrograd_mine — your autograd engine, tested',
      brief: `Promote today's work into your practice repo as \`micrograd_mine.py\` plus \`test_micrograd.py\`: the Value class with add/mul/tanh/relu/pow/neg/sub, a \`Neuron\` class (weights, bias, tanh) built on it, and pytest tests that (a) reproduce the hand-derived gradients from guided 1, (b) gradient-check every operation numerically, and (c) assert the guided-3 training loop reaches loss < 0.1 in 50 steps with seed 0. This is the artifact Day 87 rebuilds in PyTorch and Day 91 asks you to re-derive from memory — invest in it.`,
      rubric: [
        'Engine supports add, mul, tanh, relu, pow, neg, sub with correct += accumulation',
        'backward() uses an explicit topological sort, not recursion luck',
        'All gradient checks pass within 1e-4 relative tolerance',
        'Training test reaches loss < 0.1 deterministically (seeded)',
        'Sabotage test exists: a deliberately wrong rule is caught by the checker',
        'Committed with tests green (pytest exit 0)',
      ],
    },
    mistakes: [
      'Using = instead of += when writing gradients. A value feeding two paths receives blame from both; overwriting silently drops one path and the bug is invisible on simple graphs.',
      'Forgetting to zero gradients between steps. Because backward accumulates, step 2 trains on step 1\'s gradients plus its own — loss jitters or explodes.',
      'Calling _backward in arbitrary order. A node\'s rule needs its COMPLETE output gradient first; that is what the reverse topological order guarantees.',
      'Believing backprop finds "the global answer". It computes exact gradients of the loss at the current point; where descent then leads is Day 55\'s non-convex reality.',
      'Confusing the numerical gradient\'s role: it is a TEST harness, not a training method — it costs one forward pass per parameter per step.',
      'Thinking tanh saturation is exotic trivia. A saturated unit (output near ±1) passes ~0 blame: whole layers can stop learning. Day 89\'s tricks exist for this.',
    ],
    quiz: [
      {
        q: 'In c = a · b with a = 2, b = -3, and dL/dc = 4, what is dL/da?',
        o: ['4', '8', '-12', '2'],
        x: 2,
        w: 'Multiplication scales blame by the other input: dL/da = b · dL/dc = -3 · 4 = -12.',
        revisit: 86,
      },
      {
        q: 'A Value feeds into two different downstream operations. Its gradient must be…',
        o: [
          'The gradient from whichever path is computed last',
          'The sum of the gradients arriving from both paths',
          'The average of the two path gradients',
          'Zero — branching breaks the chain rule',
        ],
        x: 1,
        w: 'The multivariate chain rule sums over all paths — which is exactly why every _backward rule uses += rather than =.',
        revisit: 54,
      },
      {
        q: 'Your analytic gradient says 0.5001 and the numerical gradient says 0.4999. The right conclusion is…',
        o: [
          'The engine has a bug — they must match exactly',
          'The engine is fine — numerical gradients carry small approximation error',
          'The learning rate is too high',
          'The graph has a cycle',
        ],
        x: 1,
        w: 'Central differences approximate the derivative to O(h²); tiny discrepancies are expected. A real bug shows up as a large relative error, like the sabotage test.',
        revisit: 86,
      },
    ],
    resources: [
      { label: 'Karpathy — The spelled-out intro to backpropagation: building micrograd', url: 'https://www.youtube.com/watch?v=VMj-3S1tku0', type: 'video', time: '2 h 25 min (watch through the Value class; finish across the week)' },
      { label: '3Blue1Brown — What is backpropagation really doing? (ch. 3–4)', url: 'https://www.youtube.com/playlist?list=PLZHQObOWTQDNU6R1_67000Dx_ZCJB-3pi', type: 'video', time: '25 min' },
      { label: 'Karpathy — Zero to Hero course page', url: 'https://karpathy.ai/zero-to-hero.html', type: 'course', time: '5 min' },
      { label: 'Deep Learning (Goodfellow) — ch. 6.5, Back-Propagation', url: 'https://www.deeplearningbook.org/', type: 'book', time: '25 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: Day 54 chain-rule cards + Day 85 recall', minutes: 10 },
      { activity: 'ELI5 + tech read; Karpathy micrograd video (first hour, 1.5x)', minutes: 30 },
      { activity: 'Guided: build the engine, gradient-check it, train a neuron', minutes: 55 },
      { activity: 'Practice: extend with relu and pow', minutes: 15 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'Value engine built BY TYPING and all four hand-predicted gradients confirmed',
      'Gradient checker passes on a, b, c and catches the sabotaged rule',
      'Neuron training loop reaches falling loss with grads zeroed each step',
      'micrograd_mine.py + tests committed, pytest green',
      'Quiz ≥ 2/3',
    ],
    connections: {
      back: 'This is Day 54\'s chain rule made executable and Day 55\'s gradient descent given its gradients; the graph you differentiate is exactly Day 85\'s forward pass.',
      forward: 'Day 87: PyTorch\'s autograd is this engine with tensors, C++ speed, and a thousand ops — you will rebuild today in 20 lines. Day 97\'s GPT trains by this exact mechanism, and "explain backprop from memory" is Day 91\'s centerpiece drill.',
    },
    flashcards: [
      { f: 'Local gradient rules for + and ×?', b: 'Add: route grad through unchanged to both inputs. Mul: scale grad by the OTHER input\'s value.' },
      { f: 'Why += (not =) in backward rules?', b: 'Multivariate chain rule: blame from all downstream paths sums. = drops paths silently.' },
      { f: 'Why zero grads every step?', b: 'Backward accumulates into .grad; without zeroing, each step trains on stale gradients too.' },
      { f: 'd(tanh)/dz in terms of the output a?', b: '1 − a². Near saturation (a ≈ ±1) it is ~0 — gradients vanish there.' },
      { f: 'What is gradient checking?', b: 'Compare analytic grads to (f(x+h)−f(x−h))/2h. A test harness for autograd, too slow for training.' },
      { f: 'Why reverse topological order in backward()?', b: 'A node\'s rule needs its complete output gradient before firing; reverse topo order guarantees it.' },
    ],
    deepDive: [
      { label: 'Read the real micrograd (karpathy/micrograd on GitHub)', note: 'Under 100 lines for the engine. Diff it against yours: the main additions are __pow__ generality and nn.py\'s Neuron/Layer/MLP classes — which you now understand completely.' },
    ],
  },
  {
    id: 'd087', day: 87, week: 13, phase: 5, kind: 'lesson',
    title: 'PyTorch — Tensors & Autograd',
    analogy: 'Autograd does your calculus',
    objectives: [
      'Create and manipulate tensors: shapes, dtypes, devices, and views',
      'Use requires_grad, backward(), and .grad to reproduce Day 86\'s gradients exactly',
      'Explain when and why to use torch.no_grad()',
      'Rebuild the Day-86 neuron as an nn.Module in ~20 lines',
      'Diagnose the three classic PyTorch error messages: shape mismatch, dtype mismatch, device mismatch',
    ],
    prereqs: [
      { day: 86, label: 'Backprop & the micrograd engine' },
      { day: 64, label: 'NumPy arrays & broadcasting' },
      { day: 85, label: 'Forward pass & layer shapes' },
    ],
    eli5: `Yesterday you built a hand-cranked calculator that routes blame backwards through a graph. It worked — and it was sixty lines you had to write, test, and maintain, and it only handled single numbers. PyTorch is that same machine rebuilt by a professional factory: it handles whole grids of numbers at once (tensors), runs on GPUs, ships a thousand pre-differentiated operations, and never forgets a backward rule. The crank is now a button labeled \`.backward()\`.

The mental model transfers one-to-one. A tensor with \`requires_grad=True\` is your Value object. Every operation you apply quietly records itself onto a graph, exactly like your \`_prev\` sets. Calling \`.backward()\` on the loss runs your topological sort and fills every parameter's \`.grad\` — same +=, same accumulation, same need to zero it. Nothing new is happening conceptually; you already built this. Today is about learning the factory's controls: how to make tensors, reshape them, keep them on the same device, and read the error messages the machine prints when you feed it mismatched parts.`,
    why: `PyTorch is the lingua franca of modern AI: research papers ship in it, Hugging Face models load into it, and your Day-97 GPT and Day-128 LoRA fine-tune are written in it. For an AI engineer the daily reality is less "invent architectures" and more "load a model, move tensors to the right device, and fix the shape error at 5 pm before the customer demo" — fluency in tensors and error messages IS the job skill. Understanding autograd from Day 86 means PyTorch is never magic to you, which is exactly the confidence that survives production incidents.`,
    tech: `Note: today's code runs locally (install with \`pip install torch\` — CPU is fine all week); it will not run in the browser sandbox.

### Tensors

A tensor is an n-dimensional array with a dtype (usually float32 — NumPy defaults to float64, a classic mismatch), a shape, and a device (cpu, cuda, or mps). Creation mirrors NumPy: \`torch.tensor\`, \`zeros\`, \`randn\`; \`torch.from_numpy\` shares memory. Shape surgery: \`.view\`/\`.reshape\`, \`.unsqueeze(dim)\` to add a dimension, \`.squeeze()\` to drop size-1 dims, \`.T\` to transpose. Broadcasting follows NumPy's rules (Day 64). The three errors you WILL meet: "mat1 and mat2 shapes cannot be multiplied (a×b and c×d)" — inner dims differ, print both shapes and fix the layer or the transpose; "expected scalar type Float but found Double" — a float64 NumPy array leaked in, add \`.float()\`; "Expected all tensors to be on the same device" — a tensor stayed on cpu while the model moved to gpu, add \`.to(device)\`.

### Autograd is your engine, industrialized

Set \`requires_grad=True\` on leaves; every op records a node; \`loss.backward()\` runs reverse-mode differentiation and ACCUMULATES into \`.grad\` — the same += you implemented, hence the same obligation to zero grads each step. \`with torch.no_grad():\` turns recording off — mandatory for parameter updates (updating a weight is not part of the loss graph) and for inference, where recording wastes memory. \`.detach()\` returns a tensor cut out of the graph; \`.item()\` extracts a Python number from a scalar tensor.

### nn.Module — the professional wrapper

Subclass \`nn.Module\`, define layers in \`__init__\` (\`nn.Linear(in, out)\` is Day 85's W and b, pre-initialized sensibly), compose them in \`forward\`. The module tracks every parameter via \`model.parameters()\`, which is what optimizers consume tomorrow. \`nn.Linear\` stores weight as (out, in) and computes x @ Wᵀ + b — exactly your Day-85 convention. One rule of hygiene: call \`model(x)\`, never \`model.forward(x)\` — the call goes through hooks that PyTorch's machinery relies on.`,
    viz: null,
    guided: [
      {
        title: 'Reproduce Day 86 in PyTorch — same graph, same numbers',
        minutes: 15,
        body: `1. (Local run.) Install PyTorch if needed: \`pip install torch\`. Verify with \`python -c "import torch; print(torch.__version__)"\`.
2. Rebuild yesterday's graph: a=2, b=-3, c=10, L = (a*b + c) * -2, with requires_grad on a, b, c.
3. Call L.backward() and print a.grad, b.grad, c.grad. They must be exactly 6, -4, -2 — your engine's answers.
4. Call L.backward() a second time (inside a fresh forward) WITHOUT zeroing and print a.grad again: 12. You are watching the same accumulation you implemented with +=.
5. Wrap a forward pass in \`with torch.no_grad():\` and confirm the result has requires_grad=False.`,
        code: `import torch

a = torch.tensor(2.0, requires_grad=True)
b = torch.tensor(-3.0, requires_grad=True)
c = torch.tensor(10.0, requires_grad=True)

L = (a * b + c) * -2
L.backward()
print(a.grad, b.grad, c.grad)   # tensor(6.) tensor(-4.) tensor(-2.)

# accumulation demo — rebuild the graph, backward again, no zeroing
L2 = (a * b + c) * -2
L2.backward()
print(a.grad)                    # tensor(12.) — grads ACCUMULATE

a.grad = None                    # how you zero a leaf by hand
with torch.no_grad():
    y = (a * b + c) * -2
print(y, y.requires_grad)        # no graph recorded`,
      },
      {
        title: 'The 20-line neuron, then the nn.Module version',
        minutes: 20,
        body: `1. Port guided exercise 3 from Day 86: one tanh neuron on the OR-like dataset, but with tensors. Weights are \`torch.randn(2, requires_grad=True)\`; the update loop uses \`torch.no_grad()\` around the parameter step and zeros grads with \`.grad = None\`.
2. Run it: loss must fall below 0.1 within 50 steps, just like yesterday.
3. Now the professional version in the starter: an \`nn.Module\` with one \`nn.Linear(2, 1)\`. Note what disappeared: manual weight creation, manual parameter listing.
4. Print \`list(model.parameters())\` and match each tensor to Day 85's W and b. Check \`model.linear.weight.shape\` is (1, 2) — out×in, your convention.
5. Train it with the same manual update loop and confirm the loss falls.`,
        code: `import torch
import torch.nn as nn

torch.manual_seed(0)

X = torch.tensor([[0.,0.],[1.,0.],[0.,1.],[1.,1.]])
y = torch.tensor([[-1.],[1.],[1.],[1.]])

class TinyNeuron(nn.Module):
    def __init__(self):
        super().__init__()
        self.linear = nn.Linear(2, 1)   # Day 85's W (1x2) and b (1)

    def forward(self, x):
        return torch.tanh(self.linear(x))

model = TinyNeuron()
print([p.shape for p in model.parameters()])  # [(1,2), (1,)]

for step in range(50):
    pred = model(X)                  # call the model, not .forward
    loss = ((pred - y) ** 2).sum()
    for p in model.parameters():
        p.grad = None                # zero_grad, by hand for now
    loss.backward()
    with torch.no_grad():            # updates are NOT part of the graph
        for p in model.parameters():
            p -= 0.1 * p.grad
    if step % 10 == 0:
        print(f'step {step:2d}  loss {loss.item():.4f}')`,
      },
      {
        title: 'Error-message clinic — break it on purpose',
        minutes: 15,
        body: `1. Take the working model from exercise 2 and cause each classic error ON PURPOSE, reading the full traceback each time before fixing it.
2. Shape: feed \`X.T\` (shape 2×4) into the model. Read the "mat1 and mat2 shapes cannot be multiplied" message and decode which two shapes it names and why.
3. Dtype: build X from NumPy with \`torch.from_numpy(np.array([[0,0],[1,0]], dtype=np.float64))\` and feed it in. Fix with \`.float()\`.
4. Device (if you have a GPU or Apple Silicon; otherwise read along): move the model with \`.to(device)\` but not the data. Fix by moving both.
5. In your notes, write the three error signatures and their one-line fixes — this trio is 80% of beginner PyTorch debugging.`,
      },
    ],
    practice: [
      {
        title: 'Port your MLP forward pass',
        minutes: 20,
        body: `Rebuild Day 85's \`MLP\` as an nn.Module: constructor takes a list of layer sizes like [2, 8, 8, 1], builds \`nn.Linear\` layers with \`nn.ModuleList\`, applies ReLU between layers but not after the last. Then: (1) verify the parameter count for [784, 128, 10] is 101,770 by summing \`p.numel()\`; (2) copy your Day-85 hand-set 2-2-1 weights into the module's tensors (under no_grad) and confirm the output is exactly 2.0 for x = [1, 2].

Constraints: architecture fully driven by the sizes list; no hardcoded layer count.

Hints: iterate \`zip(sizes, sizes[1:])\`; assign with \`layer.weight.copy_(...)\` inside \`torch.no_grad()\`.`,
      },
    ],
    project: {
      title: 'torch_basics.py — your Rosetta stone',
      brief: `Commit \`torch_basics.py\` to your practice repo: a runnable file with four labeled sections — (1) the Day-86 graph reproduced with autograd, asserting grads 6/-4/-2; (2) the accumulation demo with a comment explaining the += heritage; (3) the configurable MLP module with the 101,770 parameter assertion and the hand-set 2-2-1 check; (4) an ERRORS section with the three broken snippets commented out, each followed by its error signature and fix as comments. This file is your personal PyTorch phrasebook — Day 88 imports the MLP from it, and you will paste from it for months.`,
      rubric: [
        'All assertions pass on a fresh local run (python torch_basics.py exits 0)',
        'Autograd section reproduces Day 86\'s exact gradients',
        'MLP builds from any sizes list; parameter count verified programmatically',
        'Hand-set 2-2-1 weights produce exactly 2.0, matching Days 85–86',
        'Three error signatures documented with cause and one-line fix',
        'Committed with tests or assertions, not just prints',
      ],
    },
    mistakes: [
      'Calling loss.backward() twice on the same graph — PyTorch frees the graph after backward by default; rebuild the forward pass (or understand retain_graph) instead.',
      'Updating parameters outside torch.no_grad(). The update op gets recorded into the graph, and the next backward differentiates through your optimizer step — subtle, wrong, and slow.',
      'Forgetting that .grad accumulates. It is a feature (gradient accumulation for big batches) but a bug if you never zero — same lesson as Day 86, now with a footgun-shaped API.',
      'Mixing float64 NumPy arrays with float32 models. torch.from_numpy preserves dtype; call .float() at the boundary.',
      'Using .data or .numpy() on a graph tensor to "escape" autograd. Use .detach() — it is explicit, safe, and what code reviewers expect.',
      'Calling model.forward(x) directly. It skips hooks; always call model(x).',
    ],
    quiz: [
      {
        q: 'You run loss.backward() every step but never zero gradients. What happens?',
        o: [
          'Nothing — PyTorch zeroes them automatically',
          'Gradients accumulate across steps, so every update uses stale blame plus new',
          'PyTorch raises an error on the second backward',
          'The model trains faster',
        ],
        x: 1,
        w: 'backward() adds into .grad — the same += from your Day-86 engine. You must zero (optimizer.zero_grad() or .grad = None) each step.',
        revisit: 86,
      },
      {
        q: 'Why wrap the parameter update in torch.no_grad()?',
        o: [
          'To make the update run on GPU',
          'Because gradients do not exist outside it',
          'So the update itself is not recorded into the computational graph',
          'To reset the gradients to zero',
        ],
        x: 2,
        w: 'The weight update is bookkeeping, not part of the loss computation. Without no_grad, autograd records it and the graph grows incorrectly step over step.',
        revisit: 87,
      },
      {
        q: '"mat1 and mat2 shapes cannot be multiplied (4x2 and 4x2)" — the most likely fix is…',
        o: [
          'Cast one tensor to float32',
          'Transpose one operand or fix the layer\'s in_features — inner dimensions must match',
          'Move both tensors to the same device',
          'Reduce the batch size',
        ],
        x: 1,
        w: 'Matrix multiply needs (a×b)@(b×c): the inner dims must agree. 4x2 @ 4x2 fails; 4x2 @ 2x4 or fixing in_features works. Dtype and device produce different error messages.',
        revisit: 85,
      },
    ],
    resources: [
      { label: 'PyTorch — Learn the Basics (Tensors + Autograd pages)', url: 'https://docs.pytorch.org/tutorials/beginner/basics/intro.html', type: 'docs', time: '40 min' },
      { label: 'PyTorch Tutorials hub', url: 'https://docs.pytorch.org/tutorials/', type: 'docs', time: '10 min' },
      { label: 'Karpathy — micrograd video (final section: the PyTorch comparison)', url: 'https://www.youtube.com/watch?v=VMj-3S1tku0', type: 'video', time: '15 min' },
      { label: 'Dive into Deep Learning — preliminaries & automatic differentiation', url: 'https://d2l.ai/', type: 'book', time: '20 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: Day 86 gradient-rule cards', minutes: 10 },
      { activity: 'ELI5 + tech read; PyTorch Learn-the-Basics tensor + autograd pages', minutes: 30 },
      { activity: 'Guided: Day-86 reproduction, nn.Module neuron, error clinic', minutes: 50 },
      { activity: 'Practice: port the MLP', minutes: 20 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'Autograd reproduces Day 86\'s gradients exactly (6, -4, -2)',
      'nn.Module neuron trained; parameters mapped to Day 85\'s W and b',
      'All three error messages triggered, read, and fixed deliberately',
      'torch_basics.py committed with passing assertions',
      'Quiz ≥ 2/3',
    ],
    connections: {
      back: 'requires_grad is your Day-86 Value; backward() is your topological sort; the accumulation footgun is your own += rule. nn.Linear is Day 85\'s (out, in) weight matrix with professional initialization.',
      forward: 'Day 88 adds the missing pieces — DataLoaders, optimizers, and the canonical loop. Day 90 scales this to MNIST, Day 97 builds GPT from these same Modules, and Day 103 loads Hugging Face models that are nothing but big nn.Modules.',
    },
    flashcards: [
      { f: 'PyTorch equivalent of your Value class?', b: 'A tensor with requires_grad=True — ops record a graph; backward() fills .grad by reverse-mode autodiff.' },
      { f: 'Two places torch.no_grad() is mandatory-by-convention?', b: 'Parameter updates (not part of the loss graph) and inference (saves memory/time).' },
      { f: 'Default dtype clash between NumPy and PyTorch?', b: 'NumPy defaults float64, PyTorch models float32. Call .float() at the boundary.' },
      { f: 'nn.Linear(in, out) stores weight with what shape?', b: '(out, in); computes x @ W.T + b — Day 85\'s convention.' },
      { f: '.detach() vs .item()?', b: '.detach(): tensor cut from the graph. .item(): Python scalar from a one-element tensor.' },
      { f: 'Why call model(x) instead of model.forward(x)?', b: '__call__ runs hooks and machinery around forward; bypassing it breaks tooling.' },
    ],
    deepDive: [
      { label: 'PyTorch autograd mechanics (official notes)', url: 'https://docs.pytorch.org/tutorials/', note: 'Find the "Autograd mechanics" note in the docs: how views, in-place ops, and grad_fn chains interact — the details behind today\'s mental model.' },
    ],
  },
  {
    id: 'd088', day: 88, week: 13, phase: 5, kind: 'lesson',
    title: 'Training Loops & Data',
    analogy: 'The practice schedule',
    objectives: [
      'Write the canonical PyTorch training loop from memory: forward, loss, zero_grad, backward, step',
      'Wrap data in Dataset and DataLoader with batching and shuffling, and explain why each matters',
      'Switch correctly between model.train() and model.eval(), and pair eval with no_grad',
      'Save and load checkpoints (model + optimizer state) and resume training',
      'Structure a train/validate epoch loop that records losses for later diagnosis',
    ],
    prereqs: [
      { day: 87, label: 'Tensors, autograd & nn.Module' },
      { day: 55, label: 'Batch vs mini-batch gradient descent' },
      { day: 76, label: 'Validation discipline' },
    ],
    eli5: `A music teacher doesn't hand a student the entire songbook and say "practice." She builds a practice schedule: shuffle the pieces so the student doesn't just memorize the order, work through them in small sets so each session gives quick feedback, and after every set, correct what went wrong. Once a week there's a mock recital — no correcting allowed, just honest measurement of how the pieces sound cold. And she keeps a notebook, so if lessons stop for a month, practice resumes exactly where it left off instead of starting over.

That is the training loop. The DataLoader is the schedule-maker: it shuffles the dataset each epoch and deals it out in mini-batches. Each batch gets the five-beat correction ritual — predict, score, clear old notes, assign blame, adjust. The mock recital is the validation pass: \`model.eval()\` plus \`no_grad\`, measurement without learning. The notebook is the checkpoint file: model weights and optimizer state saved to disk, so a crash, a preemption, or a curious teammate can pick up mid-song. You will write this loop hundreds of times in your career; today you learn it so cold that on Day 99 you type it without thinking while your GPT trains.`,
    why: `The loop is the assembly line of all deep learning: MNIST (Day 90), your GPT (Day 99), and LoRA fine-tunes (Day 128) differ only in the model and data plugged into it. Production incidents live here too: a team forgetting model.eval() ships a model whose dropout is still on, quietly degrading every prediction; a missing optimizer state in a checkpoint makes "resume training" silently diverge. As an FDE you will read customers' training scripts — recognizing a malformed loop at a glance is a real diagnostic skill.`,
    tech: `Note: local-run PyTorch again today (CPU is fine).

### The five-beat loop, in order, forever

~~~python
for xb, yb in loader:
    pred = model(xb)             # 1 forward
    loss = loss_fn(pred, yb)     # 2 score
    optimizer.zero_grad()        # 3 clear old blame
    loss.backward()              # 4 assign blame
    optimizer.step()             # 5 adjust dials
~~~

The optimizer (start with \`torch.optim.SGD\`, graduate to \`AdamW\` — the modern default) holds a reference to \`model.parameters()\` and applies the update rule for you; \`zero_grad\` replaces Day 87's manual \`.grad = None\` loop. Order matters only in one place: zero before backward, step after.

### Dataset and DataLoader

A \`Dataset\` is anything with \`__len__\` and \`__getitem__\` returning one (x, y) pair — \`TensorDataset\` covers the in-memory case. The \`DataLoader\` handles batching (\`batch_size\`), shuffling (\`shuffle=True\` for training — it reshuffles every epoch, breaking any order the data was stored in, like all class 0 then all class 1), and parallel loading (\`num_workers\`). Mini-batches (Day 55) are the compromise: full-batch gradients are accurate but slow and memory-hungry; batch-of-1 is noisy; 32–256 gives stable, frequent updates that also exploit GPU parallelism. Do NOT shuffle validation data — no learning happens there, and stable order makes runs comparable.

### Two modes and one context manager

\`model.train()\` and \`model.eval()\` toggle layer BEHAVIOR (dropout active vs off, batch norm updating vs frozen — Day 89 meets both). \`torch.no_grad()\` toggles GRAPH RECORDING. They are orthogonal and validation needs both: eval mode for honest layer behavior, no_grad for speed and memory. Forgetting eval() is the classic silent bug — the model still runs, just worse.

### Checkpoints

Save a dict: \`{'model': model.state_dict(), 'optim': optimizer.state_dict(), 'epoch': e}\` via \`torch.save\`. state_dict is just an ordered dict of named tensors — portable across machines. Loading restores weights with \`model.load_state_dict(...)\`; restoring the optimizer matters because AdamW carries per-parameter momentum statistics — dropping them makes resumed training stumble. Save "latest" every epoch and "best" on validation improvement; Day 90's lab and every production trainer use exactly this pattern.`,
    viz: null,
    guided: [
      {
        title: 'The canonical loop on a real (small) problem',
        minutes: 25,
        body: `1. (Local run.) The starter trains your Day-87 MLP on a synthetic two-moons-style dataset: 1,000 points, two interleaved classes — a problem a linear model cannot solve.
2. Read the loop line by line and annotate each of the five beats with a comment IN YOUR OWN WORDS.
3. Run it. Training loss should fall below 0.3 within 20 epochs; validation accuracy should exceed 95%.
4. Now break beat 3: comment out zero_grad and rerun. Describe the loss curve in one sentence (Day 86 told you why).
5. Restore it, then set shuffle=False AND sort the data by label before loading. Watch the loss oscillate as each epoch sees a long run of class 0 then class 1 — this is why we shuffle.`,
        code: `import torch
import torch.nn as nn
from torch.utils.data import TensorDataset, DataLoader

torch.manual_seed(0)

# synthetic "two arcs" dataset
n = 500
t = torch.rand(n) * 3.14159
x0 = torch.stack([t.cos(), t.sin()], dim=1) + torch.randn(n, 2) * 0.1
x1 = torch.stack([1 - t.cos(), 0.5 - t.sin()], dim=1) + torch.randn(n, 2) * 0.1
X = torch.cat([x0, x1]);  y = torch.cat([torch.zeros(n), torch.ones(n)]).long()

perm = torch.randperm(2 * n)          # split AFTER shuffling the pool
X, y = X[perm], y[perm]
train_ds = TensorDataset(X[:800], y[:800])
val_ds   = TensorDataset(X[800:], y[800:])
train_loader = DataLoader(train_ds, batch_size=32, shuffle=True)
val_loader   = DataLoader(val_ds, batch_size=64, shuffle=False)

model = nn.Sequential(nn.Linear(2, 16), nn.ReLU(), nn.Linear(16, 2))
loss_fn = nn.CrossEntropyLoss()
optimizer = torch.optim.AdamW(model.parameters(), lr=1e-2)

for epoch in range(20):
    model.train()
    total = 0.0
    for xb, yb in train_loader:
        pred = model(xb)              # 1 forward
        loss = loss_fn(pred, yb)      # 2 score
        optimizer.zero_grad()         # 3 clear old blame
        loss.backward()               # 4 assign blame
        optimizer.step()              # 5 adjust
        total += loss.item() * len(xb)

    model.eval()
    correct = 0
    with torch.no_grad():             # eval mode AND no_grad
        for xb, yb in val_loader:
            correct += (model(xb).argmax(1) == yb).sum().item()
    print(f'epoch {epoch:2d}  train_loss {total/800:.3f}  val_acc {correct/200:.3f}')`,
      },
      {
        title: 'Checkpoint, kill, resume',
        minutes: 15,
        body: `1. Add checkpointing to exercise 1: every epoch save {'model', 'optim', 'epoch'} to \`ckpt_latest.pt\`, and to \`ckpt_best.pt\` when validation accuracy improves.
2. Train 10 epochs, then stop the script (simulate a crash).
3. Write \`resume.py\`: rebuild model and optimizer, load the checkpoint, and continue from the saved epoch. Confirm the first resumed epoch's loss continues the old curve rather than jumping up.
4. Sabotage test: resume loading ONLY the model weights (fresh optimizer). Compare the first resumed epoch — with AdamW the loss typically blips upward because momentum statistics were lost. Note this in your log.`,
        code: `# saving (inside the epoch loop)
import torch
ckpt = {'model': model.state_dict(),
        'optim': optimizer.state_dict(),
        'epoch': epoch}
torch.save(ckpt, 'ckpt_latest.pt')

# resume.py (sketch)
ckpt = torch.load('ckpt_latest.pt')
model.load_state_dict(ckpt['model'])
optimizer.load_state_dict(ckpt['optim'])
start_epoch = ckpt['epoch'] + 1
# ...continue the same loop from start_epoch`,
      },
      {
        title: 'Write a custom Dataset',
        minutes: 10,
        body: `1. Implement \`class CSVPoints(torch.utils.data.Dataset)\` that loads a CSV of x1,x2,label rows in __init__, returns (features_tensor, label_tensor) from __getitem__, and its row count from __len__.
2. Generate a 200-row CSV from exercise 1's data with NumPy, load it through your Dataset + a DataLoader, and verify one batch has shapes (32, 2) and (32,).
3. One-sentence answer in your notes: why does the DataLoader need __len__?`,
      },
    ],
    practice: [
      {
        title: 'Extract your reusable trainer',
        minutes: 20,
        body: `Refactor exercise 1 into \`train_model(model, train_loader, val_loader, loss_fn, optimizer, epochs, ckpt_path)\` in a file \`trainer.py\`: runs the epoch loop, records per-epoch train loss and val metric into a history dict, checkpoints latest+best, and returns the history. Prove reusability by training TWO different models with it (the 16-unit MLP and a 64-unit one) and printing both histories.

Constraints: no globals; the function must not reference the dataset shape anywhere; eval must use eval mode + no_grad.

Hints: pass a metric_fn(pred, yb) instead of hardcoding accuracy; that keeps regression tasks possible on Day 90's ablations.`,
      },
    ],
    project: {
      title: 'trainer.py — the loop you will reuse forever',
      brief: `Commit \`trainer.py\` (the reusable train_model function plus a checkpoint save/load pair) and \`train_arcs.py\` (the two-arcs experiment driving it) to your practice repo. Include the two deliberate-failure notes as comments: what the loss did without zero_grad, and what happened on resume without optimizer state. Requirement: running \`python train_arcs.py\` end-to-end trains, checkpoints, and prints a final validation accuracy ≥ 0.95. Day 90's MNIST lab imports train_model unchanged — if it needs edits there, today's abstraction leaked.`,
      rubric: [
        'Five-beat loop correct, with eval mode + no_grad on the validation path',
        'train_model works unchanged for two different architectures',
        'Checkpoints store model AND optimizer state; resume continues the loss curve',
        'History dict captures per-epoch train loss and val metric',
        'Both deliberate-failure experiments documented in comments',
        'Final val accuracy ≥ 0.95 on the arcs dataset',
      ],
    },
    mistakes: [
      'Forgetting model.eval() for validation. Dropout keeps dropping and batch norm keeps updating — metrics are silently wrong and the "bug" reproduces nowhere else.',
      'Thinking no_grad and eval() are interchangeable. One stops graph recording, the other changes layer behavior; validation needs both.',
      'Shuffling the validation loader or, worse, NOT shuffling training data sorted by class — the first makes runs incomparable, the second makes each epoch a sequence of biased gradients.',
      'Checkpointing only the model. Adam/AdamW carry per-parameter state; resuming without it makes the first epochs stumble and corrupts learning-curve comparisons.',
      'Computing the epoch loss as a mean of batch means with uneven batch sizes. Weight by batch length (as the starter does) or the last small batch skews the number.',
      'Calling loss.item() inside the graph-hot path unnecessarily is fine — but logging the raw tensor keeps the whole graph alive in your history list. Store floats, not tensors.',
    ],
    quiz: [
      {
        q: 'Correct order of the five beats?',
        o: [
          'forward → loss → backward → zero_grad → step',
          'forward → loss → zero_grad → backward → step',
          'zero_grad → backward → forward → loss → step',
          'forward → zero_grad → loss → step → backward',
        ],
        x: 1,
        w: 'Zero old gradients before backward writes new ones; step after backward so the update uses fresh gradients. zero_grad after backward would erase the blame you just computed.',
        revisit: 88,
      },
      {
        q: 'Validation numbers look great in the notebook but the deployed model performs worse. The loop-related suspect is…',
        o: [
          'The DataLoader used num_workers=0',
          'model.eval() was never called, so dropout/batch-norm behaved differently than measured',
          'The checkpoint saved optimizer state',
          'The batch size was 32 instead of 64',
        ],
        x: 1,
        w: 'Wait — if eval() was never called, validation was measured WITH dropout on, i.e. pessimistically. Either direction, mode mismatch between measurement and serving is the classic silent bug; always pair eval() + no_grad for honest metrics.',
        revisit: 88,
      },
      {
        q: 'Why restore optimizer.state_dict() when resuming AdamW training?',
        o: [
          'Otherwise the model weights are wrong',
          'AdamW keeps per-parameter momentum/variance statistics that the update rule depends on',
          'PyTorch refuses to load a model without it',
          'It restores the random seed',
        ],
        x: 1,
        w: 'Weights live in the model state_dict; AdamW\'s running statistics live in the optimizer\'s. Dropping them restarts adaptation from scratch and dents the resumed loss curve.',
        revisit: 88,
      },
    ],
    resources: [
      { label: 'PyTorch — Learn the Basics (Datasets & DataLoaders, Optimization pages)', url: 'https://docs.pytorch.org/tutorials/beginner/basics/intro.html', type: 'docs', time: '40 min' },
      { label: 'PyTorch Tutorials hub (Quickstart end-to-end)', url: 'https://docs.pytorch.org/tutorials/', type: 'docs', time: '20 min' },
      { label: 'fast.ai Practical Deep Learning — training mechanics lessons', url: 'https://course.fast.ai/', type: 'course', time: '30 min' },
      { label: 'Dive into Deep Learning — the training loop chapters', url: 'https://d2l.ai/', type: 'book', time: '20 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: Day 87 cards + recite the five beats', minutes: 10 },
      { activity: 'ELI5 + tech read; Datasets/DataLoaders + Optimization tutorial pages', minutes: 25 },
      { activity: 'Guided: canonical loop, checkpoint/resume, custom Dataset', minutes: 50 },
      { activity: 'Practice + project: extract and commit trainer.py', minutes: 25 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'Canonical loop annotated and run; both sabotage experiments observed and explained',
      'Checkpoint → kill → resume demonstrated with a continuous loss curve',
      'trainer.py committed and reused across two architectures',
      'Arcs validation accuracy ≥ 0.95',
      'Quiz ≥ 2/3',
    ],
    connections: {
      back: 'Beat 3–5 are Day 86\'s zero/backward/update ritual with an optimizer object; mini-batching is Day 55\'s stochastic gradient trade-off; the untouched-validation-set discipline is Day 76 wearing PyTorch clothes.',
      forward: 'Day 89 teaches you to READ the loss histories this loop produces. Day 90 points trainer.py at MNIST. Day 99 trains your GPT with this identical loop, and Day 128\'s LoRA fine-tune is this loop with most parameters frozen.',
    },
    flashcards: [
      { f: 'The five beats of the training loop?', b: 'forward → loss → zero_grad → backward → step.' },
      { f: 'model.eval() vs torch.no_grad()?', b: 'eval(): layer behavior (dropout off, BN frozen). no_grad(): stop graph recording. Validation needs both.' },
      { f: 'Why shuffle training data every epoch?', b: 'Breaks stored order (e.g. sorted by class) so each mini-batch gradient is an unbiased sample.' },
      { f: 'What goes in a resumable checkpoint?', b: 'model.state_dict() + optimizer.state_dict() + epoch (and any scheduler state).' },
      { f: 'Typical mini-batch size and why?', b: '32–256: stable-enough gradients, frequent updates, fits parallel hardware. Full batch = slow; size 1 = noisy.' },
      { f: 'Why store loss.item() in history, not the tensor?', b: 'The tensor keeps its whole graph alive in memory; .item() extracts a plain float.' },
    ],
    deepDive: [
      { label: 'Gradient accumulation', note: 'When the batch you want exceeds memory: run K forward/backwards without zeroing (exploiting += !), then one step. Effective batch = K × loader batch. You will see this in every LLM training script, including nanoGPT on Day 99.' },
    ],
  },
  {
    id: 'd089', day: 89, week: 13, phase: 5, kind: 'lesson',
    title: 'Training Dynamics',
    analogy: 'Tuning the oven',
    objectives: [
      'Diagnose underfitting, overfitting, and instability from train/validation loss curves alone',
      'Apply the regularization toolkit — weight decay, dropout, early stopping — and say what each trades away',
      'Explain what batch norm does at a gist level and why train/eval mode matters for it',
      'Choose learning rates, schedules, and warmup with a principled starting recipe',
      'Use gradient clipping to tame exploding gradients and know when it is a band-aid',
    ],
    prereqs: [
      { day: 88, label: 'Training loops & checkpoints' },
      { day: 76, label: 'Bias/variance & regularization' },
      { day: 55, label: 'Learning rates & divergence' },
    ],
    eli5: `A baker learns more from watching through the oven glass than from any recipe. Oven too cold (learning rate too low): the loaf technically bakes but takes all day. Too hot: the crust burns while the inside stays raw — loss spikes and diverges. There's also a rhythm to good baking: start gentler while the dough sets (warmup), bake at full heat, then lower the temperature at the end so the inside finishes without burning (learning-rate decay). And the honest test is never the loaf's smell in the kitchen — it's giving a slice to someone who didn't watch it bake (validation).

Overfitting is the pastry chef who memorizes the exam: performance on practice questions keeps "improving" while real-world performance quietly rots. The fixes all share one idea — make memorizing harder than generalizing: shrink the dials toward zero unless the data insists (weight decay), randomly send some bakers home each shift so no single one becomes indispensable (dropout), or simply stop baking at the moment the outside taster was happiest (early stopping). Today you learn to read the oven glass — loss curves — like a clinician reads a chart: every squiggle has a differential diagnosis and a treatment.`,
    why: `"My model isn't learning" and "my fine-tune got worse" are the two most common deep-learning support tickets you will ever field, and both are answered by reading curves, not by re-running with hope. On Day 99 you will watch your GPT's train/val curves split and must decide: more data, more dropout, or stop? On Day 128, LoRA fine-tuning lives or dies by learning rate and early stopping. Being the person who looks at a loss chart and says "classic overfitting from step 3k, roll back and add weight decay" — that is billable judgment.`,
    tech: `### Reading the curves — the clinician's chart

Plot train AND validation loss per epoch, always. The taxonomy:

- **Both high, both flat** — underfitting. The model lacks capacity or the LR is too low. Treat: bigger model, higher LR, train longer.
- **Train falls, val falls then rises** — overfitting; the gap is memorization. Treat: regularize (below), more data, or early-stop at the val minimum.
- **Loss spikes or NaNs** — instability: LR too high or exploding gradients. Treat: lower LR, add warmup, clip gradients.
- **Loss stuck at ln(num_classes)** — the model predicts uniform; check for a wiring bug (labels shuffled, LR zero, softmax applied twice) before touching hyperparameters. For 10 classes that plateau is ln(10) ≈ 2.303 (Day 62).

### The regularization toolkit

**Weight decay** adds a pull toward zero on every weight (L2, Day 76): \`AdamW(params, weight_decay=0.01)\` — AdamW exists precisely because vanilla Adam entangles decay with its adaptive scaling. **Dropout** (\`nn.Dropout(p)\`) zeroes each activation with probability p during training, forcing redundancy; at eval it turns off and outputs are rescaled — this is a big reason model.train()/eval() exists. **Early stopping** monitors validation loss and keeps the best checkpoint — you built "save best" yesterday; add patience (stop after k epochs without improvement) and it becomes a policy.

**Batch norm** (gist level): normalizes each layer's pre-activations to roughly zero-mean/unit-variance using batch statistics, then lets the network re-scale. It stabilizes and speeds training of deep nets; at eval it switches to running statistics collected during training — the second reason eval mode is not optional. Transformers use LayerNorm instead (Day 95) — same normalize-then-rescale idea, computed per-example rather than per-batch.

### Learning rate: the single most important knob

Rule of thumb: try 3e-4 for AdamW, then bracket ×3 up and down. **Warmup** ramps LR from ~0 over the first few hundred steps — early gradients from a random net are garbage; taking full-size steps on them destabilizes training (transformers are especially sensitive). **Schedules** then decay it — step, cosine (smoothly to near zero, the transformer default), or reduce-on-plateau. **Gradient clipping** (\`clip_grad_norm_(params, 1.0)\`) rescales the gradient vector when its norm exceeds a threshold — insurance against rare loss-cliff batches; standard in every LLM script. If you need aggressive clipping to survive at all, the real problem is usually LR or data.`,
    viz: 'loss-curves',
    guided: [
      {
        title: 'Manufacture all three pathologies on purpose',
        minutes: 25,
        body: `1. (Local run.) Reuse trainer.py and the arcs dataset from Day 88, but shrink the training set to 60 points to make overfitting easy, and train a 2-64-64-2 MLP.
2. Baseline: lr=1e-2, 200 epochs. Plot (or print) train and val loss per epoch. You should see the val curve bottom out and creep up while train keeps falling — record the epoch where the gap opens.
3. Underfit: swap in a 2-2-2 model with lr=1e-4. Both curves crawl and plateau high — note how different this signature looks.
4. Explode: set lr=1.0 on the big model. Watch loss spike or NaN within a few epochs.
5. Save the three histories to one JSON — they are your reference chart pack for Day 90 and Day 99 diagnosis.`,
        code: `import json
import torch, torch.nn as nn
from torch.utils.data import TensorDataset, DataLoader
from trainer import train_model   # your Day-88 artifact

torch.manual_seed(0)
# ...build arcs data as on Day 88, then:
small_train = TensorDataset(X[:60], y[:60])      # tiny on purpose
val_ds      = TensorDataset(X[800:], y[800:])

def make(hidden):
    return nn.Sequential(nn.Linear(2, hidden), nn.ReLU(),
                         nn.Linear(hidden, hidden), nn.ReLU(),
                         nn.Linear(hidden, 2))

runs = {}
for name, hidden, lr in [('overfit', 64, 1e-2),
                         ('underfit', 2, 1e-4),
                         ('explode', 64, 1.0)]:
    model = make(hidden)
    opt = torch.optim.AdamW(model.parameters(), lr=lr)
    hist = train_model(model, DataLoader(small_train, 16, shuffle=True),
                       DataLoader(val_ds, 64), nn.CrossEntropyLoss(),
                       opt, epochs=200, ckpt_path=f'{name}.pt')
    runs[name] = hist

with open('pathologies.json', 'w') as f:
    json.dump(runs, f, indent=2)`,
      },
      {
        title: 'Treat the overfitter three ways',
        minutes: 20,
        body: `1. Take the overfitting setup from exercise 1 and apply ONE treatment at a time, retraining from scratch each run (same seed):
   - weight decay: AdamW(..., weight_decay=0.01)
   - dropout: insert nn.Dropout(0.3) after each ReLU
   - early stopping: patience 15 on validation loss, restore the best checkpoint
2. For each: record best validation loss and the epoch it occurred.
3. Build a 4-row comparison table (baseline + three treatments) in your notes. Which single treatment helped most on THIS problem? Would you expect the same ranking with 100x more data? Why not?
4. Combine the best two treatments and see if they stack.`,
      },
      {
        title: 'Warmup and clipping rescue the hot oven',
        minutes: 10,
        body: `1. Return to the lr=1.0 exploding configuration — we will tame it without lowering the peak LR (a realistic exercise: big-model recipes often need high LRs to converge fast).
2. Add linear warmup over the first 100 steps: each step, set \`for g in opt.param_groups: g['lr'] = peak_lr * min(1.0, step / 100)\`.
3. Add \`torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)\` between backward and step.
4. Rerun: training should now survive (even if final quality is mediocre — the point is stability). Note which intervention mattered more by toggling them individually.`,
      },
    ],
    practice: [
      {
        title: 'The curve-reading clinic',
        minutes: 20,
        body: `Write \`diagnose(history)\` in \`dynamics.py\`: given {'train_loss': [...], 'val_loss': [...]}, return one of 'underfitting', 'overfitting', 'unstable', or 'healthy', with a one-line reason string. Rules are yours to design, but they must correctly classify: (a) your three pathology histories from guided 1, (b) the healthy Day-88 arcs run, and (c) a synthetic history you construct where val loss is flat-high while train loss is near zero.

Constraints: pure function, no plotting, no ML — just thresholds and slopes you justify in comments.

Hints: overfitting = val minimum well before the end plus a widening gap; instability = any NaN or a loss jump > 3x the running median; underfitting = both curves flat and high relative to their start.`,
      },
    ],
    project: {
      title: 'The training playbook, page one',
      brief: `Commit \`dynamics.py\` (the diagnose function + tests against your saved histories) and \`playbook.md\` to your practice repo. The playbook is a one-page decision chart in markdown: four curve signatures, each with its diagnosis, first-line treatment, and second-line treatment, plus your starting recipe (optimizer, LR, warmup, clipping, when to add dropout vs weight decay) written as defaults you will actually reuse. Cap it at 40 lines — a playbook you can't skim during an incident is a diary. Day 90's ablation log and Day 99's GPT training log must both cite entries from this playbook.`,
      rubric: [
        'diagnose() correctly classifies all five required histories, with tests',
        'pathologies.json committed with the three manufactured runs',
        'Treatment comparison table completed with best-val-loss numbers for all four runs',
        'playbook.md covers all four signatures with two-line treatments each',
        'Starting recipe states concrete numbers (LR, weight decay, warmup steps, clip norm)',
        'Committed and cited by path in your Day-90 lab notes',
      ],
    },
    mistakes: [
      'Judging training by train loss alone. Train loss almost always falls; the val curve is where truth lives. No val curve = no diagnosis.',
      'Reaching for dropout the moment val loss rises, without checking data quantity first. With tiny data the honest fixes are more data or a smaller model; regularization is a treatment, not a cure.',
      'Using vanilla Adam with weight_decay and expecting L2 behavior — Adam couples decay with its adaptive scaling. Use AdamW; this distinction is why it exists.',
      'Forgetting that dropout and batch norm change behavior between train and eval modes — Day 88\'s eval() lesson is half of today\'s toolkit working correctly.',
      'Treating loss stuck at ln(num_classes) as "needs more epochs". That plateau is the uniform-guess score — suspect shuffled labels, a double softmax, or lr=0 before tuning anything.',
      'Cranking gradient clipping tighter and tighter to survive. Clipping is insurance for rare spikes; if every step clips, your LR or data pipeline is the real patient.',
    ],
    quiz: [
      {
        q: 'Train loss falls steadily; validation loss falls, bottoms out at epoch 30, then climbs. Diagnosis and first-line treatment?',
        o: [
          'Underfitting — increase model size',
          'Overfitting — early-stop near epoch 30 and/or regularize',
          'Instability — add gradient clipping',
          'A data bug — reshuffle labels',
        ],
        x: 1,
        w: 'The widening train/val gap after a val minimum is the overfitting signature. Restore the epoch-30 checkpoint, then consider weight decay, dropout, or more data.',
        revisit: 89,
      },
      {
        q: 'A 10-class classifier\'s loss sits at ~2.30 for 20 epochs. The FIRST thing to check is…',
        o: [
          'Whether to add batch norm',
          'A wiring bug — 2.30 ≈ ln(10) is the uniform-guess plateau (labels, LR, double softmax)',
          'Whether the batch size is too large',
          'Whether to switch from SGD to AdamW',
        ],
        x: 1,
        w: 'ln(10) ≈ 2.303 is exactly what predicting uniform probabilities scores (Day 62). A model pinned there is usually broken, not slow.',
        revisit: 62,
      },
      {
        q: 'Why does warmup help, especially for transformers?',
        o: [
          'It lets the DataLoader cache batches first',
          'Early gradients from randomly initialized weights are unreliable; small first steps avoid destabilizing jumps',
          'It reduces overfitting like dropout does',
          'It compensates for eval mode being off',
        ],
        x: 1,
        w: 'At initialization, gradient directions are near-noise; full-size steps on them can throw parameters into bad regions (or blow up attention logits). Ramping the LR lets statistics settle first.',
        revisit: 89,
      },
    ],
    resources: [
      { label: 'fast.ai — Practical Deep Learning (training/fitting lessons)', url: 'https://course.fast.ai/', type: 'course', time: '30 min' },
      { label: 'Dive into Deep Learning — regularization & optimization chapters', url: 'https://d2l.ai/', type: 'book', time: '30 min' },
      { label: 'Deep Learning (Goodfellow) — ch. 7 Regularization (skim the intros)', url: 'https://www.deeplearningbook.org/', type: 'book', time: '20 min' },
      { label: '3Blue1Brown — gradient descent chapters (rewatch with new eyes)', url: 'https://www.youtube.com/playlist?list=PLZHQObOWTQDNU6R1_67000Dx_ZCJB-3pi', type: 'video', time: '15 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: Days 86–88 cards', minutes: 10 },
      { activity: 'ELI5 + tech read; study the loss-curves visualizer signatures', minutes: 20 },
      { activity: 'Guided: manufacture pathologies, treat the overfitter, rescue the hot oven', minutes: 55 },
      { activity: 'Practice + project: diagnose() and playbook.md', minutes: 25 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'Three pathology runs produced, saved, and visually distinguished',
      'Treatment table filled with best-val-loss per remedy; stacking tried',
      'diagnose() passes on all five histories',
      'playbook.md committed with concrete default numbers',
      'Quiz ≥ 2/3',
    ],
    connections: {
      back: 'This is Day 76\'s bias/variance clinic re-run at neural scale: weight decay IS L2, early stopping is validation discipline, and the ln(10) plateau is Day 62\'s cross-entropy of a uniform guess.',
      forward: 'Tomorrow (Day 90) you run real ablations on MNIST using this playbook. Day 99\'s GPT training log is a curve-reading exam, and Day 128\'s LoRA runs make LR + early stopping the whole game. The loss-curve clinic returns as eval-metric drift on Day 145.',
    },
    flashcards: [
      { f: 'Four loss-curve signatures?', b: 'Underfit: both high/flat. Overfit: val bottoms then rises. Unstable: spikes/NaN. Wiring bug: stuck at ln(num_classes).' },
      { f: 'Why AdamW over Adam for weight decay?', b: 'Adam entangles L2 with adaptive scaling; AdamW decouples decay so it behaves like true regularization.' },
      { f: 'What does dropout do at train vs eval?', b: 'Train: zeroes activations with prob p (forces redundancy). Eval: off, outputs scaled — via model.eval().' },
      { f: 'Warmup in one line?', b: 'Ramp LR from ~0 over early steps because gradients from random weights are unreliable.' },
      { f: 'Gradient clipping — what and when?', b: 'Rescale grad vector when its norm exceeds a cap (e.g. 1.0). Insurance for rare spikes; constant clipping means fix LR/data.' },
      { f: 'BatchNorm vs LayerNorm gist?', b: 'Both normalize then re-scale. BN: per-batch statistics (needs eval mode). LN: per-example — the transformer choice.' },
    ],
    deepDive: [
      { label: 'Karpathy — A Recipe for Training Neural Networks', note: 'Search for this classic blog post: a battle-tested checklist (overfit one batch first, visualize everything, start simple) that professionalizes everything from today. Its "overfit a single batch" test is Day 97\'s sanity check.' },
    ],
  },
  {
    id: 'd090', day: 90, week: 13, phase: 5, kind: 'project',
    title: 'MNIST Lab',
    analogy: 'Hello, deep learning',
    objectives: [
      'Train an MLP on MNIST to ≥ 97% test accuracy using your own trainer.py',
      'Build a small CNN, explain why convolutions beat flat pixels, and reach ≥ 98.5%',
      'Run three controlled ablations and record them in an experiment log',
      'Perform confusion-matrix error analysis and look at actual misclassified digits',
      'Ship a saved model plus a standalone inference script',
    ],
    prereqs: [
      { day: 88, label: 'Training loops & trainer.py' },
      { day: 89, label: 'Training dynamics & the playbook' },
      { day: 75, label: 'Confusion matrices & metrics' },
    ],
    eli5: `Every craft has its "hello, world," and deep learning's is teaching a machine to read handwritten digits. MNIST is 70,000 grayscale images, 28 by 28 pixels, each a scrawled 0–9 from real humans — census workers and high-schoolers of the 1990s. It is small enough to train on a laptop CPU in minutes and real enough to have every problem real data has: ambiguous scrawls where a 4 shades into a 9, sloppy 7s that look like 1s, and a model that will confidently get some of them wrong.

Today nothing is new — that's the point. You take the forward pass from Day 85, the loop from Day 88, and the playbook from Day 89, and you point them at real images for the first time. First a plain dial-stack (MLP) that treats the image as 784 unrelated numbers. Then a convolutional network, which stops shredding the picture into a list and instead slides small pattern-detectors across it — edges, curves, loops — the way your eye doesn't care WHERE in the frame a 7 appears, just that it's a 7. Then you do what real ML engineers spend most of their time doing: run experiments, log them honestly, and stare at the mistakes.`,
    why: `This is your first end-to-end deep learning deliverable — the artifact interviewers mean when they ask "have you actually trained a model?". The lab's real curriculum is the meta-skills: an experiment log with controlled one-variable changes (the discipline behind every serious eval you run from Day 134 on), error analysis by staring at real failures (Day 80's superpower applied to pixels), and an inference script with a clean contract — the exact seam where models meet production APIs on Day 148 when you containerize one.`,
    tech: `Note: local run. \`pip install torch torchvision\`; CPU trains the MLP in ~2 min/epoch and the small CNN in ~5.

### Architecture 1 — the MLP baseline

Flatten 28×28 to 784, then 784 → 256 → 10 with ReLU. Loss is \`nn.CrossEntropyLoss\`, which expects RAW LOGITS (it applies log-softmax internally — adding your own softmax is the classic double-softmax bug from Day 89's clinic). Normalize inputs with MNIST's mean/std (0.1307, 0.3081): centered inputs keep early gradients well-scaled. Expect ≥ 97% test accuracy with AdamW at 1e-3 in ~5 epochs. Sanity ritual first: initial loss ≈ ln(10) ≈ 2.303, and one batch overfits to ~0 loss in a few hundred steps.

### Architecture 2 — why convolutions

An MLP wires every pixel to every hidden unit: 784×256 ≈ 200k weights that must each independently discover "ink here matters." A convolution instead learns a small k×k filter slid across the image — the same weights reused at every location. Two consequences: **locality** (digits are made of local strokes) and **translation tolerance** (a shifted 7 excites the same filters, shifted). \`Conv2d(1→16, 3×3) → ReLU → MaxPool → Conv2d(16→32, 3×3) → ReLU → MaxPool → flatten → Linear(1568→10)\` reaches ~99% with FEWER parameters than the MLP — parameter sharing is the whole story. Max pooling downsamples by keeping the strongest activation per 2×2 window, buying more translation tolerance cheaply.

### The experiment log — one variable at a time

An ablation changes exactly one thing against a fixed baseline, same seed, and records the outcome. Today: (1) remove input normalization; (2) MLP hidden width 256 → 32; (3) remove one conv block. Log format per run: name, change, epochs, final train loss, test accuracy, one-sentence conclusion. Resist the urge to change two things — a two-variable "experiment" identifies nothing (Day 61's confounding, reborn).

### Error analysis

A confusion matrix (Day 75) over the 10k test images shows WHICH digits confuse the model — typically 4↔9 and 3↔5·8. Then look at the actual images of the top confusion pair. Some are model failures; some are labels a human would also miss. Deciding which is which is error analysis — the Day-80 habit that data-centric improvement grows from.`,
    viz: null,
    guided: [
      {
        title: 'Milestone 1 — MLP to 97%',
        minutes: 30,
        body: `1. Download MNIST via torchvision (starter). Note the Normalize transform and the train/test split arriving pre-defined.
2. Sanity checks BEFORE training (playbook page one): print initial loss on one batch — must be ≈ 2.30 — then overfit a single batch of 64 to near-zero loss in ≤ 500 steps.
3. Train the 784-256-10 MLP with your trainer.py: AdamW lr=1e-3, batch 64, 5 epochs, checkpointing best-by-val.
4. Evaluate on the test set. Target ≥ 97.0%. If short, consult playbook.md — do NOT random-walk hyperparameters.
5. Start experiments.md with this baseline row: config, epochs, final losses, test accuracy.`,
        code: `import torch, torch.nn as nn
from torch.utils.data import DataLoader
from torchvision import datasets, transforms
from trainer import train_model     # Day-88 artifact, unchanged

torch.manual_seed(0)
tfm = transforms.Compose([
    transforms.ToTensor(),                      # -> [0,1], shape (1,28,28)
    transforms.Normalize((0.1307,), (0.3081,)), # MNIST mean/std
])
train_ds = datasets.MNIST('data', train=True,  download=True, transform=tfm)
test_ds  = datasets.MNIST('data', train=False, download=True, transform=tfm)

mlp = nn.Sequential(
    nn.Flatten(),                 # (B,1,28,28) -> (B,784)
    nn.Linear(784, 256), nn.ReLU(),
    nn.Linear(256, 10),           # raw logits — NO softmax here
)

# sanity: initial loss ~ ln(10) = 2.303
xb, yb = next(iter(DataLoader(train_ds, 64, shuffle=True)))
print('initial loss:', nn.CrossEntropyLoss()(mlp(xb), yb).item())

hist = train_model(mlp,
                   DataLoader(train_ds, 64, shuffle=True),
                   DataLoader(test_ds, 256),
                   nn.CrossEntropyLoss(),
                   torch.optim.AdamW(mlp.parameters(), lr=1e-3),
                   epochs=5, ckpt_path='mlp_mnist.pt')`,
      },
      {
        title: 'Milestone 2 — the CNN and the ablations',
        minutes: 35,
        body: `1. Build the CNN in the starter. Before training, predict its parameter count, then verify with sum(p.numel() for p in model.parameters()) — compare against the MLP's ~203k.
2. Train 5 epochs, same recipe. Target ≥ 98.5% test accuracy.
3. Run the three ablations, ONE change each, same seed, logging each as a row in experiments.md:
   a. No-normalization: drop the Normalize transform (both loaders!). Effect on convergence speed?
   b. Skinny MLP: hidden 256 → 32. How much accuracy does capacity buy?
   c. One-block CNN: delete the second conv block. Parameters vs accuracy?
4. End each row with a one-sentence conclusion. No conclusion, no experiment.`,
        code: `class SmallCNN(nn.Module):
    def __init__(self):
        super().__init__()
        self.features = nn.Sequential(
            nn.Conv2d(1, 16, 3, padding=1), nn.ReLU(),  # (B,16,28,28)
            nn.MaxPool2d(2),                            # (B,16,14,14)
            nn.Conv2d(16, 32, 3, padding=1), nn.ReLU(), # (B,32,14,14)
            nn.MaxPool2d(2),                            # (B,32, 7, 7)
        )
        self.head = nn.Sequential(
            nn.Flatten(),                               # (B, 32*7*7=1568)
            nn.Linear(1568, 10),
        )
    def forward(self, x):
        return self.head(self.features(x))`,
      },
      {
        title: 'Milestone 3 — error analysis + inference script',
        minutes: 25,
        body: `1. With the best CNN checkpoint, compute the 10×10 confusion matrix over the test set (loop with no_grad, tally predicted vs true).
2. Identify the top confusion pair. Collect the indices of those misclassified images and display (or save as PNGs) at least 6 of them next to their true and predicted labels.
3. For each: your verdict — model failure, genuinely ambiguous scrawl, or arguable label? Tally the three verdicts in experiments.md.
4. Write \`predict.py\`: loads the checkpoint, takes an image path (28×28 grayscale PNG) from argv, applies THE SAME normalization, prints the digit and the softmax confidence. Test it on 3 images you export from the test set.
5. Contract check: predict.py must not import trainer.py or the training script — inference stands alone.`,
      },
    ],
    practice: [
      {
        title: 'Beat your own CNN',
        minutes: 15,
        body: `Squeeze more out of the CNN with ONE additional playbook intervention of your choice — dropout before the head, weight decay, a third conv block, more epochs with early stopping, or an LR schedule. State your hypothesis in experiments.md BEFORE running, then the result after.

Constraints: one change; same seed; report test accuracy delta to two decimals.

Hint: at 98.5%+, gains are tenths of a percent — that is what real leaderboard grinding feels like, and why error analysis usually beats another hyperparameter run.`,
      },
    ],
    project: {
      title: 'The MNIST lab report',
      brief: `Assemble the day into a \`mnist-lab/\` folder in your practice repo: \`train_mnist.py\` (both architectures, driven by trainer.py), \`predict.py\` (standalone inference), \`experiments.md\` (baseline + 3 ablations + your practice hypothesis run, each with a conclusion sentence), the confusion matrix (text or image), 6+ misclassified images with verdicts, and the best checkpoint. A README paragraph states final numbers: MLP and CNN test accuracy, parameter counts of both, and your single most surprising finding. This lab gets refactored into the Day-82 project template on Day 91, so keep functions clean.`,
      rubric: [
        'MLP ≥ 97.0% and CNN ≥ 98.5% test accuracy, reproducible with the committed seed',
        'Initial-loss and overfit-one-batch sanity checks logged before full training',
        'Three ablations with exactly one change each, all logged with conclusions',
        'Confusion matrix produced; top pair identified; ≥ 6 misclassified images with verdicts',
        'predict.py runs standalone on a PNG and applies training-time normalization',
        'README states accuracies, parameter counts, and one surprising finding',
      ],
    },
    mistakes: [
      'Adding softmax before CrossEntropyLoss. The loss applies log-softmax internally; doubling it squashes gradients and caps your accuracy mysteriously below target.',
      'Normalizing the training set but not the test set (or predict.py). Any transform mismatch between training and inference silently corrupts every prediction — the #1 deployment bug in vision.',
      'Changing two hyperparameters in one "ablation". You learn nothing attributable; one variable per run is the whole method.',
      'Reporting the last epoch\'s accuracy instead of the best checkpoint\'s. Your trainer already saves best-by-val — use it, and say which you report.',
      'Skipping the look-at-the-images step because the matrix "already shows it". The matrix says WHAT confuses; the pixels say WHY — and whether it is even fixable.',
      'Assuming CNN superiority means "more parameters". The CNN wins with FEWER parameters via sharing — check the counts you computed.',
    ],
    quiz: [
      {
        q: 'Why does a CNN beat an equally-sized MLP on images?',
        o: [
          'It has more parameters to memorize with',
          'Weight sharing: small filters reused across locations exploit locality and translation tolerance',
          'It trains with a better loss function',
          'It sees the images at higher resolution',
        ],
        x: 1,
        w: 'A conv filter learns a local pattern once and applies it everywhere, so it needs far fewer parameters and generalizes across positions — the two priors images actually have.',
        revisit: 90,
      },
      {
        q: 'Your model outputs go through softmax, then into nn.CrossEntropyLoss. The result is…',
        o: [
          'Correct — the loss needs probabilities',
          'A double softmax: training still runs but gradients shrink and accuracy plateaus below par',
          'A runtime shape error',
          'NaN loss immediately',
        ],
        x: 1,
        w: 'CrossEntropyLoss = log-softmax + NLL internally. Feeding probabilities instead of logits soft-squashes everything twice — a silent degrader, not a crash.',
        revisit: 90,
      },
      {
        q: 'predict.py skips the Normalize((0.1307,), (0.3081,)) transform the training pipeline used. Likely outcome?',
        o: [
          'Identical predictions — normalization only matters during training',
          'Systematically degraded predictions: inputs arrive in a range the network never saw',
          'An exception, since the model checks input statistics',
          'Faster inference with equal accuracy',
        ],
        x: 1,
        w: 'The network\'s weights are calibrated to normalized inputs. Unnormalized pixels land far from the training distribution — predictions degrade silently, with no error raised.',
        revisit: 90,
      },
    ],
    resources: [
      { label: 'PyTorch — Learn the Basics (full FashionMNIST workflow)', url: 'https://docs.pytorch.org/tutorials/beginner/basics/intro.html', type: 'docs', time: '30 min' },
      { label: 'fast.ai — Practical Deep Learning (vision lessons)', url: 'https://course.fast.ai/', type: 'course', time: '30 min' },
      { label: '3Blue1Brown NN playlist — the digit-recognition thread throughout', url: 'https://www.youtube.com/playlist?list=PLZHQObOWTQDNU6R1_67000Dx_ZCJB-3pi', type: 'video', time: '15 min' },
      { label: 'Dive into Deep Learning — convolutional networks chapter', url: 'https://d2l.ai/', type: 'book', time: '25 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up + reread playbook.md', minutes: 10 },
      { activity: 'Milestone 1: MLP baseline with sanity checks', minutes: 30 },
      { activity: 'Milestone 2: CNN + three ablations', minutes: 35 },
      { activity: 'Milestone 3: error analysis + predict.py', minutes: 25 },
      { activity: 'Practice: one-change improvement attempt', minutes: 10 },
      { activity: 'Quiz + flashcards + commit the lab', minutes: 10 },
    ],
    completion: [
      'Both accuracy targets hit and recorded (MLP ≥ 97%, CNN ≥ 98.5%)',
      'experiments.md has baseline + 3 ablations + 1 hypothesis run, all with conclusions',
      'Confusion pair examined in pixels with verdicts tallied',
      'predict.py works standalone on exported PNGs',
      'Lab folder committed; quiz ≥ 2/3',
    ],
    connections: {
      back: 'Everything assembles: Day 85\'s layers, Day 88\'s loop and trainer.py, Day 89\'s playbook and sanity checks, Day 75\'s confusion matrix, and Day 80\'s stare-at-the-errors discipline.',
      forward: 'Day 91 refactors this lab into the Day-82 project template. The experiment-log habit becomes eval discipline on Day 134, predict.py\'s clean contract becomes the API seam Day 148 containerizes, and Day 99 repeats this arc — train, watch curves, analyze — on your own GPT.',
    },
    flashcards: [
      { f: 'The two priors convolutions encode?', b: 'Locality (patterns are local strokes) and translation tolerance (same filter reused everywhere).' },
      { f: 'What does nn.CrossEntropyLoss expect as input?', b: 'Raw logits — it applies log-softmax internally. Never add your own softmax before it.' },
      { f: 'Definition of a proper ablation?', b: 'One change vs a fixed baseline, same seed, logged with outcome and a conclusion.' },
      { f: 'Pre-training sanity rituals?', b: 'Initial loss ≈ ln(num_classes); overfit one batch to ~0. Both catch wiring bugs before you burn hours.' },
      { f: 'What must inference code share with training code?', b: 'The exact input transforms (normalization etc.). Mismatch = silent degradation.' },
      { f: 'What does max pooling do?', b: 'Keeps the strongest activation per window (e.g. 2×2) — downsamples and adds translation tolerance.' },
    ],
    deepDive: [
      { label: 'Swap in FashionMNIST', note: 'Change one string in the dataset constructor and rerun everything. Same shapes, harder problem (~92% is respectable). Watching your identical pipeline score lower teaches more about dataset difficulty than any blog post.' },
    ],
  },
  {
    id: 'd091', day: 91, week: 13, phase: 5, kind: 'review',
    title: 'Week 13 Checkpoint — The First Neural Check',
    analogy: 'The first neural check',
    objectives: [
      'Reproduce the week\'s core mechanics from memory: forward pass, backprop rules, the five-beat loop',
      'Write a correct "how backpropagation works" explanation unaided, then diff it against your Day-86 notes',
      'Refactor the MNIST lab into the Day-82 project template with configs and a clean module layout',
      'Clear the week\'s flashcard deck and re-quiz the topics you missed',
    ],
    prereqs: [
      { day: 85, label: 'Neurons & forward pass' },
      { day: 86, label: 'Backprop & micrograd' },
      { day: 88, label: 'Training loops' },
      { day: 90, label: 'MNIST lab' },
    ],
    eli5: `A week ago a "neural network" was a diagram in other people's blog posts. Seven days later you have hand-computed a forward pass, written an autograd engine, and trained a convolutional network to read handwriting at 98.5% accuracy. That is an enormous amount of new circuitry in your head — and untended, half of it will be gone by Friday. Today is maintenance day, and maintenance means retrieval, not rereading.

The forgetting curve is steep but honest: every time you successfully drag a memory out with effort — closed book, blank page — the curve flattens. Rereading feels productive and does almost nothing; recalling feels uncomfortable and does almost everything. So today you write backprop from memory and only THEN open Day 86 to diff. You recite the five-beat loop with your editor closed. You re-derive parameter counts on paper. The second half is a different kind of consolidation: refactoring the MNIST lab into your standard project template — because restructuring code you wrote two days ago forces you to re-understand every line, and it leaves you a clean scaffold the GPT labs will reuse.`,
    why: `Week 14 (attention, transformers, GPT) assumes this week is load-bearing: attention is dot products flowing through the same autograd, and Day 97's model trains with the same five beats. Any gap now compounds. There is also a career muscle here — "explain backprop" is a top-five interview question for AI roles, and the difference between having read it and having WRITTEN it from memory is exactly what an interviewer hears. The refactor drill trains the notebook-to-module skill that separates lab work from shippable code.`,
    tech: `### Why retrieval, spaced

Spaced repetition schedules a memory's next review just before it would fade (SM-2-lite in this program). This week added heavy procedural knowledge — derivation chains and code rituals — which decays faster than facts unless practiced as procedures. Hence today's drills are WRITE-from-blank, not recognize-from-list: recognition is a lower bar that flatters you.

### What must be automatic after today

- Forward: a = g(Wx + b); layer shapes (out, in); parameter count in·out + out per layer.
- Backward: +, ×, tanh local rules; += accumulation; reverse topological order; zero grads each step.
- The loop: forward → loss → zero_grad → backward → step; eval() + no_grad for validation; checkpoint = model + optimizer state.
- Dynamics: the four curve signatures and first-line treatments; initial-loss ≈ ln(C) sanity; overfit-one-batch ritual.

### The refactor target

Day 82's template gave you a shape: \`src/\` modules (data, model, train, predict), a config file driving hyperparameters, tests, and a README. The MNIST lab currently lives in flat scripts. Migrating it means: models into \`src/models.py\` (MLP + SmallCNN classes), data pipeline into \`src/data.py\` (transforms defined ONCE, imported by both training and inference — killing the transform-mismatch bug class permanently), the trainer already reusable, and a \`config.yaml\` or dataclass holding lr/batch/epochs so ablations become config diffs instead of code edits. The test suite asserts the sanity rituals: initial loss ≈ ln(10), one batch overfits, predict.py round-trips an exported image. That structure is the skeleton Days 97–99 build on.`,
    viz: null,
    guided: [
      {
        title: 'Drill 1 — backprop from a blank page',
        minutes: 25,
        body: `1. Close every editor tab and note. On paper or a blank file, write "How backpropagation works" in two registers: five sentences for a smart non-engineer, then a technical version with the local rules for +, ×, and tanh, why gradients accumulate with +=, and why order must be reverse-topological.
2. Still from memory: write the Value.__mul__ method including its _backward.
3. NOW open Day 86 and your micrograd_mine.py. Diff honestly. Mark every omission in red — each red mark becomes a flashcard.
4. Grade yourself: 0–2 misses = solid; 3–5 = revisit Day 86's tech section tonight; 6+ = redo guided 1 of Day 86 tomorrow morning.
5. Repeat the exercise for the five-beat loop: write it from memory with the two mode toggles, then diff against trainer.py.`,
      },
      {
        title: 'Drill 2 — rapid-fire recall set',
        minutes: 15,
        body: `Answer on paper, then check (answers in your Week-13 notes):
1. Parameters in a 784-256-10 MLP? In a 3×3 conv layer, 1→16 channels, with bias?
2. z = [-3, 0.5, 2] → ReLU → ? → and the local gradient at each entry?
3. dL/da for c = a·b, a = 4, b = -0.5, dL/dc = 2?
4. Initial cross-entropy loss for a 26-class problem, and why?
5. Which two layers behave differently under model.eval(), and how?
6. Your model\'s val loss bottomed at epoch 12 of 50 — which checkpoint ships, and what two treatments do you try next?
Score /6 in your error log; anything missed maps to a revisit day (85, 86, 88, 89).`,
      },
    ],
    practice: [
      {
        title: 'The cold-start rebuild',
        minutes: 20,
        body: `In a fresh directory with only PyTorch installed, rebuild the two-arcs classifier (Day 88) COMPLETELY from memory in 20 minutes: data synth, model, five-beat loop, val accuracy print. No peeking at trainer.py.

Constraints: timer visible; whatever is unfinished at 20 minutes gets finished with the reference open, and every line you needed to look up gets written on a flashcard.

Hint: this is the exact fluency bar interviews and incident channels demand — the loop should flow out of your fingers by now.`,
      },
    ],
    project: {
      title: 'MNIST lab, production-shaped',
      brief: `Refactor \`mnist-lab/\` into the Day-82 template: \`src/data.py\` (transforms + loaders, defined once), \`src/models.py\` (MLP, SmallCNN), \`src/train.py\` (config-driven entry point), \`src/predict.py\` (imports the SAME transform from data.py), \`config.yaml\` (or a dataclass) for all hyperparameters, and \`tests/\` asserting the two sanity rituals plus a predict round-trip on a bundled sample image. Update the README with the week's headline numbers. Finish by re-running one ablation purely as a config change — zero code edits — to prove the structure earns its keep.`,
      rubric: [
        'Template layout matches Day 82: src modules, config, tests, README',
        'Transforms defined exactly once and imported by both train and predict paths',
        'Tests pass: initial-loss sanity, overfit-one-batch, predict round-trip',
        'One ablation reproduced via config diff only',
        'Backprop-from-memory writeup committed with self-grade and red marks',
        'Rapid-fire score and cold-start result logged in the error log',
      ],
    },
    mistakes: [
      'Rereading notes instead of retrieving. Recognition feels like knowledge; only effortful recall builds the durable trace — blank page first, notes second.',
      'Skipping the diff step after writing from memory. The diff IS the lesson: unmarked gaps stay gaps.',
      'Refactoring by copy-paste without re-running the tests and targets. A refactor that was never re-validated is a rewrite with extra confidence.',
      'Leaving two copies of the normalize transform alive after the refactor. The whole point is one source of truth for the train/inference contract.',
      'Treating a bad rapid-fire score as failure. It is the system working — each miss is now scheduled for repair instead of silently compounding into Week 14.',
      'Grinding new material today "to stay ahead". Consolidation day consolidates; attention arrives tomorrow either way.',
    ],
    quiz: [
      {
        q: 'In your micrograd engine, why must _backward functions run in reverse topological order?',
        o: [
          'It is faster than any other order',
          'Each node\'s rule needs the complete gradient of its output, which only exists after all downstream nodes fired',
          'Python dictionaries require sorted keys',
          'To prevent gradients from accumulating',
        ],
        x: 1,
        w: 'A node distributes blame based on dL/d(its output). If a downstream consumer hasn\'t contributed its share yet, the node would route an incomplete gradient. Reverse topo order guarantees completeness.',
        revisit: 86,
      },
      {
        q: 'Which sequence correctly validates during training?',
        o: [
          'model.train(); with torch.no_grad(): evaluate',
          'model.eval(); evaluate with gradients enabled',
          'model.eval(); with torch.no_grad(): evaluate; then model.train() before resuming',
          'Just call evaluate — modes are automatic',
        ],
        x: 2,
        w: 'Eval mode fixes dropout/batch-norm behavior, no_grad stops graph recording, and forgetting to switch BACK to train() silently freezes those layers for the rest of training.',
        revisit: 88,
      },
      {
        q: 'Your CNN\'s val accuracy dropped 1.5 points after the refactor, with identical config and seed. The first suspect is…',
        o: [
          'PyTorch version drift',
          'The data pipeline — e.g. a transform lost or duplicated in the move',
          'The GPU',
          'Random chance; ignore it',
        ],
        x: 1,
        w: 'Same code + same config + same seed should reproduce. The component most often mangled in refactors is the data path — check transforms and split logic before anything else. (Day 90\'s mismatch bug, wearing a new disguise.)',
        revisit: 90,
      },
    ],
    resources: [
      { label: 'Karpathy — Zero to Hero hub (re-skim the micrograd chapter summary)', url: 'https://karpathy.ai/zero-to-hero.html', type: 'course', time: '10 min' },
      { label: '3Blue1Brown NN playlist — rewatch the backprop chapter at 1.5x', url: 'https://www.youtube.com/playlist?list=PLZHQObOWTQDNU6R1_67000Dx_ZCJB-3pi', type: 'video', time: '15 min' },
      { label: 'PyTorch — Learn the Basics (spot-check anything you missed in drills)', url: 'https://docs.pytorch.org/tutorials/beginner/basics/intro.html', type: 'docs', time: '15 min' },
    ],
    schedule: [
      { activity: 'Flashcard deck: all due cards from Days 85–90', minutes: 15 },
      { activity: 'Drill 1: backprop + loop from a blank page, then diff', minutes: 25 },
      { activity: 'Drill 2: rapid-fire recall set, scored', minutes: 15 },
      { activity: 'Practice: 20-minute cold-start rebuild', minutes: 20 },
      { activity: 'Project: refactor MNIST lab into the template', minutes: 35 },
      { activity: 'Cumulative quiz + schedule revisits for misses', minutes: 10 },
    ],
    completion: [
      'Backprop writeup graded with ≤ 5 red marks (or revisit scheduled)',
      'Rapid-fire ≥ 5/6 (misses added to the error log with revisit days)',
      'Cold-start rebuild reached a training loop within 20 minutes',
      'Refactored lab passes tests; ablation-by-config demonstrated',
      'Quiz ≥ 2/3; deck cleared',
    ],
    connections: {
      back: 'Everything drilled today was built on Days 85–90; the refactor target is Day 82\'s template; the error-log ritual continues the Day-28 interview log.',
      forward: 'Tomorrow embeddings open Week 14, and every day of it leans on this week: attention (Day 94) is dot products + softmax through autograd, the GPT (Day 97) is nn.Modules in your refactored template shape, and its training (Day 99) is trainer.py verbatim.',
    },
    flashcards: [
      { f: 'Why does retrieval beat rereading for retention?', b: 'Effortful recall strengthens the memory trace and flattens the forgetting curve; recognition barely does.' },
      { f: 'The week-13 automatic list?', b: 'Forward algebra + shapes; backprop local rules + topo order; five-beat loop + modes; four curve signatures.' },
      { f: 'Single source of truth the MNIST refactor enforces?', b: 'Input transforms defined once in data.py, imported by both training and inference.' },
      { f: 'What makes an ablation config-diff-able?', b: 'All hyperparameters live in config, not code — so experiments are diffs, reproducible and reviewable.' },
      { f: 'Post-refactor metric drop: first check?', b: 'The data pipeline (transforms, splits) — the most commonly mangled piece in a refactor.' },
    ],
    deepDive: [
      { label: 'Karpathy — Becoming a Backprop Ninja (makemore part 4)', note: 'If drills felt easy: this Zero-to-Hero installment backprops through a full MLP by hand at the tensor level, no autograd. The graduate version of Day 86.' },
    ],
  },
  {
    id: 'd092', day: 92, week: 14, phase: 5, kind: 'lesson',
    title: 'Embeddings — Meaning as Geometry',
    analogy: 'The map of meaning',
    objectives: [
      'Contrast one-hot and dense representations and say what similarity each can express',
      'Compute cosine similarity between embeddings and rank nearest neighbors in NumPy',
      'Demonstrate analogy structure (king − man + woman ≈ queen) with vector arithmetic',
      'Distinguish word embeddings from sentence embeddings and name a use for each',
      'Explain why domain shift degrades embedding quality and how you would detect it',
    ],
    prereqs: [
      { day: 50, label: 'Dot products & cosine similarity' },
      { day: 79, label: 'PCA for visualization' },
      { day: 85, label: 'Layers & learned representations' },
    ],
    eli5: `Imagine a map where cities are placed not by geography but by meaning. "Coffee" sits a short walk from "espresso," a moderate stroll from "breakfast," and a transcontinental flight from "carburetor." Nobody drew this map by hand — it was learned by reading billions of sentences and nudging words that keep similar company (Day 93 shows exactly how) until distance on the map matched relatedness in life.

An embedding is a point on that map: a list of a few hundred coordinates for each word, sentence, or document. The magic is that the map's directions mean something too. The walk from "man" to "woman" is roughly the same arrow as from "king" to "queen" — so arithmetic like king − man + woman lands you near "queen." Compare that with the naive alternative: giving every word its own unrelated ID (one-hot), where every pair of words is exactly equally far apart and "coffee" is as unrelated to "espresso" as to "carburetor." The map is why modern search can find "how do I get my money back" in a document titled "refund policy" — no shared words, close coordinates. Every LLM starts by placing your tokens on such a map; everything after is geometry.`,
    why: `Embeddings are the single load-bearing abstraction of applied AI: retrieval (Day 115's vector database is literally a warehouse of these points), semantic search, deduplication, recommendation, clustering support tickets, and the first layer of every transformer. As an FDE you will pick embedding models for customers, explain why search "understands synonyms," and debug the day it stops working — usually domain shift: a model trained on web prose making a jumbled map of medical or legal jargon. Today's geometry vocabulary — cosine, neighbors, drift — is the working language of half your future projects.`,
    tech: `### From one-hot to dense

A one-hot vector over a 50k vocabulary is 50,000 dims with a single 1. Every pair of distinct words has dot product 0 — the representation cannot express similarity at all, and models must learn every word from scratch. A dense embedding maps each word to ~100–1,000 learned floats. In PyTorch this is \`nn.Embedding(vocab, dim)\` — mechanically a lookup table of rows, mathematically a linear layer applied to a one-hot, trained by the same backprop as everything else. Similar training signal → similar rows: similarity becomes GEOMETRY.

### Measuring closeness

Cosine similarity (Day 50) is the standard: cos(a, b) = a·b / (|a||b|) ∈ [−1, 1], direction without magnitude — document length shouldn't change its topic. Common practice: L2-normalize all embeddings once, after which cosine is just a dot product and a matrix of similarities is one matmul. Nearest-neighbor search = "highest cosine to the query" — exact scan today; Day 115 makes it approximate and fast at millions of vectors.

### Structure: analogies and directions

In good word-embedding spaces, consistent relations become consistent offsets: gender, tense, country→capital. king − man + woman ≈ queen is real (with caveats — it works for famous pairs, degrades for rare words). The deeper point survives at every scale: DIRECTIONS in the space carry meaning.

### Words vs sentences, and where maps fail

Word embeddings (word2vec-era, Day 93) give one fixed vector per word — "bank" gets one point despite two meanings. Sentence embeddings, produced by transformer encoders (sentence-transformers and API embedding endpoints), map whole passages to single vectors and power RAG retrieval. Two failure modes to carry forever: **polysemy** (fixed vectors average meanings; contextual models, Day 95, fix this) and **domain shift** — an embedding model never trained on your customer's oil-rig maintenance logs places their jargon poorly, and retrieval quietly returns junk. Detection: eyeball nearest neighbors for domain terms, and run a small labeled retrieval eval (Day 136 formalizes this).`,
    viz: 'embed-space',
    guided: [
      {
        title: 'Build the map by hand — cosine and neighbors',
        minutes: 20,
        body: `1. The starter defines a tiny 8-word embedding table (3-dim, hand-set so the geometry is legible).
2. Before running: predict the nearest neighbor of "coffee" and whether "coffee"–"tea" beats "coffee"–"engine".
3. Implement cosine_sim(a, b), then most_similar(word, k) that ranks the other 7 by cosine. Confirm predictions.
4. Now one-hot the same vocabulary (8-dim identity) and compute all pairwise cosines. Observe: every off-diagonal is exactly 0 — one-hot cannot rank ANY similarity.
5. Normalize the dense table once (divide rows by norms), recompute all similarities as sims = E @ E.T, and confirm it matches your pairwise loop.`,
        code: `import numpy as np

words = ['coffee', 'tea', 'espresso', 'cup',
         'engine', 'wheel', 'carburetor', 'road']
E = np.array([
    [0.9, 0.8, 0.1],   # coffee
    [0.8, 0.9, 0.1],   # tea
    [0.95, 0.7, 0.1],  # espresso
    [0.6, 0.6, 0.3],   # cup
    [0.1, 0.2, 0.9],   # engine
    [0.1, 0.1, 0.85],  # wheel
    [0.05, 0.15, 0.95],# carburetor
    [0.2, 0.1, 0.7],   # road
])

def cosine_sim(a, b):
    return a @ b / (np.linalg.norm(a) * np.linalg.norm(b))

def most_similar(word, k=3):
    i = words.index(word)
    sims = [(w, cosine_sim(E[i], E[j]))
            for j, w in enumerate(words) if j != i]
    return sorted(sims, key=lambda t: -t[1])[:k]

print(most_similar('coffee'))
print(most_similar('carburetor'))

onehot = np.eye(8)
print('one-hot cosine coffee/espresso:',
      cosine_sim(onehot[0], onehot[2]))   # 0.0 — no similarity exists

En = E / np.linalg.norm(E, axis=1, keepdims=True)
sims = En @ En.T                          # all pairs in one matmul
print(np.round(sims, 2))`,
      },
      {
        title: 'Analogy arithmetic and a 2D map',
        minutes: 20,
        body: `1. Extend the table with gendered royalty (starter): man, woman, king, queen, prince, princess, with coordinates where dimension 2 encodes "royalty" and dimension 1 encodes gender.
2. Compute v = E[king] − E[man] + E[woman] and rank all words by cosine to v (excluding the three inputs). "queen" must win. Then try prince − man + woman.
3. Project the full 14-word table to 2D with PCA (Day 79 payoff — sklearn's PCA or your own SVD) and print/plot coordinates. The drink cluster, the car cluster, and the royalty axis should be visibly separated.
4. In one sentence: what property of the SPACE (not the individual points) makes the analogy work?`,
        code: `royal_words = ['man', 'woman', 'king', 'queen', 'prince', 'princess']
R = np.array([
    [ 1.0, 0.1, 0.1],   # man      (dim0: male direction)
    [-1.0, 0.1, 0.1],   # woman
    [ 1.0, 0.9, 0.1],   # king     (dim1: royalty)
    [-1.0, 0.9, 0.1],   # queen
    [ 1.0, 0.7, 0.1],   # prince
    [-1.0, 0.7, 0.1],   # princess
])
vocab = words + royal_words
V = np.vstack([E, R])

def analogy(a, b, c):
    """a - b + c -> ranked candidates."""
    v = V[vocab.index(a)] - V[vocab.index(b)] + V[vocab.index(c)]
    sims = [(w, cosine_sim(v, V[i])) for i, w in enumerate(vocab)
            if w not in (a, b, c)]
    return sorted(sims, key=lambda t: -t[1])[:3]

print(analogy('king', 'man', 'woman'))     # queen on top`,
      },
    ],
    practice: [
      {
        title: 'A semantic search engine in 30 lines',
        minutes: 20,
        body: `Build \`search(query_vec, doc_vecs, k)\` over a toy corpus: 12 one-line "documents" you write across three topics (e.g. billing, shipping, technical support), each assigned a hand-crafted 4-dim embedding where each topic owns a direction (leave one dimension for "urgency" and give two docs high urgency). Return the top-k docs with scores. Then demonstrate: (1) a billing-flavored query vector retrieves billing docs even though you never string-match; (2) an off-map query (all zeros except the unused corner of the space) returns garbage rankings with LOW top scores — and write one sentence on why a production system should threshold on the score rather than blindly take top-k.

Constraints: normalize everything once; the ranking must be a single matmul plus argsort. Hints: np.argsort(-scores)[:k]; the garbage case is domain shift in miniature.`,
      },
    ],
    project: {
      title: 'embedding_geometry.py — the demo you will reuse in customer calls',
      brief: `Commit \`embedding_geometry.py\`: the hand-set vocabulary, cosine/most_similar/analogy functions, the one-hot contrast, the PCA map, and the toy semantic-search engine with its domain-shift demonstration — each behind a small function with a docstring, orchestrated by a \`__main__\` that narrates the story in printed sections. Requirement: someone who has never heard the word "embedding" can run this file top to bottom and follow the printed narrative. This is genuinely a demo you can re-give on Day 115 (with a real vector DB) and in FDE conversations; write the prints like you are presenting.`,
      rubric: [
        'most_similar and analogy produce the documented results (queen wins)',
        'One-hot contrast prints the all-zeros similarity structure with a narrating comment',
        'PCA map shows three separated clusters (coordinates printed or plotted)',
        'Search engine ranks by one matmul; billing query retrieves billing docs',
        'Domain-shift demo shows low scores and the thresholding lesson in a printed sentence',
        'Runs top-to-bottom as a narrated story; committed',
      ],
    },
    mistakes: [
      'Using Euclidean distance on unnormalized embeddings and wondering why long documents cluster together. Magnitude often tracks length/frequency; cosine (or normalize-then-dot) compares direction — meaning.',
      'Believing one vector per word is enough. "Bank" has one point but two meanings; fixed embeddings average them. Contextual embeddings (Day 95) exist for exactly this.',
      'Treating analogy arithmetic as a reliable production tool. It is a beautiful diagnostic of space structure, not an API — it degrades off the famous examples.',
      'Comparing embeddings produced by DIFFERENT models. Each model learns its own coordinate system; cosine across models is meaningless. Re-embed everything when you switch models (a real re-indexing cost on Day 115).',
      'Assuming an embedding model works on your domain because its benchmark scores are high. Benchmarks are web-prose; your customer\'s jargon may be off the map. Spot-check neighbors before trusting retrieval.',
      'Forgetting that nn.Embedding is trained, not given. The map is learned by gradient descent like every other layer — tomorrow you train one yourself.',
    ],
    quiz: [
      {
        q: 'Why can\'t one-hot vectors express that "coffee" and "espresso" are related?',
        o: [
          'They are too low-dimensional',
          'Every pair of distinct one-hot vectors has dot product 0 — all words are equally dissimilar',
          'They cannot be normalized',
          'They only work for small vocabularies',
        ],
        x: 1,
        w: 'One-hot vectors are orthogonal by construction: similarity is identically zero between any two different words. Dense embeddings exist precisely to give similarity somewhere to live.',
        revisit: 92,
      },
      {
        q: 'Your customer\'s search retrieves nonsense for their drilling-equipment jargon, though it works fine on general questions. Most likely cause?',
        o: [
          'The vector database index is corrupted',
          'Domain shift — the embedding model never learned their jargon, so those terms are poorly placed',
          'Cosine similarity is the wrong metric',
          'The queries are too short',
        ],
        x: 1,
        w: 'Embedding models place well only what they saw in training. Out-of-domain vocabulary lands in ill-fitting regions and neighbors become arbitrary. Detect by inspecting neighbors of domain terms; fix with better-suited or adapted models.',
        revisit: 92,
      },
      {
        q: 'king − man + woman ≈ queen works because…',
        o: [
          'The model memorized the analogy during training',
          'Consistent relations (like gender) are encoded as roughly consistent DIRECTIONS, so offsets transfer between word pairs',
          'queen is the most frequent royal word',
          'Cosine similarity is symmetric',
        ],
        x: 1,
        w: 'The space encodes relations as offsets: the man→woman arrow is approximately the king→queen arrow. Add the offset to king\'s position and you land near queen.',
        revisit: 92,
      },
    ],
    resources: [
      { label: 'Sentence-Transformers documentation (what production sentence embeddings look like)', url: 'https://sbert.net/', type: 'docs', time: '20 min' },
      { label: 'Pinecone Learning Center — vector embeddings explainers', url: 'https://www.pinecone.io/learn/', type: 'article', time: '20 min' },
      { label: '3Blue1Brown — Essence of Linear Algebra (dot-product chapter, with new eyes)', url: 'https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab', type: 'video', time: '10 min' },
      { label: 'Hugging Face LLM Course — the embeddings/representations sections', url: 'https://huggingface.co/learn/llm-course/chapter1/1', type: 'course', time: '20 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: Day 50 cosine cards + Week 13 due cards', minutes: 10 },
      { activity: 'ELI5 + tech read; explore the embed-space visualizer', minutes: 25 },
      { activity: 'Guided: cosine + neighbors, analogies + PCA map', minutes: 40 },
      { activity: 'Practice: the 30-line semantic search engine', minutes: 20 },
      { activity: 'Project: assemble and narrate embedding_geometry.py', minutes: 15 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'most_similar, analogy, and the one-hot contrast all reproduce documented results',
      'PCA map rendered with three visible clusters',
      'Search engine demo works, including the domain-shift low-score case',
      'embedding_geometry.py committed as a runnable narrated demo',
      'Quiz ≥ 2/3',
    ],
    connections: {
      back: 'Cosine similarity is Day 50\'s alignment score finally meeting its destiny; the 2D map is Day 79\'s PCA; and nn.Embedding is just a Day-85 layer whose rows are looked up instead of multiplied.',
      forward: 'Tomorrow (Day 93) you TRAIN one of these maps with word2vec. Day 94\'s attention computes query-key dot products — retrieval inside the network. Day 115 industrializes today\'s search loop into a vector database, and Day 136 turns "are the neighbors right?" into formal retrieval evals.',
    },
    flashcards: [
      { f: 'One-hot vs dense embedding, one line each?', b: 'One-hot: orthogonal IDs, zero expressible similarity. Dense: learned coordinates where distance ≈ relatedness.' },
      { f: 'Why cosine over Euclidean for embeddings?', b: 'Direction carries meaning; magnitude often tracks length/frequency. Normalize once, then cosine = dot product.' },
      { f: 'What makes analogy arithmetic possible?', b: 'Relations encoded as consistent directions/offsets in the space (man→woman ≈ king→queen).' },
      { f: 'Can you compare vectors from two different embedding models?', b: 'No — each model has its own coordinate system. Switching models means re-embedding the corpus.' },
      { f: 'Domain shift in embeddings — symptom and check?', b: 'Retrieval degrades on jargon the model never saw. Check: inspect nearest neighbors of domain terms; run a small labeled eval.' },
      { f: 'What is nn.Embedding mechanically?', b: 'A trainable lookup table of vectors — equivalent to a linear layer on one-hots, learned by backprop.' },
    ],
    deepDive: [
      { label: 'Embed real sentences locally', url: 'https://sbert.net/', note: 'pip install sentence-transformers, load all-MiniLM-L6-v2, embed 20 sentences of your own across 3 topics, and rerun today\'s PCA map on REAL vectors. Watching your hand-built geometry appear in a production model is the payoff.' },
    ],
  },
  {
    id: 'd093', day: 93, week: 14, phase: 5, kind: 'lesson',
    title: 'word2vec Lab',
    analogy: 'Words known by their company',
    objectives: [
      'State the distributional hypothesis and explain how it turns raw text into a training signal',
      'Describe skip-gram training: predict context words from a center word',
      'Explain negative sampling and why it replaces a full-vocabulary softmax',
      'Train a tiny word2vec from scratch in NumPy and verify that neighbors become sensible',
      'Name the limitation (one vector per word) that leads to contextual embeddings',
    ],
    prereqs: [
      { day: 92, label: 'Embedding geometry & cosine' },
      { day: 86, label: 'Gradients & update rules' },
      { day: 72, label: 'Sigmoid & logistic loss' },
    ],
    eli5: `"You shall know a word by the company it keeps," wrote the linguist J.R. Firth in 1957 — and half a century later that one sentence trained the first great meaning-maps. You have never tasted "quvra," but if you read "she poured a glass of chilled quvra," "quvra pairs well with fish," and "this quvra is a bit dry," you know it's a wine-like drink. Not from a definition — from its neighbors.

word2vec (Mikolov et al., 2013) mechanizes this. Slide a window over billions of sentences. For each center word, play a guessing game: which words appear near me? Every word starts at a random spot on the map (Day 92's map, before it means anything). Each time two words co-occur, nudge their vectors a little closer; each time you sample a random word that did NOT co-occur, nudge it a little away. That second trick — compare against a few random "impostors" instead of the whole dictionary — is negative sampling, and it's why the whole thing is cheap enough to run on a laptop. Repeat a few million times and "coffee" has drifted next to "tea" without anyone ever defining either. Today you build the entire game in NumPy and watch a random cloud organize itself into meaning.`,
    why: `word2vec is the conceptual ancestor of everything you will deploy: modern sentence embedders and LLM token embeddings are descendants of this exact idea, and "predict the neighbors" is one step from "predict the next token" — Day 97's GPT objective. Practically, negative sampling (turning an intractable softmax into a few binary classifications) is a trick you will re-meet in recommendation systems and contrastive learning. And when a customer asks "how does the machine know synonyms?", the honest, demo-able answer is today's lab — you can train one in front of them in two minutes.`,
    tech: `### Skip-gram with negative sampling (SGNS)

Corpus → training pairs: for each position, the center word c and each context word o within a window of ±k form a positive pair (c, o). The model holds TWO embedding tables: W_in (center vectors — the ones you keep) and W_out (context vectors). The naive objective — softmax over the whole vocabulary for every pair — costs O(V) per update; at V = 100k that is the whole game lost.

**Negative sampling** reframes it as binary classification: for a positive pair, push σ(v_c · u_o) toward 1; for K random "negative" words n (sampled from a unigram distribution, classically raised to the 3/4 power to boost rare words), push σ(v_c · u_n) toward 0. Per positive pair the loss is:

~~~text
L = −log σ(v_c·u_o) − Σ_k log σ(−v_c·u_nk)
~~~

This is Day 72's logistic loss, and the gradients are correspondingly simple: with g = σ(v_c·u_o) − label, the updates are u_o -= lr·g·v_c and v_c -= lr·g·u_o — a handful of dot products per pair instead of a vocabulary-wide softmax. K is small (5–20). That asymmetry — the fix that made embeddings practical — is the day's most transferable idea.

### What training does to the space

Words sharing contexts receive correlated pushes and drift together; the analogy offsets of Day 92 emerge as a byproduct, uninstructed. Frequent-word subsampling (dropping some occurrences of "the") and window size (small windows → syntactic similarity; large → topical) are the knobs that shape the map.

### The ceiling

One vector per word type: "bank" in "river bank" and "bank account" gets the same point — polysemy is averaged away. Context could disambiguate, but skip-gram discards it after training. The fix is embeddings computed FROM context at read time — contextual embeddings, which is precisely what the transformer (Day 95) produces at every layer, with attention (tomorrow) as the machinery that mixes context in.`,
    viz: null,
    guided: [
      {
        title: 'Generate a corpus and build the pair pipeline',
        minutes: 15,
        body: `1. Real corpora need minutes of training; we engineer a tiny one with strong co-occurrence structure so results appear in seconds. The starter generates 400 template sentences across two worlds: beverages and vehicles, sharing function words.
2. Build the vocabulary (word ↔ index) and generate skip-gram pairs with window ±2. Print the 5 most common pairs — they should look sensible ("drink" with beverage nouns, etc.).
3. Build the negative-sampling distribution: unigram counts to the 0.75 power, normalized. Print the probability of the most and least frequent word under it, and under the raw unigram — see how 0.75 flattens the gap.
4. Sanity: count total pairs (should be several thousand).`,
        code: `import numpy as np
rng = np.random.default_rng(0)

drinks  = ['coffee', 'tea', 'espresso', 'juice']
vehicles = ['car', 'truck', 'engine', 'wheel']
templates_d = ['i drink hot NOUN every morning',
               'a cup of NOUN please',
               'she likes NOUN with sugar']
templates_v = ['the NOUN needs new parts',
               'he drives the NOUN to work',
               'fix the NOUN in the garage']

sentences = []
for _ in range(200):
    sentences.append(rng.choice(templates_d).replace('NOUN', rng.choice(drinks)))
    sentences.append(rng.choice(templates_v).replace('NOUN', rng.choice(vehicles)))

tokens = [s.split() for s in sentences]
vocab = sorted({w for s in tokens for w in s})
stoi = {w: i for i, w in enumerate(vocab)}
V = len(vocab)

pairs = []
for sent in tokens:
    ids = [stoi[w] for w in sent]
    for i, c in enumerate(ids):
        for j in range(max(0, i - 2), min(len(ids), i + 3)):
            if j != i:
                pairs.append((c, ids[j]))
print(len(pairs), 'training pairs,', V, 'words')

counts = np.zeros(V)
for s in tokens:
    for w in s:
        counts[stoi[w]] += 1
neg_dist = counts ** 0.75
neg_dist /= neg_dist.sum()`,
      },
      {
        title: 'Train SGNS and watch meaning appear',
        minutes: 25,
        body: `1. Initialize W_in and W_out as (V, 16) with small random values. BEFORE training, print the 3 nearest neighbors of "coffee" using Day 92's cosine — they will be arbitrary. Save this printout.
2. Type the training loop from the starter: 5 epochs over shuffled pairs, K=5 negatives per pair, lr 0.05. Note the gradient lines — they are Day 72's logistic gradient, nothing more.
3. Every epoch, print the running mean loss; it must fall.
4. After training, reprint the neighbors of "coffee", "engine", and "drives". Beverages should cluster, vehicle words should cluster, and the arbitrary "before" printout is your evidence of learning.
5. Optional: PCA the 16-dim vectors to 2D (Day 92's code) and admire the two islands.`,
        code: `def sigmoid(x):
    return 1 / (1 + np.exp(-x))

dim, K, lr = 16, 5, 0.05
W_in  = rng.normal(0, 0.1, (V, dim))
W_out = rng.normal(0, 0.1, (V, dim))

for epoch in range(5):
    rng.shuffle(pairs)
    total = 0.0
    for c, o in pairs:
        negs = rng.choice(V, size=K, p=neg_dist)
        # positive pair: label 1
        g = sigmoid(W_in[c] @ W_out[o]) - 1.0     # Day-72 gradient
        total += -np.log(sigmoid(W_in[c] @ W_out[o]) + 1e-9)
        grad_c = g * W_out[o]
        W_out[o] -= lr * g * W_in[c]
        # negatives: label 0
        for n in negs:
            gn = sigmoid(W_in[c] @ W_out[n])       # - 0.0
            total += -np.log(sigmoid(-W_in[c] @ W_out[n]) + 1e-9)
            grad_c += gn * W_out[n]
            W_out[n] -= lr * gn * W_in[c]
        W_in[c] -= lr * grad_c
    print(f'epoch {epoch}  mean loss {total/len(pairs):.3f}')

def neighbors(word, k=3):
    v = W_in[stoi[word]]
    sims = W_in @ v / (np.linalg.norm(W_in, axis=1) * np.linalg.norm(v) + 1e-9)
    order = np.argsort(-sims)
    return [(vocab[i], round(float(sims[i]), 2))
            for i in order if vocab[i] != word][:k]

for w in ['coffee', 'engine', 'drives']:
    print(w, '->', neighbors(w))`,
      },
    ],
    practice: [
      {
        title: 'Knob experiments',
        minutes: 20,
        body: `Run three controlled experiments on your SGNS lab (Day 90 discipline — one change, same seed, note the effect on the neighbors of "coffee" and the final loss):

1. K = 0 negatives (delete the negative loop). What happens to the space and why? (Think: what stops ALL vectors from collapsing onto each other when there is only attraction?)
2. Window ±1 vs ±4 on a corpus where you add 100 mixed sentences ("the car is near the coffee shop"). Which window keeps the clusters cleaner?
3. dim = 2 vs dim = 64. Which under- and which over-fits this tiny vocabulary?

Deliverable: 6 lines in your lab notes — experiment, observation, one-sentence explanation each.

Hint for (1): negative sampling provides the repulsive force; without it the trivial solution "make every dot product huge" scores perfectly.`,
      },
    ],
    project: {
      title: 'word2vec_lab.py + the limitation demo',
      brief: `Commit \`word2vec_lab.py\`: corpus generation, pair pipeline, SGNS training, neighbors(), before/after evidence, and your three knob experiments as toggleable functions. Then add the closing demo, \`polysemy_demo()\`: extend the corpus so the word "jam" appears in both worlds ("traffic jam on the road", "strawberry jam with tea"), retrain, and print jam's neighbors — one confused vector stretched between two meanings. End with a printed sentence: "One vector per word cannot represent context-dependent meaning; tomorrow's mechanism fixes this." That printout is your bridge to attention.`,
      rubric: [
        'Training loss falls across epochs; before/after neighbor printouts committed',
        'Beverage and vehicle clusters verified via neighbors and (optionally) the PCA map',
        'All three knob experiments logged with explanations',
        'polysemy_demo shows "jam" torn between clusters',
        'Code runs top-to-bottom in under ~2 minutes on CPU',
        'Committed with the lab notes',
      ],
    },
    mistakes: [
      'Thinking word2vec understands language. It compresses co-occurrence statistics into geometry — powerful, but "knows the company words keep," nothing deeper.',
      'Skipping negatives and wondering why every word becomes every word\'s neighbor. Attraction-only training collapses the space; negative sampling is the repulsion that keeps it structured.',
      'Using the full-softmax formulation "to be correct." Its O(V) per-step cost is exactly the problem SGNS was invented to remove; know both, implement one.',
      'Forgetting there are TWO tables. Center (W_in) and context (W_out) vectors play different roles; you keep W_in (or average them) at the end.',
      'Expecting textbook analogies from a toy corpus. Analogy structure needs corpus scale and diversity; your lab shows clustering, which is the honest claim at this size.',
      'Concluding fixed embeddings are obsolete trivia. Their limitation (polysemy) is the WHY of contextual models — interviewers love this exact narrative arc.',
    ],
    quiz: [
      {
        q: 'Negative sampling exists primarily to…',
        o: [
          'Improve embedding quality for rare words',
          'Avoid computing a softmax over the entire vocabulary for every training pair',
          'Prevent overfitting on small corpora',
          'Make embeddings non-negative',
        ],
        x: 1,
        w: 'Full softmax costs O(V) per pair. SGNS replaces it with 1 + K cheap binary classifications against sampled impostors — the efficiency trick that made word2vec practical. (The ¾-power sampling does help rare words, but that is a refinement, not the reason.)',
        revisit: 93,
      },
      {
        q: 'In skip-gram, the model is trained to…',
        o: [
          'Predict the next sentence from the current one',
          'Predict context words appearing near a given center word',
          'Reconstruct a masked-out word from both sides',
          'Classify documents by topic',
        ],
        x: 1,
        w: 'Skip-gram predicts the company a word keeps — context from center. (CBOW is the mirror: center from context; masked reconstruction describes BERT-style training.)',
        revisit: 93,
      },
      {
        q: 'The word "jam" ends up midway between the traffic cluster and the food cluster. This illustrates…',
        o: [
          'A bug in negative sampling',
          'The polysemy limit of one-vector-per-word — the motivation for contextual embeddings',
          'That the learning rate was too high',
          'That "jam" is a rare word',
        ],
        x: 1,
        w: 'A single fixed vector must average all of a word\'s senses. Contextual models (attention → transformers, Days 94–95) compute a fresh vector per occurrence, using the surrounding words.',
        revisit: 92,
      },
    ],
    resources: [
      { label: 'Jay Alammar — The Illustrated Word2vec', url: 'https://jalammar.github.io/illustrated-word2vec/', type: 'article', time: '30 min' },
      { label: 'Pinecone Learning Center — embeddings & similarity articles', url: 'https://www.pinecone.io/learn/', type: 'article', time: '15 min' },
      { label: 'Hugging Face LLM Course — from static to contextual embeddings', url: 'https://huggingface.co/learn/llm-course/chapter1/1', type: 'course', time: '20 min' },
      { label: 'Sentence-Transformers docs — the modern descendants', url: 'https://sbert.net/', type: 'docs', time: '10 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: Day 92 geometry cards', minutes: 10 },
      { activity: 'ELI5 + tech read; The Illustrated Word2vec', minutes: 30 },
      { activity: 'Guided: corpus + pairs, SGNS training with before/after', minutes: 40 },
      { activity: 'Practice: the three knob experiments', minutes: 20 },
      { activity: 'Project: polysemy demo + commit', minutes: 10 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'SGNS trains with falling loss; before/after neighbors show emerged clusters',
      'Knob experiments logged (collapse-without-negatives observed and explained)',
      'polysemy_demo committed with the bridge-to-attention printout',
      'Quiz ≥ 2/3',
    ],
    connections: {
      back: 'The map you hand-crafted on Day 92 is now LEARNED; the update rule is Day 72\'s logistic gradient applied with Day 86\'s mechanics; the one-change experiment discipline is Day 90\'s lab habit.',
      forward: 'Tomorrow attention computes context-dependent mixing — the cure for today\'s polysemy ceiling. Day 96\'s tokenizers decide what units get embedded, Day 97\'s GPT trains its embedding table jointly with everything else, and Day 115 retrieves with the industrial descendants of today\'s vectors.',
    },
    flashcards: [
      { f: 'The distributional hypothesis?', b: 'Words appearing in similar contexts have similar meanings — "known by the company they keep" (Firth).' },
      { f: 'Skip-gram vs CBOW?', b: 'Skip-gram: predict context from center. CBOW: predict center from context.' },
      { f: 'SGNS loss per positive pair?', b: '−log σ(v_c·u_o) − Σ log σ(−v_c·u_neg): one positive + K sampled negatives, all logistic.' },
      { f: 'Why does attraction-only training collapse?', b: 'Without negatives, "make all dot products huge" is a perfect trivial solution; repulsion keeps structure.' },
      { f: 'Why unigram^0.75 for negatives?', b: 'Flattens the frequency distribution — samples rare words more than raw counts would, improving their vectors.' },
      { f: 'word2vec\'s ceiling and its fix?', b: 'One vector per word averages senses (polysemy). Fix: contextual embeddings computed per occurrence — transformers.' },
    ],
    deepDive: [
      { label: 'Train on real text with gensim (local)', note: 'pip install gensim; Word2Vec(sentences from any public-domain book, vector_size=100, window=5, negative=10). Real analogies start working around a few million tokens — compare against your toy lab to feel what scale buys.' },
    ],
  },
  {
    id: 'd094', day: 94, week: 14, phase: 5, kind: 'lesson',
    title: 'Attention',
    analogy: 'Everyone looks at everyone',
    objectives: [
      'Explain the bottleneck attention solves: fixed vectors cannot carry context-dependent meaning',
      'Describe queries, keys, and values as a soft, differentiable lookup',
      'Hand-compute scaled dot-product attention on a 4-token example, exactly',
      'Implement attention in NumPy and verify it against your hand computation',
      'Explain why scores are scaled by √d_k and what multiple heads add',
    ],
    prereqs: [
      { day: 92, label: 'Embeddings & dot-product similarity' },
      { day: 93, label: 'word2vec\'s polysemy ceiling' },
      { day: 62, label: 'Softmax & distributions' },
    ],
    eli5: `Watch a good meeting. Before speaking, each person glances around the table and weighs everyone's input: for THIS question, the finance person's comment matters 45%, the two engineers 22% each, the intern's 11%. Their eventual statement is a blend of what they heard, weighted by relevance — and for the NEXT question, the weights change completely. Nobody has a fixed importance; importance is negotiated per question.

Attention runs this meeting between words. Yesterday's problem: "jam" had one frozen vector, torn between traffic and strawberries. Attention thaws it. Every token broadcasts three things: a query — "here's what I'm looking for" — a key — "here's what I offer" — and a value — "here's my actual content." Each token compares its query with everyone's keys (a dot product — Day 92's similarity), converts the match scores into percentages with a softmax, and then takes a weighted blend of everyone's values. In "traffic jam," the token "jam" finds "traffic" highly relevant and blends it in; its output vector now MEANS traffic-jam. Same word, different sentence, different vector. That per-occurrence renegotiation — everyone looks at everyone, every time — is the single mechanism the last decade of AI is built on, and today you compute one by hand, to the third decimal.`,
    why: `Attention is the "T" in GPT and the operation your future stack spends most of its money on: context windows are priced by it, long-document costs explode quadratically because of it (Day 101), and KV caching (Day 155) exists to avoid recomputing it. When you debug a model that ignores the middle of a long prompt or explain to a customer why doubling context more than doubles cost, you are reasoning about today's mechanism. Interviews test it constantly, and the difference between reciting "queries, keys, values" and having COMPUTED one is immediately audible.`,
    tech: `### The soft lookup

A dictionary lookup is hard: one key matches, you take its value. Attention is the soft version: a query q matches EVERY key k_i to a degree (dot product), the degrees become weights via softmax, and the result is a weighted sum of ALL values. Soft means differentiable — the whole lookup trains by backprop.

In self-attention, the tokens themselves are the table. Each token's embedding x_i is projected three ways with learned matrices: q_i = W_Q x_i, k_i = W_K x_i, v_i = W_V x_i. The projections are what training tunes — the network LEARNS what to ask for and what to advertise.

### The formula, then by hand

Attention(Q, K, V) = softmax(QKᵀ / √d_k) V.

Concrete 4-token example, d_k = 2. Sentence: "the cat sat down"; we compute what token 4 ("down") gathers. Its query and everyone's keys/values:

~~~text
q4 = [1, 1]
k1 = [1, 0]   v1 = [1, 0]     (the)
k2 = [0, 1]   v2 = [0, 2]     (cat)
k3 = [1, 1]   v3 = [2, 2]     (sat)
k4 = [0, 0]   v4 = [0, 0]     (down)

scores:  q4·k1 = 1,  q4·k2 = 1,  q4·k3 = 2,  q4·k4 = 0
scaled (÷ √2 ≈ 1.414):  0.707, 0.707, 1.414, 0
softmax: e^0.707 = 2.028 (twice), e^1.414 = 4.113, e^0 = 1
         sum = 9.169  →  weights = [0.221, 0.221, 0.449, 0.109]
output:  0.221·v1 + 0.221·v2 + 0.449·v3 + 0.109·v4
      =  [0.221 + 0.898,  0.442 + 0.898]  =  [1.12, 1.34]
~~~

Token 4's output is 45% "sat", 22% each "the"/"cat", 11% itself — a new, context-built vector. Stack every token's weights as rows and you get the attention matrix — the heatmap in today's visualizer.

### Why √d_k, and why many heads

Dot products of random d_k-dim vectors have variance ~d_k: at large d_k raw scores get big, softmax saturates to near one-hot, and gradients through it vanish (Day 86's saturation lesson, again). Dividing by √d_k keeps scores at unit-ish variance. Check it on our example: unscaled weights are [0.197, 0.197, 0.534, 0.072] — already sharper, and that's only d_k = 2. **Multi-head attention** runs h independent Q/K/V projections in parallel low-dim subspaces (e.g. 8 heads of d_k = 64 inside d_model = 512), letting one head track syntax while another tracks coreference, then concatenates and re-projects. Heads are parallel perspectives on the same meeting.`,
    viz: 'attention-heat',
    guided: [
      {
        title: 'The hand computation — every digit yours',
        minutes: 25,
        body: `1. On paper, reproduce the worked example WITHOUT looking at the tech section: given q4 = [1,1], keys k1..k4 = [1,0],[0,1],[1,1],[0,0], values v1..v4 = [1,0],[0,2],[2,2],[0,0].
2. Compute the four dot-product scores. Scale by √2. (Keep 3 decimals.)
3. Softmax: exponentiate (e^0.707 ≈ 2.028, e^1.414 ≈ 4.113), sum, divide. You must get [0.221, 0.221, 0.449, 0.109].
4. Blend the values: output ≈ [1.12, 1.34]. Check against the tech section only when done.
5. Repeat for token 2, whose query is q2 = [0, 2]: scores come out [0, 2, 2, 0], scaled to [0, 1.414, 1.414, 0]. Finish the softmax and blend yourself — you should land on weights ≈ [0.098, 0.402, 0.402, 0.098]. Exercise 2's code will confirm.
6. One sentence: why must each row of attention weights sum to 1?`,
      },
      {
        title: 'NumPy attention — verify, then heatmap',
        minutes: 20,
        body: `1. Implement \`attention(Q, K, V)\` in NumPy exactly as the formula reads: scores = Q @ K.T / sqrt(d_k); rowwise softmax; weights @ V.
2. Run it on the full 4-token example (starter) and confirm row 4 of the weights is [0.221, 0.221, 0.449, 0.109] and row 4 of the output is [1.12, 1.34] — your paper, vindicated. Also read off row 2 to check your step-5 answer.
3. Print an ASCII heatmap of the weight matrix (starter helper): darker = higher weight. Identify visually which token attends most to which.
4. Remove the √d_k scaling and reprint the heatmap: rows sharpen. Now set d_k = 64 with random Q/K scaled up accordingly and compare softmax outputs with and without scaling — saturation appears.`,
        code: `import numpy as np

def softmax(x, axis=-1):
    e = np.exp(x - x.max(axis=axis, keepdims=True))  # stable
    return e / e.sum(axis=axis, keepdims=True)

def attention(Q, K, V, scale=True):
    d_k = Q.shape[-1]
    scores = Q @ K.T
    if scale:
        scores = scores / np.sqrt(d_k)
    w = softmax(scores, axis=-1)
    return w @ V, w

# the 4-token example: rows are tokens (the, cat, sat, down)
Q = np.array([[1.,0.], [0.,2.], [1.,0.], [1.,1.]])   # q4 = [1,1]
K = np.array([[1.,0.], [0.,1.], [1.,1.], [0.,0.]])
V = np.array([[1.,0.], [0.,2.], [2.,2.], [0.,0.]])

out, w = attention(Q, K, V)
print(np.round(w, 3))        # row 4: [0.221 0.221 0.449 0.109]
print(np.round(out, 2))      # row 4: [1.12 1.34]

shades = ' .:-=+*#%@'
for row in w:
    print(''.join(shades[min(int(x * 10), 9)] for x in row))`,
      },
    ],
    practice: [
      {
        title: 'Make "jam" mean two things',
        minutes: 20,
        body: `Close the loop on Day 93's polysemy demo — with hand-set vectors, no training. Design a 3-token mini-world: token "jam" plus context token "traffic" OR "strawberry". Give "jam" a neutral value vector, give the two context words value vectors pointing in opposite directions (e.g. [3, 0] vs [0, 3]), and set keys/queries so that jam's query matches whichever context token is present. Run your attention() on the sequence [traffic, jam] and on [strawberry, jam], and show jam's OUTPUT vector differs strongly between the two — the same input embedding, disambiguated by context.

Constraints: use your attention() unchanged; print both output vectors and their cosine similarity (should be low).

Hints: give both context tokens the same key (say [1, 0]) and jam a query aligned with it ([2, 0]) — the mechanism does the rest through the values.`,
      },
    ],
    project: {
      title: 'attention_lab.py — the artifact interviews are made of',
      brief: `Commit \`attention_lab.py\`: softmax (stable), attention() with a scale toggle, the verified 4-token example asserting the hand-computed row ([0.221, 0.221, 0.449, 0.109] and [1.12, 1.34] within 0.005), the ASCII heatmap, the d_k = 64 saturation demonstration (print max softmax weight with and without scaling), and the jam-disambiguation demo. Add a 10-line README section: the meeting analogy in your own words, then Q/K/V in one sentence each. Day 95 imports attention() into a transformer block and Day 97 reimplements it with trainable weights in PyTorch — this file is the reference they are checked against.`,
      rubric: [
        'attention() matches the hand computation within 0.005 (asserted, not eyeballed)',
        'Row-2 self-check from guided 1 verified in code',
        'Saturation demo shows sharper weights without scaling at d_k = 64',
        'Jam demo: same token, two contexts, two distinct outputs with low cosine',
        'Heatmap renders and is interpreted in a comment',
        'README explains Q, K, V in one sentence each, own words',
      ],
    },
    mistakes: [
      'Memorizing "Q, K, V" without roles. Query = what I seek; key = what I advertise; value = what I hand over if matched. If you can\'t assign these in a sentence, re-run the meeting analogy.',
      'Forgetting softmax normalizes per ROW. Each token distributes exactly 100% of its attention across all tokens; columns need not (and don\'t) sum to anything.',
      'Dropping the √d_k "because it barely changes my toy numbers." At d_k = 64+ it is the difference between training and a saturated, gradient-dead softmax.',
      'Thinking attention weights are THE explanation of model behavior. They show information routing in one layer of many; treat heatmaps as evidence, not verdicts.',
      'Believing values are redundant with keys. Keys are for MATCHING, values are the CONTENT delivered — the jam demo only works because they differ.',
      'Missing the quadratic cost: n tokens → n×n score matrix. This single fact drives context pricing, long-context research, and Day 155\'s KV cache.',
    ],
    quiz: [
      {
        q: 'In the worked example, token 4\'s weights were [0.221, 0.221, 0.449, 0.109]. What produced the 0.449?',
        o: [
          'Token 3 had the largest value vector',
          'q4·k3 was the highest score (2), and softmax turned scores into these proportions',
          'Token 3 is closest to token 4 in position',
          'The √d_k scaling boosted token 3 specifically',
        ],
        x: 1,
        w: 'Weights come only from query–key match scores through softmax. Values determine what is blended, not how much; position plays no role in raw attention (Day 95 adds it separately).',
        revisit: 94,
      },
      {
        q: 'Why divide scores by √d_k?',
        o: [
          'To keep the weights summing to 1',
          'To make attention run faster',
          'Dot-product variance grows with d_k; unscaled scores saturate softmax and kill gradients',
          'To prevent negative scores',
        ],
        x: 2,
        w: 'Random d_k-dim dot products have variance ~d_k. Big scores push softmax to near one-hot, whose gradients vanish (the same saturation you met in tanh on Day 86). Scaling keeps the distribution trainable. Summing to 1 is softmax\'s job regardless.',
        revisit: 94,
      },
      {
        q: 'Doubling the sequence length from 1,000 to 2,000 tokens does what to the attention score computation?',
        o: [
          'Doubles it',
          'Roughly quadruples it — the score matrix is n×n',
          'Leaves it unchanged',
          'Increases it by √2',
        ],
        x: 1,
        w: 'Every token attends to every token: n² pairs. 2,000² / 1,000² = 4. This quadratic is why long context is expensive (Day 101) and why the KV cache (Day 155) matters for generation.',
        revisit: 94,
      },
    ],
    resources: [
      { label: 'Jay Alammar — The Illustrated Transformer (attention sections)', url: 'https://jalammar.github.io/illustrated-transformer/', type: 'article', time: '30 min' },
      { label: 'Attention Is All You Need (Vaswani et al., 2017) — §3.2 only today', url: 'https://arxiv.org/abs/1706.03762', type: 'paper', time: '20 min' },
      { label: '3Blue1Brown NN playlist — the attention chapter, visually', url: 'https://www.youtube.com/playlist?list=PLZHQObOWTQDNU6R1_67000Dx_ZCJB-3pi', type: 'video', time: '25 min' },
      { label: 'Dive into Deep Learning — attention mechanisms chapter', url: 'https://d2l.ai/', type: 'book', time: '20 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: Days 92–93 cards', minutes: 10 },
      { activity: 'ELI5 + tech read; 3B1B attention chapter; attention-heat visualizer', minutes: 30 },
      { activity: 'Guided: hand computation, NumPy verification + heatmaps', minutes: 45 },
      { activity: 'Practice: the jam disambiguation', minutes: 20 },
      { activity: 'Quiz + flashcards + commit attention_lab.py', minutes: 15 },
    ],
    completion: [
      'Hand computation done unaided and verified to 3 decimals (both rows)',
      'attention() asserts against the worked example; heatmaps rendered and read',
      'Saturation demo and jam demo both committed in attention_lab.py',
      'Quiz ≥ 2/3',
    ],
    connections: {
      back: 'The scores are Day 92\'s dot-product similarity; the weighting is Day 62\'s softmax; the saturation danger is Day 86\'s vanishing-gradient lesson; and the whole mechanism answers the polysemy ceiling Day 93 ended on.',
      forward: 'Day 95 wraps attention with positions, residuals, and FFNs into the transformer block; Day 97 gives Q/K/V trainable weights in your GPT; Day 101 prices the n² you met today; Day 155\'s KV cache banks the K and V you just computed.',
    },
    flashcards: [
      { f: 'Q, K, V in one line each?', b: 'Query: what I\'m looking for. Key: what I advertise. Value: the content I contribute if matched.' },
      { f: 'The attention formula?', b: 'softmax(QKᵀ/√d_k)V — match scores, normalize per row, blend values.' },
      { f: 'Why scale by √d_k?', b: 'Dot-product variance ~d_k; unscaled scores saturate softmax and gradients vanish.' },
      { f: 'What do attention rows sum to, and why?', b: '1 — softmax normalizes each token\'s outgoing attention into a distribution over all tokens.' },
      { f: 'Cost of self-attention in sequence length n?', b: 'O(n²) — every token scores against every token. The root of context-window economics.' },
      { f: 'What does multi-head add?', b: 'h parallel Q/K/V projections in subspaces — independent "perspectives" (syntax, coreference…) concatenated and re-projected.' },
    ],
    deepDive: [
      { label: 'Cross-attention vs self-attention', note: 'In translation-style encoder-decoders, queries come from one sequence and keys/values from another — the same formula, different table. You\'ll recognize it instantly in the Illustrated Transformer\'s decoder figures tomorrow.' },
    ],
  },
];
