// Runs before `vite dev` and `vite build`. Writes public/sitemap.xml with
// static localized routes plus dynamic content from Lovable Cloud (public rows).

import { writeFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = "https://workworld.lovable.app";

const STATIC_ROUTES = [
  "/", "/about", "/humans", "/events", "/professions", "/map",
  "/mci", "/mci/compare", "/blog", "/videos", "/podcast", "/analytics",
  "/kvkk", "/cookies", "/consent",
  // Locale variants
  "/hakkimizda", "/ueber-uns",
  "/insanlar", "/menschen",
  "/etkinlikler", "/veranstaltungen",
  "/meslekler", "/berufe",
  "/harita", "/karte",
  "/matris-sehir-endeksi", "/matrix-staedte-index",
  "/matris-sehir-endeksi/karsilastir", "/matrix-staedte-index/vergleich",
  "/videolar", "/analitik", "/analysen",
  "/cerezler", "/riza", "/einwilligung",
];

interface Entry { path: string; lastmod?: string; changefreq?: string; priority?: string; }

async function fetchDynamic(): Promise<Entry[]> {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    console.warn("[sitemap] Supabase env missing — skipping dynamic entries");
    return [];
  }
  const sb = createClient(url, key);
  const entries: Entry[] = [];

  const [profiles, events, media, cities, professions] = await Promise.all([
    sb.from("profiles").select("slug, updated_at").eq("status", "active").not("slug", "is", null),
    sb.from("event_markers").select("slug, updated_at").eq("status", "active").not("slug", "is", null),
    sb.from("media_content").select("slug, type, updated_at").eq("status", "approved").not("slug", "is", null),
    sb.from("mci_cities").select("slug, updated_at").not("slug", "is", null),
    sb.from("professions").select("slug, updated_at").eq("status", "active").not("slug", "is", null),
  ]);

  (profiles.data || []).forEach((r: any) => entries.push({ path: `/humans/${r.slug}`, lastmod: r.updated_at }));
  (events.data || []).forEach((r: any) => entries.push({ path: `/events/${r.slug}`, lastmod: r.updated_at }));
  (professions.data || []).forEach((r: any) => entries.push({ path: `/professions/${r.slug}`, lastmod: r.updated_at }));
  (cities.data || []).forEach((r: any) => entries.push({ path: `/mci/${r.slug}`, lastmod: r.updated_at }));
  (media.data || []).forEach((r: any) => {
    const seg = r.type === "video" ? "videos" : r.type === "podcast" ? "podcast" : "blog";
    entries.push({ path: `/${seg}/${r.slug}`, lastmod: r.updated_at });
  });

  return entries;
}

function xml(entries: Entry[]) {
  const urls = entries.map(e => [
    "  <url>",
    `    <loc>${BASE_URL}${e.path}</loc>`,
    e.lastmod ? `    <lastmod>${new Date(e.lastmod).toISOString()}</lastmod>` : null,
    e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
    e.priority ? `    <priority>${e.priority}</priority>` : null,
    "  </url>",
  ].filter(Boolean).join("\n"));
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
  ].join("\n");
}

(async () => {
  const staticEntries: Entry[] = STATIC_ROUTES.map(p => ({
    path: p, changefreq: p === "/" ? "daily" : "weekly", priority: p === "/" ? "1.0" : "0.7",
  }));
  let dynamic: Entry[] = [];
  try { dynamic = await fetchDynamic(); } catch (e) { console.warn("[sitemap] dynamic fetch failed", e); }
  const all = [...staticEntries, ...dynamic];
  writeFileSync(resolve("public/sitemap.xml"), xml(all));
  console.log(`[sitemap] wrote ${all.length} entries (${dynamic.length} dynamic)`);
})();
