export interface MarkdownToken {
  type: "text" | "link" | "bold" | "italic" | "code";
  content: string;
  url?: string;
}

export function stripMarkdown(raw: string): string {
  if (!raw) return "";
  return raw
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/[*_~`#]/g, "")
    .trim();
}

export function parseMarkdownTokens(rawText: string): MarkdownToken[] {
  if (!rawText) return [];
  const tokens: MarkdownToken[] = [];
  // Matches [label](url), `code`, **bold**, __bold__, *italic*, _italic_, https?://...
  const regex = /(\[[^\]]+\]\([^)]+\)|`[^`]+`|\*\*(?:[^*]|\*(?!\*))+\*\*|__(?:[^_]|_(?!_))+__|\*[^*\n]+\*|_[^_\n]+_|https?:\/\/[^\s<>)"]+)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(rawText)) !== null) {
    if (match.index > lastIndex) {
      const chunk = rawText.substring(lastIndex, match.index).replace(/\*{2,}|_{2,}/g, "");
      if (chunk) {
        tokens.push({
          type: "text",
          content: chunk,
        });
      }
    }

    const tokenStr = match[0];
    if (tokenStr.startsWith("[") && tokenStr.includes("](")) {
      const linkMatch = tokenStr.match(/^\[(.*?)\]\((.*?)\)$/);
      if (linkMatch) {
        tokens.push({
          type: "link",
          content: linkMatch[1].replace(/\*\*|__/g, ""),
          url: linkMatch[2],
        });
      } else {
        tokens.push({ type: "text", content: tokenStr });
      }
    } else if (tokenStr.startsWith("`") && tokenStr.endsWith("`")) {
      tokens.push({ type: "code", content: tokenStr.slice(1, -1) });
    } else if (
      (tokenStr.startsWith("**") && tokenStr.endsWith("**")) ||
      (tokenStr.startsWith("__") && tokenStr.endsWith("__"))
    ) {
      const boldInner = tokenStr.slice(2, -2).trim();
      if (boldInner) {
        tokens.push({ type: "bold", content: boldInner });
      }
    } else if (
      (tokenStr.startsWith("*") && tokenStr.endsWith("*")) ||
      (tokenStr.startsWith("_") && tokenStr.endsWith("_"))
    ) {
      const italicInner = tokenStr.slice(1, -1).trim();
      if (italicInner) {
        tokens.push({ type: "italic", content: italicInner });
      }
    } else if (tokenStr.startsWith("http")) {
      tokens.push({ type: "link", content: tokenStr, url: tokenStr });
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < rawText.length) {
    const trailingChunk = rawText.substring(lastIndex).replace(/\*{2,}|_{2,}/g, "");
    if (trailingChunk) {
      tokens.push({
        type: "text",
        content: trailingChunk,
      });
    }
  }

  return tokens;
}
