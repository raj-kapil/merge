import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Path } from "react-native-svg";
import { useStore } from "../store";
import { theme } from "../theme";

type Tab = "discover" | "saved" | "sources" | "settings";

const Icon: React.FC<{ id: Tab; color: string; active: boolean; dark: boolean }> = ({
  id,
  color,
  active,
  dark,
}) => {
  switch (id) {
    case "discover":
      return (
        <Svg width={22} height={22} viewBox="0 0 24 24">
          {/* Primary AI Sparkle */}
          <Path
            d="M10 2C10 6.97 6.97 11 2 11C6.97 11 10 15.03 10 20C10 15.03 13.03 11 18 11C13.03 11 10 6.97 10 2Z"
            stroke={color}
            strokeWidth={active ? 0 : 1.8}
            fill={active ? color : "none"}
            strokeLinejoin="round"
          />
          {/* Secondary AI Accent Sparkle */}
          <Path
            d="M18 2C18 3.66 16.66 5 15 5C16.66 5 18 6.34 18 8C18 6.34 19.34 5 21 5C19.34 5 18 3.66 18 2Z"
            fill={color}
          />
          {/* Micro Synaptic Star */}
          <Path
            d="M19 15C19 16.1 18.1 17 17 17C18.1 17 19 17.9 19 19C19 17.9 19.9 17 21 17C19.9 17 19 16.1 19 15Z"
            fill={color}
            opacity={0.8}
          />
        </Svg>
      );
    case "saved":
      return (
        <Svg width={22} height={22} viewBox="0 0 24 24">
          {/* Neural Bookmark */}
          <Path
            d="M5 3.5C5 2.67 5.67 2 6.5 2H17.5C18.33 2 19 2.67 19 3.5V21.5L12 17.5L5 21.5V3.5Z"
            stroke={color}
            strokeWidth={1.8}
            strokeLinejoin="round"
            fill={active ? color : "none"}
          />
          {/* Embedded AI Starburst Core */}
          <Path
            d="M12 7C12 8.4 11.1 9.5 10 9.5C11.1 9.5 12 10.6 12 12C12 10.6 12.9 9.5 14 9.5C12.9 9.5 12 8.4 12 7Z"
            fill={active ? (dark ? "#0F1418" : "#FFFFFF") : color}
          />
        </Svg>
      );
    case "sources":
      return (
        <Svg width={22} height={22} viewBox="0 0 24 24">
          {/* Neural Synaptic Network */}
          <Path
            d="M12 7.5L6.5 15M12 7.5L17.5 15M7.5 17H16.5"
            stroke={color}
            strokeWidth={1.6}
            strokeLinecap="round"
          />
          <Path
            d="M12 7.5V12.5M6.5 15L12 12.5M17.5 15L12 12.5"
            stroke={color}
            strokeWidth={1.2}
            strokeDasharray="1.5,1.5"
            strokeLinecap="round"
            opacity={0.8}
          />
          <Circle
            cx={12}
            cy={5.5}
            r={2.5}
            stroke={color}
            strokeWidth={1.8}
            fill={active ? color : dark ? "#0F1418" : "#FFFFFF"}
          />
          <Circle
            cx={5.5}
            cy={17}
            r={2.5}
            stroke={color}
            strokeWidth={1.8}
            fill={active ? color : dark ? "#0F1418" : "#FFFFFF"}
          />
          <Circle
            cx={18.5}
            cy={17}
            r={2.5}
            stroke={color}
            strokeWidth={1.8}
            fill={active ? color : dark ? "#0F1418" : "#FFFFFF"}
          />
          <Circle cx={12} cy={12.5} r={1.5} fill={color} />
        </Svg>
      );
    case "settings":
      return (
        <Svg width={22} height={22} viewBox="0 0 24 24">
          {/* AI Parameter Tuning Sliders */}
          <Path
            d="M4 6.5h16M4 12h16M4 17.5h16"
            stroke={color}
            strokeWidth={1.8}
            strokeLinecap="round"
          />
          <Circle
            cx={8}
            cy={6.5}
            r={2.8}
            fill={active ? color : dark ? "#0F1418" : "#FFFFFF"}
            stroke={color}
            strokeWidth={1.8}
          />
          <Circle
            cx={16}
            cy={12}
            r={2.8}
            fill={active ? color : dark ? "#0F1418" : "#FFFFFF"}
            stroke={color}
            strokeWidth={1.8}
          />
          <Circle
            cx={11}
            cy={17.5}
            r={2.8}
            fill={active ? color : dark ? "#0F1418" : "#FFFFFF"}
            stroke={color}
            strokeWidth={1.8}
          />
        </Svg>
      );
  }
};

export const BottomNav: React.FC<{ tab: Tab; onChange: (t: Tab) => void }> = ({ tab, onChange }) => {
  const { dark, saved } = useStore();
  const t = theme(dark);
  const insets = useSafeAreaInsets();
  const items: { id: Tab; label: string }[] = [
    { id: "discover", label: "Discover" },
    { id: "saved", label: "Saved" },
    { id: "sources", label: "Sources" },
    { id: "settings", label: "Settings" },
  ];
  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: dark ? "#0F1418" : "#FFFFFF",
          borderTopColor: t.border,
          paddingBottom: Math.max(insets.bottom, 10),
        },
      ]}
    >
      {items.map((it) => {
        const on = tab === it.id;
        const color = on ? t.accent : dark ? "#6B7280" : "#94A3B8";
        return (
          <TouchableOpacity key={it.id} onPress={() => onChange(it.id)} style={styles.item} activeOpacity={0.7}>
            <View style={{ position: "relative" }}>
              <Icon id={it.id} color={color} active={on} dark={dark} />
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
