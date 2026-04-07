// Copyright DKC UMW, All rights reserved

/**
 * DKC Booking Dashboard API Server
 * 
 * This Express.js server acts as a backend proxy for the SimplyBook.me API,
 * providing endpoints for fetching and processing booking data. It includes:
 * 
 * - Authentication management with token caching
 * - Data transformation and categorization
 * - Response caching to reduce API calls
 * - Statistics aggregation
 * - CORS support for frontend integration
 * 
 * Main Endpoints:
 * - GET /api/bookings - Fetch booking records with date filtering
 * - GET /api/bookings/stats - Get aggregated statistics
 * 
 * @module api/index
 */

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { DateTime } = require('luxon');

const app = express();

// Middleware configuration
app.use(cors()); // Enable CORS for frontend requests
app.use(express.json()); // Parse JSON request bodies

/**
 * SimplyBook.me API Configuration
 * These credentials are used to authenticate with the SimplyBook booking system.
 * 
 * @constant {string} COMPANY - The SimplyBook company identifier
 * @constant {string} USER - API user username
 * @constant {string} PASS - API user password
 * @constant {string} BOOKING_URL - SimplyBook admin API endpoint
 * @constant {string} LOGIN_URL - SimplyBook authentication endpoint
 */
const COMPANY = "umwdkc";
const USER = "rabbas";
const PASS = "RusulAbbas123.";
const BOOKING_URL = "https://user-api.simplybook.me/admin/";
const LOGIN_URL = "https://user-api.simplybook.me/login";

/**
 * Admin token cache
 * Stores the authentication token to avoid repeated login requests.
 * 
 * @type {string|null} adminToken - The cached admin authentication token
 * @type {DateTime|null} tokenExpiry - When the cached token expires
 */
let adminToken = null;
let tokenExpiry = null;

/**
 * Response cache for API data
 * Reduces load on the SimplyBook API by caching recent responses.
 * 
 * @type {Object} responseCache
 * @property {Map} bookings - Cache for booking data requests
 * @property {Map} stats - Cache for statistics requests
 */
const responseCache = {
  bookings: new Map(),
  stats: new Map()
};

/**
 * Cache Time-To-Live in milliseconds (5 minutes)
 * After this duration, cached responses are considered stale.
 * 
 * @constant {number}
 */
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Helper Functions
 */

/**
 * Retrieves or refreshes the admin authentication token.
 * 
 * This function manages token caching to avoid unnecessary authentication
 * requests. It checks if a valid token exists in cache, and if not,
 * requests a new one from the SimplyBook API.
 * 
 * @async
 * @returns {Promise<string>} The valid admin authentication token
 * @throws {Error} If authentication fails
 * 
 * @example
 * const token = await getAdminToken();
 * // Use token for authenticated API requests
 */
async function getAdminToken() {
  // Check if cached token is still valid
  if (adminToken && tokenExpiry && DateTime.now() < tokenExpiry) {
    return adminToken;
  }
  
  // Request a new token from SimplyBook
  const payload = {
    jsonrpc: "2.0",
    method: "getUserToken",
    params: [COMPANY, USER, PASS],
    id: 1
  };
  
  try {
    const response = await axios.post(LOGIN_URL, payload, {
      headers: { "Content-Type": "application/json" }
    });
    
    adminToken = response.data.result;
    tokenExpiry = DateTime.now().plus({ hours: 1 });
    return adminToken;
  } catch (error) {
    console.error("Error getting admin token:", error.message);
    throw new Error("Failed to authenticate with the booking API");
  }
}

/**
 * Fetches the list of booking categories from SimplyBook.
 * 
 * This function first checks if the category feature is enabled in the
 * SimplyBook account, then retrieves the available categories if it is.
 * 
 * @async
 * @param {string} token - The admin authentication token
 * @returns {Promise<Object|null>} Category data object or null if feature is disabled
 * 
 * @example
 * const categories = await getCategoriesList(token);
 * if (categories) {
 *   // Process categories
 * }
 */
async function getCategoriesList(token) {
  // First check if the event_category feature is activated in this account
  const headers = {
    "Content-Type": "application/json",
    "X-Company-Login": COMPANY,
    "X-User-Token": token
  };
  
  try {
    // Check if the category feature is activated
    const checkPayload = {
      jsonrpc: "2.0",
      method: "isPluginActivated",
      params: ["event_category"],
      id: 5
    };
    
    const checkResponse = await axios.post(BOOKING_URL, checkPayload, { headers });
    const isCategoryFeatureActive = checkResponse.data.result;
    
    if (!isCategoryFeatureActive) {
      // console.log("Service Categories feature is not activated in this account");
      return null;
    }
    
    // Get categories list
    const payload = {
      jsonrpc: "2.0",
      method: "getCategoriesList",
      params: [],
      id: 6
    };
    
    const response = await axios.post(BOOKING_URL, payload, { headers });
    return response.data.result;
  } catch (error) {
    console.error("Error retrieving categories:", error.message);
    return null;
  }
}
/**
 * Fetches bookings from SimplyBook for a specified date range.
 * 
 * Retrieves booking records between the specified dates, including all
 * booking details. Results are cached to reduce API load.
 * 
 * @async
 * @param {string} token - The admin authentication token
 * @param {string} fromDate - Start date in 'YYYY-MM-DD' format
 * @param {string} toDate - End date in 'YYYY-MM-DD' format
 * @returns {Promise<Array>} Array of booking objects
 * 
 * @example
 * const bookings = await fetchBookings(token, '2025-01-01', '2025-01-31');
 * console.log(`Found ${bookings.length} bookings`);
 */
async function fetchBookings(token, fromDate, toDate) {
  // Check cache first
  const cacheKey = `${fromDate}-${toDate}`;
  const cachedResponse = responseCache.bookings.get(cacheKey);
  
  // Temporarily disable cache for testing
  /*
  if (cachedResponse && cachedResponse.timestamp > Date.now() - CACHE_TTL) {
    console.log(`Using cached bookings data for ${fromDate} to ${toDate}`);
    return cachedResponse.data;
  }
  */
  
  const headers = {
    "Content-Type": "application/json",
    "X-Company-Login": COMPANY,
    "X-User-Token": token
  };
  
  const payload = {
    jsonrpc: "2.0",
    method: "getBookings",
    params: [
      {
        date_from: fromDate,
        time_from: "00:00:00",
        date_to: toDate,
        time_to: "23:59:59",
        timezone: "America/New_York"
      }
    ],
    id: 2
  };
  
  try {
    const response = await axios.post(BOOKING_URL, payload, { headers });
    const result = response.data.result || [];
    
    // Cache the result (still store in cache, but won't use it for now)
    responseCache.bookings.set(cacheKey, {
      timestamp: Date.now(),
      data: result
    });
    
    return result;
  } catch (error) {
    // Handle errors more gracefully than Python
    if (error.response && error.response.status === 503) {
      console.error("SimplyBook API is temporarily unavailable");
      return [];
    }
    console.error("Error fetching bookings:", error.message);
    return [];
  }
}

/**
 * Creates a delay for the specified duration.
 * 
 * Used to add backoff between API requests to avoid rate limiting.
 * 
 * @param {number} ms - Delay duration in milliseconds
 * @returns {Promise<void>} Promise that resolves after the delay
 * 
 * @example
 * await delay(1000); // Wait 1 second
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Retrieves detailed information for a specific booking.
 * 
 * Fetches comprehensive booking details with retry logic to handle
 * transient failures. Implements exponential backoff between retries.
 * 
 * @async
 * @param {string} token - The admin authentication token
 * @param {string|number} bookingId - The booking ID to fetch details for
 * @param {number} [retries=3] - Number of retry attempts on failure
 * @returns {Promise<Object|null>} Booking details object or null if failed
 * 
 * @example
 * const details = await getBookingDetails(token, '12345');
 * if (details) {
 *   console.log(details.client, details.service);
 * }
 */
async function getBookingDetails(token, bookingId, retries = 3) {
  const headers = {
    "Content-Type": "application/json",
    "X-Company-Login": COMPANY,
    "X-User-Token": token
  };
  
  const payload = {
    jsonrpc: "2.0",
    method: "getBookingDetails",
    params: [bookingId],
    id: 3
  };

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      // Match Python's backoff strategy exactly
      if (attempt > 0) {
        await delay(500 + Math.random() * 500); // Exact same backoff as Python
      }
      
      const response = await axios.post(BOOKING_URL, payload, { 
        headers,
        timeout: 10000
      });
      
      // Check if content type is JSON (exactly like Python)
      const contentType = response.headers['content-type'] || '';
      if (contentType.startsWith('application/json')) {
        return response.data.result;
      } else {
        console.log(`Non-JSON response for booking ${bookingId}: ${response.data.substring(0, 100)}`);
        return null;
      }
    } catch (error) {
      console.log(`Error fetching details for booking ${bookingId} (attempt ${attempt + 1}): ${error.message}`);
      // No need to rethrow - just like Python
    }
  }
  return null;
}

/**
 * Fetches detailed information for multiple bookings concurrently.
 * 
 * Processes bookings in batches to avoid overwhelming the API while
 * maintaining reasonable performance. Limited to first 50 bookings
 * to prevent timeout issues.
 * 
 * @async
 * @param {string} token - The admin authentication token
 * @param {Array<Object>} bookings - Array of booking objects with at least an 'id' property
 * @returns {Promise<Object>} Object mapping booking IDs to their details
 * 
 * @example
 * const bookings = [{ id: '1' }, { id: '2' }, { id: '3' }];
 * const details = await fetchAllBookingDetails(token, bookings);
 * // details = { '1': {...}, '2': {...}, '3': {...} }
 */
async function fetchAllBookingDetails(token, bookings) {
  // Use object for bookingDetails just like Python
  const bookingDetails = {};
  
  // Function to get details for a single booking
  async function getDetails(b) {
    try {
      const bookingId = b.id;
      const details = await getBookingDetails(token, bookingId);

      return [bookingId, details]; // Return as array like Python tuple
    } catch (error) {
      console.log(`Error fetching details: ${error.message}`);
      return [b.id, null];
    }
  }
  
  // Process in batches of 10 (like Python's max_workers=10)
  // Limit to maximum 50 bookings to prevent overwhelming the API
  const bookingsToProcess = bookings.slice(0, 50);
  
  // Create batches of 10 bookings each
  const batchSize = 10;
  for (let i = 0; i < bookingsToProcess.length; i += batchSize) {
    const batch = bookingsToProcess.slice(i, i + batchSize);
    
    // Process each batch with Promise.all
    try {
      const promises = batch.map(b => getDetails(b));
      const results = await Promise.all(promises);
      
      // Store results in bookingDetails
      results.forEach(([bookingId, detail]) => {
        if (bookingId && detail) {
          bookingDetails[bookingId] = detail;
        }
      });
      
      // Add small delay between batches
      if (i + batchSize < bookingsToProcess.length) {
        await delay(500);
      }
    } catch (error) {
      // console.log(`Error in batch ${i / batchSize}: ${error.message}`);
    }
  }

  return bookingDetails;
}

/**
 * Main function to process and transform raw booking data.
 * 
 * This function takes raw booking data from SimplyBook and transforms it into
 * a standardized format for the frontend. It:
 * - Fetches detailed booking information
 * - Retrieves and applies category mappings
 * - Normalizes data structure
 * - Extracts relevant fields
 * 
 * The processed data is optimized for display and filtering in the frontend.
 * 
 * @async
 * @param {Array<Object>} bookings - Array of raw booking objects from SimplyBook
 * @returns {Promise<Array<Object>>} Array of processed booking records
 * 
 * @example
 * const rawBookings = await fetchBookings(token, startDate, endDate);
 * const processedData = await processBookings(rawBookings);
 * // Use processedData in API response
 */
async function processBookings(bookings) {
  if (!bookings || bookings.length === 0) {
    return [];
  }
  
  // Log a sample booking to see all available fields
  console.log("Sample booking object - field inspection:");
  if (bookings.length > 0) {
    const sampleBooking = bookings[5];
    console.log("Available fields in booking:", Object.keys(sampleBooking));
    console.log("unit:", sampleBooking.unit);
    console.log("event:", sampleBooking.event);
    console.log("event_name:", sampleBooking.event_name);
    console.log("resources:", sampleBooking.resources);
    console.log("unit_name:", sampleBooking.unit_name);
    console.log("event_category:", sampleBooking.event_category);
    console.log("event_id:", sampleBooking.event_id);
  }
  
  // Get token and details without throwing errors
  let token;
  try {
    token = await getAdminToken();
  } catch (error) {
    console.log(`Error getting admin token: ${error.message}`);
    return bookings.map(b => ({
      Date: b.start_date || "",
      Status: b.status || b.is_confirm === "1" ? "confirmed" : "pending",
      Client: typeof b.client === 'object' ? b.client.full_name || "" : b.client || "",
      Service: b.event_name || "",
      Provider: b.unit_name || "",
      Code: b.code || "",
      Category: "Unknown",
      Created: b.record_date || ""
    }));
  }
  
  // Get categories if available
  let categories = null;
  try {
    categories = await getCategoriesList(token);
    console.log("Retrieved categories:", categories);
  } catch (error) {
    console.log(`Error retrieving categories: ${error.message}`);
  }
  
  // Get booking details
  let detailsDict;
  try {
    detailsDict = await fetchAllBookingDetails(token, bookings);
    console.log("First booking details sample:", 
      bookings.length > 0 ? JSON.stringify(detailsDict[bookings[0].id], null, 2) : "No bookings");
  } catch (error) {
    console.log(`Error fetching booking details: ${error.message}`);
    detailsDict = {};
  }
  
  // Create event-to-category mapping if categories are available
  const eventToCategory = {};
  if (categories) {
    // Attempt to match events to categories based on available data
    // This is a simplification - we'd need more API details to do this properly
    Object.keys(categories).forEach(categoryId => {
      const category = categories[categoryId];
      if (category.events && Array.isArray(category.events)) {
        category.events.forEach(eventId => {
          eventToCategory[eventId] = category.name || categoryId;
        });
      }
    });
  }
  
  // Transform data like Python does
  const data = bookings.map(b => {
    const bookingId = b.id;
    const details = detailsDict[bookingId] || {};
    
    // Get provider name (staff) from unit field
    const providerName = b.unit || "";
    
    // Get resources (equipment) from resources field
    const resources = b.resources || "";
    
    const clientData = b.client || {};
    const clientName = typeof clientData === 'object' ? clientData.full_name || "" : clientData;
    
    // Try to get the category from the event_category field directly
    let category = "Unknown";
    const eventId = b.event_id || (details.event ? details.event.id : null);
    if (b.event_category && categories && categories[b.event_category]) {
      category = categories[b.event_category].name;
    } else if (eventId && eventToCategory[eventId]) {
      // Fall back to event ID mapping if direct category ID not available
      category = eventToCategory[eventId];
    } else if (details.event_category && details.event_category.name) {
      category = details.event_category.name;
    }
    
    // Get service from event or event_name
    const service = b.event || details.event_name || "";
    
    return {
      Date: b.start_date || "",
      Status: b.status || (b.is_confirm === "1" ? "confirmed" : "pending"),
      Client: clientName,
      Service: service,
      Provider: providerName,
      Code: b.code || "",
      Category: category,
      Created: b.record_date || "",
      RelatedResources: resources
    };
  });
  
  return data;
}

/**
 * API Routes
 */

/**
 * Root endpoint - health check
 * 
 * @route GET /
 * @returns {string} Simple greeting message
 */
app.get('/', (req, res) => {
  res.send('Hello World');
});

/**
 * Bookings endpoint - retrieves booking records for a date range.
 * 
 * This endpoint fetches booking data from SimplyBook, processes it,
 * and returns it in a standardized format. Supports date range filtering
 * via query parameters.
 * 
 * @route GET /api/bookings
 * @queryparam {string} [start_date] - Start date in YYYY-MM-DD format (default: 30 days ago)
 * @queryparam {string} [end_date] - End date in YYYY-MM-DD format (default: today)
 * @returns {Object} JSON response with booking data
 * @property {string} message - Status message
 * @property {Array<Object>} data - Array of booking records
 * @property {number} count - Number of bookings returned
 * 
 * @example
 * // Fetch bookings for January 2025
 * GET /api/bookings?start_date=2025-01-01&end_date=2025-01-31
 */
app.get('/api/bookings', async (req, res) => {
  try {
    // Get date range from query parameters (like Python)
    const defaultStartDate = DateTime.now().minus({ days: 30 }).toFormat('yyyy-MM-dd');
    const defaultEndDate = DateTime.now().toFormat('yyyy-MM-dd');
    
    const startDate = req.query.start_date || defaultStartDate;
    const endDate = req.query.end_date || defaultEndDate;
    
    console.log(`Fetching bookings from ${startDate} to ${endDate}`);
    
    // Get token like Python
    let token;
    try {
      token = await getAdminToken();
    } catch (error) {
      console.log(`Authentication failed: ${error.message}`);
      return res.status(500).json({ 
        message: "Authentication failed",
        error: error.message,
        data: [] 
      });
    }
    
    // Fetch bookings like Python
    const bookings = await fetchBookings(token, startDate, endDate);
    
    if (!bookings || bookings.length === 0) {
      return res.json({ 
        message: "No bookings found for the selected date range", 
        data: [] 
      });
    }
    
    // Print sample raw data from SimplyBook API for debugging
    console.log(`Found ${bookings.length} bookings. Raw Sample:`);
    console.log(JSON.stringify(bookings.slice(0, 3), null, 2));
    
    // Process bookings - extract basic data if detailed processing fails
    let processedData;
    try {
      // Try to get full details
      processedData = await processBookings(bookings);
      
      // Print sample processed data for debugging
      console.log(`Processed data sample:`);
      console.log(JSON.stringify(processedData.slice(0, 3), null, 2));
    } catch (error) {
      console.log(`Error processing detailed bookings: ${error.message}`);
      // Fall back to basic processing
      processedData = bookings.map(b => ({
        Date: b.start_date || "",
        Status: b.is_confirm === "1" ? "confirmed" : "pending",
        Client: typeof b.client === 'object' ? b.client.full_name || "" : b.client || "",
        Service: b.event || "",
        Provider: b.unit || "",
        Code: b.code || "",
        Category: "Unknown" // Will be filled in below
      }));
    }

    
    return res.json({
      message: "Bookings retrieved successfully",
      data: processedData,
      count: processedData.length
    });
  } catch (error) {
    // console.log(`Error in /api/bookings: ${error.message}`);
    return res.status(500).json({ 
      message: "Failed to retrieve booking data",
      error: error.message,
      data: []
    });
  }
});

/**
 * Booking statistics endpoint - provides aggregated analytics.
 * 
 * This endpoint calculates various statistics and aggregations from booking
 * data for use in dashboard visualizations. It processes bookings and returns
 * counts grouped by different dimensions.
 * 
 * @route GET /api/bookings/stats
 * @queryparam {string} [start_date] - Start date in YYYY-MM-DD format (default: 30 days ago)
 * @queryparam {string} [end_date] - End date in YYYY-MM-DD format (default: today)
 * @returns {Object} JSON response with statistics
 * @property {string} message - Status message
 * @property {Object} service_counts - Bookings count by service type
 * @property {Object} staff_counts - Bookings count by staff member
 * @property {Object} space_counts - Bookings count by space/equipment
 * @property {Object} date_counts - Bookings count by date
 * @property {Object} category_counts - Bookings count by category
 * 
 * @example
 * // Get statistics for Q1 2025
 * GET /api/bookings/stats?start_date=2025-01-01&end_date=2025-03-31
 */
app.get('/api/bookings/stats', async (req, res) => {
  try {
    // Get date range from query parameters (like Python)
    const defaultStartDate = DateTime.now().minus({ days: 30 }).toFormat('yyyy-MM-dd');
    const defaultEndDate = DateTime.now().toFormat('yyyy-MM-dd');
    
    const startDate = req.query.start_date || defaultStartDate;
    const endDate = req.query.end_date || defaultEndDate;
    
    // console.log(`Fetching booking stats from ${startDate} to ${endDate}`);
    
    // Get token like Python
    let token;
    try {
      token = await getAdminToken();
    } catch (error) {
      // console.log(`Authentication failed: ${error.message}`);
      return res.status(500).json({ 
        message: "Authentication failed",
        error: error.message,
        service_counts: {},
        staff_counts: {},
        space_counts: {},
        date_counts: {},
        category_counts: {}
      });
    }
    
    // Fetch bookings like Python
    const bookings = await fetchBookings(token, startDate, endDate);
    
    if (!bookings || bookings.length === 0) {
      return res.json({
        message: "No bookings found for the selected date range",
        service_counts: {},
        staff_counts: {},
        space_counts: {},
        date_counts: {},
        category_counts: {}
      });
    }
    
    // Process bookings (like Python's dataframe creation)
    const processedData = await processBookings(bookings);
    
    // Calculate category counts
    const categoryCounts = countOccurrences(processedData, 'Category');
    
    // For backward compatibility, identify items that would be Space or Staff
    // based on our previous logic
    const spaceBookings = processedData.filter(item => {
      const service = (item.Service || '').toLowerCase();
      const provider = (item.Provider || '').toLowerCase();
      const resources = (item.RelatedResources || '').toLowerCase();
      
      // List of space-related keywords
      const spaceKeywords = [
        "studio", "podcast", "sewing machine", "production", "3d printer", 
        "space", "room", "lab", "workshop area", "makerspace", "cricut"
      ];
      
      return spaceKeywords.some(keyword => 
        service.includes(keyword) || provider.includes(keyword) || resources.includes(keyword)
      );
    });
    
    // Anything not a space is considered staff/service personnel
    const staffBookings = processedData.filter(item => {
      const service = (item.Service || '').toLowerCase();
      const provider = (item.Provider || '').toLowerCase();
      const resources = (item.RelatedResources || '').toLowerCase();
      
      // List of space-related keywords
      const spaceKeywords = [
        "studio", "podcast", "sewing machine", "production", "3d printer", 
        "space", "room", "lab", "workshop area", "makerspace", "cricut"
      ];
      
      return !spaceKeywords.some(keyword => 
        service.includes(keyword) || provider.includes(keyword) || resources.includes(keyword)
      );
    });
    
    // Count occurrences (like Python's histogram)
    const serviceCounts = countOccurrences(processedData, 'Service');
    const staffCounts = countOccurrences(staffBookings, 'Provider');
    const spaceCounts = countOccurrences(spaceBookings, 'Provider');
    
    // Bookings over time (like Python's df["Date"] conversion and histogram)
    const dateCounts = {};
    processedData.forEach(item => {
      if (item.Date) {
        const date = item.Date.split(' ')[0]; // Extract just the date part
        dateCounts[date] = (dateCounts[date] || 0) + 1;
      }
    });
    
    return res.json({
      message: "Booking stats retrieved successfully",
      service_counts: serviceCounts,
      staff_counts: staffCounts, 
      space_counts: spaceCounts,
      date_counts: dateCounts,
      category_counts: categoryCounts
    });
  } catch (error) {
    // console.log(`Error in /api/bookings/stats: ${error.message}`);
    return res.status(500).json({ 
      message: "Failed to retrieve booking stats",
      error: error.message,
      service_counts: {},
      staff_counts: {},
      space_counts: {},
      date_counts: {},
      category_counts: {}
    });
  }
});

/**
 * Counts occurrences of values in a specific field across an array of objects.
 * 
 * Utility function for creating histograms/frequency counts from data arrays.
 * Used to aggregate statistics like "bookings per service" or "bookings per date".
 * 
 * @param {Array<Object>} array - Array of objects to analyze
 * @param {string} field - Name of the field to count occurrences for
 * @returns {Object} Object mapping field values to their occurrence counts
 * 
 * @example
 * const data = [
 *   { service: '3D Printer' },
 *   { service: 'Podcast Studio' },
 *   { service: '3D Printer' }
 * ];
 * countOccurrences(data, 'service');
 * // Returns: { '3D Printer': 2, 'Podcast Studio': 1 }
 */
function countOccurrences(array, field) {
  const counts = {};
  array.forEach(item => {
    const value = item[field];
    if (value) {
      counts[value] = (counts[value] || 0) + 1;
    }
  });
  return counts;
}

/**
 * Server Initialization
 * Starts the Express server on the specified port.
 */
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`✅ DKC Booking Dashboard API Server`);
  console.log(`🌐 Server running on port ${PORT}`);
  console.log(`📍 Local URL: http://localhost:${PORT}`);
  console.log(`📊 Bookings endpoint: http://localhost:${PORT}/api/bookings`);
  console.log(`📈 Stats endpoint: http://localhost:${PORT}/api/bookings/stats`);
});

// Export app for testing or external use
module.exports = app; 