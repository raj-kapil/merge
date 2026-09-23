import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ALL_SOURCES } from "../data/articles";
import { SourceLogo } from "../components/SourceLogo";
import { useStore } from "../store";
import { theme } from "../theme";

export const Sources: React.FC = () => {
  const { enabled, toggleSource, dark } = useStore();
  const t = theme(dark);
  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: t.text }]}>Sources</Text>
        <Text style={[styles.sub, { color: t.sub }]}>Pick the teams you want to hear from.</Text>
      </View>
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {ALL_SOURCES.map((s) => {
          const on = enabled.has(s);
          return (
            <TouchableOpacity key={s} onPress={() => toggleSource(s)} activeOpacity={0.8} style={[styles.row, { backgroundColor: t.surface, borderColor: t.border }]}>
              <SourceLogo source={s} size={36} borderRadius={10} />
              <Text style={[styles.name, { color: t.text }]}>{s}</Text>
              <View style={[styles.track, { backgroundColor: on ? t.accent : dark ? "#374151" : "#CBD5E1" }]}>
                <View style={[styles.thumb, { left: on ? 21 : 3 }]} />
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  header: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: "800", letterSpacing: -0.5 },
  sub: { fontSize: 13, marginTop: 4 },
  list: { paddingHorizontal: 16, paddingBottom: 120, gap: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 14, borderWidth: 1 },
  name: { flex: 1, fontSize: 16, fontWeight: "700" },
  track: { width: 44, height: 26, borderRadius: 13, position: "relative" },
  thumb: { position: "absolute", top: 3, width: 20, height: 20, borderRadius: 10, backgroundColor: "#fff", elevation: 2 },
});
