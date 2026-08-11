// Data-integrity tests for the 180-day curriculum.
// Run: npm test  (node --test tests/)
import { test } from "node:test";
import assert from "node:assert/strict";

const BATCHES = [
  ["days-001-014", "DAYS_001_014", 14],
  ["days-015-028", "DAYS_015_028", 14],
  ["days-029-042", "DAYS_029_042", 14],
  ["days-043-056", "DAYS_043_056", 14],
  ["days-057-070", "DAYS_057_070", 14],
  ["days-071-084", "DAYS_071_084", 14],
  ["days-085-098", "DAYS_085_098", 14],
  ["days-099-112", "DAYS_099_112", 14],
  ["days-113-126", "DAYS_113_126", 14],
  ["days-127-140", "DAYS_127_140", 14],
  ["days-141-154", "DAYS_141_154", 14],
  ["days-155-168", "DAYS_155_168", 14],
  ["days-169-180", "DAYS_169_180", 12],
];

async function loadAll() {
  const all = [];
  for (const [file, name, expected] of BATCHES) {
    const mod = await import(`../src/data/${file}.js`);
    const days = mod[name];
    assert.ok(Array.isArray(days), `${file} exports ${name} array`);
    assert.equal(days.length, expected, `${file} has ${expected} days`);
    all.push(...days);
  }
  return all.sort((a, b) => a.day - b.day);
}

test("all 180 days exist with correct ids, weeks, and phases", async () => {
  const days = await loadAll();
  assert.equal(days.length, 180);
  const { PHASES } = await import("../src/data/phases.js");
  for (let n = 1; n <= 180; n++) {
    const d = days[n - 1];
    assert.equal(d.day, n, `day ${n} present`);
    assert.equal(d.id, `d${String(n).padStart(3, "0")}`, `day ${n} id`);
    assert.equal(d.week, Math.min(26, Math.ceil(n / 7)), `day ${n} week`);
    const phase = PHASES.find((p) => n >= p.days[0] && n <= p.days[1]);
    assert.ok(phase, `day ${n} falls in a phase`);
    assert.equal(d.phase, Number(phase.id.slice(1)), `day ${n} phase`);
  }
});

test("review cadence: every 7th day through 175, plus day 180", async () => {
  const days = await loadAll();
  for (let n = 7; n <= 175; n += 7) {
    assert.equal(days[n - 1].kind, "review", `day ${n} is a review day`);
  }
  assert.equal(days[179].kind, "review", "day 180 is the final review");
});

test("every day is complete: quiz, resources, schedule, flashcards, rubric", async () => {
  const days = await loadAll();
  for (const d of days) {
    assert.ok(d.title && d.analogy && d.eli5 && d.tech && d.why, `${d.id} has core text`);
    assert.ok(d.eli5.length > 300, `${d.id} eli5 is substantive`);
    assert.ok(d.tech.length > 700, `${d.id} tech is substantive`);
    assert.ok(d.objectives.length >= 3, `${d.id} has ≥3 objectives`);
    assert.equal(d.quiz.length, 3, `${d.id} has exactly 3 quiz questions`);
    for (const q of d.quiz) {
      assert.ok(q.x >= 0 && q.x < q.o.length, `${d.id} quiz answer in range`);
      assert.ok(q.w, `${d.id} quiz has explanation`);
      if (q.revisit != null) assert.ok(q.revisit >= 1 && q.revisit <= 180, `${d.id} revisit in range`);
    }
    assert.ok(d.resources.length >= 3, `${d.id} has ≥3 resources`);
    for (const r of d.resources) {
      assert.match(r.url, /^https?:\/\//, `${d.id} resource url valid`);
    }
    const mins = d.schedule.reduce((s, a) => s + a.minutes, 0);
    assert.ok(mins >= 100 && mins <= 140, `${d.id} schedule ≈2h (got ${mins})`);
    assert.ok(d.flashcards.length >= 4, `${d.id} has ≥4 flashcards`);
    assert.ok(d.project?.rubric?.length >= 3, `${d.id} project has rubric`);
    assert.ok(d.mistakes.length >= 3, `${d.id} lists mistakes`);
    assert.ok(d.completion.length >= 3, `${d.id} completion criteria`);
    assert.ok(d.connections?.back && d.connections?.forward, `${d.id} connections`);
    assert.ok(d.guided.length >= 1, `${d.id} has guided work`);
  }
});

test("prerequisites always point backward and exist", async () => {
  const days = await loadAll();
  const nums = new Set(days.map((d) => d.day));
  for (const d of days) {
    for (const p of d.prereqs) {
      assert.ok(p.day < d.day, `${d.id} prereq D${p.day} is earlier`);
      assert.ok(nums.has(p.day), `${d.id} prereq D${p.day} exists`);
      assert.ok(p.label, `${d.id} prereq has label`);
    }
  }
});

test("visualizer keys referenced by days exist in the viz registry", async () => {
  const days = await loadAll();
  const { VIZ } = await import("../src/data/visualizers.js");
  const { VIZ2 } = await import("../src/data/visualizers-2.js");
  const { VIZ3 } = await import("../src/data/visualizers-3.js");
  const all = { ...VIZ, ...VIZ2, ...VIZ3 };
  const missing = [];
  for (const d of days) {
    if (d.viz && !all[d.viz]) missing.push(`${d.id}:${d.viz}`);
  }
  // viz coverage is allowed to be partial, but referenced keys must resolve
  assert.deepEqual(missing, [], `days reference missing viz keys: ${missing.join(", ")}`);
});
