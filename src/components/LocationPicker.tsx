import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useLanguage } from '@/i18n/LanguageContext';

// Fix default marker icons
delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface LocationPickerProps {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
}

const LocationPicker = ({ lat, lng, onChange }: LocationPickerProps) => {
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [coords, setCoords] = useState({ lat: lat ?? 39.92, lng: lng ?? 32.85 });

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [coords.lat, coords.lng],
      zoom: lat ? 10 : 3,
      scrollWheelZoom: true,
    });
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
    }).addTo(map);

    if (lat && lng) {
      markerRef.current = L.marker([lat, lng]).addTo(map);
    }

    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat: newLat, lng: newLng } = e.latlng;
      if (markerRef.current) {
        markerRef.current.setLatLng([newLat, newLng]);
      } else {
        markerRef.current = L.marker([newLat, newLng]).addTo(map);
      }
      setCoords({ lat: newLat, lng: newLng });
      onChange(newLat, newLng);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">{t('map.click_to_select')}</p>
      <div ref={containerRef} className="w-full h-[250px] rounded-lg border border-border overflow-hidden" />
      {coords.lat && coords.lng && (
        <p className="text-xs text-muted-foreground">
          📍 {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
        </p>
      )}
    </div>
  );
};

export default LocationPicker;
