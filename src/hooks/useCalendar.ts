import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { calendarApi } from '../services/calendar';

export function useCalendarConnections() {
  return useQuery({
    queryKey: ['calendar-connections'],
    queryFn: () => calendarApi.getConnections(),
  });
}

export function useCalendarConnect() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (provider: 'google' | 'microsoft') => calendarApi.connect(provider),
    onSuccess: (data) => {
      // If we get an auth URL, the app should redirect to it
      // The actual OAuth flow will be handled by the app
      if (data.data?.authUrl) {
        // Return the URL so the app can open it
        return data.data.authUrl;
      }
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-connections'] });
    },
  });
}

export function useCalendarDisconnect() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (provider: 'google' | 'microsoft') => calendarApi.disconnect(provider),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-connections'] });
    },
  });
}
