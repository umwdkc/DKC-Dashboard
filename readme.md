# DKC Booking Dashboard

> **Copyright DKC UMW, All rights reserved**

A comprehensive dashboard application for managing and analyzing Digital Knowledge Center (DKC) booking data from SimplyBook.me.

![Dashboard Preview](web/public/dkc-new.png)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Development](#development)
- [Deployment](#deployment)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

The DKC Booking Dashboard is a full-stack web application that provides:

- **Real-time booking data** from SimplyBook.me
- **Interactive analytics** with multiple chart types
- **Advanced filtering and search** capabilities
- **Responsive design** for desktop and mobile
- **Smart caching** for optimal performance

Built for the Digital Knowledge Center at the University of Mary Washington to streamline booking management and provide insights into resource utilization.

## ✨ Features

### 📊 Dashboard (Analytics)
- **Date range filtering** with calendar controls
- **Interactive charts:**
  - Bookings over time (line/area chart)
  - Category distribution (pie chart)
  - Status breakdown (pie chart)
  - Service popularity rankings
- **Multiple visualization tabs:**
  - Overview with summary stats
  - Services analysis
  - Staff utilization
  - Equipment and space usage
- **Auto-refresh** with configurable intervals
- **Client-side caching** for performance

### 📅 Bookings (Data Table)
- **Comprehensive table view** of all bookings
- **Multi-dimensional filtering:**
  - By category (Training, Consultations, Spaces, Classes)
  - By status (Active, Cancelled)
  - By service type
  - By staff member/provider
  - Text search across multiple fields
- **Sortable columns** (Date, Client, Service, Provider, Status)
- **Pagination** with customizable page size (10, 20, 50, 100)
- **Responsive layout** with mobile-optimized views
- **Export-ready data** format

### 🏠 Homepage
- **Navigation cards** to main sections
- **Contact information** for feedback
- **Branding** with DKC logo and colors

### 🎨 UI/UX Features
- **Dark/Light mode** with system preference detection
- **Accessible components** using shadcn/ui
- **Loading states** and error handling
- **Toast notifications** for user feedback
- **Responsive breakpoints** for all devices

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Component library
- **Recharts** - Data visualization
- **Axios** - HTTP client
- **date-fns** - Date manipulation

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Axios** - API client for SimplyBook
- **Luxon** - Date/time handling
- **CORS** - Cross-origin resource sharing

### Deployment
- **Vercel** - Frontend hosting
- **Vercel Serverless Functions** - API hosting

## 📁 Project Structure

```
DKC-Dashboard/
├── api/                        # Backend API server
│   ├── index.js               # Express server with SimplyBook integration
│   ├── package.json           # API dependencies
│   └── node_modules/          # Backend dependencies
│
├── web/                       # Frontend application
│   ├── public/                # Static assets
│   │   ├── dkc-new.png       # Logo
│   │   └── dkc.svg           # Icon
│   │
│   ├── src/                   # Source code
│   │   ├── components/        # React components
│   │   │   ├── Navbar.tsx    # Navigation bar
│   │   │   └── ui/           # shadcn/ui components
│   │   │
│   │   ├── pages/            # Page components
│   │   │   ├── Homepage.tsx  # Landing page
│   │   │   ├── Bookings.tsx  # Booking table view
│   │   │   └── Dashboard.tsx # Analytics dashboard
│   │   │
│   │   ├── hooks/            # Custom React hooks
│   │   │   ├── use-mobile.tsx
│   │   │   └── use-theme.ts
│   │   │
│   │   ├── lib/              # Utility functions
│   │   │   └── utils.ts
│   │   │
│   │   ├── App.tsx           # Root component with routing
│   │   ├── main.tsx          # Application entry point
│   │   └── index.css         # Global styles
│   │
│   ├── package.json          # Frontend dependencies
│   ├── tsconfig.json         # TypeScript configuration
│   ├── tailwind.config.js    # Tailwind CSS configuration
│   ├── vite.config.ts        # Vite build configuration
│   └── vercel.json           # Vercel deployment config
│
├── README.md                 # This file
├── ONBOARDING.md            # Developer onboarding guide
├── API_DOCUMENTATION.md     # API reference
├── CONTRIBUTING.md          # Contribution guidelines
├── DEPLOYMENT.md            # Deployment instructions
├── ARCHITECTURE.md          # System architecture
├── vercel.json              # Root Vercel configuration
├── setup.sh                 # Setup script
└── run.sh                   # Run script
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18.x or higher
- **npm** 9.x or higher (comes with Node.js)
- **Git** for version control

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd DKC-Dashboard
   ```

2. **Install frontend dependencies**
   ```bash
   cd web
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd ../api
   npm install
   ```

### Running Locally

#### Option 1: Using the provided scripts

From the root directory:

```bash
# Start both frontend and backend
./run.sh
```

#### Option 2: Manual startup

**Terminal 1 - Backend API:**
```bash
cd api
npm run dev  # Starts on http://localhost:5001
```

**Terminal 2 - Frontend:**
```bash
cd web
npm run dev  # Starts on http://localhost:5173
```

Then open your browser to `http://localhost:5173`

## 💻 Development

### Development Workflow

1. **Frontend development:**
   ```bash
   cd web
   npm run dev
   ```
   - Hot Module Replacement (HMR) enabled
   - Changes reflect immediately in browser
   - TypeScript type checking in editor

2. **Backend development:**
   ```bash
   cd api
   npm run dev
   ```
   - Auto-restart on file changes (via nodemon)
   - Console logging for debugging
   - Test endpoints with curl or Postman

### Environment Variables

For local development, update the API URL in:
- `web/src/pages/Dashboard.tsx` - Line ~52
- `web/src/pages/Bookings.tsx` - Line ~31

Change from:
```typescript
const API_URL = 'https://rusul-dkc.vercel.app/api';
```

To:
```typescript
const API_URL = 'http://localhost:5001/api';
```

### Code Quality

**Linting:**
```bash
cd web
npm run lint
```

**Type Checking:**
```bash
cd web
npm run build  # TypeScript checks during build
```

### Adding Features

1. See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines
2. Check [ARCHITECTURE.md](ARCHITECTURE.md) for system design
3. Review [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for API details

## 🚢 Deployment

The application is deployed on Vercel with automatic deployments from the main branch.

For detailed deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).

**Quick Deploy:**

1. Connect repository to Vercel
2. Configure build settings:
   - Framework Preset: Vite
   - Root Directory: web
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. Deploy!

## 📚 Documentation

- **[ONBOARDING.md](ONBOARDING.md)** - New developer guide
- **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)** - API endpoints and usage
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - How to contribute
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Deployment procedures
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture and design

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for:

- Code style guidelines
- Pull request process
- Development best practices
- Testing requirements

## 📞 Contact & Support

**For questions or feedback:**
- Email: [rabbas@mail.umw.edu](mailto:rabbas@mail.umw.edu)
- Developer: Rusul Abbas

**Digital Knowledge Center**
- Website: [UMW DKC](https://www.umw.edu/dkc)
- Location: University of Mary Washington

## 📄 License

Copyright © 2025 DKC UMW. All rights reserved.

This project is proprietary software developed for the University of Mary Washington's Digital Knowledge Center.

---

## 🎓 About DKC

The Digital Knowledge Center (DKC) at the University of Mary Washington provides students, faculty, and staff with access to:

- Digital media production tools
- 3D printing and makerspaces
- Podcast recording studios
- Training and consultation services
- Collaborative workspaces

This dashboard helps the DKC team manage bookings, understand usage patterns, and provide better services to the UMW community.

---

**Built with ❤️ for the UMW Community**
