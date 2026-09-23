import React, { useMemo, useRef, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import Svg, { Path } from "react-native-svg";
import { ALL_SOURCES, Article } from "../data/articles";
import { SourceLogo } from "../components/SourceLogo";
import { useStore } from "../store";
import { theme } from "../theme";

const SWIPE_THRESHOLD = 100;
const SCREEN_SWIPE = 500;
const FAVORITE_GOLD = "#F5B301";

type Props = { onOpen: (a: Article) => void };

/* ------------------------------------------------------------------ */
/* SwipeableRow                                                        */
/* ------------------------------------------------------------------ */

type RowProps = {
  article: Article;
  dark: boolean;
  selectMode: boolean;
  isSelected: boolean;
  isFavorite: boolean;
  onPress: () => void;
  onLongPress: () => void;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
};

const SwipeableRow: React.FC<RowProps> = ({
  article,
  dark,
  selectMode,
  isSelected,
  isFavorite,
  onPress,
  onLongPress,
  onSwipeLeft,
  onSwipeRight,
}) => {
  const t = theme(dark);
  const x = useSharedValue(0);
  const moved = useSharedValue(false);

  const pan = Gesture.Pan()
    .enabled(!selectMode)
    .activeOffsetX([-15, 15])
    .failOffsetY([-20, 20])
    .onBegin(() => {
      moved.value = false;
    })
    .onUpdate((e) => {
      x.value = e.translationX;
      if (Math.abs(e.translationX) > 10) moved.value = true;
    })
    .onEnd(() => {
      if (x.value > SWIPE_THRESHOLD) {
        x.value = withSpring(0);
        runOnJS(onSwipeRight)();
      } else if (x.value < -SWIPE_THRESHOLD) {
        if (isFavorite) {
          x.value = withSpring(0);
        } else {
          x.value = withSpring(-SCREEN_SWIPE);
        }
        runOnJS(onSwipeLeft)();
      } else if (!moved.value || Math.abs(x.value) < 12) {
        x.value = withSpring(0);
        runOnJS(onPress)();
      } else {
        x.value = withSpring(0);
      }
    });

  const longPress = Gesture.LongPress()
    .minDuration(500)
    .maxDistance(12)
    .onStart(() => {
      runOnJS(onLongPress)();
    });

  const tap = Gesture.Tap()
    .maxDuration(500)
    .maxDistance(15)
    .onEnd(() => {
      runOnJS(onPress)();
    });

  const composed = Gesture.Race(longPress, pan, tap);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }],
  }));

  const favHintStyle = useAnimatedStyle(() => ({
    opacity: interpolate(x.value, [0, 80], [0, 1], Extrapolation.CLAMP),
  }));
  const unsaveHintStyle = useAnimatedStyle(() => ({
    opacity: interpolate(x.value, [-80, 0], [1, 0], Extrapolation.CLAMP),
  }));

  return (
    <View style={styles.rowWrap}>
      {/* Left hint — swipe right */}
      <Animated.View style={[styles.hint, styles.hintLeft, favHintStyle]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Svg width={14} height={14} viewBox="0 0 24 24">
            <Path
              d="M12 2C12 7.5 7.5 12 2 12C7.5 12 12 16.5 12 22C12 16.5 16.5 12 22 12C16.5 12 12 7.5 12 2Z"
              fill="#0B0F12"
            />
          </Svg>
          <Text style={styles.hintTextFav}>
            {isFavorite ? "UNFAVORITE" : "FAVORITE"}
          </Text>
        </View>
      </Animated.View>

      {/* Right hint — swipe left: UNFAVORITE if favorite, UNSAVE if not */}
      <Animated.View
        style={[
          styles.hint,
          styles.hintRight,
          isFavorite ? styles.hintUnfav : styles.hintUnsave,
          unsaveHintStyle,
        ]}
      >
        <Text style={[styles.hintTextUnsave, isFavorite && { color: "#0B0F12" }]}>
          {isFavorite ? "UNFAVORITE" : "UNSAVE"}
        </Text>
      </Animated.View>

      <GestureDetector gesture={composed}>
        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: t.surface,
              borderColor: isSelected ? t.accent : isFavorite ? "rgba(245, 179, 1, 0.45)" : t.border,
              borderWidth: isSelected ? 1.5 : isFavorite ? 1.5 : 1,
            },
            cardStyle,
          ]}
        >
          {/* Checkbox (multi-select) */}
          {selectMode && (
            <View
              style={[
                styles.checkbox,
                {
                  borderColor: isSelected
                    ? t.accent
                    : dark
                      ? "#4B5563"
                      : "#CBD5E1",
                  backgroundColor: isSelected ? t.accent : "transparent",
                },
              ]}
            >
              {isSelected && (
                <Svg width={12} height={12} viewBox="0 0 24 24">
                  <Path
                    d="M5 13l4 4L19 7"
                    stroke="#fff"
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </Svg>
              )}
            </View>
          )}

          {/* Logo on the left */}
          <SourceLogo source={article.source} size={36} borderRadius={10} />

          {/* Body */}
          <View style={{ flex: 1, minWidth: 0 }}>
            {/* Two-line heading with minimum height preventing truncation */}
            <Text
              style={[styles.cardTitle, { color: t.text }]}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {article.title}
            </Text>

            <View style={styles.metaRow}>
              <Text style={[styles.meta, { color: t.sub }]}>
                {article.ageDays === 1
                  ? "1 day ago"
                  : `${article.ageDays} days ago`}
              </Text>
              <Text style={[styles.meta, { color: t.sub }]}>·</Text>
              <Text style={[styles.meta, { color: t.sub }]}>
                {article.readMins} min read
              </Text>
            </View>
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

/* ------------------------------------------------------------------ */
/* Saved screen                                                        */
/* ------------------------------------------------------------------ */

export const Saved: React.FC<Props> = ({ onOpen }) => {
  const {
    saved,
    unsave,
    save,
    favorites,
    toggleFavorite,
    removeCachedArticle,
    dark,
    haptics,
  } = useStore();
  const t = theme(dark);

  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const undoRef = useRef<Article[]>([]);

  // Source counts for filter chips
  const sourceCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const a of saved) {
      map[a.source] = (map[a.source] || 0) + 1;
    }
    return map;
  }, [saved]);

  // Order sources: sources with saved articles first, then remaining
  const availableSources = useMemo(() => {
    const withSaved = ALL_SOURCES.filter((s) => (sourceCounts[s] || 0) > 0);
    const withoutSaved = ALL_SOURCES.filter((s) => !(sourceCounts[s] || 0));
    return [...withSaved, ...withoutSaved];
  }, [sourceCounts]);

  // Filter saved list by selected source chip
  const filteredSaved = useMemo(() => {
    if (!selectedSource) return saved;
    return saved.filter(
      (a) => a.source.toLowerCase() === selectedSource.toLowerCase()
    );
  }, [saved, selectedSource]);

  // Split into two ordered lists: favorites first, then the rest
  const favoritesList = filteredSaved.filter((a) => favorites.has(a.id));
  const restList = filteredSaved.filter((a) => !favorites.has(a.id));

  const exitSelect = () => {
    setSelectMode(false);
    setSelected(new Set());
  };

  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const handlePress = (a: Article) => {
    if (selectMode) toggle(a.id);
    else onOpen(a);
  };

  const handleLongPress = (a: Article) => {
    if (haptics) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectMode(true);
    setSelected(new Set([a.id]));
  };

  const handleSwipeLeft = (a: Article) => {
    if (haptics) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (favorites.has(a.id)) {
      toggleFavorite(a.id);
    } else {
      unsave([a.id]);
      removeCachedArticle(a.id);
    }
  };

  const handleSwipeRight = (a: Article) => {
    if (haptics) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleFavorite(a.id);
  };

  const confirmDelete = () => {
    const ids = Array.from(selected);
    undoRef.current = saved.filter((a) => ids.includes(a.id));
    unsave(ids);
    ids.forEach((id) => removeCachedArticle(id));
    setConfirmOpen(false);
    exitSelect();
  };

  const renderRow = (a: Article) => (
    <SwipeableRow
      key={a.id}
      article={a}
      dark={dark}
      selectMode={selectMode}
      isSelected={selected.has(a.id)}
      isFavorite={favorites.has(a.id)}
      onPress={() => handlePress(a)}
      onLongPress={() => handleLongPress(a)}
      onSwipeLeft={() => handleSwipeLeft(a)}
      onSwipeRight={() => handleSwipeRight(a)}
    />
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={[styles.title, { color: t.text }]}>Saved</Text>
        </View>

        {/* Source Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {/* 'All' Chip */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              if (haptics) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedSource(null);
            }}
            style={[
              styles.chip,
              selectedSource === null
                ? [styles.chipActive, { backgroundColor: t.accent, borderColor: t.accent }]
                : [styles.chipInactive, { backgroundColor: t.surface, borderColor: t.border }],
            ]}
          >
            <Text
              style={[
                styles.chipText,
                { color: selectedSource === null ? "#FFFFFF" : t.text },
              ]}
            >
              All
            </Text>
            {saved.length > 0 && (
              <View
                style={[
                  styles.chipCountPill,
                  {
                    backgroundColor:
                      selectedSource === null
                        ? "rgba(255,255,255,0.28)"
                        : dark
                          ? "#334155"
                          : "#E2E8F0",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipCountText,
                    { color: selectedSource === null ? "#FFFFFF" : t.sub },
                  ]}
                >
                  {saved.length}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Individual Source Chips */}
          {availableSources.map((s) => {
            const isChipActive = selectedSource === s;
            const count = sourceCounts[s] || 0;
            return (
              <TouchableOpacity
                key={s}
                activeOpacity={0.8}
                onPress={() => {
                  if (haptics) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedSource((prev) => (prev === s ? null : s));
                }}
                style={[
                  styles.chip,
                  isChipActive
                    ? [styles.chipActive, { backgroundColor: t.accent, borderColor: t.accent }]
                    : [styles.chipInactive, { backgroundColor: t.surface, borderColor: t.border }],
                ]}
              >
                <SourceLogo source={s} size={18} borderRadius={5} />
                <Text
                  style={[
                    styles.chipText,
                    { color: isChipActive ? "#FFFFFF" : t.text },
                  ]}
                >
                  {s}
                </Text>
                {count > 0 && (
                  <View
                    style={[
                      styles.chipCountPill,
                      {
                        backgroundColor: isChipActive
                          ? "rgba(255,255,255,0.28)"
                          : dark
                            ? "#334155"
                            : "#E2E8F0",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipCountText,
                        { color: isChipActive ? "#FFFFFF" : t.sub },
                      ]}
                    >
                      {count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        {saved.length === 0 ? (
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: t.sub }]}>
              No saved articles yet.{"\n"}Swipe right on Discover to save.
            </Text>
          </View>
        ) : filteredSaved.length === 0 ? (
          <View style={styles.empty}>
            {selectedSource && (
              <SourceLogo source={selectedSource} size={48} borderRadius={14} />
            )}
            <Text style={[styles.emptyTitle, { color: t.text }]}>
              No saved articles from {selectedSource}
            </Text>
            <Text style={[styles.emptyText, { color: t.sub }]}>
              Swipe right on {selectedSource} articles in Discover to save them here.
            </Text>
            <TouchableOpacity
              onPress={() => setSelectedSource(null)}
              style={[styles.resetFilterBtn, { borderColor: t.border }]}
              activeOpacity={0.7}
            >
              <Text style={[styles.resetFilterText, { color: t.accent }]}>
                Show all saved articles
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {favoritesList.length > 0 && (
          <View style={styles.sectionHeaderRow}>
            <Svg width={11} height={11} viewBox="0 0 24 24">
              <Path
                d="M12 2C12 7.5 7.5 12 2 12C7.5 12 12 16.5 12 22C12 16.5 16.5 12 22 12C16.5 12 12 7.5 12 2Z"
                fill={FAVORITE_GOLD}
              />
            </Svg>
            <Text
              style={[
                styles.sectionLabel,
                { color: FAVORITE_GOLD, marginTop: 0, marginBottom: 0 },
              ]}
            >
              FAVORITES ({favoritesList.length})
            </Text>
          </View>
        )}
        {favoritesList.map(renderRow)}

        {favoritesList.length > 0 && restList.length > 0 && (
          <Text style={[styles.sectionLabel, { color: t.sub }]}>
            ALL SAVED ({restList.length})
          </Text>
        )}
        {restList.map(renderRow)}
      </ScrollView>

      {selectMode && (
        <View style={styles.selBar}>
          <Text style={styles.selCount}>{selected.size} selected</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Pressable onPress={exitSelect} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={() => setConfirmOpen(true)}
              disabled={selected.size === 0}
              style={[
                styles.deleteBtn,
                { backgroundColor: selected.size === 0 ? "#4B5563" : "#EF4444" },
              ]}
            >
              <Text style={styles.deleteText}>Delete</Text>
            </Pressable>
          </View>
        </View>
      )}

      <Modal
        visible={confirmOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmOpen(false)}
      >
        <Pressable
          style={styles.backdrop}
          onPress={() => setConfirmOpen(false)}
        >
          <Pressable
            style={[
              styles.modal,
              { backgroundColor: dark ? "#1E262C" : "#fff" },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={[styles.modalTitle, { color: t.text }]}>
              Are you sure?
            </Text>
            <Text style={[styles.modalBody, { color: t.sub }]}>
              This will remove {selected.size} article
              {selected.size > 1 ? "s" : ""} from your saved shelf.
            </Text>
            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setConfirmOpen(false)}
                style={[
                  styles.modalBtn,
                  { borderColor: t.border, borderWidth: 1 },
                ]}
              >
                <Text
                  style={{ color: t.text, fontWeight: "700", fontSize: 14 }}
                >
                  No
                </Text>
              </Pressable>
              <Pressable
                onPress={confirmDelete}
                style={[styles.modalBtn, { backgroundColor: "#EF4444" }]}
              >
                <Text
                  style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}
                >
                  Yes, Delete
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

/* ------------------------------------------------------------------ */
/* Styles                                                              */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 10 },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  title: { fontSize: 28, fontWeight: "800", letterSpacing: -0.5 },
  totalBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  totalBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  chipsRow: {
    gap: 8,
    paddingRight: 10,
    paddingBottom: 4,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipActive: {
    elevation: 2,
  },
  chipInactive: {},
  chipText: {
    fontSize: 13,
    fontWeight: "700",
  },
  chipCountPill: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 10,
    minWidth: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  chipCountText: {
    fontSize: 11,
    fontWeight: "800",
  },
  list: { paddingHorizontal: 16, paddingBottom: 120, gap: 10 },
  empty: { alignItems: "center", marginTop: 40, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 17, fontWeight: "800", marginTop: 14, marginBottom: 4 },
  emptyText: { fontSize: 14, textAlign: "center", lineHeight: 22 },
  resetFilterBtn: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  resetFilterText: {
    fontSize: 13,
    fontWeight: "700",
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.6,
    marginTop: 10,
    marginBottom: 2,
    paddingHorizontal: 4,
  },

  rowWrap: { position: "relative", borderRadius: 16, overflow: "hidden" },

  hint: {
    position: "absolute",
    top: 0,
    bottom: 0,
    justifyContent: "center",
    paddingHorizontal: 22,
    borderRadius: 16,
  },
  hintLeft: { left: 0, backgroundColor: FAVORITE_GOLD },
  hintRight: { right: 0 },
  hintUnfav: { backgroundColor: FAVORITE_GOLD },
  hintUnsave: { backgroundColor: "#EF4444" },
  hintTextFav: {
    color: "#0B0F12",
    fontWeight: "900",
    letterSpacing: 2,
    fontSize: 14,
  },
  hintTextUnsave: {
    color: "#fff",
    fontWeight: "900",
    letterSpacing: 2,
    fontSize: 14,
  },

  card: {
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    marginBottom: 2,
    paddingHorizontal: 4,
  },

  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
    minHeight: 38,
  },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 5 },
  meta: { fontSize: 12 },

  selBar: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    backgroundColor: "#0B0F12",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    elevation: 8,
  },
  selCount: { color: "#fff", fontWeight: "700", fontSize: 14 },
  cancelBtn: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  cancelText: { color: "#CBD5E1", fontWeight: "700", fontSize: 13 },
  deleteBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  deleteText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modal: { borderRadius: 20, padding: 22, width: "100%", maxWidth: 340 },
  modalTitle: { fontSize: 18, fontWeight: "800" },
  modalBody: { fontSize: 14, lineHeight: 21, marginTop: 8 },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
    justifyContent: "flex-end",
  },
  modalBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 },
});