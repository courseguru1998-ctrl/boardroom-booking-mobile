import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import type * as NotificationTypes from 'expo-notifications';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationData {
  type: 'booking_reminder' | 'booking_confirmation' | 'waitlist_update';
  bookingId?: string;
  title: string;
  body: string;
}

class NotificationService {
  private expoPushToken: string | null = null;

  async initialize(): Promise<string | null> {
    if (!Device.isDevice) {
      console.log('Push notifications require a physical device');
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push notification permissions');
      return null;
    }

    // Configure Android notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('booking-reminders', {
        name: 'Booking Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#4F46E5',
        sound: 'default',
      });
    }

    return this.expoPushToken;
  }

  async getPushToken(): Promise<string | null> {
    if (!Device.isDevice) return null;

    try {
      const token = await Notifications.getExpoPushTokenAsync();
      this.expoPushToken = token.data;
      return token.data;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  async scheduleBookingReminder(
    bookingId: string,
    title: string,
    roomName: string,
    startTime: Date,
    minutesBefore: number = 15
  ): Promise<string | null> {
    try {
      const triggerDate = new Date(startTime.getTime() - minutesBefore * 60 * 1000);

      // Don't schedule if the trigger time has already passed
      if (triggerDate <= new Date()) {
        return null;
      }

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: `Upcoming: ${title}`,
          body: `Starting in ${minutesBefore} minutes at ${roomName}`,
          data: { type: 'booking_reminder', bookingId } as Record<string, unknown>,
          sound: 'default',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
          channelId: 'booking-reminders',
        },
      });

      return id;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  }

  async cancelBookingReminders(bookingId: string): Promise<void> {
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      const toCancel = scheduled.filter(
        (notification) => notification.content.data?.bookingId === bookingId
      );

      for (const notification of toCancel) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    } catch (error) {
      console.error('Error canceling notifications:', error);
    }
  }

  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  async showLocalNotification(
    title: string,
    body: string,
    data?: Record<string, unknown>
  ): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
      },
      trigger: null, // Show immediately
    });
  }

  // Store subscription references for cleanup
  private subscriptions: Notifications.EventSubscription[] = [];

  // Add notification received listener
  addNotificationReceivedListener(
    callback: (notification: Notifications.Notification) => void
  ): Notifications.EventSubscription {
    const sub = Notifications.addNotificationReceivedListener(callback);
    this.subscriptions.push(sub);
    return sub;
  }

  // Add notification response listener (when user taps notification)
  addNotificationResponseReceivedListener(
    callback: (response: Notifications.NotificationResponse) => void
  ): Notifications.EventSubscription {
    const sub = Notifications.addNotificationResponseReceivedListener(callback);
    this.subscriptions.push(sub);
    return sub;
  }

  // Remove all listeners
  removeAllListeners(): void {
    this.subscriptions.forEach(sub => sub.remove());
    this.subscriptions = [];
  }
}

export const notificationService = new NotificationService();
