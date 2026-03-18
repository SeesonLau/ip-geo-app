# ip-geo-app

React web application for IP Geolocation lookup with authentication.

## Tech Stack
- React 18 (Vite 5)
- React Router DOM
- Axios
- Leaflet.js + React Leaflet
- ipinfo.io API

## Requirements
- Node.js v18+
- `ip-geo-api` backend running on http://localhost:8000

## Setup

### 1. Clone the repository
```bash
git clone https://github.com/SeesonLau/ip-geo-app.git
cd ip-geo-app
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start the app
```bash
npm run dev
```
App runs on http://localhost:5173

## Default Login Credentials
- **Email:** john@example.com
- **Password:** password123

> Make sure the backend (`ip-geo-api`) is running before starting this app.

## Features
- Login with JWT authentication
- Auto-detects your IP and displays geolocation on load
- Search any IP address and display its geo information
- Validates IP address format before searching
- Interactive map with pin using Leaflet.js
- Search history list with click-to-reload
- Checkbox multi-select to delete history entries
- Logout clears session and redirects to login
