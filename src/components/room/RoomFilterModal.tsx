import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { Button } from '../common';
import { config } from '../../constants/config';

export interface RoomFilterValues {
  capacity?: number;
  building?: string;
  floor?: string;
  amenities?: string[];
}

interface RoomFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: RoomFilterValues) => void;
  initialFilters: RoomFilterValues;
}

export function RoomFilterModal({
  visible,
  onClose,
  onApply,
  initialFilters,
}: RoomFilterModalProps) {
  const { colors } = useTheme();
  const [capacity, setCapacity] = useState(
    initialFilters.capacity?.toString() || ''
  );
  const [building, setBuilding] = useState(initialFilters.building || '');
  const [floor, setFloor] = useState(initialFilters.floor || '');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(
    initialFilters.amenities || []
  );

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity)
        ? prev.filter((a) => a !== amenity)
        : [...prev, amenity]
    );
  };

  const handleApply = () => {
    const filters: RoomFilterValues = {};
    if (capacity) filters.capacity = parseInt(capacity, 10);
    if (building.trim()) filters.building = building.trim();
    if (floor.trim()) filters.floor = floor.trim();
    if (selectedAmenities.length > 0) filters.amenities = selectedAmenities;
    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    setCapacity('');
    setBuilding('');
    setFloor('');
    setSelectedAmenities([]);
    onApply({});
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Filter Rooms
          </Text>
          <TouchableOpacity onPress={handleReset}>
            <Text style={[styles.resetText, { color: colors.primary }]}>Reset</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* Capacity */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Minimum Capacity
            </Text>
            <View
              style={[
                styles.inputContainer,
                { borderColor: colors.border, backgroundColor: colors.surface },
              ]}
            >
              <Ionicons name="people-outline" size={18} color={colors.textTertiary} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="e.g. 10"
                placeholderTextColor={colors.textTertiary}
                keyboardType="number-pad"
                value={capacity}
                onChangeText={setCapacity}
              />
            </View>
          </View>

          {/* Building */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Building
            </Text>
            <View
              style={[
                styles.inputContainer,
                { borderColor: colors.border, backgroundColor: colors.surface },
              ]}
            >
              <Ionicons name="business-outline" size={18} color={colors.textTertiary} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="e.g. Main Building"
                placeholderTextColor={colors.textTertiary}
                value={building}
                onChangeText={setBuilding}
              />
            </View>
          </View>

          {/* Floor */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Floor
            </Text>
            <View
              style={[
                styles.inputContainer,
                { borderColor: colors.border, backgroundColor: colors.surface },
              ]}
            >
              <Ionicons name="layers-outline" size={18} color={colors.textTertiary} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="e.g. 2"
                placeholderTextColor={colors.textTertiary}
                value={floor}
                onChangeText={setFloor}
              />
            </View>
          </View>

          {/* Amenities */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Amenities
            </Text>
            <View style={styles.amenitiesGrid}>
              {config.amenities.map((amenity) => {
                const isSelected = selectedAmenities.includes(amenity);
                return (
                  <TouchableOpacity
                    key={amenity}
                    onPress={() => toggleAmenity(amenity)}
                    style={[
                      styles.amenityChip,
                      {
                        backgroundColor: isSelected
                          ? colors.primaryLight
                          : colors.surfaceSecondary,
                        borderColor: isSelected ? colors.primary : 'transparent',
                        borderWidth: isSelected ? 1.5 : 0,
                      },
                    ]}
                  >
                    <Ionicons
                      name={isSelected ? 'checkmark-circle' : 'add-circle-outline'}
                      size={16}
                      color={isSelected ? colors.primary : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.amenityChipText,
                        {
                          color: isSelected ? colors.primary : colors.textSecondary,
                        },
                      ]}
                    >
                      {amenity.replace(/-/g, ' ')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>

        {/* Apply Button */}
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <Button
            title="Apply Filters"
            onPress={handleApply}
            fullWidth
            size="lg"
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  resetText: { fontSize: 15, fontWeight: '500' },
  content: { padding: 20 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 15, fontWeight: '600', marginBottom: 10 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  input: { flex: 1, paddingVertical: 12, fontSize: 16 },
  amenitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  amenityChipText: { fontSize: 13, fontWeight: '500', textTransform: 'capitalize' },
  footer: { padding: 20, paddingBottom: 36, borderTopWidth: 1 },
});
