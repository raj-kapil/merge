import AsyncStorage from "@react-native-async-storage/async-storage";
import { ALL_SOURCES, Article, PersistedAppState, Source } from "../domain/types";
import { isWithinSixMonths, MAX_TOTAL_CACHE_SIZE } from "../domain/articleRules";

const STORAGE_PREFIX = "@merge:";
export const STORAGE_KEYS = {
  DARK: `${STORAGE_PREFIX}dark`,
  HAPTICS: `${STORAGE_PREFIX}haptics`,
  SAVED: `${STORAGE_PREFIX}saved`,
  FAVORITES: `${STORAGE_PREFIX}favorites`,
  ENABLED: `${STORAGE_PREFIX}enabled`,
  ARTICLES_CACHE: `${STORAGE_PREFIX}articles_cache_v2`,
  REMOVED_IDS: `${STORAGE_PREFIX}removed_article_ids`,
} as const;

/**
 * Safely parses JSON string with fallback on error or null.
 */
export function safeJsonParse<T>(raw: string | null, fallback: T): T {
  if (raw === null || raw === undefined) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn("StorageService: Failed to parse JSON, falling back to default:", err);
    return fallback;
  }
}

export interface IStorageService {
  loadInitialState(): Promise<PersistedAppState>;
  saveDark(dark: boolean): Promise<void>;
  saveHaptics(haptics: boolean): Promise<void>;
  saveSavedArticles(articles: Article[]): Promise<void>;
  saveFavorites(favorites: Set<string>): Promise<void>;
  saveEnabledSources(sources: Set<string>): Promise<void>;
  saveCachedArticles(articles: Article[]): Promise<void>;
  saveRemovedArticleIds(ids: Set<string>): Promise<void>;
  clearAllData(): Promise<void>;
}

export class AsyncStorageService implements IStorageService {
  async loadInitialState(): Promise<PersistedAppState> {
    try {
      const [dVal, hVal, sVal, fVal, eVal, cVal, rVal] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.DARK),
        AsyncStorage.getItem(STORAGE_KEYS.HAPTICS),
        AsyncStorage.getItem(STORAGE_KEYS.SAVED),
        AsyncStorage.getItem(STORAGE_KEYS.FAVORITES),
        AsyncStorage.getItem(STORAGE_KEYS.ENABLED),
        AsyncStorage.getItem(STORAGE_KEYS.ARTICLES_CACHE),
        AsyncStorage.getItem(STORAGE_KEYS.REMOVED_IDS),
      ]);

      const dark = safeJsonParse<boolean>(dVal, true);
      const haptics = safeJsonParse<boolean>(hVal, true);
      const saved = safeJsonParse<Article[]>(sVal, []);
      const favorites = new Set<string>(safeJsonParse<string[]>(fVal, []));

      const rawEnabled = safeJsonParse<string[]>(eVal, [...ALL_SOURCES]);
      const enabledSources = new Set<Source>(
        rawEnabled.filter((s): s is Source => ALL_SOURCES.includes(s as Source))
      );

      const rawRemoved = safeJsonParse<string[]>(rVal, []);
      const removedArticleIds = new Set<string>(rawRemoved);

      const rawCache = safeJsonParse<Article[]>(cVal, []);
      const cachedArticles = rawCache
        .filter(
          (a) =>
            !removedArticleIds.has(a.id) &&
            (a.ageDays === undefined || isWithinSixMonths(a.ageDays))
        )
        .slice(0, MAX_TOTAL_CACHE_SIZE);

      return {
        settings: { dark, haptics },
        saved,
        favorites,
        enabledSources,
        cachedArticles,
        removedArticleIds,
      };
    } catch (err) {
      console.error("StorageService: Critical error during initial restore:", err);
      return {
        settings: { dark: true, haptics: true },
        saved: [],
        favorites: new Set(),
        enabledSources: new Set(ALL_SOURCES),
        cachedArticles: [],
        removedArticleIds: new Set(),
      };
    }
  }

  async saveDark(dark: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.DARK, JSON.stringify(dark));
    } catch (err) {
      console.warn("StorageService: Failed to save dark mode:", err);
    }
  }

  async saveHaptics(haptics: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.HAPTICS, JSON.stringify(haptics));
    } catch (err) {
      console.warn("StorageService: Failed to save haptics:", err);
    }
  }

  async saveSavedArticles(articles: Article[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SAVED, JSON.stringify(articles));
    } catch (err) {
      console.warn("StorageService: Failed to save articles:", err);
    }
  }

  async saveFavorites(favorites: Set<string>): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.FAVORITES,
        JSON.stringify(Array.from(favorites))
      );
    } catch (err) {
      console.warn("StorageService: Failed to save favorites:", err);
    }
  }

  async saveEnabledSources(sources: Set<string>): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.ENABLED,
        JSON.stringify(Array.from(sources))
      );
    } catch (err) {
      console.warn("StorageService: Failed to save enabled sources:", err);
    }
  }

  async saveCachedArticles(articles: Article[]): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.ARTICLES_CACHE,
        JSON.stringify(articles)
      );
    } catch (err) {
      console.warn("StorageService: Failed to save articles cache:", err);
    }
  }

  async saveRemovedArticleIds(ids: Set<string>): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.REMOVED_IDS,
        JSON.stringify(Array.from(ids))
      );
    } catch (err) {
      console.warn("StorageService: Failed to save removed IDs:", err);
    }
  }

  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.SAVED,
        STORAGE_KEYS.FAVORITES,
        STORAGE_KEYS.ARTICLES_CACHE,
        STORAGE_KEYS.REMOVED_IDS,
        `${STORAGE_PREFIX}uber_cache`, // Legacy purge
      ]);
    } catch (err) {
      console.error("StorageService: Failed to clear storage cache:", err);
      throw err;
    }
  }
}

export const storageService = new AsyncStorageService();
