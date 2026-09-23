import React, { useState } from "react";
import {
  Dimensions,
  Image,
  Linking,
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import Svg, { Path } from "react-native-svg";
import { SOURCE_COLORS } from "../data/articles";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

type Props = {
  visible: boolean;
  imageUrl: string;
  title?: string;
  caption?: string;
  source?: string;
  onClose: () => void;
  onOpenArticle?: () => void;
};

export const ImageViewerModal: React.FC<Props> = ({
  visible,
  imageUrl,
  title,
  caption,
  source,
  onClose,
  onOpenArticle,
}) => {
  const [copied, setCopied] = useState(false);

  if (!visible || !imageUrl) return null;

  const handleCopyLink = async () => {
    try {
      await Clipboard.setStringAsync(imageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleOpenExternal = () => {
    Linking.openURL(imageUrl).catch(() => {});
  };

  const sourceColor = (source && SOURCE_COLORS[source]) || "#3B82F6";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <SafeAreaView style={styles.safeArea}>
          {/* Header Bar */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityLabel="Close image viewer"
              hitSlop={12}
            >
              <Svg width={24} height={24} viewBox="0 0 24 24">
                <Path
                  d="M18 6L6 18M6 6L18 18"
                  stroke="#FFFFFF"
                  strokeWidth={2.4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>

            {source ? (
              <View style={[styles.sourceBadge, { backgroundColor: sourceColor }]}>
                <Text style={styles.sourceText}>{source.toUpperCase()}</Text>
              </View>
            ) : null}

            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={handleCopyLink}
                style={styles.actionBtn}
                accessibilityLabel="Copy image URL"
                hitSlop={8}
              >
                <Text style={styles.actionBtnText}>
                  {copied ? "Copied!" : "Copy Link"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleOpenExternal}
                style={[styles.actionBtn, styles.externalBtn]}
                accessibilityLabel="Open original image URL"
                hitSlop={8}
              >
                <Text style={styles.actionBtnText}>Original ↗</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Centered Image Container */}
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: imageUrl }}
              style={styles.image}
              resizeMode="contain"
            />
          </View>

          {/* Bottom Details Bar */}
          <View style={styles.footer}>
            {title ? (
              <Text style={styles.titleText} numberOfLines={2}>
                {title}
              </Text>
            ) : null}

            {caption ? (
              <Text style={styles.captionText} numberOfLines={3}>
                {caption}
              </Text>
            ) : null}

            <View style={styles.footerButtons}>
              <TouchableOpacity
                onPress={onClose}
                style={styles.dismissBtn}
                activeOpacity={0.8}
              >
                <Text style={styles.dismissBtnText}>Close</Text>
              </TouchableOpacity>

              {onOpenArticle ? (
                <TouchableOpacity
                  onPress={() => {
                    onClose();
                    onOpenArticle();
                  }}
                  style={styles.readArticleBtn}
                  activeOpacity={0.8}
                >
                  <Text style={styles.readArticleBtnText}>Read Full Article →</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(5, 8, 12, 0.95)",
    justifyContent: "space-between",
  },
  safeArea: {
    flex: 1,
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 10,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  sourceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sourceText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
  },
  externalBtn: {
    backgroundColor: "rgba(59, 130, 246, 0.35)",
  },
  actionBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  imageContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingHorizontal: 0,
  },
  image: {
    width: "100%",
    height: "100%",
    maxHeight: SCREEN_H * 0.78,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 24 : 16,
    backgroundColor: "rgba(10, 15, 22, 0.85)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
  },
  titleText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  captionText: {
    color: "#94A3B8",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  footerButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 6,
  },
  dismissBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  dismissBtnText: {
    color: "#E2E8F0",
    fontSize: 13,
    fontWeight: "700",
  },
  readArticleBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#3B82F6",
  },
  readArticleBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
});
