import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useRoom } from '../../hooks/useRooms';
import { Button, Card } from '../../components/common';
import type { RoomScreenProps } from '../../navigation/types';

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

export function RoomDetailScreen({ route, navigation }: RoomScreenProps<'RoomDetail'>) {
  const { roomId } = route.params;
  const { colors } = useTheme();
  const { data, isLoading } = useRoom(roomId);

  const room = data?.data;

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!room) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textSecondary }}>Room not found</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Room Header */}
        <View style={[styles.headerBanner, { backgroundColor: colors.primaryLight }]}>
          <Ionicons name="business" size={48} color={colors.primary} />
        </View>

        <View style={styles.infoSection}>
          <Text style={[styles.roomName, { color: colors.text }]}>{room.name}</Text>
          {room.building && (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={18} color={colors.textSecondary} />
              <Text style={[styles.locationText, { color: colors.textSecondary }]}>
                {room.building}{room.floor ? `, Floor ${room.floor}` : ''}
              </Text>
            </View>
          )}
        </View>

        {/* Details Card */}
        <Card style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Ionicons name="people-outline" size={22} color={colors.primary} />
              <View>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Capacity</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {room.capacity} {room.capacity === 1 ? 'person' : 'people'}
                </Text>
              </View>
            </View>
            {room.campus && (
              <View style={styles.detailItem}>
                <Ionicons name="school-outline" size={22} color={colors.primary} />
                <View>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Campus</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{room.campus.name}</Text>
                </View>
              </View>
            )}
          </View>
        </Card>

        {/* Amenities */}
        {room.amenities.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Amenities</Text>
            <View style={styles.amenitiesGrid}>
              {room.amenities.map((amenity) => (
                <View
                  key={amenity}
                  style={[styles.amenityItem, { backgroundColor: colors.surfaceSecondary }]}
                >
                  <Ionicons
                    name={AMENITY_ICONS[amenity] || 'checkmark-circle-outline'}
                    size={20}
                    color={colors.primary}
                  />
                  <Text style={[styles.amenityName, { color: colors.text }]}>
                    {amenity.replace(/-/g, ' ')}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Book Button */}
      <View style={[styles.bookBar, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <Button
          title="Book This Room"
          onPress={() =>
            navigation.navigate('CreateBooking', {
              roomId: room.id,
              roomName: room.name,
            })
          }
          fullWidth
          size="lg"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  headerBanner: {
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoSection: {
    padding: 20,
  },
  roomName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    fontSize: 15,
  },
  detailsCard: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailLabel: {
    fontSize: 12,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  amenityName: {
    fontSize: 13,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  bookBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 36,
    borderTopWidth: 1,
  },
});
