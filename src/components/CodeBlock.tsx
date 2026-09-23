import React, { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import Svg, { Path } from "react-native-svg";

interface CodeBlockProps {
  code: string;
  language?: string;
}

// Unescape standard HTML entities that may be present in RSS or Markdown feeds
function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, " ");
}

// Map short language identifiers to clean display names
function formatLanguage(lang?: string, codeText: string = ""): string {
  const l = (lang || "").toLowerCase().trim();
  if (l === "ts" || l === "tsx" || l === "typescript") return "TypeScript";
  if (l === "js" || l === "jsx" || l === "javascript") return "JavaScript";
  if (l === "http") return "HTTP";
  if (l === "py" || l === "python") return "Python";
  if (l === "sql") return "SQL";
  if (l === "json") return "JSON";
  if (l === "bash" || l === "sh" || l === "shell" || l === "zsh") return "Bash";
  if (l === "go" || l === "golang") return "Go";
  if (l === "rust" || l === "rs") return "Rust";
  if (l === "html") return "HTML";
  if (l === "css") return "CSS";
  if (l === "yaml" || l === "yml") return "YAML";
  if (l) return l.toUpperCase();

  // Heuristic auto-detection if no language tag was supplied
  if (/^(POST|GET|PUT|DELETE|PATCH)\s+\//i.test(codeText)) return "HTTP";
  if (/\b(function|const|let|=>|interface|type)\b/.test(codeText)) return "TypeScript";
  if (/\b(SELECT|FROM|WHERE|INSERT|UPDATE)\b/i.test(codeText)) return "SQL";
  if (/^\s*[{[]/.test(codeText) && /[}\]]\s*$/.test(codeText)) return "JSON";
  if (/\b(def |import .* from |print\()/.test(codeText)) return "Python";
  return "Code";
}

// Tokenizer regular expression for syntax highlighting
const TOKEN_REGEX =
  /(\/\/[^\n]*|#[^\n]*)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|(\b(?:function|const|let|var|return|if|else|for|while|async|await|import|export|from|class|interface|type|extends|implements|public|private|new|switch|case|default|break|try|catch|finally|throw|typeof|instanceof|def|fn|struct|impl|pub|select|where|insert|update|delete|join|group|order|by|POST|GET|PUT|DELETE|PATCH|HEAD)\b)|(\b(?:string|number|boolean|void|null|undefined|true|false|any|unknown|never|int|float|None|self|this|Promise|Record|Array|Map|Set|UUID|Header|Request|Response)\b)|(\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b)|(\b[a-zA-Z_$][a-zA-Z0-9_$]*(?=\s*\())|(=>|===|!==|==|!=|<=|>=|\+\+|--|\+=|-=|\*=|&&|\|\||[-+*/%=<>!&|^~?:;,{}()[\]])|([a-zA-Z_$][a-zA-Z0-9_$]*)|(\s+)|(.)/g;

interface Token {
  kind:
    | "comment"
    | "string"
    | "keyword"
    | "type"
    | "number"
    | "function"
    | "operator"
    | "identifier"
    | "space"
    | "other";
  text: string;
}

function tokenizeLine(line: string): Token[] {
  const tokens: Token[] = [];
  TOKEN_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = TOKEN_REGEX.exec(line)) !== null) {
    const [full, comment, str, kw, type, num, fn, op, id, ws] = match;
    let kind: Token["kind"] = "other";
    if (comment) kind = "comment";
    else if (str) kind = "string";
    else if (kw) kind = "keyword";
    else if (type) kind = "type";
    else if (num) kind = "number";
    else if (fn) kind = "function";
    else if (op) kind = "operator";
    else if (id) kind = "identifier";
    else if (ws) kind = "space";

    tokens.push({ kind, text: full });
  }

  if (tokens.length === 0 && line.length > 0) {
    tokens.push({ kind: "other", text: line });
  }

  return tokens;
}

function getTokenStyle(kind: Token["kind"]) {
  switch (kind) {
    case "comment":
      return styles.tokComment;
    case "string":
      return styles.tokString;
    case "keyword":
      return styles.tokKeyword;
    case "type":
      return styles.tokType;
    case "number":
      return styles.tokNumber;
    case "function":
      return styles.tokFunction;
    case "operator":
      return styles.tokOperator;
    case "identifier":
      return styles.tokIdentifier;
    default:
      return styles.tokDefault;
  }
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);
  const cleanCode = decodeHtmlEntities(code).replace(/^\n+|\n+$/g, "");
  const lines = cleanCode.split("\n");
  const displayLang = formatLanguage(language, cleanCode);

  const handleCopy = async () => {
    try {
      await Clipboard.setStringAsync(cleanCode);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const gutterWidth = Math.max(32, String(lines.length).length * 8 + 16);

  return (
    <View style={styles.container}>
      {/* Editor Window Chrome Titlebar */}
      <View style={styles.titlebar}>
        <View style={styles.macControls}>
          <View style={[styles.macDot, { backgroundColor: "#FF5F56" }]} />
          <View style={[styles.macDot, { backgroundColor: "#FFBD2E" }]} />
          <View style={[styles.macDot, { backgroundColor: "#27C93F" }]} />
        </View>

        <View style={styles.langBadge}>
          <Text style={styles.langText}>{displayLang}</Text>
        </View>

        <TouchableOpacity
          onPress={handleCopy}
          activeOpacity={0.7}
          style={[styles.copyButton, copied && styles.copyButtonActive]}
          accessibilityLabel="Copy code snippet to clipboard"
        >
          {copied ? (
            <>
              <Svg width={12} height={12} viewBox="0 0 24 24" style={{ marginRight: 4 }}>
                <Path
                  d="M20 6L9 17l-5-5"
                  stroke="#3FB950"
                  strokeWidth={2.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </Svg>
              <Text style={styles.copiedText}>Copied!</Text>
            </>
          ) : (
            <>
              <Svg width={12} height={12} viewBox="0 0 24 24" style={{ marginRight: 4 }}>
                <Path
                  d="M8 4v12a2 2 0 002 2h8a2 2 0 002-2V7.242a2 2 0 00-.602-1.43L16.08 2.5a2 2 0 00-1.414-.5H10a2 2 0 00-2 2z"
                  stroke="#8B949E"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
                <Path
                  d="M16 18v2a2 2 0 01-2 2H6a2 2 0 01-2-2V9a2 2 0 012-2h2"
                  stroke="#8B949E"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </Svg>
              <Text style={styles.copyText}>Copy</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Editor Body with Gutter & Horizontal Scroll */}
      <View style={styles.editorBody}>
        {/* Pinned Gutter for Line Numbers */}
        <View style={[styles.gutter, { width: gutterWidth }]}>
          {lines.map((_, i) => (
            <Text key={i} style={styles.lineNumber} numberOfLines={1}>
              {i + 1}
            </Text>
          ))}
        </View>

        {/* Code Content Area */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.codeScrollView}
          contentContainerStyle={styles.codeScrollContent}
        >
          <View style={styles.linesColumn}>
            {lines.map((line, lineIdx) => {
              const tokens = tokenizeLine(line);
              return (
                <View key={lineIdx} style={styles.codeLine}>
                  {tokens.length === 0 || line === "" ? (
                    <Text style={styles.tokDefault}> </Text>
                  ) : (
                    tokens.map((tok, tokIdx) => (
                      <Text
                        key={tokIdx}
                        style={[styles.baseFont, getTokenStyle(tok.kind)]}
                      >
                        {tok.text}
                      </Text>
                    ))
                  )}
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const CODE_FONT =
  Platform.OS === "ios"
    ? "Menlo"
    : Platform.OS === "web"
    ? "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
    : "monospace";

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#0D1117",
    borderRadius: 12,
    marginVertical: 14,
    borderWidth: 1,
    borderColor: "#30363D",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  titlebar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#161B22",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: "#21262D",
  },
  macControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  macDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  langBadge: {
    backgroundColor: "#21262D",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#30363D",
  },
  langText: {
    color: "#58A6FF",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#21262D",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#30363D",
  },
  copyButtonActive: {
    borderColor: "#238636",
    backgroundColor: "#0F2D1A",
  },
  copyText: {
    color: "#8B949E",
    fontSize: 11,
    fontWeight: "600",
  },
  copiedText: {
    color: "#3FB950",
    fontSize: 11,
    fontWeight: "700",
  },
  editorBody: {
    flexDirection: "row",
    backgroundColor: "#0D1117",
    paddingVertical: 10,
  },
  gutter: {
    paddingRight: 8,
    paddingLeft: 6,
    borderRightWidth: 1,
    borderRightColor: "#21262D",
    alignItems: "flex-end",
  },
  lineNumber: {
    fontFamily: CODE_FONT,
    fontSize: 12,
    lineHeight: 21,
    color: "#484F58",
    textAlign: "right",
  },
  codeScrollView: {
    flex: 1,
  },
  codeScrollContent: {
    paddingLeft: 12,
    paddingRight: 18,
  },
  linesColumn: {
    flexDirection: "column",
  },
  codeLine: {
    flexDirection: "row",
    flexWrap: "nowrap",
    height: 21,
    alignItems: "center",
  },
  baseFont: {
    fontFamily: CODE_FONT,
    fontSize: 12.5,
    lineHeight: 21,
  },
  tokDefault: {
    fontFamily: CODE_FONT,
    fontSize: 12.5,
    lineHeight: 21,
    color: "#E6EDF3",
  },
  tokComment: {
    color: "#8B949E",
    fontStyle: "italic",
  },
  tokString: {
    color: "#A5D6FF",
  },
  tokKeyword: {
    color: "#FF7B72",
    fontWeight: "700",
  },
  tokType: {
    color: "#79C0FF",
  },
  tokNumber: {
    color: "#FFA657",
  },
  tokFunction: {
    color: "#D2A8FF",
  },
  tokOperator: {
    color: "#C9D1D9",
  },
  tokIdentifier: {
    color: "#E6EDF3",
  },
});
