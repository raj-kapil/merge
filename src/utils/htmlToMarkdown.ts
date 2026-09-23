/**
 * Pure HTML to Markdown conversion utility.
 * Transforms rich HTML from RSS feeds and API payloads into clean, readable Markdown.
 */

// Unescape standard HTML entities
export function decodeHtmlEntities(str: string): string {
  if (!str) return "";
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&#8217;/g, "’")
    .replace(/&#8216;/g, "‘")
    .replace(/&#8220;/g, "“")
    .replace(/&#8221;/g, "”")
    .replace(/&#8212;/g, "—")
    .replace(/&#8211;/g, "–")
    .replace(/&#(\d+);/g, (_m, dec) => {
      try {
        return String.fromCharCode(parseInt(dec, 10));
      } catch {
        return _m;
      }
    })
    .replace(/&#x([0-9a-f]+);/gi, (_m, hex) => {
      try {
        return String.fromCharCode(parseInt(hex, 16));
      } catch {
        return _m;
      }
    });
}

/**
 * Strips raw HTML tags from a string.
 */
export function stripHtmlTags(html: string): string {
  if (!html) return "";
  return decodeHtmlEntities(html.replace(/<[^>]*>/g, "")).trim();
}

/**
 * Converts rich HTML content into clean, formatted Markdown.
 * Preserves headings, code blocks, bullet points, quotes, images, links, bold, and paragraphs.
 */
export function htmlToMarkdown(html: string): string {
  if (!html) return "";
  let md = html;

  // 1. Remove dangerous or non-content tags
  md = md.replace(/<script[\s\S]*?<\/script>/gi, "");
  md = md.replace(/<style[\s\S]*?<\/style>/gi, "");
  md = md.replace(/<noscript[\s\S]*?<\/noscript>/gi, "");

  // 2. Format Headings
  md = md.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, "\n\n# $1\n\n");
  md = md.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, "\n\n## $1\n\n");
  md = md.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, "\n\n### $1\n\n");
  md = md.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, "\n\n#### $1\n\n");

  // 3. Format Code Blocks
  md = md.replace(
    /<pre[^>]*><code(?:[^>]*class=["'][^"']*(?:lang(?:uage)?-)?([a-z0-9_-]+)[^"']*["'])?[^>]*>([\s\S]*?)<\/code><\/pre>/gi,
    (_m, lang, code) => {
      const cleanCode = stripHtmlTags(code).trim();
      return `\n\n\`\`\`${lang || ""}\n${cleanCode}\n\`\`\`\n\n`;
    }
  );
  md = md.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, (_m, code) => {
    const cleanCode = stripHtmlTags(code).trim();
    return `\n\n\`\`\`\n${cleanCode}\n\`\`\`\n\n`;
  });
  md = md.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, (_m, inline) => {
    return `\`${stripHtmlTags(inline)}\``;
  });

  // 4. Format Figures & Images
  md = md.replace(
    /<figure[^>]*>[\s\S]*?<img[^>]+src=["']([^"']+)["'][^>]*>[\s\S]*?<figcaption[^>]*>([\s\S]*?)<\/figcaption>[\s\S]*?<\/figure>/gi,
    (_m, src, cap) => {
      const cleanCap = stripHtmlTags(cap);
      return `\n\n![${cleanCap}](${src})\n\n`;
    }
  );

  md = md.replace(
    /<img[^>]+(?:src=["']([^"']+)["'][^>]*alt=["']([^"']*)["']|alt=["']([^"']*)["'][^>]*src=["']([^"']+)["']|src=["']([^"']+)["'])[^>]*>/gi,
    (_m, s1, a1, a2, s2, s3) => {
      const src = s1 || s2 || s3 || "";
      const alt = a1 || a2 || "";
      if (!src) return "";
      return `\n\n![${alt}](${src})\n\n`;
    }
  );

  // 5. Format Links: <a href="url">text</a> -> [text](url)
  md = md.replace(/<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (_m, url, text) => {
    const cleanText = stripHtmlTags(text).trim();
    if (!cleanText) return "";
    return `[${cleanText}](${url})`;
  });

  // 6. Format Bold & Italic
  md = md.replace(/<(?:strong|b)[^>]*>([\s\S]*?)<\/(?:strong|b)>/gi, "**$1**");
  md = md.replace(/<(?:em|i)[^>]*>([\s\S]*?)<\/(?:em|i)>/gi, "*$1*");

  // 7. Format Lists
  md = md.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, "\n- $1");
  md = md.replace(/<\/ul>|<\/ol>/gi, "\n\n");

  // 8. Format Blockquotes & Dividers
  md = md.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, "\n\n> $1\n\n");
  md = md.replace(/<hr\s*\/?>/gi, "\n\n---\n\n");

  // 9. Format Paragraphs & Line Breaks
  md = md.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, "\n\n$1\n\n");
  md = md.replace(/<br\s*\/?>/gi, "\n");

  // 10. Clean up any remaining container tags
  md = md.replace(/<\/?(div|span|section|article|header|footer|aside|nav|main|table|thead|tbody|tr|td|th)[^>]*>/gi, " ");

  // 11. Strip any other raw HTML tags leftover
  md = md.replace(/<[^>]+>/g, "");

  // 12. Unescape entities
  md = decodeHtmlEntities(md);

  // 13. Normalize whitespace and blank lines
  md = md.replace(/[ \t]+/g, " ");
  md = md.replace(/\n\s+\n/g, "\n\n");
  md = md.replace(/\n{3,}/g, "\n\n").trim();

  return md;
}
