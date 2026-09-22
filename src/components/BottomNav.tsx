import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { useStore } from "../store";
import { theme } from "../theme";

type Tab = "discover" | "saved" | "sources" | "settings";

const Icon: React.FC<{ id: Tab; color: string }> = ({ id, color }) => {
  const s = { stroke: color, strokeWidth: 2, fill: "none" } as const;
  switch (id) {
    case "discover": return <Svg width={22} height={22} viewBox="0 0 24 24"><Path d="M3 12l18-9-9 18-2-7-7-2z" {...s} /></Svg>;
    case "saved":    return <Svg width={22} height={22} viewBox="0 0 24 24"><Path d="M6 4h12v16l-6-4-6 4V4z" {...s} /></Svg>;
    case "sources":  return <Svg width={22} height={22} viewBox="0 0 24 24"><Path d="M4 6h16M4 12h16M4 18h10" {...s} strokeLinecap="round" /></Svg>;
    case "settings": return (<Svg width={22} height={22} viewBox="0 0 24 24"><Circle cx={12} cy={12} r={3} {...s} /><Path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" {...s} strokeLinecap="round" /></Svg>);
  }
};

export const BottomNav: React.FC<{ tab: Tab; onChange: (t: Tab) => void }> = ({ tab, onChange }) => {
  const { dark, saved } = useStore();
  const t = theme(dark);
  const items: { id: Tab; label: string }[] = [
    { id: "discover", label: "Discover" },
    { id: "saved", label: "Saved" },
    { id: "sources", label: "Sources" },
    { id: "settings", label: "Settings" },
  ];
  return (
    <View style={[styles.wrap, { backgroundColor: dark ? "#0F1418" : "#FFFFFF", borderTopColor: t.border }]}>
      {items.map((it) => {
        const on = tab === it.id;
        const color = on ? t.accent : dark ? "#6B7280" : "#94A3B8";
        return (
          <TouchableOpacity key={it.id} onPress={() => onChange(it.id)} style={styles.item} activeOpacity={0.7}>
            <View style={{ position: "relative" }}>
              <Icon id={it.id} color={color} />
              {it.id === "saved" && saved.length > 0 && (<View style={styles.badge}><Text style={styles.badgeText}>{saved.length}</Text></View>)}
            </View>
            <Text style={[styles.label, { color }]}>{it.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", justifyContent: "space-around", paddingTop: 10, paddingBottom: 6, borderTopWidth: 1 },
  item: { alignItems: "center", paddingHorizontal: 10, paddingVertical: 6, gap: 3 },
  label: { fontSize: 10, fontWeight: "700" },
  badge: { position: "absolute", top: -4, right: -8, backgroundColor: "#10B981", minWidth: 16, height: 16, borderRadius: 8, paddingHorizontal: 4, alignItems: "center", justifyContent: "center" },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },
});
