import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useCreateBooking } from '../../hooks/useBookings';
import { Button, Input, Card } from '../../components/common';
import type { RoomScreenProps } from '../../navigation/types';

const bookingSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title is too long'),
  description: z.string().optional(),
  date: z.string().min(1, 'Please select a date'),
  startHour: z.string().min(1, 'Start time is required'),
  endHour: z.string().min(1, 'End time is required'),
});

type BookingFormData = z.infer<typeof bookingSchema>;

export function CreateBookingScreen({ route, navigation }: RoomScreenProps<'CreateBooking'>) {
  const { roomId, roomName } = route.params;
  const { colors } = useTheme();
  const createBooking = useCreateBooking();
  const [loading, setLoading] = useState(false);

  // Generate default date (today) and time strings
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const nextHour = now.getHours() + 1;
  const defaultStart = `${String(nextHour).padStart(2, '0')}:00`;
  const defaultEnd = `${String(nextHour + 1).padStart(2, '0')}:00`;

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      title: '',
      description: '',
      date: todayStr,
      startHour: defaultStart,
      endHour: defaultEnd,
    },
  });

  const onSubmit = async (data: BookingFormData) => {
    setLoading(true);
    try {
      const startTime = new Date(`${data.date}T${data.startHour}:00`).toISOString();
      const endTime = new Date(`${data.date}T${data.endHour}:00`).toISOString();

      await createBooking.mutateAsync({
        roomId,
        title: data.title,
        description: data.description,
        startTime,
        endTime,
      });

      navigation.goBack();
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
        <Card style={styles.roomInfo}>
          <View style={styles.roomInfoRow}>
            <View style={[styles.roomIcon, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="business" size={20} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.roomLabel, { color: colors.textSecondary }]}>Booking for</Text>
              <Text style={[styles.roomName, { color: colors.text }]}>{roomName}</Text>
            </View>
          </View>
        </Card>

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

          <Controller
            control={control}
            name="date"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Date"
                placeholder="YYYY-MM-DD"
                leftIcon="calendar-outline"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.date?.message}
              />
            )}
          />

          <View style={styles.timeRow}>
            <View style={{ flex: 1 }}>
              <Controller
                control={control}
                name="startHour"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Start Time"
                    placeholder="HH:MM"
                    leftIcon="time-outline"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.startHour?.message}
                  />
                )}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Controller
                control={control}
                name="endHour"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="End Time"
                    placeholder="HH:MM"
                    leftIcon="time-outline"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.endHour?.message}
                  />
                )}
              />
            </View>
          </View>
        </View>

        <Button
          title="Create Booking"
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
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  roomInfo: {
    marginBottom: 24,
  },
  roomInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  roomIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roomLabel: {
    fontSize: 12,
  },
  roomName: {
    fontSize: 16,
    fontWeight: '600',
  },
  form: {
    marginBottom: 16,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 12,
  },
});
