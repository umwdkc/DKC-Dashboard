// Copyright DKC UMW, All rights reserved

/**
 * Utility functions for the application.
 * 
 * @module utils
 */

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines and merges Tailwind CSS classes intelligently.
 * 
 * This utility function combines multiple class values using `clsx` and then
 * merges Tailwind classes with `twMerge` to resolve conflicts. This is particularly
 * useful when you want to allow component consumers to override default styles.
 * 
 * @param {ClassValue[]} inputs - Array of class values (strings, objects, arrays)
 * @returns {string} Merged and deduplicated class string
 * 
 * @example
 * // Basic usage
 * cn("px-2 py-1", "px-4") // Returns: "py-1 px-4"
 * 
 * @example
 * // With conditional classes
 * cn("text-base", isActive && "text-primary", "hover:text-accent")
 * 
 * @example
 * // Common pattern in components
 * <div className={cn("default-class", className)} />
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
