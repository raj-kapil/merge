import React, { useMemo, useState } from "react";
import {
  Image,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import Svg, { Path } from "react-native-svg";
import { Article } from "../domain/types";
import { SOURCE_COLORS, SOURCE_DEFAULT_IMAGES } from "../data/articles";
import { useStore } from "../store";
import { theme } from "../theme";
import { SourceLogo } from "../components/SourceLogo";
import { ImageWithFallback } from "../components/ImageWithFallback";
import { ArticleBody } from "../components/ArticleBody";
import { ImageViewerModal } from "../components/ImageViewerModal";
import { TagArticlesModal } from "../components/TagArticlesModal";

interface Props {
  article: Article;
  onBack: () => void;
  onSelectArticle?: (a: Article) => void;
}

export const Reader: React.FC<Props> = ({ article, onBack, onSelectArticle }) => {
  const { dark, saved, save, unsave, removeCachedArticle, feed } = useStore();
  const t = theme(dark);
  const [activeImage, setActiveImage] = useState<{
    url: string;
    caption?: string;
  } | null>(null);
  const [tagModalTag, setTagModalTag] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [confirmHideVisible, setConfirmHideVisible] = useState(false);
  const isSaved = !!saved.find((a) => a.id === article.id);

  const heroImage =
    article.imageUrl ||
    SOURCE_DEFAULT_IMAGES[article.source] ||
    "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=80";

  const domain = useMemo(() => {
    try {
      return new URL(article.url).hostname.replace(/^www\./, "");
    } catch {
      return article.source.toLowerCase() + ".com";
    }
  }, [article.url, article.source]);

  const handleToggleSave = () => {
    if (isSaved) {
      unsave([article.id]);
    } else {
      save(article);
    }
  };

  const handleRemoveArticle = () => {
    removeCachedArticle(article.id);
    onBack();
  };

  const handleCopy = async () => {
    try {
      await Clipboard.setStringAsync(article.url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleOpenExternal = () => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.open(article.url, "_blank", "noopener,noreferrer");
    } else {
      Linking.openURL(article.url).catch(() => {
        handleCopy();
      });
    }
  };

  return (
    <View style={[styles.wrap, { backgroundColor: t.bg }]}>
      {/* Top Header Navigation Bar */}
      <View style={[styles.topBar, { borderBottomColor: t.border }]}>
        <TouchableOpacity
          onPress={onBack}
          hitSlop={12}
          style={styles.iconBtn}
          accessibilityLabel="Back to feed"
        >
          <Svg width={22} height={22} viewBox="0 0 24 24">
            <Path
              d="M15 18l-6-6 6-6"
              stroke={t.text}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </Svg>
        </TouchableOpacity>

        {/* Center: Source Logo and Name */}
        <View style={styles.headerCenterSpace}>
          <SourceLogo source={article.source} size={24} borderRadius={6} />
          <Text style={[styles.headerStoryLabel, { color: t.sub }]}>{article.source.toUpperCase()}</Text>
        </View>

        {/* Action icons: Save & Overflow Menu */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <TouchableOpacity
            onPress={handleToggleSave}
            hitSlop={10}
            style={styles.iconBtn}
            accessibilityLabel={isSaved ? "Unsave story" : "Save story"}
          >
            <Svg width={20} height={20} viewBox="0 0 24 24">
              <Path
                d="M5 3.5C5 2.67 5.67 2 6.5 2H17.5C18.33 2 19 2.67 19 3.5V21.5L12 17.5L5 21.5V3.5Z"
                stroke={isSaved ? "#10B981" : t.text}
                fill={isSaved ? "#10B981" : "none"}
                strokeWidth={2}
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setMenuVisible(true)}
            hitSlop={10}
            style={styles.iconBtn}
            accessibilityLabel="More options"
          >
            <Svg width={20} height={20} viewBox="0 0 24 24">
              <Path
                d="M12 13a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm7 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM5 13a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"
                fill={t.text}
              />
            </Svg>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Article Content */}
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* POPULAR chip */}
        {article.popularityScore ? (
          <View style={styles.sourceMetaRow}>
            <View
              style={[
                styles.popularPill,
                { backgroundColor: dark ? "#064E3B" : "#D1FAE5" },
              ]}
            >
              <Text style={styles.popularText}>POPULAR</Text>
            </View>
          </View>
        ) : null}

        {/* Primary Article Headline */}
        <Text style={[styles.articleTitle, { color: t.text }]}>
          {article.title}
        </Text>

        {/* Time & Read Duration */}
        <Text style={[styles.metaText, { color: t.sub, marginBottom: 14 }]}>
          {article.ageDays === 1 ? "1 day ago" : `${article.ageDays} days ago`} · {article.readMins} min read
        </Text>

        {/* Author Byline */}
        <View style={styles.authorRow}>
          <View
            style={[
              styles.authorAvatar,
              { backgroundColor: SOURCE_COLORS[article.source] || "#333" },
            ]}
          >
            <Text style={styles.authorAvatarText}>{article.author[0]}</Text>
          </View>
          <View>
            <Text style={[styles.authorName, { color: t.text }]}>
              {article.author}
            </Text>
            <Text style={[styles.authorSub, { color: t.sub }]}>
              {article.source} Engineering
            </Text>
          </View>
        </View>

        {/* Article Hero Banner */}
        {heroImage ? (
          <TouchableOpacity
            activeOpacity={0.92}
            onPress={() =>
              setActiveImage({
                url: heroImage,
                caption: `${article.title} · ${article.source}`,
              })
            }
            style={styles.heroBannerWrap}
            accessibilityLabel="Click hero banner to open high-resolution view"
          >
            <ImageWithFallback
              uri={heroImage}
              sourceName={article.source}
              aspectRatio={16 / 9}
              fallbackTitle={`${article.source} Engineering`}
              dark={dark}
              style={styles.heroBanner}
            />
          </TouchableOpacity>
        ) : null}

        {/* Formatted Full Article Body Component */}
        <ArticleBody
          body={article.body}
          articleTitle={article.title}
          textColor={t.text}
          subColor={t.sub}
          accentColor={t.accent}
          borderColor={t.border}
          isDark={dark}
          onImagePress={setActiveImage}
        />

        {/* Clickable Article Tags with Elevated Tap Targets */}
        {article.tags && article.tags.length > 0 && (
          <View style={styles.tagWrap}>
            {article.tags.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[
                  styles.tagPill,
                  { backgroundColor: dark ? "#1E293B" : "#F1F5F9" },
                ]}
                onPress={() => setTagModalTag(tag)}
                activeOpacity={0.7}
                accessibilityLabel={`Filter by tag ${tag}`}
              >
                <Text style={[styles.tagText, { color: t.accent }]}>#{tag}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Open in browser */}
        <TouchableOpacity
          style={[styles.readOnBtn, { backgroundColor: t.accent }]}
          onPress={handleOpenExternal}
          activeOpacity={0.85}
          accessibilityLabel={`Read on ${article.source}`}
        >
          <Text style={styles.readOnBtnText}>
            Read on {article.source}
          </Text>
        </TouchableOpacity>

      </ScrollView>      {/* Top-right dropdown menu */}
      {menuVisible && (
        <>
          <TouchableOpacity
            style={styles.menuOverlay}
            activeOpacity={1}
            onPress={() => setMenuVisible(false)}
          />
          <View
            style={[
              styles.dropdownMenu,
              { backgroundColor: t.surface, borderColor: t.border },
            ]}
          >
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                handleCopy();
              }}
            >
              <Svg width={18} height={18} viewBox="0 0 24 24" style={{ marginRight: 12 }}>
                <Path
                  d="M10 13a5 5 0 007 0l3-3a5 5 0 00-7-7l-1 1M14 11a5 5 0 00-7 0l-3 3a5 5 0 007 7l1-1"
                  stroke={copiedLink ? "#10B981" : t.text}
                  strokeWidth={2}
                  strokeLinecap="round"
                  fill="none"
                />
              </Svg>
              <Text style={[styles.menuItemText, { color: t.text }]}>
                {copiedLink ? "Link Copied!" : "Copy Story Link"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                handleOpenExternal();
              }}
            >
              <Svg width={18} height={18} viewBox="0 0 24 24" style={{ marginRight: 12 }}>
                <Path
                  d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"
                  stroke={t.text}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </Svg>
              <Text style={[styles.menuItemText, { color: t.text }]}>
                Open in Browser
              </Text>
            </TouchableOpacity>

            <View style={[styles.menuDivider, { backgroundColor: t.border }]} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                setConfirmHideVisible(true);
              }}
            >
              <Svg width={18} height={18} viewBox="0 0 24 24" style={{ marginRight: 12 }}>
                <Path
                  d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"
                  stroke="#EF4444"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </Svg>
              <Text style={[styles.menuItemText, { color: "#EF4444", fontWeight: "600" }]}>
                Hide Story from Feed
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Confirmation Modal for Destructive Action */}
      <Modal
        visible={confirmHideVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmHideVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.confirmDialog,
              { backgroundColor: t.surface, borderColor: t.border },
            ]}
          >
            <Text style={[styles.confirmTitle, { color: t.text }]}>
              Hide Story?
            </Text>
            <Text style={[styles.confirmMessage, { color: t.sub }]}>
              This will remove this article from your live feed cache. You can still re-fetch it later.
            </Text>

            <View style={styles.confirmBtnRow}>
              <TouchableOpacity
                style={[styles.confirmCancelBtn, { borderColor: t.border }]}
                onPress={() => setConfirmHideVisible(false)}
              >
                <Text style={[styles.confirmCancelText, { color: t.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmDeleteBtn}
                onPress={() => {
                  setConfirmHideVisible(false);
                  handleRemoveArticle();
                }}
              >
                <Text style={styles.confirmDeleteText}>
                  Hide Story
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Image Lightbox Viewer Modal */}
      <ImageViewerModal
        visible={!!activeImage}
        imageUrl={activeImage?.url || ""}
        title={article.title}
        caption={activeImage?.caption}
        source={article.source}
        onClose={() => setActiveImage(null)}
      />

      {/* Filtered Tag Articles List Modal */}
      <TagArticlesModal
        visible={!!tagModalTag}
        tag={tagModalTag}
        articles={feed}
        dark={dark}
        onClose={() => setTagModalTag(null)}
        onSelectArticle={(item) => {
          setTagModalTag(null);
          onSelectArticle?.(item);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  iconBtn: { padding: 8 },
  headerCenterSpace: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerStoryLabel: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 50,
  },
  sourceMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
    flexWrap: "wrap",
  },
  sourceTag: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.1,
  },
  metaDot: {
    fontSize: 12,
    opacity: 0.6,
  },
  metaText: {
    fontSize: 12,
    fontWeight: "500",
  },
  popularPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 4,
  },
  popularText: {
    color: "#10B981",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  articleTitle: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.5,
    lineHeight: 34,
    marginBottom: 14,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 18,
  },
  authorAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  authorAvatarText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 14,
  },
  authorName: {
    fontSize: 13.5,
    fontWeight: "700",
  },
  authorSub: {
    fontSize: 11.5,
    marginTop: 1,
  },
  heroBannerWrap: {
    width: "100%",
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 20,
    maxHeight: 260,
  },
  heroBanner: {
    width: "100%",
  },
  tagWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 20,
    marginBottom: 8,
  },
  tagPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    minHeight: 34,
    justifyContent: "center",
  },
  tagText: {
    fontSize: 12,
    fontWeight: "600",
  },
  readOnBtn: {
    marginTop: 28,
    marginBottom: 24,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  readOnBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.2,
    textAlign: "center",
  },
  readOnBtnSub: {
    color: "rgba(255, 255, 255, 0.85)",
    fontSize: 12.5,
    fontWeight: "600",
    marginTop: 4,
    letterSpacing: 0.1,
  },
  menuOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    zIndex: 99,
  },
  dropdownMenu: {
    position: "absolute",
    top: 52,
    right: 12,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 220,
    zIndex: 100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  menuDragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
    opacity: 0.6,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    minHeight: 48,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: "600",
  },
  menuDivider: {
    height: 1,
    marginVertical: 8,
    opacity: 0.5,
  },
  confirmDialog: {
    marginHorizontal: 24,
    marginBottom: "auto",
    marginTop: "auto",
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 8,
  },
  confirmMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  confirmBtnRow: {
    flexDirection: "row",
    gap: 12,
  },
  confirmCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmCancelText: {
    fontSize: 14,
    fontWeight: "700",
  },
  confirmDeleteBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
  },
  confirmDeleteText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
