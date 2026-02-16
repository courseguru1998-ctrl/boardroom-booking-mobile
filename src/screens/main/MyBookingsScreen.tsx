import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useMyBookings, useCancelBooking } from '../../hooks/useBookings';
import { Card, StatusBadge } from '../../components/common';
import { formatBookingDate, formatBookingTime } from '../../utils/date';
import type { BookingScreenProps } from '../../navigation/types';
import type { Booking } from '../../types';

type TabKey = 'upcoming' | 'past';

export function MyBookingsScreen({ navigation }: BookingScreenProps<'BookingList'>) {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<TabKey>('upcoming');
  const cancelBooking = useCancelBooking();

  const isUpcoming = activeTab === 'upcoming';
  const now = new Date().toISOString();

  const { data, isLoading, refetch } = useMyBookings(
    isUpcoming
      ? { startDate: now, status: 'CONFIRMED' }
      : { endDate: now }
  );

  const bookings = data?.data || [];

  const handleCancel = (booking: Booking) => {
    Alert.alert(
      'Cancel Booking',
      `Are you sure you want to cancel "${booking.title}"?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => cancelBooking.mutate(booking.id),
        },
      ]
    );
  };

  const handleBookingPress = (booking: Booking) => {
    navigation.navigate('BookingDetail', { bookingId: booking.id });
  };

  const renderBooking = ({ item: booking }: { item: Booking }) => (
    <Card
      onPress={() => handleBookingPress(booking)}
      style={styles.bookingCard}
    >
      <View style={styles.bookingHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.bookingTitle, { color: colors.text }]} numberOfLines={1}>
            {booking.title}
          </Text>
          <View style={styles.bookingMeta}>
            <Ionicons name="business-outline" size={14} color={colors.textSecondary} />
            <Text style={[styles.bookingRoom, { color: colors.textSecondary }]}>
              {booking.room.name}
            </Text>
          </View>
        </View>
        <StatusBadge status={booking.status} size="sm" />
      </View>

      <View style={[styles.timeRow, { backgroundColor: colors.surfaceSecondary }]}>
        <View style={styles.timeItem}>
          <Ionicons name="calendar-outline" size={16} color={colors.primary} />
          <Text style={[styles.timeText, { color: colors.text }]}>
            {formatBookingDate(booking.startTime)}
          </Text>
        </View>
        <View style={styles.timeItem}>
          <Ionicons name="time-outline" size={16} color={colors.primary} />
          <Text style={[styles.timeText, { color: colors.text }]}>
            {formatBookingTime(booking.startTime, booking.endTime)}
          </Text>
        </View>
      </View>

      {isUpcoming && booking.status === 'CONFIRMED' && (
        <TouchableOpacity
          onPress={() => handleCancel(booking)}
          style={[styles.cancelButton, { borderColor: colors.error }]}
        >
          <Ionicons name="close-circle-outline" size={16} color={colors.error} />
          <Text style={[styles.cancelText, { color: colors.error }]}>
            Cancel Booking
          </Text>
        </TouchableOpacity>
      )}
    </Card>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Tabs */}
      <View style={[styles.tabs, { borderBottomColor: colors.border }]}>
        {(['upcoming', 'past'] as TabKey[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[
              styles.tab,
              activeTab === tab && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
            ]}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === tab ? colors.primary : colors.textSecondary },
              ]}
            >
              {tab === 'upcoming' ? 'Upcoming' : 'Past'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={bookings}
        renderItem={renderBooking}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={48} color={colors.textTertiary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No {activeTab} bookings
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, paddingHorizontal: 16 },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabText: { fontSize: 15, fontWeight: '600' },
  listContent: { padding: 16, gap: 12 },
  bookingCard: { marginBottom: 0 },
  bookingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  bookingTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  bookingMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  bookingRoom: { fontSize: 13 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', borderRadius: 8, padding: 10, marginBottom: 8 },
  timeItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timeText: { fontSize: 13, fontWeight: '500' },
  cancelButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderRadius: 8, paddingVertical: 8, marginTop: 4 },
  cancelText: { fontSize: 13, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 16 },
});
