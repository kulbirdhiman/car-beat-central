const ALLOWED_TAGS = new Set(["p", "br", "h2", "h3", "h4", "ul", "ol", "li", "strong", "b", "em", "i", "u", "s", "blockquote", "a", "img"]);
const BLOCKED_CONTENT = /<(script|style|iframe|object|embed|svg|math)\b[^>]*>[\s\S]*?<\/\1\s*>/gi;

const escapeHtml = (value: string) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const escapeAttribute = (value: string) => escapeHtml(value).replaceAll('"', "&quot;").replaceAll("'", "&#39;");

function attribute(tag: string, name: string) {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  return match?.[1] ?? match?.[2] ?? match?.[3] ?? "";
}

function safeUrl(value: string, image = false) {
  const url = value.trim();
  return /^https:\/\//i.test(url) || (!image && /^mailto:/i.test(url)) || (/^\/(?!\/)/.test(url) && !image) ? url : "";
}

/** Sanitizes admin-authored product copy to a small formatting and image allowlist. */
export function sanitizeProductDescription(value: string) {
  const input = value.trim();
  if (!input) return "";
  if (!/<[a-z][^>]*>/i.test(input)) {
    return input
      .split(/\n{2,}/)
      .map((part) => `<p>${escapeHtml(part).replaceAll("\n", "<br>")}</p>`)
      .join("");
  }

  return input
    .replace(BLOCKED_CONTENT, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<[^>]*>/g, (tag) => {
      const match = tag.match(/^<\s*(\/?)\s*([a-z0-9]+)\b[^>]*>$/i);
      if (!match) return "";
      const [, closing, rawName] = match;
      const name = rawName.toLowerCase();
      if (!ALLOWED_TAGS.has(name)) return "";
      if (closing) return name === "br" || name === "img" ? "" : `</${name}>`;
      if (name === "br") return "<br>";
      if (name === "img") {
        const src = safeUrl(attribute(tag, "src"), true);
        return src ? `<img src="${escapeAttribute(src)}" alt="${escapeAttribute(attribute(tag, "alt"))}">` : "";
      }
      if (name === "a") {
        const href = safeUrl(attribute(tag, "href"));
        return href ? `<a href="${escapeAttribute(href)}" rel="noopener noreferrer">` : "";
      }
      return `<${name}>`;
    });
}

export function productDescriptionText(value: string) {
  return sanitizeProductDescription(value)
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(p|h[2-4]|li|blockquote)>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}
