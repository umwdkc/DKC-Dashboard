# Developer Onboarding Guide

> **Copyright DKC UMW, All rights reserved**

Welcome to the DKC Booking Dashboard project! This guide will help you get up to speed quickly.

## 📚 Table of Contents

- [Welcome](#welcome)
- [Day 1: Setup & Orientation](#day-1-setup--orientation)
- [Day 2-3: Codebase Deep Dive](#day-2-3-codebase-deep-dive)
- [Week 1: First Contributions](#week-1-first-contributions)
- [Resources](#resources)
- [Getting Help](#getting-help)

## 👋 Welcome

This project is a full-stack booking management system for the UMW Digital Knowledge Center. You'll be working with:

- **Frontend:** React + TypeScript + Tailwind CSS
- **Backend:** Node.js + Express.js
- **API Integration:** SimplyBook.me
- **Deployment:** Vercel

## 📅 Day 1: Setup & Orientation

### Morning: Environment Setup

1. **Install Required Software**
   
   - [ ] Node.js 18+ from [nodejs.org](https://nodejs.org/)
   - [ ] VS Code or your preferred editor
   - [ ] Git if not already installed

2. **Clone and Install**
   ```bash
   # Clone the repository
   git clone <repository-url>
   cd DKC-Dashboard
   
   # Install frontend dependencies
   cd web
   npm install
   
   # Install backend dependencies
   cd ../api
   npm install
   ```

3. **Verify Installation**
   ```bash
   # Start backend
   cd api
   npm run dev
   # Should see: Server running on port 5001
   
   # In a new terminal, start frontend
   cd web
   npm run dev
   # Should see: Local: http://localhost:5173
   ```

4. **Test the Application**
   - Open `http://localhost:5173` in your browser
   - Click through all three pages: Homepage, Bookings, Dashboard
   - Try changing the date range
   - Toggle dark/light mode

### Afternoon: Project Overview

1. **Read Documentation** (30 minutes)
   - [ ] [README.md](README.md) - Project overview
   - [ ] [ARCHITECTURE.md](ARCHITECTURE.md) - System design
   - [ ] [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - API reference

2. **Explore the Codebase** (90 minutes)
   
   **Frontend Structure:**
   ```
   web/src/
   ├── pages/           # Main page components
   │   ├── Homepage.tsx     # Landing page
   │   ├── Bookings.tsx     # Table view with filters
   │   └── Dashboard.tsx    # Analytics with charts
   ├── components/      # Reusable components
   │   ├── Navbar.tsx       # Navigation bar
   │   └── ui/              # shadcn/ui components
   └── lib/             # Utility functions
   ```
   
   **Backend Structure:**
   ```
   api/
   └── index.js         # Express server with all routes
   ```

3. **Try Making a Small Change**
   
   **Exercise 1: Change the homepage title**
   - File: `web/src/pages/Homepage.tsx`
   - Find: `DKC Booking Dashboard`
   - Change to: `DKC Booking Dashboard - Welcome!`
   - Save and see it update in your browser

   **Exercise 2: Add a console log**
   - File: `api/index.js`
   - In the `/api/bookings` route (around line 566)
   - Add: `console.log('Fetching bookings from', startDate, 'to', endDate);`
   - Reload the Bookings page and check your terminal

## 📅 Day 2-3: Codebase Deep Dive

### Frontend Deep Dive

#### Component Hierarchy

```
App.tsx (Router)
├── Navbar.tsx (on all pages)
├── Homepage.tsx
│   └── Card components (from shadcn/ui)
├── Bookings.tsx
│   ├── Date range pickers
│   ├── Filter controls
│   ├── Table component
│   └── Pagination
└── Dashboard.tsx
    ├── Date range pickers
    ├── Summary stat cards
    └── Tabs (Overview, Services, Staff, Spaces)
        └── Charts (Recharts)
```

#### Key Concepts

**1. State Management**

The app uses React hooks for state:

```typescript
// Example from Bookings.tsx
const [bookingsData, setBookingsData] = useState<BookingData[]>([]);
const [loading, setLoading] = useState(true);
const [currentPage, setCurrentPage] = useState(1);
```

No external state management library (Redux, Zustand) is used.

**2. Data Fetching**

```typescript
// Pattern used throughout:
const fetchData = async () => {
  try {
    const response = await axios.get(API_URL);
    setData(response.data);
  } catch (error) {
    setError(error.message);
  }
};
```

**3. Caching Strategy**

Both Bookings and Dashboard implement local storage caching:

```typescript
// Save to cache
localStorage.setItem(cacheKey, JSON.stringify(data));

// Load from cache
const cached = localStorage.getItem(cacheKey);
if (cached && !isExpired(cached)) {
  return JSON.parse(cached);
}
```

**4. Filtering & Sorting**

```typescript
// Bookings uses array methods for filtering:
const filteredData = bookingsData.filter(booking => {
  if (filterCategory !== 'all' && booking.Category !== filterCategory) {
    return false;
  }
  // ... more filters
  return true;
});

// And sorting:
const sortedData = [...filteredData].sort((a, b) => {
  // Custom sort logic
});
```

#### Common UI Patterns

**shadcn/ui Components:**

```typescript
// Button
import { Button } from "@/components/ui/button";
<Button variant="outline" size="sm">Click Me</Button>

// Card
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content here</CardContent>
</Card>

// Select dropdown
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
<Select value={value} onValueChange={setValue}>
  <SelectTrigger>
    <SelectValue placeholder="Choose..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
  </SelectContent>
</Select>
```

### Backend Deep Dive

#### Request Flow

```
1. Client makes request → /api/bookings?start_date=2025-01-01&end_date=2025-01-31
2. Express route handler → app.get('/api/bookings', ...)
3. Get/validate auth token → getAdminToken()
4. Fetch from SimplyBook → fetchBookings(token, startDate, endDate)
5. Process raw data → processBookings(bookings)
6. Return response → res.json({ data: processedData })
```

#### Key Functions

**Authentication:**
```javascript
// Manages token caching
async function getAdminToken() {
  // Returns cached token if valid
  // Otherwise fetches new token from SimplyBook
}
```

**Data Fetching:**
```javascript
async function fetchBookings(token, fromDate, toDate) {
  // Makes API call to SimplyBook
  // Returns array of booking objects
}
```

**Data Processing:**
```javascript
async function processBookings(bookings) {
  // Transforms SimplyBook data into our format
  // Applies categorization logic
  // Returns standardized booking objects
}
```

#### API Endpoints

**GET /api/bookings**
- Query params: `start_date`, `end_date`
- Returns: `{ message, data: BookingData[], count }`

**GET /api/bookings/stats**
- Query params: `start_date`, `end_date`
- Returns: `{ message, service_counts, staff_counts, space_counts, date_counts, category_counts }`

### Data Flow Diagram

```
┌─────────────┐
│   Browser   │
│  (React)    │
└─────┬───────┘
      │ HTTP Request
      ▼
┌─────────────┐
│   Express   │
│   Server    │
└─────┬───────┘
      │ API Call
      ▼
┌─────────────┐
│ SimplyBook  │
│     API     │
└─────────────┘
```

## 📅 Week 1: First Contributions

### Suggested Starter Tasks

#### Easy (30 min - 1 hour)

1. **Add a new stat card to the Dashboard**
   - Location: `web/src/pages/Dashboard.tsx` around line 826
   - Add a card showing "Total Cancelled Bookings"
   - Hint: `bookingsData.filter(b => simplifyStatus(b.Status) === 'Cancelled').length`

2. **Change the default date range**
   - Locations: `Bookings.tsx` and `Dashboard.tsx`
   - Currently: Jan 1 - May 1, 2025
   - Change to: Current month

3. **Add a footer to the Homepage**
   - Location: `web/src/pages/Homepage.tsx`
   - Add contact info or useful links

#### Medium (2-4 hours)

1. **Add export to CSV functionality**
   - Add a button to Bookings page
   - Convert current filtered/sorted data to CSV
   - Trigger download

2. **Create a new chart in Dashboard**
   - Add a chart showing bookings by day of week
   - Use the existing chart components as reference

3. **Improve mobile responsiveness**
   - Test on mobile viewport (Chrome DevTools)
   - Adjust layouts that don't look good
   - Make filters collapsible on mobile

#### Advanced (1-2 days)

1. **Add user preferences**
   - Save filter preferences to localStorage
   - Remember last selected date range
   - Restore preferences on page load

2. **Implement search highlights**
   - When searching, highlight matching text
   - Use different color for each match type

3. **Add real-time updates**
   - Implement auto-refresh every 5 minutes
   - Show countdown timer
   - Add pause/resume controls

### Making Your First Pull Request

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write code
   - Test thoroughly
   - Add JSDoc comments

3. **Commit with a good message**
   ```bash
   git add .
   git commit -m "feat: add CSV export to bookings page"
   ```

4. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```
   Then create a Pull Request on GitHub

5. **PR Checklist**
   - [ ] Code runs without errors
   - [ ] Tested on Chrome and one other browser
   - [ ] Tested on mobile viewport
   - [ ] Added/updated comments
   - [ ] No console errors
   - [ ] Follows existing code style

## 📚 Resources

### Learning Resources

**React & TypeScript:**
- [React Docs](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)

**Tailwind CSS:**
- [Tailwind Docs](https://tailwindcss.com/docs)
- [Tailwind UI Components](https://tailwindui.com/)

**shadcn/ui:**
- [Component Library](https://ui.shadcn.com/)
- [Installation Guide](https://ui.shadcn.com/docs/installation/vite)

**Recharts:**
- [Recharts Documentation](https://recharts.org/)
- [Examples Gallery](https://recharts.org/en-US/examples)

**Express.js:**
- [Express Guide](https://expressjs.com/en/guide/routing.html)

### Useful VS Code Extensions

- **ES7+ React/Redux/React-Native snippets** - Code snippets
- **Tailwind CSS IntelliSense** - Autocomplete for Tailwind
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Error Lens** - Inline error messages

### Keyboard Shortcuts

**VS Code:**
- `Ctrl+P` / `Cmd+P` - Quick file open
- `Ctrl+Shift+F` / `Cmd+Shift+F` - Search in all files
- `F12` - Go to definition
- `Shift+F12` - Find all references

## 🆘 Getting Help

### When You're Stuck

1. **Check existing documentation**
   - README.md
   - API_DOCUMENTATION.md
   - ARCHITECTURE.md
   - Code comments (JSDoc)

2. **Search the codebase**
   - Look for similar implementations
   - Check how similar features are built

3. **Debug systematically**
   - Check browser console for errors
   - Check terminal for backend errors
   - Use `console.log()` liberally
   - Use browser DevTools debugger

4. **Ask for help**
   - Email: rabbas@mail.umw.edu
   - Include:
     - What you're trying to do
     - What you've tried
     - Error messages
     - Screenshots if relevant

### Common Issues & Solutions

**Issue: "Module not found"**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Issue: "Port already in use"**
```bash
# Kill process on port 5001 (API)
lsof -ti:5001 | xargs kill -9

# Kill process on port 5173 (Frontend)
lsof -ti:5173 | xargs kill -9
```

**Issue: "TypeScript errors but code works"**
```bash
# Restart TypeScript server in VS Code
# Command Palette > TypeScript: Restart TS Server
```

**Issue: "Changes not showing"**
- Hard refresh browser: `Ctrl+Shift+R` / `Cmd+Shift+R`
- Clear browser cache
- Restart dev server

## 🎯 Next Steps

After completing this onboarding:

1. **Review** [CONTRIBUTING.md](CONTRIBUTING.md) for coding standards
2. **Pick up** a starter task from the backlog
3. **Schedule** a code review with the team lead
4. **Start** contributing to the project!

---

**Welcome to the team! 🎉**

If you have suggestions for improving this onboarding guide, please submit a PR!

