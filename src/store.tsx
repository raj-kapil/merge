import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ALL_SOURCES, Article, Source } from "./domain/types";
import {
  capArticlesPerSource,
  isWithinSixMonths,
  MAX_BLOGS_PER_SOURCE,
  MAX_TOTAL_CACHE_SIZE,
} from "./domain/articleRules";
import { ARTICLES } from "./data/articles";
import { fetchAllSourcesArticles } from "./data/blogService";
import { storageService } from "./services/storageService";

export { MAX_TOTAL_CACHE_SIZE };

export interface StoreContextValue {
  dark: boolean;
  setDark: (val: boolean) => void;
  haptics: boolean;
  setHaptics: (val: boolean) => void;
  saved: Article[];
  save: (article: Article) => void;
  unsave: (ids: string[]) => void;
  favorites: Set<string>;
  toggleFavorite: (id: string) => void;
  enabled: Set<Source>;
  toggleSource: (source: Source) => void;
  feed: Article[];
  cachedArticles: Article[];
  cachedArticlesCount: number;
  removeCachedArticle: (id: string) => void;
  refreshFeed: () => Promise<void>;
  isSyncingFeed: boolean;
  clearCache: () => Promise<void>;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [dark, setDarkState] = useState(true);
  const [haptics, setHapticsState] = useState(true);
  const [saved, setSavedState] = useState<Article[]>([]);
  const [favorites, setFavoritesState] = useState<Set<string>>(new Set());
  const [enabled, setEnabledState] = useState<Set<Source>>(new Set(ALL_SOURCES));
  const [cachedArticles, setCachedArticles] = useState<Article[]>([]);
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const [isSyncingFeed, setIsSyncingFeed] = useState(false);

  // Sync feed articles from enabled remote sources
  const syncFeedArticles = useCallback(
    async (
      excludedIds: Set<string>,
      currentCache: Article[],
      enabledSources: Set<Source>
    ) => {
      try {
        setIsSyncingFeed(true);
        const incoming = await fetchAllSourcesArticles(enabledSources);

        if (incoming.length > 0) {
          const seenIds = new Set<string>();
          const candidates: Article[] = [];

          // Merge incoming live articles first, then existing cache
          for (const item of [...incoming, ...currentCache]) {
            if (
              !seenIds.has(item.id) &&
              !excludedIds.has(item.id) &&
              (item.ageDays === undefined || isWithinSixMonths(item.ageDays))
            ) {
              seenIds.add(item.id);
              candidates.push(item);
            }
          }

          const capped = capArticlesPerSource(candidates, MAX_BLOGS_PER_SOURCE);
          setCachedArticles(capped);
          await storageService.saveCachedArticles(capped);
        }
      } catch (err) {
        console.warn("StoreProvider: Background sync encountered an issue:", err);
      } finally {
        setIsSyncingFeed(false);
      }
    },
    []
  );

  // Load persisted state on mount
  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const state = await storageService.loadInitialState();
        if (!isMounted) return;

        setDarkState(state.settings.dark);
        setHapticsState(state.settings.haptics);
        setSavedState(state.saved);
        setFavoritesState(state.favorites);
        setEnabledState(state.enabledSources);
        setCachedArticles(state.cachedArticles);
        setRemovedIds(state.removedArticleIds);

        // Fetch fresh articles in background
        syncFeedArticles(
          state.removedArticleIds,
          state.cachedArticles,
          state.enabledSources
        );
      } catch (err) {
        console.error("StoreProvider: Failed to initialize application state:", err);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [syncFeedArticles]);

  const refreshFeed = useCallback(async () => {
    await syncFeedArticles(removedIds, cachedArticles, enabled);
  }, [syncFeedArticles, removedIds, cachedArticles, enabled]);

  const setDark = useCallback((val: boolean) => {
    setDarkState(val);
    storageService.saveDark(val);
  }, []);

  const setHaptics = useCallback((val: boolean) => {
    setHapticsState(val);
    storageService.saveHaptics(val);
  }, []);

  const save = useCallback((article: Article) => {
    setSavedState((current) => {
      if (current.some((a) => a.id === article.id)) return current;
      const next = [article, ...current];
      storageService.saveSavedArticles(next);
      return next;
    });
  }, []);

  const unsave = useCallback((ids: string[]) => {
    const idSet = new Set(ids);
    setSavedState((current) => {
      const next = current.filter((a) => !idSet.has(a.id));
      storageService.saveSavedArticles(next);
      return next;
    });

    setFavoritesState((current) => {
      let modified = false;
      const next = new Set(current);
      for (const id of ids) {
        if (next.delete(id)) modified = true;
      }
      if (modified) {
        storageService.saveFavorites(next);
      }
      return modified ? next : current;
    });
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setFavoritesState((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      storageService.saveFavorites(next);
      return next;
    });
  }, []);

  const toggleSource = useCallback((source: Source) => {
    setEnabledState((current) => {
      const next = new Set(current);
      if (next.has(source)) {
        next.delete(source);
      } else {
        next.add(source);
      }
      storageService.saveEnabledSources(next);
      return next;
    });
  }, []);

  const removeCachedArticle = useCallback((id: string) => {
    // 1. Evict from in-memory cache
    setCachedArticles((current) => {
      const next = current.filter((a) => a.id !== id);
      storageService.saveCachedArticles(next);
      return next;
    });

    // 2. Mark in exclusion set so background fetches never bring it back
    setRemovedIds((current) => {
      const next = new Set(current);
      next.add(id);
      storageService.saveRemovedArticleIds(next);
      return next;
    });

    // 3. If currently saved, also remove from saved
    setSavedState((current) => {
      if (current.some((a) => a.id === id)) {
        const next = current.filter((a) => a.id !== id);
        storageService.saveSavedArticles(next);
        return next;
      }
      return current;
    });
  }, []);

  const clearCache = useCallback(async () => {
    try {
      await storageService.clearAllData();
      setSavedState([]);
      setFavoritesState(new Set());
      setCachedArticles([]);
      setRemovedIds(new Set());
    } catch (err) {
      console.error("StoreProvider: Failed to clear cache:", err);
    }
  }, []);

  // Compute composite feed: Live cached stories + fallback seed stories,
  // respecting enabled sources, 6-month rule, exclusions, and max 10/source.
  const feed = useMemo(() => {
    const combined: Article[] = [];
    const seenIds = new Set<string>();

    // 1. Live cached articles
    for (const a of cachedArticles) {
      if (
        !seenIds.has(a.id) &&
        !removedIds.has(a.id) &&
        enabled.has(a.source) &&
        (a.ageDays === undefined || isWithinSixMonths(a.ageDays))
      ) {
        seenIds.add(a.id);
        combined.push(a);
      }
    }

    // 2. Curated fallback baseline articles
    for (const a of ARTICLES) {
      if (
        !seenIds.has(a.id) &&
        !removedIds.has(a.id) &&
        enabled.has(a.source) &&
        (a.ageDays === undefined || isWithinSixMonths(a.ageDays))
      ) {
        seenIds.add(a.id);
        combined.push(a);
      }
    }

    return capArticlesPerSource(combined, MAX_BLOGS_PER_SOURCE);
  }, [cachedArticles, removedIds, enabled]);

  const value: StoreContextValue = {
    dark,
    setDark,
    haptics,
    setHaptics,
    saved,
    save,
    unsave,
    favorites,
    toggleFavorite,
    enabled,
    toggleSource,
    feed,
    cachedArticles,
    cachedArticlesCount: cachedArticles.length,
    removeCachedArticle,
    refreshFeed,
    isSyncingFeed,
    clearCache,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

export const useStore = (): StoreContextValue => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
};