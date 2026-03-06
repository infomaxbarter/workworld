// Simple localStorage-backed store for WorkWorld data

export interface UserMarker {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export interface EventMarker {
  id: string;
  title: string;
  date: string;
  description: string;
  lat: number;
  lng: number;
}

export interface Submission {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
}

const KEYS = {
  users: 'workworld_users',
  events: 'workworld_events',
  submissions: 'workworld_submissions',
};

const defaultUsers: UserMarker[] = [
  { id: '1', name: 'Ayşe K.', lat: 41.0082, lng: 28.9784 },
  { id: '2', name: 'Marco R.', lat: 48.8566, lng: 2.3522 },
  { id: '3', name: 'Yuki T.', lat: 35.6762, lng: 139.6503 },
  { id: '4', name: 'Sarah M.', lat: 40.7128, lng: -74.006 },
];

const defaultEvents: EventMarker[] = [
  { id: '1', title: 'Community Meetup', date: '2026-04-15', description: 'Join us for our spring gathering in Istanbul.', lat: 41.015, lng: 28.979 },
  { id: '2', title: 'Creative Workshop', date: '2026-05-20', description: 'A hands-on workshop in Paris.', lat: 48.86, lng: 2.35 },
];

function load<T>(key: string, fallback: T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

export const store = {
  getUsers: () => load<UserMarker>(KEYS.users, defaultUsers),
  setUsers: (d: UserMarker[]) => save(KEYS.users, d),

  getEvents: () => load<EventMarker>(KEYS.events, defaultEvents),
  setEvents: (d: EventMarker[]) => save(KEYS.events, d),

  getSubmissions: () => load<Submission>(KEYS.submissions, []),
  addSubmission: (s: Omit<Submission, 'id' | 'createdAt'>) => {
    const all = load<Submission>(KEYS.submissions, []);
    const entry: Submission = { ...s, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    all.push(entry);
    save(KEYS.submissions, all);
    return entry;
  },
  setSubmissions: (d: Submission[]) => save(KEYS.submissions, d),
};
