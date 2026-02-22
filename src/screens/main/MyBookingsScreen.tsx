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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../hooks/useTheme';
import { useMyBookings, useCancelBooking } from '../../hooks/useBookings';
import { Card, StatusBadge, Header, EmptyState, ErrorState } from '../../components/common';
import { formatBookingDate, formatBookingTime, getUtcDateRange } from '../../utils/date';
import type { BookingScreenProps } from '../../navigation/types';
import type { Booking } from '../../types';

type TabKey = 'upcoming' | 'past';

export function MyBookingsScreen({ navigation }: BookingScreenProps<'BookingList'>) {
  const { colors } = useTheme();
  const nav = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<TabKey>('upcoming');
  const cancelBooking = useCancelBooking();

  const isUpcoming = activeTab === 'upcoming';
  const now = new Date();

  // Use UTC date range for timezone handling
  // Don't filter by status to show both CONFIRMED and PENDING bookings
  const { data, isLoading, isError, error, refetch } = useMyBookings(
    isUpcoming
      ? getUtcDateRange(30) // Get next 30 days
      : { endDate: now.toISOString() } // Past bookings
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
        <View style={[styles.statusIndicator, { backgroundColor: booking.status === 'CONFIRMED' ? colors.success : colors.textTertiary }]} />
        <StatusBadge status={booking.status} size="sm" />
      </View>

      <Text style={[styles.bookingTitle, { color: colors.text }]} numberOfLines={2}>
        {booking.title}
      </Text>

      <View style={styles.bookingMeta}>
        <Ionicons name="business-outline" size={12} color={colors.textSecondary} />
        <Text style={[styles.bookingRoom, { color: colors.textSecondary }]} numberOfLines={1}>
          {booking.room.name}
        </Text>
      </View>

      <View style={[styles.timeRow, { backgroundColor: colors.surfaceSecondary }]}>
        <View style={styles.timeItem}>
          <Ionicons name="calendar-outline" size={12} color={colors.primary} />
          <Text style={[styles.timeText, { color: colors.text }]}>
            {formatBookingDate(booking.startTime)}
          </Text>
        </View>
      </View>
      <Text style={[styles.timeText, { color: colors.text, marginTop: 4 }]}>
        {formatBookingTime(booking.startTime, booking.endTime)}
      </Text>

      {isUpcoming && booking.status === 'CONFIRMED' && (
        <TouchableOpacity
          onPress={() => handleCancel(booking)}
          style={[styles.cancelButton, { borderColor: colors.error }]}
        >
          <Ionicons name="close-circle-outline" size={12} color={colors.error} />
          <Text style={[styles.cancelText, { color: colors.error }]}>
            Cancel
          </Text>
        </TouchableOpacity>
      )}
    </Card>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="My Bookings"
        subtitle={`${bookings.length} bookings`}
        showProfile={true}
        onProfilePress={() => nav.navigate('Settings')}
      />

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
        contentContainerStyle={[
          styles.listContent,
          bookings.length === 0 && styles.listContentCentered
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          isError ? (
            <ErrorState
              title="Failed to load bookings"
              message={error?.message || 'Unable to fetch your bookings. Please try again.'}
              onRetry={refetch}
            />
          ) : (
            <EmptyState
              icon="calendar-outline"
              title={`No ${activeTab} bookings`}
              subtitle={activeTab === 'upcoming' ? 'Book a room to see your upcoming bookings' : 'Your past bookings will appear here'}
              actionLabel="Browse Rooms"
              onAction={() => nav.navigate('Rooms')}
            />
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, paddingHorizontal: 16 },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabText: { fontSize: 15, fontWeight: '600' },
  listContent: { padding: 12, gap: 12 },
  listContentCentered: { flexGrow: 1, justifyContent: 'center', minHeight: 300 },
  loadingContainer: { alignItems: 'center', padding: 40, gap: 12 },
  loadingText: { fontSize: 14, marginTop: 8 },
  gridRow: { gap: 12, justifyContent: 'flex-start' },
  bookingCard: { marginBottom: 12 },
  bookingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  statusIndicator: { width: 8, height: 8, borderRadius: 4 },
  bookingTitle: { fontSize: 15, fontWeight: '600', marginBottom: 6 },
  bookingMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  bookingRoom: { fontSize: 13, flex: 1 },
  timeRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 6, padding: 8, marginBottom: 4 },
  timeItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeText: { fontSize: 12, fontWeight: '500' },
  cancelButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, borderWidth: 1, borderRadius: 6, paddingVertical: 8, marginTop: 8 },
  cancelText: { fontSize: 12, fontWeight: '600' },
});
