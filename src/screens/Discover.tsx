import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { Article } from "../data/articles";
import { useStore } from "../store";
import { theme } from "../theme";
import { SwipeCard } from "../components/SwipeCard";

type Props = { onOpen: (a: Article) => void };

export const Discover: React.FC<Props> = ({ onOpen }) => {
  const { feed, dark, save } = useStore();
  const t = theme(dark);
  const [index, setIndex] = useState(0);
  const [passed, setPassed] = useState<string[]>([]);

  useEffect(() => { setIndex(0); setPassed([]); }, [feed]);

  const filtered = useMemo(() => feed.filter((a) => !passed.includes(a.id)), [feed, passed]);
  const current = filtered[index];
  const next = filtered[index + 1];
  const total = filtered.length;

  const handlePass = () => { if (!current) return; setPassed((p) => [...p, current.id]); setIndex((i) => i + 1); };
  const handleSave = () => { if (!current) return; save(current); setIndex((i) => i + 1); };

  return (
    <View style={styles.wrap}>
      <View style={styles.subBar}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
          <Svg width={13} height={13} viewBox="0 0 24 24">
            <Path
              d="M12 2C12 7.5 7.5 12 2 12C7.5 12 12 16.5 12 22C12 16.5 16.5 12 22 12C16.5 12 12 7.5 12 2Z"
              fill="#10B981"
            />
          </Svg>
          <Text style={[styles.liveText, { color: t.text }]}>LIVE FEED</Text>
        </View>
        <Text style={[styles.counter, { color: t.sub }]}>{total === 0 ? "0 of 0" : `${Math.min(index + 1, total)} of ${total}`}</Text>
      </View>
      <View style={styles.stack}>
        {total === 0 && (
          <View style={styles.empty}>
            <Text style={{ fontSize: 40 }}>🎉</Text>
            <Text style={[styles.emptyTitle, { color: t.text }]}>You're all caught up</Text>
            <Text style={[styles.emptyBody, { color: t.sub }]}>Enable more sources in Settings to see more articles.</Text>
          </View>
        )}
        {next && <SwipeCard key={next.id} article={next} isTop={false} dark={dark} onPass={() => {}} onSave={() => {}} onOpen={() => {}} />}
        {current && <SwipeCard key={current.id} article={current} isTop dark={dark} onPass={handlePass} onSave={handleSave} onOpen={() => onOpen(current)} />}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { flex: 1, paddingHorizontal: 18 },
  subBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 10, paddingBottom: 14, paddingHorizontal: 4 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#10B981" },
  liveText: { fontSize: 12, fontWeight: "800", letterSpacing: 1.6 },
  counter: { fontSize: 12, fontWeight: "700" },
  stack: { flex: 1, position: "relative" },
  empty: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center", gap: 10, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 16, fontWeight: "700" },
  emptyBody: { fontSize: 13, textAlign: "center", lineHeight: 19 },
});
