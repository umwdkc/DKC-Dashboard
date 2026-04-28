// Copyright DKC UMW, All rights reserved

/**
 * Dashboard page component for the DKC Booking Dashboard.
 * 
 * This component provides comprehensive analytics and visualizations for booking data with:
 * - Interactive date range selection
 * - Multiple chart types (line, bar, pie)
 * - Four main tabs: Overview, Services, Staff, Spaces
 * - Real-time data refresh capabilities
 * - Client-side caching for performance
 * - Responsive charts that adapt to screen size
 * 
 * Charts and visualizations include:
 * - Bookings over time (line/area chart)
 * - Booking categories distribution (pie chart)
 * - Booking status breakdown (pie chart)
 * - Top services ranked (horizontal bar chart)
 * - Service type analysis (vertical bar chart)
 * - Staff member booking counts (vertical bar chart)
 * - Equipment and space usage (vertical bar chart)
 * 
 * The component automatically categorizes bookings and provides detailed
 * statistics to help understand booking patterns and resource utilization.
 * 
 * @module Dashboard
 */

/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from "react";
import axios from "axios";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import {
  CalendarIcon,
  RefreshCw,
  LineChart,
  PieChart,
  BarChart,
  DatabaseIcon,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  BarChart as RechartsBarChart,
  Bar,
  LineChart as RechartsLineChart,
  Line,
  Area,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  Tooltip,
} from "recharts";
import { toast } from "sonner";

// API Configuration
// const API_URL = 'http://localhost:5001/api'; // Use for local development with Express server
const API_URL = "https://dkc-dashboard.vercel.app/api"; // Production API endpoint

/**
 * Cache expiration duration in milliseconds (30 minutes).
 * Cached dashboard data is automatically refreshed after this period.
 */
const CACHE_EXPIRATION = 30 * 60 * 1000;

type StatsResponse = {
  message: string;
  service_counts?: Record<string, number>;
  staff_counts?: Record<string, number>;
  space_counts?: Record<string, number>;
  date_counts?: Record<string, number>;
  category_counts?: Record<string, number>;
  error?: string;
};

type BookingsResponse = {
  message: string;
  data?: BookingData[];
  error?: string;
  count?: number;
};

type BookingData = {
  Date: string;
  Status: string;
  Client: string;
  Service: string;
  Provider: string;
  Code: string;
  Category?: string;
  Created: string;
  RelatedResources: string;
};

type CacheData = {
  timestamp: number;
  startDate: string;
  endDate: string;
  bookingsData: BookingData[];
  statsData: StatsResponse | null;
};

/**
 * Default color palette for charts.
 * Uses CSS custom properties for theme-aware colors that adapt to light/dark mode.
 */
const COLORS = [
  "hsl(var(--chart-1))", // Orange
  "hsl(var(--chart-2))", // Teal
  "hsl(var(--chart-3))", // Purple
  "hsl(var(--chart-4))", // Pink/Red
  "hsl(var(--chart-5))", // Blue
  "hsl(var(--primary))", // Purple (primary)
  "hsl(var(--secondary))", // Teal (secondary)
  "hsl(var(--accent))", // Orange (accent)
  "hsl(var(--chart-1) / 0.8)", // Semi-transparent variants
  "hsl(var(--chart-2) / 0.8)",
  "hsl(var(--chart-3) / 0.8)",
  "hsl(var(--chart-4) / 0.8)",
];

const STAFF_COLORS = [
  "hsl(var(--chart-3))", // Purple
  "hsl(var(--chart-4))", // Pink/Red
  "hsl(var(--primary))", // Purple (primary)
  "hsl(var(--chart-3) / 0.8)",
  "hsl(var(--chart-4) / 0.8)",
  "hsl(var(--primary) / 0.8)",
  "hsl(var(--chart-3) / 0.6)",
  "hsl(var(--chart-4) / 0.6)",
];

const SPACE_COLORS = [
  "hsl(var(--chart-2))", // Teal
  "hsl(var(--chart-5))", // Blue
  "hsl(var(--secondary))", // Teal (secondary)
  "hsl(var(--chart-2) / 0.8)",
  "hsl(var(--chart-5) / 0.8)",
  "hsl(var(--secondary) / 0.8)",
  "hsl(var(--chart-2) / 0.6)",
  "hsl(var(--chart-5) / 0.6)",
];

const CATEGORY_COLORS = {
  "Training Appointments": "hsl(var(--chart-1))", // Orange
  "In-Person Consultations": "hsl(var(--chart-3))", // Purple
  "Space Bookings": "hsl(var(--chart-2))", // Teal
  "Online Consultations": "hsl(var(--chart-4))", // Pink/Red
  "Class Visits": "hsl(var(--chart-5))", // Blue
};

const STATUS_COLORS = {
  active: "hsl(124 100% 35%)", // Green
  cancelled: "hsl(var(--chart-4))", // Pink/Red
};

/**
 * Categorizes a booking based on keywords found in service, provider, and resource fields.
 * 
 * This intelligent categorization algorithm analyzes booking details and assigns
 * one of five predefined categories using keyword matching. The categories are
 * checked in priority order to ensure accurate classification.
 * 
 * Categories (in priority order):
 * 1. Space Bookings - Equipment or room reservations
 * 2. Online Consultations - Virtual/remote sessions
 * 3. Class Visits - Group activities or tours
 * 4. Training Appointments - Educational sessions
 * 5. In-Person Consultations - Default for individual meetings
 * 
 * @param {BookingData} booking - The booking record to categorize
 * @returns {string} The assigned category name
 * 
 * @example
 * // Equipment booking
 * determineCategory({ Service: "3D Printer", ... }) // "Space Bookings"
 * 
 * @example
 * // Online session
 * determineCategory({ Service: "Zoom Consultation", ... }) // "Online Consultations"
 */
const determineCategory = (booking: BookingData): string => {
  const service = booking.Service.toLowerCase();
  const provider = booking.Provider.toLowerCase();
  const resources = booking.RelatedResources.toLowerCase();

  // Space Bookings - Look for specific space-related keywords
  const spaceKeywords = [
    "studio",
    "podcast",
    "sewing machine",
    "production",
    "3d printer",
    "space",
    "room",
    "lab",
    "workshop area",
    "makerspace",
    "cricut",
  ];

  for (const keyword of spaceKeywords) {
    if (
      service.includes(keyword) ||
      provider.includes(keyword) ||
      resources.includes(keyword)
    ) {
      return "Space Bookings";
    }
  }

  // Online Consultations
  const onlineKeywords = [
    "online",
    "virtual",
    "remote",
    "zoom",
    "teams",
    "video",
    "digital",
  ];
  for (const keyword of onlineKeywords) {
    if (service.includes(keyword) || provider.includes(keyword)) {
      return "Online Consultations";
    }
  }

  // Class Visits
  const classKeywords = [
    "class",
    "workshop",
    "visit",
    "tour",
    "group",
    "session",
    "demonstration",
    "seminar",
    "lecture",
    "meeting",
  ];
  for (const keyword of classKeywords) {
    if (service.includes(keyword)) {
      return "Class Visits";
    }
  }

  // Training Appointments
  const trainingKeywords = [
    "training",
    "lesson",
    "instruction",
    "teach",
    "tutorial",
    "learn",
    "education",
    "course",
    "curriculum",
    "coaching",
  ];
  for (const keyword of trainingKeywords) {
    if (service.includes(keyword)) {
      return "Training Appointments";
    }
  }

  // Default category for in-person consultations (when none of the above match)
  return "In-Person Consultations";
};

/**
 * Main Dashboard component that provides analytics and visualizations for booking data.
 * 
 * This component manages state for:
 * - Data fetching and caching
 * - Date range selection
 * - Chart data transformations
 * - Loading and error states
 * 
 * Features:
 * - Real-time data refresh
 * - Intelligent caching with expiration
 * - Multiple visualization tabs
 * - Responsive chart layouts
 * - Summary statistics cards
 * 
 * @returns {JSX.Element} The dashboard component with charts and analytics
 */
export default function Dashboard() {
  // Loading states
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [usingCache, setUsingCache] = useState(false);
  
  // Data states
  const [bookingsData, setBookingsData] = useState<BookingData[]>([]);
  const [statsData, setStatsData] = useState<StatsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Date range for filtering
  const [startDate, setStartDate] = useState<Date | undefined>(
    new Date("2025-01-01")
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    new Date("2025-05-01")
  );
  
  // Tracking when data was last fetched
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const formatDateForApi = (date: Date | undefined) => {
    if (!date) return "";
    return format(date, "yyyy-MM-dd");
  };

  const getCacheKey = () => {
    const formattedStartDate = formatDateForApi(startDate);
    const formattedEndDate = formatDateForApi(endDate);
    return `dashboard_cache_${formattedStartDate}_${formattedEndDate}`;
  };

  // Check if the cache is valid (not expired and same date range)
  const isCacheValid = (cacheData: CacheData): boolean => {
    const now = Date.now();
    const cacheAge = now - cacheData.timestamp;

    // Check if cache has expired
    if (cacheAge > CACHE_EXPIRATION) {
      return false;
    }

    // Check if date range matches
    const formattedStartDate = formatDateForApi(startDate);
    const formattedEndDate = formatDateForApi(endDate);

    return (
      cacheData.startDate === formattedStartDate &&
      cacheData.endDate === formattedEndDate
    );
  };

  // Save data to cache
  const saveToCache = (
    bookingsData: BookingData[],
    statsData: StatsResponse | null
  ) => {
    const cacheKey = getCacheKey();
    const formattedStartDate = formatDateForApi(startDate);
    const formattedEndDate = formatDateForApi(endDate);

    const cacheData: CacheData = {
      timestamp: Date.now(),
      startDate: formattedStartDate,
      endDate: formattedEndDate,
      bookingsData,
      statsData,
    };

    try {
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.error("Error caching dashboard data:", error);
    }
  };

  const loadFromCache = (): boolean => {
    try {
      const cacheKey = getCacheKey();
      const cachedDataStr = localStorage.getItem(cacheKey);

      if (!cachedDataStr) {
        return false;
      }

      const cachedData: CacheData = JSON.parse(cachedDataStr);

      if (!isCacheValid(cachedData)) {
        return false;
      }

      setBookingsData(cachedData.bookingsData);
      setStatsData(cachedData.statsData);
      setLastUpdated(new Date(cachedData.timestamp));
      setUsingCache(true);

      toast("Using cached data", {
        description: `Last updated ${format(
          new Date(cachedData.timestamp),
          "PPp"
        )}`,
        icon: <DatabaseIcon className="h-4 w-4" />,
      });

      return true;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // If we can't parse the cache data, remove it
      const key = getCacheKey();
      localStorage.removeItem(key);
      return false;
    }
  };

  const clearAllCaches = () => {
    try {
      const keysToRemove: string[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("dashboard_cache_")) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach((key) => localStorage.removeItem(key));

    } catch (error) {
      console.error("Error clearing dashboard caches:", error);
    }
  };

  const fetchData = async (forceRefresh = false) => {
    if (refreshing) return;

    if (!forceRefresh && loadFromCache()) {
      return;
    }

    setUsingCache(false);
    setLoading(!bookingsData.length);
    setRefreshing(bookingsData.length > 0);
    setError(null);

    try {
      const formattedStartDate = formatDateForApi(startDate);
      const formattedEndDate = formatDateForApi(endDate);

      const bookingsUrl = `${API_URL}/bookings?start_date=${formattedStartDate}&end_date=${formattedEndDate}`;
      const bookingsResult = await axios.get<BookingsResponse>(bookingsUrl);

      console.log("Bookings Data:", bookingsResult.data);

      let newBookingsData: BookingData[] = [];
      if (bookingsResult.data.data && Array.isArray(bookingsResult.data.data)) {
        newBookingsData = bookingsResult.data.data;
        setBookingsData(newBookingsData);
      }

      const statsUrl = `${API_URL}/bookings/stats?start_date=${formattedStartDate}&end_date=${formattedEndDate}`;
      const statsResult = await axios.get<StatsResponse>(statsUrl);
      setStatsData(statsResult.data);

      console.log("Stats Data:", statsResult.data);

      saveToCache(newBookingsData, statsResult.data);

      const now = new Date();
      setLastUpdated(now);


      toast("Data updated", {
        description: `Successfully loaded ${newBookingsData.length} bookings`,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      console.error("API Error:", err);

      toast("Error loading data", {
        description: errorMessage,
        className: "bg-red-100 border-red-400 text-red-700",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Return cleanup function to clear stale caches
    return () => {
      // Clear caches older than 24 hours (all caches would be too aggressive)
      try {
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith("dashboard_cache_")) {
            try {
              const cacheData = JSON.parse(localStorage.getItem(key) || "{}");
              if (cacheData.timestamp && cacheData.timestamp < oneDayAgo) {
                localStorage.removeItem(key);
              }
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (error) {
              localStorage.removeItem(key);
            }
          }
        });
      } catch (error) {
        console.error("Error cleaning up old caches:", error);
      }
    };
  }, []);

  // Refetch data when date range changes
  useEffect(() => {
    if (startDate && endDate) {
      // Check if we have data loaded already and the dates changed
      if (bookingsData.length > 0 && lastUpdated) {
        // Always try to load from cache first when date range changes
        fetchData(false);
      }
    }
  }, [startDate, endDate]);

  const getTotalBookings = () => bookingsData.length;

  const getConfirmedBookings = () =>
    bookingsData.filter((b) => b.Status?.toLowerCase().includes("confirm"))
      .length;

  // Get unique services count
  const getUniqueServicesCount = () =>
    statsData?.service_counts
      ? Object.keys(statsData.service_counts).length
      : 0;

  const getCategoriesCount = () =>
    statsData?.category_counts
      ? Object.keys(statsData.category_counts).length
      : 0;

  const handleForceRefresh = () => {
    fetchData(true);
  };

  const getConfirmedBookingsData = () => {
    return bookingsData.filter((b) => {
      const status = b.Status?.trim().toLowerCase() || "";
      return status.includes("confirm") || status === "4";
    });
  };

  // Get service data from confirmed bookings
  const getConfirmedServiceChartData = () => {
    if (!bookingsData.length) return [];

    const confirmedBookings = getConfirmedBookingsData();
    const serviceCounts: Record<string, number> = {};

    confirmedBookings.forEach((booking) => {
      // Use the Service field which contains service types (like "Basic 3D Printer" or "Podcast Studio")
      const service = booking.Service;
      if (service && service.trim() !== '') {
        serviceCounts[service] = (serviceCounts[service] || 0) + 1;
      }
    });

    return Object.entries(serviceCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  };

  // Space items for identification
  const spaceItems = [
    "podcast studio",
    "sewing machine",
    "production studio",
    "3d printer",
    "cricut",
    "printer",
    "lab",
    "room",
    "makerspace",
  ];

  // Get space data based on patterns in confirmed bookings
  const getConfirmedSpaceChartData = () => {
    if (!bookingsData.length) return [];

    const confirmedBookings = getConfirmedBookingsData();
    const spaceCounts: Record<string, number> = {};

    confirmedBookings.forEach((booking) => {
      const service = booking.Service;
      const nameLower = service.toLowerCase();

      // Only include space-related services
      if (
        spaceItems.some((keyword) => nameLower.includes(keyword.toLowerCase()))
      ) {
        spaceCounts[service] = (spaceCounts[service] || 0) + 1;
      }
    });

    return Object.entries(spaceCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  };

  // Get staff data from confirmed bookings
  const getConfirmedStaffChartData = () => {
    if (!bookingsData.length) return [];

    const confirmedBookings = getConfirmedBookingsData();
    const staffCounts: Record<string, number> = {};

    confirmedBookings.forEach((booking) => {
      // Use Provider field for staff members
      const provider = booking.Provider;
      if (provider && provider.trim() !== '') {
        // Only include providers that are not spaces/equipment
        const providerLower = provider.toLowerCase();
        if (!spaceItems.some(keyword => providerLower.includes(keyword.toLowerCase()))) {
          staffCounts[provider] = (staffCounts[provider] || 0) + 1;
        }
      }
    });

    return Object.entries(staffCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  };

  // Get booking status data simplified to just Active/Cancelled
  const getStatusData = () => {
    if (!bookingsData.length) return [];

    // Count bookings by simplified status
    const statusCounts = {
      "Active": 0,
      "Cancelled": 0
    };
    
    bookingsData.forEach((booking) => {
      const originalStatus = booking.Status?.trim().toLowerCase() || "unknown";
      
      // If status includes "confirm" or is "4" (confirmed), mark as Active
      // Otherwise mark as Cancelled
      if (originalStatus.includes("confirm") || originalStatus === "4") {
        statusCounts["Active"] += 1;
      } else {
        statusCounts["Cancelled"] += 1;
      }
    });

    // Convert to chart data format
    return Object.entries(statusCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value); // Sort by value descending
  };

  // Transform date counts to chart data format for confirmed bookings only
  const getConfirmedDateChartData = () => {
    if (!bookingsData.length) return [];

    const confirmedBookings = getConfirmedBookingsData();

    // Group bookings by date
    const dateCounts: Record<string, number> = {};
    confirmedBookings.forEach((booking) => {
      // Extract just the date part (YYYY-MM-DD)
      const date = booking.Date.split(" ")[0];
      if (date) {
        dateCounts[date] = (dateCounts[date] || 0) + 1;
      }
    });

    // Convert to chart data format
    return Object.entries(dateCounts)
      .sort((a, b) => a[0].localeCompare(b[0])) // Sort by date
      .map(([date, count]) => ({
        date,
        bookings: count,
      }));
  };

  // Get booking categories chart data for confirmed bookings only
  const getConfirmedCategoryChartData = () => {
    if (!bookingsData.length) return [];

    const confirmedBookings = getConfirmedBookingsData();

    // Count bookings by category
    const categoryCounts: Record<string, number> = {};
    confirmedBookings.forEach((booking) => {
      const category = booking.Category || determineCategory(booking);
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });

    // Convert to chart data format
    return Object.entries(categoryCounts).map(([name, value]) => ({
      name,
      value,
    }));
  };

  return (
    <div className="container mx-auto px-2 sm:px-4">
      <div className="flex flex-col space-y-6">
        {/* Dashboard Header */}
        <header className="space-y-2">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
       
            <div className="flex items-center gap-2 mt-4 ml-auto">
              {lastUpdated && (
                <div className="text-xs text-muted-foreground mr-2 flex items-center flex-shrink-0 max-w-[160px] sm:max-w-none truncate">
                  {usingCache && (
                    <DatabaseIcon className="h-3 w-3 mr-1 flex-shrink-0" />
                  )}
                  <span className="truncate">
                    Last updated: {format(lastUpdated, "MMM d, yyyy h:mm a")}
                  </span>
                </div>
              )}
              <Button
                variant="outline"
                className="flex items-center gap-2 flex-shrink-0"
                onClick={() => handleForceRefresh()}
                disabled={loading || refreshing}
                size="sm"
              >
                <RefreshCw
                  className={`h-3 w-3 sm:h-4 sm:w-4 ${
                    refreshing ? "animate-spin" : ""
                  }`}
                />
                <span className="hidden sm:inline">Refresh Data</span>
                <span className="sm:hidden">Refresh</span>
              </Button>
            </div>
          </div>

          <Separator className="my-2" />
        </header>

        {/* Date Range Controls */}
        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle>Date Range</CardTitle>
            <CardDescription>
              Select the time period for your analytics data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">Start Date</label>
                  {startDate && (
                    <Badge variant="outline" className="text-xs sm:text-sm">
                      <span className="truncate">
                        {format(startDate, "MMM d, yyyy")}
                      </span>
                    </Badge>
                  )}
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className="w-full justify-start text-left font-normal"
                      size="sm"
                    >
                      <CalendarIcon className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                      {startDate ? (
                        <span className="truncate">
                          {format(startDate, "MMM d, yyyy")}
                        </span>
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">End Date</label>
                  {endDate && (
                    <Badge variant="outline" className="text-xs sm:text-sm">
                      <span className="truncate">
                        {format(endDate, "MMM d, yyyy")}
                      </span>
                    </Badge>
                  )}
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className="w-full justify-start text-left font-normal"
                      size="sm"
                    >
                      <CalendarIcon className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                      {endDate ? (
                        <span className="truncate">
                          {format(endDate, "MMM d, yyyy")}
                        </span>
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row sm:justify-between gap-2">
            <Button
              variant="outline"
              className="w-full sm:w-auto text-xs sm:text-sm"
              onClick={() => {
                setStartDate(new Date("2025-01-01"));
                setEndDate(new Date("2025-05-01"));
              }}
            >
              Reset to Jan-May 2025
            </Button>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                className="flex-1 sm:flex-initial text-xs sm:text-sm"
                onClick={() => clearAllCaches()}
              >
                Clear Cache
              </Button>
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  fetchData();
                }}
                disabled={loading || refreshing}
                className="flex-1 sm:flex-initial text-xs sm:text-sm"
              >
                {loading ? "Loading..." : "Update"}
              </Button>
            </div>
          </CardFooter>
        </Card>

        {error && (
          <Card className="border-destructive/50 bg-destructive/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-destructive">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-destructive text-sm">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Summary Stats Cards */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-[100px] sm:w-[140px]" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 sm:h-10 w-[80px] sm:w-[100px] mb-2" />
                  <Skeleton className="h-3 sm:h-4 w-[120px] sm:w-[180px]" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            <Card>
              <CardHeader className="pb-2 p-3 sm:p-6">
                <CardTitle className="text-sm sm:text-base font-medium">
                  Total Bookings
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 p-3 sm:p-6">
                <div className="text-xl sm:text-3xl font-bold">
                  {getTotalBookings()}
                </div>
                <p className="text-muted-foreground text-xs sm:text-sm mt-1">
                  All bookings in the selected period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 p-3 sm:p-6">
                <CardTitle className="text-sm sm:text-base font-medium">
                  Active Bookings
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 p-3 sm:p-6">
                <div className="text-xl sm:text-3xl font-bold text-primary">
                  {getConfirmedBookings()}
                </div>
                <p className="text-muted-foreground text-xs sm:text-sm mt-1">
                  {(
                    (getConfirmedBookings() / getTotalBookings()) *
                    100
                  ).toFixed(1)}
                  % active rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 p-3 sm:p-6">
                <CardTitle className="text-sm sm:text-base font-medium">
                  Unique Services
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 p-3 sm:p-6">
                <div className="text-xl sm:text-3xl font-bold text-secondary">
                  {getUniqueServicesCount()}
                </div>
                <p className="text-muted-foreground text-xs sm:text-sm mt-1">
                  Different service types booked
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 p-3 sm:p-6">
                <CardTitle className="text-sm sm:text-base font-medium">
                  Categories
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 p-3 sm:p-6">
                <div className="text-xl sm:text-3xl font-bold text-accent">
                  {getCategoriesCount()}
                </div>
                <p className="text-muted-foreground text-xs sm:text-sm mt-1">
                  Categories of services available
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Dashboard Content */}
        {loading ? (
          <Card>
            <CardContent className="pt-6">
              <div className="h-[300px] sm:h-[400px] flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                  <p className="text-lg sm:text-xl text-muted-foreground">
                    Loading analytics data...
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-4 sm:mb-6 h-auto sm:h-10">
              <TabsTrigger
                value="overview"
                className="flex items-center gap-1 sm:gap-2 py-1.5 sm:py-2 px-1 sm:px-3 text-xs sm:text-sm"
              >
                <PieChart className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>Overview</span>
              </TabsTrigger>
              <TabsTrigger
                value="services"
                className="flex items-center gap-1 sm:gap-2 py-1.5 sm:py-2 px-1 sm:px-3 text-xs sm:text-sm"
              >
                <BarChart className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>Services</span>
              </TabsTrigger>
              <TabsTrigger
                value="staff"
                className="flex items-center gap-1 sm:gap-2 py-1.5 sm:py-2 px-1 sm:px-3 text-xs sm:text-sm"
              >
                <BarChart className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>Staff</span>
              </TabsTrigger>
              <TabsTrigger
                value="spaces"
                className="flex items-center gap-1 sm:gap-2 py-1.5 sm:py-2 px-1 sm:px-3 text-xs sm:text-sm"
              >
                <BarChart className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>Spaces</span>
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <Card>
                  <CardHeader className="p-3 sm:p-6">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <LineChart className="h-4 w-4 sm:h-5 sm:w-5" />
                      Bookings Over Time
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Number of active bookings by date
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0 sm:p-0 h-64 sm:h-96 overflow-hidden">
                    {getConfirmedDateChartData().length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsLineChart
                          data={getConfirmedDateChartData()}
                          margin={{ top: 10, right: 10, left: 5, bottom: 40 }}
                        >
                          <defs>
                            <linearGradient
                              id="colorBookings"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="hsl(var(--chart-1))"
                                stopOpacity={0.8}
                              />
                              <stop
                                offset="95%"
                                stopColor="hsl(var(--chart-1))"
                                stopOpacity={0.1}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            strokeOpacity={0.4}
                          />
                          <XAxis
                            dataKey="date"
                            angle={-45}
                            textAnchor="end"
                            height={80}
                            tick={{ fontSize: 9, letterSpacing: -0.5 }}
                            tickMargin={12}
                          />
                          <YAxis width={30} tick={{ fontSize: 10 }} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--popover))",
                              color: "hsl(var(--popover-foreground))",
                              borderRadius: "8px",
                              border: "1px solid hsl(var(--border))",
                              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                              padding: "6px 8px",
                              fontSize: "12px",
                            }}
                            itemStyle={{
                              color: "hsl(var(--popover-foreground))",
                            }}
                            labelStyle={{
                              fontWeight: "bold",
                              marginBottom: "4px",
                              fontSize: "11px",
                            }}
                            formatter={(value) => [
                              `${value} bookings`,
                              "Bookings",
                            ]}
                            labelFormatter={(label) => `Date: ${label}`}
                          />
                          <Legend
                            wrapperStyle={{
                              paddingTop: "15px",
                              fontSize: "11px",
                            }}
                            verticalAlign="bottom"
                          />
                          <Area
                            type="monotone"
                            dataKey="bookings"
                            stroke="hsl(var(--chart-1))"
                            fillOpacity={1}
                            fill="url(#colorBookings)"
                            name="Confirmed Bookings"
                          />
                          <Line
                            type="monotone"
                            dataKey="bookings"
                            stroke="hsl(var(--chart-1))"
                            strokeWidth={2}
                            activeDot={{ r: 6 }}
                            dot={{ r: 1 }}
                            name="Confirmed Bookings"
                          />
                        </RechartsLineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex justify-center items-center h-64">
                        <div className="text-muted-foreground">
                          No date data available
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="p-3 sm:p-6">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <PieChart className="h-4 w-4 sm:h-5 sm:w-5" />
                      Booking Categories
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Active bookings by category
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0 sm:p-0 h-64 sm:h-96 overflow-hidden">
                    {getConfirmedCategoryChartData().length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={getConfirmedCategoryChartData()}
                            cx="50%"
                            cy="50%"
                            labelLine={true}
                            outerRadius={90}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) =>
                              `${
                                name.length > 15
                                  ? name.substring(0, 15) + "..."
                                  : name
                              }: ${(percent * 100).toFixed(0)}%`
                            }
                          >
                            {getConfirmedCategoryChartData().map(
                              (entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={
                                    CATEGORY_COLORS[
                                      entry.name as keyof typeof CATEGORY_COLORS
                                    ] || COLORS[index % COLORS.length]
                                  }
                                />
                              )
                            )}
                          </Pie>
                          <Tooltip
                            formatter={(value: number) => [
                              `${value} bookings`,
                              "Count",
                            ]}
                            contentStyle={{
                              backgroundColor: "hsl(var(--popover))",
                              color: "hsl(var(--popover-foreground))",
                              borderRadius: "8px",
                              border: "1px solid hsl(var(--border))",
                              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                              padding: "6px 8px",
                              fontSize: "12px",
                            }}
                            itemStyle={{
                              color: "hsl(var(--popover-foreground))",
                            }}
                            labelStyle={{
                              fontWeight: "bold",
                              marginBottom: "4px",
                              fontSize: "11px",
                            }}
                          />
                          <Legend
                            wrapperStyle={{
                              fontSize: "10px",
                              marginTop: "10px",
                            }}
                          />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex justify-center items-center h-64">
                        <div className="text-muted-foreground">
                          No category data available
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <Card>
                  <CardHeader className="p-3 sm:p-6">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <PieChart className="h-4 w-4 sm:h-5 sm:w-5" />
                      Booking Status
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Bookings by status
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0 sm:p-0 h-64 sm:h-96 overflow-hidden">
                    {getStatusData().length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={getStatusData()}
                            cx="50%"
                            cy="50%"
                            labelLine={true}
                            outerRadius={90}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) =>
                              `${
                                name.length > 10
                                  ? name.substring(0, 10) + "..."
                                  : name
                              }: ${(percent * 100).toFixed(0)}%`
                            }
                          >
                            {getStatusData().map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={
                                  entry.name.toLowerCase().includes("active")
                                    ? STATUS_COLORS.active
                                    : entry.name.toLowerCase().includes("cancelled")
                                    ? STATUS_COLORS.cancelled
                                    : COLORS[index % COLORS.length]
                                }
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: number) => [
                              `${value} bookings`,
                              "Count",
                            ]}
                            contentStyle={{
                              backgroundColor: "hsl(var(--popover))",
                              color: "hsl(var(--popover-foreground))",
                              borderRadius: "8px",
                              border: "1px solid hsl(var(--border))",
                              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                              padding: "6px 8px",
                              fontSize: "12px",
                            }}
                            itemStyle={{
                              color: "hsl(var(--popover-foreground))",
                            }}
                            labelStyle={{
                              fontWeight: "bold",
                              marginBottom: "4px",
                              fontSize: "11px",
                            }}
                          />
                          <Legend
                            wrapperStyle={{
                              fontSize: "10px",
                              marginTop: "10px",
                            }}
                          />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex justify-center items-center h-64">
                        <div className="text-muted-foreground text-sm">
                          No status data available
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="p-3 sm:p-6">
                    <CardTitle className="text-base sm:text-lg">
                      Top Services
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Most popular active services
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0 px-3 sm:px-6 pb-3 sm:pb-6">
                    <div className="h-64 sm:h-96 overflow-auto pr-1">
                      {getConfirmedServiceChartData().slice(0, 10).length >
                      0 ? (
                        <div className="space-y-3 sm:space-y-4">
                          {getConfirmedServiceChartData()
                            .slice(0, 10)
                            .map((service, index) => (
                              <div
                                key={index}
                                className="space-y-1 sm:space-y-2"
                              >
                                <div className="flex justify-between items-start">
                                  <span className="font-medium text-xs sm:text-sm truncate max-w-[70%]">
                                    {service.name}
                                  </span>
                                  <span className="text-muted-foreground text-xs sm:text-sm">
                                    {service.value} bookings
                                  </span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2 sm:h-2.5">
                                  <div
                                    style={{
                                      width: `${
                                        (service.value /
                                          getConfirmedServiceChartData()[0]
                                            .value) *
                                        100
                                      }%`,
                                      backgroundColor:
                                        COLORS[index % COLORS.length],
                                    }}
                                    className="h-2 sm:h-2.5 rounded-full"
                                  ></div>
                                </div>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <div className="flex justify-center items-center h-64">
                          <div className="text-muted-foreground text-sm">
                            No service data available
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Services Tab */}
            <TabsContent value="services" className="space-y-4 sm:space-y-6">
              <Card>
                <CardHeader className="p-3 sm:p-6">
                  <CardTitle className="text-base sm:text-lg">
                    Service Types
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Number of active bookings by service type (Basic 3D Printer, Podcast Studio, etc.)
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0 h-[400px] sm:h-[600px] overflow-hidden">
                  {getConfirmedServiceChartData().length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart
                        data={getConfirmedServiceChartData()}
                        layout="vertical"
                        margin={{ top: 10, right: 10, left: 5, bottom: 20 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          strokeOpacity={0.4}
                        />
                        <XAxis type="number" tick={{ fontSize: 10 }} />
                        <YAxis
                          dataKey="name"
                          type="category"
                          width={130}
                          tick={{ fontSize: 10 }}
                        />
                        <Tooltip
                          formatter={(value: number) => [
                            `${value} bookings`,
                            "Count",
                          ]}
                          contentStyle={{
                            backgroundColor: "hsl(var(--popover))",
                            color: "hsl(var(--popover-foreground))",
                            borderRadius: "8px",
                            border: "1px solid hsl(var(--border))",
                            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                            padding: "6px 8px",
                            fontSize: "12px",
                          }}
                          itemStyle={{
                            color: "hsl(var(--popover-foreground))",
                          }}
                          labelStyle={{
                            fontWeight: "bold",
                            marginBottom: "4px",
                            fontSize: "11px",
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: "10px" }} />
                        <Bar
                          dataKey="value"
                          fill="hsl(var(--chart-1))"
                          radius={[0, 4, 4, 0]}
                        >
                          {getConfirmedServiceChartData()
                            .slice(0, 20)
                            .map((_entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                        </Bar>
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex justify-center items-center h-64">
                      <div className="text-muted-foreground text-sm">
                        No service data available
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Staff Tab */}
            <TabsContent value="staff" className="space-y-4 sm:space-y-6">
              <Card>
                <CardHeader className="p-3 sm:p-6">
                  <CardTitle className="text-base sm:text-lg">
                    Staff Members
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Active booking counts by staff member (excluding equipment/spaces)
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0 h-[400px] sm:h-[600px] overflow-hidden">
                  {getConfirmedStaffChartData().length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart
                        data={getConfirmedStaffChartData()}
                        layout="vertical"
                        margin={{ top: 10, right: 10, left: 5, bottom: 20 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          strokeOpacity={0.4}
                        />
                        <XAxis type="number" tick={{ fontSize: 10 }} />
                        <YAxis
                          dataKey="name"
                          type="category"
                          width={130}
                          tick={{ fontSize: 10 }}
                        />
                        <Tooltip
                          formatter={(value: number) => [
                            `${value} bookings`,
                            "Count",
                          ]}
                          contentStyle={{
                            backgroundColor: "hsl(var(--popover))",
                            color: "hsl(var(--popover-foreground))",
                            borderRadius: "8px",
                            border: "1px solid hsl(var(--border))",
                            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                            padding: "6px 8px",
                            fontSize: "12px",
                          }}
                          itemStyle={{
                            color: "hsl(var(--popover-foreground))",
                          }}
                          labelStyle={{
                            fontWeight: "bold",
                            marginBottom: "4px",
                            fontSize: "11px",
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: "10px" }} />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                          {getConfirmedStaffChartData().map((_entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={STAFF_COLORS[index % STAFF_COLORS.length]}
                            />
                          ))}
                        </Bar>
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex justify-center items-center h-64">
                      <div className="text-muted-foreground text-sm">
                        No staff data available
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Spaces Tab */}
            <TabsContent value="spaces" className="space-y-4 sm:space-y-6">
              <Card>
                <CardHeader className="p-3 sm:p-6">
                  <CardTitle className="text-base sm:text-lg">
                    Equipment & Spaces
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Active booking counts for equipment and reservable spaces
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0 h-[400px] sm:h-[600px] overflow-hidden">
                  {getConfirmedSpaceChartData().length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart
                        data={getConfirmedSpaceChartData()}
                        layout="vertical"
                        margin={{ top: 10, right: 10, left: 5, bottom: 20 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          strokeOpacity={0.4}
                        />
                        <XAxis type="number" tick={{ fontSize: 10 }} />
                        <YAxis
                          dataKey="name"
                          type="category"
                          width={130}
                          tick={{ fontSize: 10 }}
                        />
                        <Tooltip
                          formatter={(value: number) => [
                            `${value} bookings`,
                            "Count",
                          ]}
                          contentStyle={{
                            backgroundColor: "hsl(var(--popover))",
                            color: "hsl(var(--popover-foreground))",
                            borderRadius: "8px",
                            border: "1px solid hsl(var(--border))",
                            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                            padding: "6px 8px",
                            fontSize: "12px",
                          }}
                          itemStyle={{
                            color: "hsl(var(--popover-foreground))",
                          }}
                          labelStyle={{
                            fontWeight: "bold",
                            marginBottom: "4px",
                            fontSize: "11px",
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: "10px" }} />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                          {getConfirmedSpaceChartData().map((_entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={SPACE_COLORS[index % SPACE_COLORS.length]}
                            />
                          ))}
                        </Bar>
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex justify-center items-center h-64">
                      <div className="text-muted-foreground text-sm">
                        No space data available
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
