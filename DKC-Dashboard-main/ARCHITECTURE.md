# Architecture Documentation

> **Copyright DKC UMW, All rights reserved**

Comprehensive system architecture documentation for the DKC Booking Dashboard.

## 📋 Table of Contents

- [System Overview](#system-overview)
- [Architecture Diagram](#architecture-diagram)
- [Technology Stack](#technology-stack)
- [Component Architecture](#component-architecture)
- [Data Flow](#data-flow)
- [API Integration](#api-integration)
- [Caching Strategy](#caching-strategy)
- [State Management](#state-management)
- [Design Patterns](#design-patterns)
- [Performance Optimizations](#performance-optimizations)
- [Security](#security)
- [Scalability](#scalability)

## 🎯 System Overview

The DKC Booking Dashboard is a **full-stack web application** that provides a user-friendly interface for managing and analyzing booking data from the SimplyBook.me system.

### Key Components

1. **Frontend (React SPA)** - Interactive user interface
2. **Backend API (Express.js)** - Data processing and API proxy
3. **External API (SimplyBook.me)** - Source of booking data
4. **Hosting (Vercel)** - Deployment platform with CDN

### Design Philosophy

- **Separation of Concerns** - Frontend, backend, and data layers are independent
- **Progressive Enhancement** - Core functionality works, enhanced features improve UX
- **Performance First** - Aggressive caching and optimization
- **User-Centric** - Intuitive UI with responsive design

## 🏗️ Architecture Diagram

### High-Level Architecture

```
┌──────────────────────────────────────────────────────┐
│                    User Browser                       │
└───────────────────┬──────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────────┐
│              Vercel Edge Network (CDN)                │
│  ┌────────────────────────────────────────────────┐  │
│  │           Frontend (React SPA)                  │  │
│  │  - Homepage                                     │  │
│  │  - Bookings (Table View)                       │  │
│  │  - Dashboard (Analytics)                       │  │
│  └──────────────────┬─────────────────────────────┘  │
│                     │ HTTP Requests                   │
│  ┌──────────────────▼─────────────────────────────┐  │
│  │      Backend API (Serverless Functions)        │  │
│  │  - /api/bookings                               │  │
│  │  - /api/bookings/stats                         │  │
│  └──────────────────┬─────────────────────────────┘  │
└────────────────────┬┴──────────────────────────────────┘
                     │ API Calls
                     ▼
          ┌──────────────────────┐
          │  SimplyBook.me API   │
          │  - Authentication    │
          │  - Booking Data      │
          │  - Categories        │
          └──────────────────────┘
```

### Component Interaction

```
┌─────────┐  Navigate   ┌─────────┐  HTTP GET   ┌─────────┐
│  User   ├────────────►│ React   ├────────────►│ Express │
│ Browser │◄────────────┤  App    │◄────────────┤   API   │
└─────────┘  HTML/CSS   └─────────┘  JSON Data  └────┬────┘
                                                       │
                                                       │ Fetch
                                                       ▼
                                                ┌────────────┐
                                                │ SimplyBook │
                                                │    API     │
                                                └────────────┘
```

## 🛠️ Technology Stack

### Frontend

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Framework** | React | 18.3.1 | UI component library |
| **Language** | TypeScript | 5.7.2 | Type-safe JavaScript |
| **Build Tool** | Vite | 6.1.0 | Fast build and HMR |
| **Routing** | React Router | 7.5.0 | Client-side routing |
| **Styling** | Tailwind CSS | 3.x | Utility-first CSS |
| **Components** | shadcn/ui | Latest | Accessible UI components |
| **Charts** | Recharts | 2.15.2 | Data visualization |
| **HTTP Client** | Axios | 1.8.4 | API requests |
| **Date Handling** | date-fns | 2.30.0 | Date formatting |
| **Theme** | next-themes | 0.4.6 | Dark/light mode |

### Backend

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Runtime** | Node.js | 18+ | JavaScript runtime |
| **Framework** | Express.js | 4.18.2 | Web server framework |
| **HTTP Client** | Axios | 1.6.2 | API requests |
| **Date Handling** | Luxon | 3.4.3 | DateTime operations |
| **CORS** | cors | 2.8.5 | Cross-origin requests |

### Deployment

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Platform** | Vercel | Hosting and deployment |
| **CDN** | Vercel Edge | Global content delivery |
| **Functions** | Vercel Serverless | API hosting |
| **DNS** | Vercel DNS | Domain management |

## 🧩 Component Architecture

### Frontend Component Hierarchy

```
App.tsx (Root)
│
├── Navbar.tsx (All Pages)
│   ├── Logo & Branding
│   ├── Navigation Links
│   └── Theme Toggle
│
├── Homepage.tsx
│   ├── Hero Section
│   ├── Feature Cards
│   │   ├── Bookings Card
│   │   └── Dashboard Card
│   └── Footer
│
├── Bookings.tsx
│   ├── Date Range Picker
│   ├── Filter Controls
│   │   ├── Category Filter
│   │   ├── Status Filter
│   │   ├── Service Filter
│   │   ├── Provider Filter
│   │   └── Search Input
│   ├── Data Table
│   │   ├── Sortable Headers
│   │   └── Booking Rows
│   └── Pagination Controls
│
└── Dashboard.tsx
    ├── Date Range Picker
    ├── Summary Stats Cards
    │   ├── Total Bookings
    │   ├── Active Bookings
    │   ├── Unique Services
    │   └── Categories
    ├── Tabs Navigation
    └── Tab Content
        ├── Overview Tab
        │   ├── Line Chart (Bookings Over Time)
        │   ├── Pie Chart (Categories)
        │   ├── Pie Chart (Status)
        │   └── Top Services List
        ├── Services Tab
        │   └── Bar Chart (Service Types)
        ├── Staff Tab
        │   └── Bar Chart (Staff Members)
        └── Spaces Tab
            └── Bar Chart (Equipment/Spaces)
```

### Backend API Structure

```
api/index.js
│
├── Configuration
│   ├── Express Setup
│   ├── Middleware (CORS, JSON)
│   └── API Credentials
│
├── Cache Management
│   ├── Token Cache
│   └── Response Cache
│
├── Helper Functions
│   ├── getAdminToken()
│   ├── getCategoriesList()
│   ├── fetchBookings()
│   ├── getBookingDetails()
│   ├── fetchAllBookingDetails()
│   └── processBookings()
│
├── Routes
│   ├── GET / (Health Check)
│   ├── GET /api/bookings
│   └── GET /api/bookings/stats
│
└── Server Initialization
```

## 📊 Data Flow

### Booking Data Retrieval Flow

```
1. User Action
   │
   ▼
2. React Component
   - User selects date range
   - Clicks "Update" button
   │
   ▼
3. Check Local Cache
   - Look in localStorage
   - Check if cache is valid (<30 min old)
   - If valid → Use cached data ✓
   - If invalid → Continue ▼
   │
   ▼
4. API Request
   - axios.get('/api/bookings')
   - Include start_date, end_date params
   │
   ▼
5. Express Server
   - Receive request
   - Validate parameters
   - Get/refresh auth token
   │
   ▼
6. SimplyBook API
   - Authenticate with credentials
   - Request booking data
   - Receive raw JSON response
   │
   ▼
7. Data Processing
   - Transform raw data
   - Apply categorization
   - Normalize fields
   │
   ▼
8. API Response
   - Return processed JSON
   - Include metadata (count, message)
   │
   ▼
9. React State Update
   - Store data in state
   - Cache in localStorage
   - Update UI
   │
   ▼
10. User Sees Data
    - Table populated
    - Charts rendered
    - Filters applied
```

### Data Transformation Pipeline

```
Raw SimplyBook Data → Processing → Standardized Format

{                         Process           {
  "id": "123",             ───►              "Date": "2025-01-15 14:00:00",
  "start_date": "...",                       "Status": "confirmed",
  "client": {...},                           "Client": "John Doe",
  "event": "Studio",                         "Service": "Podcast Studio",
  "unit": "Equipment",                       "Provider": "Studio Equipment",
  "is_confirm": "1",                         "Code": "abc123",
  ...                                        "Category": "Space Bookings",
}                                            "Created": "2025-01-10 09:30:00",
                                            "RelatedResources": "Microphone"
                                          }
```

## 🔗 API Integration

### SimplyBook.me Integration

**Authentication Flow:**

```
1. getAdminToken()
   ├── Check if token cached
   │   ├── Yes → Return cached token
   │   └── No → Continue
   │
   ├── POST to /login
   │   Body: { company, user, pass }
   │
   ├── Receive token
   │   Store in memory
   │   Set expiry (1 hour)
   │
   └── Return token
```

**API Calls Structure:**

```javascript
// All calls use JSON-RPC 2.0 format
{
  "jsonrpc": "2.0",
  "method": "getBookings",
  "params": [{
    "date_from": "2025-01-01",
    "date_to": "2025-01-31",
    "timezone": "America/New_York"
  }],
  "id": 1
}
```

**Rate Limiting:**

- Internal batch processing (10 concurrent requests)
- Delays between batches (500ms)
- Retry logic with exponential backoff
- Limited to first 50 booking details (performance)

## 💾 Caching Strategy

### Multi-Level Caching

```
┌──────────────────────────────────────┐
│        User Request                   │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│  Level 1: Browser Cache               │
│  - localStorage                       │
│  - 30 minute TTL                      │
│  - Keyed by date range                │
└──────────────┬───────────────────────┘
               │ Cache Miss
               ▼
┌──────────────────────────────────────┐
│  Level 2: Server Cache                │
│  - In-memory Map                      │
│  - 5 minute TTL                       │
│  - Shared across requests             │
└──────────────┬───────────────────────┘
               │ Cache Miss
               ▼
┌──────────────────────────────────────┐
│  Level 3: SimplyBook API              │
│  - Fresh data fetch                   │
│  - Store in Level 1 & 2               │
└───────────────────────────────────────┘
```

### Cache Keys

**Frontend:**
```javascript
`bookings_cache_${startDate}_${endDate}`
`dashboard_cache_${startDate}_${endDate}`
```

**Backend:**
```javascript
`${fromDate}-${toDate}` // Bookings
`stats_${fromDate}_${toDate}` // Statistics
```

### Cache Invalidation

**Automatic:**
- Time-based expiration (TTL)
- Stale cache cleanup on component unmount

**Manual:**
- "Refresh" button
- "Clear Cache" button
- Date range change

## 🔄 State Management

### Local State (React hooks)

```typescript
// Component-level state
const [data, setData] = useState<BookingData[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

// Filter state
const [filterCategory, setFilterCategory] = useState('all');
const [searchTerm, setSearchTerm] = useState('');

// Pagination state
const [currentPage, setCurrentPage] = useState(1);
const [itemsPerPage, setItemsPerPage] = useState(20);
```

**Why no global state management?**
- Simple data flow
- No shared state between routes
- Each page manages its own data
- Reduces complexity

### Derived State

```typescript
// Computed from base state
const filteredData = useMemo(() => {
  return bookings.filter(b => {
    // Apply filters
  });
}, [bookings, filters]);

const sortedData = useMemo(() => {
  return [...filteredData].sort((a, b) => {
    // Apply sorting
  });
}, [filteredData, sortField, sortDirection]);
```

## 🎨 Design Patterns

### Patterns Used

#### 1. **Proxy Pattern**
Backend API acts as proxy to SimplyBook API
- Abstracts external API
- Transforms data format
- Handles authentication

#### 2. **Cache-Aside Pattern**
```typescript
async function getData(key) {
  // Check cache
  let data = cache.get(key);
  if (data) return data;
  
  // Fetch from source
  data = await fetchFromAPI();
  
  // Store in cache
  cache.set(key, data);
  return data;
}
```

#### 3. **Composition Pattern**
UI built from small, composable components
```typescript
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    Content
  </CardContent>
</Card>
```

#### 4. **Hook Pattern**
Reusable logic extraction
```typescript
function useBookingData(startDate, endDate) {
  const [data, setData] = useState([]);
  // ... fetch logic
  return { data, loading, error };
}
```

#### 5. **Facade Pattern**
Simplified API interface
```typescript
// Complex internal logic hidden
function exportToCSV(data, filename) {
  // 50 lines of CSV generation
}
```

## ⚡ Performance Optimizations

### Frontend Optimizations

1. **Code Splitting**
   - Route-based lazy loading possible (not implemented)
   - Tree shaking via Vite

2. **Memoization**
   ```typescript
   const expensiveCalculation = useMemo(() => {
     return processData(largeDataset);
   }, [largeDataset]);
   ```

3. **Virtualization**
   - Could add for large tables (100+ rows)
   - React Virtualized or react-window

4. **Image Optimization**
   - Logo optimized and cached
   - SVG icons (inline, no HTTP request)

5. **Bundle Optimization**
   - Minification via esbuild
   - Gzip compression
   - CSS purging with Tailwind

### Backend Optimizations

1. **Batch Processing**
   - Fetch booking details in batches of 10
   - Reduces sequential API calls

2. **Parallel Requests**
   - Use Promise.all() for concurrent fetches
   - Faster than sequential

3. **Response Caching**
   - In-memory cache (Map)
   - 5-minute TTL

4. **Selective Data Fetching**
   - Only fetch what's needed
   - Limit to 50 detailed bookings

## 🔐 Security

### Current Security Measures

1. **HTTPS Enforced**
   - Vercel provides SSL by default

2. **CORS Configuration**
   - Allows all origins (development)
   - Should restrict in production

3. **Input Validation**
   - Date format validation
   - SQL injection not applicable (no database)

4. **No Client-Side Secrets**
   - API credentials on server only

### Security Improvements Needed

1. **Environment Variables**
   - Move API credentials to env vars
   - Use Vercel environment variables

2. **Rate Limiting**
   - Add express-rate-limit
   - Prevent API abuse

3. **CORS Restriction**
   ```javascript
   app.use(cors({
     origin: 'https://dkc-dashboard.vercel.app'
   }));
   ```

4. **Request Validation**
   - Validate query parameters
   - Sanitize user input

5. **Error Handling**
   - Don't leak sensitive info in errors
   - Generic error messages to client

## 📈 Scalability

### Current Limitations

| Resource | Limit | Impact |
|----------|-------|--------|
| API response time | ~2-5s | Acceptable for current use |
| Booking details | 50 max | Prevents timeout |
| Cache expiry | 30 min | May show stale data |
| Concurrent users | ~100 | Vercel free tier limit |

### Scaling Strategies

#### Vertical Scaling (More Resources)
- Upgrade Vercel plan
- Increase function timeout
- More memory allocation

#### Horizontal Scaling (More Instances)
- Vercel handles automatically
- Serverless functions scale on demand

#### Database Layer
- **Current:** No database, all from API
- **Future:** Add database cache
  - PostgreSQL or MongoDB
  - Store booking snapshots
  - Reduce API calls
  - Historical data analysis

#### Caching Layer
- **Current:** In-memory + localStorage
- **Future:** Redis cache
  - Shared across functions
  - Persistent cache
  - Faster than API calls

### Load Handling

```
Low Load (<10 users)
└── Direct API calls work fine

Medium Load (10-100 users)
└── Current caching sufficient

High Load (>100 users)
├── Add Redis cache
├── Database for historical data
└── CDN caching for static content
```

## 📞 Support & Maintenance

### Monitoring Points

1. **API Health**
   - Check /api/bookings endpoint
   - Response time <2s
   - Success rate >95%

2. **Frontend Performance**
   - Lighthouse score >90
   - Page load <3s
   - No console errors

3. **Error Tracking**
   - API errors logged
   - Frontend errors logged
   - User reported issues

### Maintenance Tasks

**Weekly:**
- [ ] Check Vercel logs for errors
- [ ] Monitor response times
- [ ] Review user feedback

**Monthly:**
- [ ] Update dependencies
- [ ] Run security audit
- [ ] Review and clear old caches
- [ ] Check API quota usage

**Quarterly:**
- [ ] Performance audit
- [ ] Security review
- [ ] Code refactoring
- [ ] Documentation updates

---

## 📚 Related Documentation

- [README.md](README.md) - Project overview
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - API reference
- [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment guide
- [CONTRIBUTING.md](CONTRIBUTING.md) - Contribution guidelines

---

**Last Updated:** January 2025

**Architecture Version:** 1.0

