// Copyright DKC UMW, All rights reserved

/**
 * Homepage component for the DKC Booking Dashboard.
 * 
 * This is the landing page that provides an overview of the application's main features
 * and navigation to the Bookings and Dashboard sections. It includes:
 * - Welcome message and application description
 * - Cards for Bookings and Dashboard sections with descriptions
 * - Feedback section with contact information
 * - Footer with copyright information
 * 
 * @module Homepage
 */

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon, BarChart3Icon, MessageSquareIcon } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * Renders the homepage of the DKC Booking Dashboard application.
 * 
 * Provides an overview of available features and navigation options for users
 * to access the Bookings table or Dashboard analytics views.
 * 
 * @returns {JSX.Element} The homepage component
 */
export default function Homepage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex flex-col items-center justify-center p-4 md:p-8">
      <div className="max-w-4xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">DKC Booking Dashboard</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Streamlined analytics and management for the Digital Knowledge Center booking system.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-6 w-6 text-primary" />
                <CardTitle>Bookings</CardTitle>
              </div>
              <CardDescription>View and manage all booking appointments</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Access detailed information about each booking, including client information,
                services requested, and appointment status.
              </p>
            </CardContent>
            <CardFooter>
              <Link to="/bookings" className="w-full">
                <Button className="w-full">View Bookings</Button>
              </Link>
            </CardFooter>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3Icon className="h-6 w-6 text-primary" />
                <CardTitle>Dashboard</CardTitle>
              </div>
              <CardDescription>Analytics and reporting tools</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Visualize booking trends, service popularity, and staff utilization
                with interactive charts and filterable data.
              </p>
            </CardContent>
            <CardFooter>
              <Link to="/dashboard" className="w-full">
                <Button className="w-full">Open Dashboard</Button>
              </Link>
            </CardFooter>
          </Card>
        </div>

        {/* Contact Info */}
        <Card className="mt-8 border-dashed shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageSquareIcon className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">Feedback Welcome</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              If you have any suggestions or feedback about this dashboard, please contact Rusul Abbas at{" "}
              <a 
                href="mailto:rabbas@mail.umw.edu" 
                className="text-primary hover:underline"
              >
                rabbas@mail.umw.edu
              </a>
            </p>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground pt-8">
          <p>© {new Date().getFullYear()} Digital Knowledge Center - University of Mary Washington</p>
        </div>
      </div>
    </div>
  );
}