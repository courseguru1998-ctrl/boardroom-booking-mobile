import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingsApi, type BookingFilters, type CreateBookingData } from '../services/bookings';
import { Alert } from 'react-native';

export function useMyBookings(filters: Omit<BookingFilters, 'userId'> = {}) {
  return useQuery({
    queryKey: ['bookings', 'my', filters],
    queryFn: () => bookingsApi.getMyBookings(filters),
  });
}

export function useBookings(filters: BookingFilters = {}) {
  return useQuery({
    queryKey: ['bookings', filters],
    queryFn: () => bookingsApi.getAll(filters),
  });
}

export function useBooking(id: string) {
  return useQuery({
    queryKey: ['bookings', id],
    queryFn: () => bookingsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBookingData) => bookingsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      Alert.alert('Success', 'Booking created successfully!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create booking';
      Alert.alert('Error', message);
    },
  });
}

export function useCancelBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => bookingsApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      Alert.alert('Success', 'Booking cancelled successfully.');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to cancel booking';
      Alert.alert('Error', message);
    },
  });
}
