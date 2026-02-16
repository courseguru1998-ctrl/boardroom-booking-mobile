import React from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { useMyBookings } from '../../hooks/useBookings';
import { Card, StatusBadge } from '../../components/common';
import { formatBookingDate, formatBookingTime } from '../../utils/date';
import type { MainTabScreenProps } from '../../navigation/types';
import type { Booking } from '../../types';

export function DashboardScreen({ navigation }: MainTabScreenProps<'Dashboard'>) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { data, isLoading, refetch } = useMyBookings({
    status: 'CONFIRMED',
    startDate: new Date().toISOString(),
    limit: 5,
  });

  const bookings = data?.data || [];

  const handleBookingPress = (booking: Booking) => {
    navigation.navigate('MyBookings', {
      screen: 'BookingDetail',
      params: { bookingId: booking.id },
    });
  };

  const renderBookingCard = (booking: Booking) => (
    <Card key={booking.id} style={styles.bookingCard} onPress={() => handleBookingPress(booking)}>
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

      <View style={[styles.bookingTimeRow, { backgroundColor: colors.surfaceSecondary, borderRadius: 8, padding: 10 }]}>
        <View style={styles.bookingTimeItem}>
          <Ionicons name="calendar-outline" size={16} color={colors.primary} />
          <Text style={[styles.bookingTimeText, { color: colors.text }]}>
            {formatBookingDate(booking.startTime)}
          </Text>
        </View>
        <View style={styles.bookingTimeItem}>
          <Ionicons name="time-outline" size={16} color={colors.primary} />
          <Text style={[styles.bookingTimeText, { color: colors.text }]}>
            {formatBookingTime(booking.startTime, booking.endTime)}
          </Text>
        </View>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
      >
        {/* Greeting */}
        <View style={styles.greeting}>
          <View>
            <Text style={[styles.greetingHello, { color: colors.textSecondary }]}>
              Hello,
            </Text>
            <Text style={[styles.greetingName, { color: colors.text }]}>
              {user?.firstName || 'User'} {user?.lastName || ''}
            </Text>
          </View>
          <View
            style={[
              styles.avatar,
              { backgroundColor: colors.primaryLight },
            ]}
          >
            <Text style={[styles.avatarText, { color: colors.primary }]}>
              {(user?.firstName?.[0] || 'U').toUpperCase()}
              {(user?.lastName?.[0] || '').toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.quickAction, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('Rooms', { screen: 'RoomList' })}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle-outline" size={28} color="#FFF" />
            <Text style={styles.quickActionText}>Book Room</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickAction, { backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border }]}
            onPress={() => navigation.navigate('MyBookings', { screen: 'BookingList' })}
            activeOpacity={0.8}
          >
            <Ionicons name="list-outline" size={28} color={colors.primary} />
            <Text style={[styles.quickActionText, { color: colors.text }]}>
              My Bookings
            </Text>
          </TouchableOpacity>
        </View>

        {/* Upcoming Bookings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Upcoming Bookings
          </Text>

          {bookings.length === 0 && !isLoading ? (
            <Card style={styles.emptyCard}>
              <View style={styles.emptyContent}>
                <Ionicons name="calendar-outline" size={48} color={colors.textTertiary} />
                <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
                  No upcoming bookings
                </Text>
                <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>
                  Book a room to get started
                </Text>
              </View>
            </Card>
          ) : (
            <View style={styles.bookingsList}>
              {bookings.map(renderBookingCard)}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  greeting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greetingHello: {
    fontSize: 16,
  },
  greetingName: {
    fontSize: 26,
    fontWeight: '700',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  quickAction: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  bookingsList: {
    gap: 12,
  },
  bookingCard: {
    marginBottom: 0,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bookingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  bookingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bookingRoom: {
    fontSize: 13,
  },
  bookingTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bookingTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bookingTimeText: {
    fontSize: 13,
    fontWeight: '500',
  },
  emptyCard: {
    padding: 32,
  },
  emptyContent: {
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  emptySubtitle: {
    fontSize: 14,
  },
});
