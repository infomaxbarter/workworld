import type { Lang } from './translations';

export type I18nField = Partial<Record<Lang, string>> | null | undefined;

/**
 * Read a localized text from a JSONB i18n field.
 * Falls back to: requested lang → en → tr → de → first non-empty → fallback string.
 */
export const pickI18n = (
  field: I18nField | unknown,
  fallback: string | null | undefined,
  lang: Lang
): string => {
  const f = (field as I18nField) || {};
  const order: Lang[] = [lang, 'en', 'tr', 'de'];
  for (const l of order) {
    const v = f?.[l];
    if (typeof v === 'string' && v.trim()) return v;
  }
  // any first non-empty value in the object
  if (f && typeof f === 'object') {
    for (const v of Object.values(f)) {
      if (typeof v === 'string' && v.trim()) return v;
    }
  }
  return (fallback ?? '').toString();
};

/**
 * Build a JSONB i18n object. Pass partial values; missing langs become empty strings.
 */
export const buildI18n = (values: Partial<Record<Lang, string>>): Record<Lang, string> => ({
  tr: values.tr ?? '',
  en: values.en ?? '',
  de: values.de ?? '',
});

/** Update a single language inside an existing i18n field. */
export const setI18nLang = (
  field: I18nField,
  lang: Lang,
  value: string
): Record<string, string> => ({
  ...(field || {}),
  [lang]: value,
});
