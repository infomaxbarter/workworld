import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import { supabase } from '@/integrations/supabase/client';

interface UserMarker {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

interface EventMarker {
  id: string;
  title: string;
  date: string | null;
  description: string | null;
  lat: number;
  lng: number;
}

// Fix default marker icons
delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const eventIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const WorldMap = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [30, 20],
      zoom: 2,
      scrollWheelZoom: true,
    });
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    const cluster = L.markerClusterGroup();

    const loadMarkers = async () => {
      const [{ data: users }, { data: events }] = await Promise.all([
        supabase.from('user_markers').select('*'),
        supabase.from('event_markers').select('*'),
      ]);

      (users as UserMarker[] | null)?.forEach((u) => {
        const marker = L.marker([u.lat, u.lng]);
        marker.bindPopup(`
          <div style="padding:12px;min-width:180px;font-family:inherit;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
              <div style="width:36px;height:36px;border-radius:50%;background:hsl(152,60%,36%);display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:16px;">
                ${u.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style="font-weight:600;font-size:14px;">${u.name}</div>
                <div style="font-size:11px;color:#888;">Member</div>
              </div>
            </div>
            <a href="/profile/${u.id}" style="display:block;text-align:center;padding:6px 12px;background:hsl(152,60%,36%);color:white;border-radius:6px;font-size:12px;font-weight:500;text-decoration:none;">
              View Profile →
            </a>
          </div>
        `);
        cluster.addLayer(marker);
      });

      (events as EventMarker[] | null)?.forEach((e) => {
        const marker = L.marker([e.lat, e.lng], { icon: eventIcon });
        marker.bindPopup(`
          <div style="padding:12px;min-width:200px;font-family:inherit;">
            <div style="font-weight:700;font-size:15px;margin-bottom:4px;">${e.title}</div>
            ${e.date ? `<div style="font-size:12px;color:#888;margin-bottom:4px;">📅 ${e.date}</div>` : ''}
            ${e.description ? `<div style="font-size:13px;color:#555;margin-bottom:8px;">${e.description.substring(0, 100)}${e.description.length > 100 ? '...' : ''}</div>` : ''}
            <a href="/event/${e.id}" style="display:block;text-align:center;padding:6px 12px;background:hsl(152,60%,36%);color:white;border-radius:6px;font-size:12px;font-weight:500;text-decoration:none;">
              Details →
            </a>
          </div>
        `);
        cluster.addLayer(marker);
      });

      map.addLayer(cluster);
    };

    loadMarkers();

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div className="w-full h-[70vh] md:h-[75vh] rounded-xl overflow-hidden shadow-lg border border-border">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
};

export default WorldMap;
