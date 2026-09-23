import test from "node:test";
import assert from "node:assert";
import {
  decodeHtmlEntities,
  htmlToMarkdown,
  stripHtmlTags,
} from "../src/utils/htmlToMarkdown";

test("decodeHtmlEntities properly decodes common HTML character entities", () => {
  const input = "Tom &amp; Jerry &lt;script&gt; &quot;Hello&#39;s World&quot; &nbsp; &mdash;";
  const decoded = decodeHtmlEntities(input);
  assert.strictEqual(decoded, "Tom & Jerry <script> \"Hello's World\"   —");
});

test("stripHtmlTags removes markup while preserving textual content", () => {
  const html = "<p>Welcome to <strong>Netflix</strong> TechBlog!</p>";
  assert.strictEqual(stripHtmlTags(html), "Welcome to Netflix TechBlog!");
});

test("htmlToMarkdown converts headings H1-H4", () => {
  const html = "<h1>Title 1</h1><h2>Title 2</h2><h3>Title 3</h3><h4>Title 4</h4>";
  const md = htmlToMarkdown(html);
  assert.ok(md.includes("# Title 1"));
  assert.ok(md.includes("## Title 2"));
  assert.ok(md.includes("### Title 3"));
  assert.ok(md.includes("#### Title 4"));
});

test("htmlToMarkdown converts code blocks and inline code", () => {
  const html = "<pre><code>const a = 10;</code></pre><p>Use <code>calc()</code> for values.</p>";
  const md = htmlToMarkdown(html);
  assert.ok(md.includes("```\nconst a = 10;\n```"));
  assert.ok(md.includes("`calc()`"));
});

test("htmlToMarkdown converts list items and blockquotes", () => {
  const html = "<ul><li>Point A</li><li>Point B</li></ul><blockquote>Important note</blockquote>";
  const md = htmlToMarkdown(html);
  assert.ok(md.includes("- Point A"));
  assert.ok(md.includes("- Point B"));
  assert.ok(md.includes("> Important note"));
});

test("htmlToMarkdown converts figures with figcaption into markdown images", () => {
  const html = '<figure><img src="https://example.com/arch.png" /><figcaption>Architecture Diagram</figcaption></figure>';
  const md = htmlToMarkdown(html);
  assert.ok(md.includes("![Architecture Diagram](https://example.com/arch.png)"));
});

test("htmlToMarkdown strips dangerous scripts and styles", () => {
  const html = '<script>alert("xss")</script><style>.bad{color:red;}</style><p>Clean Text</p>';
  const md = htmlToMarkdown(html);
  assert.ok(!md.includes("alert"));
  assert.ok(!md.includes(".bad"));
  assert.strictEqual(md, "Clean Text");
});

test("htmlToMarkdown converts links, bold, italic, and standalone images", () => {
  const html = '<p>Check <a href="https://netflix.com">Netflix</a> with <strong>bold</strong> and <em>italic</em>!</p><img src="https://example.com/photo.jpg" alt="Photo" />';
  const md = htmlToMarkdown(html);
  assert.ok(md.includes("[Netflix](https://netflix.com)"));
  assert.ok(md.includes("**bold**"));
  assert.ok(md.includes("*italic*"));
  assert.ok(md.includes("![Photo](https://example.com/photo.jpg)"));
});

