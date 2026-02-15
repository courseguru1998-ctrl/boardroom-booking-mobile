import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useRooms } from '../../hooks/useRooms';
import { Card } from '../../components/common';
import type { RoomScreenProps } from '../../navigation/types';
import type { Room } from '../../types';

const AMENITY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  'projector': 'videocam-outline',
  'whiteboard': 'easel-outline',
  'video-conferencing': 'desktop-outline',
  'audio-system': 'volume-high-outline',
  'tv-screen': 'tv-outline',
  'air-conditioning': 'snow-outline',
  'wifi': 'wifi-outline',
  'phone': 'call-outline',
  'coffee-machine': 'cafe-outline',
  'natural-light': 'sunny-outline',
  'accessibility': 'accessibility-outline',
};

export function RoomsScreen({ navigation }: RoomScreenProps<'RoomList'>) {
  const { colors } = useTheme();
  const [page, setPage] = useState(1);
  const { data, isLoading, refetch } = useRooms({ page, limit: 20 });

  const rooms = data?.data || [];

  const renderRoom = ({ item: room }: { item: Room }) => (
    <Card
      onPress={() => navigation.navigate('RoomDetail', { roomId: room.id })}
      style={styles.roomCard}
    >
      <View style={styles.roomHeader}>
        <View style={[styles.roomIconContainer, { backgroundColor: colors.primaryLight }]}>
          <Ionicons name="business" size={24} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.roomName, { color: colors.text }]}>{room.name}</Text>
          {room.building && (
            <Text style={[styles.roomLocation, { color: colors.textSecondary }]}>
              {room.building}{room.floor ? `, Floor ${room.floor}` : ''}
            </Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
      </View>

      <View style={styles.roomDetails}>
        <View style={styles.roomDetailItem}>
          <Ionicons name="people-outline" size={16} color={colors.textSecondary} />
          <Text style={[styles.roomDetailText, { color: colors.textSecondary }]}>
            {room.capacity} {room.capacity === 1 ? 'person' : 'people'}
          </Text>
        </View>
        {room.campus && (
          <View style={styles.roomDetailItem}>
            <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
            <Text style={[styles.roomDetailText, { color: colors.textSecondary }]}>
              {room.campus.name}
            </Text>
          </View>
        )}
      </View>

      {room.amenities.length > 0 && (
        <View style={styles.amenities}>
          {room.amenities.slice(0, 5).map((amenity) => (
            <View
              key={amenity}
              style={[styles.amenityBadge, { backgroundColor: colors.surfaceSecondary }]}
            >
              <Ionicons
                name={AMENITY_ICONS[amenity] || 'checkmark-outline'}
                size={12}
                color={colors.textSecondary}
              />
              <Text style={[styles.amenityText, { color: colors.textSecondary }]}>
                {amenity.replace(/-/g, ' ')}
              </Text>
            </View>
          ))}
          {room.amenities.length > 5 && (
            <View style={[styles.amenityBadge, { backgroundColor: colors.surfaceSecondary }]}>
              <Text style={[styles.amenityText, { color: colors.textSecondary }]}>
                +{room.amenities.length - 5}
              </Text>
            </View>
          )}
        </View>
      )}
    </Card>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={rooms}
        renderItem={renderRoom}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="business-outline" size={48} color={colors.textTertiary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No rooms available
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  roomCard: {
    marginBottom: 0,
  },
  roomHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  roomIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roomName: {
    fontSize: 16,
    fontWeight: '600',
  },
  roomLocation: {
    fontSize: 13,
    marginTop: 2,
  },
  roomDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 10,
  },
  roomDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  roomDetailText: {
    fontSize: 13,
  },
  amenities: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  amenityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  amenityText: {
    fontSize: 11,
    textTransform: 'capitalize',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
  },
});
