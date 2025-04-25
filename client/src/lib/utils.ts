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
  // SUPER EXPLICIT DATE HANDLING
  // This is an aggressive fix that completely ignores timezone conversion
  // and works directly with the date's numeric components
  
  // Extract the local date components
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed
  const day = date.getDate();
  
  console.log(`🚨 EMERGENCY Date components: Year=${year}, Month=${month + 1}, Day=${day}`);
  
  // Get the current time components for the timestamp
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  const ms = now.getMilliseconds();
  
  // Create a UTC date string with the EXACT date components but current time
  // Format: YYYY-MM-DDThh:mm:ss.sssZ
  const utcDateString = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}Z`;
  
  console.log(`🚨 FORCED DATE STRING: ${utcDateString}`);
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
