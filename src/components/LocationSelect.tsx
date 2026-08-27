import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/i18n/LanguageContext';

export interface SystemCity {
  city: string;
  country: string;
  countryCode: string;
  lat: number | null;
  lng: number | null;
}

let cache: { cities: SystemCity[]; countries: string[] } | null = null;
let inflight: Promise<{ cities: SystemCity[]; countries: string[] }> | null = null;

async function loadLocations() {
  if (cache) return cache;
  if (inflight) return inflight;
  inflight = (async () => {
    const [pc, mc, tp] = await Promise.all([
      (supabase as any).from('pilot_countries').select('code, name').eq('active', true),
      (supabase as any).from('mci_cities').select('city, country_code'),
      (supabase as any).from('tr_provinces').select('name, lat, lng').eq('active', true).order('plate_no'),
    ]);
    const codeToName = new Map<string, string>(
      ((pc.data || []) as any[]).map((c) => [c.code, c.name])
    );
    const cities: SystemCity[] = [];
    ((mc.data || []) as any[]).forEach((c) => {
      cities.push({
        city: c.city,
        country: codeToName.get(c.country_code) || c.country_code,
        countryCode: c.country_code,
        lat: null,
        lng: null,
      });
    });
    ((tp.data || []) as any[]).forEach((p) => {
      cities.push({
        city: p.name,
        country: codeToName.get('TR') || 'Türkiye',
        countryCode: 'TR',
        lat: p.lat,
        lng: p.lng,
      });
    });
    // de-duplicate by city+country
    const seen = new Set<string>();
    const unique = cities.filter((c) => {
      const k = `${c.city}|${c.countryCode}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    }).sort((a, b) => a.city.localeCompare(b.city));

    const countries = Array.from(
      new Set([...codeToName.values(), ...unique.map((c) => c.country)])
    ).sort((a, b) => a.localeCompare(b));

    cache = { cities: unique, countries };
    return cache;
  })();
  return inflight;
}

/** Shared list of cities/countries that exist in the system (MCI cities + Türkiye provinces + pilot countries). */
export function useSystemLocations() {
  const [data, setData] = useState<{ cities: SystemCity[]; countries: string[] }>(
    cache || { cities: [], countries: [] }
  );
  useEffect(() => {
    let alive = true;
    loadLocations().then((d) => { if (alive) setData(d); });
    return () => { alive = false; };
  }, []);
  return data;
}

interface Props {
  city: string;
  country: string;
  onChange: (v: { city: string; country: string; lat?: number | null; lng?: number | null }) => void;
  className?: string;
}

const labels = {
  city: { tr: 'Şehir seç', en: 'Select city', de: 'Stadt wählen' },
  country: { tr: 'Ülke seç', en: 'Select country', de: 'Land wählen' },
  custom: { tr: 'Elle gir', en: 'Custom', de: 'Manuell' },
  list: { tr: 'Listeden seç', en: 'Pick from list', de: 'Aus Liste' },
};

/** City/country pickers bound to the cities & countries that exist in the system. */
const LocationSelect = ({ city, country, onChange, className = '' }: Props) => {
  const { lang } = useLanguage();
  const { cities, countries } = useSystemLocations();
  const [manual, setManual] = useState(false);

  const cityOptions = useMemo(
    () => (country ? cities.filter((c) => c.country === country) : cities),
    [cities, country]
  );

  const known = cityOptions.some((c) => c.city === city);
  const showManual = manual || (!!city && !known && cities.length > 0);

  const selectCls =
    'h-9 w-full px-2 rounded-md border border-input bg-background text-sm';

  return (
    <div className={`grid grid-cols-2 gap-2 ${className}`}>
      <select
        className={selectCls}
        value={countries.includes(country) ? country : ''}
        onChange={(e) => onChange({ city: '', country: e.target.value })}
      >
        <option value="">{labels.country[lang]}</option>
        {countries.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      {showManual ? (
        <input
          className={selectCls}
          value={city}
          placeholder={labels.city[lang]}
          onChange={(e) => onChange({ city: e.target.value, country })}
        />
      ) : (
        <select
          className={selectCls}
          value={city}
          onChange={(e) => {
            const v = e.target.value;
            if (v === '__manual__') { setManual(true); return; }
            const match = cityOptions.find((c) => c.city === v);
            onChange({ city: v, country: match?.country || country, lat: match?.lat, lng: match?.lng });
          }}
        >
          <option value="">{labels.city[lang]}</option>
          {cityOptions.map((c) => (
            <option key={`${c.city}-${c.countryCode}`} value={c.city}>
              {c.city}{country ? '' : ` — ${c.country}`}
            </option>
          ))}
          <option value="__manual__">+ {labels.custom[lang]}</option>
        </select>
      )}
    </div>
  );
};

export default LocationSelect;
