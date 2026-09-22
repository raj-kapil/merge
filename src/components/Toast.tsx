import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type ToastItem = { id: number; message: string; actionLabel?: string; onAction?: () => void };

export const Toast: React.FC<{ toasts: ToastItem[] }> = ({ toasts }) => {
  if (!toasts.length) return null;
  return (
    <View style={styles.host} pointerEvents="box-none">
      {toasts.map((t) => (
        <View key={t.id} style={styles.toast}>
          <Text style={styles.text}>{t.message}</Text>
          {t.actionLabel && (
            <TouchableOpacity onPress={t.onAction} hitSlop={10}>
              <Text style={styles.action}>{t.actionLabel}</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  host: { position: "absolute", left: 16, right: 16, bottom: 90, gap: 8 },
  toast: { backgroundColor: "#0B0F12", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, elevation: 8 },
  text: { color: "#fff", fontSize: 13, fontWeight: "600", flex: 1 },
  action: { color: "#10B981", fontSize: 13, fontWeight: "800", letterSpacing: 0.4 },
});
