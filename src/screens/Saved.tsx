import React, { useRef, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as Haptics from "expo-haptics";
import Svg, { Path } from "react-native-svg";
import { Article, SOURCE_COLORS } from "../data/articles";
import { useStore } from "../store";
import { theme } from "../theme";

type Props = { onOpen: (a: Article) => void };

export const Saved: React.FC<Props> = ({ onOpen }) => {
  const { saved, unsave, save, dark, haptics, show } = useStore();
  const t = theme(dark);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const undoRef = useRef<Article[]>([]);

  const exitSelect = () => { setSelectMode(false); setSelected(new Set()); };
  const toggle = (id: string) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const handlePress = (a: Article) => { if (selectMode) toggle(a.id); else onOpen(a); };
  const handleLongPress = (a: Article) => {
    if (haptics) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectMode(true); setSelected(new Set([a.id]));
  };
  const confirmDelete = () => {
    const ids = Array.from(selected);
    undoRef.current = saved.filter((a) => ids.includes(a.id));
    unsave(ids); setConfirmOpen(false); exitSelect();
    show(`${ids.length} article${ids.length > 1 ? "s" : ""} removed`, "Undo", () => {
      undoRef.current.forEach((a) => save(a)); show("Restored");
    });
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.header}><Text style={[styles.title, { color: t.text }]}>Saved</Text></View>
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {saved.length === 0 && (
          <View style={styles.empty}><Text style={[styles.emptyText, { color: t.sub }]}>No saved articles yet.{"\n"}Swipe right on Discover to save.</Text></View>
        )}
        {saved.map((a) => {
          const isSel = selected.has(a.id);
          return (
            <Pressable key={a.id} onPress={() => handlePress(a)} onLongPress={() => handleLongPress(a)} delayLongPress={500}
              style={[styles.card, { backgroundColor: t.surface, borderColor: isSel ? t.accent : t.border, borderWidth: isSel ? 1.5 : 1 }]}>
              <View style={[styles.checkbox, { opacity: selectMode ? 1 : 0, transform: [{ scale: selectMode ? 1 : 0.6 }], borderColor: isSel ? t.accent : dark ? "#4B5563" : "#CBD5E1", backgroundColor: isSel ? t.accent : "transparent" }]}>
                {isSel && <Svg width={12} height={12} viewBox="0 0 24 24"><Path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" fill="none" /></Svg>}
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[styles.sourceTag, { color: SOURCE_COLORS[a.source] || t.sub }]}>{a.source.toUpperCase()}</Text>
                <Text style={[styles.cardTitle, { color: t.text }]} numberOfLines={2}>{a.title}</Text>
                <View style={styles.metaRow}>
                  <Text style={[styles.meta, { color: t.sub }]}>{a.ageDays === 1 ? "1 day ago" : `${a.ageDays} days ago`}</Text>
                  <Text style={[styles.meta, { color: t.sub }]}>·</Text>
                  <Text style={[styles.meta, { color: t.sub }]}>{a.readMins} min read</Text>
                </View>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
      {selectMode && (
        <View style={styles.selBar}>
          <Text style={styles.selCount}>{selected.size} selected</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity onPress={exitSelect} style={styles.cancelBtn}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setConfirmOpen(true)} disabled={selected.size === 0}
              style={[styles.deleteBtn, { backgroundColor: selected.size === 0 ? "#4B5563" : "#EF4444" }]}>
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      <Modal visible={confirmOpen} transparent animationType="fade" onRequestClose={() => setConfirmOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setConfirmOpen(false)}>
          <Pressable style={[styles.modal, { backgroundColor: dark ? "#1E262C" : "#fff" }]} onPress={(e) => e.stopPropagation()}>
            <Text style={[styles.modalTitle, { color: t.text }]}>Are you sure?</Text>
            <Text style={[styles.modalBody, { color: t.sub }]}>This will remove {selected.size} article{selected.size > 1 ? "s" : ""} from your saved shelf.</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setConfirmOpen(false)} style={[styles.modalBtn, { borderColor: t.border, borderWidth: 1 }]}>
                <Text style={{ color: t.text, fontWeight: "700", fontSize: 14 }}>No</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmDelete} style={[styles.modalBtn, { backgroundColor: "#EF4444" }]}>
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>Yes, Delete</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  header: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 14 },
  title: { fontSize: 28, fontWeight: "800", letterSpacing: -0.5 },
  list: { paddingHorizontal: 16, paddingBottom: 120, gap: 10 },
  empty: { alignItems: "center", marginTop: 60 },
  emptyText: { fontSize: 14, textAlign: "center", lineHeight: 22 },
  card: { borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "center", gap: 12 },
  checkbox: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  sourceTag: { fontSize: 11, fontWeight: "700", letterSpacing: 1, marginBottom: 4 },
  cardTitle: { fontSize: 15, fontWeight: "700", lineHeight: 20 },
  metaRow: { flexDirection: "row", gap: 6, marginTop: 6 },
  meta: { fontSize: 12 },
  selBar: { position: "absolute", left: 12, right: 12, bottom: 12, backgroundColor: "#0B0F12", borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between", elevation: 8 },
  selCount: { color: "#fff", fontWeight: "700", fontSize: 14 },
  cancelBtn: { borderWidth: 1, borderColor: "rgba(255,255,255,0.2)", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  cancelText: { color: "#CBD5E1", fontWeight: "700", fontSize: 13 },
  deleteBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  deleteText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center", padding: 24 },
  modal: { borderRadius: 20, padding: 22, width: "100%", maxWidth: 340 },
  modalTitle: { fontSize: 18, fontWeight: "800" },
  modalBody: { fontSize: 14, lineHeight: 21, marginTop: 8 },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 18, justifyContent: "flex-end" },
  modalBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 },
});
