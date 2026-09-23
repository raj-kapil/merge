import React from "react";
import { Image, Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { CodeBlock } from "./CodeBlock";
import { ImageWithFallback } from "./ImageWithFallback";
import { FormattedText } from "../utils/markdownRenderer";
import { htmlToMarkdown } from "../utils/htmlToMarkdown";

interface ArticleBodyProps {
  body: string;
  articleTitle?: string;
  textColor: string;
  subColor: string;
  accentColor: string;
  borderColor: string;
  isDark: boolean;
  onImagePress: (image: { url: string; caption?: string }) => void;
}

export const ArticleBody: React.FC<ArticleBodyProps> = ({
  body,
  articleTitle,
  textColor,
  subColor,
  accentColor,
  borderColor,
  isDark,
  onImagePress,
}) => {
  const normalizedBody = body.includes("<") && body.includes(">") ? htmlToMarkdown(body) : body;
  const lines = normalizedBody.split("\n");
  const elements: React.ReactNode[] = [];
  let inCode = false;
  let codeBuffer: string[] = [];
  let currentLang = "";
  let elementKey = 0;
  let skippedTitle = false;

  const flushCodeBlock = () => {
    if (codeBuffer.length === 0) return;
    const codeContent = codeBuffer.join("\n");
    elements.push(
      <CodeBlock
        key={`code_${elementKey++}`}
        code={codeContent}
        language={currentLang}
      />
    );
    codeBuffer = [];
    currentLang = "";
  };

  const normalizedTitle = (articleTitle || "").toLowerCase().trim().replace(/[^\w\s]/g, "");

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trimEnd();

    // Markdown Code Fence: ```lang
    if (line.startsWith("```")) {
      if (inCode) {
        flushCodeBlock();
        inCode = false;
      } else {
        flushCodeBlock();
        inCode = true;
        currentLang = line.slice(3).trim();
      }
      continue;
    }

    if (inCode) {
      codeBuffer.push(rawLine);
      continue;
    }

    // Skip leading duplicate title & byline if already rendered in article header
    if (!skippedTitle && normalizedTitle && line.startsWith("# ")) {
      const headingText = line.replace(/^#\s+/, "").toLowerCase().trim().replace(/[^\w\s]/g, "");
      if (headingText === normalizedTitle || headingText.includes(normalizedTitle) || normalizedTitle.includes(headingText)) {
        skippedTitle = true;
        // Check if next non-empty line is a byline (e.g. *By Author...*)
        let nextIdx = i + 1;
        while (nextIdx < lines.length && lines[nextIdx].trim() === "") {
          nextIdx++;
        }
        if (nextIdx < lines.length && /^\*?By\s+/i.test(lines[nextIdx].trim())) {
          i = nextIdx; // Skip redundant byline too
        }
        continue;
      }
    }

    // Headings (H1 to H4)
    if (line.startsWith("# ")) {
      elements.push(
        <FormattedText
          key={`h1_${elementKey++}`}
          text={line.replace(/^#\s+/, "")}
          textColor={textColor}
          accentColor={accentColor}
          style={styles.h1}
          onLinkPress={(url) => Linking.openURL(url).catch(() => {})}
        />
      );
    } else if (line.startsWith("## ")) {
      elements.push(
        <FormattedText
          key={`h2_${elementKey++}`}
          text={line.replace(/^##\s+/, "")}
          textColor={textColor}
          accentColor={accentColor}
          style={styles.h2}
          onLinkPress={(url) => Linking.openURL(url).catch(() => {})}
        />
      );
    } else if (line.startsWith("### ")) {
      elements.push(
        <FormattedText
          key={`h3_${elementKey++}`}
          text={line.replace(/^###\s+/, "")}
          textColor={textColor}
          accentColor={accentColor}
          style={styles.h3}
          onLinkPress={(url) => Linking.openURL(url).catch(() => {})}
        />
      );
    } else if (line.startsWith("#### ")) {
      elements.push(
        <FormattedText
          key={`h4_${elementKey++}`}
          text={line.replace(/^####\s+/, "")}
          textColor={textColor}
          accentColor={accentColor}
          style={styles.h4}
          onLinkPress={(url) => Linking.openURL(url).catch(() => {})}
        />
      );
    }
    // Bullet Lists
    else if (line.startsWith("- ") || line.startsWith("* ")) {
      const bulletContent = line.replace(/^[-*]\s+/, "");
      elements.push(
        <View key={`bullet_${elementKey++}`} style={styles.bulletRow}>
          <Text style={[styles.bulletPoint, { color: accentColor }]}>•</Text>
          <FormattedText
            text={bulletContent}
            textColor={textColor}
            accentColor={accentColor}
            style={styles.bulletText}
            onLinkPress={(url) => Linking.openURL(url).catch(() => {})}
          />
        </View>
      );
    }
    // Numbered Lists
    else if (/^\d+\.\s+/.test(line)) {
      const match = line.match(/^(\d+\.)\s+(.*)$/);
      const numberPrefix = match ? match[1] : "1.";
      const itemContent = match ? match[2] : line;
      elements.push(
        <View key={`num_${elementKey++}`} style={styles.bulletRow}>
          <Text style={[styles.numberPrefix, { color: accentColor }]}>{numberPrefix}</Text>
          <FormattedText
            text={itemContent}
            textColor={textColor}
            accentColor={accentColor}
            style={styles.bulletText}
            onLinkPress={(url) => Linking.openURL(url).catch(() => {})}
          />
        </View>
      );
    }
    // Blockquotes
    else if (line.startsWith("> ")) {
      const quoteContent = line.replace(/^>\s*/, "");
      elements.push(
        <View
          key={`quote_${elementKey++}`}
          style={[
            styles.quoteBlock,
            {
              borderLeftColor: accentColor,
              backgroundColor: isDark ? "#1E293B33" : "#F8FAFC",
            },
          ]}
        >
          <FormattedText
            text={quoteContent}
            textColor={textColor}
            accentColor={accentColor}
            style={styles.quoteText}
            onLinkPress={(url) => Linking.openURL(url).catch(() => {})}
          />
        </View>
      );
    }
    // Horizontal Rules
    else if (line === "---" || line === "***") {
      elements.push(
        <View
          key={`hr_${elementKey++}`}
          style={[styles.hr, { backgroundColor: borderColor }]}
        />
      );
    }
    // Clickable Markdown Images: ![caption](url)
    else if (line.includes("![") && line.includes("](") && line.includes(")")) {
      const match = line.match(/!\[(.*?)\]\((https?:\/\/[^\s)]+)\)/);
      if (match) {
        const altText = match[1];
        const imageUrl = match[2];
        elements.push(
          <TouchableOpacity
            key={`img_${elementKey++}`}
            activeOpacity={0.92}
            onPress={() => onImagePress({ url: imageUrl, caption: altText })}
            style={styles.imageWrap}
            accessibilityLabel={`Click to enlarge image: ${altText || "Article graphic"}`}
          >
            <ImageWithFallback
              uri={imageUrl}
              aspectRatio={16 / 9}
              resizeMode="contain"
              fallbackTitle={altText || "Architecture Diagram"}
              dark={isDark}
              style={styles.image}
            >
              <View style={styles.imageZoomBadge}>
                <Svg width={12} height={12} viewBox="0 0 24 24" style={{ marginRight: 4 }}>
                  <Path
                    d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"
                    stroke="#FFFFFF"
                    strokeWidth={2.4}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
                <Text style={styles.imageZoomText}>Enlarge</Text>
              </View>
            </ImageWithFallback>
            {altText ? (
              <Text style={[styles.imageCaption, { color: subColor }]}>{altText}</Text>
            ) : null}
          </TouchableOpacity>
        );
      } else {
        // Fallback to paragraph if image url didn't match
        elements.push(
          <FormattedText
            key={`p_${elementKey++}`}
            text={line}
            textColor={textColor}
            accentColor={accentColor}
            style={styles.body}
            onLinkPress={(url) => Linking.openURL(url).catch(() => {})}
          />
        );
      }
    }
    // Empty Spacing
    else if (line.trim() === "") {
      elements.push(<View key={`space_${elementKey++}`} style={{ height: 10 }} />);
    }
    // Standard Paragraph with Markdown formatting
    else {
      elements.push(
        <FormattedText
          key={`p_${elementKey++}`}
          text={line}
          textColor={textColor}
          accentColor={accentColor}
          style={styles.body}
          onLinkPress={(url) => Linking.openURL(url).catch(() => {})}
        />
      );
    }
  }

  flushCodeBlock();
  return <>{elements}</>;
};

const styles = StyleSheet.create({
  h1: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
    lineHeight: 32,
    marginTop: 8,
    marginBottom: 8,
  },
  h2: {
    fontSize: 18.5,
    fontWeight: "800",
    lineHeight: 25,
    marginTop: 20,
    marginBottom: 8,
  },
  h3: {
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 23,
    marginTop: 16,
    marginBottom: 6,
  },
  h4: {
    fontSize: 14.5,
    fontWeight: "700",
    marginTop: 12,
    marginBottom: 4,
  },
  body: {
    fontSize: 15.5,
    lineHeight: 25.5,
    marginVertical: 6,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginVertical: 4,
    paddingLeft: 6,
  },
  bulletPoint: {
    fontSize: 16,
    lineHeight: 24,
    marginRight: 8,
    fontWeight: "800",
  },
  numberPrefix: {
    fontSize: 14.5,
    lineHeight: 24,
    marginRight: 8,
    fontWeight: "700",
  },
  bulletText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 24,
  },
  quoteBlock: {
    borderLeftWidth: 3.5,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 6,
    marginVertical: 10,
  },
  quoteText: {
    fontStyle: "italic",
    fontSize: 15,
    lineHeight: 24,
  },
  hr: {
    height: 1,
    marginVertical: 18,
  },
  imageWrap: {
    marginVertical: 14,
    borderRadius: 14,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#0F172A",
  },
  image: {
    width: "100%",
    borderRadius: 14,
  },
  imageZoomBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  imageZoomText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  imageCaption: {
    fontSize: 12,
    fontStyle: "italic",
    marginTop: 6,
    textAlign: "center",
    paddingHorizontal: 12,
  },
});
