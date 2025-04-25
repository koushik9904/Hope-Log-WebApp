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
 * @returns A new Date object with corrected timezone handling
 */
export function prepareLocalDateForStorage(date: Date): Date {
  // Create a new date object with the specific year, month, and day from the input date
  // This guarantees we work with the actual local calendar day the user selected
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  
  // Create a new date with the local components and set to noon (to avoid DST issues)
  const localDate = new Date(year, month, day, 12, 0, 0, 0);
  
  // Log for debugging
  console.log(`Original date: ${date.toISOString()}, Prepared date: ${localDate.toISOString()}`);
  
  return localDate;
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
