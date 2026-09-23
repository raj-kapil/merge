import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { Article } from "../data/articles";
import { filterArticlesByTag } from "../domain/articleRules";
import { useStore } from "../store";
import { theme } from "../theme";
import { SwipeCard } from "../components/SwipeCard";
import { TagArticlesModal } from "../components/TagArticlesModal";

type Props = { onOpen: (a: Article) => void };

export const Discover: React.FC<Props> = ({ onOpen }) => {
  const { feed, dark, save } = useStore();
  const t = theme(dark);
  const [index, setIndex] = useState(0);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [tagModalVisible, setTagModalVisible] = useState(false);

  // Compute feed filtered by active tag if selected
  const displayFeed = useMemo(() => {
    return filterArticlesByTag(feed, activeTag);
  }, [feed, activeTag]);

  useEffect(() => {
    setIndex(0);
  }, [displayFeed]);

  const total = displayFeed.length;
  const isCaughtUp = total === 0 || index >= total;
  const current = isCaughtUp ? null : displayFeed[index];
  const next = index + 1 < total ? displayFeed[index + 1] : null;

  const handlePass = () => {
    if (!current) return;
    setIndex((i) => i + 1);
  };

  const handleSave = () => {
    if (!current) return;
    save(current);
    setIndex((i) => i + 1);
  };

  const handleReset = () => {
    setIndex(0);
  };

  const handleTagPress = (tag: string) => {
    setActiveTag(tag);
    setTagModalVisible(true);
  };

  const handleClearTagFilter = () => {
    setActiveTag(null);
    setTagModalVisible(false);
  };

  return (
    <View style={styles.wrap}>
      {/* SubBar: Live Feed status OR Active Tag Filter pill */}
      <View style={styles.subBar}>
        {activeTag ? (
          <View style={styles.filterBanner}>
            <TouchableOpacity
              onPress={() => setTagModalVisible(true)}
              style={[
                styles.activeTagPill,
                { backgroundColor: dark ? "#1E293B" : "#EFF6FF" },
              ]}
              activeOpacity={0.8}
              accessibilityLabel="View all tagged articles list"
            >
              <Text style={[styles.activeTagPillText, { color: t.accent }]}>
                #{activeTag}
              </Text>
              <Text style={[styles.filterCountBadge, { color: t.sub }]}>
                ({total})
              </Text>
              <Text style={[styles.viewListText, { color: t.accent }]}>
                View List ↗
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleClearTagFilter}
              style={[styles.clearTagBtn, { borderColor: t.border }]}
              activeOpacity={0.7}
              accessibilityLabel="Clear tag filter"
            >
              <Text style={[styles.clearTagBtnText, { color: t.sub }]}>
                Clear ✕
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
              <Svg width={13} height={13} viewBox="0 0 24 24">
                <Path
                  d="M12 2C12 7.5 7.5 12 2 12C7.5 12 12 16.5 12 22C12 16.5 16.5 12 22 12C16.5 12 12 7.5 12 2Z"
                  fill="#10B981"
                />
              </Svg>
              <Text style={[styles.liveText, { color: t.text }]}>LIVE FEED</Text>
            </View>
            <Text style={[styles.counter, { color: t.sub }]}>
              {total === 0
                ? "0 of 0"
                : isCaughtUp
                ? `${total} of ${total}`
                : `${index + 1} of ${total}`}
            </Text>
          </>
        )}
      </View>

      {/* Swipe Card Stack */}
      <View style={styles.stack}>
        {isCaughtUp ? (
          <View style={styles.empty}>
            <Text style={{ fontSize: 40 }}>
              {activeTag ? "🏷️" : "🎉"}
            </Text>
            <Text style={[styles.emptyTitle, { color: t.text }]}>
              {activeTag
                ? `Caught up on #${activeTag}`
                : "You're all caught up"}
            </Text>
            <Text style={[styles.emptyBody, { color: t.sub }]}>
              {activeTag
                ? `You've reviewed all ${total} stories tagged with #${activeTag}. Clear filter to see more.`
                : total === 0
                ? "Enable more sources in Settings to see more articles."
                : "You've reviewed all current stories. Check back later or review again."}
            </Text>
            <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
              {activeTag && (
                <TouchableOpacity
                  onPress={handleClearTagFilter}
                  style={[styles.resetBtn, { backgroundColor: t.accent, borderColor: t.accent }]}
                  activeOpacity={0.8}
                >
                  <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>
                    Clear Filter
                  </Text>
                </TouchableOpacity>
              )}
              {total > 0 && (
                <TouchableOpacity
                  onPress={handleReset}
                  style={[styles.resetBtn, { borderColor: t.border }]}
                  activeOpacity={0.8}
                >
                  <Text
                    style={{ color: t.accent, fontWeight: "700", fontSize: 13 }}
                  >
                    Review Again
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : (
          <>
            {next && (
              <SwipeCard
                key={next.id}
                article={next}
                isTop={false}
                dark={dark}
                onPass={() => {}}
                onSave={() => {}}
                onOpen={() => {}}
                onTagPress={handleTagPress}
              />
            )}
            {current && (
              <SwipeCard
                key={current.id}
                article={current}
                isTop
                dark={dark}
                onPass={handlePass}
                onSave={handleSave}
                onOpen={() => onOpen(current)}
                onTagPress={handleTagPress}
              />
            )}
          </>
        )}
      </View>

      {/* Filtered Tag Articles List Modal */}
      <TagArticlesModal
        visible={tagModalVisible}
        tag={activeTag}
        articles={feed}
        dark={dark}
        onClose={() => setTagModalVisible(false)}
        onSelectArticle={(article) => onOpen(article)}
        onClearFilter={handleClearTagFilter}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { flex: 1, paddingHorizontal: 18, paddingBottom: 16 },
  subBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 4,
    minHeight: 44,
  },
  liveText: { fontSize: 12, fontWeight: "800", letterSpacing: 1.6 },
  counter: { fontSize: 12, fontWeight: "700" },
  filterBanner: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  activeTagPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  activeTagPillText: {
    fontSize: 13,
    fontWeight: "800",
  },
  filterCountBadge: {
    fontSize: 12,
    fontWeight: "600",
  },
  viewListText: {
    fontSize: 11,
    fontWeight: "700",
    marginLeft: 4,
  },
  clearTagBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  clearTagBtnText: {
    fontSize: 12,
    fontWeight: "700",
  },
  stack: { flex: 1, position: "relative" },
  empty: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 24,
  },
  emptyTitle: { fontSize: 16, fontWeight: "700" },
  emptyBody: { fontSize: 13, textAlign: "center", lineHeight: 19 },
  resetBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
  },
});
