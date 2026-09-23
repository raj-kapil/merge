import test from "node:test";
import assert from "node:assert";
import {
  isWithinSixMonths,
  calculatePopularityScore,
  deduplicateArticles,
  capArticlesPerSource,
  interleaveSourceArticles,
  filterArticlesByTag,
  SIX_MONTHS_DAYS,
  SIX_MONTHS_MS,
} from "../src/domain/articleRules";
import { Article } from "../src/domain/types";

function createMockArticle(overrides: Partial<Article> = {}): Article {
  return {
    id: "test_1",
    source: "Netflix",
    title: "Distributed Systems at Scale",
    excerpt: "Deep dive into scale and caching.",
    body: "Full body content.",
    ageDays: 10,
    readMins: 8,
    tags: ["Scale", "Architecture"],
    author: "Test Author",
    url: "https://example.com/article",
    ...overrides,
  };
}

test("isWithinSixMonths correctly evaluates age in days", () => {
  assert.strictEqual(isWithinSixMonths(1), true);
  assert.strictEqual(isWithinSixMonths(30), true);
  assert.strictEqual(isWithinSixMonths(SIX_MONTHS_DAYS), true);
  assert.strictEqual(isWithinSixMonths(SIX_MONTHS_DAYS + 1), false);
  assert.strictEqual(isWithinSixMonths(365), false);
});

test("isWithinSixMonths correctly evaluates epoch timestamp in milliseconds", () => {
  const now = Date.now();
  assert.strictEqual(isWithinSixMonths(now - 1000 * 60 * 60 * 24 * 5), true); // 5 days ago
  assert.strictEqual(isWithinSixMonths(now - SIX_MONTHS_MS + 10000), true); // within cutoff
  assert.strictEqual(isWithinSixMonths(now - SIX_MONTHS_MS - 100000), false); // beyond 6 months
});

test("calculatePopularityScore rewards depth, architectural keywords, and recency", () => {
  const baseScore = calculatePopularityScore("Basic Blog", "Simple excerpt", ["General"], 60, 4);
  const deepScore = calculatePopularityScore(
    "Scaling Distributed Storage Architecture with Kafka",
    "Deep architectural dive into zero-downtime microservices and reliability.",
    ["Architecture", "Scale", "Kafka"],
    2,
    12
  );

  assert.ok(deepScore > baseScore, `Expected deepScore (${deepScore}) to be greater than baseScore (${baseScore})`);
  assert.ok(deepScore >= 90, `Expected deepScore to be high quality (>= 90), got ${deepScore}`);
});

test("deduplicateArticles eliminates duplicate IDs while preserving order", () => {
  const articles: Article[] = [
    createMockArticle({ id: "a1", title: "First" }),
    createMockArticle({ id: "a2", title: "Second" }),
    createMockArticle({ id: "a1", title: "Duplicate First" }),
    createMockArticle({ id: "a3", title: "Third" }),
  ];

  const deduplicated = deduplicateArticles(articles);
  assert.strictEqual(deduplicated.length, 3);
  assert.strictEqual(deduplicated[0].id, "a1");
  assert.strictEqual(deduplicated[1].id, "a2");
  assert.strictEqual(deduplicated[2].id, "a3");
  assert.strictEqual(deduplicated[0].title, "First");
});

test("capArticlesPerSource enforces exact quota per source", () => {
  const articles: Article[] = [
    createMockArticle({ id: "n1", source: "Netflix" }),
    createMockArticle({ id: "n2", source: "Netflix" }),
    createMockArticle({ id: "n3", source: "Netflix" }),
    createMockArticle({ id: "s1", source: "Stripe" }),
    createMockArticle({ id: "s2", source: "Stripe" }),
  ];

  const capped = capArticlesPerSource(articles, 2);
  assert.strictEqual(capped.length, 4);
  const netflixCount = capped.filter((a) => a.source === "Netflix").length;
  const stripeCount = capped.filter((a) => a.source === "Stripe").length;
  assert.strictEqual(netflixCount, 2);
  assert.strictEqual(stripeCount, 2);
});

test("interleaveSourceArticles distributes articles evenly across sources", () => {
  const articles: Article[] = [
    createMockArticle({ id: "n1", source: "Netflix" }),
    createMockArticle({ id: "n2", source: "Netflix" }),
    createMockArticle({ id: "s1", source: "Stripe" }),
    createMockArticle({ id: "s2", source: "Stripe" }),
    createMockArticle({ id: "u1", source: "Uber" }),
  ];

  const interleaved = interleaveSourceArticles(articles, ["Netflix", "Stripe", "Uber"], 2);
  assert.strictEqual(interleaved.length, 5);
  // Round 0
  assert.strictEqual(interleaved[0].source, "Netflix");
  assert.strictEqual(interleaved[1].source, "Stripe");
  assert.strictEqual(interleaved[2].source, "Uber");
  // Round 1
  assert.strictEqual(interleaved[3].source, "Netflix");
  assert.strictEqual(interleaved[4].source, "Stripe");
});

test("filterArticlesByTag matches tags case-insensitively and handles empty inputs", () => {
  const articles: Article[] = [
    createMockArticle({ id: "a1", tags: ["AI", "Machine Learning"] }),
    createMockArticle({ id: "a2", tags: ["Architecture", "Scale"] }),
    createMockArticle({ id: "a3", tags: ["ai", "performance"] }),
  ];

  const filteredAi = filterArticlesByTag(articles, "AI");
  assert.strictEqual(filteredAi.length, 2);
  assert.strictEqual(filteredAi[0].id, "a1");
  assert.strictEqual(filteredAi[1].id, "a3");

  const filteredAll = filterArticlesByTag(articles, "");
  assert.strictEqual(filteredAll.length, 3);

  const filteredNone = filterArticlesByTag(articles, "NonExistentTag");
  assert.strictEqual(filteredNone.length, 0);
});
