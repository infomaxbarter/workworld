

# WorkWorld – Global Community Platform

## Overview
A minimal, single-page community platform centered around an interactive OpenStreetMap. Users can see community members and events as map markers with clean popups, submit an application form, and access legal pages via the footer.

---

## Pages & Layout

### 1. Home Page (Single Page)
- **No header** – clean, immersive design
- **Full-width interactive map** (OpenStreetMap via Leaflet/react-leaflet) showing:
  - User markers with popup cards (name, location)
  - Event markers with popup cards (title, date, description)
  - Clean, minimal popup styling
- **Application form** below the map:
  - Fields: Name, Email, Message/Motivation
  - "Apply" button – submissions stored locally (or Supabase if connected later)
  - Success toast on submission
- **Footer** with links: KVKK, Çerez Politikası, Açık Rıza Formu

### 2. Legal Pages
- `/kvkk` – KVKK policy (placeholder text)
- `/cookies` – Cookie policy (placeholder text)
- `/consent` – Consent form (placeholder text)

### 3. Admin Panel (`/admin`)
- Protected by a simple password gate (no user auth system)
- **Submissions tab**: View and export all form submissions as CSV
- **Map Data tab**: Add/edit/remove user markers (name, lat/lng)
- **Events tab**: Add/edit/remove event markers (title, date, description, lat/lng)

---

## Data Storage
- Initially uses **localStorage/in-memory mock data** for markers, events, and submissions
- Structured so Supabase can be connected later for persistence

## Design
- Light theme, minimal and clean aesthetic
- Subtle animations, soft shadows, rounded cards
- Mobile-responsive layout

