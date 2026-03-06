import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
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
        <MarkerClusterGroup chunkedLoading>
          {users.map((u) => (
            <Marker key={`user-${u.id}`} position={[u.lat, u.lng]}>
              <Popup>
                <div className="p-3 min-w-[140px]">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Member</p>
                  <p className="font-semibold text-foreground">{u.name}</p>
                </div>
              </Popup>
            </Marker>
          ))}
          {events.map((e) => (
            <Marker key={`event-${e.id}`} position={[e.lat, e.lng]} icon={eventIcon}>
              <Popup>
                <div className="p-3 min-w-[180px]">
                  <p className="text-xs font-medium uppercase tracking-wider text-primary mb-1">Event</p>
                  <p className="font-semibold text-foreground">{e.title}</p>
                  {e.date && <p className="text-xs text-muted-foreground mt-1">{e.date}</p>}
                  {e.description && <p className="text-sm text-muted-foreground mt-1">{e.description}</p>}
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
};

export default WorldMap;
