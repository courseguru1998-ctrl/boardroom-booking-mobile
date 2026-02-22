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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../hooks/useTheme';
import { useRooms } from '../../hooks/useRooms';
import { useFavoriteIds, useToggleFavorite } from '../../hooks/useFavorites';
import { Card, Header, EmptyState, ErrorState } from '../../components/common';
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
  const nav = useNavigation<any>();
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

  const { data, isLoading, isError, error, refetch } = useRooms(apiFilters);
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
            <Ionicons name="business" size={20} color={colors.primary} />
          </View>
          <TouchableOpacity
            onPress={() => handleToggleFavorite(room.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.favoriteButton}
          >
            <Ionicons
              name={isFavorited ? 'heart' : 'heart-outline'}
              size={18}
              color={isFavorited ? '#EF4444' : colors.textTertiary}
            />
          </TouchableOpacity>
        </View>

        <Text style={[styles.roomName, { color: colors.text }]} numberOfLines={1}>
          {room.name}
        </Text>
        {room.building && (
          <Text style={[styles.roomLocation, { color: colors.textSecondary }]} numberOfLines={1}>
            {room.building}{room.floor ? `, Floor ${room.floor}` : ''}
          </Text>
        )}

        <View style={styles.roomDetails}>
          <View style={styles.roomDetailItem}>
            <Ionicons name="people-outline" size={14} color={colors.textSecondary} />
            <Text style={[styles.roomDetailText, { color: colors.textSecondary }]}>
              {room.capacity}
            </Text>
          </View>
        </View>

        {room.amenities.length > 0 && (
          <View style={styles.amenities}>
            {room.amenities.slice(0, 3).map((amenity) => (
              <View
                key={amenity}
                style={[styles.amenityBadge, { backgroundColor: colors.surfaceSecondary }]}
              >
                <Ionicons
                  name={AMENITY_ICONS[amenity] || 'checkmark-outline'}
                  size={10}
                  color={colors.textSecondary}
                />
              </View>
            ))}
            {room.amenities.length > 3 && (
              <View style={[styles.amenityBadge, { backgroundColor: colors.surfaceSecondary }]}>
                <Text style={[styles.amenityText, { color: colors.textSecondary }]}>
                  +{room.amenities.length - 3}
                </Text>
              </View>
            )}
          </View>
        )}
      </Card>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Rooms"
        subtitle={`${rooms.length} rooms available`}
        showProfile={true}
        onProfilePress={() => nav.navigate('Settings')}
      />

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
        numColumns={2}
        columnWrapperStyle={rooms.length > 0 ? styles.gridRow : undefined}
        contentContainerStyle={[
          styles.listContent,
          rooms.length === 0 && styles.listContentCentered
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          isError ? (
            <ErrorState
              title="Failed to load rooms"
              message={error?.message || 'Unable to fetch rooms. Please try again.'}
              onRetry={refetch}
            />
          ) : (
            <EmptyState
              icon="business-outline"
              title={searchQuery ? 'No rooms match your search' : 'No rooms available'}
              subtitle={searchQuery ? 'Try adjusting your search or filters' : 'Check back later for available rooms'}
              actionLabel={searchQuery ? 'Clear Search' : undefined}
              onAction={searchQuery ? () => setSearchQuery('') : undefined}
            />
          )
        }
      />

      <RoomFilterModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        onApply={setFilters}
        initialFilters={filters}
      />
    </SafeAreaView>
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
  listContent: { padding: 12, gap: 12 },
  listContentCentered: { flexGrow: 1, justifyContent: 'center' },
  loadingContainer: { alignItems: 'center', padding: 40, gap: 12 },
  loadingText: { fontSize: 14, marginTop: 8 },
  gridRow: { gap: 12, justifyContent: 'flex-start' },
  roomCard: { flex: 1, maxWidth: '48%', marginBottom: 0 },
  roomHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  roomIconContainer: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  favoriteButton: { padding: 4 },
  roomName: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  roomLocation: { fontSize: 12, marginBottom: 8 },
  roomDetails: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  roomDetailItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  roomDetailText: { fontSize: 12 },
  amenities: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  amenityBadge: { width: 24, height: 24, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  amenityText: { fontSize: 10 },
});
