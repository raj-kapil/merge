import test from "node:test";
import assert from "node:assert";
import { safeJsonParse } from "../src/services/storageService";

test("safeJsonParse parses valid JSON strings", () => {
  const result = safeJsonParse('{"dark": true, "count": 42}', { dark: false, count: 0 });
  assert.deepStrictEqual(result, { dark: true, count: 42 });
});

test("safeJsonParse returns fallback when input is null or undefined", () => {
  const fallback = ["default_source"];
  const res1 = safeJsonParse(null, fallback);
  const res2 = safeJsonParse(undefined as any, fallback);
  assert.strictEqual(res1, fallback);
  assert.strictEqual(res2, fallback);
});

test("safeJsonParse catches corrupted JSON strings and returns fallback without throwing", () => {
  const corrupted = '{"dark": true, "corrupted...';
  const fallback = { dark: false, count: 0 };
  const result = safeJsonParse(corrupted, fallback);
  assert.deepStrictEqual(result, fallback);
});
