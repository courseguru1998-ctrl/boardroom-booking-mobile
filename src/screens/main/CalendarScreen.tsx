import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  endOfDay,
  parseISO,
  addDays,
  startOfDay,
  eachHourOfInterval,
  setHours,
  setMinutes,
} from 'date-fns';
import { useTheme } from '../../hooks/useTheme';
import { useBookings } from '../../hooks/useBookings';
import { useRooms } from '../../hooks/useRooms';
import { Card, StatusBadge } from '../../components/common';
import { formatBookingTime } from '../../utils/date';
import type { MainTabScreenProps } from '../../navigation/types';
import type { Booking } from '../../types';

// Room color palette for visual distinction
const ROOM_COLORS = [
  { bg: '#3B82F6', light: '#DBEAFE', text: '#1D4ED8' },
  { bg: '#10B981', light: '#D1FAE5', text: '#047857' },
  { bg: '#8B5CF6', light: '#EDE9FE', text: '#6D28D9' },
  { bg: '#F59E0B', light: '#FEF3C7', text: '#B45309' },
  { bg: '#EF4444', light: '#FEE2E2', text: '#BE123C' },
  { bg: '#06B6D4', light: '#CFFAFE', text: '#0E7490' },
];

type ViewMode = 'month' | 'week' | 'day';

// Time slots for day/week view (7 AM to 9 PM)
const TIME_SLOTS = Array.from({ length: 15 }, (_, i) => i + 7);

export function CalendarScreen({ navigation }: MainTabScreenProps<'Calendar'>) {
  const { colors } = useTheme();
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [showRoomFilter, setShowRoomFilter] = useState(false);

  // Fetch rooms
  const { data: roomsData } = useRooms({ limit: 100 });

  // Get date range based on view mode
  const getDateRange = () => {
    if (viewMode === 'month') {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      return {
        start: startOfWeek(monthStart),
        end: endOfWeek(monthEnd),
      };
    } else if (viewMode === 'week') {
      return {
        start: startOfWeek(currentDate),
        end: endOfWeek(currentDate),
      };
    } else {
      return {
        start: startOfDay(currentDate),
        end: endOfDay(currentDate),
      };
    }
  };

  const { start: rangeStart, end: rangeEnd } = getDateRange();

  // Fetch bookings for visible period
  const { data: bookingsData, isLoading, refetch } = useBookings({
    startDate: format(rangeStart, 'yyyy-MM-dd'),
    endDate: format(rangeEnd, 'yyyy-MM-dd'),
    status: 'CONFIRMED',
    limit: 500,
  });

  // Get calendar days
  const calendarDays = useMemo(() => {
    if (viewMode === 'day') {
      return [currentDate];
    } else if (viewMode === 'week') {
      return eachDayOfInterval({ start: startOfWeek(currentDate), end: endOfWeek(currentDate) });
    } else {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      return eachDayOfInterval({
        start: startOfWeek(monthStart),
        end: endOfWeek(monthEnd),
      });
    }
  }, [currentDate, viewMode]);

  // Count bookings per day
  const bookingsByDate = useMemo(() => {
    const result: Record<string, number> = {};
    bookingsData?.data?.forEach((booking) => {
      const date = format(parseISO(booking.startTime), 'yyyy-MM-dd');
      result[date] = (result[date] || 0) + 1;
    });
    return result;
  }, [bookingsData]);

  // Get bookings for selected date
  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const bookingsForSelectedDate = useMemo(() => {
    const filtered = selectedRoomId
      ? bookingsData?.data?.filter((b) => b.roomId === selectedRoomId)
      : bookingsData?.data;

    return filtered?.filter((booking) => {
      const bookingDate = format(parseISO(booking.startTime), 'yyyy-MM-dd');
      return bookingDate === selectedDateStr;
    }) || [];
  }, [bookingsData, selectedRoomId, selectedDateStr]);

  // Today's bookings count
  const todayBookingsCount = bookingsData?.data?.filter((b) =>
    isSameDay(parseISO(b.startTime), new Date())
  ).length || 0;

  const selectedRoom = roomsData?.data?.find((r) => r.id === selectedRoomId);
  const rooms = roomsData?.data || [];

  const handlePrevious = () => {
    if (viewMode === 'month') {
      setCurrentDate(subMonths(currentDate, 1));
    } else if (viewMode === 'week') {
      setCurrentDate(addDays(currentDate, -7));
    } else {
      setCurrentDate(addDays(currentDate, -1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    } else if (viewMode === 'week') {
      setCurrentDate(addDays(currentDate, 7));
    } else {
      setCurrentDate(addDays(currentDate, 1));
    }
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setCurrentDate(date);
  };

  const handleRoomSelect = (roomId: string | null) => {
    setSelectedRoomId(roomId);
    setShowRoomFilter(false);
  };

  const handleBookingPress = (booking: Booking) => {
    navigation.navigate('MyBookings' as any, {
      screen: 'BookingDetail',
      params: { bookingId: booking.id },
    } as any);
  };

  const renderViewToggle = () => (
    <View style={[styles.viewToggle, { backgroundColor: colors.muted }]}>
      {(['month', 'week', 'day'] as ViewMode[]).map((mode) => (
        <TouchableOpacity
          key={mode}
          onPress={() => setViewMode(mode)}
          style={[
            styles.viewToggleButton,
            viewMode === mode && { backgroundColor: colors.card },
          ]}
        >
          <Text
            style={[
              styles.viewToggleText,
              { color: colors.textSecondary },
              viewMode === mode && { color: colors.primary, fontWeight: '600' },
            ]}
          >
            {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderCalendarDay = (day: Date, index: number) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    const hasBookings = bookingsByDate[dateKey] > 0;
    const bookingCount = bookingsByDate[dateKey] || 0;
    const isCurrentMonth = isSameMonth(day, currentDate);
    const isSelected = isSameDay(day, selectedDate);
    const dayIsToday = isToday(day);

    return (
      <TouchableOpacity
        key={index}
        onPress={() => handleDateSelect(day)}
        style={[
          styles.calendarDay,
          isSelected && { backgroundColor: colors.primary },
          dayIsToday && !isSelected && { backgroundColor: colors.primaryLight },
        ]}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.calendarDayText,
            { color: colors.text },
            !isCurrentMonth && { color: colors.textTertiary },
            isSelected && { color: '#FFF', fontWeight: '700' },
            dayIsToday && !isSelected && { color: colors.primary, fontWeight: '700' },
          ]}
        >
          {format(day, 'd')}
        </Text>
        {hasBookings && viewMode === 'month' && (
          <View style={styles.bookingDots}>
            {[...Array(Math.min(bookingCount, 3))].map((_, i) => (
              <View
                key={i}
                style={[
                  styles.bookingDot,
                  { backgroundColor: isSelected || dayIsToday ? '#FFF' : colors.primary },
                ]}
              />
            ))}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderWeekView = () => (
    <View style={styles.weekView}>
      {calendarDays.map((day, index) => renderCalendarDay(day, index))}
    </View>
  );

  const renderDayView = () => {
    const hours = TIME_SLOTS.map((hour) => setHours(selectedDate, hour));

    return (
      <View style={styles.dayView}>
        {hours.map((hour, index) => {
          const hourBookings = bookingsForSelectedDate.filter((booking) => {
            const bookingHour = new Date(booking.startTime).getHours();
            return bookingHour === hour.getHours();
          });

          return (
            <View key={index} style={[styles.timeSlot, { borderBottomColor: colors.border }]}>
              <Text style={[styles.timeSlotLabel, { color: colors.textSecondary }]}>
                {format(hour, 'h a')}
              </Text>
              <View style={styles.timeSlotContent}>
                {hourBookings.map((booking) => {
                  const roomIndex = rooms.findIndex((r) => r.id === booking.roomId);
                  const roomColor = roomIndex >= 0 ? ROOM_COLORS[roomIndex % ROOM_COLORS.length] : ROOM_COLORS[0];
                  return (
                    <TouchableOpacity
                      key={booking.id}
                      onPress={() => handleBookingPress(booking)}
                      style={[styles.bookingBlock, { backgroundColor: roomColor.bg }]}
                    >
                      <Text style={styles.bookingBlockTitle} numberOfLines={1}>
                        {booking.title}
                      </Text>
                      <Text style={styles.bookingBlockTime}>
                        {formatBookingTime(booking.startTime, booking.endTime)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  const renderBookingCard = (booking: Booking, index: number) => {
    const roomIndex = rooms.findIndex((r) => r.id === booking.roomId);
    const roomColor = roomIndex >= 0 ? ROOM_COLORS[roomIndex % ROOM_COLORS.length] : ROOM_COLORS[0];

    return (
      <Card
        key={booking.id}
        onPress={() => handleBookingPress(booking)}
        style={[styles.bookingCard, { borderLeftColor: roomColor.bg, borderLeftWidth: 4 }]}
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

        <View style={[styles.timeRow, { backgroundColor: colors.muted, borderRadius: 8 }]}>
          <View style={styles.timeItem}>
            <Ionicons name="time-outline" size={16} color={roomColor.text} />
            <Text style={[styles.timeText, { color: colors.text }]}>
              {formatBookingTime(booking.startTime, booking.endTime)}
            </Text>
          </View>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Calendar</Text>
          <View style={[styles.todayBadge, { backgroundColor: colors.primaryLight }]}>
            <Text style={[styles.todayBadgeText, { color: colors.primary }]}>
              {todayBookingsCount} today
            </Text>
          </View>
        </View>

        {/* View Toggle */}
        {renderViewToggle()}

        {/* Calendar Card */}
        <Card style={styles.calendarCard}>
          {/* Calendar Header */}
          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={handlePrevious} style={styles.navButton}>
              <Ionicons name="chevron-back" size={20} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleToday}>
              <Text style={[styles.monthTitle, { color: colors.text }]}>
                {viewMode === 'day'
                  ? format(currentDate, 'EEEE, MMMM d, yyyy')
                  : format(currentDate, 'MMMM yyyy')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleNext} style={styles.navButton}>
              <Ionicons name="chevron-forward" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Day Headers */}
          {viewMode !== 'day' && (
            <View style={styles.dayHeaders}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <View key={day} style={styles.dayHeaderCell}>
                  <Text style={[styles.dayHeaderText, { color: colors.textSecondary }]}>
                    {viewMode === 'month' ? day : day}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Calendar Grid */}
          {viewMode === 'day' ? renderDayView() : (
            <View style={styles.calendarGrid}>
              {calendarDays.map((day, index) => renderCalendarDay(day, index))}
            </View>
          )}
        </Card>

        {/* Room Filter */}
        <View style={styles.filterSection}>
          <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>
            Filter by Room
          </Text>
          <TouchableOpacity
            onPress={() => setShowRoomFilter(!showRoomFilter)}
            style={[styles.filterButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <View style={styles.filterButtonContent}>
              {selectedRoom ? (
                <View style={styles.selectedRoomBadge}>
                  <View style={[styles.roomColorDot, { backgroundColor: ROOM_COLORS[rooms.findIndex((r) => r.id === selectedRoomId) % ROOM_COLORS.length].bg }]} />
                  <Text style={[styles.filterButtonText, { color: colors.text }]} numberOfLines={1}>
                    {selectedRoom.name}
                  </Text>
                </View>
              ) : (
                <Text style={[styles.filterButtonText, { color: colors.textSecondary }]}>
                  All Rooms
                </Text>
              )}
            </View>
            <Ionicons
              name={showRoomFilter ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          {/* Room Filter Options */}
          {showRoomFilter && (
            <View style={[styles.filterOptions, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TouchableOpacity
                onPress={() => handleRoomSelect(null)}
                style={[styles.filterOption, !selectedRoomId && { backgroundColor: colors.primaryLight }]}
              >
                <Text style={[styles.filterOptionText, { color: colors.text }]}>All Rooms</Text>
                {!selectedRoomId && <Ionicons name="checkmark" size={18} color={colors.primary} />}
              </TouchableOpacity>
              {rooms.map((room, index) => {
                const isSelected = selectedRoomId === room.id;
                const roomColor = ROOM_COLORS[index % ROOM_COLORS.length];
                return (
                  <TouchableOpacity
                    key={room.id}
                    onPress={() => handleRoomSelect(room.id)}
                    style={[styles.filterOption, isSelected && { backgroundColor: roomColor.light }]}
                  >
                    <View style={styles.filterOptionContent}>
                      <View style={[styles.roomColorDot, { backgroundColor: roomColor.bg }]} />
                      <View>
                        <Text style={[styles.filterOptionText, { color: colors.text }]}>{room.name}</Text>
                        <Text style={[styles.filterOptionSubtext, { color: colors.textSecondary }]}>
                          {room.capacity} people
                        </Text>
                      </View>
                    </View>
                    {isSelected && <Ionicons name="checkmark" size={18} color={roomColor.text} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Selected Date Bookings */}
        <View style={styles.bookingsSection}>
          <Text style={[styles.bookingsSectionTitle, { color: colors.text }]}>
            {format(selectedDate, 'EEEE, MMMM d')}
          </Text>

          {bookingsForSelectedDate.length === 0 ? (
            <Card style={styles.emptyCard}>
              <View style={styles.emptyContent}>
                <Ionicons name="calendar-outline" size={48} color={colors.textTertiary} />
                <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>No bookings</Text>
                <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>
                  {selectedRoom ? `No bookings for ${selectedRoom.name}` : 'No bookings for this day'}
                </Text>
              </View>
            </Card>
          ) : (
            <View style={styles.bookingsList}>
              {bookingsForSelectedDate.map((booking, index) => renderBookingCard(booking, index))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: { fontSize: 28, fontWeight: '700' },
  todayBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  todayBadgeText: { fontSize: 13, fontWeight: '600' },
  viewToggle: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  viewToggleButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  viewToggleText: { fontSize: 14, fontWeight: '500' },
  calendarCard: { marginBottom: 20, padding: 16 },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  navButton: { padding: 8 },
  monthTitle: { fontSize: 18, fontWeight: '600' },
  dayHeaders: { flexDirection: 'row', marginBottom: 8 },
  dayHeaderCell: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  dayHeaderText: { fontSize: 12, fontWeight: '600' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  calendarDayText: { fontSize: 14, fontWeight: '500' },
  bookingDots: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 4,
    gap: 2,
  },
  bookingDot: { width: 4, height: 4, borderRadius: 2 },
  weekView: { flexDirection: 'row', justifyContent: 'space-around' },
  dayView: { marginTop: 8 },
  timeSlot: {
    flexDirection: 'row',
    minHeight: 50,
    borderBottomWidth: 1,
    paddingVertical: 4,
  },
  timeSlotLabel: { width: 60, fontSize: 12, fontWeight: '500' },
  timeSlotContent: { flex: 1, paddingLeft: 8 },
  bookingBlock: { padding: 8, borderRadius: 6, marginBottom: 4 },
  bookingBlockTitle: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  bookingBlockTime: { color: 'rgba(255,255,255,0.8)', fontSize: 11 },
  filterSection: { marginBottom: 24 },
  filterLabel: { fontSize: 14, fontWeight: '500', marginBottom: 8 },
  filterButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  filterButtonContent: { flex: 1 },
  filterButtonText: { fontSize: 15, fontWeight: '500' },
  selectedRoomBadge: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  roomColorDot: { width: 12, height: 12, borderRadius: 6 },
  filterOptions: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  filterOptionContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  filterOptionText: { fontSize: 15, fontWeight: '500' },
  filterOptionSubtext: { fontSize: 12, marginTop: 2 },
  bookingsSection: { marginBottom: 24 },
  bookingsSectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  bookingsList: { gap: 12 },
  bookingCard: { marginBottom: 0 },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bookingTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  bookingMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  bookingRoom: { fontSize: 13 },
  timeRow: { flexDirection: 'row', padding: 10, marginBottom: 8 },
  timeItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timeText: { fontSize: 13, fontWeight: '500' },
  emptyCard: { padding: 32 },
  emptyContent: { alignItems: 'center', gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '600', marginTop: 4 },
  emptySubtitle: { fontSize: 14, textAlign: 'center' },
});
