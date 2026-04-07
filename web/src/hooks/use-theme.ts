// Copyright DKC UMW, All rights reserved

/**
 * Theme management hook.
 * 
 * Re-exports the useTheme hook from next-themes for consistent theme management
 * across the application. Provides access to the current theme, theme setter,
 * and system theme detection.
 * 
 * @module use-theme
 */

import { useTheme as useNextTheme } from "next-themes"

/**
 * Hook to access and control the application theme.
 * 
 * @returns {Object} Theme utilities
 * @property {string} theme - Current theme ('light', 'dark', or 'system')
 * @property {function} setTheme - Function to change the theme
 * @property {string} systemTheme - The detected system theme
 * 
 * @example
 * const { theme, setTheme } = useTheme();
 * 
 * // Switch to dark mode
 * setTheme('dark');
 * 
 * // Use system preference
 * setTheme('system');
 */
export const useTheme = useNextTheme 