import { ALL_SOURCES, Article, Source } from "../domain/types";
import { SOURCE_DEFAULT_IMAGES } from "./articles";
import {
  calculatePopularityScore,
  capArticlesPerSource,
  interleaveSourceArticles,
  isWithinSixMonths,
  MAX_BLOGS_PER_SOURCE,
  SIX_MONTHS_DAYS,
  SIX_MONTHS_MS,
} from "../domain/articleRules";
import { htmlToMarkdown, stripHtmlTags } from "../utils/htmlToMarkdown";

export { SIX_MONTHS_DAYS, SIX_MONTHS_MS, MAX_BLOGS_PER_SOURCE, htmlToMarkdown };

interface RSSItem {
  title?: string;
  link?: string;
  guid?: string;
  pubDate?: string;
  categories?: string[];
  author?: string;
  thumbnail?: string;
  description?: string;
  content?: string;
}

interface RSS2JSONResponse {
  status: string;
  feed?: {
    title?: string;
    url?: string;
    link?: string;
  };
  items?: RSSItem[];
}

export const RSS_FEEDS: Record<string, string> = {
  Netflix: "https://netflixtechblog.com/feed",
  Cloudflare: "https://blog.cloudflare.com/rss/",
  GitHub: "https://github.blog/engineering/feed/",
  Airbnb: "https://medium.com/feed/airbnb-engineering",
  Datadog: "https://www.datadoghq.com/blog/engineering/index.xml",
  Figma: "https://www.figma.com/blog/feed/atom.xml",
  Stripe: "https://stripe.com/blog/feed.rss",
};

const UBER_API_URL = "https://www.uber.com/api/getRelatedPages";
const ENGINEERING_CATEGORY_ID = "add2dbca-fda9-41d4-9a47-8ca0529aaa88";
const REQUEST_TIMEOUT_MS = 9000;

const UBER_CATEGORY_MAP: Record<string, string> = {
  "add2dbca-fda9-41d4-9a47-8ca0529aaa88": "Engineering",
  "b374768e-489f-42d5-913d-269fbb44a44b": "Backend",
  "d292598b-288a-4104-bdb3-887acea2e1cc": "AI / ML",
  "803de10c-77ca-4a77-9ad2-8dc5b4895b7b": "Data",
  "846fa62a-fde5-4c19-beea-988b2ca5f16b": "Mobile",
  "16c6ef99-f647-4fb4-85c7-640bd66dee23": "Web",
  "765c7383-a55f-4332-9210-20910040800f": "Security",
  "b4a35e46-acd0-4a59-a55d-adaf0b367d2a": "Culture",
  "0bf657bb-dd5b-4659-b33b-e55cb88324b6": "Publications",
  "fcbeef20-f044-4b60-b8b4-4d2ffc92354d": "Architecture",
};

/**
 * Executes a fetch request with an automatic timeout.
 */
async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

/**
 * Extracts a high-resolution hero image from HTML content or item thumbnail.
 */
function extractHeroImage(item: RSSItem, defaultImg: string): string {
  if (item.thumbnail && !item.thumbnail.includes("avatar") && !item.thumbnail.includes("icon")) {
    return item.thumbnail;
  }
  const content = item.content || item.description || "";
  const match = content.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (match && match[1] && !match[1].includes("stat?event=") && !match[1].includes("icon")) {
    return match[1];
  }
  return defaultImg;
}

/**
 * Fetch and parse RSS/Atom articles for a given source.
 * Filters strictly to the last 6 months, scores popularity, and limits to top 10.
 */
export async function fetchRssSourceArticles(source: Source, feedUrl: string): Promise<Article[]> {
  try {
    const rss2jsonUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`;
    const res = await fetchWithTimeout(rss2jsonUrl);
    if (!res.ok) {
      throw new Error(`Failed to fetch RSS for ${source}: HTTP ${res.status}`);
    }

    const data: RSS2JSONResponse = await res.json();
    if (!data.items || data.items.length === 0) {
      return [];
    }

    const now = Date.now();
    const candidateArticles: Article[] = [];

    for (let idx = 0; idx < data.items.length; idx++) {
      const item = data.items[idx];
      if (!item.title) continue;

      // Date check: strictly within last 6 months (183 days)
      let pubTime = now;
      let ageDays = 1;
      if (item.pubDate) {
        const parsed = new Date(item.pubDate).getTime();
        if (!isNaN(parsed)) {
          pubTime = parsed;
          ageDays = Math.max(1, Math.floor((now - pubTime) / (1000 * 60 * 60 * 24)));
        }
      }

      if (!isWithinSixMonths(ageDays)) {
        continue;
      }

      const cleanTitle = stripHtmlTags(item.title);
      const rawContent = item.content || item.description || "";
      let markdownBody = htmlToMarkdown(rawContent);

      const rawExcerpt = item.description || rawContent;
      let cleanExcerpt = stripHtmlTags(rawExcerpt).replace(/\s+/g, " ");
      if (cleanExcerpt.length > 220) {
        cleanExcerpt = `${cleanExcerpt.slice(0, 217).trim()}...`;
      }

      // If body is short, supplement with title, author, and excerpt
      if (markdownBody.length < 150) {
        markdownBody = `# ${cleanTitle}\n\n*By ${item.author || source} · ${source} Engineering*\n\n${cleanExcerpt}\n\nRead the full post and explore architectural discussions on [${source} Engineering](${item.link || feedUrl}).`;
      }

      const tags = (item.categories || [])
        .map((cat) => stripHtmlTags(cat).replace(/^[#\s]+/, ""))
        .filter((cat) => cat.length > 1 && cat.length < 24)
        .slice(0, 5);

      if (tags.length === 0) {
        tags.push("Engineering", "Tech");
      }

      const wordCount = (rawContent || "").split(/\s+/).length;
      const readMins = Math.max(4, Math.min(22, Math.round(wordCount / 180)));
      const popularityScore = calculatePopularityScore(cleanTitle, cleanExcerpt, tags, ageDays, readMins);
      const fallbackImg = SOURCE_DEFAULT_IMAGES[source] || SOURCE_DEFAULT_IMAGES.Netflix;
      const imageUrl = extractHeroImage(item, fallbackImg);

      candidateArticles.push({
        id: `rss_${source.toLowerCase()}_${idx}_${item.guid ? encodeURIComponent(item.guid).slice(-8) : idx}`,
        source,
        title: cleanTitle,
        excerpt: cleanExcerpt,
        body: markdownBody,
        ageDays,
        readMins,
        tags,
        author: item.author || `${source} Engineering`,
        url: item.link || feedUrl,
        publishedAt: item.pubDate,
        popularityScore,
        imageUrl,
      });
    }

    // Sort by popularity score descending and cap at 10 blogs
    candidateArticles.sort((a, b) => (b.popularityScore || 0) - (a.popularityScore || 0));
    return candidateArticles.slice(0, MAX_BLOGS_PER_SOURCE);
  } catch (err) {
    console.warn(`Failed to fetch RSS for ${source}:`, err);
    return [];
  }
}

/**
 * Fetch and parse Uber Engineering articles via official Uber relatedPages API.
 */
export async function fetchUberArticles(): Promise<Article[]> {
  try {
    const payload = {
      pageType: "blog",
      requestingFullUrl: "https://www.uber.com/in/en/blog/engineering/",
      limit: 25,
      categoryFilters: [ENGINEERING_CATEGORY_ID],
    };

    const res = await fetchWithTimeout(UBER_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Uber API responded with HTTP ${res.status}`);
    }

    const data = await res.json();
    const relatedPages = data?.data?.relatedPages || [];
    if (relatedPages.length === 0) return [];

    const now = Date.now();
    const candidateArticles: Article[] = [];

    for (let idx = 0; idx < relatedPages.length; idx++) {
      const page = relatedPages[idx];
      if (!page.title) continue;

      let ageDays = 1;
      if (page.publishedAt) {
        const parsed = new Date(page.publishedAt).getTime();
        if (!isNaN(parsed)) {
          ageDays = Math.max(1, Math.floor((now - parsed) / (1000 * 60 * 60 * 24)));
        }
      }

      if (!isWithinSixMonths(ageDays)) {
        continue;
      }

      const cleanTitle = stripHtmlTags(page.title);
      const cleanExcerpt = stripHtmlTags(page.description || page.subTitle || "").replace(/\s+/g, " ");

      const tags = (page.categoryIds || [])
        .map((catId: string) => UBER_CATEGORY_MAP[catId])
        .filter(Boolean)
        .slice(0, 4);

      if (tags.length === 0) {
        tags.push("Engineering", "Uber");
      }

      let cleanUrl = page.fullURL || "";
      if (cleanUrl.startsWith("/")) {
        cleanUrl = `https://www.uber.com${cleanUrl}`;
      } else if (!cleanUrl.startsWith("http")) {
        cleanUrl = `https://www.uber.com/blog/engineering/${cleanUrl}`;
      }

      const readMins = Math.max(5, Math.min(18, Math.round((page.description?.length || 200) / 30) + 4));
      const popularityScore = calculatePopularityScore(cleanTitle, cleanExcerpt, tags, ageDays, readMins);

      let markdownBody = `# ${cleanTitle}\n\n*By Uber Engineering · ${ageDays === 1 ? "1 day ago" : `${ageDays} days ago`} · ${readMins} min read*\n\n${cleanExcerpt}\n\n`;
      if (page.ogImageURL) {
        markdownBody += `![${cleanTitle}](${page.ogImageURL})\n\n`;
      }
      markdownBody += `## Overview\n\nUber's engineering team solves large-scale distributed computing challenges spanning autonomous mobility, real-time routing algorithms, fraud detection models, and multi-region microservice resilience.\n\nExplore full technical deep dives and code on [Uber Engineering](${cleanUrl}).`;

      candidateArticles.push({
        id: `uber_${page.id || idx}`,
        source: "Uber",
        title: cleanTitle,
        excerpt: cleanExcerpt,
        body: markdownBody,
        ageDays,
        readMins,
        tags,
        author: "Uber Engineering",
        url: cleanUrl,
        publishedAt: page.publishedAt,
        popularityScore,
        imageUrl: page.ogImageURL || SOURCE_DEFAULT_IMAGES.Uber,
      });
    }

    candidateArticles.sort((a, b) => (b.popularityScore || 0) - (a.popularityScore || 0));
    return candidateArticles.slice(0, MAX_BLOGS_PER_SOURCE);
  } catch (err) {
    console.warn("Failed to fetch live Uber articles:", err);
    return [];
  }
}

/**
 * Fetch top popular blogs for all enabled sources within the last 6 months.
 * Returns up to 10 blogs per enabled source interleaved for a diverse feed.
 */
export async function fetchAllSourcesArticles(
  enabledSources: Set<string> = new Set(ALL_SOURCES)
): Promise<Article[]> {
  const fetchPromises: Promise<Article[]>[] = [];

  for (const source of ALL_SOURCES) {
    if (!enabledSources.has(source)) continue;

    if (source === "Uber") {
      fetchPromises.push(fetchUberArticles());
    } else if (RSS_FEEDS[source]) {
      fetchPromises.push(fetchRssSourceArticles(source, RSS_FEEDS[source]));
    }
  }

  const results = await Promise.allSettled(fetchPromises);
  const collectedArticles: Article[] = [];

  for (const res of results) {
    if (res.status === "fulfilled" && res.value.length > 0) {
      collectedArticles.push(...res.value);
    }
  }

  return interleaveSourceArticles(collectedArticles, ALL_SOURCES, MAX_BLOGS_PER_SOURCE);
}
