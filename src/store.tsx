import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
} from "react";
import { Article, ALL_SOURCES, ARTICLES } from "./data/articles";

type Toast = {
  id: number;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

type Store = {
  dark: boolean;
  setDark: (v: boolean) => void;
  haptics: boolean;
  setHaptics: (v: boolean) => void;
  saved: Article[];
  save: (a: Article) => void;
  unsave: (ids: string[]) => void;
  favorites: Set<string>;
  toggleFavorite: (id: string) => void;
  enabled: Set<string>;
  toggleSource: (s: string) => void;
  feed: Article[];
  toasts: Toast[];
  show: (m: string, label?: string, onAction?: () => void) => void;
};

const Ctx = createContext<Store | null>(null);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({
                                                                         children,
                                                                       }) => {
  const [dark, setDark] = useState(true);
  const [haptics, setHaptics] = useState(true);
  const [saved, setSaved] = useState<Article[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [enabled, setEnabled] = useState<Set<string>>(new Set(ALL_SOURCES));
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback(
      (message: string, actionLabel?: string, onAction?: () => void) => {
        const id = Date.now() + Math.random();
        setToasts((t) => [...t, { id, message, actionLabel, onAction }]);
        setTimeout(
            () => setToasts((t) => t.filter((x) => x.id !== id)),
            4000
        );
      },
      []
  );

  const save = useCallback((a: Article) => {
    setSaved((s) => (s.find((x) => x.id === a.id) ? s : [a, ...s]));
  }, []);

  const unsave = useCallback((ids: string[]) => {
    setSaved((s) => s.filter((x) => !ids.includes(x.id)));
    // Also drop favorites for anything unsaved
    setFavorites((f) => {
      const n = new Set(f);
      ids.forEach((id) => n.delete(id));
      return n;
    });
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((f) => {
      const n = new Set(f);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }, []);

  const toggleSource = useCallback((src: string) => {
    setEnabled((e) => {
      const n = new Set(e);
      n.has(src) ? n.delete(src) : n.add(src);
      return n;
    });
  }, []);

  const feed = useMemo(
      () => ARTICLES.filter((a) => enabled.has(a.source)),
      [enabled]
  );

  const value: Store = {
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
    toasts,
    show,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useStore = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore outside provider");
  return v;
};