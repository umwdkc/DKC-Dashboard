// Copyright DKC UMW, All rights reserved 

import { Link } from 'react-router-dom';
import { ThemeToggle } from './ui/theme-toggle';
import dkcLogo from '../../public/dkc-new.png';

/**
 * Renders the navigation bar for the DKC Booking Dashboard.
 *
 * Includes links to the homepage, bookings, and dashboard pages,
 * as well as a theme toggle button.
 *
 * @returns {JSX.Element} The Navbar component.
 */
export function Navbar() {
  return (
    <nav className="bg-card shadow-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold text-primary flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2">
              <img src={dkcLogo} alt="DKC Logo" className="h-10 w-auto" />
              <span className="text-primary hover:text-primary/90">DKC Booking Dashboard</span>
            </Link>
          </h1>
          <div className="flex items-center gap-6">
            <div className="flex gap-6">
              <Link to="/bookings" className="text-primary hover:text-primary/90 font-medium">Bookings</Link>
              <Link to="/dashboard" className="text-primary hover:text-primary/90 font-medium">Dashboard</Link>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
} 