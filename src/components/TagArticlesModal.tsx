import React from "react";
import {
  Image,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { Article, SOURCE_COLORS, SOURCE_DEFAULT_IMAGES } from "../data/articles";
import { SourceLogo } from "./SourceLogo";
import { theme } from "../theme";

type Props = {
  visible: boolean;
  tag: string | null;
  articles: Article[];
  dark: boolean;
  onClose: () => void;
  onSelectArticle: (article: Article) => void;
  onClearFilter?: () => void;
};

export const TagArticlesModal: React.FC<Props> = ({
  visible,
  tag,
  articles,
  dark,
  onClose,
  onSelectArticle,
  onClearFilter,
}) => {
  const t = theme(dark);

  if (!visible || !tag) return null;

  const normalizedTag = tag.trim().toLowerCase();
  const taggedArticles = articles.filter(
    (a) =>
      a.tags &&
      a.tags.some((tName) => tName.trim().toLowerCase() === normalizedTag)
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[styles.backdrop, { backgroundColor: dark ? "rgba(5, 8, 12, 0.94)" : "rgba(15, 23, 42, 0.75)" }]}>
        <SafeAreaView style={styles.safeArea}>
          {/* Modal Container */}
          <View style={[styles.container, { backgroundColor: t.bg, borderColor: t.border }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: t.border }]}>
              <View style={{ flex: 1 }}>
                <View style={styles.titleRow}>
                  <View style={[styles.tagBadge, { backgroundColor: dark ? "#1E293B" : "#EFF6FF" }]}>
                    <Text style={[styles.tagBadgeText, { color: t.accent }]}>#{tag}</Text>
                  </View>
                  <Text style={[styles.headerSubtitle, { color: t.sub }]}>
                    {taggedArticles.length} {taggedArticles.length === 1 ? "article" : "articles"}
                  </Text>
                </View>
                <Text style={[styles.filterNotice, { color: t.sub }]}>
                  Feed filtered by this tag
                </Text>
              </View>

              <View style={styles.headerRight}>
                {onClearFilter && (
                  <TouchableOpacity
                    onPress={() => {
                      onClearFilter();
                      onClose();
                    }}
                    style={[styles.clearBtn, { borderColor: t.border }]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.clearBtnText, { color: t.sub }]}>Clear</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  onPress={onClose}
                  style={[styles.closeBtn, { backgroundColor: dark ? "#1E293B" : "#F1F5F9" }]}
                  activeOpacity={0.7}
                  accessibilityLabel="Close tag list"
                >
                  <Svg width={20} height={20} viewBox="0 0 24 24">
                    <Path
                      d="M18 6L6 18M6 6L18 18"
                      stroke={t.text}
                      strokeWidth={2.4}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </TouchableOpacity>
              </View>
            </View>

            {/* List of Tagged Articles */}
            <ScrollView
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            >
              {taggedArticles.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={{ fontSize: 32 }}>🔍</Text>
                  <Text style={[styles.emptyTitle, { color: t.text }]}>
                    No articles found for #{tag}
                  </Text>
                  <Text style={[styles.emptySub, { color: t.sub }]}>
                    Try exploring other tags or enable more sources in Settings.
                  </Text>
                </View>
              ) : (
                taggedArticles.map((item) => {
                  const heroImg =
                    item.imageUrl ||
                    SOURCE_DEFAULT_IMAGES[item.source] ||
                    "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=80";

                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.articleCard,
                        { backgroundColor: t.surface, borderColor: t.border },
                      ]}
                      activeOpacity={0.8}
                      onPress={() => {
                        onClose();
                        onSelectArticle(item);
                      }}
                      accessibilityLabel={`Read ${item.title}`}
                    >
                      {/* Thumbnail */}
                      <Image
                        source={{ uri: heroImg }}
                        style={styles.thumbnail}
                        resizeMode="cover"
                      />

                      {/* Content */}
                      <View style={styles.cardContent}>
                        {/* Source Tag & Read Time */}
                        <View style={styles.metaRow}>
                          <SourceLogo source={item.source} size={16} borderRadius={4} />
                          <Text
                            style={[
                              styles.sourceTag,
                              { color: SOURCE_COLORS[item.source] || t.sub },
                            ]}
                          >
                            {item.source.toUpperCase()}
                          </Text>
                          <Text style={[styles.bullet, { color: t.sub }]}>·</Text>
                          <Text style={[styles.metaText, { color: t.sub }]}>
                            {item.readMins} min read
                          </Text>
                        </View>

                        {/* Title */}
                        <Text
                          style={[styles.articleTitle, { color: t.text }]}
                          numberOfLines={2}
                          ellipsizeMode="tail"
                        >
                          {item.title}
                        </Text>

                        {/* Tags preview */}
                        <View style={styles.tagsRow}>
                          {item.tags.slice(0, 3).map((tName) => (
                            <View
                              key={tName}
                              style={[
                                styles.pill,
                                {
                                  backgroundColor:
                                    tName.toLowerCase() === normalizedTag
                                      ? dark
                                        ? "#1E3A8A"
                                        : "#DBEAFE"
                                      : dark
                                      ? "#1E293B"
                                      : "#F1F5F9",
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.pillText,
                                  {
                                    color:
                                      tName.toLowerCase() === normalizedTag
                                        ? t.accent
                                        : t.sub,
                                    fontWeight:
                                      tName.toLowerCase() === normalizedTag
                                        ? "700"
                                        : "500",
                                  },
                                ]}
                              >
                                #{tName}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
  },
  safeArea: {
    flex: 1,
    justifyContent: "flex-end",
  },
  container: {
    flex: 1,
    marginTop: Platform.OS === "web" ? 30 : 50,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  tagBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tagBadgeText: {
    fontSize: 16,
    fontWeight: "800",
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: "600",
  },
  filterNotice: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: "500",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  clearBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  clearBtnText: {
    fontSize: 12,
    fontWeight: "700",
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  articleCard: {
    flexDirection: "row",
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    padding: 12,
    gap: 12,
    alignItems: "center",
  },
  thumbnail: {
    width: 76,
    height: 76,
    borderRadius: 12,
    backgroundColor: "#0F172A",
  },
  cardContent: {
    flex: 1,
    justifyContent: "space-between",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  sourceTag: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  bullet: {
    marginHorizontal: 5,
    fontSize: 11,
  },
  metaText: {
    fontSize: 11,
    fontWeight: "500",
  },
  articleTitle: {
    fontSize: 14.5,
    fontWeight: "700",
    lineHeight: 20,
    marginBottom: 6,
  },
  tagsRow: {
    flexDirection: "row",
    gap: 6,
  },
  pill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  pillText: {
    fontSize: 10.5,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 10,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },
  emptySub: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
  },
});
