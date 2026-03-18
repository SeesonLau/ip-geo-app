# ip-geo-app

React frontend for the IP Geo JLabs Basic Assessment Exam. Allows authenticated users to look up IP geolocation data, view results on an interactive map, and manage a persistent search history.

## Tech Stack

- React 18 (Vite 5)
- React Router DOM v7
- Axios
- Leaflet.js + React Leaflet v4
- Tailwind CSS v3
- lucide-react (icons)
- ipinfo.io (geo API, no key required)

## Requirements

- Node.js v18+ (developed and tested on v20.17.0)
- `ip-geo-api` backend **must be running** at http://localhost:8000 before starting this app

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

A `.env` file is already included. If it is missing, copy the example:

```bash
cp .env.example .env
```

The `.env` should contain:

```env
VITE_API_URL=http://localhost:8000
```

| Variable        | Description                                      |
|-----------------|--------------------------------------------------|
| `VITE_API_URL`  | Base URL of the `ip-geo-api` backend             |

> If your backend runs on a different port, update this value accordingly.

### 3. Start the app

```bash
npm run dev
```

The app will be available at: **http://localhost:5173**

---

## Default Login Credentials

| Field    | Value              |
|----------|--------------------|
| Email    | john@example.com   |
| Password | password123        |

> These credentials are created by the backend seeder (`npm run seed` in `ip-geo-api`). Make sure you have run it before logging in.

---

## Features

### Authentication
- Login form with email and password
- Show/hide password toggle
- JWT token stored in `localStorage`
- Protected routes — unauthenticated users are redirected to `/login`
- Logout clears session and redirects to login

### IP Geolocation
- Automatically detects and displays your own IP's location on page load
- Search any valid IPv4 address to get geolocation data
- Client-side IP format validation before sending the request
- Displays full geo info in a table (IP, city, region, country, org, timezone, etc.)

### Interactive Map
- Leaflet.js map renders a pin at the searched IP's coordinates
- Map updates on every new search or history item click
- No attribution overlay

### Search History
- Every IP search is saved to the backend database (per user)
- History persists across sessions and devices
- Click any history item to reload its geo data and map pin
- Checkbox multi-select with a "Select All" toggle
- Bulk delete selected entries via the backend API
- Active item highlighted with a "Viewing" badge

### UI / UX
- Light and dark mode with a slate theme
- Theme toggle button in the header shows a sun/moon icon + live clock
- Theme preference saved to `localStorage` and applied on page load (no flash)
- Scrollable history list when entries overflow
- Responsive layout: left panel (search + info + history) + right panel (map)
- Toast notifications for delete and logout actions
- Spinner animation on Search, Clear, and Login buttons during loading

---

## Troubleshooting

**Blank page / styles not loading**
→ Make sure you ran `npm install`. Tailwind requires the PostCSS setup included in `vite.config.js`.

**"Failed to fetch geo information"**
→ The ipinfo.io API is a public external service. Check your internet connection.

**"Could not load history from server" / "History could not be saved"**
→ The backend (`ip-geo-api`) is not running or not reachable at `VITE_API_URL`. Start it first.

**"Invalid email or password" on login**
→ Make sure you ran `npm run seed` in the `ip-geo-api` directory to create the default user.

**Map not showing**
→ Geo data must contain a valid `loc` field (latitude,longitude). This comes from ipinfo.io — if the IP has no location data, the map placeholder will show instead.
