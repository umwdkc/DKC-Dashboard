// Copyright DKC UMW, All rights reserved

/**
 * Bookings page component for the DKC Booking Dashboard.
 * 
 * This component provides a comprehensive table view of all bookings with:
 * - Date range filtering with calendar pickers
 * - Multiple filter options (category, status, service, provider)
 * - Search functionality across multiple fields
 * - Sortable table columns
 * - Pagination controls
 * - Client-side caching for improved performance
 * - Responsive design for mobile and desktop
 * 
 * The component fetches booking data from the API and provides an intuitive
 * interface for browsing and filtering through booking records.
 * 
 * @module Bookings
 */

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import {
  PaginationLink,
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '../components/ui/pagination';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { AlertCircle, CalendarIcon, DatabaseIcon, Filter, RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';

// API Configuration
// const API_URL = 'http://localhost:5001/api'; // Use for local development
// const API_URL = 'https://dkc-booking-dashboard.vercel.app/api'; // Alternative deployment URL
const API_URL = 'https://dkc-dashboard.vercel.app/api'; // Production API URL

/**
 * Cache expiration time in milliseconds (30 minutes).
 * After this duration, cached data is considered stale and will be refetched.
 */
const CACHE_EXPIRATION = 30 * 60 * 1000;

// Define cache data type
type CacheData = {
  timestamp: number;
  startDate: string;
  endDate: string;
  bookingsData: BookingData[];
};

// Define types
type ApiResponse = {
  message: string;
  data?: BookingData[];
  service_counts?: Record<string, number>;
  staff_counts?: Record<string, number>;
  space_counts?: Record<string, number>;
  date_counts?: Record<string, number>;
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

// Status badge colors
const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-800 border-green-300",
  cancelled: "bg-red-100 text-red-800 border-red-300",
};

// Category badge colors
const CATEGORY_COLORS: Record<string, string> = {
  "Training Appointments": "bg-amber-100 text-amber-800 border-amber-300",
  "In-Person Consultations": "bg-purple-100 text-purple-800 border-purple-300",
  "Space Bookings": "bg-blue-100 text-blue-800 border-blue-300",
  "Online Consultations": "bg-emerald-100 text-emerald-800 border-emerald-300",
  "Class Visits": "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300",
};

/**
 * Determines the category of a booking based on its service, provider, and resource information.
 * 
 * This function analyzes the booking data to categorize it into one of five types:
 * - Space Bookings: Equipment or room reservations (podcast studio, 3D printer, etc.)
 * - Online Consultations: Virtual meetings or remote sessions
 * - Class Visits: Group sessions, workshops, or tours
 * - Training Appointments: Learning sessions or tutorials
 * - In-Person Consultations: Default category for individual meetings
 * 
 * @param {BookingData} booking - The booking data to categorize
 * @returns {string} The determined category name
 * 
 * @example
 * const booking = { Service: "Podcast Studio", Provider: "Studio 1", ... };
 * const category = determineCategory(booking); // Returns: "Space Bookings"
 */
const determineCategory = (booking: BookingData): string => {
  const service = booking.Service.toLowerCase();
  const provider = booking.Provider.toLowerCase();
  const resources = booking.RelatedResources.toLowerCase();
  
  // Space Bookings - Look for specific space-related keywords
  const spaceKeywords = [
    "studio", "podcast", "sewing machine", "production", "3d printer", 
    "space", "room", "lab", "workshop area", "makerspace", "cricut"
  ];
  
  for (const keyword of spaceKeywords) {
    if (service.includes(keyword) || provider.includes(keyword) || resources.includes(keyword)) {
      return "Space Bookings";
    }
  }
  
  // Online Consultations
  const onlineKeywords = ["online", "virtual", "remote", "zoom", "teams", "video", "digital"];
  for (const keyword of onlineKeywords) {
    if (service.includes(keyword) || provider.includes(keyword)) {
      return "Online Consultations";
    }
  }
  
  // Class Visits
  const classKeywords = [
    "class", "workshop", "visit", "tour", "group", "session", 
    "demonstration", "seminar", "lecture", "meeting"
  ];
  for (const keyword of classKeywords) {
    if (service.includes(keyword)) {
      return "Class Visits";
    }
  }
  
  // Training Appointments
  const trainingKeywords = [
    "training", "lesson", "instruction", "teach", "tutorial", 
    "learn", "education", "course", "curriculum", "coaching"
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
 * Simplifies booking status into user-friendly categories.
 * 
 * Converts various status indicators into either "Active" or "Cancelled"
 * for easier understanding and display.
 * 
 * @param {string} status - The original status string from the API
 * @returns {string} Either "Active" or "Cancelled"
 * 
 * @example
 * simplifyStatus("confirmed") // Returns: "Active"
 * simplifyStatus("4") // Returns: "Active"
 * simplifyStatus("cancelled") // Returns: "Cancelled"
 */
const simplifyStatus = (status: string): string => {
  const statusLower = status.toLowerCase().trim();
  if (statusLower.includes("confirm") || statusLower === "4") {
    return "Active";
  } else {
    return "Cancelled";
  }
};

/**
 * Main Bookings component that displays a filterable and sortable table of booking records.
 * 
 * Features:
 * - Date range selection with calendar controls
 * - Multiple filter dimensions (category, status, service, provider, search)
 * - Sortable table columns
 * - Pagination with customizable page size
 * - Automatic caching to reduce API calls
 * - Responsive design with mobile-optimized layout
 * 
 * @returns {JSX.Element} The bookings table component
 */
export default function Bookings() {
  // Data state
  const [loading, setLoading] = useState(true);
  const [bookingsData, setBookingsData] = useState<BookingData[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Date range state
  const [startDate, setStartDate] = useState<Date | undefined>(new Date('2025-01-01'));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date('2025-05-01'));
  
  // Cache state
  const [usingCache, setUsingCache] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  
  // Filtering state - multiple dimensions for granular data exploration
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterService, setFilterService] = useState<string>('all');
  const [filterProvider, setFilterProvider] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Sorting state - allows users to order by any column
  const [sortField, setSortField] = useState<string>('Date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Format dates for API
  const formatDateForApi = (date: Date | undefined) => {
    if (!date) return '';
    return format(date, 'yyyy-MM-dd');
  };
  
  // Generate a unique cache key based on the date range
  const getCacheKey = () => {
    const formattedStartDate = formatDateForApi(startDate);
    const formattedEndDate = formatDateForApi(endDate);
    return `bookings_cache_${formattedStartDate}_${formattedEndDate}`;
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
  const saveToCache = (bookingsData: BookingData[]) => {
    const cacheKey = getCacheKey();
    const formattedStartDate = formatDateForApi(startDate);
    const formattedEndDate = formatDateForApi(endDate);
    
    const cacheData: CacheData = {
      timestamp: Date.now(),
      startDate: formattedStartDate,
      endDate: formattedEndDate,
      bookingsData
    };
    
    try {
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      console.log('Bookings data cached successfully', cacheKey);
    } catch (error) {
      console.error('Error caching bookings data:', error);
    }
  };

  // Load data from cache
  const loadFromCache = (): boolean => {
    try {
      const cacheKey = getCacheKey();
      const cachedDataStr = localStorage.getItem(cacheKey);
      
      if (!cachedDataStr) {
        return false;
      }
      
      const cachedData: CacheData = JSON.parse(cachedDataStr);
      
      if (!isCacheValid(cachedData)) {
        console.log('Cache expired or date range changed');
        return false;
      }
      
      setBookingsData(cachedData.bookingsData);
      setLastUpdated(new Date(cachedData.timestamp));
      setUsingCache(true);
      
      console.log('Using cached bookings data');
      toast.success("Using cached data from " + format(new Date(cachedData.timestamp), 'PPp'), {
        duration: 3000,
      });
      
      return true;
    } catch (error) {
      // If we can't parse the cache data, remove it
      const key = getCacheKey();
      localStorage.removeItem(key);
      return false;
    }
  };

  // Clear all bookings caches
  const clearAllCaches = () => {
    try {
      const keysToRemove: string[] = [];
      
      // Find all bookings cache keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('bookings_cache_')) {
          keysToRemove.push(key);
        }
      }
      
      // Remove all matching cache keys
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      console.log(`Cleared ${keysToRemove.length} bookings caches`);
      toast.success(`Cleared ${keysToRemove.length} cached results`);
    } catch (error) {
      console.error('Error clearing bookings caches:', error);
    }
  };
  
  // Filter data based on user selections
  const filteredData = bookingsData.filter(booking => {
    const category = booking.Category || determineCategory(booking);
    
    // Apply category filter if selected
    if (filterCategory !== 'all' && category !== filterCategory) {
      return false;
    }
    
    // Apply status filter if selected
    if (filterStatus !== 'all') {
      const simplifiedStatus = simplifyStatus(booking.Status);
      if (simplifiedStatus !== filterStatus) {
        return false;
      }
    }
    
    // Apply service filter if selected
    if (filterService !== 'all' && booking.Service !== filterService) {
      return false;
    }
    
    // Apply provider filter if selected
    if (filterProvider !== 'all' && booking.Provider !== filterProvider) {
      return false;
    }
    
    // Apply search term if provided
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        booking.Client.toLowerCase().includes(searchLower) ||
        booking.Service.toLowerCase().includes(searchLower) ||
        booking.Provider.toLowerCase().includes(searchLower) ||
        booking.RelatedResources.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });
  
  // Sort data
  const sortedData = [...filteredData].sort((a, b) => {
    if (sortField === 'Date') {
      const dateA = new Date(a.Date).getTime();
      const dateB = new Date(b.Date).getTime();
      return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
    } else if (sortField === 'Client') {
      return sortDirection === 'asc' 
        ? a.Client.toLowerCase().localeCompare(b.Client.toLowerCase())
        : b.Client.toLowerCase().localeCompare(a.Client.toLowerCase());
    } else if (sortField === 'Service') {
      return sortDirection === 'asc'
        ? a.Service.toLowerCase().localeCompare(b.Service.toLowerCase())
        : b.Service.toLowerCase().localeCompare(a.Service.toLowerCase());
    } else if (sortField === 'Provider') {
      return sortDirection === 'asc'
        ? a.Provider.toLowerCase().localeCompare(b.Provider.toLowerCase())
        : b.Provider.toLowerCase().localeCompare(a.Provider.toLowerCase());
    } else if (sortField === 'Status') {
      const statusA = simplifyStatus(a.Status);
      const statusB = simplifyStatus(b.Status);
      return sortDirection === 'asc'
        ? statusA.localeCompare(statusB)
        : statusB.localeCompare(statusA);
    }
    return 0;
  });
  
  // Get categories for filter dropdown
  const getCategories = () => {
    const categories = new Set<string>();
    bookingsData.forEach(booking => {
      categories.add(booking.Category || determineCategory(booking));
    });
    return Array.from(categories).sort();
  };
  
  // Get services for filter dropdown
  const getServices = () => {
    const services = new Set<string>();
    bookingsData.forEach(booking => {
      if (booking.Service) {
        services.add(booking.Service);
      }
    });
    return Array.from(services).sort();
  };
  
  // Get providers for filter dropdown
  const getProviders = () => {
    const providers = new Set<string>();
    bookingsData.forEach(booking => {
      if (booking.Provider) {
        providers.add(booking.Provider);
      }
    });
    return Array.from(providers).sort();
  };
  
  // Get statuses for filter dropdown - simplified to just Active and Cancelled
  const getStatuses = () => {
    return ["Active", "Cancelled"];
  };
  
  // Calculate pagination
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedData.slice(indexOfFirstItem, indexOfLastItem);
  
  // Handle sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pageNumbers = [];
    
    if (totalPages <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Complex pagination with ellipsis
      if (currentPage <= 3) {
        // Near the start
        for (let i = 1; i <= 5; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('ellipsis');
        pageNumbers.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near the end
        pageNumbers.push(1);
        pageNumbers.push('ellipsis');
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pageNumbers.push(i);
        }
      } else {
        // Somewhere in the middle
        pageNumbers.push(1);
        pageNumbers.push('ellipsis');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('ellipsis');
        pageNumbers.push(totalPages);
      }
    }
    
    return pageNumbers;
  };
  
  // Handle page change
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };
  
  // Handle reset filters
  const handleResetFilters = () => {
    setFilterCategory('all');
    setFilterStatus('all');
    setFilterService('all');
    setFilterProvider('all');
    setSearchTerm('');
    setCurrentPage(1);
  };
  
  // Fetch data from API
  const fetchData = async (forceRefresh = false) => {
    // Try to load from cache first (unless force refresh is requested)
    if (!forceRefresh && loadFromCache()) {
      setLoading(false);
      return;
    }
    
    setUsingCache(false);
    setLoading(true);
    setError(null);
    
    try {
      // Format dates for API
      const formattedStartDate = formatDateForApi(startDate);
      const formattedEndDate = formatDateForApi(endDate);
      
      // Fetch bookings data
      const url = `${API_URL}/bookings?start_date=${formattedStartDate}&end_date=${formattedEndDate}`;
      const result = await axios.get<ApiResponse>(url);
      
      if (result.data.data && Array.isArray(result.data.data)) {
        setBookingsData(result.data.data);
        
        // Cache the results
        saveToCache(result.data.data);
        
        // Update last updated timestamp
        const now = new Date();
        setLastUpdated(now);
        
        toast.success(`Successfully loaded ${result.data.data.length} bookings`, {
          duration: 3000,
        });
      } else {
        setBookingsData([]);
        toast.error("No booking data found", {
          duration: 3000,
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      toast.error(`Error loading bookings: ${errorMessage}`, {
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Handle force refresh button click  
  const handleForceRefresh = () => {
    fetchData(true);
  };
  
  // Fetch data on component mount
  useEffect(() => {
    fetchData();
    
    // Return cleanup function to clear stale caches
    return () => {
      // Clear caches older than 24 hours
      try {
        const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
        
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('bookings_cache_')) {
            try {
              const cacheData = JSON.parse(localStorage.getItem(key) || '{}');
              if (cacheData.timestamp && cacheData.timestamp < oneDayAgo) {
                localStorage.removeItem(key);
                console.log(`Cleared stale cache: ${key}`);
              }
            } catch (error) {
              // If we can't parse the cache data, remove it
              localStorage.removeItem(key);
            }
          }
        });
      } catch (error) {
        console.error('Error cleaning up old caches:', error);
      }
    };
  }, []);
  
  // Fetch data when date range changes
  useEffect(() => {
    if (startDate && endDate) {
      // Check if we have data loaded already and the dates changed
      if (bookingsData.length > 0 && lastUpdated) {
        // Always try to load from cache first when date range changes
        fetchData(false);
      }
    }
  }, [startDate, endDate]);
  
  // Table Headers with Sort Functionality
  const renderSortableHeader = (field: string, label: string, className: string = '') => {
    return (
      <TableHead 
        className={`${className} text-xs sm:text-sm cursor-pointer hover:bg-muted/50`}
        onClick={() => handleSort(field)}
      >
        <div className="flex items-center space-x-1">
          <span>{label}</span>
          {sortField === field && (
            <span className="text-xs">
              {sortDirection === 'asc' ? '▲' : '▼'}
            </span>
          )}
        </div>
      </TableHead>
    );
  };
  
  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
      <header className="space-y-2 sm:mb-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <div className="flex items-center gap-2 ml-auto">
            {lastUpdated && (
              <div className="text-xs text-muted-foreground mr-2 flex items-center flex-shrink-0 max-w-[160px] sm:max-w-none truncate">
                {usingCache && (
                  <DatabaseIcon className="h-3 w-3 mr-1 flex-shrink-0" />
                )}
                <span className="truncate">
                  Last updated: {format(lastUpdated, 'MMM d, yyyy h:mm a')}
                </span>
              </div>
            )}
            <Button 
              variant="outline" 
              className="flex items-center gap-2 flex-shrink-0"
              onClick={handleForceRefresh}
              disabled={loading}
              size="sm"
            >
              <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh Data</span>
              <span className="sm:hidden">Refresh</span>
            </Button>
          </div>
        </div>

        <Separator className="my-2" />
      </header>
      
      <div className="grid grid-cols-1 gap-4 sm:gap-6">
      {/* Date Range Controls */}
        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-lg sm:text-xl">Date Range</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Select the time period for your booking data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-sm">Start Date</Label>
                  {startDate && (
                    <Badge variant="outline" className="text-xs">
                      <span className="truncate">{format(startDate, 'MMM d, yyyy')}</span>
                    </Badge>
                  )}
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className="w-full justify-start text-left font-normal text-xs sm:text-sm"
                      size="sm"
                    >
                      <CalendarIcon className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                      {startDate ? (
                        <span className="truncate">{format(startDate, 'MMM d, yyyy')}</span>
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
                  <Label className="text-sm">End Date</Label>
                  {endDate && (
                    <Badge variant="outline" className="text-xs">
                      <span className="truncate">{format(endDate, 'MMM d, yyyy')}</span>
                    </Badge>
                  )}
          </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className="w-full justify-start text-left font-normal text-xs sm:text-sm"
                      size="sm"
                    >
                      <CalendarIcon className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                      {endDate ? (
                        <span className="truncate">{format(endDate, 'MMM d, yyyy')}</span>
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
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-4 gap-2">
              <Button 
                variant="outline" 
                size="sm"
                className="text-xs sm:text-sm w-full sm:w-auto"
            onClick={() => {
                  setStartDate(new Date('2025-01-01'));
                  setEndDate(new Date('2025-05-01'));
                }}
              >
                Reset to Jan-May 2025
              </Button>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-xs sm:text-sm"
                  onClick={clearAllCaches}
                >
                  Clear Cache
                </Button>
                <Select value={itemsPerPage.toString()} onValueChange={(val: string) => {
                  setItemsPerPage(parseInt(val));
                  setCurrentPage(1);
                }}>
                  <SelectTrigger className="w-full sm:w-[120px] text-xs sm:text-sm h-8 sm:h-9">
                    <SelectValue placeholder="Rows per page" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 per page</SelectItem>
                    <SelectItem value="20">20 per page</SelectItem>
                    <SelectItem value="50">50 per page</SelectItem>
                    <SelectItem value="100">100 per page</SelectItem>
                  </SelectContent>
                </Select>
        </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Filters */}
        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Filter className="h-4 w-4 sm:h-5 sm:w-5" />
              Filters
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Filter and search through booking records
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="search" className="text-xs sm:text-sm">Search</Label>
                <Input
                  id="search"
                  placeholder="Search client, service or provider"
                  value={searchTerm}
                  className="h-8 sm:h-9 text-xs sm:text-sm"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
              
              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="category" className="text-xs sm:text-sm">Category</Label>
                <Select value={filterCategory} onValueChange={(val: string) => {
                  setFilterCategory(val);
                  setCurrentPage(1);
                }}>
                  <SelectTrigger id="category" className="h-8 sm:h-9 text-xs sm:text-sm">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {getCategories().map((category: string) => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="status" className="text-xs sm:text-sm">Status</Label>
                <Select value={filterStatus} onValueChange={(val: string) => {
                  setFilterStatus(val);
                  setCurrentPage(1);
                }}>
                  <SelectTrigger id="status" className="h-8 sm:h-9 text-xs sm:text-sm">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {getStatuses().map((status) => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="service" className="text-xs sm:text-sm">Service</Label>
                <Select value={filterService} onValueChange={(val: string) => {
                  setFilterService(val);
                  setCurrentPage(1);
                }}>
                  <SelectTrigger id="service" className="h-8 sm:h-9 text-xs sm:text-sm">
                    <SelectValue placeholder="All Services" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectItem value="all">All Services</SelectItem>
                    {getServices().map((service) => (
                      <SelectItem key={service} value={service}>{service}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="provider" className="text-xs sm:text-sm">Provider</Label>
                <Select value={filterProvider} onValueChange={(val: string) => {
                  setFilterProvider(val);
                  setCurrentPage(1);
                }}>
                  <SelectTrigger id="provider" className="h-8 sm:h-9 text-xs sm:text-sm">
                    <SelectValue placeholder="All Providers" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectItem value="all">All Providers</SelectItem>
                    {getProviders().map((provider) => (
                      <SelectItem key={provider} value={provider}>{provider}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex justify-between items-center mt-3 sm:mt-4">
              <div className="text-xs sm:text-sm text-muted-foreground">
                Showing {filteredData.length} of {bookingsData.length} bookings
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs sm:text-sm h-7 sm:h-8"
                onClick={handleResetFilters}
                disabled={filterCategory === 'all' && filterStatus === 'all' && filterService === 'all' && filterProvider === 'all' && !searchTerm}
              >
                Reset Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      
        {/* Error Alert */}
      {error && (
          <Card className="border-destructive">
            <CardContent className="pt-4 sm:pt-6">
              <div className="flex gap-2 text-destructive">
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm sm:text-base">Error loading bookings</p>
                  <p className="text-xs sm:text-sm">{error}</p>
                </div>
        </div>
            </CardContent>
          </Card>
        )}
        
        {/* Bookings Table */}
        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-lg sm:text-xl">Booking Records</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {currentItems.length ? 
                `Showing ${indexOfFirstItem + 1}-${Math.min(indexOfLastItem, filteredData.length)} of ${filteredData.length} bookings` : 
                'No bookings match your filters'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="space-y-1 sm:space-y-2">
                    <Skeleton className="h-4 sm:h-5 w-full" />
                    <Skeleton className="h-3 sm:h-4 w-[80%]" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {renderSortableHeader('Date', 'Date', 'w-[100px] sm:w-[120px]')}
                        {renderSortableHeader('Client', 'Client')}
                        {renderSortableHeader('Service', 'Service', 'hidden md:table-cell')}
                        {renderSortableHeader('Provider', 'Provider', 'hidden lg:table-cell')}
                        {renderSortableHeader('Status', 'Status')}
                        <TableHead className="hidden sm:table-cell text-xs sm:text-sm">Category</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentItems.length > 0 ? (
                        currentItems.map((booking, index) => {
                          const category = booking.Category || determineCategory(booking);
                          const simplifiedStatus = simplifyStatus(booking.Status);
                          
                          // Determine status badge color based on simplified status
                          const statusBadgeClass = simplifiedStatus === "Active" 
                            ? STATUS_COLORS.active 
                            : STATUS_COLORS.cancelled;
                          
                          // Determine category badge color
                          const categoryBadgeClass = CATEGORY_COLORS[category] || "bg-gray-100 text-gray-800 border-gray-300";
                          
                          return (
                            <TableRow key={index}>
                              <TableCell className="font-medium text-xs sm:text-sm py-2 sm:py-4">
                                {booking.Date.split(' ')[0]}
                              </TableCell>
                              <TableCell className="py-2 sm:py-4">
                                <div className="font-medium text-xs sm:text-sm">{booking.Client}</div>
                                <div className="text-xs text-muted-foreground md:hidden truncate max-w-[160px]">
                                  {booking.Service}
                                </div>
                              </TableCell>
                              <TableCell className="hidden md:table-cell max-w-[200px] truncate text-xs sm:text-sm py-2 sm:py-4">
                                {booking.Service}
                              </TableCell>
                              <TableCell className="hidden lg:table-cell text-xs sm:text-sm py-2 sm:py-4">
                                {booking.Provider}
                              </TableCell>
                              <TableCell className="py-2 sm:py-4">
                                <Badge className={`${statusBadgeClass} text-[10px] sm:text-xs py-0 px-1.5 sm:px-2`}>
                                  {simplifiedStatus}
                                </Badge>
                              </TableCell>
                              <TableCell className="hidden sm:table-cell py-2 sm:py-4">
                                <Badge className={`${categoryBadgeClass} text-[10px] sm:text-xs py-0 px-1.5 sm:px-2`}>
                                  {category}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center text-sm">
                            No results found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
          </div>
          
                {filteredData.length > 0 && (
                  <div className="py-3 sm:py-4">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            href="#" 
                            onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                              e.preventDefault();
                              handlePageChange(currentPage - 1);
                            }}
                            aria-disabled={currentPage === 1}
                            className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                          />
                        </PaginationItem>
                        
                        {getPageNumbers().map((page, index) => (
                          page === 'ellipsis' ? (
                            <PaginationItem key={`ellipsis-${index}`} className="hidden sm:block">
                              <PaginationEllipsis />
                            </PaginationItem>
                          ) : (
                            <PaginationItem key={page} className={index > 1 && index < getPageNumbers().length - 2 ? "hidden sm:block" : ""}>
                              <PaginationLink 
                                href="#" 
                                onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                                  e.preventDefault();
                                  handlePageChange(page as number);
                                }}
                                isActive={page === currentPage}
                                className="text-xs sm:text-sm h-8 w-8 sm:h-9 sm:w-9"
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          )
                        ))}
                        
                        <PaginationItem>
                          <PaginationNext 
                            href="#" 
                            onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                              e.preventDefault();
                              handlePageChange(currentPage + 1);
                            }}
                            aria-disabled={currentPage === totalPages}
                            className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
            </div>
          )}
              </>
            )}
          </CardContent>
        </Card>
        </div>
    </div>
  );
} 
