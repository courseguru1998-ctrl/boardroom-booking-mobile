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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { Card, Button, Input, StatusBadge } from '../../components/common';
import api from '../../services/api';
import type { Campus, CampusStats, ApiResponse } from '../../types';

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

interface CampusDetailScreenProps {
  route?: {
    params?: {
      campusId: string;
    };
  };
}

export function CampusDetailScreen({ route }: CampusDetailScreenProps) {
  const { colors } = useTheme();
  const { user } = useAuth();

  const campusId = route?.params?.campusId;

  const [campus, setCampus] = useState<Campus | null>(null);
  const [stats, setStats] = useState<CampusStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CampusFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Partial<CampusFormData>>({});

  // Check if user is super admin
  const isSuperAdmin = user?.role === SUPER_ADMIN_ROLE;

  const fetchCampusData = useCallback(async (isRefresh = false) => {
    if (!campusId) return;

    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      // Fetch campus details and stats in parallel
      const [campusResponse, statsResponse] = await Promise.all([
        api.get<ApiResponse<Campus>>(`/campuses/${campusId}`),
        api.get<ApiResponse<CampusStats>>(`/campuses/${campusId}/stats`),
      ]);

      if (campusResponse.data.success && campusResponse.data.data) {
        setCampus(campusResponse.data.data);
      }

      if (statsResponse.data.success && statsResponse.data.data) {
        setStats(statsResponse.data.data);
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Unable to load campus details';
      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [campusId]);

  useEffect(() => {
    if (campusId && isSuperAdmin) {
      fetchCampusData();
    }
  }, [campusId, isSuperAdmin, fetchCampusData]);

  const handleRefresh = () => {
    if (campusId && isSuperAdmin) {
      fetchCampusData(true);
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

  const handleOpenEditModal = () => {
    if (campus) {
      setFormData({
        name: campus.name,
        code: campus.code,
        city: campus.city,
        address: campus.address || '',
        phone: campus.phone || '',
        email: campus.email || '',
      });
    }
    setFormErrors({});
    setIsEditModalVisible(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalVisible(false);
    setFormData(initialFormData);
    setFormErrors({});
  };

  const handleUpdate = async () => {
    if (!validateForm() || !campus) return;

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

      const response = await api.patch<ApiResponse<Campus>>(
        `/campuses/${campus.id}`,
        payload
      );

      if (response.data.success) {
        Alert.alert('Success', 'Campus has been updated successfully');
        handleCloseEditModal();
        fetchCampusData(true);
      } else {
        Alert.alert('Error', response.data.message || 'Failed to update campus');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Unable to update campus';
      Alert.alert('Error', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = () => {
    if (!campus) return;

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
                fetchCampusData(true);
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
            You need Super Admin privileges to view campus details
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Loading state
  if (isLoading && !campus) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Ionicons name="business-outline" size={48} color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading campus details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!campus) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.accessDeniedContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.textTertiary} />
          <Text style={[styles.accessDeniedTitle, { color: colors.text }]}>
            Campus Not Found
          </Text>
          <Text style={[styles.accessDeniedSubtitle, { color: colors.textSecondary }]}>
            The requested campus could not be found
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
        {/* Header Card */}
        <Card style={styles.headerCard}>
          <View style={styles.headerRow}>
            <View style={[styles.campusIcon, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="business" size={32} color={colors.primary} />
            </View>
            <View style={styles.headerInfo}>
              <Text style={[styles.campusName, { color: colors.text }]}>
                {campus.name}
              </Text>
              <Text style={[styles.campusCode, { color: colors.textSecondary }]}>
                {campus.code}
              </Text>
            </View>
            <StatusBadge
              status={campus.isActive ? 'CONFIRMED' : 'CANCELLED'}
              size="md"
            />
          </View>

          {/* Contact Info */}
          <View style={styles.contactSection}>
            {campus.address && (
              <View style={styles.contactRow}>
                <Ionicons name="location-outline" size={18} color={colors.textTertiary} />
                <Text style={[styles.contactText, { color: colors.textSecondary }]}>
                  {campus.address}, {campus.city}
                </Text>
              </View>
            )}
            {campus.phone && (
              <View style={styles.contactRow}>
                <Ionicons name="call-outline" size={18} color={colors.textTertiary} />
                <Text style={[styles.contactText, { color: colors.textSecondary }]}>
                  {campus.phone}
                </Text>
              </View>
            )}
            {campus.email && (
              <View style={styles.contactRow}>
                <Ionicons name="mail-outline" size={18} color={colors.textTertiary} />
                <Text style={[styles.contactText, { color: colors.textSecondary }]}>
                  {campus.email}
                </Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          {isSuperAdmin && campus.isActive && (
            <View style={styles.actionButtons}>
              <Button
                title="Edit Campus"
                variant="outline"
                onPress={handleOpenEditModal}
                style={{ flex: 1 }}
              />
              <Button
                title="Deactivate"
                variant="danger"
                onPress={handleDeactivate}
                style={{ flex: 1 }}
              />
            </View>
          )}
        </Card>

        {/* Statistics Section */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          STATISTICS
        </Text>
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="people" size={24} color={colors.primary} />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {stats?.totalUsers || campus._count?.users || 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Total Users
            </Text>
          </Card>

          <Card style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: colors.successLight }]}>
              <Ionicons name="door-open" size={24} color={colors.statusConfirmed} />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {stats?.totalRooms || campus._count?.rooms || 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Total Rooms
            </Text>
          </Card>

          <Card style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: colors.warningLight }]}>
              <Ionicons name="checkmark-circle" size={24} color={colors.statusPending} />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {stats?.activeRooms || 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Active Rooms
            </Text>
          </Card>

          <Card style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: colors.errorLight }]}>
              <Ionicons name="calendar" size={24} color={colors.error} />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {stats?.totalBookings || 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Total Bookings
            </Text>
          </Card>
        </View>

        {/* Additional Info */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          DETAILS
        </Text>
        <Card style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textTertiary }]}>
              Campus ID
            </Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {campus.id}
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textTertiary }]}>
              City
            </Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {campus.city}
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textTertiary }]}>
              Pincode
            </Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {campus.pincode || 'N/A'}
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textTertiary }]}>
              Schools
            </Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {campus.schools?.length > 0 ? campus.schools.join(', ') : 'None'}
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textTertiary }]}>
              Created At
            </Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {new Date(campus.createdAt).toLocaleDateString()}
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textTertiary }]}>
              Last Updated
            </Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {new Date(campus.updatedAt).toLocaleDateString()}
            </Text>
          </View>
        </Card>
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseEditModal}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={handleCloseEditModal}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Edit Campus
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
              title="Update Campus"
              onPress={handleUpdate}
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
  headerCard: {
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  campusIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  campusName: {
    fontSize: 22,
    fontWeight: '700',
  },
  campusCode: {
    fontSize: 14,
    marginTop: 2,
  },
  contactSection: {
    marginTop: 16,
    gap: 8,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  contactText: {
    fontSize: 14,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: '47%',
    alignItems: 'center',
    paddingVertical: 20,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 13,
    marginTop: 4,
  },
  detailsCard: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
    marginLeft: 16,
  },
  divider: {
    height: 1,
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
