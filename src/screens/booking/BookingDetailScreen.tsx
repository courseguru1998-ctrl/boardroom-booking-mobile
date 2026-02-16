import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useBooking, useCancelBooking } from '../../hooks/useBookings';
import { useCheckIn, useCheckInStatus } from '../../hooks/useCheckins';
import { Button, Card, StatusBadge } from '../../components/common';
import { formatFullDate, formatBookingTime } from '../../utils/date';
import { isAfter, isBefore, parseISO } from 'date-fns';
import type { BookingScreenProps } from '../../navigation/types';

export function BookingDetailScreen({ route, navigation }: BookingScreenProps<'BookingDetail'>) {
  const { bookingId } = route.params;
  const { colors } = useTheme();
  const { data, isLoading } = useBooking(bookingId);
  const cancelBooking = useCancelBooking();
  const checkIn = useCheckIn();
  const { data: checkInData } = useCheckInStatus(bookingId);

  const booking = data?.data;
  const isCheckedIn = checkInData?.data?.totalCheckedIn
    ? checkInData.data.totalCheckedIn > 0
    : false;

  const now = new Date();
  const isCurrentlyHappening =
    booking &&
    booking.status === 'CONFIRMED' &&
    isBefore(parseISO(booking.startTime), now) &&
    isAfter(parseISO(booking.endTime), now);

  const isUpcoming =
    booking &&
    booking.status === 'CONFIRMED' &&
    isAfter(parseISO(booking.startTime), now);

  const handleCancel = () => {
    if (!booking) return;
    Alert.alert(
      'Cancel Booking',
      `Are you sure you want to cancel "${booking.title}"?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => {
            cancelBooking.mutate(booking.id);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleCheckIn = () => {
    if (!booking) return;
    checkIn.mutate(booking.id);
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.textTertiary} />
        <Text style={[styles.notFoundText, { color: colors.textSecondary }]}>
          Booking not found
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Status Banner */}
        <View style={styles.statusRow}>
          <StatusBadge status={booking.status} />
          {isCurrentlyHappening && (
            <View style={[styles.liveBadge, { backgroundColor: colors.successLight }]}>
              <View style={[styles.liveDot, { backgroundColor: colors.success }]} />
              <Text style={[styles.liveText, { color: colors.success }]}>In Progress</Text>
            </View>
          )}
        </View>

        {/* Title & Description */}
        <Text style={[styles.title, { color: colors.text }]}>{booking.title}</Text>
        {booking.description && (
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {booking.description}
          </Text>
        )}

        {/* Date & Time Card */}
        <Card style={styles.detailCard}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={20} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Date</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {formatFullDate(booking.startTime)}
              </Text>
            </View>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={20} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Time</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {formatBookingTime(booking.startTime, booking.endTime)}
              </Text>
            </View>
          </View>
        </Card>

        {/* Room Card */}
        <Card style={styles.detailCard}>
          <View style={styles.detailRow}>
            <View style={[styles.roomIcon, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="business" size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Room</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {booking.room.name}
              </Text>
              {(booking.room.building || booking.room.floor) && (
                <Text style={[styles.detailSub, { color: colors.textTertiary }]}>
                  {booking.room.building}
                  {booking.room.floor ? `, Floor ${booking.room.floor}` : ''}
                </Text>
              )}
            </View>
          </View>
        </Card>

        {/* Booked By */}
        <Card style={styles.detailCard}>
          <View style={styles.detailRow}>
            <View style={[styles.avatarSmall, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.avatarSmallText, { color: colors.primary }]}>
                {booking.user.firstName[0]}{booking.user.lastName[0]}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Booked by</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {booking.user.firstName} {booking.user.lastName}
              </Text>
              {booking.user.email && (
                <Text style={[styles.detailSub, { color: colors.textTertiary }]}>
                  {booking.user.email}
                </Text>
              )}
            </View>
          </View>
        </Card>

        {/* Attendees */}
        {booking.attendees && booking.attendees.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Attendees ({booking.attendees.length})
            </Text>
            <Card>
              {booking.attendees.map((attendee, index) => (
                <View key={attendee.id}>
                  <View style={styles.attendeeRow}>
                    <View style={[styles.attendeeDot, { backgroundColor: colors.primary }]} />
                    <View>
                      <Text style={[styles.attendeeName, { color: colors.text }]}>
                        {attendee.name || attendee.email}
                      </Text>
                      {attendee.name && (
                        <Text style={[styles.attendeeEmail, { color: colors.textTertiary }]}>
                          {attendee.email}
                        </Text>
                      )}
                    </View>
                  </View>
                  {index < booking.attendees.length - 1 && (
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                  )}
                </View>
              ))}
            </Card>
          </View>
        )}

        {/* Check-in Status */}
        {isCurrentlyHappening && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Check-in</Text>
            {isCheckedIn ? (
              <Card style={styles.checkedInCard}>
                <View style={styles.checkedInRow}>
                  <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                  <Text style={[styles.checkedInText, { color: colors.success }]}>
                    You are checked in
                  </Text>
                </View>
              </Card>
            ) : (
              <Button
                title="Check In Now"
                onPress={handleCheckIn}
                loading={checkIn.isPending}
                fullWidth
                size="lg"
              />
            )}
          </View>
        )}

        {/* Actions */}
        {(isUpcoming || isCurrentlyHappening) && booking.status === 'CONFIRMED' && (
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={handleCancel}
              style={[styles.cancelButton, { borderColor: colors.error }]}
            >
              <Ionicons name="close-circle-outline" size={18} color={colors.error} />
              <Text style={[styles.cancelText, { color: colors.error }]}>Cancel Booking</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  notFoundText: { fontSize: 16, marginTop: 8 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  liveText: { fontSize: 12, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  description: { fontSize: 15, lineHeight: 22, marginBottom: 20 },
  detailCard: { marginBottom: 12 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  detailLabel: { fontSize: 12 },
  detailValue: { fontSize: 15, fontWeight: '600' },
  detailSub: { fontSize: 13, marginTop: 2 },
  divider: { height: 1, marginVertical: 10, marginLeft: 32 },
  roomIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  avatarSmall: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  avatarSmallText: { fontSize: 13, fontWeight: '700' },
  section: { marginTop: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 10 },
  attendeeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  attendeeDot: { width: 8, height: 8, borderRadius: 4 },
  attendeeName: { fontSize: 14, fontWeight: '500' },
  attendeeEmail: { fontSize: 12, marginTop: 1 },
  checkedInCard: { padding: 16 },
  checkedInRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkedInText: { fontSize: 16, fontWeight: '600' },
  actions: { marginTop: 16 },
  cancelButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderRadius: 12, paddingVertical: 14 },
  cancelText: { fontSize: 15, fontWeight: '600' },
});
