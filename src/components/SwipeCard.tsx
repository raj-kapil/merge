import React from "react";
import {
  Dimensions,
  Image,
  Linking,
  Platform,
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
import { Article, SOURCE_COLORS, SOURCE_DEFAULT_IMAGES } from "../data/articles";
import { SourceLogo } from "./SourceLogo";
import { ImageWithFallback } from "./ImageWithFallback";
import { theme } from "../theme";

const { width: SCREEN_W } = Dimensions.get("window");
const THRESHOLD = 110;
const MAX_ROT = 14;

type Props = {
  article: Article;
  isTop: boolean;
  dark: boolean;
  onPass: () => void;
  onSave: () => void;
  onOpen: () => void;
  onTagPress?: (tag: string) => void;
};

export const SwipeCard: React.FC<Props> = ({
  article,
  isTop,
  dark,
  onPass,
  onSave,
  onOpen,
  onTagPress,
}) => {
  const t = theme(dark);
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const isMoved = useSharedValue(false);

  const pan = Gesture.Pan()
    .enabled(isTop)
    .activeOffsetX([-15, 15])
    .onBegin(() => {
      isMoved.value = false;
    })
    .onUpdate((e) => {
      x.value = e.translationX;
      y.value = e.translationY;
      if (Math.abs(e.translationX) > 12 || Math.abs(e.translationY) > 12) {
        isMoved.value = true;
      }
    })
    .onEnd(() => {
      if (x.value > THRESHOLD) {
        runOnJS(onSave)();
        x.value = withSpring(SCREEN_W * 1.5);
      } else if (x.value < -THRESHOLD) {
        runOnJS(onPass)();
        x.value = withSpring(-SCREEN_W * 1.5);
      } else if (!isMoved.value || (Math.abs(x.value) < 14 && Math.abs(y.value) < 14)) {
        x.value = withSpring(0);
        y.value = withSpring(0);
        runOnJS(onOpen)();
      } else {
        x.value = withSpring(0);
        y.value = withSpring(0);
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { rotate: `${(x.value / SCREEN_W) * MAX_ROT * 2}deg` },
    ],
  }));

  const saveStyle = useAnimatedStyle(() => ({
    opacity: interpolate(x.value, [0, 90], [0, 1], Extrapolation.CLAMP),
  }));

  const passStyle = useAnimatedStyle(() => ({
    opacity: interpolate(x.value, [-90, 0], [1, 0], Extrapolation.CLAMP),
  }));

  const heroImage =
    article.imageUrl ||
    SOURCE_DEFAULT_IMAGES[article.source] ||
    "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=80";

  // Clean domain for branding footer
  const domain = article.url.replace(/^https?:\/\//, "").split("/")[0];

  const handleOpenExternal = (e?: any) => {
    e?.stopPropagation?.();
    Linking.openURL(article.url).catch(() => onOpen());
  };

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        style={[
          styles.card,
          { backgroundColor: t.surface, borderColor: t.border },
          isTop
            ? [cardStyle, { zIndex: 10 }]
            : { transform: [{ scale: 0.96 }], zIndex: 1 },
        ]}
        pointerEvents={isTop ? "auto" : "none"}
      >
        {/* Cover / Hero Image: 16:9 thumbnail with skeleton and graceful fallback */}
        <TouchableOpacity
          activeOpacity={0.94}
          onPress={onOpen}
          style={styles.imageTouchable}
          accessibilityLabel="Open article"
        >
          <ImageWithFallback
            uri={heroImage}
            sourceName={article.source}
            aspectRatio={16 / 9}
            fallbackTitle={`${article.source} Engineering`}
            dark={dark}
            style={styles.cardImageContainer}
          >
            {/* Subtle gradient scrim */}
            <View style={styles.imageScrim} />

            {/* Minimalist Top Source Badge */}
            <View style={styles.imageHeaderRow}>
              <View style={styles.brandBadge}>
                <SourceLogo source={article.source} size={22} borderRadius={6} />
                <Text style={styles.sourceNameText}>{article.source}</Text>
              </View>

              <View style={styles.readTimeBadge}>
                <Text style={styles.readTimeText}>{article.readMins} min read</Text>
              </View>
            </View>
          </ImageWithFallback>
        </TouchableOpacity>

        {/* Card Main Body: Just the heading and tags */}
        <TouchableOpacity
          activeOpacity={0.96}
          onPress={onOpen}
          style={styles.body}
        >
          {/* Article Heading */}
          <Text
            style={[styles.title, { color: t.text }]}
            numberOfLines={4}
            ellipsizeMode="tail"
          >
            {article.title}
          </Text>

          {/* Tags (Clickable: filters & lists all tagged articles) */}
          {article.tags && article.tags.length > 0 && (
            <View style={styles.tagRow}>
              {article.tags.slice(0, 4).map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={[
                    styles.tagPill,
                    { backgroundColor: dark ? "#1E293B" : "#F1F5F9" },
                  ]}
                  onPress={(e) => {
                    e?.stopPropagation?.();
                    onTagPress?.(tag);
                  }}
                  activeOpacity={0.7}
                  accessibilityLabel={`Filter by tag ${tag}`}
                >
                  <Text style={[styles.tagText, { color: t.accent }]}>#{tag}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </TouchableOpacity>

        {/* Card Footer: Source Link Centered in the Middle */}
        <View style={[styles.footer, { borderTopColor: t.border }]}>
          <TouchableOpacity
            onPress={handleOpenExternal}
            activeOpacity={0.7}
            style={styles.domainLinkCentered}
            accessibilityLabel="Open source publication website"
          >
            <Text
              style={[styles.domainText, { color: t.accent }]}
              numberOfLines={1}
            >
              {domain} ↗
            </Text>
          </TouchableOpacity>
        </View>

        {/* Swipe Visual Feedback Stamps */}
        {isTop && (
          <>
            <Animated.View style={[styles.stampSave, saveStyle]} pointerEvents="none">
              <Text style={styles.stampSaveText}>SAVE</Text>
            </Animated.View>
            <Animated.View style={[styles.stampPass, passStyle]} pointerEvents="none">
              <Text style={styles.stampPassText}>PASS</Text>
            </Animated.View>
          </>
        )}
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  card: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 12,
    borderRadius: 24,
    borderWidth: 1,
    overflow: "hidden",
    ...(Platform.OS === "web" ? ({ cursor: "pointer" } as any) : {}),
  },
  imageTouchable: {
    width: "100%",
  },
  cardImageContainer: {
    width: "100%",
    maxHeight: 240,
  },
  imageScrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0, 0, 0, 0.22)",
  },
  imageHeaderRow: {
    position: "absolute",
    top: 14,
    left: 14,
    right: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brandBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.88)",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 14,
    gap: 8,
  },
  sourceNameText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 12,
  },
  readTimeBadge: {
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  readTimeText: {
    color: "#E2E8F0",
    fontSize: 11,
    fontWeight: "600",
  },
  body: {
    paddingHorizontal: 22,
    paddingTop: 20,
    flex: 1,
    justifyContent: "space-between",
    paddingBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    lineHeight: 30,
    letterSpacing: -0.4,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 16,
  },
  tagPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    minHeight: 32,
    justifyContent: "center",
  },
  tagText: {
    fontSize: 12,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  domainLinkCentered: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  domainText: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  stampSave: {
    position: "absolute",
    top: 26,
    left: 26,
    borderWidth: 3,
    borderColor: "#10B981",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
    transform: [{ rotate: "-12deg" }],
  },
  stampSaveText: {
    color: "#10B981",
    fontWeight: "900",
    letterSpacing: 2,
    fontSize: 16,
  },
  stampPass: {
    position: "absolute",
    top: 26,
    right: 26,
    borderWidth: 3,
    borderColor: "#64748B",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
    transform: [{ rotate: "12deg" }],
  },
  stampPassText: {
    color: "#64748B",
    fontWeight: "900",
    letterSpacing: 2,
    fontSize: 16,
  },
});
