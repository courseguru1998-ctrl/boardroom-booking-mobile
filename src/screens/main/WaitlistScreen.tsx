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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../hooks/useTheme';
import { useMyWaitlist, useRemoveFromWaitlist } from '../../hooks/useWaitlist';
import { Card, StatusBadge, Header, EmptyState } from '../../components/common';
import { formatBookingDate, formatBookingTime } from '../../utils/date';
import type { WaitlistEntry } from '../../services/waitlist';

interface WaitlistScreenProps {
  navigation?: any;
}

export function WaitlistScreen({ navigation }: WaitlistScreenProps) {
  const { colors } = useTheme();
  const nav = useNavigation<any>();
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
        return String(status).toLowerCase();
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

        <Text style={[styles.entryTitle, { color: colors.text }]} numberOfLines={1}>
          {entry.room.name}
        </Text>

        <View style={styles.entryMeta}>
          <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
          <Text style={[styles.entryRoom, { color: colors.textSecondary }]} numberOfLines={1}>
            {entry.room.building ? `${entry.room.building}` : ''}
            {entry.room.floor ? ` - ${entry.room.floor}` : ''}
          </Text>
        </View>

        <View style={[styles.timeRow, { backgroundColor: colors.surfaceSecondary }]}>
          <View style={styles.timeItem}>
            <Ionicons name="calendar-outline" size={12} color={colors.primary} />
            <Text style={[styles.timeText, { color: colors.text }]}>
              {formatBookingDate(entry.startTime)}
            </Text>
          </View>
        </View>

        {entry.status === 'WAITING' && (
          <TouchableOpacity
            onPress={() => handleRemove(entry)}
            style={[styles.removeButton, { borderColor: colors.error }]}
          >
            <Ionicons name="exit-outline" size={12} color={colors.error} />
            <Text style={[styles.removeText, { color: colors.error }]}>
              Leave
            </Text>
          </TouchableOpacity>
        )}

        {entry.status === 'NOTIFIED' && (
          <View style={[styles.notifiedBanner, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="notifications-outline" size={12} color={colors.primary} />
            <Text style={[styles.notifiedText, { color: colors.primary }]} numberOfLines={2}>
              Book now!
            </Text>
          </View>
        )}
      </Card>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Waitlist"
        subtitle={`${waitlistEntries.length} entries`}
        showProfile={true}
        onProfilePress={() => nav.navigate('Settings')}
      />

      <FlatList
        data={waitlistEntries}
        renderItem={renderWaitlistEntry}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="time-outline"
              title="No Waitlist Entries"
              subtitle="When you join a waitlist for a booked time slot, it will appear here."
            />
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { padding: 12, gap: 12 },
  gridRow: { gap: 12, justifyContent: 'flex-start' },
  entryCard: { flex: 1, maxWidth: '48%', marginBottom: 0 },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  entryTitle: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  entryMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  entryRoom: { fontSize: 12, flex: 1 },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusText: { fontSize: 10, fontWeight: '600' },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 6,
    padding: 8,
    marginBottom: 6,
  },
  timeItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeText: { fontSize: 11, fontWeight: '500' },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 6,
  },
  removeText: { fontSize: 11, fontWeight: '600' },
  notifiedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: 6,
    padding: 6,
  },
  notifiedText: { fontSize: 10, fontWeight: '600', flex: 1, textAlign: 'center' },
});
