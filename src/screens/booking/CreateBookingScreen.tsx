import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO, addWeeks, addMonths } from 'date-fns';
import { useTheme } from '../../hooks/useTheme';
import { useCreateBooking, useUpdateBooking, useBooking } from '../../hooks/useBookings';
import { Button, Input, Card } from '../../components/common';
import { notificationService } from '../../services/notifications';
import type { RoomScreenProps, BookingScreenProps } from '../../navigation/types';

type RecurrenceType = 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly';

const RECURRENCE_OPTIONS: { value: RecurrenceType; label: string; icon: string }[] = [
  { value: 'none', label: 'Does not repeat', icon: 'close-circle-outline' },
  { value: 'daily', label: 'Every day', icon: 'today-outline' },
  { value: 'weekly', label: 'Every week', icon: 'calendar-outline' },
  { value: 'biweekly', label: 'Every 2 weeks', icon: 'calendar-outline' },
  { value: 'monthly', label: 'Every month', icon: 'calendar-number-outline' },
];

const bookingSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title is too long'),
  description: z.string().optional(),
});

type BookingFormData = z.infer<typeof bookingSchema>;

type CreateBookingScreenProps = RoomScreenProps<'CreateBooking'> | BookingScreenProps<'EditBooking'>;

export function CreateBookingScreen({ route, navigation }: CreateBookingScreenProps) {
  // Check if we're in edit mode by checking if bookingId exists
  const isEditMode = 'bookingId' in route.params;
  const bookingId = isEditMode ? route.params.bookingId : undefined;
  const { roomId, roomName } = 'roomId' in route.params ? route.params : { roomId: '', roomName: '' };

  const { colors } = useTheme();
  const createBooking = useCreateBooking();
  const updateBooking = useUpdateBooking();

  // Fetch existing booking if in edit mode
  const { data: bookingData, isLoading: isLoadingBooking } = useBooking(bookingId || '');

  const [loading, setLoading] = useState(false);

  // Date/time state
  const now = new Date();
  const nextHour = new Date(now);
  nextHour.setHours(now.getHours() + 1, 0, 0, 0);
  const endHour = new Date(nextHour);
  endHour.setHours(nextHour.getHours() + 1);

  const [selectedDate, setSelectedDate] = useState(now);
  const [startTime, setStartTime] = useState(nextHour);
  const [endTime, setEndTime] = useState(endHour);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [recurrence, setRecurrence] = useState<RecurrenceType>('none');
  const [showRecurrencePicker, setShowRecurrencePicker] = useState(false);

  // Initialize form with existing booking data when in edit mode
  useEffect(() => {
    if (isEditMode && bookingData?.data) {
      const booking = bookingData.data;
      const startDate = parseISO(booking.startTime);
      const endDate = parseISO(booking.endTime);

      // Update form default values
      reset({
        title: booking.title,
        description: booking.description || '',
      });

      // Set date and time pickers
      setSelectedDate(startDate);
      setStartTime(startDate);
      setEndTime(endDate);
    }
  }, [isEditMode, bookingData]);

  // Get room info for edit mode
  const currentRoomId = isEditMode && bookingData?.data ? bookingData.data.room.id : roomId;
  const currentRoomName = isEditMode && bookingData?.data ? bookingData.data.room.name : roomName;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      title: '',
      description: '',
    },
  });

  const onSubmit = async (data: BookingFormData) => {
    // Combine date and times
    const start = new Date(selectedDate);
    start.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);

    const end = new Date(selectedDate);
    end.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);

    if (end <= start) {
      const { Alert } = require('react-native');
      Alert.alert('Invalid Time', 'End time must be after start time.');
      return;
    }

    if (!isEditMode && start < new Date()) {
      const { Alert } = require('react-native');
      Alert.alert('Invalid Time', 'Cannot book in the past.');
      return;
    }

    // Build recurrence rule
    let recurrenceRule: string | undefined;
    if (recurrence !== 'none') {
      const freqMap: Record<string, string> = {
        daily: 'DAILY',
        weekly: 'WEEKLY',
        biweekly: 'WEEKLY;INTERVAL=2',
        monthly: 'MONTHLY',
      };
      recurrenceRule = `FREQ=${freqMap[recurrence]}`;
    }

    setLoading(true);
    try {
      if (isEditMode && bookingId) {
        // Update existing booking
        await updateBooking.mutateAsync({
          id: bookingId,
          data: {
            title: data.title,
            description: data.description,
            startTime: start.toISOString(),
            endTime: end.toISOString(),
          },
        });
        // Schedule notification for updated booking
        await notificationService.scheduleBookingReminder(
          bookingId,
          data.title,
          currentRoomName,
          start,
          15
        );
        navigation.goBack();
      } else {
        // Create new booking
        const result = await createBooking.mutateAsync({
          roomId: currentRoomId,
          title: data.title,
          description: data.description,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          recurrenceRule,
        });

        // Schedule notification for the new booking
        if (result.data?.id) {
          await notificationService.scheduleBookingReminder(
            result.data.id,
            data.title,
            currentRoomName,
            start,
            15
          );
        }
        navigation.goBack();
      }
    } catch {
      // Error handled by mutation
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Room Info */}
        {isEditMode && isLoadingBooking ? (
          <Card style={styles.roomInfo}>
            <ActivityIndicator size="small" color={colors.primary} />
          </Card>
        ) : (
          <Card style={styles.roomInfo}>
            <View style={styles.roomInfoRow}>
              <View style={[styles.roomIcon, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="business" size={20} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.roomLabel, { color: colors.textSecondary }]}>
                  {isEditMode ? 'Editing booking for' : 'Booking for'}
                </Text>
                <Text style={[styles.roomName, { color: colors.text }]}>{currentRoomName}</Text>
              </View>
            </View>
          </Card>
        )}

        {/* Form */}
        <View style={styles.form}>
          <Controller
            control={control}
            name="title"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Meeting Title"
                placeholder="e.g. Team standup, Client meeting"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.title?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Description (Optional)"
                placeholder="Add meeting details..."
                multiline
                numberOfLines={3}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.description?.message}
              />
            )}
          />

          {/* Date Picker */}
          <View style={styles.pickerSection}>
            <Text style={[styles.pickerLabel, { color: colors.text }]}>Date</Text>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              style={[styles.pickerButton, { borderColor: colors.border, backgroundColor: colors.surface }]}
            >
              <Ionicons name="calendar-outline" size={18} color={colors.primary} />
              <Text style={[styles.pickerValue, { color: colors.text }]}>
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                minimumDate={new Date()}
                onChange={(_, date) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (date) setSelectedDate(date);
                }}
              />
            )}
          </View>

          {/* Time Pickers */}
          <View style={styles.timeRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.pickerLabel, { color: colors.text }]}>Start Time</Text>
              <TouchableOpacity
                onPress={() => setShowStartPicker(true)}
                style={[styles.pickerButton, { borderColor: colors.border, backgroundColor: colors.surface }]}
              >
                <Ionicons name="time-outline" size={18} color={colors.primary} />
                <Text style={[styles.pickerValue, { color: colors.text }]}>
                  {format(startTime, 'h:mm a')}
                </Text>
              </TouchableOpacity>
              {showStartPicker && (
                <DateTimePicker
                  value={startTime}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  minuteInterval={15}
                  onChange={(_, time) => {
                    setShowStartPicker(Platform.OS === 'ios');
                    if (time) setStartTime(time);
                  }}
                />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.pickerLabel, { color: colors.text }]}>End Time</Text>
              <TouchableOpacity
                onPress={() => setShowEndPicker(true)}
                style={[styles.pickerButton, { borderColor: colors.border, backgroundColor: colors.surface }]}
              >
                <Ionicons name="time-outline" size={18} color={colors.primary} />
                <Text style={[styles.pickerValue, { color: colors.text }]}>
                  {format(endTime, 'h:mm a')}
                </Text>
              </TouchableOpacity>
              {showEndPicker && (
                <DateTimePicker
                  value={endTime}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  minuteInterval={15}
                  onChange={(_, time) => {
                    setShowEndPicker(Platform.OS === 'ios');
                    if (time) setEndTime(time);
                  }}
                />
              )}
            </View>
          </View>

          {/* Recurrence */}
          <View style={styles.pickerSection}>
            <Text style={[styles.pickerLabel, { color: colors.text }]}>Repeat</Text>
            <TouchableOpacity
              onPress={() => setShowRecurrencePicker(!showRecurrencePicker)}
              style={[styles.pickerButton, { borderColor: colors.border, backgroundColor: colors.surface }]}
            >
              <Ionicons
                name={RECURRENCE_OPTIONS.find(o => o.value === recurrence)?.icon as any || 'repeat-outline'}
                size={18}
                color={colors.primary}
              />
              <Text style={[styles.pickerValue, { color: colors.text, flex: 1 }]}>
                {RECURRENCE_OPTIONS.find(o => o.value === recurrence)?.label || 'Does not repeat'}
              </Text>
              <Ionicons name="chevron-down-outline" size={18} color={colors.textTertiary} />
            </TouchableOpacity>

            {showRecurrencePicker && (
              <View style={[styles.recurrenceOptions, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                {RECURRENCE_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => {
                      setRecurrence(option.value);
                      setShowRecurrencePicker(false);
                    }}
                    style={[
                      styles.recurrenceOption,
                      recurrence === option.value && { backgroundColor: colors.primaryLight },
                    ]}
                  >
                    <Ionicons
                      name={option.icon as any}
                      size={18}
                      color={recurrence === option.value ? colors.primary : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.recurrenceOptionText,
                        { color: recurrence === option.value ? colors.primary : colors.text },
                      ]}
                    >
                      {option.label}
                    </Text>
                    {recurrence === option.value && (
                      <Ionicons name="checkmark" size={18} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        <Button
          title={isEditMode ? 'Update Booking' : 'Create Booking'}
          onPress={handleSubmit(onSubmit)}
          loading={loading}
          fullWidth
          size="lg"
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20 },
  roomInfo: { marginBottom: 24 },
  roomInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  roomIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  roomLabel: { fontSize: 12 },
  roomName: { fontSize: 16, fontWeight: '600' },
  form: { marginBottom: 16 },
  pickerSection: { marginBottom: 16 },
  pickerLabel: { fontSize: 14, fontWeight: '500', marginBottom: 6 },
  pickerButton: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderRadius: 12, padding: 12 },
  pickerValue: { fontSize: 15, fontWeight: '500' },
  timeRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  recurrenceOptions: { marginTop: 8, borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
  recurrenceOption: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderBottomWidth: 1 },
  recurrenceOptionText: { flex: 1, fontSize: 15 },
});
