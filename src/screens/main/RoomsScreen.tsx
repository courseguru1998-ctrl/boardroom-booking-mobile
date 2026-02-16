import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useRooms } from '../../hooks/useRooms';
import { useFavoriteIds, useToggleFavorite } from '../../hooks/useFavorites';
import { Card } from '../../components/common';
import { RoomFilterModal, type RoomFilterValues } from '../../components/room/RoomFilterModal';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<RoomFilterValues>({});

  const apiFilters = {
    page: 1,
    limit: 50,
    ...(filters.capacity ? { capacity: filters.capacity } : {}),
    ...(filters.building ? { building: filters.building } : {}),
    ...(filters.floor ? { floor: filters.floor } : {}),
    ...(filters.amenities?.length ? { amenities: filters.amenities.join(',') } : {}),
  };

  const { data, isLoading, refetch } = useRooms(apiFilters);
  const { data: favoriteIdsData } = useFavoriteIds();
  const toggleFavorite = useToggleFavorite();

  const favoriteIds = favoriteIdsData?.data || [];
  const allRooms = data?.data || [];

  // Client-side search filter
  const rooms = useMemo(() => {
    if (!searchQuery.trim()) return allRooms;
    const q = searchQuery.toLowerCase();
    return allRooms.filter(
      (room) =>
        room.name.toLowerCase().includes(q) ||
        room.building?.toLowerCase().includes(q) ||
        room.campus?.name.toLowerCase().includes(q)
    );
  }, [allRooms, searchQuery]);

  const activeFilterCount = Object.keys(filters).filter(
    (key) => {
      const val = filters[key as keyof RoomFilterValues];
      return val !== undefined && val !== '' && (!Array.isArray(val) || val.length > 0);
    }
  ).length;

  const handleToggleFavorite = (roomId: string) => {
    const isFavorited = favoriteIds.includes(roomId);
    toggleFavorite.mutate({ roomId, isFavorited });
  };

  const renderRoom = ({ item: room }: { item: Room }) => {
    const isFavorited = favoriteIds.includes(room.id);

    return (
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
          <TouchableOpacity
            onPress={() => handleToggleFavorite(room.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={isFavorited ? 'heart' : 'heart-outline'}
              size={22}
              color={isFavorited ? '#EF4444' : colors.textTertiary}
            />
          </TouchableOpacity>
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
            {room.amenities.slice(0, 4).map((amenity) => (
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
            {room.amenities.length > 4 && (
              <View style={[styles.amenityBadge, { backgroundColor: colors.surfaceSecondary }]}>
                <Text style={[styles.amenityText, { color: colors.textSecondary }]}>
                  +{room.amenities.length - 4}
                </Text>
              </View>
            )}
          </View>
        )}
      </Card>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search Bar */}
      <View style={styles.searchRow}>
        <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search-outline" size={18} color={colors.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search rooms..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          onPress={() => setShowFilters(true)}
          style={[
            styles.filterButton,
            {
              backgroundColor: activeFilterCount > 0 ? colors.primaryLight : colors.surface,
              borderColor: activeFilterCount > 0 ? colors.primary : colors.border,
            },
          ]}
        >
          <Ionicons
            name="options-outline"
            size={20}
            color={activeFilterCount > 0 ? colors.primary : colors.textSecondary}
          />
          {activeFilterCount > 0 && (
            <View style={[styles.filterBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

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
                {searchQuery ? 'No rooms match your search' : 'No rooms available'}
              </Text>
            </View>
          ) : null
        }
      />

      <RoomFilterModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        onApply={setFilters}
        initialFilters={filters}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingVertical: 12 },
  searchContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12 },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 15 },
  filterButton: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  filterBadge: { position: 'absolute', top: -4, right: -4, width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  filterBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  listContent: { padding: 16, paddingTop: 4, gap: 12 },
  roomCard: { marginBottom: 0 },
  roomHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  roomIconContainer: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  roomName: { fontSize: 16, fontWeight: '600' },
  roomLocation: { fontSize: 13, marginTop: 2 },
  roomDetails: { flexDirection: 'row', gap: 16, marginBottom: 10 },
  roomDetailItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  roomDetailText: { fontSize: 13 },
  amenities: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  amenityBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  amenityText: { fontSize: 11, textTransform: 'capitalize' },
  emptyContainer: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 16 },
});
