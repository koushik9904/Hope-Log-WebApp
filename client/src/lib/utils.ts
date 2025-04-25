import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * EMERGENCY FIX: Preserve the exact date component regardless of timezone
 * This function directly formats a date string with the exact local date components
 * to completely bypass any timezone issues.
 * 
 * @param date The date to prepare for storage
 * @returns A string in local format with forced correct date values
 */
export function prepareLocalDateForStorage(date: Date): string {
  // Get the current local date string (April 24, 2025)
  const localDateString = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  console.log(`🚨 EMERGENCY FIX: Using local date string: ${localDateString}`);
  
  // Extract the month, day, and year from the localDateString
  const dateRegex = /(\w+) (\d+), (\d+)/;
  const match = localDateString.match(dateRegex);
  
  if (!match) {
    console.error('Date regex failed to match local date string');
    return new Date().toISOString(); // Fallback to current date
  }
  
  // Convert month name to month number (0-indexed)
  const monthNames = ["January", "February", "March", "April", "May", "June", 
                      "July", "August", "September", "October", "November", "December"];
  const monthName = match[1];
  const monthNum = monthNames.findIndex(m => m === monthName);
  
  if (monthNum === -1) {
    console.error(`Invalid month name: ${monthName}`);
    return new Date().toISOString(); // Fallback to current date
  }
  
  const day = parseInt(match[2]);
  const year = parseInt(match[3]);
  
  // Get the current time components
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  const ms = date.getMilliseconds();
  
  // Create a UTC date with the correct date but preserve the current time
  const utcDateString = `${year}-${(monthNum + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}Z`;
  
  console.log(`🚨 FORCED DATE STRING WITH CURRENT TIME: ${utcDateString}`);
  return utcDateString;
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
