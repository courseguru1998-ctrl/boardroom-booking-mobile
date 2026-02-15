import { format, formatDistanceToNow, isToday, isTomorrow, parseISO } from 'date-fns';

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
