import React, { useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { useMyBookings, useBookings } from '../../hooks/useBookings';
import { useRooms } from '../../hooks/useRooms';
import { useToast } from '../../hooks/useToast';
import { Card, StatusBadge, Button, EmptyState, ErrorState } from '../../components/common';
import { formatBookingDate, formatBookingTime, formatFullDate } from '../../utils/date';
import type { MainTabScreenProps } from '../../navigation/types';
import type { Booking } from '../../types';
import { format, isToday, isTomorrow, differenceInMinutes, startOfDay, endOfDay, addDays } from 'date-fns';
import { getUtcDateRange } from '../../utils/date';

// Time-based greeting like web app
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

// Format relative date like web app
function getRelativeDate(date: Date) {
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  return format(date, 'EEEE, MMM d');
}

export function DashboardScreen({ navigation }: MainTabScreenProps<'Dashboard'>) {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const toast = useToast();
  const notifiedBookingsRef = useRef<Set<string>>(new Set());

  // Fetch upcoming bookings - use UTC date range to handle timezone correctly
  // Don't filter by status to show both CONFIRMED and PENDING bookings
  const dateRange = getUtcDateRange(30);
  const { data: upcomingBookings, isLoading: loadingUpcoming, isError: errorUpcoming, error: upcomingError, refetch: refetchUpcoming } = useMyBookings({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    // Removed status filter to show all active bookings (CONFIRMED and PENDING)
  });

  // Fetch all rooms
  const { data: roomsData, isLoading: loadingRooms, isError: errorRooms, refetch: refetchRooms } = useRooms({ limit: 100 });

  // Fetch today's bookings for stats - use UTC for timezone handling
  const { data: todayBookings, isLoading: loadingToday, isError: errorToday, refetch: refetchToday } = useBookings({
    startDate: startOfDay(new Date()).toISOString(),
    endDate: endOfDay(new Date()).toISOString(),
    status: 'CONFIRMED',
    limit: 100,
  });

  // Calculate this week's bookings - use UTC for timezone handling
  const weekStart = startOfDay(new Date());
  const weekEnd = endOfDay(addDays(new Date(), 7));
  const { data: weekBookings, isLoading: loadingWeek, isError: errorWeek, refetch: refetchWeek } = useBookings({
    startDate: weekStart.toISOString(),
    endDate: weekEnd.toISOString(),
    status: 'CONFIRMED',
    limit: 100,
  });

  // Calculate stats like web app
  const upcomingCount = upcomingBookings?.data?.length || 0;
  const roomCount = roomsData?.data?.length || 0;
  const todayCount = todayBookings?.data?.length || 0;
  const weekCount = weekBookings?.data?.length || 0;

  // Check for any loading or error states
  const isLoading = loadingUpcoming || loadingRooms || loadingToday || loadingWeek;
  const hasError = errorUpcoming || errorRooms || errorToday || errorWeek;

  // Refetch all data
  const handleRefresh = () => {
    refetchUpcoming();
    refetchRooms();
    refetchToday();
    refetchWeek();
  };

  // Get next upcoming booking
  const nextBooking = upcomingBookings?.data?.[0];
  const minutesUntilNext = nextBooking
    ? differenceInMinutes(new Date(nextBooking.startTime), new Date())
    : null;

  // Check if there's a meeting starting very soon (within 15 mins)
  const imminentBooking = useMemo(() => {
    return upcomingBookings?.data?.find((booking) => {
      const mins = differenceInMinutes(new Date(booking.startTime), new Date());
      return mins > 0 && mins <= 15;
    });
  }, [upcomingBookings?.data]);

  // Check for upcoming bookings and show reminders
  useEffect(() => {
    if (!upcomingBookings?.data) return;

    const checkReminders = () => {
      const now = new Date();

      upcomingBookings.data?.forEach((booking) => {
        const startTime = new Date(booking.startTime);
        const minutesUntil = differenceInMinutes(startTime, now);

        // Show reminder for bookings starting in 15 minutes or less (but not past)
        if (minutesUntil > 0 && minutesUntil <= 15 && !notifiedBookingsRef.current.has(booking.id)) {
          notifiedBookingsRef.current.add(booking.id);

          const message = minutesUntil <= 1
            ? `Starting now in ${booking.room.name}`
            : `Starting in ${minutesUntil} minutes in ${booking.room.name}`;

          // Show toast notification
          toast.warning(`Upcoming: ${booking.title}`, message);

          // Trigger haptic feedback
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
      });
    };

    // Check immediately
    checkReminders();

    // Check every minute
    const interval = setInterval(checkReminders, 60000);

    return () => clearInterval(interval);
  }, [upcomingBookings?.data, toast]);

  // Group bookings by date like web app
  const bookingsByDate = useMemo(() => {
    const grouped: Record<string, Booking[]> = {};
    upcomingBookings?.data?.forEach((booking) => {
      const dateKey = format(new Date(booking.startTime), 'yyyy-MM-dd');
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(booking);
    });
    return grouped;
  }, [upcomingBookings?.data]);

  const handleBookingPress = (booking: Booking) => {
    // Navigate to My Bookings tab - user can view details from there
    navigation.navigate('MyBookings' as any);
  };

  const renderStatsCard = (title: string, value: number | string, icon: keyof typeof Ionicons.glyphMap, index: number) => {
    const iconColors = [colors.primary, colors.accent, colors.success, colors.warning];
    const iconColor = iconColors[index % iconColors.length];

    return (
      <Card key={title} style={styles.statsCard} variant="elevated">
        <View style={styles.statsContent}>
          <View style={[styles.statsIconContainer, { backgroundColor: isDark ? colors.muted : '#F5F0E6' }]}>
            <Ionicons name={icon} size={22} color={iconColor} />
          </View>
          <View style={styles.statsTextContainer}>
            <Text style={[styles.statsValue, { color: colors.text }]}>{value}</Text>
            <Text style={[styles.statsLabel, { color: colors.textSecondary }]}>{title}</Text>
          </View>
        </View>
      </Card>
    );
  };

  const renderBookingCard = (booking: Booking, isFirst: boolean = false) => (
    <Card
      key={booking.id}
      style={[styles.bookingCard, { borderLeftWidth: 4, borderLeftColor: colors.primary }]}
      onPress={() => handleBookingPress(booking)}
    >
      <View style={styles.bookingHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.bookingTitle, { color: colors.text }]} numberOfLines={2}>
            {booking.title}
          </Text>
          <View style={styles.bookingMeta}>
            <Ionicons name="business-outline" size={14} color={colors.textSecondary} />
            <Text style={[styles.bookingRoom, { color: colors.textSecondary }]} numberOfLines={1}>
              {booking.room.name}
            </Text>
          </View>
        </View>
        <StatusBadge status={booking.status} size="sm" />
      </View>

      <View style={[styles.bookingTimeRow, { backgroundColor: colors.muted, borderRadius: 10, padding: 12 }]}>
        <View style={styles.bookingTimeItem}>
          <Ionicons name="calendar-outline" size={16} color={colors.primary} />
          <Text style={[styles.bookingTimeText, { color: colors.text }]}>
            {formatBookingDate(booking.startTime)}
          </Text>
        </View>
        <Text style={[styles.bookingTimeText, { color: colors.text }]}>
          {formatBookingTime(booking.startTime, booking.endTime)}
        </Text>
      </View>

      {booking.attendees && booking.attendees.length > 0 && (
        <View style={styles.attendeesRow}>
          <Ionicons name="people-outline" size={14} color={colors.textSecondary} />
          <Text style={[styles.attendeesText, { color: colors.textSecondary }]} numberOfLines={1}>
            {booking.attendees.length} attendee{booking.attendees.length !== 1 ? 's' : ''}
          </Text>
        </View>
      )}
    </Card>
  );

  // Get gradient colors based on theme
  const gradientColors = isDark
    ? ['#0F1D32', '#132037', '#0A1628']
    : ['#001c54', '#002d80', '#001040'];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {hasError && !isLoading && (
        <View style={[styles.errorBanner, { backgroundColor: colors.error + '15', borderBottomColor: colors.error }]}>
          <Ionicons name="alert-circle" size={20} color={colors.error} />
          <Text style={[styles.errorBannerText, { color: colors.error }]}>
            Failed to load some data
          </Text>
          <TouchableOpacity onPress={handleRefresh}>
            <Text style={[styles.errorBannerRetry, { color: colors.primary }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <>
          {/* Imminent Meeting Banner - Like web app */}
        {imminentBooking && (
          <TouchableOpacity
            style={[styles.imminentBanner, { backgroundColor: '#F97316' }]}
            onPress={() => handleBookingPress(imminentBooking)}
            activeOpacity={0.9}
          >
            <View style={styles.imminentBannerContent}>
              <View style={[styles.imminentIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                <Ionicons name="notifications" size={24} color="#FFF" />
              </View>
              <View style={styles.imminentTextContainer}>
                <Text style={[styles.imminentSubtitle, { color: 'rgba(255,255,255,0.8)' }]}>
                  Meeting starting soon!
                </Text>
                <Text style={[styles.imminentTitle, { color: '#FFF' }]}>
                  {imminentBooking.title}
                </Text>
                <Text style={[styles.imminentMeta, { color: 'rgba(255,255,255,0.8)' }]}>
                  {format(new Date(imminentBooking.startTime), 'h:mm a')} • {imminentBooking.room.name}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#FFF" />
          </TouchableOpacity>
        )}

        {/* Hero Section - Gradient like web app */}
        <View style={[styles.heroSection, { backgroundColor: gradientColors[0] }]}>
          {/* Background pattern effect */}
          <View style={styles.heroPattern}>
            <View style={[styles.heroGlow1, { backgroundColor: 'rgba(201, 162, 39, 0.15)' }]} />
            <View style={[styles.heroGlow2, { backgroundColor: 'rgba(255,255,255,0.05)' }]} />
          </View>

          <View style={styles.heroContent}>
            {/* Greeting */}
            <View style={styles.greetingRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.greetingHello, { color: 'rgba(255,255,255,0.7)' }]}>
                  {getGreeting()},
                </Text>
                <Text style={[styles.greetingName, { color: '#FFF' }]}>
                  {user?.firstName || 'User'} {user?.lastName || ''}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => navigation.navigate('Settings' as any)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.avatar,
                    { backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
                  ]}
                >
                  <Text style={[styles.avatarText, { color: '#FFF' }]}>
                    {(user?.firstName?.[0] || 'U').toUpperCase()}
                    {(user?.lastName?.[0] || '').toUpperCase()}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Next Meeting Card */}
            {nextBooking ? (
              <View style={[styles.nextMeetingCard, { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.15)' }]}>
                <View style={styles.nextMeetingHeader}>
                  <Text style={[styles.nextMeetingLabel, { color: 'rgba(255,255,255,0.7)' }]}>
                    Next Meeting
                  </Text>
                  {minutesUntilNext !== null && (
                    <View style={[styles.nextMeetingBadge, { backgroundColor: '#FFF' }]}>
                      <Text style={[styles.nextMeetingBadgeText, { color: gradientColors[0] }]}>
                        {minutesUntilNext <= 1 ? 'Now' : `in ${minutesUntilNext} min`}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.nextMeetingTitle, { color: '#FFF' }]} numberOfLines={1}>
                  {nextBooking.title}
                </Text>
                <View style={styles.nextMeetingMeta}>
                  <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.7)" />
                  <Text style={[styles.nextMeetingTime, { color: 'rgba(255,255,255,0.9)' }]}>
                    {format(new Date(nextBooking.startTime), 'h:mm a')} - {format(new Date(nextBooking.endTime), 'h:mm a')}
                  </Text>
                </View>
                <View style={styles.nextMeetingMeta}>
                  <Ionicons name="location-outline" size={14} color="rgba(255,255,255,0.7)" />
                  <Text style={[styles.nextMeetingRoom, { color: 'rgba(255,255,255,0.9)' }]}>
                    {nextBooking.room.name}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={[styles.noMeetingCard, { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.15)' }]}>
                <Text style={[styles.noMeetingText, { color: 'rgba(255,255,255,0.8)' }]}>
                  No upcoming meetings
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Stats Grid - Like web app */}
        <View style={styles.statsGrid}>
          {renderStatsCard("Today's Bookings", todayCount, 'calendar', 0)}
          {renderStatsCard('Upcoming', upcomingCount, 'time', 1)}
          {renderStatsCard('Available Rooms', roomCount, 'business', 2)}
          {renderStatsCard('This Week', weekCount, 'calendar-outline', 3)}
        </View>

        {/* Quick Actions - Like web app */}
        <View style={styles.quickActionsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[styles.quickAction, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate('Rooms' as any)}
              activeOpacity={0.8}
            >
              <Ionicons name="add-circle-outline" size={26} color="#FFF" />
              <Text style={styles.quickActionText}>New Booking</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickAction, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}
              onPress={() => navigation.navigate('Rooms' as any)}
              activeOpacity={0.8}
            >
              <Ionicons name="grid-outline" size={26} color={colors.text} />
              <Text style={[styles.quickActionText, { color: colors.text }]}>Browse Rooms</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickAction, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}
              onPress={() => navigation.navigate('Waitlist' as any)}
              activeOpacity={0.8}
            >
              <Ionicons name="time-outline" size={26} color={colors.text} />
              <Text style={[styles.quickActionText, { color: colors.text }]}>My Waitlist</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Upcoming Schedule Timeline - Like web app */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Upcoming Schedule</Text>

          {Object.keys(bookingsByDate).length === 0 && !loadingUpcoming ? (
            <Card style={styles.emptyCard} variant="outlined">
              <View style={styles.emptyContent}>
                <Ionicons name="calendar-outline" size={48} color={colors.textTertiary} />
                <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
                  No upcoming bookings
                </Text>
                <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>
                  Book a room to get started
                </Text>
                <Button
                  title="Browse Rooms"
                  variant="outline"
                  onPress={() => navigation.navigate('Rooms' as any)}
                  style={{ marginTop: 12 }}
                />
              </View>
            </Card>
          ) : (
            Object.entries(bookingsByDate).map(([dateKey, dateBookings]) => {
              const date = new Date(dateKey);
              return (
                <View key={dateKey} style={styles.dateGroup}>
                  <View style={styles.dateHeader}>
                    <Text style={[styles.dateHeaderText, { color: colors.text }]}>
                      {getRelativeDate(date)}
                    </Text>
                    <View style={[styles.dateHeaderLine, { backgroundColor: colors.border }]} />
                  </View>
                  <View style={styles.bookingsList}>
                    {dateBookings.map((booking, index) => renderBookingCard(booking, index === 0))}
                  </View>
                </View>
              );
            })
          )}
        </View>
        </>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  // Imminent Banner
  imminentBanner: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  imminentBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  imminentIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  imminentTextContainer: {
    flex: 1,
  },
  imminentSubtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  imminentTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 2,
  },
  imminentMeta: {
    fontSize: 13,
    marginTop: 2,
  },
  // Hero Section
  heroSection: {
    marginBottom: 24,
    borderRadius: 0,
    overflow: 'hidden',
  },
  heroPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  heroGlow1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  heroGlow2: {
    position: 'absolute',
    bottom: -30,
    left: 30,
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  heroContent: {
    padding: 20,
    paddingTop: 16,
  },
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  greetingHello: {
    fontSize: 16,
    fontWeight: '500',
  },
  greetingName: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 4,
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
  // Next Meeting Card
  nextMeetingCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  nextMeetingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  nextMeetingLabel: {
    fontSize: 13,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nextMeetingBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  nextMeetingBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  nextMeetingTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
  },
  nextMeetingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  nextMeetingTime: {
    fontSize: 14,
    fontWeight: '500',
  },
  nextMeetingRoom: {
    fontSize: 14,
    fontWeight: '500',
  },
  noMeetingCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    alignItems: 'center',
  },
  noMeetingText: {
    fontSize: 15,
    fontWeight: '500',
  },
  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 24,
  },
  statsCard: {
    width: '47%',
    padding: 16,
  },
  statsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statsIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsTextContainer: {
    flex: 1,
  },
  statsValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statsLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  // Quick Actions
  quickActionsSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 10,
  },
  quickAction: {
    flex: 1,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
    textAlign: 'center',
  },
  // Bookings
  section: {
    paddingHorizontal: 16,
  },
  dateGroup: {
    marginBottom: 20,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateHeaderText: {
    fontSize: 16,
    fontWeight: '700',
    marginRight: 12,
  },
  dateHeaderLine: {
    flex: 1,
    height: 1,
  },
  bookingsList: {
    gap: 10,
  },
  bookingCard: {
    marginBottom: 0,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
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
  attendeesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  attendeesText: {
    fontSize: 12,
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
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  // Loading & Error States
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  errorBannerText: {
    fontSize: 13,
    fontWeight: '500',
  },
  errorBannerRetry: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 4,
  },
});
