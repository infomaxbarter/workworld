import { useEffect } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { alternates, type RouteKey } from '@/i18n/routes';

interface Props {
  routeKey: RouteKey;
  params?: Record<string, string>;
}

/** Injects per-language <link rel="alternate" hreflang> + canonical into <head>. */
const HrefLangTags = ({ routeKey, params }: Props) => {
  const { lang } = useLanguage();

  useEffect(() => {
    const origin = window.location.origin;
    const alts = alternates(routeKey, params);
    const tagId = 'ww-hreflang-tags';

    document.getElementById(tagId)?.remove();

    const frag = document.createDocumentFragment();
    const container = document.createElement('div');
    container.id = tagId;

    (Object.entries(alts) as [string, string][]).forEach(([l, path]) => {
      const link = document.createElement('link');
      link.rel = 'alternate';
      link.hreflang = l;
      link.href = origin + path;
      container.appendChild(link);
    });
    const xdef = document.createElement('link');
    xdef.rel = 'alternate';
    xdef.hreflang = 'x-default';
    xdef.href = origin + alts.en;
    container.appendChild(xdef);

    const canonical = document.createElement('link');
    canonical.rel = 'canonical';
    canonical.href = origin + alts[lang];
    container.appendChild(canonical);

    frag.appendChild(container);
    document.head.appendChild(frag);

    return () => {
      document.getElementById(tagId)?.remove();
    };
  }, [routeKey, params, lang]);

  return null;
};

export default HrefLangTags;
