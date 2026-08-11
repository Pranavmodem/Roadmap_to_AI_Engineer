// Days 71–84 — Phase 4, Weeks 11–12: Supervised learning, unsupervised learning,
// ML practice, and the churn phase-project. Schema per docs/authoring-guide.md.
export const DAYS_071_084 = [
  {
    id: 'd071', day: 71, week: 11, phase: 4, kind: 'lesson',
    title: 'ML Framing & Linear Regression',
    analogy: 'Drawing the best line',
    objectives: [
      'Define machine learning as a function family + loss + optimizer, and identify all three in any model',
      'Classify a problem as regression or classification and name the target and features',
      'Fit, predict, and score a scikit-learn model using the estimator API and a proper train/test split',
      'Establish a dumb baseline before any model and justify why it comes first',
      'Recognize underfitting from the gap between model capacity and data shape',
    ],
    prereqs: [
      { day: 56, label: 'Linear regression by hand (NumPy + gradient descent)' },
      { day: 55, label: 'Gradient descent lab' },
      { day: 69, label: 'Feature engineering & train/test discipline' },
    ],
    eli5: `You track your friends' rents against their apartment sizes and plot the dots. With a ruler, you eyeball a straight line through the cloud — not touching every dot, but capturing the trend. Now a friend mentions a 700-square-foot place, and you slide your finger along the ruler: "about 1,900 a month." You just did machine learning: you chose a shape (a straight line), a definition of "best" (close to the dots), and a way to find it (nudging the ruler until the misses look small).

That is the whole game, formalized. The line is the model, the total miss is the loss, and the nudging is the optimizer. On Day 56 you WERE the optimizer — you wrote the gradient-descent nudging yourself in NumPy. Today scikit-learn does the nudging in one line, and your job shifts to the part machines can't do: framing the question, choosing what counts as a miss, and checking the line against dots it has never seen.`,
    why: `Every ML system you will ship — churn models, rerankers, LLM-judge calibrators — is function + loss + optimizer underneath, and interviewers probe exactly this framing ("what's your loss? what's your baseline?"). The baseline habit is a career-saver: FDEs regularly discover mid-engagement that a customer's "AI opportunity" is beaten by predicting the historical average. Finding that out in hour one with a DummyRegressor, instead of week three with a tuned model, is the difference between credibility and embarrassment. On Day 83 your churn project is graded baseline-first.`,
    tech: `Supervised learning fits a function f(X) ≈ y from examples. Three choices define every setup: the **hypothesis class** (which shapes f can take — lines, trees, neural nets), the **loss** (how wrong a prediction is — squared error for regression, log-loss for classification tomorrow), and the **optimizer** (how to search the class for low loss — closed-form algebra, gradient descent, greedy splitting). Regression predicts a continuous y; classification predicts a category. Naming the target column and the feature columns precisely is step zero and is where real projects most often go wrong (leakage: a feature that secretly contains the answer — Day 69).

### The scikit-learn estimator API

Every model is an object with the same contract: \`model.fit(X_train, y_train)\` learns parameters, \`model.predict(X_new)\` applies them, \`model.score(X, y)\` returns a default metric (R² for regressors, accuracy for classifiers). X is a 2-D array of shape (n_samples, n_features); y is 1-D. This uniformity is the point — swapping LinearRegression for a random forest on Day 74 changes one line.

### Splits and baselines

Never score on the data you trained on: memorization looks like skill. \`train_test_split(X, y, test_size=0.2, random_state=42)\` holds out an untouched exam. Before any real model, fit a **baseline**: \`DummyRegressor(strategy="mean")\` predicts the training mean everywhere. Its R² is ~0 by construction — R² measures the fraction of variance explained beyond that mean predictor, so R² = 0.4 means "40% better than always guessing the average," and a negative R² means worse than the dumb guess. Report MAE too (mean absolute error, in target units) because stakeholders think in units, not variance fractions.

### Underfitting

A straight line fit to curved data misses systematically — high error on train AND test. That is underfitting: the hypothesis class is too simple for the signal. The fix is more capacity (polynomial features, trees) — not more data. Its mirror image, overfitting, is Day 73's live demo and Day 76's main event.`,
    viz: 'gradient-descent',
    guided: [
      {
        title: 'Baseline first, model second',
        minutes: 20,
        body: `1. Create \`ml_framing_lab.py\` and paste the starter code. It uses the built-in diabetes dataset (442 patients, 10 features, target = disease progression) so it runs standalone. If your in-browser interpreter lacks scikit-learn, run locally: \`pip install scikit-learn\`.
2. Run it. Record four numbers: baseline MAE, baseline R², model MAE, model R².
3. Sanity-check: baseline R² should be ≈ 0 (slightly negative on test is normal). Explain in one sentence why the mean predictor defines zero.
4. Compute the improvement: what fraction did MAE drop versus the baseline? That sentence — "the model cuts average error from 66 to 44, a 33% improvement over predicting the mean" — is how you will report every model from now on.
5. Change \`random_state\` in the split to 0 and re-run. The scores move. Note this — it is why Day 76 replaces one split with cross-validation.`,
        code: `from sklearn.datasets import load_diabetes
from sklearn.dummy import DummyRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split

X, y = load_diabetes(return_X_y=True)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

for name, model in [
    ("baseline (mean)", DummyRegressor(strategy="mean")),
    ("linear regression", LinearRegression()),
]:
    model.fit(X_train, y_train)
    pred = model.predict(X_test)
    mae = mean_absolute_error(y_test, pred)
    r2 = r2_score(y_test, pred)
    print(f"{name:18s}  MAE={mae:6.1f}  R2={r2:6.3f}")
`,
      },
      {
        title: 'Read the model like a scientist',
        minutes: 15,
        body: `1. After fitting, print \`model.coef_\` and \`model.intercept_\`. Each coefficient answers: "holding everything else fixed, one unit more of this feature changes the prediction by how much?"
2. Zip the coefficients with \`load_diabetes().feature_names\` and sort by absolute value. Which three features drive the prediction hardest?
3. Predict for one patient: take \`X_test[0]\`, reshape with \`X_test[0:1]\`, and call predict. Then verify by hand: intercept + dot product of coefficients and features (Day 50's dot product, earning rent).
4. Caveat to write down: these features are pre-standardized in this dataset, so magnitudes are comparable. On raw data, a coefficient's size depends on the feature's units — comparing them requires scaling first (Day 69).`,
        code: `import numpy as np
from sklearn.datasets import load_diabetes

data = load_diabetes()
# ...fit LinearRegression as model on a train split first...
# ranked = sorted(zip(data.feature_names, model.coef_),
#                 key=lambda p: abs(p[1]), reverse=True)
# for name, c in ranked:
#     print(f"{name:6s} {c:8.1f}")
# one_pred = model.predict(X_test[0:1])[0]
# by_hand = model.intercept_ + np.dot(model.coef_, X_test[0])
# print(one_pred, by_hand)   # identical`,
      },
    ],
    practice: [
      {
        title: 'The line that could not bend',
        minutes: 20,
        body: `Generate curved data: \`x = np.linspace(-3, 3, 200)\`, \`y = x**2 + np.random.normal(0, 0.5, 200)\`. Reshape x to a column with \`x.reshape(-1, 1)\`.

Goal: (1) split, fit LinearRegression, record train AND test R² — both should be terrible, and similar to each other; (2) explain in one sentence why this is underfitting, not overfitting; (3) fix it without changing the model class: add \`x**2\` as a second feature column (\`np.column_stack\`) and refit. R² should jump above 0.9.

Hints (only if stuck): underfitting = bad on both splits; the model is still linear in its INPUTS — you changed the inputs, which is exactly what feature engineering (Day 69) is for.`,
      },
    ],
    project: {
      title: 'Your regression report card function',
      brief: `Create \`ml_toolkit.py\` in your practice repo — a module you will grow all phase and reuse in the Day 83 churn project. Today it gets one function: \`evaluate_regression(model, X_train, X_test, y_train, y_test)\` that fits the model, and returns a dict with train/test MAE, train/test R², and the same numbers for a DummyRegressor baseline fitted on the same split. Add a \`print_report(results)\` helper that renders a small comparison table and flags "WARNING: model barely beats baseline" when test-MAE improvement is under 10%. Demonstrate it on the diabetes dataset in a \`__main__\` block, and commit.`,
      rubric: [
        'evaluate_regression returns baseline and model metrics computed on the identical split',
        'Baseline is fitted inside the function — impossible to forget it',
        'print_report renders train vs test side by side and fires the under-10%-improvement warning correctly',
        'Runs end-to-end on the diabetes dataset from the __main__ block',
        'Committed to the practice repo with a descriptive message',
      ],
    },
    mistakes: [
      'Scoring on training data and calling it accuracy. Memorization looks like skill; only held-out scores count. Always report both, labeled.',
      'Skipping the baseline. R² already encodes "versus the mean," but MAE does not — a churn model with 85% accuracy sounds great until you learn 85% of customers never churn (Day 75\'s accuracy trap).',
      'Thinking R² = 0.5 means "half the predictions are right." It means the model explains half the variance the mean predictor leaves. It is not a percentage of correct answers.',
      'Treating a negative test R² as a bug. It is a verdict: the model is worse than predicting the average — often a leakage-free sign of a broken feature set or a shuffled target.',
      'Fixing underfitting with more data. More rows of curved data will not help a straight line; underfitting needs more capacity or better features, overfitting needs the opposite.',
      'Passing a 1-D x to fit. sklearn wants X as (n_samples, n_features) — reshape(-1, 1) for a single feature; the error message will haunt you until this is reflex.',
    ],
    quiz: [
      {
        q: 'Your model scores R² = 0.92 on training data and R² = 0.31 on the test split. The FIRST correct conclusion is…',
        o: [
          'The model is underfitting',
          'The model memorized training data and generalizes poorly',
          'The test set is too small',
          'R² is the wrong metric',
        ],
        x: 1,
        w: 'A large train/test gap is the signature of overfitting: performance that evaporates on unseen data. Underfitting would show BOTH scores low and close together.',
        revisit: 71,
      },
      {
        q: 'Why fit a DummyRegressor before any real model?',
        o: [
          'It is required by the sklearn API',
          'It warms up the optimizer',
          'It defines the floor: any model that cannot beat "predict the mean" adds no value, and you learn that in minutes',
          'It prevents overfitting',
        ],
        x: 2,
        w: 'The baseline is the honesty check. Every improvement claim is "versus what?" — the dummy model is the cheapest possible answer to that question.',
        revisit: 71,
      },
      {
        q: 'A straight line fit to clearly quadratic data gives poor scores on BOTH train and test. The standard fix is…',
        o: [
          'Collect more training rows',
          'Add capacity — e.g. add an x² feature or use a more flexible model',
          'Lower the learning rate',
          'Use a bigger test split',
        ],
        x: 1,
        w: 'Poor-on-both is underfitting: the hypothesis class cannot express the signal. More identical data cannot help; more expressive features or models can.',
        revisit: 71,
      },
    ],
    resources: [
      { label: 'scikit-learn User Guide — 1.1 Linear Models', url: 'https://scikit-learn.org/stable/modules/linear_model.html', type: 'docs', time: '25 min' },
      { label: 'Google ML Crash Course — framing, loss & linear regression', url: 'https://developers.google.com/machine-learning/crash-course', type: 'course', time: '30 min' },
      { label: 'StatQuest — Linear Regression, clearly explained', url: 'https://statquest.org/', type: 'video', time: '20 min' },
      { label: 'Kaggle Learn — Intro to Machine Learning', url: 'https://www.kaggle.com/learn', type: 'course', time: '30 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: due cards from Weeks 9–10 (gradients, features)', minutes: 10 },
      { activity: 'ELI5 + tech read; revisit the gradient-descent visualizer with new eyes', minutes: 20 },
      { activity: 'Guided: baseline first + read the model', minutes: 35 },
      { activity: 'Practice: the line that could not bend', minutes: 20 },
      { activity: 'Project: ml_toolkit.py report card function', minutes: 25 },
      { activity: 'Quiz + write flashcards', minutes: 10 },
    ],
    completion: [
      'Baseline and model metrics recorded from guided exercise, with the one-sentence improvement report written',
      'Underfitting demo run: both fixes understood, R² > 0.9 after adding the squared feature',
      'ml_toolkit.py committed with working evaluate_regression + print_report',
      'Quiz ≥ 2/3',
    ],
    connections: {
      back: 'On Day 56 you built exactly this model with raw NumPy and hand-written gradient descent — today sklearn compressed your week of math into fit(). Day 69\'s leakage discipline is why the split happens before anything touches the data.',
      forward: 'Tomorrow logistic regression reuses this API for classification. Day 76 replaces the single split with cross-validation, and Day 83\'s churn project is graded on the baseline-first protocol you built today. On Day 135, "baseline first" returns as the golden rule of LLM evals.',
    },
    flashcards: [
      { f: 'The three ingredients of any ML setup?', b: 'Hypothesis class (function family) + loss (definition of wrong) + optimizer (search procedure).' },
      { f: 'R² = 0 means…?', b: 'The model exactly ties "always predict the training mean." Negative = worse than that.' },
      { f: 'Underfitting signature in scores?', b: 'Poor on train AND test, close together. Fix: more capacity/features, not more data.' },
      { f: 'Overfitting signature in scores?', b: 'Great on train, poor on test — a large generalization gap.' },
      { f: 'Why a DummyRegressor before any model?', b: 'It sets the floor every improvement claim is measured against — cheap honesty.' },
      { f: 'sklearn estimator contract?', b: 'fit(X, y) learns; predict(X) applies; score(X, y) default-metrics. X is (n_samples, n_features).' },
    ],
    deepDive: [
      { label: 'Closed-form vs gradient descent for linear regression', note: 'The normal equation solves OLS exactly in O(n·d²) — sklearn uses an SVD-based solver (Day 52\'s SVD at work). Gradient descent wins when d is huge or the loss has no closed form — which is every neural net (Day 86).' },
    ],
  },
  {
    id: 'd072', day: 72, week: 11, phase: 4, kind: 'lesson',
    title: 'Logistic Regression & Losses',
    analogy: 'Confidence, not just answers',
    objectives: [
      'Explain how the sigmoid turns a linear score into a probability and what the decision boundary is',
      'Show that log-loss is exactly the cross-entropy from Day 62, and why MSE is the wrong loss for probabilities',
      'Use predict_proba and a chosen threshold instead of blindly trusting predict',
      'Handle class imbalance with class_weight and threshold moves, and explain the difference',
      'Describe what the C parameter regularizes, at first-taste level',
    ],
    prereqs: [
      { day: 71, label: 'ML framing & the estimator API' },
      { day: 62, label: 'Entropy & cross-entropy' },
      { day: 69, label: 'Scaling & pipelines' },
    ],
    eli5: `Two doctors look at the same scan. Both say "not cancer." But one means "99.9% sure — go home" and the other means "51% sure — I flipped a mental coin." Same answer, wildly different information. You would want the second patient sent for more tests. A classifier that only outputs labels is the coin-flip doctor with a confident voice: it hides how sure it was, and hiding that throws away the most decision-relevant number in the system.

Logistic regression is the doctor who says the percentage out loud. It computes the same weighted score as yesterday's straight line, then squashes it through an S-shaped curve (the sigmoid) so the output lands between 0 and 1 — a probability. The "answer" is just you choosing a cutoff: above 50%, call it positive. But that 50% is YOUR policy choice, not the model's. A fraud team might act at 5% suspicion; a spam filter might wait for 99%. Today you learn to keep the confidence and choose the cutoff deliberately.`,
    why: `Probabilities, not labels, are what production systems act on: route the risky transaction to review above 0.05, auto-approve below. Thresholding is a business decision an FDE negotiates with the customer ("what does a false alarm cost you? a miss?") — Day 75 turns that into metric choice. And the loss you meet today, cross-entropy, is THE loss: every neural network you train from Day 85 on, and every LLM ever pretrained, minimizes exactly this quantity. Understanding it once here pays compound interest for the rest of the program.`,
    tech: `Logistic regression computes a linear score z = w·x + b (the log-odds), then maps it through the **sigmoid** σ(z) = 1/(1+e^(−z)) to a probability p ∈ (0,1). σ(0) = 0.5, so the **decision boundary** — the set of points where the model is maximally unsure — is the line/plane w·x + b = 0. The model is still linear: it draws a straight boundary through feature space; only the output is squashed. Despite the name, it is a classifier.

### The loss is cross-entropy

Training minimizes **log-loss**: −[y·log(p) + (1−y)·log(1−p)] averaged over samples — precisely the cross-entropy between the true label distribution and the predicted one from Day 62. It punishes confident wrongness brutally: predicting p = 0.01 for a true positive costs −log(0.01) ≈ 4.6, while p = 0.4 costs ≈ 0.9. Why not MSE? Squared error on top of a sigmoid gives a non-convex loss with flat gradients exactly where the model is confidently wrong — the optimizer stalls where it most needs to move. Cross-entropy keeps the gradient proportional to (p − y): beautifully, the more wrong, the bigger the push.

### Probabilities, thresholds, imbalance

\`predict_proba(X)\` returns per-class probabilities; \`predict\` is just \`proba[:, 1] >= 0.5\`. With imbalanced classes (fraud at 2%), two distinct levers exist: **move the threshold** (change the action policy on fixed probabilities) or **class_weight="balanced"** (reweight the loss during training so minority mistakes cost more, shifting the learned boundary itself). They are not interchangeable: thresholding is free and reversible at inference; reweighting changes the model and distorts calibration.

### Regularization, first taste

sklearn's LogisticRegression applies L2 regularization by default, controlled by \`C\` = inverse strength (small C = strong shrinkage of weights toward 0, simpler boundary). Day 76 develops why shrinking weights fights overfitting. Practical notes: scale features first (the solver converges faster and C means the same thing per feature — use a Pipeline with StandardScaler), and raise \`max_iter\` if you see convergence warnings.`,
    viz: 'sigmoid-boundary',
    guided: [
      {
        title: 'Probabilities under the microscope',
        minutes: 20,
        body: `1. Paste the starter. It trains logistic regression (inside a scaling pipeline) on the built-in breast-cancer dataset — runs standalone; if scikit-learn is missing in the browser, run locally.
2. Print the first 8 test rows: predicted probability, predicted label, true label. Find a case where the model was right but unsure (p between 0.4 and 0.7). Would you ship an auto-decision on that row?
3. Compute log-loss and accuracy on the test set. Now build a deliberately overconfident copy of the probabilities with \`np.clip(proba, 0.001, 0.999)\` pushed to extremes: \`np.where(proba > 0.5, 0.999, 0.001)\`. Accuracy is unchanged — but recompute log-loss. Explain the jump in one sentence.
4. Hand-verify one sample's log-loss term with \`-np.log(p)\` (true class 1) or \`-np.log(1-p)\` (true class 0) and match it against sklearn\'s average.`,
        code: `import numpy as np
from sklearn.datasets import load_breast_cancer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, log_loss
from sklearn.model_selection import train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

X, y = load_breast_cancer(return_X_y=True)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.25, random_state=42, stratify=y
)

clf = make_pipeline(StandardScaler(), LogisticRegression(max_iter=1000))
clf.fit(X_train, y_train)

proba = clf.predict_proba(X_test)[:, 1]
pred = clf.predict(X_test)

for p, yhat, yt in list(zip(proba, pred, y_test))[:8]:
    print(f"p(malignant-free)={p:5.3f}  pred={yhat}  true={yt}")

print("accuracy:", round(accuracy_score(y_test, pred), 3))
print("log-loss:", round(log_loss(y_test, proba), 3))`,
      },
      {
        title: 'Move the threshold, move the world',
        minutes: 18,
        body: `1. Simulate an imbalanced problem: \`make_classification(n_samples=4000, weights=[0.95, 0.05], random_state=0)\` — 5% positives, like fraud.
2. Train the same scaled logistic pipeline. At the default 0.5 threshold, count: how many true positives did it catch, how many did it miss? Use plain NumPy comparisons — \`((proba >= t) & (y_test == 1)).sum()\` — no metric imports yet (that is Day 75\'s job).
3. Sweep thresholds t in [0.9, 0.7, 0.5, 0.3, 0.1]. For each, print caught positives, missed positives, and false alarms. Watch the trade: lower t catches more real positives at the price of more false alarms.
4. Retrain with \`class_weight="balanced"\` at fixed t = 0.5 and compare to the threshold move. Write two sentences: which lever changed the model, and which changed only the policy?`,
        code: `import numpy as np
from sklearn.datasets import make_classification
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

X, y = make_classification(
    n_samples=4000, n_features=10, n_informative=5,
    weights=[0.95, 0.05], random_state=0
)
X_tr, X_te, y_tr, y_te = train_test_split(
    X, y, test_size=0.3, random_state=0, stratify=y
)
clf = make_pipeline(StandardScaler(), LogisticRegression(max_iter=1000))
clf.fit(X_tr, y_tr)
proba = clf.predict_proba(X_te)[:, 1]

print(f"positives in test set: {(y_te == 1).sum()}")
for t in [0.9, 0.7, 0.5, 0.3, 0.1]:
    flag = proba >= t
    caught = (flag & (y_te == 1)).sum()
    missed = (~flag & (y_te == 1)).sum()
    false_alarm = (flag & (y_te == 0)).sum()
    print(f"t={t:3.1f}  caught={caught:3d}  missed={missed:3d}  false alarms={false_alarm:4d}")`,
      },
    ],
    practice: [
      {
        title: 'The stalled gradient, felt by hand',
        minutes: 18,
        body: `Prove to yourself why cross-entropy beats MSE for classification. For a single true-positive sample (y = 1), compute both losses and their gradients with respect to p at p = 0.9, 0.5, 0.1, 0.01: cross-entropy loss −log(p) with gradient −1/p, and squared loss (1−p)² with gradient −2(1−p).

Goal: (1) tabulate loss and |gradient| for both at all four p values (NumPy or by hand); (2) identify where the model is most catastrophically wrong (p = 0.01) and compare the gradient magnitudes there; (3) write the conclusion in two sentences.

Hints: at p = 0.01 the cross-entropy gradient is 100 — a shove proportional to the wrongness. Note the squared-loss gradient there stays under 2, and in a real network the sigmoid\'s own slope shrinks it much further toward zero — the stall.`,
      },
    ],
    project: {
      title: 'Extend the toolkit to classification',
      brief: `Add \`evaluate_classification(model, X_train, X_test, y_train, y_test, threshold=0.5)\` to \`ml_toolkit.py\`. It must fit the model, fit a \`DummyClassifier(strategy="most_frequent")\` baseline on the same split, and return accuracy and log-loss for both, plus positive-catch and false-alarm counts at the given threshold computed via predict_proba (raw NumPy counting — you will upgrade these to named metrics on Day 75). Add a threshold parameter demo in \`__main__\` on the imbalanced dataset from guided exercise 2 showing the baseline\'s deceptive accuracy. Commit.`,
      rubric: [
        'Function fits model and most-frequent baseline on the identical split and reports both',
        'Uses predict_proba + explicit threshold, not bare predict',
        'Counts caught positives / missed positives / false alarms with raw array logic',
        'The __main__ demo shows the ~95%-accuracy dummy on 5%-positive data, annotated with a comment naming the trap',
        'Committed to the practice repo',
      ],
    },
    mistakes: [
      'Trusting predict and never looking at predict_proba. The 0.5 cutoff is a default policy, not a law — most business problems need a different threshold, chosen from costs.',
      'Confusing log-loss with accuracy. Accuracy only sees which side of the threshold; log-loss also punishes miscalibrated confidence. Two models with equal accuracy can have wildly different log-loss.',
      'Using MSE as a classification loss. It goes non-convex through the sigmoid and its gradient vanishes exactly where the model is confidently wrong; cross-entropy\'s gradient (p − y) does not stall.',
      'Fixing imbalance ONLY by reweighting when a threshold move suffices — or thresholding when the boundary itself is wrong. Know which lever you pulled and why; reweighting also distorts probability calibration.',
      'Forgetting to scale features. Unscaled features slow the solver (convergence warnings) and make C\'s penalty hit large-unit features unevenly. Pipeline + StandardScaler is the reflex.',
      'Reading "logistic REGRESSION" and using it on continuous targets. The name is historical; it is a classifier that regresses log-odds.',
    ],
    quiz: [
      {
        q: 'A model predicts p = 0.02 for a sample whose true label is 1. Compared with predicting p = 0.4, its log-loss contribution is…',
        o: [
          'The same — both round to a wrong label',
          'Slightly higher',
          'Much higher — log-loss punishes confident wrongness (−log 0.02 ≈ 3.9 vs −log 0.4 ≈ 0.9)',
          'Lower, because 0.02 is more decisive',
        ],
        x: 2,
        w: 'Log-loss is −log(p at the true class): it grows without bound as confidence in the wrong answer increases. Accuracy would treat both identically; that is exactly what it misses.',
        revisit: 62,
      },
      {
        q: 'Where is the decision boundary of a logistic regression model?',
        o: [
          'Where the sigmoid output equals 1',
          'Where the linear score w·x + b = 0, i.e. predicted probability = 0.5',
          'At the mean of the training features',
          'There is no boundary; the output is continuous',
        ],
        x: 1,
        w: 'σ(0) = 0.5, so z = 0 is the surface of maximal uncertainty. The boundary is linear in feature space — the sigmoid squashes the output, not the geometry.',
        revisit: 72,
      },
      {
        q: 'For a 5%-positive fraud problem, lowering the decision threshold from 0.5 to 0.1 will typically…',
        o: [
          'Catch more true frauds AND raise false alarms',
          'Catch more true frauds and lower false alarms',
          'Change nothing until the model is retrained',
          'Improve calibration',
        ],
        x: 0,
        w: 'The threshold trades one error type for the other on fixed probabilities: flagging more cases catches more positives and mislabels more negatives. Choosing the exchange rate is a business decision (Day 75).',
        revisit: 72,
      },
    ],
    resources: [
      { label: 'scikit-learn User Guide — 1.1 Linear Models (Logistic regression section)', url: 'https://scikit-learn.org/stable/modules/linear_model.html', type: 'docs', time: '20 min' },
      { label: 'StatQuest — Logistic Regression series', url: 'https://statquest.org/', type: 'video', time: '25 min' },
      { label: 'Google ML Crash Course — logistic regression & classification', url: 'https://developers.google.com/machine-learning/crash-course', type: 'course', time: '25 min' },
      { label: 'Colah — Visual Information Theory (cross-entropy refresher)', url: 'https://colah.github.io/posts/2015-09-Visual-Information/', type: 'article', time: '20 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: Day 62 cross-entropy cards + Day 71 deck', minutes: 10 },
      { activity: 'ELI5 + tech read; sigmoid-boundary visualizer', minutes: 20 },
      { activity: 'Guided: probabilities under the microscope + threshold sweep', minutes: 38 },
      { activity: 'Practice: the stalled gradient', minutes: 18 },
      { activity: 'Project: evaluate_classification in ml_toolkit.py', minutes: 24 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'Overconfidence experiment run: same accuracy, exploded log-loss, explained in one sentence',
      'Threshold sweep table produced; two-sentence answer distinguishing threshold vs class_weight',
      'Gradient comparison table from practice completed with written conclusion',
      'ml_toolkit.py extended and committed',
      'Quiz ≥ 2/3',
    ],
    connections: {
      back: 'Day 62 defined cross-entropy as surprise-weighted cost — today it became the training loss, paying off exactly as promised. The boundary w·x + b = 0 is Day 50\'s dot product drawing a line in space.',
      forward: 'Day 75 gives proper names (precision, recall) to the counts you tallied by hand today. Day 76 explains the C parameter fully. From Day 85 on, every neural net — and every LLM in pretraining — minimizes this same cross-entropy, just with billions of parameters.',
    },
    flashcards: [
      { f: 'Sigmoid\'s job in logistic regression?', b: 'Squash the linear score (log-odds) into (0,1) so it reads as a probability. σ(0)=0.5.' },
      { f: 'Log-loss vs accuracy — key difference?', b: 'Accuracy sees only the thresholded label; log-loss also punishes miscalibrated confidence, unboundedly for confident wrongness.' },
      { f: 'Why not MSE for classification?', b: 'Through a sigmoid it is non-convex with vanishing gradients where the model is confidently wrong; cross-entropy\'s gradient (p−y) never stalls.' },
      { f: 'Threshold move vs class_weight="balanced"?', b: 'Threshold changes the action policy on fixed probabilities (free, reversible); class_weight reweights the loss and moves the learned boundary.' },
      { f: 'What does C control in sklearn LogisticRegression?', b: 'Inverse L2 regularization strength: small C = strong shrinkage = simpler boundary.' },
    ],
    deepDive: [
      { label: 'Calibration: when 0.7 should mean 70%', note: 'A model is calibrated if events predicted at p happen a fraction p of the time. Trees and boosted models are often miscalibrated; sklearn\'s CalibratedClassifierCV fixes it. Tasted properly on Day 75.' },
    ],
  },
  {
    id: 'd073', day: 73, week: 11, phase: 4, kind: 'lesson',
    title: 'Decision Trees',
    analogy: 'Twenty questions',
    objectives: [
      'Explain how a tree greedily picks splits by impurity reduction (Gini/entropy)',
      'Demonstrate — by running it — that an unconstrained tree memorizes the training set',
      'Control overfitting with max_depth, min_samples_leaf, and cost-complexity pruning',
      'Read a fitted tree with export_text/plot_tree and explain one prediction path aloud',
      'State the honest caveats on feature_importances_',
    ],
    prereqs: [
      { day: 71, label: 'ML framing, splits & baselines' },
      { day: 29, label: 'Binary trees & traversal' },
      { day: 62, label: 'Entropy as surprise' },
    ],
    eli5: `In Twenty Questions, a good player never opens with "is it a 1997 Honda Civic?" They ask "is it alive?" — the question that splits the world of possibilities most evenly, so either answer eliminates the most candidates. Then, inside the surviving half, they pick the next most-splitting question. Twenty well-chosen questions can pinpoint one thing among a million, because each question does the most possible work at that moment.

A decision tree learns to play Twenty Questions against your data. It examines every feature and every cutoff — "is monthly_charges > 70?" — and picks whichever question best separates the labels into purer piles. Then it recurses into each pile and asks again. Prediction is just walking the questions from the root to a leaf and answering with whatever label dominates there. The catch: given unlimited questions, the tree ends up asking "is it row #4,072?" — perfectly sorting the training data by memorizing it. Real skill in Twenty Questions is asking FEW questions; real skill in trees is knowing when to stop.`,
    why: `Trees matter for three career reasons. They are the building block of the ensembles (Day 74) that still win most tabular problems you will meet in industry — churn, fraud, pricing — which is most customer data. They are the most explainable model family: an FDE can walk a compliance officer through the exact rule path that flagged a transaction, which is sometimes the difference between a deployed model and a rejected one. And "watch the tree memorize" is the cleanest overfitting demo in all of ML — the intuition you will reuse when Day 89's neural nets do the same thing with more drama.`,
    tech: `A decision tree (CART) recursively partitions feature space with axis-aligned questions of the form feature ≤ threshold. At each node it evaluates candidate splits by **impurity reduction**: Gini impurity (probability two random samples in the node disagree on label; 0 = pure) or entropy (Day 62's surprise, in bits). The split maximizing the weighted impurity drop of the children wins. This is **greedy** — locally best, no lookahead, no global optimality guarantee — and it recurses until leaves are pure or a stopping rule fires. Prediction walks root→leaf in O(depth) and returns the leaf's majority class (or mean, for regression trees).

### Capacity control

An unconstrained tree can carve one leaf per training sample: train accuracy 100%, generalization garbage. The knobs: \`max_depth\` (hard ceiling on question count per prediction), \`min_samples_leaf\` (refuse leaves smaller than n — my default first knob: it directly forbids memorizing individuals), \`min_samples_split\`, and post-hoc **cost-complexity pruning** (\`ccp_alpha\`), which grows the full tree then collapses branches whose accuracy gain does not justify their size. Tune these against a held-out split or CV, never train accuracy.

### Character of the model family

Trees need no feature scaling (thresholds are order-based, unit-free — one whole preprocessing headache gone), handle mixed feature types and non-linear interactions natively, and are white-box: \`export_text\` prints the rules, \`plot_tree\` draws them. Weaknesses: axis-aligned boundaries make diagonal frontiers staircase-shaped and expensive; predictions are piecewise-constant (regression trees cannot extrapolate beyond training-range leaf values); and they are **high-variance** — resampling the training data can yield a very different tree, an instability that Day 74's forests exploit by averaging many unstable trees.

### feature_importances_, honestly

sklearn's importances measure total impurity reduction contributed by each feature. Caveats: biased toward high-cardinality features (more candidate thresholds = more chances to look useful), split arbitrarily among correlated features (one twin can take all the credit), and computed on TRAIN data — a memorizing tree reports confident importances for noise. Prefer permutation importance on held-out data when the answer matters.`,
    viz: 'decision-tree',
    guided: [
      {
        title: 'Watch it memorize',
        minutes: 22,
        body: `1. Paste the starter (breast-cancer dataset again — standalone; run locally if the browser lacks scikit-learn). It sweeps max_depth from 1 to 12 and prints train vs test accuracy for each.
2. Run it and find three regimes in the table: underfit (both low, depth 1–2), sweet spot (test peaks), memorize (train hits 1.000 while test stalls or slips). Write down the depth where the gap starts growing.
3. Note the depth where train accuracy reaches 1.000 exactly — the tree has a private leaf-path for every hard training sample. Test accuracy did not earn any of that.
4. Fix it a second way: keep depth unlimited but set \`min_samples_leaf=10\`. Compare against the best max_depth run. Two different knobs, same medicine — capacity control.
5. Plot or tabulate the gap (train − test) vs depth: this exact curve shape returns as Day 76\'s bias-variance picture and Day 89\'s neural-net loss curves.`,
        code: `from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier

X, y = load_breast_cancer(return_X_y=True)
X_tr, X_te, y_tr, y_te = train_test_split(
    X, y, test_size=0.25, random_state=42, stratify=y
)

print("depth  train   test    gap")
for depth in range(1, 13):
    t = DecisionTreeClassifier(max_depth=depth, random_state=0)
    t.fit(X_tr, y_tr)
    tr = t.score(X_tr, y_tr)
    te = t.score(X_te, y_te)
    print(f"{depth:5d}  {tr:.3f}  {te:.3f}  {tr - te:+.3f}")

leafy = DecisionTreeClassifier(min_samples_leaf=10, random_state=0)
leafy.fit(X_tr, y_tr)
print("min_samples_leaf=10:",
      round(leafy.score(X_tr, y_tr), 3),
      round(leafy.score(X_te, y_te), 3))`,
      },
      {
        title: 'Read the tree aloud',
        minutes: 15,
        body: `1. Fit a small tree (\`max_depth=3\`) and print its rules with \`export_text(tree, feature_names=...)\`. Read the top split: which feature and threshold did the greedy search choose first? That is the data\'s best opening question.
2. Take one test sample and trace its path by hand through the printed rules — answer each question from the sample\'s feature values until you reach a leaf. Confirm your walk matches \`tree.predict\`.
3. Print \`tree.feature_importances_\` zipped with feature names, sorted. Then refit with a different random_state and a bootstrap resample of the training data (\`np.random.default_rng(1).choice(len(X_tr), len(X_tr))\` as indices) and print importances again. Watch them shuffle — write one sentence on why this instability recommends caution (and foreshadows why forests average many trees).`,
        code: `import numpy as np
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier, export_text

data = load_breast_cancer()
X_tr, X_te, y_tr, y_te = train_test_split(
    data.data, data.target, test_size=0.25, random_state=42, stratify=data.target
)

tree = DecisionTreeClassifier(max_depth=3, random_state=0)
tree.fit(X_tr, y_tr)
print(export_text(tree, feature_names=list(data.feature_names)))

ranked = sorted(zip(data.feature_names, tree.feature_importances_),
                key=lambda p: p[1], reverse=True)
for name, imp in ranked[:6]:
    print(f"{name:25s} {imp:.3f}")

idx = np.random.default_rng(1).choice(len(X_tr), len(X_tr))
tree2 = DecisionTreeClassifier(max_depth=3, random_state=7)
tree2.fit(X_tr[idx], y_tr[idx])
ranked2 = sorted(zip(data.feature_names, tree2.feature_importances_),
                 key=lambda p: p[1], reverse=True)
print("resampled top-3:", [n for n, _ in ranked2[:3]])`,
      },
    ],
    practice: [
      {
        title: 'Prune it like you mean it',
        minutes: 20,
        body: `Use \`DecisionTreeClassifier.cost_complexity_pruning_path(X_tr, y_tr)\` on the breast-cancer training split to get the ccp_alphas array. Fit one tree per alpha (skip the last, which prunes to a stump), and record each tree\'s leaf count, train accuracy, and test accuracy.

Goal: (1) produce the table; (2) pick the alpha you would ship and defend the choice in two sentences (test score AND simplicity); (3) compare your pruned tree\'s leaf count against the unpruned tree\'s — how many leaves were memorization?

Hints: expect dozens of alphas; iterate with a list comprehension. The shipped tree is rarely the top test scorer — prefer the simplest tree within a whisker of the best (a taste of the one-standard-error rule, formalized on Day 76).`,
      },
    ],
    project: {
      title: 'The overfitting demo you will reuse forever',
      brief: `Create \`overfit_demo.py\` in your practice repo: a self-contained script that (1) runs the depth sweep on breast-cancer and prints the three-regime table with a MEMORIZING/SWEET-SPOT/UNDERFIT tag per row, (2) prints the depth-3 rules via export_text with a hand-written comment translating the top split into plain English, and (3) ends with a docstring summarizing the lesson in 3 sentences for your future self. This script becomes your standard show-a-stakeholder-what-overfitting-is artifact — FDEs give this exact demo to customers who ask "why can\'t we just fit the data perfectly?". Commit it.`,
      rubric: [
        'Depth sweep runs standalone and tags each row with the correct regime',
        'Regime boundaries chosen from the numbers, not hardcoded guesses (e.g. gap threshold)',
        'export_text output included with a plain-English translation of the root split',
        'Closing docstring states the memorization lesson in ≤ 3 sentences',
        'Committed to the practice repo',
      ],
    },
    mistakes: [
      'Judging a tree by train accuracy. An unconstrained tree ALWAYS reaches ~100% on train — that number carries zero information about skill.',
      'Scaling features for trees out of habit. Splits compare feature ≤ threshold; monotonic scaling changes nothing. Save the pipeline complexity for models that need it.',
      'Reading feature_importances_ as causal truth. They are impurity bookkeeping on train data: biased toward high-cardinality features and arbitrary among correlated ones. Use permutation importance on held-out data for decisions.',
      'Expecting a regression tree to extrapolate. Leaves predict constants from the training range; ask for a prediction outside it and you get the nearest edge leaf\'s value, flat forever.',
      'Believing the greedy tree is the optimal tree. Greedy split selection has no lookahead — a mediocre first split can be locally best. This is fine; ensembles (tomorrow) fix it better than clever single trees.',
      'Tuning depth on the test set. That silently converts your exam into homework. Tune on a validation split or CV (Day 76); touch test once.',
    ],
    quiz: [
      {
        q: 'An unconstrained decision tree reports train accuracy 1.000 and test accuracy 0.71. What happened?',
        o: [
          'The dataset is too small for trees',
          'The tree grew leaves that isolate individual training samples — memorization, not learning',
          'The test set has a different distribution',
          'Gini impurity was the wrong criterion',
        ],
        x: 1,
        w: 'With unlimited depth a tree can carve a private path per training row, driving train impurity to zero. The generalization gap is the tell; capacity knobs (max_depth, min_samples_leaf, pruning) are the fix.',
        revisit: 73,
      },
      {
        q: 'Which model change does NOT require rescaling or re-encoding numeric features?',
        o: [
          'Switching logistic regression to a decision tree',
          'Adding L2 regularization to logistic regression',
          'Switching to k-nearest neighbors',
          'Switching to k-means clustering',
        ],
        x: 0,
        w: 'Tree splits are order-based (feature ≤ threshold), so monotonic rescaling cannot change any split. Distance- and penalty-based methods (kNN, k-means, regularized linear models) all care about scale.',
        revisit: 73,
      },
      {
        q: 'Feature A (a high-cardinality ID-like column) tops feature_importances_. Your best first move is…',
        o: [
          'Celebrate — the model found the key driver',
          'Suspect bias/leakage: high-cardinality features get more split chances and IDs can memorize; check permutation importance on held-out data',
          'Drop all other features',
          'Increase max_depth to confirm',
        ],
        x: 1,
        w: 'Impurity importances favor features with many candidate thresholds, and an ID that indexes individuals is memorization fuel. Held-out permutation importance is the honest check.',
        revisit: 73,
      },
    ],
    resources: [
      { label: 'scikit-learn User Guide — 1.10 Decision Trees', url: 'https://scikit-learn.org/stable/modules/tree.html', type: 'docs', time: '25 min' },
      { label: 'StatQuest — Decision and Classification Trees', url: 'https://statquest.org/', type: 'video', time: '20 min' },
      { label: 'Google ML Crash Course — decision trees module', url: 'https://developers.google.com/machine-learning/crash-course', type: 'course', time: '20 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: Days 71–72 cards + Day 62 entropy card', minutes: 10 },
      { activity: 'ELI5 + tech read; decision-tree visualizer', minutes: 20 },
      { activity: 'Guided: watch it memorize + read the tree aloud', minutes: 37 },
      { activity: 'Practice: cost-complexity pruning', minutes: 20 },
      { activity: 'Project: overfit_demo.py', minutes: 23 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'Depth-sweep table produced with the three regimes identified and the gap-growth depth noted',
      'One prediction traced by hand through export_text rules and verified against predict',
      'Pruning table built; shipped alpha chosen and defended in writing',
      'overfit_demo.py committed',
      'Quiz ≥ 2/3',
    ],
    connections: {
      back: 'The tree structure and root-to-leaf walk are Day 29\'s binary trees wearing work clothes, and the entropy criterion is Day 62\'s surprise measure choosing questions. Day 71\'s train/test discipline is what exposed the memorization.',
      forward: 'Tomorrow (Day 74) fixes the single tree\'s instability by averaging hundreds of them — bagging — and by building them sequentially — boosting. Day 76 names today\'s depth-sweep curve "bias-variance," and Day 80\'s error analysis starts from the same what-did-it-get-wrong instinct.',
    },
    flashcards: [
      { f: 'How does a tree choose its next split?', b: 'Greedy search over features × thresholds for the maximum weighted impurity (Gini/entropy) reduction. No lookahead.' },
      { f: 'Why does an unconstrained tree hit 100% train accuracy?', b: 'It can grow one pure leaf per training sample — pure memorization. Train accuracy carries no skill signal.' },
      { f: 'First knobs against tree overfitting?', b: 'max_depth, min_samples_leaf, or ccp_alpha pruning — all capacity control, tuned on validation data.' },
      { f: 'Do trees need feature scaling?', b: 'No — splits are order-based (feature ≤ threshold); monotonic scaling changes nothing.' },
      { f: 'Two biases of feature_importances_?', b: 'Favors high-cardinality features; splits credit arbitrarily among correlated features. Prefer permutation importance on held-out data.' },
      { f: 'Why are single trees called high-variance?', b: 'Small changes in training data can produce a very different tree — the instability that bagging (Day 74) averages away.' },
    ],
    deepDive: [
      { label: 'Why axis-aligned splits staircase diagonal boundaries', note: 'A tree can only cut perpendicular to axes, so a 45° class boundary needs many small rectangular steps. Oblique trees and linear models handle it in one cut — a reason to keep linear baselines around.' },
    ],
  },
  {
    id: 'd074', day: 74, week: 11, phase: 4, kind: 'lesson',
    title: 'Ensembles — Forests & Boosting',
    analogy: 'Asking a crowd',
    objectives: [
      'Explain how bagging + random feature subsets turn many overfit trees into one strong forest',
      'Contrast bagging (parallel, variance-reducing) with boosting (sequential, bias-reducing)',
      'Run a fair bake-off between logistic regression, random forest, and gradient boosting',
      'Tune the few boosting knobs that matter — learning_rate, tree depth, n_estimators via early stopping',
      'Say why ensembles dominate tabular problems and when the linear model still wins',
    ],
    prereqs: [
      { day: 73, label: 'Decision trees & overfitting' },
      { day: 60, label: 'Sampling & the law of large numbers' },
      { day: 71, label: 'Baselines & fair evaluation' },
    ],
    eli5: `Ask one person to guess the weight of an ox and you get a wild number. Ask a fair full of people and average their guesses, and — famously — the average lands within a percent of the truth. Each guesser is noisy, but their errors point in different directions, and averaging cancels them. The crowd is only wise, though, if the guessers are INDEPENDENT: let them confer and they converge on one confident, shared mistake.

A random forest is a manufactured crowd of decision trees. To keep the trees from all making the same mistake, it forces disagreement two ways: each tree trains on a different bootstrap resample of the data, and at every split each tree may only consider a random subset of features. Hundreds of diverse, individually-overfit trees then vote, and the memorization noise averages away. Boosting is a different kind of teamwork — a relay, not a crowd: each small tree studies the errors of the team so far and specializes in fixing them, with a learning rate keeping any one runner from sprinting off course.`,
    why: `Gradient-boosted trees are still the reigning champions of tabular data — the churn tables, claims data, and transaction logs that make up most enterprise ML. Knowing that "for tabular, start linear, then boost trees; save deep learning for text/images" is a hiring-signal opinion you can now defend. Interviews love the bagging-vs-boosting contrast. And for an FDE, the bake-off you run today — same split, same metric, honest table — is the exact artifact that convinces a customer you chose their model on evidence, not fashion. Day 77's competition and Day 83's churn project are won with today's tools.`,
    tech: `### Bagging and random forests

**Bagging** (bootstrap aggregating): train each model on a bootstrap resample (sample n rows with replacement — Day 60's bootstrap), then average predictions (or vote). Averaging k independent estimators divides variance by ~k; the catch is independence. **Random forests** add feature-subset randomness: each split considers only \`max_features\` candidates (√d is the classification default), decorrelating the trees so strong features cannot dominate every tree identically. Result: individually deep, overfit, high-variance trees whose average is stable and strong. Forests are gloriously hard to ruin — defaults are competitive; \`n_estimators\` just needs to be big enough (more trees never overfit more, they only cost compute). Each tree also leaves out ~37% of rows (never drawn in its bootstrap), giving a free validation signal: \`oob_score_\`.

### Boosting

Boosting builds **shallow** trees **sequentially**, each fit to the residual errors of the ensemble so far, added with a shrink factor: prediction += learning_rate × new_tree. It reduces **bias** — weak learners compound into a strong one — and it CAN overfit if you stack too many rounds, which is why \`n_estimators\` is best set by **early stopping**: monitor a validation score and stop when it stalls. The knobs that matter: \`learning_rate\` (smaller = more rounds needed but better generalization — the classic trade), \`max_depth\`/\`max_leaf_nodes\` (keep trees shallow, 3–8 leaves-ish), and early stopping. sklearn's \`HistGradientBoostingClassifier\` is the modern implementation — histogram-binned splits make it fast, and it handles NaNs natively. XGBoost and LightGBM are the battle-hardened external siblings with the same mental model (they need a pip install — use them locally, not in the browser interpreter).

### Choosing

Forests: parallel, robust, near-zero tuning, great first strong model. Boosting: usually a few points better when tuned, the default competition winner. Linear models still win when data is small, signal is nearly linear, latency/interpretability rule, or features vastly outnumber rows. Always keep yesterday's single tree and Day 71's baseline in the table — the deltas ARE the story.`,
    viz: null,
    guided: [
      {
        title: 'The bake-off, run fairly',
        minutes: 22,
        body: `1. Paste the starter. It builds a synthetic-but-hard tabular dataset (20 features, only 8 informative, some redundant — realistic noise) and compares four models on one fixed split. Standalone; run locally if the browser lacks scikit-learn.
2. Run it. Record the table. Typical shape: dummy ≪ logistic < single tree < forest ≤ boosting — but verify, don\'t assume.
3. Fairness audit — answer in writing: same split for all models? Same metric? Any model given tuning the others were denied? (Here: none — all defaults. A tuned-vs-default comparison would be rigged.)
4. Increase the forest\'s n_estimators from 100 to 300. Score barely moves — diminishing returns after "enough trees." Now DECREASE to 5 and watch it wobble: too small a crowd.
5. Print the forest\'s \`oob_score_\` (set \`oob_score=True\`) and compare it to the test score — a free validation estimate from the leftover bootstrap rows.`,
        code: `from sklearn.datasets import make_classification
from sklearn.dummy import DummyClassifier
from sklearn.ensemble import HistGradientBoostingClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.tree import DecisionTreeClassifier

X, y = make_classification(
    n_samples=6000, n_features=20, n_informative=8, n_redundant=4,
    flip_y=0.03, class_sep=0.8, random_state=7
)
X_tr, X_te, y_tr, y_te = train_test_split(
    X, y, test_size=0.25, random_state=7, stratify=y
)

models = [
    ("dummy (majority)", DummyClassifier(strategy="most_frequent")),
    ("logistic reg", make_pipeline(StandardScaler(),
                                   LogisticRegression(max_iter=1000))),
    ("single tree", DecisionTreeClassifier(random_state=0)),
    ("random forest", RandomForestClassifier(
        n_estimators=100, oob_score=True, random_state=0, n_jobs=-1)),
    ("hist gradient boost", HistGradientBoostingClassifier(random_state=0)),
]

for name, m in models:
    m.fit(X_tr, y_tr)
    print(f"{name:20s} train={m.score(X_tr, y_tr):.3f}  test={m.score(X_te, y_te):.3f}")`,
      },
      {
        title: 'The learning-rate / n_estimators trade + early stopping',
        minutes: 16,
        body: `1. With the same data, fit \`HistGradientBoostingClassifier(learning_rate=lr, max_iter=500, early_stopping=True, validation_fraction=0.15, random_state=0)\` for lr in [1.0, 0.3, 0.1, 0.03].
2. For each run print lr, \`clf.n_iter_\` (rounds actually used before early stopping fired), and test score. Pattern to find: smaller lr → more rounds needed → often slightly better test score, until it just gets slow.
3. lr = 1.0 is the cautionary row: fast, and usually worse — each tree over-commits, like a relay runner sprinting the wrong way.
4. Write the rule of thumb in your notes: set lr smallish (0.05–0.1), max_iter generous, and let early stopping choose the rounds. You tuned the most important boosting knob with four runs.`,
        code: `from sklearn.ensemble import HistGradientBoostingClassifier

for lr in [1.0, 0.3, 0.1, 0.03]:
    clf = HistGradientBoostingClassifier(
        learning_rate=lr, max_iter=500,
        early_stopping=True, validation_fraction=0.15,
        n_iter_no_change=10, random_state=0,
    )
    clf.fit(X_tr, y_tr)          # reuse the bake-off split
    print(f"lr={lr:4.2f}  rounds_used={clf.n_iter_:3d}  "
          f"test={clf.score(X_te, y_te):.3f}")`,
      },
    ],
    practice: [
      {
        title: 'Build bagging by hand',
        minutes: 20,
        body: `Prove the crowd effect without RandomForestClassifier. Train 25 unconstrained DecisionTreeClassifiers, each on its own bootstrap resample of the bake-off training data (indices via \`rng.choice(n, n, replace=True)\`). Average their \`predict_proba\` outputs and threshold at 0.5 for the ensemble prediction.

Goal: (1) report mean single-tree test accuracy vs your hand-rolled ensemble\'s accuracy — expect a clear jump; (2) plot or tabulate ensemble accuracy as you include 1, 5, 10, 25 trees — watch it climb then flatten; (3) two sentences: which ingredient created the gain, and what does RandomForest add that you didn\'t implement?

Hints: keep a list of fitted trees; \`np.mean([t.predict_proba(X_te)[:, 1] for t in trees], axis=0)\`. The missing ingredient is per-split feature subsetting (max_features) — decorrelation.`,
      },
    ],
    project: {
      title: 'The model bake-off report',
      brief: `Add \`bakeoff(models, X_train, X_test, y_train, y_test)\` to \`ml_toolkit.py\`: takes a list of (name, estimator) pairs, fits each on the shared split, and returns a sorted results table (train score, test score, gap, fit seconds via time.perf_counter). Include a \`DEFAULT_LINEUP\` constant with the five models from today\'s guided work. Then write \`bakeoff_notes.md\`: your table for today\'s dataset plus a six-sentence "model selection memo" a customer could read — which model you\'d ship, why, and what you\'d try next. This function is the engine of Day 77\'s competition and Day 83\'s churn bake-off. Commit both.`,
      rubric: [
        'bakeoff runs any (name, estimator) list on one shared split and returns sorted results including fit time',
        'Gap (train − test) column present — overfitting visible at a glance',
        'DEFAULT_LINEUP includes baseline, linear, single tree, forest, boosting',
        'Memo names a shipping choice and justifies it with numbers from the table, not vibes',
        'Both files committed to the practice repo',
      ],
    },
    mistakes: [
      'Believing more trees overfit a random forest. Averaging more bootstrap trees only stabilizes the estimate; n_estimators trades compute for variance, not test accuracy for train accuracy. (Boosting rounds are a different story — those DO overfit.)',
      'Tuning boosting\'s n_estimators by hand while ignoring learning_rate. The two are coupled: halve the learning rate and you need roughly double the rounds. Fix lr small, cap rounds high, let early stopping decide.',
      'Rigging the bake-off: tuning your favorite model while opponents run defaults, or giving models different splits/metrics. Same data, same metric, comparable tuning effort — or the table is fiction.',
      'Skipping the linear baseline because "trees always win tabular." On small-n, wide, or nearly-linear data, regularized logistic regression regularly wins — and it is 100× cheaper to serve.',
      'Reading forest probabilities as calibrated. Vote fractions are not honest probabilities; if downstream decisions consume them, calibrate (Day 75 touches this).',
      'Using boosting\'s training loss to pick rounds. Training loss decreases forever; only the validation curve knows when to stop — that is what early_stopping watches.',
    ],
    quiz: [
      {
        q: 'Random forests fight overfitting primarily by…',
        o: [
          'Growing shallower trees than a single tree would use',
          'Averaging many decorrelated high-variance trees, cancelling their independent errors',
          'Adding an L2 penalty on leaf values',
          'Stopping early on a validation set',
        ],
        x: 1,
        w: 'Bagging + random feature subsets manufacture diverse trees whose memorization errors point in different directions; averaging cancels them. Individual trees stay deep and overfit — the ensemble is what generalizes.',
        revisit: 74,
      },
      {
        q: 'You halve a gradient-boosting model\'s learning_rate. To recover the same fit quality you should expect to…',
        o: [
          'Halve n_estimators',
          'Roughly double the number of boosting rounds',
          'Double max_depth',
          'Change nothing else',
        ],
        x: 1,
        w: 'Each round now contributes half as much correction, so you need about twice as many rounds — the coupled-knobs trade. Early stopping finds the right count automatically.',
        revisit: 74,
      },
      {
        q: 'Bagging vs boosting in one line — which is correct?',
        o: [
          'Both train trees sequentially on residuals',
          'Bagging reduces bias; boosting reduces variance',
          'Bagging trains independent trees in parallel to cut variance; boosting trains sequential trees on errors to cut bias',
          'Bagging requires shallow trees; boosting requires deep trees',
        ],
        x: 2,
        w: 'Parallel-independent-averaging vs sequential-error-correcting is the whole contrast; it also explains their preferred tree shapes (deep for forests, shallow for boosting).',
        revisit: 74,
      },
    ],
    resources: [
      { label: 'scikit-learn User Guide — 1.11 Ensembles: forests & gradient boosting', url: 'https://scikit-learn.org/stable/modules/ensemble.html', type: 'docs', time: '30 min' },
      { label: 'StatQuest — Random Forests & Gradient Boost series', url: 'https://statquest.org/', type: 'video', time: '30 min' },
      { label: 'Kaggle Learn — Intermediate ML (XGBoost lesson)', url: 'https://www.kaggle.com/learn', type: 'course', time: '25 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: Day 73 cards (memorization, importances)', minutes: 10 },
      { activity: 'ELI5 + tech read', minutes: 20 },
      { activity: 'Guided: fair bake-off + learning-rate trade', minutes: 38 },
      { activity: 'Practice: bagging by hand', minutes: 20 },
      { activity: 'Project: bakeoff() + model selection memo', minutes: 22 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'Bake-off table recorded with fairness audit answered in writing',
      'Learning-rate sweep run; rounds-used pattern explained',
      'Hand-rolled bagging beats mean single tree; missing-ingredient sentence written',
      'bakeoff() and memo committed',
      'Quiz ≥ 2/3',
    ],
    connections: {
      back: 'Day 73\'s unstable, memorizing trees are the raw material — bagging is Day 60\'s bootstrap plus the law of large numbers, applied to models instead of sample means.',
      forward: 'Day 76 explains today\'s magic in bias/variance language. Day 77\'s competition and Day 83\'s churn project expect a boosted model in the lineup. On Day 129 the same idea returns for LLMs — routing across several models is ensembling by another name.',
    },
    flashcards: [
      { f: 'Two sources of randomness in a random forest?', b: 'Bootstrap resampling of rows per tree + random feature subset per split (max_features). Both decorrelate trees.' },
      { f: 'Bagging vs boosting, one line each?', b: 'Bagging: parallel independent trees, average → variance down. Boosting: sequential shallow trees fit errors → bias down.' },
      { f: 'Does raising n_estimators overfit a forest? Boosting?', b: 'Forest: no (only stabilizes). Boosting: yes — use early stopping on validation.' },
      { f: 'learning_rate ↓ by half ⇒ rounds…?', b: 'Roughly double. Coupled knobs: fix lr small, let early stopping pick rounds.' },
      { f: 'What is oob_score_?', b: 'Free validation: each tree\'s bootstrap misses ~37% of rows; score trees on the rows they never saw.' },
      { f: 'When does linear still beat trees on tabular?', b: 'Small n, wide/high-dimensional data, near-linear signal, or hard latency/interpretability constraints.' },
    ],
    deepDive: [
      { label: 'XGBoost documentation (local install)', url: 'https://xgboost.readthedocs.io/en/stable/', note: 'Same boosting mental model with regularized objectives and production tooling. Try replacing HistGradientBoosting in your bake-off locally — the API is nearly identical.' },
    ],
  },
  {
    id: 'd075', day: 75, week: 11, phase: 4, kind: 'lesson',
    title: 'Evaluation Metrics',
    analogy: 'Grading fairly',
    objectives: [
      'Demonstrate the accuracy trap on imbalanced data and explain why it fools stakeholders',
      'Read a confusion matrix and compute precision, recall, and F1 from its four cells',
      'Choose between ROC-AUC and PR-AUC based on class balance and what the curve hides',
      'Pick regression metrics (MAE/RMSE/R²) and explain what each punishes',
      'Derive the right metric from a business harm model — cost of a miss vs cost of a false alarm',
    ],
    prereqs: [
      { day: 72, label: 'Thresholds & predict_proba' },
      { day: 71, label: 'Baselines & honest splits' },
      { day: 59, label: 'Bayes and base rates' },
    ],
    eli5: `A security guard is graded on "percentage of correct decisions." The building gets broken into twice a year; thousands of innocent people walk in daily. The guard who waves EVERYONE through scores 99.9% — he was "right" about every innocent person and only wrong twice. Perfect grade, useless guard. The grade ignored the only events that mattered because they were rare.

Fair grading needs more than one number. Ask four questions instead: of the people he stopped, how many were actually burglars (precision — is he crying wolf)? Of the actual burglars, how many did he stop (recall — is he catching what matters)? What did each miss cost, and what did each false alarm cost? The right report card weights the questions by those costs. A cancer screener and a spam filter are both guards, but they must be graded oppositely: the screener is forgiven false alarms and fired for misses; the spam filter is forgiven misses and fired for false alarms. Today you learn to build the report card before the model — because the metric IS the definition of success.`,
    why: `"What metric?" is the first question in every ML interview and every customer engagement, and "accuracy" is the answer that fails both. FDEs inherit dashboards celebrating 97% accuracy on 3%-churn data — the model literally never predicts churn, and nobody noticed. Choosing the metric from the harm model is a conversation you lead with the customer, not a technicality: "what does a missed fraud cost you? a falsely-frozen account?" That conversation returns verbatim on Day 134 when you design LLM evals, and Day 83's churn project is graded on metric justification before model quality.`,
    tech: `### The confusion matrix is the ground truth

For binary classification every prediction lands in one of four cells: true positive, false positive, false negative, true negative. Every metric is arithmetic on these cells. **Accuracy** = (TP+TN)/all — worthless under imbalance because TN swamps it. **Precision** = TP/(TP+FP): of what you flagged, how much was real; its enemy is the false alarm. **Recall** = TP/(TP+FN): of what was real, how much you caught; its enemy is the miss. They trade against each other through the threshold (Day 72's sweep, now with names). **F1** is their harmonic mean — a single number when you must have one, punishing whichever is worse; use it knowingly, because it silently assumes both error types cost the same.

### Curves: ranking quality across all thresholds

**ROC-AUC** plots true-positive rate vs false-positive rate across every threshold; it equals the probability a random positive is scored above a random negative. It is threshold-free and scale-free — but under heavy imbalance it flatters: with 1% positives, a flood of false positives barely moves the false-positive RATE because negatives are legion. **PR-AUC** (precision-recall) keeps precision on the y-axis, which collapses when false positives pile up — the honest curve for rare-positive problems like fraud and churn. Rule of thumb: balanced classes → ROC-AUC reads fine; rare positives → report PR-AUC and the confusion matrix at your chosen operating threshold.

### Calibration, in one taste

A model is calibrated when "p = 0.7" events happen ~70% of the time. Check with \`sklearn.calibration.calibration_curve\`; fix with \`CalibratedClassifierCV\`. Forest vote-fractions and boosted scores are often miscalibrated — it matters the moment a downstream system consumes the probability itself (expected-cost decisions), not just the ranking.

### Regression metrics

**MAE** — average miss in target units; robust, what stakeholders understand. **RMSE** — square-then-average-then-root; punishes large errors quadratically, so it cares about the worst cases (and is hostage to outliers). **R²** — fraction of variance explained vs the mean predictor (Day 71). Report MAE + one of the others; never R² alone to a business audience.`,
    viz: 'confusion-matrix',
    guided: [
      {
        title: 'Name the counts you tallied on Day 72',
        minutes: 20,
        body: `1. Paste the starter — the same 5%-positive imbalanced setup from Day 72, now graded properly. Standalone; run locally if the browser lacks scikit-learn.
2. Run it. The dummy classifier posts ~95% accuracy with recall 0.00 — say the accuracy-trap sentence out loud: "it never once predicted the event we care about."
3. Read the model's confusion matrix. Hand-compute precision and recall from the four cells with a calculator, then check them against classification_report. This closes the loop on Day 72's raw counts: caught = TP, missed = FN, false alarms = FP.
4. Recompute precision/recall at thresholds 0.3 and 0.7 (reuse the proba array). Watch them trade. Write one sentence: which threshold would a fraud team pick, and which would a spam filter pick?`,
        code: `from sklearn.datasets import make_classification
from sklearn.dummy import DummyClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (classification_report, confusion_matrix,
                             precision_score, recall_score)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

X, y = make_classification(
    n_samples=4000, n_features=10, n_informative=5,
    weights=[0.95, 0.05], random_state=0
)
X_tr, X_te, y_tr, y_te = train_test_split(
    X, y, test_size=0.3, random_state=0, stratify=y
)

dummy = DummyClassifier(strategy="most_frequent").fit(X_tr, y_tr)
model = make_pipeline(StandardScaler(),
                      LogisticRegression(max_iter=1000)).fit(X_tr, y_tr)

for name, clf in [("dummy", dummy), ("logistic", model)]:
    pred = clf.predict(X_te)
    print(f"--- {name} ---")
    print("accuracy:", round(clf.score(X_te, y_te), 3))
    print(confusion_matrix(y_te, pred))
    print("precision:", round(precision_score(y_te, pred, zero_division=0), 3),
          " recall:", round(recall_score(y_te, pred, zero_division=0), 3))

proba = model.predict_proba(X_te)[:, 1]
for t in [0.7, 0.5, 0.3]:
    pred_t = (proba >= t).astype(int)
    print(f"t={t}  precision={precision_score(y_te, pred_t, zero_division=0):.3f}"
          f"  recall={recall_score(y_te, pred_t):.3f}")`,
      },
      {
        title: 'ROC-AUC flatters; PR-AUC tells',
        minutes: 18,
        body: `1. On the same imbalanced split, compute \`roc_auc_score\` and \`average_precision_score\` (the PR-AUC estimate) for the logistic model.
2. Now make the problem rarer: regenerate with \`weights=[0.99, 0.01]\` and retrain. Compare how much each metric moved. ROC-AUC will look almost unbothered; PR-AUC drops hard — precision is being destroyed by false positives among the flood of negatives, and only PR-AUC sees it.
3. Sanity anchor: what is a random model's ROC-AUC (0.5, always) and a random model's PR-AUC (the positive rate — 0.01 here)? Write both down; interviewers ask exactly this.
4. Decision drill, one sentence each: which single curve-metric do you headline for (a) a 50/50 sentiment classifier, (b) a 1%-fraud detector? Why?`,
        code: `from sklearn.metrics import average_precision_score, roc_auc_score

# after fitting model on the 5% data (previous exercise):
proba = model.predict_proba(X_te)[:, 1]
print("5% positives  ROC-AUC:", round(roc_auc_score(y_te, proba), 3),
      " PR-AUC:", round(average_precision_score(y_te, proba), 3))

X2, y2 = make_classification(
    n_samples=8000, n_features=10, n_informative=5,
    weights=[0.99, 0.01], random_state=0
)
X2_tr, X2_te, y2_tr, y2_te = train_test_split(
    X2, y2, test_size=0.3, random_state=0, stratify=y2
)
m2 = make_pipeline(StandardScaler(),
                   LogisticRegression(max_iter=1000)).fit(X2_tr, y2_tr)
p2 = m2.predict_proba(X2_te)[:, 1]
print("1% positives  ROC-AUC:", round(roc_auc_score(y2_te, p2), 3),
      " PR-AUC:", round(average_precision_score(y2_te, p2), 3))
print("random-model floors -> ROC-AUC: 0.5   PR-AUC:", round(y2_te.mean(), 3))`,
      },
    ],
    practice: [
      {
        title: 'The metric memo clinic',
        minutes: 18,
        body: `Three clients, three problems. For each, write a 3–4 sentence memo naming: the headline metric, the operating threshold philosophy (recall-first or precision-first), and one metric you refuse to report alone and why.

(a) Hospital sepsis early-warning: sepsis is ~2% of admissions; a miss can be fatal; a false alarm costs a nurse 10 minutes.
(b) E-commerce fraud blocker: fraud ~0.5% of orders; a false block loses a real customer; a miss loses the goods.
(c) House-price estimator for a bank: errors above 20% of the price are catastrophic; small errors are fine.

Hints: (a) and (b) are both rare-positive but their harm models point OPPOSITE directions on the precision/recall trade. (c) is regression — which of MAE/RMSE matches "large errors are catastrophic"?`,
      },
    ],
    project: {
      title: 'Upgrade the toolkit to speak metrics',
      brief: `Refactor \`evaluate_classification\` in \`ml_toolkit.py\`: replace Day 72's raw caught/missed/false-alarm counts with a proper metrics dict — accuracy, precision, recall, F1, ROC-AUC, PR-AUC — for both model and dummy baseline, plus the confusion matrix at a caller-chosen threshold. Add \`metric_advice(positive_rate)\`: a tiny function returning a one-line printed warning when the positive rate is under 15% ("imbalanced: headline PR-AUC, not accuracy/ROC-AUC"). Demonstrate in \`__main__\` on the 5% dataset showing the dummy's 95% accuracy next to its 0.0 recall — the accuracy trap, permanently encoded in your own tooling. Commit.`,
      rubric: [
        'Metrics dict includes precision, recall, F1, ROC-AUC, and PR-AUC for model AND baseline on the same split',
        'Confusion matrix computed at the caller-supplied threshold via predict_proba, not bare predict',
        'metric_advice fires correctly below the 15% positive-rate line',
        'The __main__ demo prints the dummy accuracy-vs-recall contrast with a comment naming the trap',
        'Committed to the practice repo',
      ],
    },
    mistakes: [
      'Reporting accuracy on imbalanced data. A majority-class dummy scores (1 − positive rate) by doing nothing; always show the confusion matrix or precision/recall alongside.',
      'Using F1 as a default without asking whose harm model it encodes. F1 weights false positives and false negatives equally — most businesses do not.',
      'Headlining ROC-AUC for rare-positive problems. The false-positive RATE barely moves when negatives are plentiful; PR-AUC exposes the precision collapse ROC hides.',
      'Comparing precision or recall between models at different thresholds. Fix the threshold (or compare full curves); otherwise you are comparing policies, not models.',
      'Treating RMSE and MAE as interchangeable. RMSE squares errors, so one outlier can dominate it; MAE is the honest "typical miss." Choose by whether big errors are disproportionately bad.',
      'Trusting predicted probabilities from forests/boosting for expected-cost math without a calibration check. Ranking can be great while the probabilities are fiction.',
    ],
    quiz: [
      {
        q: 'A churn model on 4%-churn data reports 96% accuracy. What must you check before celebrating?',
        o: [
          'The training accuracy',
          'Its recall on the churn class — a model that never predicts churn also scores 96%',
          'The number of features',
          'Whether it used cross-validation',
        ],
        x: 1,
        w: 'The majority-class dummy achieves accuracy equal to the majority rate. Recall (and the confusion matrix) reveals whether the model catches any actual churners at all.',
        revisit: 75,
      },
      {
        q: 'Your fraud model flags 200 transactions; 40 are real fraud. There were 100 frauds in total. Precision and recall are…',
        o: [
          'Precision 0.40, recall 0.20',
          'Precision 0.20, recall 0.40',
          'Precision 0.20, recall 0.20',
          'Precision 0.40, recall 0.40',
        ],
        x: 1,
        w: 'Precision = 40/200 = 0.20 (of the flagged, how many were real). Recall = 40/100 = 0.40 (of the real, how many were caught). Keeping the denominators straight is the whole skill.',
        revisit: 75,
      },
      {
        q: 'For a 1%-positive problem, why prefer PR-AUC over ROC-AUC as the headline?',
        o: [
          'PR-AUC is always higher',
          'ROC-AUC cannot be computed on imbalanced data',
          'With abundant negatives the false-positive rate stays tiny even as false positives swamp precision — ROC flatters, PR-AUC shows the damage',
          'PR-AUC is threshold-dependent and therefore more realistic',
        ],
        x: 2,
        w: 'ROC\'s x-axis divides false positives by the huge negative count, hiding their operational cost. Precision divides by the flagged count, so it collapses exactly when the flags become noise.',
        revisit: 75,
      },
    ],
    resources: [
      { label: 'scikit-learn User Guide — 3.4 Metrics and scoring', url: 'https://scikit-learn.org/stable/modules/model_evaluation.html', type: 'docs', time: '30 min' },
      { label: 'Google ML Crash Course — classification metrics (precision/recall/ROC)', url: 'https://developers.google.com/machine-learning/crash-course', type: 'course', time: '25 min' },
      { label: 'StatQuest — confusion matrix, sensitivity/specificity, ROC & AUC', url: 'https://statquest.org/', type: 'video', time: '25 min' },
      { label: 'Kaggle Learn — model evaluation practice', url: 'https://www.kaggle.com/learn', type: 'course', time: '20 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: Day 72 threshold cards + Day 59 base-rate card', minutes: 10 },
      { activity: 'ELI5 + tech read; confusion-matrix visualizer', minutes: 20 },
      { activity: 'Guided: name the counts + ROC vs PR', minutes: 38 },
      { activity: 'Practice: metric memo clinic', minutes: 18 },
      { activity: 'Project: metrics upgrade to ml_toolkit.py', minutes: 24 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'Precision and recall hand-computed from the confusion matrix and verified against sklearn',
      'ROC-vs-PR experiment run at 5% and 1% positives; floors for a random model written down',
      'Three metric memos written with harm-model justification',
      'ml_toolkit.py metrics upgrade committed',
      'Quiz ≥ 2/3',
    ],
    connections: {
      back: 'Day 72\'s threshold sweep tallied these exact cells before they had names; Day 59\'s base-rate neglect is the accuracy trap wearing a lab coat. Day 71\'s baseline discipline is why every metric here is reported against a dummy.',
      forward: 'Tomorrow cross-validation puts error bars on these metrics. Day 77\'s model card and Day 83\'s churn project both open with metric choice. On Day 134–139 the same discipline — metric from harm model, baseline first, error bars — becomes LLM eval design.',
    },
    flashcards: [
      { f: 'Precision vs recall — denominators?', b: 'Precision = TP / flagged (TP+FP). Recall = TP / actual positives (TP+FN). Flag-quality vs catch-rate.' },
      { f: 'The accuracy trap?', b: 'Under imbalance, the do-nothing majority classifier scores accuracy = majority rate. Check recall/confusion matrix.' },
      { f: 'When PR-AUC over ROC-AUC?', b: 'Rare positives: ROC\'s FP-rate hides false-positive floods; PR-AUC shows the precision collapse.' },
      { f: 'Random-model floors for ROC-AUC and PR-AUC?', b: 'ROC-AUC: 0.5 always. PR-AUC: the positive rate of the dataset.' },
      { f: 'MAE vs RMSE?', b: 'MAE = typical miss in units, robust. RMSE squares errors — punishes big misses, hostage to outliers.' },
      { f: 'What does F1 silently assume?', b: 'False positives and false negatives cost the same. Most harm models disagree — choose deliberately.' },
    ],
    deepDive: [
      { label: 'Cost-sensitive thresholding', note: 'With calibrated probabilities and per-cell dollar costs, the optimal threshold is where expected cost of flagging equals expected cost of not flagging — turning Day 72\'s sweep into one formula. Try deriving it for practice scenario (b).' },
    ],
  },
  {
    id: 'd076', day: 76, week: 11, phase: 4, kind: 'lesson',
    title: 'Validation, Bias/Variance & Regularization',
    analogy: 'Practice tests vs the real exam',
    objectives: [
      'Run k-fold cross-validation and report mean ± std instead of a single lucky split',
      'Diagnose bias vs variance from train/validation curves and prescribe the right fix',
      'Explain what L1 and L2 penalties do to weights and when each is the right choice',
      'Tune hyperparameters with GridSearchCV/RandomizedSearchCV without touching the test set',
      'Describe the overfitting-to-the-validation-set trap and the nested-CV idea that guards against it',
    ],
    prereqs: [
      { day: 71, label: 'Train/test splits & baselines' },
      { day: 74, label: 'Ensembles & the bake-off' },
      { day: 60, label: 'Sampling variance & confidence intervals' },
    ],
    eli5: `A student has one practice test and one real exam. She takes the practice test, studies, retakes it, studies again — until she scores 100%. Has she learned chemistry, or has she learned THAT practice test? You cannot tell, and neither can she. The honest setup: five practice tests, rotated — study on four, check yourself on the held-out fifth, then rotate which one is held out. Five scores instead of one, and their average AND their spread tell you how she will really do. The real exam stays sealed in an envelope until the very end, taken exactly once.

That is cross-validation. The rotation is k-fold; the sealed envelope is your test set. And the student's failure mode has a name in ML: tune your model against the same validation data enough times and you overfit to the validation set itself — the practice test memorized by proxy. The spread across folds is the error bar Day 60 taught you to demand: a model that scores 0.85 ± 0.01 across folds and one that scores 0.86 ± 0.06 are not simply "0.86 wins."`,
    why: `Every result you report from now on carries this discipline: mean ± spread across folds, test set touched once. Interviews probe it directly ("your val score improved — how do you know it's real?") and bias/variance diagnosis is a top-three ML interview topic. In the field it is the difference between "our model got better" and shipping a mirage: FDEs see customers burn weeks tuning against one lucky split. Day 63 already made you demand error bars on eval scores; Day 139 applies the identical logic to LLM evals, where run-to-run variance is even nastier.`,
    tech: `### Cross-validation

k-fold CV splits training data into k folds; train on k−1, validate on the held-out fold, rotate, collect k scores. \`cross_val_score(model, X, y, cv=5, scoring="...")\` does it in one call — use \`StratifiedKFold\` (the classification default) to preserve class ratios per fold. Report mean and std. The test set is NOT part of this: CV replaces the single validation split, not the final exam. Two caveats that bite in production: shuffle (or use the stratified splitter) when data is ordered, and NEVER let preprocessing peek across folds — fit scalers inside a Pipeline so each fold's scaler sees only that fold's training part (leakage, Day 69).

### Bias/variance diagnosis

Total error decomposes into **bias** (model too simple — systematic misses; train AND validation scores low and close) and **variance** (model too flexible — memorizes; train high, validation much lower) plus irreducible noise. The depth-sweep table from Day 73 was exactly this. Prescriptions differ: high bias → more capacity, better features (more data will NOT help); high variance → more data, regularization, simpler model, ensembles. **Learning curves** (score vs training-set size, \`sklearn.model_selection.learning_curve\`) settle the "would more data help?" question empirically: converged-and-low curves say bias; a persistent gap that narrows with size says variance and more data will pay.

### Regularization

Regularization adds a penalty on weight size to the loss: **L2** (ridge) adds sum of squared weights — shrinks all weights smoothly toward zero, the default stabilizer; **L1** (lasso) adds sum of absolute values — drives some weights to EXACTLY zero, performing feature selection. sklearn: \`Ridge\`/\`Lasso\` for regression, \`penalty="l2"/"l1"\` with \`C\` (inverse strength) in LogisticRegression — Day 72's C, now fully explained. Scale features first: penalties are unit-sensitive.

### Hyperparameter search, honestly

\`GridSearchCV\` exhaustively tries a parameter grid with CV inside; \`RandomizedSearchCV\` samples the grid — usually smarter when parameters are continuous or the grid is big. Both refit the best setting on all training data. The trap: the best-of-many CV score is optimistically biased (you picked the max of noisy numbers — Day 61's multiple comparisons). For an honest generalization estimate of the whole tuning procedure, **nested CV** wraps the search in an outer CV loop; in practice, a once-touched test set is the pragmatic stand-in.`,
    viz: 'bias-variance',
    guided: [
      {
        title: 'One split lies; five folds put error bars on it',
        minutes: 20,
        body: `1. Paste the starter. It scores logistic regression on the breast-cancer data with ten different single train/test splits, then with 5-fold CV. Standalone; run locally if needed.
2. Run it. Look at the ten single-split scores: the spread is your Day 71 "change random_state and the score moves" observation, quantified. A single split is one draw from that distribution.
3. Compare with the CV result: mean ± std from five folds. Write the reporting sentence you will use forever: "accuracy 0.97 ± 0.01 across 5 folds."
4. Now the leakage drill: the starter scores TWO pipelines — scaler inside the pipeline (correct) vs scaling X once before CV (subtly wrong: each fold\'s scaler saw the validation rows). The scores differ little here, but write one sentence on why the second is disqualified on principle — the fold was not truly held out.`,
        code: `import numpy as np
from sklearn.datasets import load_breast_cancer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import cross_val_score, train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

X, y = load_breast_cancer(return_X_y=True)

singles = []
for seed in range(10):
    X_tr, X_te, y_tr, y_te = train_test_split(
        X, y, test_size=0.25, random_state=seed, stratify=y
    )
    clf = make_pipeline(StandardScaler(), LogisticRegression(max_iter=2000))
    singles.append(clf.fit(X_tr, y_tr).score(X_te, y_te))
print("ten single splits:", [round(s, 3) for s in singles])
print(f"spread: min={min(singles):.3f} max={max(singles):.3f}")

pipe = make_pipeline(StandardScaler(), LogisticRegression(max_iter=2000))
scores = cross_val_score(pipe, X, y, cv=5)
print(f"5-fold CV: {scores.mean():.3f} +/- {scores.std():.3f}")

# the disqualified version: scaler fit on ALL rows before CV
X_leaky = StandardScaler().fit_transform(X)
leaky = cross_val_score(LogisticRegression(max_iter=2000), X_leaky, y, cv=5)
print(f"leaky-scaled CV: {leaky.mean():.3f} +/- {leaky.std():.3f}  (do not do this)")`,
      },
      {
        title: 'Tune without cheating, then watch L1 delete features',
        minutes: 18,
        body: `1. Split breast-cancer into train/test ONCE (the sealed envelope). On the training part only, run GridSearchCV over logistic regression\'s C in [0.01, 0.1, 1, 10, 100] with 5-fold CV inside a scaling pipeline.
2. Print \`search.best_params_\` and \`search.best_score_\` (the CV estimate), then — once — score \`search.best_estimator_\` on the sealed test set. The two numbers should be close; a big drop means the search overfit the folds.
3. Now the L1 demo: fit LogisticRegression with \`penalty="l1", solver="liblinear"\` at C = 1, 0.1, 0.05 and count nonzero coefficients each time (30 features total). Watch features get zeroed as the penalty tightens — automatic feature selection.
4. Write the pairing in your notes: L2 = shrink everything, keep everything (stability); L1 = shrink and DELETE (sparsity/selection). Both need scaled features.`,
        code: `import numpy as np
from sklearn.datasets import load_breast_cancer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import GridSearchCV, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

X, y = load_breast_cancer(return_X_y=True)
X_tr, X_te, y_tr, y_te = train_test_split(
    X, y, test_size=0.25, random_state=42, stratify=y
)

pipe = Pipeline([("scale", StandardScaler()),
                 ("clf", LogisticRegression(max_iter=5000))])
search = GridSearchCV(pipe, {"clf__C": [0.01, 0.1, 1, 10, 100]}, cv=5)
search.fit(X_tr, y_tr)
print("best C:", search.best_params_["clf__C"],
      " CV score:", round(search.best_score_, 3))
print("sealed test score:", round(search.score(X_te, y_te), 3))

scaler = StandardScaler().fit(X_tr)
for C in [1, 0.1, 0.05]:
    l1 = LogisticRegression(penalty="l1", solver="liblinear", C=C)
    l1.fit(scaler.transform(X_tr), y_tr)
    nz = int(np.sum(l1.coef_ != 0))
    print(f"L1 C={C:5.2f}  nonzero coefficients: {nz}/30")`,
      },
    ],
    practice: [
      {
        title: 'The diagnosis clinic',
        minutes: 20,
        body: `Generate a small noisy dataset: \`make_classification(n_samples=400, n_features=20, n_informative=5, flip_y=0.05, random_state=3)\`. Produce learning curves (\`sklearn.model_selection.learning_curve\`, train sizes 50→300, cv=5) for two patients: (a) LogisticRegression in a scaled pipeline, (b) an unconstrained DecisionTreeClassifier.

Goal: (1) tabulate train vs validation score at each size for both; (2) diagnose each patient in bias/variance language, citing the gap and the trend; (3) prescribe: for each, would more data help, and what single change would you make instead or as well? (4) verify one prescription by applying it and re-running.

Hints: the tree should show a huge persistent gap (variance — cap depth or add data); logistic on 20 mostly-noise features may show both curves converging early (bias-ish for the nonlinear part it cannot express — but also note how L1 could prune the 15 noise features).`,
      },
    ],
    project: {
      title: 'CV and search enter the toolkit',
      brief: `Add two functions to \`ml_toolkit.py\`. \`cv_report(model, X, y, cv=5, scoring=None)\` returns mean, std, and the per-fold scores, and formats the "0.97 ± 0.01" reporting string. \`tune(model, param_grid, X_train, y_train, cv=5)\` wraps GridSearchCV, prints best params + CV score, and returns the refit best estimator — with a docstring warning that the returned CV score is optimistic (best-of-many) and the sealed test set is scored once, elsewhere. Upgrade \`bakeoff\` from Day 74 to accept \`cv=k\` and report mean ± std per model instead of single-split scores. Demonstrate on breast-cancer in \`__main__\`. Commit.`,
      rubric: [
        'cv_report returns mean/std/fold-scores and the formatted ± string',
        'tune performs search on training data only and documents the optimism caveat in its docstring',
        'bakeoff(cv=5) reports mean ± std per model and still sorts sensibly',
        'Pipelines used so scaling happens inside folds — no leaky preprocessing',
        'Committed to the practice repo',
      ],
    },
    mistakes: [
      'Reporting the best GridSearchCV score as your generalization estimate. It is the max of noisy numbers — optimistically biased. The sealed test set (or nested CV) gives the honest figure.',
      'Running CV on pre-scaled data. Fitting the scaler on all rows lets every fold peek at its validation part. Put preprocessing in the Pipeline; CV the pipeline.',
      'Tuning against the test set "just once or twice." Each peek converts exam into homework; by the fifth peek your test score is a validation score with a fancy name.',
      'Prescribing more data for a high-bias model. If train and validation scores are low and converged, the model cannot express the signal — capacity or features, not rows.',
      'Using L1 on unscaled features and reading the surviving coefficients as importance. The penalty hits large-unit features hardest; scale first or the selection is an artifact of units.',
      'Ignoring the std across folds. A 0.86 ± 0.06 model is not better than 0.85 ± 0.01 — Day 60\'s error-bar discipline applies to model selection too.',
    ],
    quiz: [
      {
        q: 'Model A: train 0.97, 5-fold validation 0.71. Model B: train 0.74, validation 0.72. Diagnoses?',
        o: [
          'A high bias; B high variance',
          'A high variance (big gap); B high bias (both low, converged)',
          'Both high variance',
          'Both are fine; B is better',
        ],
        x: 1,
        w: 'A memorizes (large generalization gap → variance: regularize, simplify, or add data). B cannot express the signal (low and close → bias: add capacity or features; more data will not help).',
        revisit: 76,
      },
      {
        q: 'Why must the scaler be fit inside each CV fold (via a Pipeline) rather than once on all the data?',
        o: [
          'It is faster',
          'Fitting on all rows leaks validation-fold statistics into training — the fold is no longer truly held out',
          'StandardScaler only works inside Pipelines',
          'It changes the number of folds',
        ],
        x: 1,
        w: 'Preprocessing is part of the model. If its parameters (means, stds) saw the validation rows, the evaluation is contaminated — the same leakage principle as Day 69, at the fold level.',
        revisit: 76,
      },
      {
        q: 'L1 vs L2 regularization — the practical difference?',
        o: [
          'L1 shrinks weights smoothly; L2 zeroes some out',
          'L2 shrinks all weights smoothly toward zero; L1 drives some to exactly zero, selecting features',
          'L1 is for classification, L2 for regression',
          'They are identical for scaled features',
        ],
        x: 1,
        w: 'The absolute-value penalty has a corner at zero that traps small weights exactly there — sparsity. The squared penalty just shrinks. Both need scaled features to penalize fairly.',
        revisit: 76,
      },
    ],
    resources: [
      { label: 'scikit-learn User Guide — 3.1 Cross-validation', url: 'https://scikit-learn.org/stable/modules/cross_validation.html', type: 'docs', time: '30 min' },
      { label: 'StatQuest — bias & variance, ridge/lasso regression', url: 'https://statquest.org/', type: 'video', time: '25 min' },
      { label: 'Google ML Crash Course — generalization & regularization', url: 'https://developers.google.com/machine-learning/crash-course', type: 'course', time: '20 min' },
      { label: 'Kaggle Learn — Intermediate ML (cross-validation lesson)', url: 'https://www.kaggle.com/learn', type: 'course', time: '20 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: Days 73–75 cards + Day 60 error-bar card', minutes: 10 },
      { activity: 'ELI5 + tech read; bias-variance visualizer', minutes: 20 },
      { activity: 'Guided: folds & error bars + honest tuning & L1', minutes: 38 },
      { activity: 'Practice: the diagnosis clinic', minutes: 20 },
      { activity: 'Project: cv_report, tune, and bakeoff upgrade', minutes: 22 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'Ten-split spread vs CV mean ± std recorded; reporting sentence written',
      'GridSearchCV run with sealed-test confirmation; L1 sparsity counts recorded',
      'Both learning-curve patients diagnosed and one prescription verified',
      'Toolkit functions committed',
      'Quiz ≥ 2/3',
    ],
    connections: {
      back: 'Day 60\'s sampling variance is why one split lies, and Day 61\'s multiple-comparisons warning is why the best-of-grid score flatters. Day 73\'s depth sweep was bias/variance before it had the name; Day 72\'s C parameter finally got its full story.',
      forward: 'Tomorrow\'s competition requires CV and a sealed holdout — this is the referee\'s rulebook. Day 83\'s churn rubric grades CV discipline explicitly. On Day 139, fold-to-fold variance becomes run-to-run variance in LLM evals, same statistics, higher stakes.',
    },
    flashcards: [
      { f: 'What does 5-fold CV replace, and what does it NOT replace?', b: 'Replaces the single validation split (gives mean ± std). Does NOT replace the sealed, once-touched test set.' },
      { f: 'High-variance signature and fixes?', b: 'Train ≫ validation. Fixes: regularize, simplify, more data, ensembles.' },
      { f: 'High-bias signature and fixes?', b: 'Train and validation both low and close. Fixes: more capacity/features. More data will not help.' },
      { f: 'Why is best_score_ from GridSearchCV optimistic?', b: 'It is the max of many noisy CV scores — selection inflates it. Confirm on the sealed test set once.' },
      { f: 'L1 vs L2 in five words each?', b: 'L1: shrink and delete (sparse). L2: shrink everything smoothly (stable).' },
      { f: 'Would more data help? How to check empirically?', b: 'Learning curves: persistent narrowing gap → yes (variance). Converged low curves → no (bias).' },
    ],
    deepDive: [
      { label: 'Nested cross-validation, properly', note: 'Outer CV estimates the generalization of the WHOLE procedure (search included); inner CV does the tuning. Expensive but the honest answer when no test set can be spared — sklearn\'s docs show it in ~15 lines.' },
    ],
  },
  {
    id: 'd077', day: 77, week: 11, phase: 4, kind: 'review',
    title: 'Week 11 Checkpoint: Tabular Mini-Competition',
    analogy: 'First leaderboard',
    objectives: [
      'Recall the week\'s core contrasts from memory: under/overfitting, bagging/boosting, precision/recall, L1/L2',
      'Beat two baselines on a held-out split of a real tabular dataset using the full Week 11 protocol',
      'Write a model card: metric choice, CV setup, results with error bars, error analysis, next steps',
      'Apply the sealed-test-set discipline under mild competitive pressure without cheating',
    ],
    prereqs: [
      { day: 71, label: 'Baselines & framing' },
      { day: 74, label: 'Ensemble bake-off' },
      { day: 75, label: 'Metric choice' },
      { day: 76, label: 'CV & honest tuning' },
    ],
    eli5: `A week of driving lessons is not a driver. Today you take the road test: one real dataset, a locked-away holdout, and a leaderboard of exactly three entries — a dummy baseline, a plain logistic regression, and you. Your only job is to beat the first two, honestly, and to write up how you did it.

Why a competition format? Because mild pressure is a truth serum. When a score is at stake, the temptation to peek at the test set, to tune one more time against the same folds, or to quietly switch metrics until one looks good becomes real — and resisting those temptations is the actual skill being tested. And why start with recall drills before touching the data? Spaced repetition: six days of concepts are just now starting to fade, and the act of dragging them back from memory — not rereading them — is what moves them to long-term storage. You will need them fluent, not familiar: the ML interview on Day 84 and every real project after it assume this week is reflex.`,
    why: `This is the smallest complete rehearsal of the job. Real engagements are exactly this shape: unfamiliar tabular data, a business metric to justify, baselines to beat, and a writeup a stakeholder can trust. The model card you produce today is a portfolio artifact — hiring managers ask "show me an end-to-end" and this is your first. It is also the dress rehearsal for Day 83\'s graded churn project: same protocol, higher stakes. Kaggle-style competition experience, even a private one, is a recognized signal that you can operationalize theory.`,
    tech: `### What today reviews, and how

Morning drills use **active recall**: write the answers from memory FIRST, then check against the week's notes and diff. The week's spine: Day 71 (function+loss+optimizer, baselines, underfitting), Day 72 (sigmoid, cross-entropy, thresholds), Day 73 (splits, impurity, memorization), Day 74 (bagging vs boosting), Day 75 (confusion matrix, PR vs ROC), Day 76 (CV, bias/variance, L1/L2, honest tuning). Every one of these appears in the afternoon's build.

### The competition protocol

The dataset is the **Adult income** census table from OpenML (~48k rows, mixed numeric/categorical features, ~24% positive class — mildly imbalanced, realistic). \`fetch_openml("adult", version=2)\` downloads it; run locally with scikit-learn and pandas installed. The rules, which mirror production discipline:

1. Split test off FIRST (20%, stratified, random_state=77) and never touch it until step 6.
2. Choose and justify the metric BEFORE modeling (24% positives — what do you headline?).
3. Fit the two official baselines: most-frequent dummy, and scaled logistic regression, both via your ml_toolkit.
4. Improve with anything from this week: trees, forests, boosting, tuning via CV on the training portion only.
5. Select your single final model on CV evidence (mean ± std, Day 76).
6. Score ALL THREE entries on the sealed test set exactly once. Those three numbers are the leaderboard.

### The model card

One markdown page: problem framing, metric + why, data notes (anything odd you found), CV setup, leaderboard table, three misclassified examples examined by hand with a hypothesis each (a preview of Day 80's error analysis), and next steps. The writing is not decoration — a model nobody can audit is a model nobody should ship.`,
    viz: null,
    guided: [
      {
        title: 'Recall drills — closed book, then diff',
        minutes: 25,
        body: `Close all notes. In a fresh markdown file, from memory:

1. Draw the 2×2 confusion matrix, label all four cells, and write the precision and recall formulas. (Day 75)
2. Write the bias/variance diagnosis table: the two score signatures and two fixes for each. (Day 76)
3. Explain bagging vs boosting in exactly two sentences. (Day 74)
4. Write the log-loss formula and say in one line why MSE is wrong for classification. (Day 72)
5. List the three-choice framing of any ML setup and the first model you fit on any new problem. (Day 71)
6. Now open the week\'s notes and diff. Mark each item ✓ (clean), ~ (partial), ✗ (blank). Re-derive every ✗ from the source day before proceeding — the afternoon build depends on them.`,
      },
      {
        title: 'Competition setup — the referee\'s checklist',
        minutes: 10,
        body: `1. Create \`week11_competition/\` in your practice repo with the starter script.
2. Run the data-loading cell once; confirm shapes (~48k × 14) and the positive rate (~0.24).
3. Write your metric declaration at the top of the model card BEFORE fitting anything: headline metric, why, and the threshold philosophy if applicable.
4. Verify the sealed split exists and is stratified. From this point, X_test/y_test appear in exactly one more line of code — the final scoring.`,
        code: `import pandas as pd
from sklearn.datasets import fetch_openml
from sklearn.model_selection import train_test_split

# ~48k rows; downloads once, then cached. Run locally.
adult = fetch_openml("adult", version=2, as_frame=True)
X, y = adult.data, (adult.target == ">50K").astype(int)
print(X.shape, " positive rate:", round(y.mean(), 3))
print(X.dtypes.value_counts())  # mixed: numbers + categories -> Day 69 tools

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=77, stratify=y
)
# SEALED: X_test/y_test now appear exactly once more — final scoring.`,
      },
    ],
    practice: [
      {
        title: 'The competition itself',
        minutes: 45,
        body: `Beat the two baselines on the sealed test set. Constraints: categorical features need encoding (Day 69\'s ColumnTransformer with OneHotEncoder(handle_unknown="ignore") for linear models; OrdinalEncoder is fine for tree ensembles), all model selection happens via CV on the training portion, and the test set is scored once, at the end, for all three entries together.

Suggested path (not mandatory): baselines → HistGradientBoostingClassifier default → one tuning pass (learning_rate × max_iter via your toolkit\'s tune()) → final CV check → seal-break.

Hints if stuck: HistGradientBoosting accepts categorical features natively via \`categorical_features="from_dtype"\` on pandas categoricals — one line instead of an encoder. A good boosted model lands around 0.87 accuracy / 0.92 ROC-AUC territory; your leaderboard should show clear water between all three entries. If your model barely beats logistic regression, say so honestly in the card — that finding is common on this dataset and worth two sentences.`,
      },
    ],
    project: {
      title: 'Ship the model card',
      brief: `Write \`week11_competition/MODEL_CARD.md\`: (1) framing — target, features, who would use this prediction; (2) metric declaration written before modeling, with the harm-model sentence; (3) data notes — at least two observations (imbalance, a suspicious feature, missing values); (4) method — encoding choice, CV setup, what you tuned; (5) the three-entry leaderboard table from the single seal-break, with CV mean ± std alongside; (6) error autopsy — three test-set misclassifications examined, one hypothesis each; (7) next steps — two concrete ideas you did NOT do. Commit the card and the runnable script together.`,
      rubric: [
        'Sealed test set scored exactly once — the script structure proves it',
        'Metric declared and justified before any model was fit',
        'Both official baselines present in the leaderboard; your model beats both',
        'CV mean ± std reported for the final model, not just the test number',
        'Three-error autopsy with a falsifiable hypothesis per error',
        'Card + script committed and runnable end-to-end',
      ],
    },
    mistakes: [
      'Tuning "one more time" after seeing the test score. The seal is broken — any further changes are test-set fitting. The honest move: report it, and note the re-tune as future work.',
      'Choosing the metric after seeing which one your model wins. Metric declaration precedes modeling; that ordering is the integrity of the whole exercise.',
      'One-hot encoding into a tree ensemble and wondering why it slowed down. Trees handle ordinal/native categoricals well; one-hot explodes width for no gain there (it IS needed for linear models).',
      'Reporting only the test number. Test-once gives a point estimate; the CV mean ± std is what makes it credible. Report both.',
      'Skipping the error autopsy because the score looked good. Three examined errors routinely reveal a data bug or a slice problem the aggregate metric hides — Day 80 builds a whole day on this.',
      'Treating the recall drills as optional warm-up. Retrieval practice is the highest-leverage 25 minutes of the day; rereading feels better and teaches less.',
    ],
    quiz: [
      {
        q: 'On this ~24%-positive dataset, your model posts accuracy 0.87. What single number do you check before trusting it?',
        o: [
          'Training accuracy',
          'The dummy baseline\'s accuracy (~0.76) — and the model\'s recall on the positive class',
          'The number of boosting rounds',
          'R²',
        ],
        x: 1,
        w: 'Accuracy only means something relative to the majority-rate floor, and recall shows whether the minority class is actually being caught. Baseline-first, always.',
        revisit: 75,
      },
      {
        q: 'Your GridSearchCV best score is 0.90 but the sealed test gives 0.87. The MOST likely explanation is…',
        o: [
          'The test set is broken',
          'Best-of-grid CV scores are optimistically biased; a modest drop on the sealed set is expected',
          'The model overfit the training data',
          'You should re-run the search with more parameters',
        ],
        x: 1,
        w: 'Picking the max of many noisy CV numbers inflates the winner. A small CV→test drop is the predicted cost of selection, not a bug — and re-searching after seeing the test score would be cheating.',
        revisit: 76,
      },
      {
        q: 'You one-hot encode 14 mixed columns and feed them to logistic regression AND to gradient boosting. Which pairing is questionable?',
        o: [
          'One-hot + logistic regression',
          'One-hot + gradient boosting — trees split categories natively; one-hot mostly adds width',
          'Both are wrong',
          'Neither; encoding never matters',
        ],
        x: 1,
        w: 'Linear models need one-hot to give each category its own weight. Tree ensembles handle ordinal/native categorical encodings well and one-hot fragments their splits.',
        revisit: 74,
      },
    ],
    resources: [
      { label: 'scikit-learn User Guide — 3.1 Cross-validation (rules refresher)', url: 'https://scikit-learn.org/stable/modules/cross_validation.html', type: 'docs', time: '15 min' },
      { label: 'Kaggle Learn — Intermediate Machine Learning', url: 'https://www.kaggle.com/learn', type: 'course', time: '25 min' },
      { label: 'scikit-learn User Guide — 3.4 Metrics and scoring', url: 'https://scikit-learn.org/stable/modules/model_evaluation.html', type: 'docs', time: '15 min' },
    ],
    schedule: [
      { activity: 'Recall drills: closed-book Week 11 spine, then diff', minutes: 25 },
      { activity: 'Competition setup + metric declaration', minutes: 10 },
      { activity: 'The competition: baselines → model → CV → seal-break', minutes: 45 },
      { activity: 'Model card writing + error autopsy', minutes: 25 },
      { activity: 'Cumulative quiz + flashcard deck review (due cards D71–76)', minutes: 15 },
    ],
    completion: [
      'All six recall drills attempted closed-book; every ✗ re-derived',
      'Leaderboard shows your model beating both baselines on the once-touched test set',
      'MODEL_CARD.md complete with all seven sections and committed',
      'Cumulative quiz ≥ 2/3',
    ],
    connections: {
      back: 'Every rule in today\'s protocol was earned this week: baselines (Day 71), threshold thinking (Day 72), memorization risk (Day 73), the ensemble lineup (Day 74), metric-from-harm (Day 75), CV and the sealed envelope (Day 76). The ColumnTransformer encoding is Day 69 paying rent.',
      forward: 'Day 83 reruns this protocol on churn with an 8-criterion rubric and a business framing layer. The error autopsy expands into Day 80\'s full error-analysis method, and the model card format returns for LLM systems on Day 140\'s eval report.',
    },
    flashcards: [
      { f: 'The competition protocol\'s first and last steps?', b: 'First: split and seal the test set. Last: score every entry on it exactly once.' },
      { f: 'When must the metric be chosen?', b: 'Before modeling — declared and justified from the harm model, or the choice is contaminated by results.' },
      { f: 'Encoding rule of thumb: linear vs trees?', b: 'Linear models: one-hot. Tree ensembles: ordinal/native categoricals — one-hot just adds width.' },
      { f: 'What accompanies the single test score in a report?', b: 'CV mean ± std from the training portion — the error bars that make the point estimate credible.' },
      { f: 'What is a model card?', b: 'A one-page audit trail: framing, metric + why, method, results with error bars, error autopsy, next steps.' },
    ],
    deepDive: [
      { label: 'Model Cards for Model Reporting (Mitchell et al.)', url: 'https://arxiv.org/abs/1810.03993', note: 'The paper that named the artifact you wrote today — skim the proposed sections and note which ones your card already covers.' },
    ],
  },
  {
    id: 'd078', day: 78, week: 12, phase: 4, kind: 'lesson',
    title: 'Clustering',
    analogy: 'Sorting a garage sale, unlabeled',
    objectives: [
      'Explain the k-means assign/update loop and why it always converges (to something)',
      'Choose k using the elbow and silhouette methods, and say why neither is an oracle',
      'Explain when DBSCAN beats k-means and what its two parameters control',
      'Profile clusters back in original units and give each a name a stakeholder would recognize',
      'State why scaling is mandatory for distance-based methods',
    ],
    prereqs: [
      { day: 50, label: 'Vectors, norms & distance' },
      { day: 69, label: 'Scaling & why it matters' },
      { day: 66, label: 'pandas groupby for profiling' },
    ],
    eli5: `You inherit a garage full of a stranger's stuff — no labels, no inventory. So you start making piles: this feels kitchen-ish, that pile is clearly tools, those boxes are holiday decorations. Nobody told you the categories; you invented them by putting similar things near each other and noticing where the gaps fall. Two friends sorting the same garage would produce slightly different piles — and both could be defensible. That is clustering: discovering structure with no answer key.

k-means is a specific sorting strategy: guess k pile-locations, assign every item to its nearest pile, move each pile-marker to the middle of what it collected, and repeat until nothing moves. It is fast and usually sensible, but it has a personality: it wants round piles of similar size, and it will force EVERY item into some pile — the broken umbrella gets jammed into "sporting goods" because k-means has no concept of "this belongs nowhere." DBSCAN is the other personality: it grows piles wherever items are densely packed and honestly labels the stragglers as noise. Today you learn both, and — the part that makes it useful — how to walk back to the piles and name them.`,
    why: `Clustering is the first unsupervised tool customers actually buy: "segment our customers," "group these support tickets," "find anomalous transactions" are recurring FDE briefs, and all are clustering jobs. It is also the analysis layer of modern LLM work: on Day 143 you will cluster embedded production failures to find what KIND of errors dominate — same algorithm, embedding vectors instead of spending columns. And the interview classic "how do you choose k, and what are k-means' failure modes?" is answerable only if you have watched it fail on your own screen, which you will today.`,
    tech: `### k-means mechanics

Choose k centroids, then alternate: (1) **assign** each point to its nearest centroid (Euclidean distance — Day 50's norms); (2) **update** each centroid to the mean of its assigned points. Each step can only decrease **inertia** — the sum of squared distances from points to their centroids — so the loop converges. But only to a LOCAL optimum: bad initial centroids give bad piles. \`k-means++\` initialization (sklearn's default) spreads initial centroids apart, and \`n_init="auto"\` restarts multiple times keeping the best — leave both on. Because everything is distances, **scaling is not optional**: an income column in dollars will drown an age column in years, and your "segments" become income bands with extra steps. StandardScaler first, always.

### Choosing k

Inertia always falls as k rises (more piles = shorter distances), so you cannot minimize it. The **elbow method** plots inertia vs k and looks for the bend where returns diminish — readable but subjective. The **silhouette score** is sturdier: per point, (b − a)/max(a, b) where a = mean distance to its own cluster and b = mean distance to the nearest other cluster; +1 means snugly placed, 0 means on a boundary, negative means probably misassigned. Pick k maximizing mean silhouette, then sanity-check against domain sense — five segments the business can act on beat seven that maximize a score.

### Beyond k-means

**DBSCAN** grows clusters from density: a core point has ≥ \`min_samples\` neighbors within \`eps\`; clusters are chains of core points plus their borders; everything else is labeled −1, noise. It finds arbitrary shapes (crescents, rings), needs no k, and flags outliers for free — but struggles when densities vary and its eps is fiddly. **Hierarchical (agglomerative)** clustering repeatedly merges the closest pair of clusters, yielding a dendrogram you can cut at any height — good for taxonomy-flavored questions.

### Profiling — the deliverable

Clusters are integers until you translate them: group the ORIGINAL (unscaled) features by cluster label, compare means/medians against the population, and write one sentence per cluster ("Cluster 2: high spend, short tenure, heavy support use — new big accounts at risk"). The naming is the analysis; unlabeled integers are not insight.`,
    viz: 'kmeans-cluster',
    guided: [
      {
        title: 'k-means on customers you can check',
        minutes: 22,
        body: `1. Paste the starter. It synthesizes 600 customers from four KNOWN behavioral groups (so you can check the sorting against truth — a luxury real projects never have), scales them, and runs k-means for k = 2…8 printing inertia and silhouette.
2. Run it. Find the elbow in the inertia column and the peak in the silhouette column. Do they agree on k = 4?
3. Fit the final k=4 model and cross-tabulate found labels vs true groups (\`pd.crosstab\`). Expect near-diagonal — but note any confusion and look at WHICH two true groups blur.
4. Rerun the whole thing WITHOUT the scaler. Watch silhouette drop and the crosstab smear — write one sentence on which feature\'s units took over.
5. Note cluster label arbitrariness: refit with random_state=1 and watch the same piles get different numbers. Labels are names, not order.`,
        code: `import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
from sklearn.preprocessing import StandardScaler

rng = np.random.default_rng(42)
groups = {  # (monthly_spend, visits_per_month, tenure_months)
    "bargain":   ((25, 8),  (12, 3), (30, 12)),
    "premium":   ((160, 25),(6, 2),  (48, 15)),
    "newbies":   ((60, 20), (4, 2),  (4, 2)),
    "power":     ((110, 20),(20, 4), (36, 10)),
}
rows, truth = [], []
for name, ((sm, ss), (vm, vs), (tm, ts)) in groups.items():
    n = 150
    rows.append(np.column_stack([
        rng.normal(sm, ss, n), rng.normal(vm, vs, n), rng.normal(tm, ts, n)
    ]))
    truth += [name] * n
X = np.vstack(rows).clip(min=0)
truth = np.array(truth)

X_scaled = StandardScaler().fit_transform(X)
print(" k  inertia  silhouette")
for k in range(2, 9):
    km = KMeans(n_clusters=k, n_init="auto", random_state=0).fit(X_scaled)
    sil = silhouette_score(X_scaled, km.labels_)
    print(f"{k:2d}  {km.inertia_:7.0f}  {sil:.3f}")

km4 = KMeans(n_clusters=4, n_init="auto", random_state=0).fit(X_scaled)
print(pd.crosstab(truth, km4.labels_))`,
      },
      {
        title: 'Profile and name the piles',
        minutes: 15,
        body: `1. Build a DataFrame of the ORIGINAL unscaled features plus the k=4 labels: columns spend, visits, tenure, cluster.
2. \`df.groupby("cluster").agg(["mean", "count"])\` — read each cluster\'s profile against the overall means (\`df.mean()\`).
3. Write one plain-English name and one sentence per cluster, as if labeling a slide for a marketing VP. Compare your names to the true group names in the generator — did the data support the story?
4. The habit to keep: profiling happens in ORIGINAL units. Nobody budgets in standard deviations.`,
        code: `df = pd.DataFrame(X, columns=["spend", "visits", "tenure"])
df["cluster"] = km4.labels_
print(df.groupby("cluster").mean().round(1))
print()
print("population:", df[["spend", "visits", "tenure"]].mean().round(1).to_dict())
# Name each cluster in one sentence, e.g.:
# "Cluster 0: ~2x average spend, low visits, long tenure -> loyal premium"`,
      },
    ],
    practice: [
      {
        title: 'Break k-means, call DBSCAN',
        minutes: 20,
        body: `Generate two datasets k-means cannot handle: \`make_moons(n_samples=400, noise=0.07, random_state=0)\` and \`make_blobs(n_samples=[300, 40], centers=[[0, 0], [4, 4]], cluster_std=[1.6, 0.4], random_state=0)\` (one diffuse blob, one tight one).

Goal: (1) run KMeans(n_clusters=2) on each and describe how it fails (check silhouette AND eyeball a scatter plot or the crosstab if truth is available); (2) run DBSCAN on the moons (start eps=0.2, min_samples=5) and confirm it recovers both crescents plus a few −1 noise points; (3) tabulate DBSCAN\'s cluster count and noise count for eps in [0.1, 0.2, 0.3, 0.5] — write two sentences on eps sensitivity; (4) one-sentence verdict: for each dataset, which algorithm would you ship?

Hints: k-means slices the moons with a straight frontier because centroid-nearest is a linear boundary between two centroids; DBSCAN follows density. The mixed-density blobs are DBSCAN\'s OWN weakness — one eps cannot fit both densities.`,
      },
    ],
    project: {
      title: 'Segmentation mini-report',
      brief: `Create \`segments_lab.py\` + \`SEGMENTS.md\` in your practice repo. The script: generates the guided customers (or loads any tabular dataset you prefer), scales, selects k with both elbow and silhouette evidence (printed table), fits final k-means, and emits a per-cluster profile table in original units with population comparison. The report: your chosen k with a two-line justification citing both signals, a named one-sentence profile per cluster, one action a business could take per segment, and a limitations paragraph naming two k-means assumptions your data may violate. This artifact structure — evidence, profile, action, limitations — is exactly the Day 143 failure-clustering deliverable with embeddings swapped in. Commit both files.`,
      rubric: [
        'k chosen with BOTH inertia and silhouette evidence shown, not asserted',
        'Scaling applied before clustering; profiling done in original units',
        'Every cluster has a name, a one-sentence profile, and a business action',
        'Limitations paragraph names at least two real k-means assumptions (shape, equal size, forced assignment)',
        'Script runs end-to-end; both files committed',
      ],
    },
    mistakes: [
      'Clustering unscaled features. Distance-based methods weight features by their units; the biggest-numbered column silently becomes the only feature. Scale first, every time.',
      'Reading cluster labels as ordered or stable. Label 0 vs 2 is arbitrary naming that changes with random_state; only the groupings mean anything.',
      'Minimizing inertia to choose k. Inertia monotonically decreases with k — at k = n it hits zero. Use the elbow\'s bend or silhouette\'s peak, then apply domain judgment.',
      'Forgetting k-means assigns EVERYTHING. Outliers get jammed into the nearest pile and drag its centroid; DBSCAN\'s −1 label, or outlier pruning first, handles them honestly.',
      'Expecting k-means to find crescents, rings, or elongated groups. Nearest-centroid partitions are convex regions; non-globular shapes need DBSCAN, spectral, or better features.',
      'Shipping clusters without profiling them. An unlabeled integer per row is not a segmentation — the names, the evidence, and the recommended action are the deliverable.',
    ],
    quiz: [
      {
        q: 'You cluster customers on unscaled income (20k–200k) and age (18–80). What happens?',
        o: [
          'Nothing — k-means normalizes internally',
          'Income dominates every distance; the "segments" are effectively income bands and age is ignored',
          'Age dominates because it has fewer unique values',
          'The algorithm fails to converge',
        ],
        x: 1,
        w: 'Euclidean distance sums squared differences per feature in raw units; a 30k income gap dwarfs a 30-year age gap numerically. Scaling puts features on comparable footing — mandatory for distance methods.',
        revisit: 78,
      },
      {
        q: 'Why can\'t you choose k by picking the k with the lowest inertia?',
        o: [
          'Inertia is random across runs',
          'Inertia always decreases as k grows — it is minimized at one cluster per point',
          'Inertia only works for DBSCAN',
          'Inertia measures silhouette indirectly',
        ],
        x: 1,
        w: 'More centroids always means shorter distances to the nearest one. You look for the elbow where the decrease slows, or use silhouette, which balances cohesion against separation and CAN peak at an interior k.',
        revisit: 78,
      },
      {
        q: 'Two crescent-moon shaped classes. k-means with k=2 fails but DBSCAN succeeds because…',
        o: [
          'DBSCAN uses more clusters',
          'k-means partitions space into convex nearest-centroid regions, slicing the moons; DBSCAN chains dense neighbors and follows any shape',
          'DBSCAN scales the features automatically',
          'k-means cannot handle exactly two clusters',
        ],
        x: 1,
        w: 'The boundary between two centroids is a straight line, so interleaved crescents get cut across. Density-chaining has no shape prior — it just follows the crowd, and labels stragglers noise.',
        revisit: 78,
      },
    ],
    resources: [
      { label: 'scikit-learn User Guide — 2.3 Clustering', url: 'https://scikit-learn.org/stable/modules/clustering.html', type: 'docs', time: '30 min' },
      { label: 'StatQuest — k-means clustering, clearly explained', url: 'https://statquest.org/', type: 'video', time: '15 min' },
      { label: 'Google ML Crash Course — clustering module', url: 'https://developers.google.com/machine-learning/crash-course', type: 'course', time: '20 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: due cards from Week 11 + Day 50 distance card', minutes: 10 },
      { activity: 'ELI5 + tech read; k-means visualizer (watch centroids walk)', minutes: 20 },
      { activity: 'Guided: k-means on checkable customers + profiling', minutes: 37 },
      { activity: 'Practice: break k-means, call DBSCAN', minutes: 20 },
      { activity: 'Project: segmentation mini-report', minutes: 23 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'k selected with elbow + silhouette agreement; crosstab vs truth examined',
      'Unscaled rerun performed and the dominating feature named',
      'DBSCAN recovers the moons; eps-sensitivity table written',
      'Segmentation report with named, actionable clusters committed',
      'Quiz ≥ 2/3',
    ],
    connections: {
      back: 'Every distance today is Day 50\'s Euclidean norm, and the scaling mandate is Day 69\'s lesson applied to an algorithm that is NOTHING BUT distances. Cluster profiling is Day 66\'s groupby earning its keep.',
      forward: 'Tomorrow PCA compresses dimensions so clusters become visible — the standard pairing. On Day 92 embeddings turn text into vectors, and on Day 143 you will cluster embedded production failures with today\'s exact workflow: scale, cluster, profile, name.',
    },
    flashcards: [
      { f: 'The k-means loop?', b: 'Assign points to nearest centroid; move centroid to mean of its points; repeat. Inertia only decreases → converges (locally).' },
      { f: 'Why scale before k-means?', b: 'Distances weight features by units — the largest-scaled feature silently dominates. Standardize first.' },
      { f: 'Elbow vs silhouette?', b: 'Elbow: inertia-vs-k bend, subjective. Silhouette: (b−a)/max(a,b) cohesion-vs-separation, peaks at a defensible k.' },
      { f: 'DBSCAN\'s two parameters and its gift?', b: 'eps (neighborhood radius) and min_samples (density bar). Gift: arbitrary shapes + explicit noise label −1.' },
      { f: 'k-means\' three built-in assumptions?', b: 'Roughly spherical clusters, similar sizes, and every point belongs somewhere. Violate any → misleading piles.' },
      { f: 'What makes clusters a deliverable?', b: 'Profiling in original units + a name + a recommended action per cluster. Integers alone are not insight.' },
    ],
    deepDive: [
      { label: 'HDBSCAN — density clustering that handles varying density', note: 'The mixed-density blobs that broke DBSCAN in practice are HDBSCAN\'s home turf: it effectively varies eps per region. sklearn ships it as sklearn.cluster.HDBSCAN — rerun your practice data through it.' },
    ],
  },
  {
    id: 'd079', day: 79, week: 12, phase: 4, kind: 'lesson',
    title: 'PCA & Dimensionality',
    analogy: 'The best camera angle',
    objectives: [
      'Explain the curse of dimensionality and why distance loses meaning in high dimensions',
      'Describe PCA as finding orthogonal directions of maximum variance, and connect it to Day 52\'s SVD',
      'Read an explained-variance curve and choose a component count deliberately',
      'Use PCA correctly inside a supervised workflow: fit on train only, scale first',
      'Distinguish PCA-for-visualization from PCA-for-features and state the caveats of each',
    ],
    prereqs: [
      { day: 52, label: 'Eigenvectors & SVD intuition' },
      { day: 78, label: 'Clustering & scaling discipline' },
      { day: 64, label: 'NumPy arrays & axes' },
    ],
    eli5: `Photograph a galloping horse. From the side, one photo tells you almost everything — legs extended, mane flying. From directly above, the same horse is a brown smudge; from head-on, a bobbing oval. Same 3-D animal, but the ANGLE decides how much of its story survives the flattening into 2-D. There exists a best angle: the one where the horse's shape spreads out the most, so the least information is lost when depth is discarded.

PCA finds that best angle for data. Your dataset lives in 30 or 64 dimensions — unphotographable — but its interesting variation often sprawls along just a few directions, the way the horse's action lives in the side view. PCA rotates the axes to point along the directions where the data spreads widest (the first principal component is the widest, the second is the widest at right angles to it, and so on), then lets you keep the top few and drop the rest. The explained-variance readout tells you exactly how much of the story each angle captures — "these 2 directions hold 85% of the spread" — so the flattening is a measured trade, not a guess.`,
    why: `PCA earns its keep three ways in this program and your career. Practically: it is the standard microscope for anything high-dimensional — tomorrow you would struggle to see Day 78\'s clusters in 64 dimensions, and on Day 92 you will use exactly today\'s code to look at LLM embedding spaces. Statistically: it tames the curse of dimensionality that quietly breaks distance-based methods (kNN, k-means) as features multiply. And conceptually: the compress-to-what-matters idea returns as the intuition behind embeddings themselves and LoRA\'s low-rank adapters on Day 128. Interviewers love "when would PCA hurt?" — you will have an answer.`,
    tech: `### The curse of dimensionality

As dimensions grow, volume explodes: data becomes sparse, every point drifts toward equidistance from every other, and "nearest" neighbor loses contrast — the signal distance methods depend on. More features also means more ways to overfit (spurious correlations multiply). Dimensionality reduction fights back by exploiting the empirical fact that real datasets are usually flat-ish: correlated features mean the data hugs a lower-dimensional surface inside the high-dimensional space.

### What PCA computes

PCA finds orthogonal unit directions (principal components) maximizing the variance of the data projected onto them, computed via eigendecomposition of the covariance matrix — or equivalently the SVD of the centered data matrix, Day 52's rotate-stretch-rotate with the stretch factors sorted. Component i's **explained variance ratio** is its share of total variance; the cumulative curve is your dial: \`PCA(n_components=0.95)\` keeps enough components for 95%. Projection is a linear map (X_reduced = X_centered · W); **reconstruction** maps back, and the reconstruction error is exactly the variance you chose to drop — Day 52's low-rank approximation, now with a scree plot.

### Discipline

PCA is fit like any transformer: **fit on training data only**, apply to validation/test — the components are learned parameters and can leak (Day 76's pipeline rule). **Scale first**: PCA chases variance, and variance is unit-sensitive; an unscaled income column IS the first component. Components are linear combinations of original features — inspect \`pca.components_\` to interpret them, but expect mixtures, not clean named factors. Signs are arbitrary (a component and its negative are the same direction).

### Two uses, two mindsets

**PCA-for-viz**: project to 2-D to look — clusters, outliers, structure. Honest caveat: 2 components may hold little variance; always print the percentage on the axes. (t-SNE/UMAP make prettier neighborhoods but distort global distances — preview, Day 92.) **PCA-for-features**: feed top-k components to a downstream model to cut noise/collinearity/compute. Caveat: variance is not relevance — PCA is unsupervised and can discard a low-variance direction that carries the label signal. Trees/boosting rarely need it; distance methods and linear models on wide collinear data often benefit. Measure, don't assume.`,
    viz: 'pca-project',
    guided: [
      {
        title: 'Squash the digits: 64 dimensions → 2',
        minutes: 22,
        body: `1. Paste the starter. load_digits gives 1,797 handwritten digits as 8×8 images = 64 features. Standalone; run locally if needed.
2. Run it. Read the cumulative explained-variance printout: how many components hold 50%? 90%? Write both numbers down — 64 pixels were never 64 independent dimensions.
3. Look at the 2-D projection printout: per-digit centroid positions in PC space. Digits 0 and 1 should sit far apart; 4 and 9 close (they share strokes). If you have matplotlib, scatter the projection colored by digit — the clusters are visible to the naked eye in a 2-D shadow of 64-D space.
4. Note the axis labels you MUST always include: PC1 holds ~X% of variance, PC2 ~Y%. A 2-D picture holding 28% of the variance is a sketch, not the territory — say so on the plot.`,
        code: `import numpy as np
from sklearn.datasets import load_digits
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler

digits = load_digits()
X = StandardScaler().fit_transform(digits.data)   # 1797 x 64
y = digits.target

pca = PCA().fit(X)
cum = np.cumsum(pca.explained_variance_ratio_)
for target in [0.5, 0.9, 0.95]:
    k = int(np.searchsorted(cum, target)) + 1
    print(f"{target:.0%} of variance -> {k} components")

p2 = PCA(n_components=2).fit(X)
X2 = p2.transform(X)
print("PC1", f"{p2.explained_variance_ratio_[0]:.1%}",
      " PC2", f"{p2.explained_variance_ratio_[1]:.1%}")
for d in range(10):
    cx, cy = X2[y == d].mean(axis=0)
    print(f"digit {d}: PC-space centroid ({cx:+.1f}, {cy:+.1f})")

# optional: import matplotlib.pyplot as plt
# plt.scatter(X2[:, 0], X2[:, 1], c=y, cmap="tab10", s=8); plt.show()`,
      },
      {
        title: 'Reconstruction: watch the variance you paid',
        minutes: 15,
        body: `1. For k in [2, 10, 20, 40, 64], fit PCA(k) on the scaled digits, transform, then \`inverse_transform\` back to 64-D. Compute the mean squared reconstruction error against the input.
2. Tabulate k, cumulative variance kept, and reconstruction error. Confirm the accounting identity: error shrinks exactly as kept-variance grows, hitting ~0 at k=64.
3. If you have matplotlib, render one digit\'s original vs its k=10 reconstruction as 8×8 images — recognizably the same digit from 10 numbers instead of 64. That compression-preserving-identity is the intuition to keep for embeddings (Day 92).
4. Two-sentence journal: what did PCA throw away first, and why is that usually (but not always!) the right thing to discard?`,
        code: `import numpy as np
from sklearn.decomposition import PCA

# X = scaled digits from the previous exercise
print(" k   var_kept   recon_MSE")
for k in [2, 10, 20, 40, 64]:
    p = PCA(n_components=k).fit(X)
    Xk = p.inverse_transform(p.transform(X))
    mse = float(np.mean((X - Xk) ** 2))
    print(f"{k:3d}   {p.explained_variance_ratio_.sum():7.1%}   {mse:8.4f}")`,
      },
    ],
    practice: [
      {
        title: 'Does PCA help the model? Measure, don\'t assume',
        minutes: 20,
        body: `Run an honest experiment on the digits with your Day 76 tools: 5-fold CV accuracy for (a) LogisticRegression on all 64 scaled features, (b) a Pipeline of StandardScaler → PCA(n_components=0.90) → LogisticRegression, (c) same but n_components=2.

Goal: (1) report mean ± std for all three; (2) note the feature counts (64 vs ~how many vs 2) and what accuracy each bought; (3) answer in writing: did PCA-for-features help, hurt, or wash here — and what did the 2-component version prove about "variance ≠ relevance"? (4) name one scenario from the tech section where you would EXPECT (b) to beat (a).

Hints: build the PCA inside the Pipeline so folds don\'t leak. Expect (a) ≈ (b) on this dataset with (b) using far fewer features — a compression win, not an accuracy win. (c) should drop hard: 28% of variance is not 28% of the signal.`,
      },
    ],
    project: {
      title: 'The projection lens for your toolkit',
      brief: `Add \`pca_summary(X, variance_targets=(0.5, 0.9, 0.95))\` to \`ml_toolkit.py\`: scales, fits PCA, and returns the components needed per variance target plus the top-5 explained-variance ratios — your instant "how flat is this data?" probe. Add \`project_2d(X, labels=None)\` returning the scaled 2-D projection with the two variance percentages, printing the axis-label warning string. Then create \`pca_lab.md\` recording today\'s numbers: the digits\' 50/90/95% component counts, the reconstruction table, and your practice experiment\'s three CV scores with your verdict paragraph. Commit both; project_2d gets called again on Day 92 to look at real embeddings.`,
      rubric: [
        'pca_summary scales internally and reports component counts for all requested variance targets',
        'project_2d returns projection + variance percentages and the warning string for low-variance projections',
        'Fit-on-train-only discipline documented in docstrings (and respected via Pipeline in any supervised use)',
        'pca_lab.md contains all three experiment tables and a verdict paragraph citing numbers',
        'Committed to the practice repo',
      ],
    },
    mistakes: [
      'Running PCA on unscaled data. PCA maximizes variance, and variance has units — the largest-scaled feature becomes PC1 by default. Standardize first unless features share units on purpose.',
      'Fitting PCA on the full dataset before a supervised split or CV. Components are learned parameters; fitting on all rows leaks test structure. Pipeline it like any transformer.',
      'Reading a 2-D PCA plot as the truth. If PC1+PC2 hold 30% of variance, 70% of the structure is invisible. Always print the percentages on the axes.',
      'Assuming top variance = top relevance. PCA never saw the labels; the discriminative signal can hide in component 12. Validate downstream accuracy, never just the scree plot.',
      'Interpreting component signs or exact loadings too confidently. Signs are arbitrary and components are mixtures; treat loadings as directional hints, not named factors.',
      'Reaching for PCA before a tree ensemble. Trees do axis-aligned feature selection natively and lose interpretability behind PCA; the win zone is distance-based and linear models on wide, collinear data.',
    ],
    quiz: [
      {
        q: 'Why must data be standardized before PCA (in general)?',
        o: [
          'PCA fails to run on raw data',
          'PCA maximizes variance, which is unit-dependent — unscaled, the biggest-unit feature dictates the components',
          'Standardizing makes PCA supervised',
          'It guarantees 95% variance in 2 components',
        ],
        x: 1,
        w: 'A dollars column with variance 10⁸ will own PC1 regardless of structure. Standardizing puts features on equal variance footing so components reflect correlation structure, not units.',
        revisit: 79,
      },
      {
        q: 'Your 2-D PCA plot shows PC1 = 18%, PC2 = 11% explained variance and no visible clusters. The safest conclusion is…',
        o: [
          'The data has no cluster structure',
          'This 29%-of-variance shadow shows none — structure may exist in the discarded 71%; try more components or another method',
          'PCA is broken for this dataset',
          'k-means would also find nothing',
        ],
        x: 1,
        w: 'Absence of evidence in a low-variance projection is not evidence of absence. Check the cumulative curve, look at more components, or use a nonlinear method before concluding.',
        revisit: 79,
      },
      {
        q: 'PCA down to k components, then inverse_transform. The reconstruction error equals…',
        o: [
          'Zero, always',
          'The variance of the discarded components — exactly what you chose not to keep',
          'The variance of the kept components',
          'Random noise',
        ],
        x: 1,
        w: 'Projection keeps the top-k directions and zeroes the rest; reconstruction restores position along kept directions only. The squared loss is precisely the dropped variance — Day 52\'s low-rank approximation, quantified.',
        revisit: 52,
      },
    ],
    resources: [
      { label: 'scikit-learn User Guide — 2.5 Decomposition (PCA)', url: 'https://scikit-learn.org/stable/modules/decomposition.html', type: 'docs', time: '25 min' },
      { label: 'StatQuest — PCA step-by-step', url: 'https://statquest.org/', type: 'video', time: '20 min' },
      { label: '3Blue1Brown — Essence of Linear Algebra (eigen refresher)', url: 'https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab', type: 'video', time: '15 min' },
      { label: 'Mathematics for Machine Learning — PCA chapter', url: 'https://mml-book.github.io/', type: 'book', time: '30 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: Day 52 SVD cards + Day 78 deck', minutes: 10 },
      { activity: 'ELI5 + tech read; pca-project visualizer', minutes: 20 },
      { activity: 'Guided: squash the digits + reconstruction accounting', minutes: 37 },
      { activity: 'Practice: does PCA help the model?', minutes: 20 },
      { activity: 'Project: toolkit lens + pca_lab.md', minutes: 23 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'Component counts for 50/90/95% variance recorded for digits',
      'Reconstruction table confirms the variance-error accounting',
      'Three-way CV experiment run; verdict paragraph written',
      'pca_summary and project_2d committed',
      'Quiz ≥ 2/3',
    ],
    connections: {
      back: 'This is Day 52\'s SVD cashing its promissory note: eigen-directions of the covariance are the directions that only stretch, and low-rank approximation became a scree plot. Day 78\'s scaling discipline carried straight over — PCA is variance-chasing the way k-means is distance-chasing.',
      forward: 'On Day 92 project_2d becomes your window into embedding space, and the compression intuition underpins why embeddings work at all. Day 128\'s LoRA is the same low-rank bet applied to weight updates: the important changes live in few directions.',
    },
    flashcards: [
      { f: 'What does PCA maximize, subject to what?', b: 'Variance of the projected data, along orthogonal unit directions, ranked. Computed via eigendecomposition/SVD of centered data.' },
      { f: 'Curse of dimensionality in one line?', b: 'As dimensions grow, data goes sparse and distances concentrate — "nearest" loses meaning and overfitting chances multiply.' },
      { f: 'PCA(n_components=0.95) means…?', b: 'Keep the smallest number of components whose cumulative explained variance reaches 95%.' },
      { f: 'Why can PCA-for-features hurt accuracy?', b: 'PCA is unsupervised: it ranks by variance, not label relevance — the signal may live in a low-variance direction it discards.' },
      { f: 'Two rules before any PCA fit?', b: 'Standardize features; fit on training data only (Pipeline it) — components are learned parameters that can leak.' },
      { f: 'What must every 2-D PCA plot display?', b: 'The explained-variance % of both axes — a 25%-variance shadow is a sketch, and the reader must know it.' },
    ],
    deepDive: [
      { label: 't-SNE and UMAP vs PCA', note: 'Nonlinear neighbor-embedding methods make prettier cluster plots but distort global geometry and have fiddly knobs (perplexity). Rule: PCA first for honesty and speed; t-SNE/UMAP for presentation, never for downstream features. You will meet them on Day 92.' },
    ],
  },
  {
    id: 'd080', day: 80, week: 12, phase: 4, kind: 'lesson',
    title: 'Error Analysis',
    analogy: 'The doctor reads the chart',
    objectives: [
      'Slice evaluation metrics by subgroup and find where a "good" aggregate hides a bad pocket',
      'Drive data and feature fixes from confusion patterns instead of blind model swaps',
      'Distinguish data-centric from model-centric iteration and pick the higher-leverage move',
      'Spot probable label noise by inspecting high-confidence errors',
      'Run a feature ablation and read what actually carries the signal',
    ],
    prereqs: [
      { day: 75, label: 'Confusion matrix & sliced metrics' },
      { day: 77, label: 'The competition\'s error autopsy' },
      { day: 67, label: 'EDA instincts' },
    ],
    eli5: `A patient says "I feel bad." A poor doctor prescribes something general and hopes. A good doctor reads the chart: WHEN is it bad — mornings? after meals? The pattern is the diagnosis: "after meals" points to the stomach, "mornings" points elsewhere. Same complaint, different disease, different treatment — and the treatment chosen without the pattern is a guess with a prescription pad.

"My model is 86% accurate" is the patient saying "I feel bad." Error analysis is reading the chart: WHERE do the errors live? Split them by every dimension you have — customer type, value range, class — and the aggregate almost always shatters into unequal pieces: 95% here, 61% in that pocket over there. Now you have a diagnosis, and the treatment writes itself: that pocket needs more data, or a feature the model lacks, or its labels are simply wrong. The discipline is embarrassingly simple — LOOK at your errors, one by one, and count what you see — and it is the single highest-leverage habit in applied ML, mostly because almost nobody does it.`,
    why: `Andrew Ng\'s data-centric argument matches what FDEs live daily: after the first decent model, the metric usually moves further from fixing data than from swapping architectures — and error analysis is what tells you WHICH data. The skill transfers wholesale to LLM work: on Days 136 and 143 you will read failed RAG answers and cluster production failures, which is today\'s method with transcripts instead of rows. And it is a differentiator in interviews: "my model underperforms — walk me through your next hour" separates candidates who tune blindly from engineers who diagnose. Your Day 83 churn rubric contains an error-analysis criterion for exactly this reason.`,
    tech: `### Slicing

Compute your metric per subgroup, not just overall: by categorical feature values, by binned numeric ranges, by class, by data source. In pandas: attach predictions to the test DataFrame and \`groupby(slice_col)\` over a correctness column. What to look for: slices meaningfully below aggregate, especially large ones (a 60%-accuracy slice that is 20% of traffic is your whole problem), and slices where the ERROR TYPE flips (false-positive-heavy here, false-negative-heavy there — one threshold cannot serve both, and maybe one model cannot either). Caveat from Day 60: tiny slices have huge error bars; a 4/7 slice is noise, not signal — mind the counts.

### The error ledger

Sample 20–30 individual errors and read each one, recording a one-line hypothesis: missing feature, ambiguous case, wrong label, out-of-range value, genuinely hard. Then COUNT the hypotheses. The ledger converts anecdotes into a prioritized worklist: if 12 of 30 errors are "model lacks tenure-context," that feature is your next hour; if 8 look mislabeled, audit labeling before touching the model. **High-confidence errors** (model very sure, "truth" disagrees) are disproportionately label noise — when a strong model is 98% confident and officially wrong, check the label before blaming the model.

### Data-centric vs model-centric

Model-centric moves: new algorithm, more tuning, bigger ensemble. Data-centric moves: fix labels, add the missing feature, collect data for the weak slice, correct a leaky or drifting column. The ledger arbitrates. Rule of thumb once past the first strong baseline: try the cheap model-centric moves (they are one line with your toolkit), then expect the real gains from data. This inverts the beginner instinct, which is to keep shopping for models.

### Ablation

An ablation removes one component at a time and remeasures: drop feature (or feature group), retrain, record the delta. It answers "what actually carries the signal?" better than importances (which inherit Day 73\'s biases) — and it generalizes: on Day 117 you will ablate a reranker out of a RAG pipeline, and on Day 90 you will run ablations on a neural net. One honest caveat: correlated features can cover for each other, so a zero-delta drop does not prove uselessness — it proves redundancy.`,
    viz: null,
    guided: [
      {
        title: 'Find the sick slice',
        minutes: 22,
        body: `1. Paste the starter. It builds a synthetic loans dataset with a planted disease: for one customer segment ("gig" workers), the informative income feature is replaced by noise — the model will do fine everywhere and badly there. It also flips 3% of labels at random (noise you will hunt in the next exercise).
2. Run it. The aggregate accuracy looks healthy. Now read the per-segment table: find the segment scoring far below the rest, and note its share of the test set.
3. For the sick segment, print the confusion counts. Which error type dominates? Write the one-line diagnosis: what does the model not know for these rows, and what would you ask the customer for?
4. Confirm the diagnosis with the counts caveat: the segment has hundreds of rows here, so it is signal. Recompute the aggregate accuracy EXCLUDING the sick segment to see what the model could be if the data gap were fixed.`,
        code: `import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.model_selection import train_test_split

rng = np.random.default_rng(0)
n = 6000
seg = rng.choice(["salaried", "hourly", "gig"], n, p=[0.5, 0.3, 0.2])
income = rng.normal(60, 18, n).clip(10)
debt = rng.normal(30, 12, n).clip(0)
tenure = rng.exponential(5, n)

# ground truth: default risk driven by income, debt, tenure
logit = -0.06 * income + 0.09 * debt - 0.15 * tenure + 1.0
y = (rng.random(n) < 1 / (1 + np.exp(-logit))).astype(int)
flip = rng.random(n) < 0.03            # 3% label noise, planted
y = np.where(flip, 1 - y, y)

# the disease: for gig workers our income FEATURE is garbage
income_feat = np.where(seg == "gig", rng.normal(60, 18, n).clip(10), income)

df = pd.DataFrame({"income": income_feat, "debt": debt, "tenure": tenure,
                   "segment": seg, "y": y})
X = pd.get_dummies(df[["income", "debt", "tenure", "segment"]])
X_tr, X_te, y_tr, y_te, df_tr, df_te = train_test_split(
    X, df["y"], df, test_size=0.3, random_state=0, stratify=df["y"])

clf = HistGradientBoostingClassifier(random_state=0).fit(X_tr, y_tr)
df_te = df_te.copy()
df_te["pred"] = clf.predict(X_te)
df_te["proba"] = clf.predict_proba(X_te)[:, 1]
df_te["correct"] = (df_te["pred"] == df_te["y"]).astype(int)

print("aggregate accuracy:", round(df_te["correct"].mean(), 3))
print(df_te.groupby("segment")["correct"].agg(["mean", "count"]).round(3))`,
      },
      {
        title: 'The error ledger + the label-noise sniff',
        minutes: 16,
        body: `1. Pull the 20 test errors where the model was MOST confident: sort errors by \`abs(proba - 0.5)\` descending and take the top 20.
2. For each, print the row: segment, features, true label, predicted probability. Ledger each with a one-word hypothesis: "gig-gap" (sick slice), "label?" (features scream one class, official label says the other), or "hard" (genuinely ambiguous).
3. Count your ledger. Because the generator planted both diseases, your counts have an answer key: the starter prints how many of your top-20 confident errors carry the flip flag. Check your "label?" hypotheses against it — high-confidence errors should be heavily enriched for flipped labels versus the 3% base rate.
4. Write the takeaway sentence: aggregate metrics said "fine"; thirty minutes of reading errors produced two concrete fixes (get real gig income data; audit labels) — neither of which is "try a bigger model."`,
        code: `errors = df_te[df_te["correct"] == 0].copy()
errors["confidence"] = (errors["proba"] - 0.5).abs()
top = errors.sort_values("confidence", ascending=False).head(20)
top = top.join(pd.Series(flip, name="flipped"), how="left")

cols = ["segment", "income", "debt", "tenure", "y", "proba", "flipped"]
print(top[cols].round(2).to_string())
print("\nflipped-label rate in confident errors:",
      round(top["flipped"].mean(), 2), " (base rate: 0.03)")`,
      },
    ],
    practice: [
      {
        title: 'Ablation: what carries the signal?',
        minutes: 18,
        body: `On the loans dataset (before dummies), run a feature ablation with 5-fold CV: full feature set, then drop one of [income, debt, tenure, segment] at a time, retrain, record the CV accuracy delta from full.

Goal: (1) produce the ablation table sorted by damage; (2) reconcile it with the generator\'s ground truth (which coefficients were large?); (3) explain the segment column\'s delta: it carries little DIRECT signal, so why might dropping it still hurt slightly? (4) one sentence on why ablation beats feature_importances_ for this question.

Hints: use your toolkit\'s cv_report. The segment dummies let the model partially route around the gig income gap — an interaction effect importances tend to smear. Redundant-feature caveat: income and debt are independent here, but in real data correlated pairs shield each other.`,
      },
    ],
    project: {
      title: 'The error-analysis playbook, executable',
      brief: `Add \`slice_report(df, slice_cols, y_col="y", pred_col="pred")\` to \`ml_toolkit.py\`: for each named column it returns per-value metric, count, and delta-from-aggregate, flagging slices that are both below aggregate AND large enough to matter (count ≥ 30). Add \`confident_errors(df, k=20)\` returning the top-k most confident mistakes for ledger reading. Then write \`error_analysis_playbook.md\` — your personal checklist, ≤ 1 page: the four steps (slice → ledger → count hypotheses → pick data-vs-model move), the counts caveat, the label-noise sniff, the ablation recipe. You will follow this playbook verbatim on Day 83 and again on Day 136 for RAG. Commit both.`,
      rubric: [
        'slice_report handles multiple slice columns and flags below-aggregate + count ≥ 30 slices',
        'confident_errors sorts by |proba − 0.5| and returns readable rows',
        'Both functions demonstrated on the loans dataset in __main__',
        'Playbook covers all four steps plus both caveats (small-slice noise, correlated-feature ablation)',
        'Committed to the practice repo',
      ],
    },
    mistakes: [
      'Iterating on the aggregate metric alone. A model can improve overall while a critical slice worsens; slicing is how you notice before the customer does.',
      'Trusting tiny slices. A 3/5 accuracy slice is a coin flip with a story. Report counts with every slice metric and set a minimum-n before reacting (Day 60\'s error bars).',
      'Blaming the model for label noise. When a strong model is confidently "wrong," audit the label first — high-confidence errors are enriched for annotation mistakes.',
      'Reaching for a bigger model as the first response to errors. After a strong baseline, the ledger usually points at data: a missing feature, a broken slice, bad labels. Diagnose, then treat.',
      'Reading a zero-delta ablation as "useless feature." Correlated features cover for each other; the honest claim is "redundant given the rest," which is different from "uninformative."',
      'Doing error analysis once. It is a loop: fix, retrain, re-slice — fixes shift where the errors live, and yesterday\'s healthy slice can be today\'s sick one.',
    ],
    quiz: [
      {
        q: 'Overall accuracy 88%; the "enterprise" segment (25% of traffic) scores 64%. Best next move?',
        o: [
          'Ship it — 88% is good',
          'Diagnose the enterprise slice: read its errors, check its confusion pattern, and ask what data/feature it is missing',
          'Switch to a deeper ensemble and re-check the aggregate',
          'Remove enterprise rows from the test set',
        ],
        x: 1,
        w: 'A large below-aggregate slice is a diagnosis handed to you. Reading its errors tells you whether the treatment is a feature, data collection, or labels — a blind model swap treats the symptom.',
        revisit: 80,
      },
      {
        q: 'Your model assigns p = 0.98 to a class and the label disagrees. This pattern, repeated, is most often a sign of…',
        o: [
          'Overfitting',
          'Underfitting',
          'Label noise — high-confidence errors are where wrong labels concentrate',
          'A learning-rate problem',
        ],
        x: 2,
        w: 'When a well-validated model is that sure and officially wrong, the official answer is suspect. Auditing high-confidence errors is the cheapest label-quality check available.',
        revisit: 80,
      },
      {
        q: 'You drop a feature and CV accuracy doesn\'t move. The correct conclusion is…',
        o: [
          'The feature is uninformative — delete it everywhere',
          'The feature is redundant GIVEN the remaining features — a correlated feature may be covering for it',
          'The ablation was run incorrectly',
          'The model is underfitting',
        ],
        x: 1,
        w: 'Ablation measures marginal contribution in context. Correlated features shield each other, so zero-delta means redundancy, not uselessness — remove its partner too and the signal may crater.',
        revisit: 80,
      },
    ],
    resources: [
      { label: 'scikit-learn User Guide — 3.4 Metrics (per-class & sliced reporting)', url: 'https://scikit-learn.org/stable/modules/model_evaluation.html', type: 'docs', time: '15 min' },
      { label: 'Made With ML — evaluation & behavioral testing lessons', url: 'https://madewithml.com/', type: 'course', time: '25 min' },
      { label: 'pandas User Guide — groupby for slice analysis', url: 'https://pandas.pydata.org/docs/user_guide/index.html', type: 'docs', time: '15 min' },
      { label: 'Google ML Crash Course — ML fairness (sliced evaluation)', url: 'https://developers.google.com/machine-learning/crash-course', type: 'course', time: '20 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: Days 75–79 due cards', minutes: 10 },
      { activity: 'ELI5 + tech read', minutes: 18 },
      { activity: 'Guided: find the sick slice + error ledger', minutes: 38 },
      { activity: 'Practice: feature ablation', minutes: 18 },
      { activity: 'Project: playbook + toolkit functions', minutes: 26 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'Sick segment found, diagnosed, and the excluding-segment ceiling computed',
      'Error ledger for 20 confident errors completed; label-noise enrichment verified against the answer key',
      'Ablation table produced and reconciled with ground truth',
      'slice_report, confident_errors, and playbook committed',
      'Quiz ≥ 2/3',
    ],
    connections: {
      back: 'Day 77\'s three-error autopsy was the trailer; today was the method. The slicing is Day 66\'s groupby pointed at mistakes, the confusion patterns are Day 75\'s cells per slice, and the counts caveat is Day 60 refusing to let five rows tell a story.',
      forward: 'Day 83\'s churn rubric grades this playbook in action. On Day 136 the ledger reads failed RAG answers, on Day 143 you cluster production failures at scale (Day 78 + today), and Day 90\'s MNIST error analysis applies it to a neural net\'s confusion matrix.',
    },
    flashcards: [
      { f: 'The four-step error-analysis loop?', b: 'Slice metrics by subgroup → read a sample of errors into a ledger → count hypotheses → pick the data-vs-model fix. Repeat after fixing.' },
      { f: 'Where does label noise concentrate?', b: 'In high-confidence errors — model very sure, official label disagrees. Audit labels there first.' },
      { f: 'Data-centric vs model-centric?', b: 'Data-centric: fix labels/features/coverage. Model-centric: swap/tune models. Post-baseline, data moves usually pay more.' },
      { f: 'The small-slice caveat?', b: 'Tiny slices have huge error bars — report counts, set a minimum n (~30) before reacting.' },
      { f: 'What does a zero-delta ablation prove?', b: 'Redundancy given remaining features — NOT uselessness; correlated features cover for each other.' },
      { f: 'Why read individual errors at all?', b: 'Aggregates say HOW MUCH is wrong; only examples say WHY. 20–30 read errors convert a score into a worklist.' },
    ],
    deepDive: [
      { label: 'Confident learning & the cleanlab idea', note: 'The label-noise sniff, industrialized: use out-of-fold predicted probabilities to estimate which labels are likely wrong across the whole dataset. Worth a skim of the cleanlab README after today\'s hand-rolled version.' },
    ],
  },
  {
    id: 'd081', day: 81, week: 12, phase: 4, kind: 'lesson',
    title: 'Experiment Tracking & Reproducibility',
    analogy: 'The lab notebook',
    objectives: [
      'Log params, metrics, and artifacts to MLflow so every run is findable and comparable',
      'Name and organize experiments so future-you can answer "which run was that?" in seconds',
      'Control randomness with seeds and state honestly what seeds do NOT guarantee',
      'Pin the environment and data identity a result depends on',
      'Compare runs honestly — same data, same split, same metric — before believing a delta',
    ],
    prereqs: [
      { day: 76, label: 'CV & honest comparison' },
      { day: 17, label: 'Environments & pinning' },
      { day: 8, label: 'Git — versioning code' },
    ],
    eli5: `A chemist runs an experiment and scribbles the result on a napkin: "worked better!" Better than WHAT? At what temperature? Which batch of reagent? Six weeks later the napkin says nothing, the result cannot be reproduced, and the discovery is functionally lost. This is why real labs enforce the lab notebook: every run gets an entry — conditions, materials, measurements — before the scientist is allowed to have an opinion about the result.

Your ML work this week has been generating napkins. "The forest got 0.87" — with which features? which split seed? which hyperparameters? which version of the cleaning script? By Day 83 you will have dozens of runs, and by the capstone, hundreds; memory will not hold them and terminal scrollback is where results go to die. An experiment tracker is the enforced lab notebook: every run automatically records its parameters, scores, and outputs into a searchable table, so "which run was best, and what exactly produced it?" is a query, not an archaeology dig. Reproducibility is the notebook\'s other half: seeds, pinned packages, and versioned data — the "which batch of reagent" details that decide whether a rerun gets the same answer.`,
    why: `"How do you track experiments?" is a standard ML-engineering interview probe, and "spreadsheet, mostly" is a red flag. In team settings the tracker IS the shared memory — an FDE who can pull up the exact run behind the number a customer is questioning, with its params and artifacts, earns trust that "I think it was around 0.87?" destroys. Reproducibility is also a contractual matter: regulated customers ask you to re-produce the shipped model from scratch. And the habit transfers directly: on Day 141 prompts and eval scores go through the same run-tracking discipline — different artifacts, identical hygiene.`,
    tech: `### MLflow\'s model of the world

MLflow (install locally: \`pip install mlflow\`) organizes work into **experiments** (folders) containing **runs**. A run records: **params** (inputs you chose — model type, hyperparameters, feature-set name), **metrics** (outputs you measured — can be logged repeatedly to form curves), **tags** (freeform metadata — git commit, author, purpose), and **artifacts** (files — plots, model pickles, reports). The core API is small: \`mlflow.set_experiment(name)\`, then \`with mlflow.start_run():\` wrapping \`log_params\`, \`log_metric\`, \`log_artifact\`. By default everything lands in a local \`./mlruns\` directory; \`mlflow ui\` serves a browser table where you filter, sort, and diff runs. \`mlflow.sklearn.log_model\` stores the fitted model itself with its environment requirements — Day 82 loads one back for inference.

### What makes a run reproducible

Four identities pin a result: **code** (git commit hash — log it as a tag; commit before big runs), **data** (path + row count + a content hash for small data; proper data versioning arrives with DVC-style tools later — log at least enough to detect silent change), **environment** (Python + package versions; \`pip freeze\` into an artifact), and **randomness**. Seeds: one \`random_state\`/seed per stochastic component (split, model, sampler), logged as params. Honesty clause: seeds make ONE machine/library-version deterministic; they do not guarantee identical numbers across library versions, OSes, or parallel thread schedules — and on Day 88 you will meet GPU nondeterminism, which is worse. The professional claim is "reproducible within tolerance," with the tolerance measured (run it 5× with different seeds and report the spread — Day 76\'s error bars again).

### Comparing runs honestly

A tracker makes comparison easy — including invalid comparison. A delta means something only when data, split, metric, and evaluation protocol are identical; the tracker\'s job is to make violations visible (the params columns differ where they shouldn\'t). Adopt a naming convention now — experiment per project, run names like \`gbm-lr0.05-featv2\` — and the discipline of logging BEFORE looking at results, so failures get recorded too. Selective logging is how "it worked in March" myths are born.`,
    viz: null,
    guided: [
      {
        title: 'First tracked experiment: the bake-off, remembered forever',
        minutes: 22,
        body: `1. Locally: \`pip install mlflow\` (this lab needs a real terminal, not the browser interpreter). Paste the starter — it re-runs a compact version of Day 74\'s bake-off, but every run is logged.
2. Run it, then launch \`mlflow ui\` in the same directory and open http://127.0.0.1:5000. Find your experiment; sort runs by test_accuracy.
3. In the UI, select the forest and boosting runs and click Compare. The params table shows exactly what differed — this view is the whole point: no memory, no napkins.
4. Re-run the script with \`SPLIT_SEED = 1\` at the top. Watch four new runs appear. In the UI, filter by the seed param and compare accuracy across seeds — Day 76\'s split-variance lesson, now permanently on record.
5. Note what got logged WITHOUT you thinking: start time, duration, source file. And note what did NOT: the data identity. The starter logs rows + a hash — confirm you can see them.`,
        code: `import hashlib
import mlflow
from sklearn.datasets import load_breast_cancer
from sklearn.dummy import DummyClassifier
from sklearn.ensemble import HistGradientBoostingClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

SPLIT_SEED = 0
X, y = load_breast_cancer(return_X_y=True)
data_hash = hashlib.md5(X.tobytes()).hexdigest()[:10]
X_tr, X_te, y_tr, y_te = train_test_split(
    X, y, test_size=0.25, random_state=SPLIT_SEED, stratify=y)

mlflow.set_experiment("day81-bakeoff")
models = [
    ("dummy", DummyClassifier(strategy="most_frequent"), {}),
    ("logreg", make_pipeline(StandardScaler(),
                             LogisticRegression(max_iter=2000)), {"C": 1.0}),
    ("forest", RandomForestClassifier(n_estimators=200, random_state=0),
     {"n_estimators": 200}),
    ("gbm", HistGradientBoostingClassifier(learning_rate=0.1, random_state=0),
     {"learning_rate": 0.1}),
]
for name, model, hp in models:
    with mlflow.start_run(run_name=f"{name}-seed{SPLIT_SEED}"):
        mlflow.log_params({"model": name, "split_seed": SPLIT_SEED,
                           "data_rows": len(X), "data_hash": data_hash, **hp})
        model.fit(X_tr, y_tr)
        mlflow.log_metric("train_accuracy", model.score(X_tr, y_tr))
        mlflow.log_metric("test_accuracy", model.score(X_te, y_te))
print("done — now run: mlflow ui")`,
      },
      {
        title: 'Artifacts and the reproducibility bundle',
        minutes: 15,
        body: `1. Extend one run (the gbm) to log artifacts: write the classification report to \`report.txt\` and log it; \`pip freeze\` into \`requirements_frozen.txt\` (via subprocess or manually) and log that too; log the fitted model with \`mlflow.sklearn.log_model(model, name="model")\`.
2. Add the git identity: \`git rev-parse HEAD\` as a tag (\`mlflow.set_tag("git_commit", ...)\`). If the working tree is dirty, tag \`dirty=true\` — a result from uncommitted code is only half-pinned.
3. In the UI, open the run and browse its artifacts. Everything needed to re-create or ship this exact model now lives in one place.
4. The seed honesty check: run the gbm five times with model seeds 0–4 (same split), logging each. Pull the five test accuracies from the UI and write the spread as "0.xx ± 0.0y" — that tolerance is what "reproducible" honestly means.`,
        code: `import subprocess
import mlflow
import mlflow.sklearn
from sklearn.metrics import classification_report

with mlflow.start_run(run_name="gbm-full-bundle"):
    mlflow.log_params({"model": "gbm", "learning_rate": 0.1,
                       "split_seed": SPLIT_SEED, "data_hash": data_hash})
    model = HistGradientBoostingClassifier(learning_rate=0.1, random_state=0)
    model.fit(X_tr, y_tr)
    mlflow.log_metric("test_accuracy", model.score(X_te, y_te))

    with open("report.txt", "w") as f:
        f.write(classification_report(y_te, model.predict(X_te)))
    mlflow.log_artifact("report.txt")

    frozen = subprocess.run(["pip", "freeze"], capture_output=True, text=True)
    with open("requirements_frozen.txt", "w") as f:
        f.write(frozen.stdout)
    mlflow.log_artifact("requirements_frozen.txt")

    commit = subprocess.run(["git", "rev-parse", "HEAD"],
                            capture_output=True, text=True).stdout.strip()
    mlflow.set_tag("git_commit", commit or "no-git")
    mlflow.sklearn.log_model(model, name="model")`,
      },
    ],
    practice: [
      {
        title: 'The archaeology test',
        minutes: 18,
        body: `Simulate future-you with someone else\'s napkins. Without opening the scripts again, answer FROM THE MLFLOW UI ALONE: (1) which single run had the best test accuracy overall, and under exactly which params? (2) how much did split_seed 0 → 1 move the forest\'s accuracy? (3) what package version of scikit-learn produced the gbm-full-bundle run? (4) could you re-create the gbm-full-bundle model on a fresh machine — list what you would download from the run and what is still missing, if anything.

Goal: all four answered from the UI in under 10 minutes. Anything you could NOT answer is a logging gap — go fix the logging code so the next run captures it, and write one sentence on the gap.

Hints: (3) lives in the requirements artifact. For (4), the honest inventory is: model artifact + frozen env + git commit + data hash — the data itself is referenced, not stored; is that acceptable here? When would it not be?`,
      },
    ],
    project: {
      title: 'Tracking enters the toolkit — and Day 83 inherits it',
      brief: `Add \`tracked_bakeoff(models, X_train, X_test, y_train, y_test, experiment, data_note)\` to \`ml_toolkit.py\`: your Day 74 bakeoff, with every model logged to MLflow (params, train/test metrics, gap) plus a shared data_note param (rows + hash) and git-commit tag per run. Make MLflow optional-but-loud: if import fails, run untracked and print a warning. Write \`tracking_conventions.md\`: your experiment-naming scheme, run-naming scheme, the four identities checklist (code/data/env/seed), and the five-seed tolerance protocol. Day 83\'s churn project REQUIRES tracked runs — this function is how. Commit both.`,
      rubric: [
        'tracked_bakeoff logs params, both metrics, and the gap for every model in one experiment',
        'Data identity (rows + hash) and git commit recorded on every run',
        'Graceful degradation when mlflow is not installed, with a visible warning',
        'Conventions doc covers naming, the four identities, and the seed-tolerance protocol',
        'Committed to the practice repo',
      ],
    },
    mistakes: [
      'Logging only the runs that worked. Survivor-only notebooks create "it worked in March" myths; start the run record BEFORE fitting, so failures are archived too.',
      'Comparing runs that differ in more than the thing being tested. If split seed AND features AND model changed, the delta is unattributable — the tracker shows this if you look at the params diff.',
      'Believing a seed makes results reproducible everywhere. Seeds pin one environment; library versions, OSes, and thread schedules can still shift numbers. Claim "reproducible within measured tolerance."',
      'Tracking metrics but not data identity. The silent killer is the CSV that changed under you; log rows + hash (or a real data version) so change is detectable.',
      'Putting the tracking calls in a notebook you never re-run. Tracking belongs in the training SCRIPT (Day 82\'s refactor), so every execution is a record, not a ceremony.',
      'Treating uncommitted code as loggable. A git hash with a dirty tree points at code that no longer exists; commit first or tag the run dirty so future-you knows to distrust it.',
    ],
    quiz: [
      {
        q: 'A teammate asks "what produced the 0.87 from last Tuesday?" With proper tracking, the answer comes from…',
        o: [
          'Terminal scrollback, if the machine is still on',
          'The MLflow run: its params, git commit, data hash, environment artifact, and logged model — one lookup',
          'Re-running everything until 0.87 appears again',
          'The team\'s shared memory',
        ],
        x: 1,
        w: 'The run record IS the answer: inputs, code identity, data identity, and outputs, findable by filtering the experiment. That lookup replacing archaeology is the entire value proposition.',
        revisit: 81,
      },
      {
        q: 'You set random_state=42 everywhere. A colleague on a newer scikit-learn gets slightly different numbers. This means…',
        o: [
          'One of you made an error',
          'Nothing is wrong: seeds pin randomness within one environment; cross-version/OS drift is expected — hence pinned environments and tolerance-based claims',
          'random_state is broken',
          'The data must have changed',
        ],
        x: 1,
        w: 'A seed fixes the random draws for a given implementation. Change the implementation (library version) and the draws or algorithms may differ. Pin the environment and report reproducibility within measured tolerance.',
        revisit: 81,
      },
      {
        q: 'Which comparison between two tracked runs is actually valid?',
        o: [
          'Run A (features v1, seed 0) vs Run B (features v2, seed 3) — the metric column decides',
          'Run A vs Run B differing ONLY in the tested change, same data hash, split, and metric',
          'Any two runs in the same experiment',
          'The best run of model A vs the average run of model B',
        ],
        x: 1,
        w: 'A delta is attributable only when exactly one thing changed under an identical protocol. The tracker makes the params diff visible — reading it before believing the delta is the honest-comparison habit.',
        revisit: 76,
      },
    ],
    resources: [
      { label: 'MLflow Documentation — tracking quickstart & concepts', url: 'https://mlflow.org/docs/latest/', type: 'docs', time: '30 min' },
      { label: 'Made With ML — experiment tracking lesson', url: 'https://madewithml.com/', type: 'course', time: '25 min' },
      { label: 'Designing ML Systems book repo (Chip Huyen) — reproducibility notes', url: 'https://github.com/chiphuyen/dmls-book', type: 'repo', time: '15 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: Days 76–80 due cards', minutes: 10 },
      { activity: 'ELI5 + tech read', minutes: 18 },
      { activity: 'Guided: tracked bake-off + artifact bundle', minutes: 37 },
      { activity: 'Practice: the archaeology test', minutes: 18 },
      { activity: 'Project: tracked_bakeoff + conventions doc', minutes: 25 },
      { activity: 'Quiz + flashcards', minutes: 12 },
    ],
    completion: [
      'MLflow UI running locally with ≥ 9 logged runs across two seeds',
      'Full-bundle run contains report, frozen requirements, git tag, and logged model',
      'Archaeology test: 4/4 answered from the UI, gaps fixed in logging code',
      'tracked_bakeoff + tracking_conventions.md committed',
      'Quiz ≥ 2/3',
    ],
    connections: {
      back: 'Day 76 taught you that single numbers lie and comparisons need identical protocols — the tracker is that discipline with a database. The environment pinning is Day 17\'s lockfiles, and the git hash per run is Day 8\'s time machine cross-referenced with results.',
      forward: 'Day 82 moves tracking into the reusable training script, and Day 83\'s churn rubric requires tracked runs. On Day 141 the same notebook records prompt versions and eval scores; the four-identities checklist reappears verbatim for LLM systems.',
    },
    flashcards: [
      { f: 'The four things an MLflow run records?', b: 'Params (inputs), metrics (measurements, loggable over time), tags (metadata like git commit), artifacts (files/models).' },
      { f: 'Four identities that pin a result?', b: 'Code (git commit), data (path + hash/version), environment (frozen deps), randomness (logged seeds).' },
      { f: 'What do seeds NOT guarantee?', b: 'Identity across library versions, OSes, or parallel schedules. Claim reproducibility within measured tolerance.' },
      { f: 'When is a run-vs-run delta attributable?', b: 'When exactly one thing differs — same data hash, split, metric, protocol. Read the params diff first.' },
      { f: 'Why log failed runs too?', b: 'Selective logging creates survivor myths; the record must include what did NOT work to steer future search.' },
      { f: 'The five-seed tolerance protocol?', b: 'Run 5× with different seeds; report mean ± spread. That spread is the honest meaning of "reproducible."' },
    ],
    deepDive: [
      { label: 'Data versioning beyond a hash', note: 'A content hash detects change but cannot restore the old data. DVC-style tools version datasets like git versions code — worth a skim now; the capstone\'s ingest pipeline (Day 119+) faces exactly this problem for document corpora.' },
    ],
  },
  {
    id: 'd082', day: 82, week: 12, phase: 4, kind: 'lesson',
    title: 'ML Code Structure & Pipelines',
    analogy: 'From notebook to factory',
    objectives: [
      'Refactor exploratory notebook code into a src-layout project with train/predict entry points',
      'Build one sklearn Pipeline that owns ALL preprocessing, so serving cannot skew from training',
      'Drive runs from a config file instead of edited constants',
      'Persist and reload a fitted pipeline with joblib, with version guards',
      'Define an inference function contract: raw input in, validated prediction out',
    ],
    prereqs: [
      { day: 69, label: 'ColumnTransformer & leakage discipline' },
      { day: 17, label: 'Packaging & project layout' },
      { day: 81, label: 'Experiment tracking' },
      { day: 18, label: 'pytest fundamentals' },
    ],
    eli5: `A chef invents a brilliant dish at home: a pinch of this, taste, adjust, no measurements written down. Now the restaurant wants it on the menu — 200 plates a night, any cook on shift, identical every time. The home process does not transfer: "a pinch" is not an instruction, "taste and adjust" does not scale, and the chef cannot stand at every stove. The fix is boring and priceless: a written recipe with exact quantities, a mise en place list, and steps any trained cook can execute — the dish, industrialized without being changed.

A notebook is home cooking: perfect for invention (cells re-run out of order, variables tasted and adjusted, state accumulating like a messy counter). But a model that matters gets retrained on fresh data, run by teammates, called by an API at 2 a.m. — restaurant conditions. Today you write the recipe: exploratory code becomes a project with a train script anyone can run, a config file holding every "pinch" as a number, one pipeline object that prepares data identically every time, and a saved model any process can reload and serve. The dish does not change; it becomes repeatable.`,
    why: `The most common production ML bug is **training-serving skew**: preprocessing done one way in the notebook and a slightly different way in the serving path — scaling with different stats, a category encoded differently — silently degrading every prediction. The single-pipeline-object discipline you learn today is the cure, and interviewers for ML engineering roles probe it directly ("how do you guarantee serving preprocesses like training?"). The template you build today is also compound interest: Day 83 fills it with churn tomorrow, Day 91 refactors the MNIST lab into it, and the Day 119 capstone starts from its skeleton instead of a blank repo.`,
    tech: `### The layout

~~~text
churn_project/
  pyproject.toml        # deps pinned (Day 17)
  config.yaml           # every knob, no magic numbers in code
  src/churn/
    data.py             # load + validate raw data
    features.py         # build_pipeline() -> the ONE preprocessing+model object
    train.py            # python -m churn.train --config config.yaml
    predict.py          # load model, predict on new rows
  tests/                # smoke + contract tests
  models/               # saved pipelines (gitignored; tracked via MLflow)
~~~

The notebook survives as \`notebooks/explore.ipynb\` — exploration is legitimate; what is banned is preprocessing logic living ONLY there.

### One pipeline to rule preprocessing

Day 69\'s ColumnTransformer plus the estimator, fused: \`Pipeline([("prep", ColumnTransformer([...])), ("model", HistGradientBoostingClassifier())])\`. Fit it, and the imputer\'s fill values, the scaler\'s means, the encoder\'s categories are all learned from training data and stored INSIDE the object. \`pipeline.predict(raw_df)\` then applies the identical transformations at serving time — skew becomes structurally impossible, and CV-ing the whole pipeline (Day 76) stays leak-free for free.

### Config-driven runs

Every tunable — data path, test size, seeds, model hyperparameters — lives in \`config.yaml\`, loaded at the top of train.py (\`yaml.safe_load\`; stdlib-only alternative: JSON). The config is logged to MLflow as params, making Day 81\'s "which run was that?" answerable from the artifact itself. Code changes for logic; config changes for experiments — different review, different risk.

### Persistence and the inference contract

\`joblib.dump(pipeline, path)\` serializes the fitted pipeline; \`joblib.load\` restores it. Two guards: pickles are only trustworthy from sources you control (loading executes code), and they are version-fragile — save a metadata JSON alongside (sklearn version, data hash, metrics, timestamp) and verify on load. The serving surface is one function: \`predict_one(raw: dict) -> {"label": int, "proba": float, "model_version": str}\` — validate input fields (pydantic, Day 68), pass a one-row DataFrame to the pipeline, return a typed answer. That function is exactly what Day 41\'s FastAPI wraps when this model gets an endpoint — same contract, HTTP wrapper.`,
    viz: null,
    guided: [
      {
        title: 'Build the template — structure first, model second',
        minutes: 25,
        body: `1. Create \`ml_template/\` in your practice repo with the tree from the tech section (touch empty files first; \`mkdir -p src/churn tests models\`).
2. Write \`config.yaml\` with: data settings (test_size: 0.25, split_seed: 82), model block (learning_rate: 0.1, max_iter: 300), and a features block listing numeric vs categorical column names for the loans data from Day 80 (reuse its generator as data.py\'s stand-in loader).
3. Write \`features.py\`: \`build_pipeline(config)\` returning the full ColumnTransformer + HistGradientBoosting pipeline. Numeric: passthrough or impute; categorical: OneHotEncoder(handle_unknown="ignore").
4. Write \`train.py\` per the starter shape: load config → load data → split → fit pipeline → evaluate → joblib.dump + metadata JSON → log everything to MLflow via Day 81\'s conventions.
5. Run \`python -m churn.train --config config.yaml\` from the project root. It should print metrics and leave \`models/model.joblib\` + \`models/model_meta.json\` behind. Change learning_rate in the YAML only, re-run, and confirm a new tracked run appears — an experiment without touching code.`,
        code: `# src/churn/train.py — the canonical shape
import argparse, hashlib, json, time
import joblib, yaml
import sklearn
from sklearn.model_selection import train_test_split
from churn.data import load_data
from churn.features import build_pipeline

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--config", default="config.yaml")
    cfg = yaml.safe_load(open(ap.parse_args().config))

    df = load_data(cfg)
    X, y = df.drop(columns=[cfg["target"]]), df[cfg["target"]]
    X_tr, X_te, y_tr, y_te = train_test_split(
        X, y, test_size=cfg["data"]["test_size"],
        random_state=cfg["data"]["split_seed"], stratify=y)

    pipe = build_pipeline(cfg)
    pipe.fit(X_tr, y_tr)
    test_acc = pipe.score(X_te, y_te)
    print(f"test accuracy: {test_acc:.3f}")

    joblib.dump(pipe, "models/model.joblib")
    meta = {"sklearn_version": sklearn.__version__,
            "trained_at": time.strftime("%Y-%m-%d %H:%M"),
            "config": cfg, "test_accuracy": round(test_acc, 4),
            "data_rows": len(df),
            "data_hash": hashlib.md5(
                X.to_csv(index=False).encode()).hexdigest()[:10]}
    json.dump(meta, open("models/model_meta.json", "w"), indent=2)
    # + mlflow logging per Day 81 conventions

if __name__ == "__main__":
    main()`,
      },
      {
        title: 'The inference contract + the skew you just made impossible',
        minutes: 15,
        body: `1. Write \`predict.py\`: load the joblib + metadata; warn loudly if \`sklearn.__version__\` differs from the metadata\'s. Implement \`predict_one(raw: dict)\` — validate required fields are present and numeric fields are numeric, build a one-row DataFrame, return label + probability + model_version (the metadata timestamp or hash).
2. Test it from the REPL: a valid row, a row with a missing field (should raise a clear error, not a pandas stack trace), and a row with an unseen category (should WORK — that is what handle_unknown="ignore" bought you).
3. Now demonstrate the disease you have been vaccinated against: in a scratch script, scale the training data with one StandardScaler, fit a bare LogisticRegression, then "serve" by scaling a test row with a NEW scaler fit on that row alone. Compare predictions vs the pipeline\'s. Write the moral in one sentence: preprocessing state must travel WITH the model — that is what the single pipeline object does.`,
        code: `# src/churn/predict.py
import json, warnings
import joblib, pandas as pd, sklearn

_pipe = joblib.load("models/model.joblib")
_meta = json.load(open("models/model_meta.json"))
if _meta["sklearn_version"] != sklearn.__version__:
    warnings.warn(f"model trained on sklearn {_meta['sklearn_version']}, "
                  f"running {sklearn.__version__} — retrain or pin.")

REQUIRED = ["income", "debt", "tenure", "segment"]

def predict_one(raw: dict) -> dict:
    missing = [k for k in REQUIRED if k not in raw]
    if missing:
        raise ValueError(f"missing fields: {missing}")
    row = pd.DataFrame([raw])
    return {"label": int(_pipe.predict(row)[0]),
            "proba": float(_pipe.predict_proba(row)[0, 1]),
            "model_version": _meta["trained_at"]}

if __name__ == "__main__":
    print(predict_one({"income": 45.0, "debt": 38.0,
                       "tenure": 1.2, "segment": "gig"}))`,
      },
    ],
    practice: [
      {
        title: 'Tests that catch tomorrow\'s breakage',
        minutes: 18,
        body: `Write three pytest tests for the template (Day 18\'s skills, aimed at ML): (1) a pipeline round-trip test — fit on a small slice, dump, load, and assert identical predictions on 20 rows; (2) a contract test — predict_one raises ValueError on a missing field and succeeds on an unseen category; (3) a training smoke test — train.py\'s main logic on 200 rows completes and beats the majority-class rate.

Goal: all three pass with \`pytest tests/\`; each runs in seconds (small data — these are smoke tests, not benchmarks).

Hints: import functions, don\'t subprocess the script — refactor main() into testable pieces if needed (that pressure is the point). For (3), compute the majority rate from y itself; asserting beats-dummy is a much better invariant than any hardcoded accuracy.`,
      },
    ],
    project: {
      title: 'Freeze the template; write its README',
      brief: `Finish \`ml_template/\` as a reusable starting point: complete tree, working train/predict entry points on the loans stand-in data, the three passing tests, and a README.md documenting: the layout map (one line per file), how to run training and prediction, the config philosophy (code = logic, config = experiments), the inference contract\'s exact input/output shapes, and a "porting checklist" — the 5 things to change when pointing this template at a new dataset (loader, target, feature lists, config, tests). Tag the commit \`ml-template-v1\`. Tomorrow morning, Day 83 starts by copying this directory — the README is the instruction sheet for future-you.`,
      rubric: [
        'Template tree matches the layout; train and predict run from a clean shell via documented commands',
        'All preprocessing lives inside the single persisted pipeline object',
        'Config drives every tunable; a YAML-only change produces a new tracked run',
        'Metadata JSON saved and version-checked on load; all three tests pass',
        'README with layout map, contract shapes, and porting checklist; commit tagged ml-template-v1',
      ],
    },
    mistakes: [
      'Leaving preprocessing logic in the notebook and re-implementing it "the same way" for serving. That duplication IS training-serving skew waiting to happen; one fitted pipeline object, persisted whole, is the fix.',
      'Hardcoding hyperparameters and paths in the script. Every experiment then edits code, polluting git history and making runs untraceable. Config in, constants out.',
      'Pickling just the model and scaling "separately" at serve time. The scaler\'s learned means ARE model state; a fresh scaler on serving data is a different model.',
      'Loading joblib/pickle files from untrusted sources. Unpickling executes code — treat model files with the same suspicion as executables.',
      'Ignoring sklearn version drift. A pipeline saved on 1.4 may fail or silently differ on 1.6; save the version in metadata and verify on load.',
      'Testing ML code with exact-accuracy assertions. Scores wobble with seeds; assert structural invariants instead — beats-dummy, round-trip identity, contract errors.',
    ],
    quiz: [
      {
        q: 'Training scaled features with a StandardScaler; the serving path scales incoming rows with statistics computed at serve time. What is this bug called, and what prevents it structurally?',
        o: [
          'Data leakage; prevented by cross-validation',
          'Training-serving skew; prevented by persisting one fitted Pipeline that owns preprocessing and travels with the model',
          'Overfitting; prevented by regularization',
          'Version drift; prevented by pinning sklearn',
        ],
        x: 1,
        w: 'The scaler\'s means/stds learned at training time are model state. Serving must apply THOSE, not fresh ones — which is automatic when preprocessing lives inside the single persisted pipeline object.',
        revisit: 82,
      },
      {
        q: 'Why do hyperparameters belong in config.yaml rather than in train.py?',
        o: [
          'YAML is faster to parse than Python',
          'Experiments become config diffs — no code edits, clean git history, and the config logs to the tracker as the run\'s full identity',
          'sklearn requires it',
          'It makes the code shorter',
        ],
        x: 1,
        w: 'Separating logic (code) from choices (config) means a run is reproducible from its logged config alone, and experimenting never risks a logic change. Different change types, different review and risk.',
        revisit: 82,
      },
      {
        q: 'A good automated test for a trained-model artifact is…',
        o: [
          'assert test_accuracy == 0.8734',
          'Dump → load → assert identical predictions on sample rows, plus assert the model beats the majority-class baseline',
          'assert the file size is unchanged',
          'No tests — ML is too random to test',
        ],
        x: 1,
        w: 'Exact scores wobble with seeds and versions; structural invariants (round-trip identity, beats-dummy, contract errors on bad input) stay true across healthy retrains and catch real breakage.',
        revisit: 82,
      },
    ],
    resources: [
      { label: 'scikit-learn User Guide — 8.1 Pipelines and composite estimators', url: 'https://scikit-learn.org/stable/modules/compose.html', type: 'docs', time: '25 min' },
      { label: 'Made With ML — code organization & scripting lessons', url: 'https://madewithml.com/', type: 'course', time: '30 min' },
      { label: 'pytest Documentation — fixtures refresher for the tests', url: 'https://docs.pytest.org/en/stable/', type: 'docs', time: '15 min' },
      { label: 'MLflow Documentation — model logging & loading', url: 'https://mlflow.org/docs/latest/', type: 'docs', time: '15 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: Days 69, 81 due cards', minutes: 10 },
      { activity: 'ELI5 + tech read', minutes: 18 },
      { activity: 'Guided: build the template + inference contract', minutes: 40 },
      { activity: 'Practice: the three tests', minutes: 18 },
      { activity: 'Project: freeze template, README, tag', minutes: 24 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'python -m churn.train runs from config and leaves model + metadata behind',
      'predict_one handles valid, invalid, and unseen-category inputs correctly',
      'Skew demonstration run and the moral written down',
      'Three tests pass; template tagged ml-template-v1 with README',
      'Quiz ≥ 2/3',
    ],
    connections: {
      back: 'Day 69\'s ColumnTransformer became the "prep" step of one pipeline; Day 17\'s packaging and Day 18\'s tests supplied the engineering skeleton; Day 81\'s tracking plugs into train.py so every run is a lab-notebook entry.',
      forward: 'Tomorrow the churn project is this template with real stakes — the copy-and-port is milestone zero. Day 91 refactors the MNIST lab into the same shape, and the capstone (Day 119) starts from this skeleton; predict_one becomes a FastAPI endpoint on Day 42\'s foundations.',
    },
    flashcards: [
      { f: 'Training-serving skew?', b: 'Serving preprocesses differently than training did. Cure: ONE fitted Pipeline owning all preprocessing, persisted and served whole.' },
      { f: 'Code vs config — the dividing rule?', b: 'Code = logic; config = every tunable choice (paths, seeds, hyperparameters). Experiments are config diffs.' },
      { f: 'What ships alongside model.joblib?', b: 'Metadata JSON: sklearn version, config, data hash, metrics, timestamp — verified on load.' },
      { f: 'The inference contract shape?', b: 'predict_one(raw dict) → validated → one-row DataFrame → {label, proba, model_version}. Clear errors on bad input.' },
      { f: 'Two dangers of pickle/joblib artifacts?', b: 'Loading executes code (trust the source) and version fragility (pin + record library versions).' },
      { f: 'Good ML test invariants?', b: 'Round-trip prediction identity, beats-the-dummy, contract errors on malformed input — never exact-score assertions.' },
    ],
    deepDive: [
      { label: 'sklearn\'s set_output and pandas-in/pandas-out pipelines', note: 'ColumnTransformer can emit DataFrames (set_output(transform="pandas")), keeping column names through the pipeline — invaluable when debugging what the model actually received. Try it on the template.' },
    ],
  },
  {
    id: 'd083', day: 83, week: 12, phase: 4, kind: 'project',
    title: 'Phase Project: Churn Prediction End-to-End',
    analogy: 'The whole assembly line',
    objectives: [
      'Frame a business problem as an ML problem: target, metric, and baseline chosen from the harm model',
      'Execute the full pipeline solo: EDA → features → bake-off → error analysis → shipped artifact',
      'Produce a stakeholder-readable report where every claim carries a number and an error bar',
      'Self-grade against an 8-criterion rubric and log honest gaps',
    ],
    prereqs: [
      { day: 82, label: 'The ml-template & inference contract' },
      { day: 81, label: 'Tracked runs' },
      { day: 80, label: 'Error-analysis playbook' },
      { day: 77, label: 'Competition protocol & model card' },
    ],
    eli5: `Every station on the assembly line, you have run alone: framing (Day 71), features (Day 69), models (Days 71–74), metrics (Day 75), validation (Day 76), error analysis (Day 80), tracking (Day 81), structure (Day 82). Today the conveyor belt runs the whole line at once, and you are every worker on it — because that is what the job actually is. Nobody ships "a decision tree"; they ship an end-to-end answer to a business question, with the receipts.

The scenario: a subscription company bleeds ~19% of customers a year and wants to know who will leave BEFORE they leave, so the retention team can intervene. Your deliverable is not a model — it is a decision-support system: a prediction pipeline the team could call, a report their manager could read, and an honest account of where it fails. The twist that makes this a rite of passage: no day-number handrails. The brief says what is needed; YOU decide which tool from the last twelve days answers each part. That transfer — from "following the lesson" to "selecting from your toolkit" — is the entire point of a phase project.`,
    why: `Churn prediction is the single most common commercial ML brief — telecom, SaaS, banking, streaming all buy it — which is exactly why it is this phase\'s graded project and a stock interview case study ("how would you build a churn model?" is asked verbatim). Everything here is portfolio-grade: a repo with tracked experiments, a tested pipeline, and a model card demonstrates the difference between "took a course" and "does the work." And the shape of today — brief in, scoped system + honest report out, alone, in hours — is a deliberate rehearsal of an FDE engagement and of Day 174\'s full simulation.`,
    tech: `### The architecture you are assembling

~~~text
raw CSV -> data.py (load, validate, types)
        -> EDA notebook (30 min, findings as sentences)
        -> features.py (ColumnTransformer inside THE pipeline)
        -> train.py (config-driven; bake-off via CV; MLflow-tracked)
        -> error_analysis (slices, ledger, one fix applied)
        -> models/churn.joblib + metadata
        -> predict.py (contract: customer dict -> risk score)
        -> REPORT.md (the deliverable a human reads)
~~~

### The data

The starter generator synthesizes 8,000 customers with realistic mechanics: contract type, tenure, monthly charges, support tickets, payment method, usage trend — and a churn probability driven by interpretable effects (month-to-month + short tenure + rising tickets = danger) plus noise, ~19% churn rate. It plants two honest hazards: a \`customer_id\` column (high-cardinality memorization bait — Day 73 warned you) and a \`last_login_days\` column computed AFTER the churn window (leakage — Day 69 warned you; churned customers obviously stopped logging in). Finding and handling both is part of the grade. Prefer real data? The IBM Telco churn CSV is a well-known public alternative with the same shape — the rubric applies unchanged; the synthetic route keeps today fully offline.

### The protocol (Day 77\'s, now with stakes)

Seal 20% as the test set immediately (stratified, random_state=83). Declare the metric in REPORT.md before modeling — 19% positives, an intervention that costs little vs a lost customer: think through what to headline (PR-AUC? recall at a budgeted precision?) and defend it. Baselines: dummy + scaled logistic. Contenders: at least a forest and a boosted model, CV-compared with mean ± std, all tracked. Then the playbook: slice by contract type and tenure band, read 20 errors, apply ONE data-or-feature fix, remeasure. Seal-break once, report all entries.

### The report

One page, stakeholder-readable: problem & metric rationale; data findings (including both planted hazards, if you caught them); leaderboard with error bars; the error-analysis story (what you found, what you fixed, what moved); top risk drivers stated cautiously (Day 73\'s importance caveats); limitations & next steps. Numbers in every claim; no unexplained jargon.`,
    viz: null,
    guided: [
      {
        title: 'Milestone 1 — Setup, data, EDA, metric declaration (target: 35 min)',
        minutes: 35,
        body: `1. Copy \`ml_template/\` to \`churn_project/\`; follow your own porting checklist from the Day 82 README. Save the starter generator as \`src/churn/data.py\`\'s loader.
2. Generate the data; seal the test split immediately in train.py (random_state=83).
3. Timeboxed EDA (30 min hard stop, Day 67 checklist): churn rate, distributions, churn rate BY each feature, correlations. You are hunting the two planted hazards: a column that would let the model memorize individuals, and a column that could not be known at prediction time. Decide the fate of each and write the decision + reasoning into REPORT.md\'s data-findings section.
4. Declare the metric in REPORT.md now, with the harm-model sentence: what does a missed churner cost vs a wasted retention offer? Choose headline + operating point accordingly.`,
        code: `# src/churn/data.py — synthetic churn generator (standalone, offline)
import numpy as np
import pandas as pd

def load_data(cfg=None, n=8000, seed=83):
    rng = np.random.default_rng(seed)
    contract = rng.choice(["month-to-month", "one-year", "two-year"],
                          n, p=[0.55, 0.25, 0.20])
    tenure = rng.integers(1, 72, n).astype(float)
    monthly = rng.normal(65, 22, n).clip(15, 160)
    tickets = rng.poisson(1.2, n) + (rng.random(n) < 0.15) * rng.poisson(4, n)
    payment = rng.choice(["card", "bank", "check"], n, p=[0.5, 0.3, 0.2])
    usage_trend = rng.normal(0, 1, n)          # + = rising usage

    logit = (-1.9
             + 1.1 * (contract == "month-to-month")
             - 0.35 * (contract == "two-year")
             - 0.030 * tenure
             + 0.012 * (monthly - 65)
             + 0.22 * tickets
             - 0.45 * usage_trend
             + 0.35 * (payment == "check"))
    churn = (rng.random(n) < 1 / (1 + np.exp(-logit))).astype(int)

    # hazard 1: an ID column (memorization bait)
    customer_id = np.arange(100000, 100000 + n)
    # hazard 2: leakage — computed AFTER the churn window
    last_login_days = np.where(
        churn == 1, rng.integers(30, 90, n), rng.integers(0, 21, n))

    return pd.DataFrame({
        "customer_id": customer_id, "contract": contract, "tenure": tenure,
        "monthly_charges": monthly.round(2), "support_tickets": tickets,
        "payment_method": payment, "usage_trend": usage_trend.round(3),
        "last_login_days": last_login_days, "churn": churn})

if __name__ == "__main__":
    df = load_data()
    print(df.shape, " churn rate:", round(df["churn"].mean(), 3))`,
      },
      {
        title: 'Milestone 2 — Features, bake-off, selection (target: 40 min)',
        minutes: 40,
        body: `1. Build the pipeline in features.py: numeric passthrough/scale as your lineup needs, categoricals encoded per Day 77\'s rule of thumb. The hazard columns get whatever fate you decided — the config\'s feature lists make exclusion a one-line, documented act.
2. Run the tracked bake-off on the training portion: dummy, scaled logistic, random forest, HistGradientBoosting — CV mean ± std for your declared metric (scoring="average_precision" if you chose PR-AUC), every run to MLflow.
3. One tuning pass on the leader only (fair-fight rule from Day 74 — note it in the report). Use your toolkit\'s tune().
4. Select the ship candidate on CV evidence. If the boosted model and forest are within each other\'s error bars, say so and choose on secondary grounds (calibration need, speed) — write the sentence.
5. Curiosity checkpoint (do NOT ship it): add customer_id and last_login_days back in a scratch run. Watch the score "improve." Write one line in the report\'s limitations: what that mirage would have done in production.`,
      },
      {
        title: 'Milestone 3 — Error analysis, seal-break, report, self-grade (target: 35 min)',
        minutes: 35,
        body: `1. Run the Day 80 playbook on out-of-fold or validation predictions: slice_report by contract and tenure-band, read 20 errors with confident_errors, count hypotheses.
2. Apply ONE fix the ledger justifies (a feature like tenure-per-dollar, a binning, more weight on a slice — your call), remeasure CV, and record the before/after honestly — including if it did not help.
3. Seal-break: score dummy, logistic, and your final model on the untouched test set, once. Build the leaderboard table.
4. Finish REPORT.md (all sections from the tech spec). Run predict.py\'s contract check: one high-risk and one low-risk fictional customer through predict_one — paste both into the report as the "what the retention team sees" demo.
5. Self-grade against all 8 rubric criteria, one sentence of evidence each. Log gaps as GitHub issues (or a TODO section) — unfixed-but-known beats silently missing. Commit; tag churn-v1.`,
      },
    ],
    practice: [
      {
        title: 'The skeptical-VP drill',
        minutes: 10,
        body: `A skeptical VP reads your report and fires three questions. Write a 2–3 sentence answer to each, with numbers from YOUR run: (1) "Why should I believe this beats just calling everyone whose contract is month-to-month?" (2) "It flags 300 customers a month — how many are false alarms, and what does that cost me?" (3) "What would make this model quietly wrong six months from now?"

Hints: (1) is a demand for a rule-based baseline comparison — if you didn\'t run one, run it now (it is one line: predict churn = month-to-month). (2) reads precision at your operating threshold. (3) is drift: tenure distributions shift, retention offers change behavior, the leakage column\'s temptation returns.`,
      },
    ],
    project: {
      title: 'The deliverable & the 8-criterion rubric',
      brief: `Ship \`churn_project/\` as a self-contained repo directory: config-driven training on the synthetic churn data (or Telco), one persisted pipeline honoring the inference contract, MLflow-tracked experiments, tests passing, and REPORT.md written for a retention-team manager. The rubric below is the grade — 2 points each, 16 total: 13+ = strong pass, 10–12 = pass with gaps logged, <10 = schedule a half-day revisit before Day 85. Self-grade honestly; Day 84\'s writeup asks you to defend two of your own scores.`,
      rubric: [
        'Framing: metric + operating threshold declared BEFORE modeling, justified from the stated harm model in ≤ 3 sentences',
        'Hazards: both planted traps (ID memorization bait, post-outcome leakage column) found, correctly handled, and documented',
        'Protocol: test set sealed first and scored exactly once; all model selection on CV evidence with mean ± std reported',
        'Bake-off: ≥ 4 entries including dummy and scaled-logistic baselines; final model beats both on the sealed set',
        'Error analysis: slices + 20-error ledger executed; one ledger-justified fix applied with before/after numbers (honest if null)',
        'Engineering: template structure, config-driven runs, passing tests, persisted pipeline + metadata, working predict_one demo',
        'Tracking: every experiment in MLflow with params, metrics, data hash, git tag — the winning run fully reconstructible',
        'Report: one page, stakeholder-readable, all sections present, every claim numbered, limitations include the drift risk',
      ],
    },
    mistakes: [
      'Spending the first hour polishing EDA plots. The timebox exists because the model card needs findings, not gallery pieces — 30 minutes, findings as sentences, move.',
      'Letting customer_id or last_login_days into the features "because the score went up." That score is the mirage; the rubric pays for CATCHING them, and production would pay for missing them.',
      'Choosing the metric after the bake-off. Declaration-before-modeling is criterion 1; a metric chosen to flatter results fails it even if the number is good.',
      'Tuning every model in the lineup for hours. One tuning pass on the leader, fair-fight noted — this is a one-day build, and the rubric rewards protocol, not leaderboard heroics.',
      'Reporting feature importances as "why customers churn." Day 73\'s caveats apply doubly in a causal-sounding report; say "associated with risk in this model," not "causes."',
      'Skipping the self-grade or grading generously. Day 84 asks you to defend two scores; inflated grades make that defense — and the habit — worthless.',
    ],
    quiz: [
      {
        q: 'The last_login_days column boosts CV score dramatically. Why must it be dropped anyway?',
        o: [
          'High-cardinality features overfit',
          'It is measured after the churn outcome — unavailable at prediction time, so the score is leakage, not skill',
          'Login data is private',
          'It correlates with tenure',
        ],
        x: 1,
        w: 'Churned customers stop logging in BECAUSE they churned; the feature encodes the answer. In production it would not exist at decision time — the CV gain is a time-travel illusion (Day 69\'s leakage, live).',
        revisit: 69,
      },
      {
        q: 'Your boosted model\'s CV PR-AUC is 0.61 ± 0.03; the forest\'s is 0.60 ± 0.04. The honest report says…',
        o: [
          'Boosting wins; ship it',
          'The models are statistically indistinguishable on this data; the choice falls to secondary criteria (speed, calibration), stated as such',
          'Run the test set on both and pick the winner',
          'Average the two scores',
        ],
        x: 1,
        w: 'Overlapping error bars mean the delta is within noise (Day 76). Picking via the sealed test set would burn it as a validation set; choose on secondary grounds and say so.',
        revisit: 76,
      },
      {
        q: 'The retention team can contact 150 customers/month. This constraint primarily changes…',
        o: [
          'The training algorithm',
          'The operating point: rank by predicted risk and take the top 150 — precision at that capacity matters more than any global threshold',
          'The train/test split ratio',
          'Nothing; ship the 0.5 threshold',
        ],
        x: 1,
        w: 'A capacity budget converts the problem to top-k targeting: what fraction of the 150 are real churners (precision@150) and what share of all churners they cover. The business constraint sets the metric\'s operating point — Day 75\'s lesson in the wild.',
        revisit: 75,
      },
    ],
    resources: [
      { label: 'scikit-learn User Guide — 8.1 Pipelines (reference while building)', url: 'https://scikit-learn.org/stable/modules/compose.html', type: 'docs', time: '10 min' },
      { label: 'scikit-learn User Guide — 3.4 Metrics (PR-AUC & scoring strings)', url: 'https://scikit-learn.org/stable/modules/model_evaluation.html', type: 'docs', time: '10 min' },
      { label: 'MLflow Documentation — tracking reference', url: 'https://mlflow.org/docs/latest/', type: 'docs', time: '10 min' },
      { label: 'Kaggle Learn — feature engineering ideas for tabular churn', url: 'https://www.kaggle.com/learn', type: 'course', time: '15 min' },
    ],
    schedule: [
      { activity: 'Milestone 1: setup, EDA, hazard hunt, metric declaration', minutes: 35 },
      { activity: 'Milestone 2: features, tracked bake-off, selection', minutes: 40 },
      { activity: 'Milestone 3: error analysis, seal-break, report, self-grade', minutes: 35 },
      { activity: 'Practice: the skeptical-VP drill', minutes: 10 },
    ],
    completion: [
      'Both planted hazards found and documented with the handling decision',
      'Sealed test scored once; final model beats both baselines on the declared metric',
      'REPORT.md complete with leaderboard, error-analysis story, and limitations',
      'Self-grade ≥ 10/16 with evidence sentences; gaps logged',
      'Repo committed and tagged churn-v1',
    ],
    connections: {
      back: 'This day is Weeks 10–12 compressed: Day 67\'s EDA timebox, Day 69\'s leakage radar, Day 74\'s fair bake-off, Day 75\'s harm-model metric, Day 76\'s error bars, Day 77\'s protocol, Day 80\'s playbook, Day 81\'s tracking, Day 82\'s template. The toolkit you grew daily was for this.',
      forward: 'Day 84 defends this work in interview form. Day 90\'s MNIST lab reruns the same arc in deep learning, and the capstone (Day 119) is this day again at production scale — brief, protocol, artifact, report. The skeptical-VP answers preview Day 171\'s stakeholder craft.',
    },
    flashcards: [
      { f: 'First two acts of any modeling project?', b: 'Seal the test set; declare the metric from the harm model — both before any model is fit.' },
      { f: 'The two classic tabular data traps?', b: 'ID-like columns (memorization bait) and post-outcome features (leakage). Hunt both in EDA, every time.' },
      { f: 'Capacity-constrained targeting changes the metric how?', b: 'Rank by risk, take top-k; report precision@k and churner coverage — the budget sets the operating point.' },
      { f: 'Overlapping CV error bars between finalists — the move?', b: 'Declare them indistinguishable; choose on secondary criteria (speed, calibration) and say so. Never referee via the test set.' },
      { f: 'What makes a phase-project report stakeholder-readable?', b: 'One page, every claim carries a number, jargon translated, limitations and drift risks stated plainly.' },
    ],
    deepDive: [
      { label: 'Survival analysis — churn\'s other framing', note: 'Classification asks "will they churn this window?"; survival models ask "how long until churn?" — handling censoring properly and yielding retention curves. Worth knowing the name (Cox proportional hazards) when a customer asks about time-to-event.' },
    ],
  },
  {
    id: 'd084', day: 84, week: 12, phase: 4, kind: 'review',
    title: 'Week 12 Checkpoint + Interview Drill II',
    analogy: 'The ML viva',
    objectives: [
      'Recall Week 12\'s core ideas — clustering, PCA, error analysis, tracking, pipelines — from memory',
      'Answer 20 rapid-fire ML-fundamentals questions aloud, interview-style, and self-grade against model answers',
      'Present the churn project in a tight written walkthrough: problem → approach → result → next steps',
      'Update the interview error log with this phase\'s weak spots and schedule their revisits',
    ],
    prereqs: [
      { day: 83, label: 'Churn project (the thing you will defend)' },
      { day: 77, label: 'Week 11 checkpoint & model card' },
      { day: 28, label: 'The interview error log' },
    ],
    eli5: `In medical school, learning ends with a viva: you stand before examiners and explain — out loud, without notes — what you did for the patient and why. Not because talking is medicine, but because fluent explanation is the sharpest test of understanding. If you can only recognize an idea when someone else says it, you have familiarity. If you can produce it cold, defend it against a "but why not…?" and attach a number from your own work, you have knowledge.

Today is the ML viva. Two hours, three movements: drag Week 12 back from memory before it fades (that struggle is the spaced-repetition rep that makes it stick); face 20 rapid-fire questions of the kind real screens actually ask — "precision vs recall?", "your model overfits, name three fixes", "trees vs linear, when and why?" — answering aloud, at interview tempo; and write the five-minute walkthrough of yesterday\'s churn project, because "tell me about a project" is the one question you are guaranteed to get, and the difference between rambling and a crisp problem → approach → result → next-steps arc is rehearsal. The error log from Day 28 gets its update: every stumble today is scheduled for a revisit, which is how weak spots become former weak spots.`,
    why: `Phase 4 ends here, and ML fundamentals are the most predictable screen in the hiring pipeline: recruiter phone screens, take-home debriefs, and the "ML basics" round all draw from the same ~40-question well you drill today. AI-engineer roles have not dropped these questions — they ask them right before the LLM questions. The project walkthrough matters even more: interviewers weight "walk me through something you built" far above trivia, and your churn repo plus today\'s rehearsed narrative is a complete, honest answer. The error log habit — log, revisit, retire — is the compounding engine behind Day 179\'s final interview gym.`,
    tech: `### The drill format

Rapid-fire questions get 60–90 seconds each, ALOUD (speaking exposes gaps that nodding hides). The scoring rubric per answer: (1) direct answer first — one sentence; (2) mechanism — why it is true; (3) a concrete example or number, ideally from your own Week 11–12 work. "Precision is TP over flagged; it collapses when false alarms flood a rare-positive problem; in my churn project precision at the 150-call budget ran roughly twice the 0.19 base rate" is a full-credit answer. Naming your own project turns trivia into evidence.

### The question bank\'s shape

The 20 questions cluster into five families, mirroring real screens: **metrics** (accuracy trap, precision/recall, ROC vs PR, metric-from-action), **generalization** (bias/variance symptoms, L1/L2, CV protocol, winner\'s curse), **models** (trees vs linear, bagging vs boosting, why ensembles win tabular, feature importance caveats), **unsupervised** (k-means mechanics and failure modes, choosing k, PCA\'s objective and its two big caveats), and **practice** (leakage detection, error analysis method, reproducibility, notebook → pipeline). If you can hit all five families cold, Phase 4 is consolidated; the families you miss map directly to revisit days.

### The project walkthrough

Structure the churn story in four beats, ~75 words each: **Problem** (who acts, on what budget, so which metric); **Approach** (protocol headline: sealed holdout, stratified CV, lineup, the leakage catch — always tell the leakage story, it is your best credibility signal); **Result** (holdout PR-AUC and precision@k vs both baselines, WITH the caveat you found); **Next steps** (two, ranked, with reasons). Write it, read it aloud, cut it until it fits five minutes. This artifact gets reused nearly verbatim in behavioral prep on Day 179.`,
    viz: null,
    guided: [
      {
        title: 'Week 12 recall, closed book',
        minutes: 20,
        body: `Notes shut. On paper, from memory:

1. The k-means loop, and its three built-in assumptions. (Day 78)
2. Silhouette score: formula shape and how to read +1 / 0 / negative. (Day 78)
3. PCA\'s objective in one line, and the two-word reason a 2-D overlap plot does not prove classes are inseparable. (Day 79)
4. The error-analysis loop: what you look at first, second, third after a model underperforms. (Day 80)
5. What an MLflow run records, and the three things a fully reproducible run pins. (Day 81)
6. The predict-function contract from the pipeline template: inputs validated, outputs shaped how? (Day 82)
7. The churn project\'s leakage feature and the audit question that caught it. (Day 83)

Open notes, diff, mark ✓/~/✗. Re-derive every ✗ from its source day now — the viva assumes them.`,
      },
      {
        title: 'The 20-question mock, aloud',
        minutes: 40,
        body: `Set a timer: 90 seconds per question, answer ALOUD, then check the model-answer notes you will write afterward. Score each 0/1/2 (blank / partial / full three-part answer).

1. Accuracy is 94% — when is that meaningless, and what do you ask for instead?
2. Precision vs recall: definitions, denominators, and one business that optimizes each.
3. ROC-AUC vs PR-AUC — which for 1% fraud, and why?
4. Your model: train 0.98, validation 0.72. Diagnose and give three fixes.
5. Your model: train 0.61, validation 0.60. Diagnose — will more data help?
6. L1 vs L2 regularization: mechanical difference and when you want each.
7. Why must the scaler live inside the CV pipeline?
8. What is the winner\'s curse in hyperparameter search, and the defense?
9. Trees vs logistic regression: three deciding factors.
10. Bagging vs boosting in two sentences, including which variance/bias each attacks.
11. Why do random forests not overfit as trees are added, while boosting rounds can?
12. Feature importances: two reasons to distrust them, and the honest alternative.
13. k-means: the loop, and why it always converges but not always well.
14. How do you choose k? Name two methods and their weaknesses.
15. When does DBSCAN beat k-means? What are its two knobs?
16. PCA in one line — and why standardize first?
17. Explain the curse of dimensionality\'s effect on nearest-neighbor methods.
18. What is data leakage? Give two distinct examples and the audit question.
19. A stakeholder asks "is the model good?" — walk your answer structure.
20. What does "reproducible" mean for an ML experiment? Name what you pin.

Total /40. Under 30: schedule the weak families\' source days for revisit this week.`,
      },
    ],
    practice: [
      {
        title: 'Write the model answers',
        minutes: 15,
        body: `For your five LOWEST-scoring questions from the mock, write full-credit model answers using the three-part structure (direct answer → mechanism → example-with-number from your own work). Then answer each aloud once more, from memory, at tempo.

Constraint: every model answer must cite a number or artifact from YOUR Week 11–12 repos (the depth-sweep table, the silhouette sweep, the churn precision@k at the retention budget, the leakage mirage score from the curiosity checkpoint…). Generic answers are the thing this practice exists to kill.

Hint: if a question has no number anywhere in your repos, that is itself a finding — go generate it in ten minutes or log it as a gap.`,
      },
    ],
    project: {
      title: 'Viva packet: walkthrough + error log update',
      brief: `Ship \`week12_viva/\` in your practice repo: (1) \`WALKTHROUGH.md\` — the four-beat churn presentation (problem, approach incl. the leakage story, result with caveat, next steps), ≤ 350 words, rehearsed aloud at least twice, plus a short appendix defending two of your Day 83 self-grade scores with evidence; (2) \`mock_answers.md\` — your 20 scores plus full model answers for the five weakest; (3) an updated interview error log (from Day 28): add every 0–1-scored question with its family, source day, and a scheduled revisit date; retire any old entries you now answer cold. Commit all three — Day 179\'s interview gym starts from exactly this log.`,
      rubric: [
        'WALKTHROUGH.md hits all four beats in ≤ 350 words, includes the leakage story and one honest caveat, and defends two Day 83 self-grade scores',
        'All 20 mock questions scored, with the family totals identifying weak areas',
        'Five model answers follow the three-part structure and each cites a number from your own repos',
        'Error log updated: new entries dated and scheduled, mastered entries retired',
        'Everything committed to the practice repo',
      ],
    },
    mistakes: [
      'Reviewing by rereading notes. Recognition masquerades as recall; only closed-book production and aloud answers reveal what interview pressure will reveal anyway.',
      'Answering rapid-fire questions with definitions only. Full credit = answer + mechanism + example; the example from your own project is what interviewers remember.',
      'Telling the project story chronologically ("first I loaded the data, then I…"). Lead with the problem and the result; the four-beat arc beats the diary every time.',
      'Hiding the leakage story or the CV-to-holdout drop in the walkthrough. Honest caveats are credibility signals — interviewers probe for exactly whether you know your model\'s weaknesses.',
      'Logging errors without scheduling revisits. An error log that is never reread is a diary; the revisit date is what turns it into a training plan.',
      'Treating today as optional because Week 12 "just happened." The forgetting curve is steepest in the first days — this session is timed to catch memories at peak leverage.',
    ],
    quiz: [
      {
        q: 'A silhouette sweep peaks at k=3 but the elbow looks like k=5, and the business swears there are 4 segments. What is the defensible move?',
        o: [
          'Always trust the elbow',
          'Always trust the silhouette',
          'Compare candidates: profile k=3, 4, 5, check cluster stability across seeds, and pick the k whose segments are nameable and actionable — the diagnostics are evidence, not verdicts',
          'Average the three answers to k=4',
        ],
        x: 2,
        w: 'Elbow and silhouette are heuristics on different definitions of "good piles." Day 78\'s standard: profile in raw units, test stability, and let interpretability break the tie — clustering has no ground truth to defer to.',
        revisit: 78,
      },
      {
        q: 'In your churn walkthrough, the strongest single credibility signal to include is…',
        o: [
          'The highest metric you achieved on any split',
          'The leakage feature you caught, with the fake-vs-real metric gap and the reasoning',
          'The number of models you tried',
          'The library versions you used',
        ],
        x: 1,
        w: 'Anyone can report a big number; catching the post-outcome last_login_days column (and the customer_id bait) proves you understand WHEN information exists — the judgment interviews and customers actually test for.',
        revisit: 83,
      },
      {
        q: 'PCA reduces your 64 features to 10 components and your tree ensemble\'s PR-AUC drops slightly. The likely explanation and right response is…',
        o: [
          'PCA is broken — file a bug',
          'Trees never work after PCA — switch to logistic regression',
          'Trees handled the correlated raw features fine, and PCA traded away some supervised signal for variance; keep raw features for the ensemble, keep PCA for viz and distance-based methods',
          'Add more components until PR-AUC recovers, tuned on the test set',
        ],
        x: 2,
        w: 'PCA maximizes variance, not class signal, and ensembles do not need decorrelated inputs — Day 79\'s "when PCA helps vs hurts" applied. Tuning on the test set would compound the error.',
        revisit: 79,
      },
    ],
    resources: [
      { label: 'ML Interviews Book (Chip Huyen) — ML fundamentals questions', url: 'https://huyenchip.com/ml-interviews-book/', type: 'book', time: '30 min' },
      { label: 'Tech Interview Handbook repo — behavioral & story structure', url: 'https://github.com/yangshun/tech-interview-handbook', type: 'repo', time: '20 min' },
      { label: 'StatQuest — rapid refreshers for any missed family', url: 'https://statquest.org/', type: 'video', time: '20 min' },
      { label: 'scikit-learn User Guide — reference for disputed answers', url: 'https://scikit-learn.org/stable/user_guide.html', type: 'docs', time: '15 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep: full Week 12 due deck (SM-2 queue)', minutes: 15 },
      { activity: 'Guided: closed-book Week 12 recall + diff', minutes: 20 },
      { activity: 'Guided: 20-question mock, aloud and timed', minutes: 40 },
      { activity: 'Practice: model answers for the weakest five', minutes: 15 },
      { activity: 'Project: walkthrough + error-log update, commit', minutes: 20 },
      { activity: 'Cumulative quiz + retag weak flashcards', minutes: 10 },
    ],
    completion: [
      'Week 12 recall drills diffed; every ✗ re-derived from its source day',
      'Mock scored /40 with family totals; weak families scheduled for revisit',
      'WALKTHROUGH.md rehearsed aloud twice and committed',
      'Error log updated with dated revisits; retired entries pruned',
      'Cumulative quiz ≥ 2/3',
    ],
    connections: {
      back: 'The viva defends Day 83\'s build using Week 11\'s vocabulary (Days 71–77) and Week 12\'s craft (Days 78–82). The error log you updated was born on Day 28, and the aloud-answer discipline started at Day 35\'s first interview drill.',
      forward: 'Phase 5 begins tomorrow: Day 85\'s neural networks reuse function+loss+optimizer verbatim, Day 89 reads loss curves with today\'s bias/variance eyes, and Day 90\'s MNIST lab expects the Day 82 template you just defended. The walkthrough and error log feed directly into Day 179\'s interview gym and Day 180\'s demo day.',
    },
    flashcards: [
      { f: 'Full-credit structure for a rapid-fire ML answer?', b: 'Direct answer (1 sentence) → mechanism (why) → concrete example with a number, ideally from your own project.' },
      { f: 'Four beats of a project walkthrough?', b: 'Problem (who acts, which metric) → approach (protocol + leakage story) → result (vs baselines, with caveat) → next steps (ranked).' },
      { f: 'The five question-families of ML screens?', b: 'Metrics, generalization (CV/bias-variance/regularization), models (trees/ensembles/linear), unsupervised (clustering/PCA), practice (leakage/reproducibility/error analysis).' },
      { f: 'What makes an error log a training plan?', b: 'Each entry gets a family, source day, and a SCHEDULED revisit date; mastered entries get retired.' },
      { f: 'Why answer mock questions aloud?', b: 'Speech exposes gaps recognition hides — fluency under production is what interviews actually measure.' },
    ],
    deepDive: [
      { label: 'LLM Interview Questions repo — preview the next phases\' bank', url: 'https://github.com/llmgenai/LLMInterviewQuestions', note: 'Skim the fundamentals section: notice how many questions are Phase 4 concepts (metrics, overfitting, evaluation) wearing LLM clothes. You will drill these properly from Phase 6 on.' },
    ],
  },
];
