export const RESERVED = ["admin", "api", "s", "_next", "icon", "favicon", "itm-logo", "robots", "sitemap", "static", "public"];

export const slugify = (s = "") =>
  s.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50).replace(/-+$/g, "");

export const validSlug = (s = "") =>
  /^[a-z0-9]+(-[a-z0-9]+)*$/.test(s) && s.length >= 2 && s.length <= 50 && !RESERVED.includes(s);
