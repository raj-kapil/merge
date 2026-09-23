import test from "node:test";
import assert from "node:assert";
import { parseMarkdownTokens, stripMarkdown } from "../src/utils/markdownParser";

test("parseMarkdownTokens correctly parses bold with double asterisks and double underscores", () => {
  const tokens = parseMarkdownTokens("This is **important** and __critical__.");
  const bolds = tokens.filter((t) => t.type === "bold");
  assert.strictEqual(bolds.length, 2);
  assert.strictEqual(bolds[0].content, "important");
  assert.strictEqual(bolds[1].content, "critical");
});

test("parseMarkdownTokens correctly handles links with bold labels", () => {
  const tokens = parseMarkdownTokens("Visit [**Netflix**](https://netflix.com) today.");
  const link = tokens.find((t) => t.type === "link");
  assert.ok(link);
  assert.strictEqual(link.content, "Netflix");
  assert.strictEqual(link.url, "https://netflix.com");
});

test("parseMarkdownTokens prevents stray delimiter leakage into plain text", () => {
  const tokens = parseMarkdownTokens("** Stray leading asterisks without close should not leak **");
  const rawTextTokens = tokens.filter((t) => t.type === "text");
  for (const t of rawTextTokens) {
    assert.ok(!t.content.includes("**"), `Token leaked **: ${t.content}`);
  }
});

test("stripMarkdown cleanly removes markdown syntax while preserving readable words", () => {
  const raw = "**Summary:** Check [Stripe Docs](https://stripe.com/docs) for `idempotency` keys.";
  const clean = stripMarkdown(raw);
  assert.strictEqual(clean, "Summary: Check Stripe Docs for idempotency keys.");
});
