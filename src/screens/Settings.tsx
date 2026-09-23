import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useStore, MAX_TOTAL_CACHE_SIZE } from "../store";
import { theme } from "../theme";

export const Settings: React.FC = () => {
  const {
    dark,
    setDark,
    haptics,
    setHaptics,
    clearCache,
    cachedArticlesCount,
    refreshFeed,
    isSyncingFeed,
  } = useStore();
  const t = theme(dark);

  const handleClearCache = async () => {
    await clearCache();
  };

  const handleRefresh = async () => {
    await refreshFeed();
  };

  const Toggle: React.FC<{ on: boolean; onPress: () => void }> = ({ on, onPress }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.track,
        { backgroundColor: on ? t.accent : dark ? "#374151" : "#CBD5E1" },
      ]}
    >
      <View style={[styles.thumb, { left: on ? 21 : 3 }]} />
    </TouchableOpacity>
  );

  const Row: React.FC<{ label: string; desc?: string; children: React.ReactNode }> = ({
    label,
    desc,
    children,
  }) => (
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
      <View style={styles.header}>
        <Text style={[styles.title, { color: t.text }]}>Settings</Text>
      </View>
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        <Row label="Dark mode" desc="Reduce eye strain at night">
          <Toggle on={dark} onPress={() => setDark(!dark)} />
        </Row>
        <Row label="Haptic feedback" desc="Vibrate on long-press actions">
          <Toggle on={haptics} onPress={() => setHaptics(!haptics)} />
        </Row>
        <Row
          label="Article cache"
          desc={`${cachedArticlesCount} of ${MAX_TOTAL_CACHE_SIZE} max stories (top 10/source, last 6 mo)`}
        >
          <TouchableOpacity
            onPress={handleRefresh}
            disabled={isSyncingFeed}
            style={[styles.btn, { borderColor: t.border, backgroundColor: dark ? "#1E293B" : "#F1F5F9" }]}
          >
            <Text style={{ color: t.accent, fontWeight: "700", fontSize: 13 }}>
              {isSyncingFeed ? "Syncing..." : "Sync"}
            </Text>
          </TouchableOpacity>
        </Row>
        <Row label="Reset cache" desc="Purge all cached & saved articles">
          <TouchableOpacity
            onPress={handleClearCache}
            style={[styles.btn, { borderColor: t.border }]}
          >
            <Text style={{ color: "#EF4444", fontWeight: "700", fontSize: 13 }}>Clear</Text>
          </TouchableOpacity>
        </Row>
        <Text style={[styles.version, { color: t.sub }]}>Merge · v1.0.0</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  header: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: "800", letterSpacing: -0.5 },
  list: { paddingHorizontal: 16, paddingBottom: 120, gap: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  rowLabel: { fontSize: 15, fontWeight: "700" },
  rowDesc: { fontSize: 12, marginTop: 2 },
  track: { width: 44, height: 26, borderRadius: 13, position: "relative" },
  thumb: {
    position: "absolute",
    top: 3,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#fff",
    elevation: 2,
  },
  btn: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  version: { textAlign: "center", fontSize: 12, marginTop: 24 },
});
