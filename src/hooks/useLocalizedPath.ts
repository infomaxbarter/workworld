import { useCallback } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { buildPath, type RouteKey } from '@/i18n/routes';

/** Returns a builder that produces a path in the currently active language. */
export function useLocalizedPath() {
  const { lang } = useLanguage();
  return useCallback(
    (key: RouteKey, params?: Record<string, string>) => buildPath(key, lang, params),
    [lang]
  );
}
