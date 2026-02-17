import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  Alert,
  FlatList,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { Card, Button, Input, StatusBadge } from '../../components/common';
import api from '../../services/api';
import type { Campus, ApiResponse } from '../../types';

// Super admin only role
const SUPER_ADMIN_ROLE = 'SUPER_ADMIN';

interface CampusFormData {
  name: string;
  code: string;
  city: string;
  address: string;
  phone: string;
  email: string;
}

const initialFormData: CampusFormData = {
  name: '',
  code: '',
  city: '',
  address: '',
  phone: '',
  email: '',
};

export function CampusesScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { user } = useAuth();

  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCampus, setEditingCampus] = useState<Campus | null>(null);
  const [formData, setFormData] = useState<CampusFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Partial<CampusFormData>>({});

  // Check if user is super admin
  const isSuperAdmin = user?.role === SUPER_ADMIN_ROLE;

  const fetchCampuses = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const response = await api.get<ApiResponse<Campus[]>>('/campuses');
      if (response.data.success && response.data.data) {
        setCampuses(response.data.data);
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Unable to load campuses';
      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isSuperAdmin) {
      fetchCampuses();
    }
  }, [isSuperAdmin, fetchCampuses]);

  const handleRefresh = () => {
    if (isSuperAdmin) {
      fetchCampuses(true);
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<CampusFormData> = {};

    if (!formData.name.trim()) {
      errors.name = 'Campus name is required';
    }
    if (!formData.code.trim()) {
      errors.code = 'Campus code is required';
    }
    if (!formData.city.trim()) {
      errors.city = 'City is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenModal = (campus?: Campus) => {
    if (campus) {
      setEditingCampus(campus);
      setFormData({
        name: campus.name,
        code: campus.code,
        city: campus.city,
        address: campus.address || '',
        phone: campus.phone || '',
        email: campus.email || '',
      });
    } else {
      setEditingCampus(null);
      setFormData(initialFormData);
    }
    setFormErrors({});
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setEditingCampus(null);
    setFormData(initialFormData);
    setFormErrors({});
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        city: formData.city.trim(),
        address: formData.address.trim() || null,
        phone: formData.phone.trim() || null,
        email: formData.email.trim() || null,
      };

      let response;
      if (editingCampus) {
        response = await api.patch<ApiResponse<Campus>>(
          `/campuses/${editingCampus.id}`,
          payload
        );
      } else {
        response = await api.post<ApiResponse<Campus>>('/campuses', payload);
      }

      if (response.data.success) {
        Alert.alert(
          'Success',
          editingCampus
            ? 'Campus has been updated successfully'
            : 'Campus has been created successfully'
        );
        handleCloseModal();
        fetchCampuses(true);
      } else {
        Alert.alert('Error', response.data.message || 'Failed to save campus');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Unable to save campus';
      Alert.alert('Error', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = (campus: Campus) => {
    Alert.alert(
      'Deactivate Campus',
      `Are you sure you want to deactivate "${campus.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await api.delete<ApiResponse<void>>(
                `/campuses/${campus.id}`
              );
              if (response.data.success) {
                Alert.alert('Success', 'Campus has been deactivated');
                fetchCampuses(true);
              } else {
                Alert.alert('Error', response.data.message || 'Failed to deactivate campus');
              }
            } catch (error: any) {
              const message = error.response?.data?.message || 'Unable to deactivate campus';
              Alert.alert('Error', message);
            }
          },
        },
      ]
    );
  };

  const renderCampusItem = (campus: Campus) => (
    <Card
      key={campus.id}
      style={styles.campusCard}
      onPress={() => navigation.navigate('CampusDetail', { campusId: campus.id })}
    >
      <View style={styles.campusHeader}>
        <View style={[styles.campusIcon, { backgroundColor: colors.primaryLight }]}>
          <Ionicons name="business" size={24} color={colors.primary} />
        </View>
        <View style={styles.campusInfo}>
          <Text style={[styles.campusName, { color: colors.text }]}>
            {campus.name}
          </Text>
          <Text style={[styles.campusCode, { color: colors.textSecondary }]}>
            {campus.code}
          </Text>
        </View>
        <StatusBadge
          status={campus.isActive ? 'CONFIRMED' : 'CANCELLED'}
          size="sm"
        />
      </View>

      <View style={styles.campusDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="location-outline" size={16} color={colors.textTertiary} />
          <Text style={[styles.detailText, { color: colors.textSecondary }]}>
            {campus.city}
            {campus.address ? `, ${campus.address}` : ''}
          </Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="people-outline" size={16} color={colors.textTertiary} />
            <Text style={[styles.statText, { color: colors.textSecondary }]}>
              {campus._count?.users || 0} users
            </Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="business-outline" size={16} color={colors.textTertiary} />
            <Text style={[styles.statText, { color: colors.textSecondary }]}>
              {campus._count?.rooms || 0} rooms
            </Text>
          </View>
        </View>
      </View>

      {isSuperAdmin && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.surfaceSecondary }]}
            onPress={() => handleOpenModal(campus)}
          >
            <Ionicons name="create-outline" size={18} color={colors.primary} />
            <Text style={[styles.actionButtonText, { color: colors.primary }]}>
              Edit
            </Text>
          </TouchableOpacity>
          {campus.isActive && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.errorLight }]}
              onPress={() => handleDeactivate(campus)}
            >
              <Ionicons name="trash-outline" size={18} color={colors.error} />
              <Text style={[styles.actionButtonText, { color: colors.error }]}>
                Deactivate
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </Card>
  );

  // Show access denied if not super admin
  if (!isSuperAdmin) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.accessDeniedContainer}>
          <Ionicons name="shield-outline" size={64} color={colors.textTertiary} />
          <Text style={[styles.accessDeniedTitle, { color: colors.text }]}>
            Access Denied
          </Text>
          <Text style={[styles.accessDeniedSubtitle, { color: colors.textSecondary }]}>
            You need Super Admin privileges to manage campuses
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Loading state
  if (isLoading && !campuses.length) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Ionicons name="business-outline" size={48} color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading campuses...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

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
            <Text style={[styles.pageTitle, { color: colors.text }]}>Campuses</Text>
            <Text style={[styles.pageSubtitle, { color: colors.textSecondary }]}>
              Manage campus locations
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={() => handleOpenModal()}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Campuses List */}
        <View style={styles.campusesSection}>
          {campuses.length === 0 ? (
            <Card style={styles.emptyCard}>
              <View style={styles.emptyContent}>
                <Ionicons
                  name="business-outline"
                  size={48}
                  color={colors.textTertiary}
                />
                <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
                  No campuses found
                </Text>
                <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>
                  Create your first campus to get started
                </Text>
                <Button
                  title="Create Campus"
                  onPress={() => handleOpenModal()}
                  style={{ marginTop: 16 }}
                />
              </View>
            </Card>
          ) : (
            <View style={styles.campusesList}>
              {campuses.map(renderCampusItem)}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Create/Edit Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseModal}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={handleCloseModal}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {editingCampus ? 'Edit Campus' : 'New Campus'}
            </Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            <Input
              label="Campus Name"
              placeholder="Enter campus name"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              error={formErrors.name}
              leftIcon="business-outline"
            />

            <Input
              label="Campus Code"
              placeholder="e.g., NYC, LDN"
              value={formData.code}
              onChangeText={(text) => setFormData({ ...formData, code: text })}
              error={formErrors.code}
              leftIcon="code-slash-outline"
              autoCapitalize="characters"
              maxLength={10}
            />

            <Input
              label="City"
              placeholder="Enter city"
              value={formData.city}
              onChangeText={(text) => setFormData({ ...formData, city: text })}
              error={formErrors.city}
              leftIcon="location-outline"
            />

            <Input
              label="Address"
              placeholder="Enter address (optional)"
              value={formData.address}
              onChangeText={(text) => setFormData({ ...formData, address: text })}
              leftIcon="map-outline"
              multiline
            />

            <Input
              label="Phone"
              placeholder="Enter phone number (optional)"
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              leftIcon="call-outline"
              keyboardType="phone-pad"
            />

            <Input
              label="Email"
              placeholder="Enter email (optional)"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              leftIcon="mail-outline"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Button
              title={editingCampus ? 'Update Campus' : 'Create Campus'}
              onPress={handleSubmit}
              loading={isSubmitting}
              fullWidth
              style={{ marginTop: 8, marginBottom: 32 }}
            />
          </ScrollView>
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
    marginBottom: 20,
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
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  campusesSection: {
    marginBottom: 20,
  },
  campusesList: {
    gap: 12,
  },
  campusCard: {
    marginBottom: 0,
  },
  campusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  campusIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  campusInfo: {
    flex: 1,
  },
  campusName: {
    fontSize: 16,
    fontWeight: '600',
  },
  campusCode: {
    fontSize: 13,
    marginTop: 2,
  },
  campusDetails: {
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 4,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 13,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
});
