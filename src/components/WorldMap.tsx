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
        marker.bindPopup(`<div><strong>Member</strong><br/>${u.name}</div>`);
        cluster.addLayer(marker);
      });

      (events as EventMarker[] | null)?.forEach((e) => {
        const marker = L.marker([e.lat, e.lng], { icon: eventIcon });
        marker.bindPopup(
          `<div><strong>Event</strong><br/>${e.title}${e.date ? `<br/>${e.date}` : ''}${e.description ? `<br/>${e.description}` : ''}</div>`,
        );
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
