import React from "react";
import { Platform, View, StyleSheet, useWindowDimensions } from "react-native";

const IS_WEB = Platform.OS === "web";

export const DeviceFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { width, height } = useWindowDimensions();
  const showFrame = IS_WEB && width > 500 && height > 750;

  if (!showFrame) return <>{children}</>;

  return (
    <View style={styles.stage}>
      <View style={styles.phone}>
        <View style={styles.punchHole} />
        <View style={styles.screen}>{children}</View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  stage: { flex: 1, backgroundColor: "#05080A", alignItems: "center", justifyContent: "center", padding: 24 },
  phone: { width: 380, height: 780, borderRadius: 44, backgroundColor: "#000", padding: 10, position: "relative" },
  punchHole: { position: "absolute", top: 22, left: "50%", marginLeft: -6, width: 12, height: 12, borderRadius: 6, backgroundColor: "#0a0a0a", borderWidth: 2, borderColor: "#1a1a1a", zIndex: 10 },
  screen: { flex: 1, borderRadius: 34, overflow: "hidden" },
});
