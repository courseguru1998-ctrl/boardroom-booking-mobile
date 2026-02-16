import React from 'react';
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
import { useMyWaitlist, useRemoveFromWaitlist } from '../../hooks/useWaitlist';
import { Card, StatusBadge } from '../../components/common';
import { formatBookingDate, formatBookingTime } from '../../utils/date';
import type { WaitlistEntry } from '../../services/waitlist';

interface WaitlistScreenProps {
  navigation?: any;
}

export function WaitlistScreen({ navigation }: WaitlistScreenProps) {
  const { colors } = useTheme();
  const { data, isLoading, refetch } = useMyWaitlist();
  const removeFromWaitlist = useRemoveFromWaitlist();

  const waitlistEntries: WaitlistEntry[] = data?.data || [];

  const handleRemove = (entry: WaitlistEntry) => {
    Alert.alert(
      'Leave Waitlist',
      `Are you sure you want to leave the waitlist for "${entry.room.name}"?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Leave',
          style: 'destructive',
          onPress: () => removeFromWaitlist.mutate(entry.id),
        },
      ]
    );
  };

  const getStatusLabel = (status: WaitlistEntry['status']): string => {
    switch (status) {
      case 'WAITING':
        return 'Waiting';
      case 'NOTIFIED':
        return 'Notified';
      case 'BOOKED':
        return 'Booked';
      case 'EXPIRED':
        return 'Expired';
      default:
        return status.toLowerCase();
    }
  };

  const getStatusColor = (status: WaitlistEntry['status']) => {
    switch (status) {
      case 'WAITING':
        return { bg: colors.warningLight, text: colors.statusPending };
      case 'NOTIFIED':
        return { bg: colors.primaryLight, text: colors.primary };
      case 'BOOKED':
        return { bg: colors.successLight, text: colors.statusConfirmed };
      case 'EXPIRED':
        return { bg: colors.errorLight, text: colors.statusCancelled };
      default:
        return { bg: colors.surfaceSecondary, text: colors.textSecondary };
    }
  };

  const renderWaitlistEntry = ({ item: entry }: { item: WaitlistEntry }) => {
    const statusColor = getStatusColor(entry.status);

    return (
      <Card style={styles.entryCard}>
        <View style={styles.entryHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.entryTitle, { color: colors.text }]} numberOfLines={1}>
              {entry.room.name}
            </Text>
            <View style={styles.entryMeta}>
              <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
              <Text style={[styles.entryRoom, { color: colors.textSecondary }]}>
                {entry.room.building ? `${entry.room.building}` : ''}
                {entry.room.floor ? ` - ${entry.room.floor}` : ''}
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusColor.bg },
            ]}
          >
            <Text style={[styles.statusText, { color: statusColor.text }]}>
              {getStatusLabel(entry.status)}
            </Text>
          </View>
        </View>

        <View style={[styles.timeRow, { backgroundColor: colors.surfaceSecondary }]}>
          <View style={styles.timeItem}>
            <Ionicons name="calendar-outline" size={16} color={colors.primary} />
            <Text style={[styles.timeText, { color: colors.text }]}>
              {formatBookingDate(entry.startTime)}
            </Text>
          </View>
          <View style={styles.timeItem}>
            <Ionicons name="time-outline" size={16} color={colors.primary} />
            <Text style={[styles.timeText, { color: colors.text }]}>
              {formatBookingTime(entry.startTime, entry.endTime)}
            </Text>
          </View>
        </View>

        {entry.status === 'WAITING' && (
          <TouchableOpacity
            onPress={() => handleRemove(entry)}
            style={[styles.removeButton, { borderColor: colors.error }]}
          >
            <Ionicons name="exit-outline" size={16} color={colors.error} />
            <Text style={[styles.removeText, { color: colors.error }]}>
              Leave Waitlist
            </Text>
          </TouchableOpacity>
        )}

        {entry.status === 'NOTIFIED' && (
          <View style={[styles.notifiedBanner, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="notifications-outline" size={16} color={colors.primary} />
            <Text style={[styles.notifiedText, { color: colors.primary }]}>
              A spot has opened up! Book now to secure your slot.
            </Text>
          </View>
        )}
      </Card>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={waitlistEntries}
        renderItem={renderWaitlistEntry}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="time-outline" size={48} color={colors.textTertiary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No Waitlist Entries
              </Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                When you join a waitlist for a booked time slot, it will appear here.
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
  listContent: { padding: 16, gap: 12 },
  entryCard: { marginBottom: 0 },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  entryTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  entryMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  entryRoom: { fontSize: 13 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  statusText: { fontSize: 12, fontWeight: '600' },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  timeItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timeText: { fontSize: 13, fontWeight: '500' },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    marginTop: 4,
  },
  removeText: { fontSize: 13, fontWeight: '600' },
  notifiedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
  },
  notifiedText: { fontSize: 13, fontWeight: '500', flex: 1 },
  emptyContainer: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600' },
  emptyText: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
});
