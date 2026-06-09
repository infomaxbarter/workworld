import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';
import { buildPath, matchRoute } from '@/i18n/routes';

/**
 * Keeps URL and active language in sync.
 * - When language changes, rewrites current pathname to the same route in the new language.
 * - When pathname changes to a route whose language differs from the active one, updates the language.
 */
const LanguageURLSync = () => {
  const { lang, setLang } = useLanguage();
  const { pathname, search, hash } = useLocation();
  const navigate = useNavigate();
  const lastLang = useRef(lang);
  const lastPath = useRef(pathname);

  // Sync language → URL
  useEffect(() => {
    if (lastLang.current === lang) return;
    lastLang.current = lang;
    const matched = matchRoute(pathname);
    if (!matched) return;
    const next = buildPath(matched.key, lang, matched.params);
    if (next !== pathname) {
      lastPath.current = next;
      navigate(next + search + hash, { replace: true });
    }
  }, [lang, pathname, search, hash, navigate]);

  // Sync URL → language
  useEffect(() => {
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    const matched = matchRoute(pathname);
    if (matched && matched.lang !== lang) {
      lastLang.current = matched.lang;
      setLang(matched.lang);
    }
  }, [pathname, lang, setLang]);

  return null;
};

export default LanguageURLSync;
