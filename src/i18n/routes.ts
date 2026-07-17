import type { Lang } from './translations';
import { matchPath } from 'react-router-dom';

export type RouteKey =
  | 'home'
  | 'about'
  | 'humans'
  | 'events'
  | 'professions'
  | 'map'
  | 'mci'
  | 'blog'
  | 'videos'
  | 'podcast'
  | 'analytics'
  | 'dashboard'
  | 'admin'
  | 'auth'
  | 'humanDetail'
  | 'eventDetail'
  | 'memberDetail'
  | 'professionDetail'
  | 'blogDetail'
  | 'videoDetail'
  | 'podcastDetail'
  | 'kvkk'
  | 'cookies'
  | 'consent';


export const routeMap: Record<RouteKey, Record<Lang, string>> = {
  home:             { en: '/',           tr: '/',            de: '/' },
  about:            { en: '/about',      tr: '/hakkimizda',  de: '/ueber-uns' },
  humans:           { en: '/humans',     tr: '/insanlar',    de: '/menschen' },
  events:           { en: '/events',     tr: '/etkinlikler', de: '/veranstaltungen' },
  professions:      { en: '/professions',tr: '/meslekler',   de: '/berufe' },
  map:              { en: '/map',        tr: '/harita',      de: '/karte' },
  mci:              { en: '/mci',        tr: '/matris-sehir-endeksi', de: '/matrix-staedte-index' },
  blog:             { en: '/blog',       tr: '/blog',        de: '/blog' },
  videos:           { en: '/videos',     tr: '/videolar',    de: '/videos' },
  podcast:          { en: '/podcast',    tr: '/podcast',     de: '/podcast' },
  analytics:        { en: '/analytics',  tr: '/analitik',    de: '/analysen' },

  dashboard:        { en: '/dashboard',  tr: '/panel',       de: '/uebersicht' },
  admin:            { en: '/admin',      tr: '/yonetim',     de: '/verwaltung' },
  auth:             { en: '/auth',       tr: '/giris',       de: '/anmelden' },
  humanDetail:      { en: '/humans/:slug',     tr: '/insanlar/:slug',    de: '/menschen/:slug' },
  eventDetail:      { en: '/events/:slug',     tr: '/etkinlikler/:slug', de: '/veranstaltungen/:slug' },
  memberDetail:     { en: '/members/:slug',    tr: '/uyeler/:slug',      de: '/mitglieder/:slug' },
  professionDetail: { en: '/professions/:slug',tr: '/meslekler/:slug',   de: '/berufe/:slug' },
  blogDetail:       { en: '/blog/:slug',       tr: '/blog/:slug',        de: '/blog/:slug' },
  videoDetail:      { en: '/videos/:slug',     tr: '/videolar/:slug',    de: '/videos/:slug' },
  podcastDetail:    { en: '/podcast/:slug',    tr: '/podcast/:slug',     de: '/podcast/:slug' },
  kvkk:             { en: '/kvkk',       tr: '/kvkk',        de: '/kvkk' },
  cookies:          { en: '/cookies',    tr: '/cerezler',    de: '/cookies' },
  consent:          { en: '/consent',    tr: '/riza',        de: '/einwilligung' },
};

export const allRouteKeys = Object.keys(routeMap) as RouteKey[];
export const allLangs: Lang[] = ['en', 'tr', 'de'];

/** Build a localized path, substituting `:param` placeholders from params. */
export function buildPath(key: RouteKey, lang: Lang, params?: Record<string, string>): string {
  let path = routeMap[key][lang];
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      path = path.replace(`:${k}`, encodeURIComponent(v));
    }
  }
  return path;
}

export interface MatchedRoute {
  key: RouteKey;
  lang: Lang;
  params: Record<string, string>;
}

/** Identify which route key/lang a given pathname belongs to. */
export function matchRoute(pathname: string): MatchedRoute | null {
  // Try non-home routes first so '/' doesn't shadow them.
  const keys = allRouteKeys.filter(k => k !== 'home');
  for (const key of keys) {
    for (const lang of allLangs) {
      const pattern = routeMap[key][lang];
      const m = matchPath({ path: pattern, end: true }, pathname);
      if (m) {
        return { key, lang, params: (m.params as Record<string, string>) || {} };
      }
    }
  }
  if (pathname === '/' || pathname === '') {
    return { key: 'home', lang: 'en', params: {} };
  }
  return null;
}

/** All localized variants of a path (for hreflang). */
export function alternates(key: RouteKey, params?: Record<string, string>): Record<Lang, string> {
  return {
    en: buildPath(key, 'en', params),
    tr: buildPath(key, 'tr', params),
    de: buildPath(key, 'de', params),
  };
}
