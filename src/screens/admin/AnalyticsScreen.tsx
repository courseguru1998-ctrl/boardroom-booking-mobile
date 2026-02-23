import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { Card, StatusBadge } from '../../components/common';
import { adminApi, type AnalyticsData } from '../../services/admin';
import { formatBookingDate, formatBookingTime } from '../../utils/date';
import type { Booking } from '../../types';

// Admin roles that can access analytics
const ADMIN_ROLES = ['ADMIN', 'CAMPUS_ADMIN', 'SUPER_ADMIN'];

export function AnalyticsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();

  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Check if user is admin
  const isAdmin = user?.role && ADMIN_ROLES.includes(user.role);

  const fetchAnalytics = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const response = await adminApi.getAnalytics();

      if (response.success && response.data) {
        setAnalyticsData(response.data);
      } else {
        Alert.alert('Error', response.message || 'Failed to load analytics');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Unable to load analytics';
      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAnalytics();
    }
  }, [isAdmin]);

  const handleRefresh = () => {
    if (isAdmin) {
      fetchAnalytics(true);
    }
  };

  const handleBookingPress = (booking: Booking) => {
    // Navigate to booking detail - would need to be added to navigation
    Alert.alert('Booking Details', `Viewing: ${booking.title}`);
  };

  // Show access denied if not admin
  if (!isAdmin) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.accessDeniedContainer}>
          <Ionicons name="shield-outline" size={64} color={colors.textTertiary} />
          <Text style={[styles.accessDeniedTitle, { color: colors.text }]}>
            Access Denied
          </Text>
          <Text style={[styles.accessDeniedSubtitle, { color: colors.textSecondary }]}>
            You need admin privileges to view analytics
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Loading state
  if (isLoading && !analyticsData) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Ionicons name="analytics-outline" size={48} color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading analytics...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const { totalBookings, totalUsers, totalRooms, recentBookings } = analyticsData || {
    totalBookings: 0,
    totalUsers: 0,
    totalRooms: 0,
    recentBookings: [],
  };

  // Render stat card
  const renderStatCard = (
    title: string,
    value: number,
    icon: keyof typeof Ionicons.glyphMap,
    color: string
  ) => (
    <Card style={styles.statCard}>
      <View style={styles.statHeader}>
        <Text style={[styles.statTitle, { color: colors.textSecondary }]} numberOfLines={1}>{title}</Text>
        <View style={[styles.statIconContainer, { backgroundColor: `${color}15` }]}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
      </View>
      <Text style={[styles.statValue, { color: colors.text }]} numberOfLines={1}>{value.toLocaleString()}</Text>
    </Card>
  );

  // Render recent booking item
  const renderBookingItem = (booking: Booking) => (
    <Card
      key={booking.id}
      style={styles.bookingCard}
      onPress={() => handleBookingPress(booking)}
    >
      <View style={styles.bookingHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.bookingTitle, { color: colors.text }]} numberOfLines={1}>
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

      <View style={styles.bookingUserRow}>
        <Ionicons name="person-outline" size={14} color={colors.textTertiary} />
        <Text style={[styles.bookingUser, { color: colors.textTertiary }]} numberOfLines={1}>
          {booking.user.firstName} {booking.user.lastName}
        </Text>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.pageTitle, { color: colors.text }]} numberOfLines={1}>Analytics</Text>
            <Text style={[styles.pageSubtitle, { color: colors.textSecondary }]} numberOfLines={2}>
              Room booking statistics and insights
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.refreshButton, { backgroundColor: colors.primaryLight }]}
            onPress={handleRefresh}
          >
            <Ionicons name="refresh" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {renderStatCard(
            'Total Bookings',
            totalBookings,
            'calendar-outline',
            colors.primary
          )}
          {renderStatCard(
            'Total Users',
            totalUsers,
            'people-outline',
            colors.success
          )}
          {renderStatCard(
            'Total Rooms',
            totalRooms,
            'business-outline',
            colors.warning
          )}
        </View>

        {/* Recent Bookings Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Recent Bookings
          </Text>

          {recentBookings.length === 0 ? (
            <Card style={styles.emptyCard}>
              <View style={styles.emptyContent}>
                <Ionicons name="calendar-outline" size={48} color={colors.textTertiary} />
                <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
                  No recent bookings
                </Text>
                <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>
                  Bookings will appear here
                </Text>
              </View>
            </Card>
          ) : (
            <View style={styles.bookingsList}>
              {recentBookings.slice(0, 10).map(renderBookingItem)}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  pageSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    minWidth: 100,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statTitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
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
    marginBottom: 8,
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
  bookingUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bookingUser: {
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
    marginTop: 4,
  },
  emptySubtitle: {
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  accessDeniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 16,
  },
  accessDeniedTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 8,
  },
  accessDeniedSubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
});
