import React from "react";
import { Linking, Platform, StyleProp, Text, TextStyle } from "react-native";

import { stripMarkdown, parseMarkdownTokens, MarkdownToken } from "./markdownParser";

export { stripMarkdown, parseMarkdownTokens };
export type { MarkdownToken };

export interface FormattedTextProps {
  text: string;
  textColor: string;
  accentColor: string;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
  onLinkPress?: (url: string) => void;
}


export const FormattedText: React.FC<FormattedTextProps> = ({
  text,
  textColor,
  accentColor,
  style,
  numberOfLines,
  onLinkPress,
}) => {
  const tokens = parseMarkdownTokens(text);

  return (
    <Text style={[{ color: textColor }, style]} numberOfLines={numberOfLines}>
      {tokens.map((token, idx) => {
        if (token.type === "link") {
          return (
            <Text
              key={idx}
              style={{
                color: accentColor,
                textDecorationLine: "underline",
                fontWeight: "700",
              }}
              onPress={(e) => {
                e?.stopPropagation?.();
                if (token.url) {
                  if (onLinkPress) {
                    onLinkPress(token.url);
                  } else {
                    Linking.openURL(token.url).catch(() => {});
                  }
                }
              }}
            >
              {token.content}
            </Text>
          );
        }

        if (token.type === "bold") {
          return (
            <Text key={idx} style={{ fontWeight: "800", color: textColor }}>
              {token.content}
            </Text>
          );
        }

        if (token.type === "italic") {
          return (
            <Text key={idx} style={{ fontStyle: "italic" }}>
              {token.content}
            </Text>
          );
        }

        if (token.type === "code") {
          return (
            <Text
              key={idx}
              style={{
                fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
                fontSize: 12.5,
                backgroundColor: "rgba(128, 128, 128, 0.16)",
                color: accentColor,
                paddingHorizontal: 4,
                borderRadius: 4,
              }}
            >
              {token.content}
            </Text>
          );
        }

        return <Text key={idx}>{token.content}</Text>;
      })}
    </Text>
  );
};
