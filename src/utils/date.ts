import { format, formatDistanceToNow, isToday, isTomorrow, parseISO, addDays, startOfDay, endOfDay } from 'date-fns';

/**
 * Get the start of today in UTC format for API calls
 * This ensures consistent date filtering regardless of timezone
 */
export function getUtcStartOfDay(date: Date = new Date()): string {
  const d = startOfDay(date);
  return d.toISOString();
}

/**
 * Get the end of today in UTC format for API calls
 */
export function getUtcEndOfDay(date: Date = new Date()): string {
  const d = endOfDay(date);
  return d.toISOString();
}

/**
 * Get date range for next N days in UTC format
 */
export function getUtcDateRange(daysAhead: number = 30): { startDate: string; endDate: string } {
  const today = new Date();
  return {
    startDate: getUtcStartOfDay(today),
    endDate: getUtcEndOfDay(addDays(today, daysAhead)),
  };
}

/**
 * Format date for API query params (YYYY-MM-DD format)
 * Uses local date to ensure user sees their local timezone
 */
export function formatDateForQuery(date: Date = new Date()): string {
  return format(date, 'yyyy-MM-dd');
}

export function formatBookingTime(startTime: string, endTime: string): string {
  const start = parseISO(startTime);
  const end = parseISO(endTime);
  return `${format(start, 'h:mm a')} - ${format(end, 'h:mm a')}`;
}

export function formatBookingDate(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  return format(date, 'EEE, MMM d');
}

export function formatFullDate(dateStr: string): string {
  return format(parseISO(dateStr), 'EEEE, MMMM d, yyyy');
}

export function formatRelativeTime(dateStr: string): string {
  return formatDistanceToNow(parseISO(dateStr), { addSuffix: true });
}

export function formatDateForApi(date: Date): string {
  return date.toISOString();
}
