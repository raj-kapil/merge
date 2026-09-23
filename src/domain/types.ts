/**
 * Domain types for Merge application.
 * Defines the core entities, value objects, and persistence contracts.
 */

export const ALL_SOURCES = [
  "Netflix",
  "Stripe",
  "Uber",
  "Cloudflare",
  "Airbnb",
  "GitHub",
  "Datadog",
  "Figma",
] as const;

export type Source = (typeof ALL_SOURCES)[number];

export interface Article {
  id: string;
  source: Source;
  title: string;
  excerpt: string;
  body: string;
  ageDays: number;
  readMins: number;
  tags: string[];
  author: string;
  url: string;
  publishedAt?: string;
  popularityScore?: number;
  imageUrl?: string;
}

export interface SourceMetadata {
  name: Source;
  brandColor: string;
  defaultImageUrl: string;
  feedUrl?: string;
}

export interface UserSettings {
  dark: boolean;
  haptics: boolean;
}

export interface PersistedAppState {
  settings: UserSettings;
  saved: Article[];
  favorites: Set<string>;
  enabledSources: Set<Source>;
  cachedArticles: Article[];
  removedArticleIds: Set<string>;
}
