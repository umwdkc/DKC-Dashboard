# API Documentation

> **Copyright DKC UMW, All rights reserved**

Complete reference for the DKC Booking Dashboard API.

## 📋 Table of Contents

- [Overview](#overview)
- [Base URL](#base-url)
- [Authentication](#authentication)
- [Endpoints](#endpoints)
- [Data Models](#data-models)
- [Error Handling](#error-handling)
- [Examples](#examples)
- [Rate Limiting](#rate-limiting)

## 🔭 Overview

The DKC Booking Dashboard API is a RESTful API that serves as a proxy to the SimplyBook.me API. It provides:

- Simplified data access with standardized responses
- Automatic data transformation and categorization
- Caching for improved performance
- Aggregated statistics and analytics

**Technology Stack:**
- Node.js 18+
- Express.js 4.x
- Axios for HTTP requests
- Luxon for date handling

## 🌐 Base URL

### Production
```
https://rusul-dkc.vercel.app/api
```

### Development
```
http://localhost:5001/api
```

## 🔐 Authentication

The API handles authentication with SimplyBook.me internally. No authentication is required from the client.

**Internal Process:**
1. API server authenticates with SimplyBook using stored credentials
2. Tokens are cached for 1 hour
3. Automatic token refresh when expired

## 📡 Endpoints

### Health Check

Check if the API is running.

```http
GET /
```

**Response:**
```
Hello World
```

---

### Get Bookings

Retrieve booking records for a specified date range.

```http
GET /api/bookings
```

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `start_date` | string | No | 30 days ago | Start date in YYYY-MM-DD format |
| `end_date` | string | No | Today | End date in YYYY-MM-DD format |

#### Response

**Success (200 OK):**

```json
{
  "message": "Bookings retrieved successfully",
  "data": [
    {
      "Date": "2025-01-15 14:00:00",
      "Status": "confirmed",
      "Client": "John Doe",
      "Service": "Podcast Studio",
      "Provider": "Studio Equipment",
      "Code": "abc123xyz",
      "Category": "Space Bookings",
      "Created": "2025-01-10 09:30:00",
      "RelatedResources": "Microphone, Audio Interface"
    }
  ],
  "count": 1
}
```

**Error (500 Internal Server Error):**

```json
{
  "message": "Failed to retrieve booking data",
  "error": "Error description",
  "data": []
}
```

#### Example Request

```bash
# Fetch bookings for January 2025
curl "https://rusul-dkc.vercel.app/api/bookings?start_date=2025-01-01&end_date=2025-01-31"
```

```javascript
// JavaScript/TypeScript
const response = await axios.get('/api/bookings', {
  params: {
    start_date: '2025-01-01',
    end_date: '2025-01-31'
  }
});

console.log(response.data.count); // Number of bookings
console.log(response.data.data); // Array of booking objects
```

---

### Get Booking Statistics

Retrieve aggregated statistics for bookings in a date range.

```http
GET /api/bookings/stats
```

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `start_date` | string | No | 30 days ago | Start date in YYYY-MM-DD format |
| `end_date` | string | No | Today | End date in YYYY-MM-DD format |

#### Response

**Success (200 OK):**

```json
{
  "message": "Booking stats retrieved successfully",
  "service_counts": {
    "Podcast Studio": 45,
    "3D Printer": 32,
    "Sewing Machine": 28,
    "Online Consultation": 15
  },
  "staff_counts": {
    "Jane Smith": 67,
    "Mike Johnson": 53
  },
  "space_counts": {
    "Podcast Studio": 45,
    "Production Room": 23,
    "Makerspace": 18
  },
  "date_counts": {
    "2025-01-01": 5,
    "2025-01-02": 8,
    "2025-01-03": 12
  },
  "category_counts": {
    "Space Bookings": 73,
    "In-Person Consultations": 67,
    "Training Appointments": 22,
    "Online Consultations": 15,
    "Class Visits": 3
  }
}
```

**Error (500 Internal Server Error):**

```json
{
  "message": "Failed to retrieve booking stats",
  "error": "Error description",
  "service_counts": {},
  "staff_counts": {},
  "space_counts": {},
  "date_counts": {},
  "category_counts": {}
}
```

#### Example Request

```bash
# Get stats for Q1 2025
curl "https://rusul-dkc.vercel.app/api/bookings/stats?start_date=2025-01-01&end_date=2025-03-31"
```

```javascript
// JavaScript/TypeScript
const response = await axios.get('/api/bookings/stats', {
  params: {
    start_date: '2025-01-01',
    end_date: '2025-03-31'
  }
});

console.log(response.data.service_counts); // Services by count
console.log(response.data.category_counts); // Categories by count
```

---

## 📊 Data Models

### BookingData

Standardized booking object returned by the API.

```typescript
interface BookingData {
  /** Date and time of the booking in 'YYYY-MM-DD HH:mm:ss' format */
  Date: string;
  
  /** Booking status ('confirmed', 'pending', 'cancelled', etc.) */
  Status: string;
  
  /** Full name of the client who made the booking */
  Client: string;
  
  /** Name of the service or resource booked */
  Service: string;
  
  /** Staff member or equipment providing the service */
  Provider: string;
  
  /** Unique booking code/identifier */
  Code: string;
  
  /** Automatically categorized booking type */
  Category: 'Space Bookings' | 'In-Person Consultations' | 
            'Training Appointments' | 'Online Consultations' | 
            'Class Visits';
  
  /** When the booking was created in 'YYYY-MM-DD HH:mm:ss' format */
  Created: string;
  
  /** Additional resources associated with the booking */
  RelatedResources: string;
}
```

### Category Determination

Bookings are automatically categorized based on keywords in the Service, Provider, and RelatedResources fields:

#### **Space Bookings**
Keywords: `studio`, `podcast`, `sewing machine`, `production`, `3d printer`, `space`, `room`, `lab`, `workshop area`, `makerspace`, `cricut`

#### **Online Consultations**
Keywords: `online`, `virtual`, `remote`, `zoom`, `teams`, `video`, `digital`

#### **Class Visits**
Keywords: `class`, `workshop`, `visit`, `tour`, `group`, `session`, `demonstration`, `seminar`, `lecture`, `meeting`

#### **Training Appointments**
Keywords: `training`, `lesson`, `instruction`, `teach`, `tutorial`, `learn`, `education`, `course`, `curriculum`, `coaching`

#### **In-Person Consultations**
Default category when no other keywords match.

### StatsResponse

Statistics aggregation object.

```typescript
interface StatsResponse {
  /** Success or error message */
  message: string;
  
  /** Count of bookings per service type */
  service_counts?: Record<string, number>;
  
  /** Count of bookings per staff member */
  staff_counts?: Record<string, number>;
  
  /** Count of bookings per space/equipment */
  space_counts?: Record<string, number>;
  
  /** Count of bookings per date */
  date_counts?: Record<string, number>;
  
  /** Count of bookings per category */
  category_counts?: Record<string, number>;
  
  /** Error message if request failed */
  error?: string;
}
```

---

## ⚠️ Error Handling

### HTTP Status Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| 200 | Success | Request completed successfully |
| 500 | Internal Server Error | API error, SimplyBook unavailable, authentication failed |

### Error Response Format

All errors follow this structure:

```json
{
  "message": "Human-readable error message",
  "error": "Technical error details",
  "data": [] // or empty objects for stats endpoint
}
```

### Common Errors

**1. Authentication Failed**
```json
{
  "message": "Authentication failed",
  "error": "Failed to authenticate with the booking API"
}
```

**Solution:** Check API credentials are configured correctly.

**2. SimplyBook API Unavailable**
```json
{
  "message": "Failed to retrieve booking data",
  "error": "SimplyBook API is temporarily unavailable"
}
```

**Solution:** Retry after a few minutes.

**3. Invalid Date Format**
While the API will accept invalid dates, you'll get empty results.

**Solution:** Always use `YYYY-MM-DD` format.

---

## 📝 Examples

### Complete Integration Example

```typescript
import axios from 'axios';

const API_URL = 'https://rusul-dkc.vercel.app/api';

/**
 * Fetch bookings for a date range
 */
async function getBookings(startDate: string, endDate: string) {
  try {
    const response = await axios.get(`${API_URL}/bookings`, {
      params: { start_date: startDate, end_date: endDate }
    });
    
    return response.data.data; // Array of BookingData
  } catch (error) {
    console.error('Error fetching bookings:', error);
    throw error;
  }
}

/**
 * Fetch booking statistics
 */
async function getStats(startDate: string, endDate: string) {
  try {
    const response = await axios.get(`${API_URL}/bookings/stats`, {
      params: { start_date: startDate, end_date: endDate }
    });
    
    return response.data; // StatsResponse
  } catch (error) {
    console.error('Error fetching stats:', error);
    throw error;
  }
}

/**
 * Usage example
 */
async function analyzeDKCBookings() {
  const startDate = '2025-01-01';
  const endDate = '2025-01-31';
  
  // Get bookings
  const bookings = await getBookings(startDate, endDate);
  console.log(`Total bookings: ${bookings.length}`);
  
  // Get statistics
  const stats = await getStats(startDate, endDate);
  console.log(`Most popular service:`, 
    Object.entries(stats.service_counts || {})
      .sort((a, b) => b[1] - a[1])[0]
  );
  
  // Filter confirmed bookings
  const confirmed = bookings.filter(b => 
    b.Status.toLowerCase().includes('confirm')
  );
  console.log(`Confirmed bookings: ${confirmed.length}`);
  
  // Group by category
  const byCategory = bookings.reduce((acc, booking) => {
    acc[booking.Category] = (acc[booking.Category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  console.log('By category:', byCategory);
}

analyzeDKCBookings();
```

### React Hook Example

```typescript
import { useState, useEffect } from 'react';
import axios from 'axios';

interface UseBookingsOptions {
  startDate: string;
  endDate: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

function useBookings(options: UseBookingsOptions) {
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/bookings', {
        params: {
          start_date: options.startDate,
          end_date: options.endDate
        }
      });
      setBookings(response.data.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchBookings();
    
    // Auto-refresh if enabled
    if (options.autoRefresh) {
      const interval = setInterval(
        fetchBookings, 
        options.refreshInterval || 60000 // Default 1 minute
      );
      return () => clearInterval(interval);
    }
  }, [options.startDate, options.endDate]);
  
  return { bookings, loading, error, refetch: fetchBookings };
}

// Usage
function BookingsPage() {
  const { bookings, loading, error } = useBookings({
    startDate: '2025-01-01',
    endDate: '2025-01-31',
    autoRefresh: true,
    refreshInterval: 300000 // 5 minutes
  });
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      <h1>Found {bookings.length} bookings</h1>
      {/* Render bookings */}
    </div>
  );
}
```

---

## 🚦 Rate Limiting

Currently, there are no explicit rate limits on the API endpoints. However:

- **Client-side caching** is strongly recommended (30-minute cache)
- **Batch requests** when fetching data for multiple date ranges
- **Avoid polling** more frequently than every 5 minutes
- The API implements its own **internal caching** (5-minute TTL)

### Best Practices

```typescript
// ✅ Good: Cache responses
const cache = new Map();

async function getCachedBookings(startDate, endDate) {
  const key = `${startDate}_${endDate}`;
  const cached = cache.get(key);
  
  if (cached && Date.now() - cached.timestamp < 30 * 60 * 1000) {
    return cached.data;
  }
  
  const data = await fetchBookings(startDate, endDate);
  cache.set(key, { data, timestamp: Date.now() });
  return data;
}

// ❌ Bad: Polling every second
setInterval(() => fetchBookings(), 1000);

// ✅ Good: Reasonable polling interval
setInterval(() => fetchBookings(), 5 * 60 * 1000); // 5 minutes
```

---

## 🔧 Troubleshooting

### Empty Results

**Problem:** API returns empty array even though bookings exist.

**Possible causes:**
1. Date range has no bookings
2. Date format is incorrect (must be YYYY-MM-DD)
3. Dates are in the future
4. SimplyBook account has no data for that period

**Solution:**
```javascript
// Verify date format
const startDate = '2025-01-01'; // ✅ Correct
const badDate = '01/01/2025';   // ❌ Wrong format

// Check for valid date range
const start = new Date(startDate);
const end = new Date(endDate);
console.log(start < end); // Should be true
```

### Slow Response Times

**Problem:** API takes a long time to respond.

**Possible causes:**
1. Large date range (>6 months)
2. SimplyBook API is slow
3. Cold start (Vercel serverless function)

**Solutions:**
- Limit date ranges to 3-6 months
- Implement loading states in UI
- Use cached data when available
- Consider implementing server-side caching layer

---

## 📞 Support

For API issues or questions:

**Email:** rabbas@mail.umw.edu

**Repository:** [Link to repository]

**Documentation:** See also [ARCHITECTURE.md](ARCHITECTURE.md) for system design details

---

**Last Updated:** January 2025

