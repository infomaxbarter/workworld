import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import { supabase } from '@/integrations/supabase/client';

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
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

interface UserMarker { id: string; name: string; lat: number; lng: number; }
interface EventMarker { id: string; title: string; date: string | null; description: string | null; lat: number; lng: number; }

const ClusterLayer = ({ users, events }: { users: UserMarker[]; events: EventMarker[] }) => {
  const map = useMap();
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);

  useEffect(() => {
    if (clusterRef.current) {
      map.removeLayer(clusterRef.current);
    }

    const cluster = (L as any).markerClusterGroup();

    users.forEach((u) => {
      const marker = L.marker([u.lat, u.lng]);
      marker.bindPopup(`<div class="p-3 min-w-[140px]"><p class="text-xs font-medium uppercase tracking-wider mb-1" style="color: hsl(215.4, 16.3%, 46.9%)">Member</p><p class="font-semibold">${u.name}</p></div>`);
      cluster.addLayer(marker);
    });

    events.forEach((e) => {
      const marker = L.marker([e.lat, e.lng], { icon: eventIcon });
      marker.bindPopup(`<div class="p-3 min-w-[180px]"><p class="text-xs font-medium uppercase tracking-wider mb-1" style="color: hsl(152, 60%, 36%)">Event</p><p class="font-semibold">${e.title}</p>${e.date ? `<p class="text-xs mt-1" style="color: hsl(215.4, 16.3%, 46.9%)">${e.date}</p>` : ''}${e.description ? `<p class="text-sm mt-1" style="color: hsl(215.4, 16.3%, 46.9%)">${e.description}</p>` : ''}</div>`);
      cluster.addLayer(marker);
    });

    map.addLayer(cluster);
    clusterRef.current = cluster;

    return () => {
      if (clusterRef.current) {
        map.removeLayer(clusterRef.current);
      }
    };
  }, [map, users, events]);

  return null;
};

const WorldMap = () => {
  const [users, setUsers] = useState<UserMarker[]>([]);
  const [events, setEvents] = useState<EventMarker[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: u }, { data: e }] = await Promise.all([
        supabase.from('user_markers').select('*'),
        supabase.from('event_markers').select('*'),
      ]);
      if (u) setUsers(u);
      if (e) setEvents(e);
    };
    fetchData();
  }, []);

  return (
    <div className="w-full h-[70vh] md:h-[75vh] rounded-xl overflow-hidden shadow-lg border border-border">
      <MapContainer center={[30, 20]} zoom={2} scrollWheelZoom={true} className="w-full h-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClusterLayer users={users} events={events} />
      </MapContainer>
    </div>
  );
};

export default WorldMap;
