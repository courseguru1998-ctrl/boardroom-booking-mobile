import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { Card, Button, Input } from '../../components/common';
import { adminApi, type CreateRoomData, type UpdateRoomData } from '../../services/admin';
import { campusesApi } from '../../services/campuses';
import type { Room, Campus } from '../../types';

// Admin roles that can access room management
const ADMIN_ROLES = ['ADMIN', 'CAMPUS_ADMIN', 'SUPER_ADMIN'];

// Common amenities options
const AMENITIES_OPTIONS = [
  'Projector',
  'Whiteboard',
  'TV Screen',
  'Video Conferencing',
  'Phone',
  'Air Conditioning',
  'WiFi',
  'Whiteboard Marker',
  'Flip Chart',
  'Microphone',
  'Sound System',
  'Natural Light',
];

export function RoomsManageScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal states
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CreateRoomData>({
    name: '',
    capacity: 10,
    floor: '',
    building: '',
    amenities: [],
    campusId: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Check if user is admin
  const isAdmin = user?.role && ADMIN_ROLES.includes(user.role);

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      // Fetch rooms and campuses in parallel
      const [roomsResponse, campusesResponse] = await Promise.all([
        adminApi.getAllRooms(),
        campusesApi.getActive(),
      ]);

      if (roomsResponse.success && roomsResponse.data) {
        setRooms(roomsResponse.data);
      }

      setCampuses(campusesResponse);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Unable to load data';
      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin, fetchData]);

  const handleRefresh = () => {
    if (isAdmin) {
      fetchData(true);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      capacity: 10,
      floor: '',
      building: '',
      amenities: [],
      campusId: campuses.length > 0 ? campuses[0].id : '',
    });
    setFormErrors({});
    setEditingRoom(null);
  };

  const openCreateModal = () => {
    resetForm();
    // Set default campus to user's campus if available
    if (user?.campusId) {
      setFormData(prev => ({ ...prev, campusId: user.campusId! }));
    }
    setIsModalVisible(true);
  };

  const openEditModal = (room: Room) => {
    setEditingRoom(room);
    setFormData({
      name: room.name,
      capacity: room.capacity,
      floor: room.floor || '',
      building: room.building || '',
      amenities: room.amenities || [],
      campusId: room.campusId,
    });
    setFormErrors({});
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    resetForm();
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Room name is required';
    }

    if (formData.capacity < 1) {
      errors.capacity = 'Capacity must be at least 1';
    }

    if (!formData.campusId) {
      errors.campusId = 'Please select a campus';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      if (editingRoom) {
        // Update existing room
        const updateData: UpdateRoomData = {
          name: formData.name,
          capacity: formData.capacity,
          floor: formData.floor,
          building: formData.building,
          amenities: formData.amenities,
        };

        const response = await adminApi.updateRoom(editingRoom.id, updateData);

        if (response.success && response.data) {
          Alert.alert('Success', 'Room updated successfully');
          // Update local state
          setRooms(prev =>
            prev.map(r => (r.id === editingRoom.id ? response.data! : r))
          );
          closeModal();
        } else {
          Alert.alert('Error', response.message || 'Failed to update room');
        }
      } else {
        // Create new room
        const response = await adminApi.createRoom(formData);

        if (response.success && response.data) {
          Alert.alert('Success', 'Room created successfully');
          // Update local state
          setRooms(prev => [response.data!, ...prev]);
          closeModal();
        } else {
          Alert.alert('Error', response.message || 'Failed to create room');
        }
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Unable to save room';
      Alert.alert('Error', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleAmenity = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const getCampusName = (campusId: string) => {
    const campus = campuses.find(c => c.id === campusId);
    return campus?.name || 'Unknown Campus';
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
            You need admin privileges to manage rooms
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Loading state
  if (isLoading && rooms.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Ionicons name="business-outline" size={48} color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading rooms...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderRoomItem = (room: Room) => (
    <Card key={room.id} style={styles.roomCard} onPress={() => openEditModal(room)}>
      <View style={styles.roomHeader}>
        <View style={styles.roomIconContainer}>
          <Ionicons name="business" size={24} color={colors.primary} />
        </View>
        <View style={styles.roomInfo}>
          <Text style={[styles.roomName, { color: colors.text }]} numberOfLines={1}>
            {room.name}
          </Text>
          <Text style={[styles.roomCampus, { color: colors.textSecondary }]} numberOfLines={1}>
            {room.campus?.name || getCampusName(room.campusId)}
          </Text>
        </View>
        <View
          style={[
            styles.activeBadge,
            { backgroundColor: room.isActive ? colors.successLight : colors.errorLight },
          ]}
        >
          <Text
            style={[styles.activeBadgeText, { color: room.isActive ? colors.success : colors.error }]}
          >
            {room.isActive ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>

      <View style={styles.roomDetails}>
        <View style={styles.roomDetail}>
          <Ionicons name="people-outline" size={16} color={colors.textTertiary} />
          <Text style={[styles.roomDetailText, { color: colors.textSecondary }]}>
            {room.capacity} people
          </Text>
        </View>

        {room.floor && (
          <View style={styles.roomDetail}>
            <Ionicons name="layers-outline" size={16} color={colors.textTertiary} />
            <Text style={[styles.roomDetailText, { color: colors.textSecondary }]}>
              Floor {room.floor}
            </Text>
          </View>
        )}

        {room.building && (
          <View style={styles.roomDetail}>
            <Ionicons name="business-outline" size={16} color={colors.textTertiary} />
            <Text style={[styles.roomDetailText, { color: colors.textSecondary }]} numberOfLines={1}>
              {room.building}
            </Text>
          </View>
        )}
      </View>

      {room.amenities && room.amenities.length > 0 && (
        <View style={styles.amenitiesContainer}>
          {room.amenities.slice(0, 4).map((amenity, index) => (
            <View
              key={index}
              style={[styles.amenityTag, { backgroundColor: colors.primaryLight }]}
            >
              <Text style={[styles.amenityText, { color: colors.primary }]}>
                {amenity}
              </Text>
            </View>
          ))}
          {room.amenities.length > 4 && (
            <View style={[styles.amenityTag, { backgroundColor: colors.surfaceSecondary }]}>
              <Text style={[styles.amenityText, { color: colors.textSecondary }]}>
                +{room.amenities.length - 4}
              </Text>
            </View>
          )}
        </View>
      )}
    </Card>
  );

  const renderAmenityOption = (amenity: string) => {
    const isSelected = formData.amenities.includes(amenity);
    return (
      <TouchableOpacity
        key={amenity}
        onPress={() => toggleAmenity(amenity)}
        style={[
          styles.amenityOption,
          {
            backgroundColor: isSelected ? colors.primaryLight : colors.surfaceSecondary,
            borderColor: isSelected ? colors.primary : 'transparent',
          },
        ]}
      >
        <Text
          style={[
            styles.amenityOptionText,
            { color: isSelected ? colors.primary : colors.textSecondary },
          ]}
        >
          {amenity}
        </Text>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
        )}
      </TouchableOpacity>
    );
  };

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
          <View>
            <Text style={[styles.pageTitle, { color: colors.text }]}>Rooms</Text>
            <Text style={[styles.pageSubtitle, { color: colors.textSecondary }]}>
              Manage boardrooms and meeting spaces
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={openCreateModal}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Rooms List */}
        {rooms.length === 0 ? (
          <Card style={styles.emptyCard}>
            <View style={styles.emptyContent}>
              <Ionicons name="business-outline" size={48} color={colors.textTertiary} />
              <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
                No rooms found
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>
                Add your first room to get started
              </Text>
              <Button
                title="Add Room"
                onPress={openCreateModal}
                style={{ marginTop: 16 }}
              />
            </View>
          </Card>
        ) : (
          <View style={styles.roomsList}>
            {rooms.map(renderRoomItem)}
          </View>
        )}
      </ScrollView>

      {/* Create/Edit Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContent}
          >
            {/* Modal Header */}
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <TouchableOpacity onPress={closeModal} style={styles.modalCloseButton}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingRoom ? 'Edit Room' : 'Add Room'}
              </Text>
              <View style={{ width: 40 }} />
            </View>

            {/* Form */}
            <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
              <Input
                label="Room Name"
                placeholder="Enter room name"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                error={formErrors.name}
                leftIcon="business-outline"
              />

              <Input
                label="Capacity"
                placeholder="Number of people"
                value={formData.capacity.toString()}
                onChangeText={(text) =>
                  setFormData({ ...formData, capacity: parseInt(text) || 0 })
                }
                keyboardType="numeric"
                error={formErrors.capacity}
                leftIcon="people-outline"
              />

              <Input
                label="Floor"
                placeholder="e.g., 1st, 2nd, Ground"
                value={formData.floor}
                onChangeText={(text) => setFormData({ ...formData, floor: text })}
                leftIcon="layers-outline"
              />

              <Input
                label="Building"
                placeholder="e.g., Main Building, Tower A"
                value={formData.building}
                onChangeText={(text) => setFormData({ ...formData, building: text })}
                leftIcon="business-outline"
              />

              {/* Campus Selector */}
              <Text style={[styles.inputLabel, { color: colors.text }]}>Campus</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.campusSelector}
              >
                {campuses.map((campus) => (
                  <TouchableOpacity
                    key={campus.id}
                    onPress={() => setFormData({ ...formData, campusId: campus.id })}
                    style={[
                      styles.campusOption,
                      {
                        backgroundColor:
                          formData.campusId === campus.id
                            ? colors.primaryLight
                            : colors.surfaceSecondary,
                        borderColor:
                          formData.campusId === campus.id ? colors.primary : 'transparent',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.campusOptionText,
                        {
                          color:
                            formData.campusId === campus.id
                              ? colors.primary
                              : colors.textSecondary,
                        },
                      ]}
                    >
                      {campus.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              {formErrors.campusId && (
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {formErrors.campusId}
                </Text>
              )}

              {/* Amenities Selector */}
              <Text style={[styles.inputLabel, { color: colors.text }]}>Amenities</Text>
              <View style={styles.amenitiesGrid}>
                {AMENITIES_OPTIONS.map(renderAmenityOption)}
              </View>

              {/* Submit Button */}
              <Button
                title={editingRoom ? 'Update Room' : 'Create Room'}
                onPress={handleSubmit}
                loading={isSubmitting}
                fullWidth
                style={{ marginTop: 24, marginBottom: 40 }}
              />
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
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
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roomsList: {
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
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  roomInfo: {
    flex: 1,
  },
  roomName: {
    fontSize: 16,
    fontWeight: '600',
  },
  roomCampus: {
    fontSize: 13,
    marginTop: 2,
  },
  activeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  roomDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 12,
  },
  roomDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  roomDetailText: {
    fontSize: 13,
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  amenityTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  amenityText: {
    fontSize: 12,
    fontWeight: '500',
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
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
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
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalContent: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  formContainer: {
    flex: 1,
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  campusSelector: {
    marginBottom: 16,
  },
  campusOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1.5,
  },
  campusOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  amenityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  amenityOptionText: {
    fontSize: 13,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 12,
    marginTop: -12,
    marginBottom: 12,
    marginLeft: 4,
  },
});
