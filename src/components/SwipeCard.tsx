import React from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue, withSpring, runOnJS, interpolate, Extrapolation } from "react-native-reanimated";
import { Article, SOURCE_COLORS } from "../data/articles";
import { theme } from "../theme";

const { width: SCREEN_W } = Dimensions.get("window");
const THRESHOLD = 110;
const MAX_ROT = 14;

type Props = { article: Article; isTop: boolean; dark: boolean; onPass: () => void; onSave: () => void; onOpen: () => void };

export const SwipeCard: React.FC<Props> = ({ article, isTop, dark, onPass, onSave, onOpen }) => {
  const t = theme(dark);
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const moved = useSharedValue(false);

  const pan = Gesture.Pan()
    .enabled(isTop)
    .onBegin(() => { moved.value = false; })
    .onUpdate((e) => {
      x.value = e.translationX;
      y.value = e.translationY;
      if (Math.abs(e.translationX) > 4 || Math.abs(e.translationY) > 4) moved.value = true;
    })
    .onEnd(() => {
      if (!moved.value) { runOnJS(onOpen)(); x.value = withSpring(0); y.value = withSpring(0); return; }
      if (x.value > THRESHOLD) { runOnJS(onSave)(); x.value = withSpring(SCREEN_W * 1.5); }
      else if (x.value < -THRESHOLD) { runOnJS(onPass)(); x.value = withSpring(-SCREEN_W * 1.5); }
      else { x.value = withSpring(0); y.value = withSpring(0); }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }, { rotate: `${(x.value / SCREEN_W) * MAX_ROT * 2}deg` }],
  }));
  const saveStyle = useAnimatedStyle(() => ({ opacity: interpolate(x.value, [0, 90], [0, 1], Extrapolation.CLAMP) }));
  const passStyle = useAnimatedStyle(() => ({ opacity: interpolate(x.value, [-90, 0], [1, 0], Extrapolation.CLAMP) }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }, isTop ? cardStyle : { transform: [{ scale: 0.96 }] }]}>
        <View style={styles.chipRow}>
          <View style={[styles.sourceDot, { backgroundColor: SOURCE_COLORS[article.source] }]}><Text style={styles.sourceInitial}>{article.source[0]}</Text></View>
          <Text style={{ color: t.sub, fontWeight: "600", fontSize: 13 }}>{article.source}</Text>
        </View>
        <View style={{ paddingHorizontal: 24, paddingTop: 18, flex: 1 }}>
          <Text style={{ color: t.text, fontSize: 24, fontWeight: "800", lineHeight: 30 }}>{article.title}</Text>
          <Text style={{ color: t.sub, fontSize: 15, lineHeight: 23, marginTop: 14 }}>{article.excerpt}</Text>
        </View>
        <View style={[styles.footer, { borderTopColor: t.border }]}>
          <Text style={{ color: t.sub, fontSize: 13, fontWeight: "600" }}>{article.ageDays === 1 ? "1 day ago" : `${article.ageDays} days ago`}</Text>
          <Text style={{ color: t.sub, fontSize: 13, fontWeight: "600" }}>{article.readMins} min read</Text>
        </View>
        {isTop && (<>
          <Animated.View style={[styles.stampSave, saveStyle]}><Text style={styles.stampSaveText}>SAVE</Text></Animated.View>
          <Animated.View style={[styles.stampPass, passStyle]}><Text style={styles.stampPassText}>PASS</Text></Animated.View>
        </>)}
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  card: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, borderRadius: 24, borderWidth: 1, overflow: "hidden" },
  chipRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 24, paddingTop: 22 },
  sourceDot: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  sourceInitial: { color: "#fff", fontWeight: "800", fontSize: 13 },
  footer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 24, paddingVertical: 18, borderTopWidth: 1 },
  stampSave: { position: "absolute", top: 26, left: 26, borderWidth: 3, borderColor: "#10B981", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 6, transform: [{ rotate: "-12deg" }] },
  stampSaveText: { color: "#10B981", fontWeight: "900", letterSpacing: 2, fontSize: 16 },
  stampPass: { position: "absolute", top: 26, right: 26, borderWidth: 3, borderColor: "#64748B", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 6, transform: [{ rotate: "12deg" }] },
  stampPassText: { color: "#64748B", fontWeight: "900", letterSpacing: 2, fontSize: 16 },
});
