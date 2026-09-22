export type Article = {
  id: string;
  source: string;
  title: string;
  excerpt: string;
  body: string;
  ageDays: number;
  readMins: number;
  tags: string[];
  author: string;
  url: string;
};

export const ALL_SOURCES = [
  "Netflix", "Stripe", "Uber", "Cloudflare",
  "Airbnb", "GitHub", "Datadog", "Figma",
] as const;

export const SOURCE_COLORS: Record<string, string> = {
  Netflix: "#E50914", Stripe: "#635BFF", Uber: "#000000",
  Cloudflare: "#F38020", Airbnb: "#FF5A5F", GitHub: "#24292F",
  Datadog: "#632CA6", Figma: "#F24E1E",
};

export const ARTICLES: Article[] = [
  { id: "a1", source: "Netflix", title: "Scaling the Netflix API to 1B requests/sec", excerpt: "How we rebuilt our edge tier to survive prime-time traffic spikes without a single dropped stream.", ageDays: 2, readMins: 8, tags: ["Architecture","Scale"], author: "Priya Raman", url: "https://netflixtechblog.com/scaling-api", body: "# Scaling the Netflix API\n\nAt peak, the Netflix API tier serves **over 1 billion requests per second** across regional edges.\n\n## Key architecture takeaways\n\n- Edge-first routing via a custom anycast layer\n- Adaptive concurrency limits per service\n- Zero-downtime schema migrations\n\n```ts\nfunction limit(rps: number, latencyP99: number) {\n  const gradient = rps / latencyP99;\n  return Math.max(1, Math.floor(gradient * 0.8));\n}\n```\n\nThe single biggest win was moving serialization to the edge, cutting origin load by 43%." },
  { id: "a2", source: "Stripe", title: "Idempotency keys: a design deep dive", excerpt: "Why every write API needs idempotency, and how to implement it without distributed locks.", ageDays: 5, readMins: 11, tags: ["API","Reliability"], author: "Marcus Lee", url: "https://stripe.com/blog/idempotency", body: "# Idempotency Keys\n\nAn idempotency key lets a client safely retry a request.\n\n## Core rules\n\n1. Keys are scoped per-account\n2. First request wins; later ones replay the cached response\n3. TTL of 24h balances storage vs. safety" },
  { id: "a3", source: "Cloudflare", title: "How we built a 50ms global KV store", excerpt: "Trading consistency for latency: the story behind Workers KV's tiered replication.", ageDays: 1, readMins: 6, tags: ["Edge","Storage"], author: "Dana Cole", url: "https://blog.cloudflare.com/kv", body: "# Global KV in 50ms\n\nWorkers KV replicates to 300+ cities.\n\n## Tradeoffs\n\n- Eventual consistency (up to 60s)\n- Hot data cached at edge\n- Cold reads fall back to central store" },
  { id: "a4", source: "Uber", title: "Real-time matching with H3 geospatial index", excerpt: "Uber's hex-based spatial index powers sub-second driver matching worldwide.", ageDays: 9, readMins: 9, tags: ["Geo","Realtime"], author: "Sofia Marin", url: "https://eng.uber.com/h3", body: "# H3 Geospatial Index\n\nH3 tiles the globe into hexagons.\n\n## Why hexagons?\n\n- Uniform neighbor distance\n- Efficient ring queries\n- No poles distortion" },
  { id: "a5", source: "GitHub", title: "Monorepo at scale: 100M files", excerpt: "How GitHub serves git operations for the world's largest monorepos.", ageDays: 3, readMins: 7, tags: ["Git","Infra"], author: "Tomás Rivera", url: "https://github.blog/monorepo", body: "# Monorepo at Scale\n\nOur largest repo exceeds 100M files.\n\n## Techniques\n\n- Sparse checkout\n- Partial clone (blobless)\n- Commit graph caching" },
  { id: "a6", source: "Figma", title: "Multiplayer editing without conflicts", excerpt: "CRDTs, presence cursors, and the network model behind Figma's real-time canvas.", ageDays: 4, readMins: 10, tags: ["CRDT","Realtime"], author: "Elena Voss", url: "https://figma.com/blog/multiplayer", body: "# Multiplayer Editing\n\nFigma uses a CRDT-inspired model.\n\n## Layers\n\n1. Local optimistic apply\n2. Server merge\n3. Broadcast to peers" },
  { id: "a7", source: "Airbnb", title: "Service-oriented frontend at Airbnb", excerpt: "Breaking the monolith UI into independently deployable micro-frontends.", ageDays: 6, readMins: 8, tags: ["Frontend","Micro"], author: "Raj Patel", url: "https://airbnb.io/sof", body: "# Service-Oriented Frontend\n\nEach team ships its own UI slice.\n\n## Wins\n\n- Independent deploys\n- Clear ownership\n- Faster iteration" },
  { id: "a8", source: "Datadog", title: "Ingesting 1 trillion spans per day", excerpt: "The pipeline architecture that keeps Datadog's observability platform real-time.", ageDays: 7, readMins: 12, tags: ["Observability","Streaming"], author: "Nina Kovacs", url: "https://datadoghq.com/blog/spans", body: "# 1 Trillion Spans / Day\n\nOur ingest pipeline is a multi-stage stream.\n\n## Stages\n\n- Collect\n- Enrich\n- Sample\n- Index" },
];
