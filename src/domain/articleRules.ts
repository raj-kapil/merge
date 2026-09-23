import { ALL_SOURCES, Article, Source } from "./types";

export const SIX_MONTHS_DAYS = 183;
export const SIX_MONTHS_MS = SIX_MONTHS_DAYS * 24 * 60 * 60 * 1000;
export const MAX_BLOGS_PER_SOURCE = 10;
export const MAX_TOTAL_CACHE_SIZE = ALL_SOURCES.length * MAX_BLOGS_PER_SOURCE; // 80 max

const HIGH_VALUE_TECH_KEYWORDS = [
  "architecture",
  "scale",
  "scaling",
  "distributed",
  "performance",
  "ai",
  "llm",
  "machine learning",
  "generative",
  "database",
  "storage",
  "real-time",
  "realtime",
  "latency",
  "reliability",
  "infrastructure",
  "zero-downtime",
  "security",
  "monorepo",
  "kubernetes",
  "microservices",
  "crdt",
  "observability",
  "kafka",
  "flink",
  "rust",
  "optimization",
] as const;

/**
 * Checks whether an article is published within the last 6 months (183 days).
 * Accepts either age in days or an epoch millisecond timestamp.
 */
export function isWithinSixMonths(ageDaysOrTimestamp: number): boolean {
  if (ageDaysOrTimestamp <= 0) return true;

  // If passed as epoch timestamp (> year 2000 in ms)
  if (ageDaysOrTimestamp > 946684800000) {
    const elapsed = Date.now() - ageDaysOrTimestamp;
    return elapsed >= 0 && elapsed <= SIX_MONTHS_MS;
  }

  // Otherwise interpreted as age in days
  return ageDaysOrTimestamp <= SIX_MONTHS_DAYS;
}

/**
 * Pure calculation function for article popularity scoring.
 * Weights reading time (depth), high-value architectural keywords, and recency freshness.
 */
export function calculatePopularityScore(
  title: string,
  excerpt: string,
  tags: string[] = [],
  ageDays: number = 1,
  readMins: number = 5
): number {
  let score = 50;

  // 1. Reading time: in-depth technical blogs (8 - 18 mins) typically have higher readership
  if (readMins >= 6 && readMins <= 16) {
    score += readMins * 2;
  } else if (readMins > 16) {
    score += 25;
  } else {
    score += readMins;
  }

  // 2. High-demand tech topics and keywords in title & tags
  const combinedText = `${title} ${excerpt} ${tags.join(" ")}`.toLowerCase();
  for (const kw of HIGH_VALUE_TECH_KEYWORDS) {
    if (combinedText.includes(kw)) {
      score += 8;
    }
  }

  // 3. Recency freshness bonus (more recent stories receive a slight boost)
  const freshness = Math.max(0, SIX_MONTHS_DAYS - Math.max(1, ageDays));
  score += Math.round(freshness / 7);

  return score;
}

/**
 * Deduplicates articles by ID, preserving the first encountered instance.
 */
export function deduplicateArticles(articles: Article[]): Article[] {
  const seen = new Set<string>();
  const result: Article[] = [];

  for (const a of articles) {
    if (a && a.id && !seen.has(a.id)) {
      seen.add(a.id);
      result.push(a);
    }
  }

  return result;
}

/**
 * Caps articles strictly to maxPerSource for each publisher source.
 */
export function capArticlesPerSource(
  articles: Article[],
  maxPerSource: number = MAX_BLOGS_PER_SOURCE
): Article[] {
  const countBySource: Record<string, number> = {};
  const capped: Article[] = [];

  for (const a of articles) {
    const count = countBySource[a.source] || 0;
    if (count < maxPerSource) {
      countBySource[a.source] = count + 1;
      capped.push(a);
    }
  }

  return capped;
}

/**
 * Interleaves articles across sources to create a balanced, diverse reading feed.
 */
export function interleaveSourceArticles(
  articles: Article[],
  sources: readonly string[] = ALL_SOURCES,
  maxPerSource: number = MAX_BLOGS_PER_SOURCE
): Article[] {
  const bySource: Record<string, Article[]> = {};

  for (const a of articles) {
    if (!bySource[a.source]) bySource[a.source] = [];
    if (bySource[a.source].length < maxPerSource) {
      bySource[a.source].push(a);
    }
  }

  const interleaved: Article[] = [];
  for (let i = 0; i < maxPerSource; i++) {
    for (const src of sources) {
      if (bySource[src] && bySource[src][i]) {
        interleaved.push(bySource[src][i]);
      }
    }
  }

  return interleaved;
}

/**
 * Filters articles by a specific tag case-insensitively.
 */
export function filterArticlesByTag(articles: Article[], tag?: string | null): Article[] {
  if (!tag || !tag.trim()) return articles;
  const normalized = tag.trim().toLowerCase();
  return articles.filter(
    (a) => a.tags && a.tags.some((t) => t.trim().toLowerCase() === normalized)
  );
}
