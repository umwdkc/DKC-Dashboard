# DKC Booking Dashboard

> Copyright DKC UMW. All rights reserved.

This is the dashboard we use to manage and view booking data from SimplyBook.me. It pulls in appointment and reservation info and displays it in a way that's actually useful — charts, tables, filters, the works.

![Dashboard Preview](web/public/dkc-new.png)

## What this does

- Pulls booking data from SimplyBook.me
- Shows charts and stats (bookings over time, service popularity, staff vs. space usage)
- Lets you filter by date range, category, status, service, and staff
- Works on desktop and mobile
- Caches data so it doesn't hammer the API every time you load a page

## Main sections

**Dashboard** — The analytics view. Pick a date range and see charts for bookings over time, category breakdowns, service rankings, and staff/space utilization.

**Bookings** — A table of all bookings with sorting, filtering, search, and pagination. You can filter by category (Training, Consultations, Spaces, Classes), status, service type, or staff member.

**Homepage** — Landing page with navigation and DKC branding.

## Tech stack

**Frontend:** React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Recharts

**Backend:** Node.js, Express.js, Axios (for SimplyBook API calls)

**Hosting:** Vercel (frontend + serverless functions)

## Project structure

```
DKC-Dashboard/
├── api/                  # Backend API
│   ├── index.js          # Express server + SimplyBook integration
│   └── package.json
│
├── web/                  # Frontend
│   ├── src/
│   │   ├── components/   # UI components (Navbar, shadcn/ui stuff)
│   │   ├── pages/        # Homepage, Dashboard, Bookings
│   │   ├── hooks/        # Custom hooks
│   │   └── lib/          # Utilities
│   ├── package.json
│   ├── vite.config.ts
│   └── vercel.json
│
├── main.py               # Streamlit dashboard (alternative/legacy)
├── vercel.json           # Root Vercel config
└── various .md files     # Documentation (see below)
```

## Getting started

You'll need Node.js 18+ and Git.

1. Clone the repo:
   ```bash
   git clone https://github.com/umwdkc/DKC-Dashboard.git
   cd DKC-Dashboard
   ```

2. Install frontend dependencies:
   ```bash
   cd web
   npm install
   ```

3. Install backend dependencies:
   ```bash
   cd ../api
   npm install
   ```

4. Run it locally:

   In one terminal:
   ```bash
   cd api
   npm run dev    # starts on localhost:5001
   ```

   In another:
   ```bash
   cd web
   npm run dev    # starts on localhost:5173
   ```

   Or just run `./run.sh` from the root to start both.

## Local development notes

When running locally, you need to update the API URL in two files so the frontend talks to your local backend instead of the production one:

- `web/src/pages/Dashboard.tsx` (around line 52)
- `web/src/pages/Bookings.tsx` (around line 31)

Change:
```typescript
const API_URL = 'https://dkc-dashboard.vercel.app/api';
```

To:
```typescript
const API_URL = 'http://localhost:5001/api';
```

Don't forget to change it back before pushing.

## Deployment

The app is hosted on Vercel and deploys automatically when you push to the master branch.

**Build settings in Vercel:**
- Framework Preset: Vite
- Root Directory: `web`
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `pnpm install --no-frozen-lockfile`

**Environment variables** (set in Vercel, not in code):
- `SIMPLYBOOK_USER` — SimplyBook.me username
- `SIMPLYBOOK_PASS` — SimplyBook.me password

**Live URL:** [dkc-dashboard.vercel.app](https://dkc-dashboard.vercel.app)

## Other documentation

- [ONBOARDING.md](ONBOARDING.md) — New developer guide
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) — API endpoints
- [CONTRIBUTING.md](CONTRIBUTING.md) — How to contribute
- [DEPLOYMENT.md](DEPLOYMENT.md) — Deployment details
- [ARCHITECTURE.md](ARCHITECTURE.md) — System architecture

## Contact

For questions or issues, reach out to the Digital Knowledge Center.

- Website: [umw.edu/dkc](https://www.umw.edu/dkc)
- Location: University of Mary Washington

## License

Copyright 2025 DKC UMW. All rights reserved. This is proprietary software built for the University of Mary Washington's Digital Knowledge Center.
