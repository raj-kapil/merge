import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import Svg, { Path } from "react-native-svg";
import { Article, SOURCE_COLORS } from "../data/articles";
import { useStore } from "../store";
import { theme } from "../theme";

type Props = { article: Article; onBack: () => void };

export const Reader: React.FC<Props> = ({ article, onBack }) => {
  const { dark, saved, save, unsave, show } = useStore();
  const t = theme(dark);
  const isSaved = !!saved.find((a) => a.id === article.id);
  const handleToggleSave = () => { if (isSaved) { unsave([article.id]); show("Removed from saved"); } else { save(article); show(`Saved · ${article.source}`); } };
  const handleCopy = async () => { await Clipboard.setStringAsync(article.url); show("Link copied"); };

  const renderBody = (body: string) => {
    const lines = body.split("\n");
    const out: React.ReactNode[] = [];
    let inCode = false; let codeBuf: string[] = []; let key = 0;
    const flush = () => { if (!codeBuf.length) return; out.push(<View key={`c${key++}`} style={styles.codeBlock}><Text style={styles.codeText}>{codeBuf.join("\n")}</Text></View>); codeBuf = []; };
    lines.forEach((line) => {
      if (line.startsWith("```")) { if (inCode) { flush(); inCode = false; } else inCode = true; return; }
      if (inCode) { codeBuf.push(line); return; }
      if (line.startsWith("# ")) out.push(<Text key={`h${key++}`} style={[styles.h1, { color: t.text }]}>{line.slice(2)}</Text>);
      else if (line.startsWith("## ")) out.push(<Text key={`h${key++}`} style={[styles.h2, { color: t.text }]}>{line.slice(3)}</Text>);
      else if (line.startsWith("- ")) out.push(<Text key={`l${key++}`} style={[styles.bullet, { color: t.text }]}>• {line.slice(2)}</Text>);
      else if (/^\d+\./.test(line)) out.push(<Text key={`l${key++}`} style={[styles.bullet, { color: t.text }]}>{line}</Text>);
      else if (line.trim() === "") out.push(<View key={`s${key++}`} style={{ height: 8 }} />);
      else out.push(<Text key={`p${key++}`} style={[styles.body, { color: t.text }]}>{line}</Text>);
    });
    flush(); return out;
  };

  return (
    <View style={[styles.wrap, { backgroundColor: t.bg }]}>
      <View style={[styles.topBar, { borderBottomColor: t.border }]}>
        <TouchableOpacity onPress={onBack} hitSlop={10} style={styles.iconBtn}>
          <Svg width={22} height={22} viewBox="0 0 24 24"><Path d="M15 18l-6-6 6-6" stroke={t.text} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" fill="none" /></Svg>
        </TouchableOpacity>
        <Text style={[styles.sourceName, { color: t.sub }]}>{article.source}</Text>
        <View style={{ flexDirection: "row", gap: 4 }}>
          <TouchableOpacity onPress={handleToggleSave} hitSlop={10} style={styles.iconBtn}>
            <Svg width={20} height={20} viewBox="0 0 24 24"><Path d="M6 4h12v16l-6-4-6 4V4z" stroke={isSaved ? "#10B981" : t.text} fill={isSaved ? "#10B981" : "none"} strokeWidth={2} strokeLinejoin="round" /></Svg>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleCopy} hitSlop={10} style={styles.iconBtn}>
            <Svg width={20} height={20} viewBox="0 0 24 24">
              <Path d="M10 13a5 5 0 007 0l3-3a5 5 0 00-7-7l-1 1" stroke={t.text} strokeWidth={2} strokeLinecap="round" fill="none" />
              <Path d="M14 11a5 5 0 00-7 0l-3 3a5 5 0 007 7l1-1" stroke={t.text} strokeWidth={2} strokeLinecap="round" fill="none" />
            </Svg>
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sourceTag, { color: SOURCE_COLORS[article.source] || t.sub }]}>{article.source.toUpperCase()}</Text>
        {renderBody(article.body)}
        <View style={[styles.authorCard, { backgroundColor: dark ? "#141A1F" : "#F6F8FA" }]}>
          <View style={[styles.avatar, { backgroundColor: SOURCE_COLORS[article.source] || "#333" }]}><Text style={styles.avatarText}>{article.author[0]}</Text></View>
          <View>
            <Text style={[styles.authorName, { color: t.text }]}>{article.author}</Text>
            <Text style={[styles.authorMeta, { color: t.sub }]}>{article.ageDays === 1 ? "1 day ago" : `${article.ageDays} days ago`} · {article.readMins} min read</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.openOriginal} onPress={handleCopy} activeOpacity={0.85}>
          <Text style={styles.openOriginalText}>Open original</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1 },
  iconBtn: { padding: 8 },
  sourceName: { fontSize: 13, fontWeight: "700" },
  content: { paddingHorizontal: 22, paddingTop: 18, paddingBottom: 40 },
  sourceTag: { fontSize: 11, fontWeight: "800", letterSpacing: 1.4, marginBottom: 8 },
  h1: { fontSize: 26, fontWeight: "800", letterSpacing: -0.5, marginTop: 18, marginBottom: 6 },
  h2: { fontSize: 18, fontWeight: "800", marginTop: 20, marginBottom: 8 },
  body: { fontSize: 15.5, lineHeight: 26, marginVertical: 8 },
  bullet: { fontSize: 15, lineHeight: 25, marginLeft: 12, marginVertical: 3 },
  codeBlock: { backgroundColor: "#0B0F12", borderRadius: 12, padding: 14, marginVertical: 12 },
  codeText: { color: "#D1FAE5", fontFamily: "Courier", fontSize: 12.5, lineHeight: 19 },
  authorCard: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 28, padding: 14, borderRadius: 14 },
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  authorName: { fontSize: 14, fontWeight: "700" },
  authorMeta: { fontSize: 12, marginTop: 2 },
  openOriginal: { marginTop: 18, backgroundColor: "#10B981", paddingVertical: 14, borderRadius: 14, alignItems: "center" },
  openOriginalText: { color: "#fff", fontWeight: "800", fontSize: 15 },
});
