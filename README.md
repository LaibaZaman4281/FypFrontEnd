# Maid & Servant Online — Web (Next.js)

A responsive, web-first port of the `myFypProject` React Native application.
Four role portals — **Client**, **Worker**, **Company (agency)** and **Police** —
covering discovery, interviews, time slots, hiring, contracts, resignations,
terminations, certifications, criminal-record checks and two-way reviews.

The backend is unchanged: this app talks to the existing **ASP.NET Core**
API (`Fyp_Backend`).

## Quick start

```bash
npm install
cp .env.example .env.local     # then point it at your backend
npm run dev                    # http://localhost:3000
```

```bash
npm run build && npm start     # production build
```

### Environment

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SERVER_BASE` | Base URL of the ASP.NET backend, e.g. `http://192.168.100.13:5150` |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Optional. The map uses free OpenStreetMap tiles by default. |

> The backend must allow this origin via CORS (it already registers an
> `AllowAll` policy) and must be reachable from the **browser**, not just the
> server.

## Project structure

```
app/
├── (auth)/                 # login + signup (split-screen brand layout)
│   ├── login/
│   └── signup/
├── (dashboard)/            # authenticated portals (guarded + app shell)
│   ├── client/             # find-service, filters, workers/[id], interview,
│   │                       # certification, dashboard, requests, decisions,
│   │                       # reviews, resignations, terminate, profile
│   ├── worker/             # dashboard, requests, accepted, job-confirmations,
│   │                       # skills, habits, reviews, leave-job, termination,
│   │                       # terminated
│   ├── company/            # directory, workers/[id]
│   ├── police/             # portal, file-record/[workerId]
│   └── map/                # shared Leaflet location picker
├── layout.tsx              # global layout + toast provider
├── page.tsx                # entry: routes to role home or /login
└── globals.css

components/
├── ui/                     # Button, Field, Card, Modal, Avatar, Badge,
│                           # Rating, States, Tabs, Toggle, PageHeader
└── features/
    ├── shell/              # AppShell (sidebar/topbar) + navigation map
    ├── client/             # FiltersPanel, WorkerResultCard
    ├── skills/             # SkillsBuilder (signup + worker skills)
    └── map/                # LocationPicker (react-leaflet)

lib/
├── api/                    # fetch client (auth header, 401 handling) + services
├── hooks/                  # useSession, useRequireRole, useClientFilters,
│                           # useNotification, useMediaQuery
├── utils/                  # format, status, geo, cn
├── config.ts               # endpoint constants (ported from assets/config.js)
└── storage.ts              # localStorage with the app's original keys

types/                      # shared TypeScript interfaces
```

## Tech

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 3 ·
lucide-react · react-hot-toast · react-leaflet + OpenStreetMap

## Docs

* **`ROUTE_MAP.md`** — every RN screen and the route that replaces it.
* **`MIGRATION_NOTES.md`** — what was preserved, the RN→web substitutions, and
  the handful of RN crashes fixed along the way.

## Test accounts

Use the same credentials as the mobile app — authentication, roles and data all
come from the same database.
