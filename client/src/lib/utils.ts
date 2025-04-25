import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Helper function to preserve local timezone when creating a date for storage.
 * This ensures that when a date is sent to the server, it's properly interpreted as the user's local date.
 * 
 * @param date The date to prepare for storage
 * @returns A string in ISO format with correctly preserved day
 */
export function prepareLocalDateForStorage(date: Date): string {
  // Get the exact local year, month, and day components from the input date
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-based
  const day = date.getDate();
  
  // Force the UTC date to have the same calendar date components
  // by creating a new date in UTC with the local component values
  // This bypasses timezone conversion issues
  const utcDate = new Date(Date.UTC(year, month, day, 12, 0, 0, 0));
  
  // Add timezone offset information for debugging
  const tzOffset = date.getTimezoneOffset();
  console.log(`Local timezone offset: ${tzOffset} minutes`);
  console.log(`Original date: ${date.toLocaleDateString()} (${date.toISOString()})`);
  console.log(`UTC date: ${utcDate.toUTCString()} (${utcDate.toISOString()})`);
  
  // Return the ISO string directly to bypass any further timezone conversions
  return utcDate.toISOString();
}

/**
 * Format a date string for display with correct timezone handling
 * 
 * @param dateString ISO date string to format
 * @param options Date formatting options
 * @returns Formatted date string
 */
export function formatLocalDate(dateString: string, options: Intl.DateTimeFormatOptions = {
  weekday: 'long',
  month: 'long', 
  day: 'numeric',
  year: 'numeric'
}): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', options);
}

/**
 * Compares two dates to see if they are the same calendar day
 * Ignores time component
 * 
 * @param date1 First date to compare
 * @param date2 Second date to compare
 * @returns True if same day, false otherwise
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}
