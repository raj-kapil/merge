import { ALL_SOURCES, Article, Source } from "../domain/types";
export { ALL_SOURCES, Article, Source };

export const SOURCE_COLORS: Record<string, string> = {
  Netflix: "#E50914", Stripe: "#635BFF", Uber: "#000000",
  Cloudflare: "#F38020", Airbnb: "#FF5A5F", GitHub: "#24292F",
  Datadog: "#632CA6", Figma: "#F24E1E",
};

export const SOURCE_DEFAULT_IMAGES: Record<string, string> = {
  Netflix: "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=800&auto=format&fit=crop&q=80",
  Stripe: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&auto=format&fit=crop&q=80",
  Uber: "https://images.unsplash.com/photo-1508974239320-0a029497e820?w=800&auto=format&fit=crop&q=80",
  Cloudflare: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=80",
  Airbnb: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop&q=80",
  GitHub: "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=800&auto=format&fit=crop&q=80",
  Datadog: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80",
  Figma: "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=800&auto=format&fit=crop&q=80",
};

export const ARTICLES: Article[] = [
  {
    id: "a1",
    source: "Netflix",
    title: "Scaling the Netflix API to 1B requests/sec",
    excerpt: "How we rebuilt our edge tier to survive prime-time traffic spikes without a single dropped stream. Read our architectural breakdown on [distributed routing](https://netflixtechblog.com) and edge failover.",
    ageDays: 2,
    readMins: 8,
    tags: ["Architecture", "Scale", "Edge"],
    author: "Priya Raman",
    url: "https://netflixtechblog.com/scaling-api",
    publishedAt: "2026-09-21T14:00:00Z",
    popularityScore: 98,
    imageUrl: SOURCE_DEFAULT_IMAGES.Netflix,
    body: `# Scaling the Netflix API to 1B requests/sec

*By Priya Raman · Netflix Technology Blog · 2 days ago · 8 min read*

At global peak, the Netflix API tier serves **over 1 billion requests per second** across regional edges without dropping a single frame of video playback. Surviving prime-time traffic surges while deploying dozens of microservice updates hourly required fundamentally re-architecting our edge infrastructure.

![Netflix Global Edge Routing Architecture](https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&auto=format&fit=crop&q=80)

## 1. Edge-First Anycast Routing
Historically, clients hit DNS-resolved regional gateways. Under intense regional ISP degradation or sudden localized traffic spikes, this caused hot spots and cascading timeouts. We transitioned to a distributed Anycast BGP tier terminating TLS within 15 milliseconds of 98% of our worldwide subscriber base.

- **Dynamic Ingress**: Ingress proxies terminate HTTP/2 and HTTP/3 multiplexing at the border.
- **Header Stripping & Compression**: Payload metadata is normalized before forwarding across our dedicated backbone via [Zuul Gateway](https://github.com/Netflix/zuul).
- **Adaptive Concurrency**: Rather than static thread limits, each backend cluster negotiates concurrency windows dynamically based on measured round-trip time.

![Adaptive Concurrency Control Flowchart](https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=1200&auto=format&fit=crop&q=80)

## 2. Adaptive Concurrency Control
Static concurrency limits inevitably fail during sudden degradation: if downstream latencies double, fixed queue depths trigger tail-latency blowups. We implemented gradient-based concurrency limits:

\`\`\`ts
function calculateConcurrencyLimit(currentRps: number, p99Latency: number, targetLatency: number): number {
  const gradient = targetLatency / Math.max(1, p99Latency);
  const adjustedRps = currentRps * Math.min(1.5, Math.max(0.5, gradient));
  return Math.max(10, Math.floor(adjustedRps * 0.85));
}
\`\`\`

When downstream services experience GC pauses or database contention, the edge gracefully throttles non-essential background requests (such as personalized rows below the fold) to preserve core playback start tokens.

## 3. Zero-Downtime Schema Evolution
With thousands of engineers pushing service changes, API contract compatibility is enforced through synthetic traffic shadowing:
- Canaries run in production alongside baseline nodes receiving 1% of live read traffic.
- Automated anomaly detection compares error rates, heap allocations, and p99 latency before rolling out beyond the canary tier.
- Protobuf schema migrations are strictly additive with backward-compatible fallback defaults.

> "The single biggest architectural win was moving serialization and payload pruning to the edge, cutting internal origin payload volume by 43%."

## 4. Operational Takeaways
1. Design for failure at the gateway layer: isolation walls prevent a slow recommendations service from taking down authentication.
2. Shed load early: rejecting a low-priority request in 1 millisecond at the edge is far better than timing out after 3 seconds in the core.
3. Explore the full open source stack at [Netflix Open Source](https://netflix.github.io).`,
  },
  {
    id: "a2",
    source: "Stripe",
    title: "Idempotency keys: a design deep dive",
    excerpt: "Why every write API needs idempotency, and how to implement it without distributed locks. Learn more at the [Stripe Engineering Docs](https://stripe.com/docs).",
    ageDays: 5,
    readMins: 11,
    tags: ["API", "Reliability", "Architecture"],
    author: "Marcus Lee",
    url: "https://stripe.com/blog/idempotency",
    publishedAt: "2026-09-18T10:00:00Z",
    popularityScore: 95,
    imageUrl: SOURCE_DEFAULT_IMAGES.Stripe,
    body: `# Idempotency Keys: A Design Deep Dive

*By Marcus Lee · Stripe Engineering · 5 days ago · 11 min read*

In payment processing and distributed transactional systems, network failures are inevitable. A client may submit a payment charge, the server may successfully process the charge, but a network disconnect might prevent the confirmation response from reaching the client. If the client blindly retries, the customer gets charged twice.

![Stripe Idempotency Lifecycle State Machine](https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=1200&auto=format&fit=crop&q=80)

## The Idempotency Contract
An **Idempotency Key** is a unique client-generated token (often a UUIDv4) transmitted in an HTTP header:

\`\`\`http
POST /v1/charges
Idempotency-Key: 9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d
Amount: 4900
Currency: usd
\`\`\`

If a request with an identical key is repeated within a 24-hour window, the server guarantees that the operation is executed exactly once, and replays the original response verbatim. Detailed specifications are in the [Stripe API Idempotency Guide](https://stripe.com/docs/api/idempotent_requests).

## Architectural Layers
Implementing this safely across thousands of distributed servers requires careful state transition management:

1. **Atomic Request Claiming**: When a request arrives, the server checks the idempotency store using an atomic \`INSERT ... ON CONFLICT\` or \`SETNX\`.
2. **In-Flight Locking**: If a duplicate arrives while the first request is still running, the duplicate waits or receives a \`409 Conflict\` with a \`Retry-After\` header rather than executing concurrent mutations.
3. **Payload Fingerprinting**: Along with the key, we compute a SHA-256 hash of the request body and URL parameters. If the client sends the same key with different parameters, we immediately reject it with an unprocessable entity error.

## Failure Scenarios Handled
- **Timeout after charge creation**: The second call safely fetches the cached receipt without debiting the customer again.
- **Server crash mid-transaction**: Using explicit status states (\`started\`, \`completed\`, \`failed\`), recovery workers clean up abandoned reservations after TTL expiration.

> "A reliable payment platform cannot assume reliable clients or networks. Idempotency guarantees turn unreliable network retries into deterministic outcomes."`,
  },
  {
    id: "a3",
    source: "Cloudflare",
    title: "How we built a 50ms global KV store",
    excerpt: "Trading consistency for latency: the story behind Workers KV's tiered replication. Powered by the [Cloudflare Edge Network](https://www.cloudflare.com).",
    ageDays: 1,
    readMins: 6,
    tags: ["Edge", "Storage", "Performance"],
    author: "Dana Cole",
    url: "https://blog.cloudflare.com/kv",
    publishedAt: "2026-09-22T16:00:00Z",
    popularityScore: 96,
    imageUrl: SOURCE_DEFAULT_IMAGES.Cloudflare,
    body: `# How We Built a 50ms Global KV Store

*By Dana Cole · Cloudflare Blog · 1 day ago · 6 min read*

Building a serverless key-value store that delivers single-digit millisecond reads from over 300 cities worldwide required rethinking classical distributed database tradeoffs.

![Cloudflare Workers KV Tiered Cache Topology](https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=1200&auto=format&fit=crop&q=80)

## The Latency-Consistency Dilemma
Under the CAP theorem, global strong consistency across hundreds of edge locations requires round-trip consensus protocols (like Multi-Paxos or Raft). Speed-of-light propagation across continents guarantees that multi-datacenter consensus takes 100ms to 300ms.

For read-heavy edge workloads (configuration flags, routing rules, user sessions), users prioritize reading data in under 5ms over instantaneous write visibility. Read more at the [Cloudflare Workers KV Docs](https://developers.cloudflare.com/kv/).

## Tiered Edge Replication
Workers KV utilizes a tiered hierarchical architecture:
1. **Central Persistent Store**: Durable storage across replicated multi-region clusters ensuring data durability and fault tolerance.
2. **Regional Invalidation Bus**: High-throughput Pub/Sub bus broadcasting cache invalidation tokens when writes occur.
3. **Edge RAM & NVMe Tier**: Each Cloudflare edge data center maintains an active multi-gigabyte local cache. Frequent reads are served directly from RAM in under 2ms.

## Key Performance Techniques
- **Cold Reads vs Hot Reads**: Hot keys are held in memory across all worker isolates. Cold keys fall back to nearby regional caches, hitting origin only when completely uncached.
- **Eventual Consistency Window**: Updates propagate globally within 60 seconds, which fits the vast majority of configuration and content delivery needs.

> "By embracing eventual consistency where appropriate, we eliminated cross-continent network hops from the critical read path."`,
  },
  {
    id: "a4",
    source: "Uber",
    title: "Real-time matching with H3 geospatial index",
    excerpt: "Uber's hex-based spatial index powers sub-second driver matching worldwide. Check out the open source [H3 Spatial Index](https://h3geo.org).",
    ageDays: 3,
    readMins: 9,
    tags: ["Geo", "Realtime", "Scale"],
    author: "Sofia Marin",
    url: "https://eng.uber.com/h3",
    publishedAt: "2026-09-20T12:00:00Z",
    popularityScore: 94,
    imageUrl: SOURCE_DEFAULT_IMAGES.Uber,
    body: `# Real-Time Matching with H3 Geospatial Index

*By Sofia Marin · Uber Engineering · 3 days ago · 9 min read*

Connecting riders with nearby drivers in fractions of a second across hundreds of metropolitan areas requires calculating distances and ETAs for millions of moving coordinates continuously.

![Uber H3 Hexagonal Spatial Index Visualization](https://images.unsplash.com/photo-1508974239320-0a029497e820?w=1200&auto=format&fit=crop&q=80)

## Why Hexagons Over Squares or Triangles?
Standard Cartesian grid partitioning suffers from significant distortion at different latitudes, and neighbors in square grids have two distinct distances: orthogonal neighbors (distance 1) and diagonal neighbors (distance √2 ≈ 1.414).

Hexagonal cells have a critical mathematical advantage:
- **Uniform Neighbor Distance**: Every hexagon has exactly six identical equidistant neighbors.
- **Smooth Ring Expansions**: Finding all drivers within a radius involves simply expanding concentric hexagonal rings (k-rings), reducing complex trigonometric distance equations to simple bitwise operations.

\`\`\`
      / \\     / \\
     / 0 \\---/ 1 \\
     \\   /   \\   /
      \\ /  C  \\ /
      / \\     / \\
     / 5 \\---/ 2 \\
     \\   /   \\   /
\`\`\`

Explore full library documentation and bindings at the [H3 GitHub Project](https://github.com/uber/h3).

## Hierarchical Indexing
H3 supports 16 resolutions, ranging from continental tiles (resolution 0) down to square-meter precision (resolution 15). Each hexagon at resolution *N* is composed of seven smaller sub-hexagons at resolution *N+1*.

This hierarchical design allows:
- **Sub-second Spatial Aggregations**: Surge pricing zones and marketplace demand forecasts aggregate seamlessly up the hierarchy without recalculating raw coordinates.
- **Fast 64-Bit Integer Representations**: Every cell is represented as a compact 64-bit integer, allowing spatial searches to execute as ultra-fast hash table lookups in memory.`,
  },
  {
    id: "a5",
    source: "GitHub",
    title: "Rendering huge pull requests in the GitHub Copilot app",
    excerpt: "How we make AI coding more cost efficient without sacrificing task quality in [GitHub Copilot](https://github.com/features/copilot).",
    ageDays: 1,
    readMins: 7,
    tags: ["AI", "Performance", "Frontend"],
    author: "Tomás Rivera",
    url: "https://github.blog/engineering",
    publishedAt: "2026-09-23T08:00:00Z",
    popularityScore: 97,
    imageUrl: SOURCE_DEFAULT_IMAGES.GitHub,
    body: `# Rendering Huge Pull Requests in the GitHub Copilot App

*By Tomás Rivera · GitHub Engineering · 1 day ago · 7 min read*

Large pull requests with thousands of changed lines and hundreds of files present unique performance bottlenecks for developer tools and AI models alike.

![GitHub Diff Virtualization & AST Tokenization Pipeline](https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=1200&auto=format&fit=crop&q=80)

## The Virtualization Challenge
Rendering a diff containing 50,000 lines of code causes DOM bloat, high memory consumption, and stutter during scrolling. We designed a fine-grained chunked virtualization pipeline that divides file diffs into immutable byte buffers.

- Only visible hunks within the current viewport window plus a 300px overscan margin are rendered.
- Syntax highlighting tokens are pre-computed in web workers using tree-sitter WASM grammars, offloading heavy parsing work from the main UI thread. Check out [GitHub Engineering](https://github.blog/engineering) for more deep dives.

## Smart Context Window Pruning
When feeding pull requests into GitHub Copilot for code review and summarization, token context limits and inference latency are paramount:
1. **Relevance Scoring**: We rank changed files by importance, prioritizing core logic files and filtering out generated files (\`package-lock.json\`, minified bundles, autogenerated stubs).
2. **Semantic Diffing**: Rather than raw line diffs, semantic AST changes focus Copilot's attention on function signatures, modified business logic, and security-sensitive entry points.

> "Developers shouldn't have to wait for diffs to render or summaries to generate. Performance and efficiency go hand in hand."`,
  },
  {
    id: "a6",
    source: "Figma",
    title: "Multiplayer editing without conflicts",
    excerpt: "CRDTs, presence cursors, and the network model behind Figma's real-time canvas. Learn about [Multiplayer Collaboration](https://figma.com).",
    ageDays: 4,
    readMins: 10,
    tags: ["CRDT", "Realtime", "Architecture"],
    author: "Elena Voss",
    url: "https://figma.com/blog/multiplayer",
    publishedAt: "2026-09-19T11:00:00Z",
    popularityScore: 93,
    imageUrl: SOURCE_DEFAULT_IMAGES.Figma,
    body: `# Multiplayer Editing Without Conflicts

*By Elena Voss · Figma Design & Engineering · 4 days ago · 10 min read*

When multiple designers collaborate on the same canvas in real-time, dragging shapes, typing text, and modifying color properties, their changes must converge deterministically without lag or merge conflicts.

![Figma Real-Time Operation Journal & Reconciliation Pipeline](https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=1200&auto=format&fit=crop&q=80)

## The Client-Server Sync Architecture
While decentralized peer-to-peer CRDTs work well for text, collaborative 2D layout trees require centralized ordering to maintain strict document hierarchy invariants. Figma utilizes a central server as the single source of truth for transaction sequencing:

1. **Optimistic Local Application**: When a designer moves a layer, the local transformation applies at 60fps immediately without waiting for server confirmation.
2. **Operation Journaling**: The operation is appended to an in-flight transaction log and transmitted over a persistent WebSocket connection.
3. **Server Sequencing & Broadcast**: The server assigns a monotonically increasing sequence ID and broadcasts the transform to all other active connected peers.
4. **Reconciliation**: If a conflict occurs, the client applies deterministic operational transformation rules to reconcile state seamlessly.

## Presence & Cursor Interpolation
Real-time multiplayer cursors transmit high-frequency mouse coordinates. Rather than saturating the network with 60 updates per second per user, coordinates are sampled at 20Hz and smoothly interpolated on peer clients using Hermite spline curves. Learn more on [Figma Engineering](https://figma.com/blog).`,
  },
  {
    id: "a7",
    source: "Airbnb",
    title: "The guest journey, updated in real time with Chronon",
    excerpt: "Extending Airbnb's sequence recommender to deliver sub-second personalized recommendations using [Chronon ML](https://airbnb.io/chronon).",
    ageDays: 6,
    readMins: 8,
    tags: ["Machine Learning", "Realtime", "Data"],
    author: "Raj Patel",
    url: "https://airbnb.io/chronon",
    publishedAt: "2026-09-17T15:00:00Z",
    popularityScore: 92,
    imageUrl: SOURCE_DEFAULT_IMAGES.Airbnb,
    body: `# The Guest Journey: Real-Time Recommenders with Chronon

*By Raj Patel · Airbnb Engineering · 6 days ago · 8 min read*

When a traveler searches for stays in Paris or Tokyo, their intent shifts rapidly with each click, filter adjustment, and listing view. Traditional batch machine learning pipelines that update user feature embeddings overnight miss these critical in-session signals.

![Airbnb Chronon Streaming ML Architecture](https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&auto=format&fit=crop&q=80)

## Transitioning from Batch to Real-Time Features
Using Chronon, Airbnb's open-source feature platform, we unified offline training data generation with online low-latency inference:
- **Event Streaming**: User interactions stream through Kafka topics into stateful Flink stream processors.
- **Sliding-Window Aggregations**: Real-time listing impressions, wish-list saves, and price sensitivity are computed over 10-minute, 1-hour, and 24-hour sliding windows.
- **Sub-10ms Feature Retrieval**: Computed feature vectors are stored in low-latency key-value stores accessible to our ranking models during live search scoring.

Explore the open source engine at [Chronon GitHub Repository](https://github.com/airbnb/chronon).

## Impact on Personalization
By incorporating real-time sequence embeddings directly into candidate generation, search relevance improved by over 14%, showing travelers listings that directly match their active trip planning intent.`,
  },
  {
    id: "a8",
    source: "Datadog",
    title: "Making Rust observability reliable at scale with OpenTelemetry",
    excerpt: "20x the CI traffic without getting slower: how we rebuilt telemetry ingest at Datadog with [OpenTelemetry & Rust](https://opentelemetry.io).",
    ageDays: 7,
    readMins: 12,
    tags: ["Rust", "Observability", "Systems"],
    author: "Nina Kovacs",
    url: "https://datadoghq.com/blog/rust-scale",
    publishedAt: "2026-09-16T09:00:00Z",
    popularityScore: 94,
    imageUrl: SOURCE_DEFAULT_IMAGES.Datadog,
    body: `# Making Rust Observability Reliable at Scale with OpenTelemetry

*By Nina Kovacs · Datadog Engineering · 7 days ago · 12 min read*

Processing trillions of telemetry spans daily across heterogeneous customer workloads demands memory safety, zero-cost abstractions, and predictable tail latencies. Over the past year, we rebuilt core ingest components in modern Rust.

![Datadog Zero-Copy Telemetry Ingestion Pipeline](https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&auto=format&fit=crop&q=80)

## The Memory Footprint of Garbage-Collected Ingest
Previous generation ingestion proxies written in garbage-collected languages experienced periodic GC pauses under sudden traffic spikes. At millions of spans per second, a 200ms GC pause causes memory buffers to fill rapidly, leading to packet drops.

With Rust's ownership model and deterministic memory deallocation:
- Zero garbage collection pauses eliminated tail latency jitter.
- Memory consumption dropped by 64% per container core.
- CPU utilization stabilized, allowing predictable auto-scaling under volatile peak loads.

## OpenTelemetry Native Pipelines
We designed native OpenTelemetry protocol (OTLP) parsers utilizing zero-copy deserialization:
- Raw byte buffers are parsed directly into typed span representations without intermediate heap allocations.
- Batching engines optimize vector writes directly to disk and network sockets using Vectored I/O (\`writev\`). Check out the [OpenTelemetry Project](https://opentelemetry.io).

> "Predictable low latency under peak pressure is the fundamental prerequisite of real-time observability."`,
  },
];
