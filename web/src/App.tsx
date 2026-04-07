// Copyright DKC UMW, All rights reserved

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Bookings from './pages/Bookings';
import Dashboard from './pages/Dashboard';
import { Navbar } from './components/Navbar';
import Homepage from './pages/Homepage';

/**
 * Main application component that handles routing for the DKC Booking Dashboard.
 * 
 * This component sets up the React Router with three main routes:
 * - Homepage: Landing page with overview of available sections
 * - Bookings: Detailed table view of all bookings with filtering and pagination
 * - Dashboard: Analytics and visualization of booking data with charts
 * 
 * The Navbar component is rendered on all pages to provide consistent navigation.
 * 
 * @returns {JSX.Element} The root application component with routing configured
 * 
 * @example
 * // This is the entry point of the application rendered in main.tsx
 * <App />
 */
export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background">
        {/* Global navigation bar - visible on all pages */}
        <Navbar />
        
        {/* Main content area with route-based rendering */}
        <main>
          <Routes>
            <Route path="/" element={<Homepage />} />
            <Route path="/bookings" element={<Bookings />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}