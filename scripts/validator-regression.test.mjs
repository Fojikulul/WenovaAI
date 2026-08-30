// Regression tests for the feedback validator and prompt.
// Run: node --test scripts/validator-regression.test.mjs

import { registerHooks } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { test } from "node:test";
import assert from "node:assert/strict";

// Plain Node doesn't know Next's "@/" alias, extension-less imports, or JSON
// imports without an attribute, so this small hook teaches it.
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith("@/")) specifier = pathToFileURL(join(root, specifier.slice(2))).href;
    try {
      return next(specifier, context);
    } catch (err) {
      if (specifier.startsWith(".") || specifier.startsWith("file:")) return next(`${specifier}.ts`, context);
      throw err;
    }
  },
  load(url, context, next) {
    if (url.endsWith(".json")) {
      const json = readFileSync(fileURLToPath(url), "utf8");
      return { format: "module", source: `export default ${json};`, shortCircuit: true };
    }
    return next(url, context);
  },
});

const { validateFeedback } = await import("../lib/validate-feedback.ts");
const { buildFeedbackPrompt } = await import("../lib/feedback-prompt.ts");

const reply = (...mistakes) => ({ mistakes, summary: "Nice work!" });
const mistake = (original, fix) => ({ original, fix, rule: "articles", why: "x" });

test('drops "playing the guitar" -> "playing the guitar" (fix identical to original)', () => {
  const result = validateFeedback(reply(mistake("playing the guitar", "playing the guitar")), "practice");
  assert.deepEqual(result.mistakes, []);
});

test("drops a fix that differs only by spaces at the ends", () => {
  const result = validateFeedback(reply(mistake("playing the guitar", " playing the guitar ")), "practice");
  assert.deepEqual(result.mistakes, []);
});

test('keeps "playing the guitar" -> "playing guitar": the validator only removes identical text', () => {
  const result = validateFeedback(reply(mistake("playing the guitar", "playing guitar")), "practice");
  assert.equal(result.mistakes.length, 1);
});

test("keeps a capital-letter fix (a real change)", () => {
  const result = validateFeedback(reply(mistake("i went", "I went")), "practice");
  assert.equal(result.mistakes.length, 1);
});

test("keeps real mistakes next to a dropped one", () => {
  const result = validateFeedback(
    reply(mistake("playing the guitar", "playing the guitar"), mistake("a engineer", "an engineer")),
    "essay",
  );
  assert.equal(result, null, "essay without a grade is still rejected");
  const ok = validateFeedback(
    { ...reply(mistake("playing the guitar", "playing the guitar"), mistake("a engineer", "an engineer")), grade: null },
    "essay",
  );
  assert.deepEqual(ok.mistakes.map((m) => m.original), ["a engineer"]);
});

test('prompt says "playing the guitar" and "playing guitar" are both correct, in both modes', () => {
  for (const mode of ["practice", "essay"]) {
    const prompt = buildFeedbackPrompt(mode, "articles");
    assert.match(prompt, /Don't flag acceptable alternative phrasing/);
    assert.match(prompt, /"playing the guitar" and "playing guitar" are both correct/);
    assert.match(prompt, /I want to build the bridges that help people in my country/);
  }
});
