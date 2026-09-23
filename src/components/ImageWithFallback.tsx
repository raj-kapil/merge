import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ImageStyle,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import Svg, { Path, Rect } from "react-native-svg";
import { SourceLogo } from "./SourceLogo";
import { SOURCE_COLORS } from "../data/articles";

interface ImageWithFallbackProps {
  uri?: string;
  sourceName?: string;
  aspectRatio?: number;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  resizeMode?: "cover" | "contain";
  accessibilityLabel?: string;
  fallbackTitle?: string;
  children?: React.ReactNode;
  dark?: boolean;
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  uri,
  sourceName,
  aspectRatio = 16 / 9,
  style,
  imageStyle,
  resizeMode = "cover",
  accessibilityLabel,
  fallbackTitle,
  children,
  dark = true,
}) => {
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(!uri);

  useEffect(() => {
    setLoading(true);
    setHasError(!uri);
  }, [uri]);

  const brandColor = sourceName && SOURCE_COLORS[sourceName] ? SOURCE_COLORS[sourceName] : "#6366F1";

  return (
    <View
      style={[
        styles.container,
        {
          aspectRatio,
          backgroundColor: dark ? "#0F172A" : "#F1F5F9",
        },
        style,
      ]}
      accessibilityLabel={accessibilityLabel}
    >
      {/* Background / Fallback when errored or empty */}
      {hasError ? (
        <View
          style={[
            styles.fallbackContainer,
            {
              backgroundColor: dark ? "#1E293B" : "#E2E8F0",
              borderTopColor: brandColor,
            },
          ]}
        >
          <View style={styles.fallbackContent}>
            {sourceName ? (
              <SourceLogo source={sourceName} size={42} borderRadius={10} />
            ) : (
              <Svg width={36} height={36} viewBox="0 0 24 24">
                <Rect x="3" y="3" width="18" height="18" rx="2" stroke={dark ? "#94A3B8" : "#64748B"} strokeWidth={1.8} fill="none" />
                <Path d="M3 15l5-5 4 4 4-4 5 5" stroke={dark ? "#94A3B8" : "#64748B"} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </Svg>
            )}
            <Text
              style={[
                styles.fallbackTitle,
                { color: dark ? "#94A3B8" : "#64748B" },
              ]}
              numberOfLines={2}
            >
              {fallbackTitle || (sourceName ? `${sourceName} Engineering` : "Article Visual")}
            </Text>
          </View>
        </View>
      ) : (
        <>
          <Image
            source={{ uri }}
            style={[
              styles.image,
              imageStyle,
            ]}
            resizeMode={resizeMode}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setHasError(true);
            }}
          />

          {/* Loading Skeleton */}
          {loading && (
            <View
              style={[
                StyleSheet.absoluteFill,
                styles.skeletonContainer,
                { backgroundColor: dark ? "#1E293B" : "#E2E8F0" },
              ]}
            >
              <ActivityIndicator
                size="small"
                color={brandColor}
              />
            </View>
          )}
        </>
      )}

      {/* Optional overlay children (badges, scrims, headers) */}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    position: "relative",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  skeletonContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  fallbackContainer: {
    ...StyleSheet.absoluteFill,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    borderTopWidth: 3,
  },
  fallbackContent: {
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  fallbackTitle: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    letterSpacing: 0.2,
  },
});
