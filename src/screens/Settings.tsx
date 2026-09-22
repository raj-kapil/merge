import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useStore } from "../store";
import { theme } from "../theme";

export const Settings: React.FC = () => {
  const { dark, setDark, haptics, setHaptics, show } = useStore();
  const t = theme(dark);
  const Toggle: React.FC<{ on: boolean; onPress: () => void }> = ({ on, onPress }) => (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={[styles.track, { backgroundColor: on ? t.accent : dark ? "#374151" : "#CBD5E1" }]}>
      <View style={[styles.thumb, { left: on ? 21 : 3 }]} />
    </TouchableOpacity>
  );
  const Row: React.FC<{ label: string; desc?: string; children: React.ReactNode }> = ({ label, desc, children }) => (
    <View style={[styles.row, { backgroundColor: t.surface, borderColor: t.border }]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, { color: t.text }]}>{label}</Text>
        {desc && <Text style={[styles.rowDesc, { color: t.sub }]}>{desc}</Text>}
      </View>
      {children}
    </View>
  );
  return (
    <View style={styles.wrap}>
      <View style={styles.header}><Text style={[styles.title, { color: t.text }]}>Settings</Text></View>
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        <Row label="Dark mode" desc="Reduce eye strain at night"><Toggle on={dark} onPress={() => setDark(!dark)} /></Row>
        <Row label="Haptic feedback" desc="Vibrate on long-press actions"><Toggle on={haptics} onPress={() => setHaptics(!haptics)} /></Row>
        <Row label="Reset cache" desc="Clear locally cached articles">
          <TouchableOpacity onPress={() => show("Cache cleared")} style={[styles.clearBtn, { borderColor: t.border }]}>
            <Text style={{ color: t.text, fontWeight: "700", fontSize: 13 }}>Clear</Text>
          </TouchableOpacity>
        </Row>
        <Text style={[styles.version, { color: t.sub }]}>TechFlip · v1.0.0</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  header: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: "800", letterSpacing: -0.5 },
  list: { paddingHorizontal: 16, paddingBottom: 120, gap: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 14, borderWidth: 1 },
  rowLabel: { fontSize: 15, fontWeight: "700" },
  rowDesc: { fontSize: 12, marginTop: 2 },
  track: { width: 44, height: 26, borderRadius: 13, position: "relative" },
  thumb: { position: "absolute", top: 3, width: 20, height: 20, borderRadius: 10, backgroundColor: "#fff", elevation: 2 },
  clearBtn: { borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  version: { textAlign: "center", fontSize: 12, marginTop: 24 },
});
