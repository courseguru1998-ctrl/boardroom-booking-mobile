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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { Card, Button, StatusBadge, Header, EmptyState } from '../../components/common';
import { adminApi } from '../../services/admin';
import type { User, ApprovalStatus, UserRole } from '../../types';

// Admin roles that can access user management
const ADMIN_ROLES = ['ADMIN', 'CAMPUS_ADMIN', 'SUPER_ADMIN'];

type TabType = 'all' | 'pending';

export function UsersScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<any>();

  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Check if user is admin
  const isAdmin = user?.role && ADMIN_ROLES.includes(user.role);

  const fetchUsers = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      // Fetch both all users and pending users in parallel
      const [allUsersResponse, pendingUsersResponse] = await Promise.all([
        adminApi.getAllUsers(),
        adminApi.getPendingUsers(),
      ]);

      if (allUsersResponse.success && allUsersResponse.data) {
        setAllUsers(allUsersResponse.data);
      }

      if (pendingUsersResponse.success && pendingUsersResponse.data) {
        setPendingUsers(pendingUsersResponse.data);
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Unable to load users';
      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin, fetchUsers]);

  const handleRefresh = () => {
    if (isAdmin) {
      fetchUsers(true);
    }
  };

  const handleApprove = async (userId: string) => {
    Alert.alert(
      'Approve User',
      'Are you sure you want to approve this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            setActionLoading(userId);
            try {
              const response = await adminApi.approveUser(userId);
              if (response.success) {
                Alert.alert('Success', 'User has been approved');
                // Remove from pending and add to all users
                const approvedUser = pendingUsers.find(u => u.id === userId);
                setPendingUsers(prev => prev.filter(u => u.id !== userId));
                if (approvedUser) {
                  setAllUsers(prev => [approvedUser, ...prev]);
                }
              } else {
                Alert.alert('Error', response.message || 'Failed to approve user');
              }
            } catch (error: any) {
              const message = error.response?.data?.message || 'Unable to approve user';
              Alert.alert('Error', message);
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const handleReject = async (userId: string) => {
    Alert.alert(
      'Reject User',
      'Are you sure you want to reject this user? They will be notified and removed from the system.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(userId);
            try {
              const response = await adminApi.rejectUser(userId);
              if (response.success) {
                Alert.alert('Success', 'User has been rejected');
                // Remove from pending
                setPendingUsers(prev => prev.filter(u => u.id !== userId));
              } else {
                Alert.alert('Error', response.message || 'Failed to reject user');
              }
            } catch (error: any) {
              const message = error.response?.data?.message || 'Unable to reject user';
              Alert.alert('Error', message);
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const getDisplayUsers = (): User[] => {
    return activeTab === 'all' ? allUsers : pendingUsers;
  };

  const getUserStatus = (userItem: User): ApprovalStatus => {
    return userItem.approvalStatus || 'APPROVED';
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return { bg: colors.errorLight, text: colors.error };
      case 'ADMIN':
        return { bg: colors.warningLight, text: colors.warning };
      case 'CAMPUS_ADMIN':
        return { bg: colors.primaryLight, text: colors.primary };
      default:
        return { bg: colors.surfaceSecondary, text: colors.textSecondary };
    }
  };

  // Show access denied if not admin
  if (!isAdmin) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Header
          title="Users"
          showProfile={true}
          onProfilePress={() => navigation.navigate('Settings')}
        />
        <EmptyState
          icon="shield-outline"
          title="Access Denied"
          subtitle="You need admin privileges to manage users"
        />
      </SafeAreaView>
    );
  }

  // Loading state
  if (isLoading && !allUsers.length && !pendingUsers.length) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Header
          title="Users"
          showProfile={true}
          onProfilePress={() => navigation.navigate('Settings')}
        />
        <View style={styles.loadingContainer}>
          <Ionicons name="people-outline" size={48} color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading users...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderUserItem = (userItem: User) => {
    const roleBadge = getRoleBadgeColor(userItem.role);
    const status = getUserStatus(userItem);
    const isPending = status === 'PENDING';
    const isActionLoading = actionLoading === userItem.id;

    return (
      <Card key={userItem.id} style={styles.userCard}>
        <View style={styles.userHeader}>
          <View style={styles.userAvatar}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>
              {(userItem.firstName?.[0] || 'U').toUpperCase()}
              {(userItem.lastName?.[0] || '').toUpperCase()}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: colors.text }]}>
              {userItem.firstName} {userItem.lastName}
            </Text>
            <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
              {userItem.email}
            </Text>
          </View>
        </View>

        <View style={styles.userDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="shield-outline" size={16} color={colors.textTertiary} />
            <View style={[styles.roleBadge, { backgroundColor: roleBadge.bg }]}>
              <Text style={[styles.roleText, { color: roleBadge.text }]}>
                {userItem.role.replace('_', ' ')}
              </Text>
            </View>
          </View>

          {userItem.department && (
            <View style={styles.detailRow}>
              <Ionicons name="business-outline" size={16} color={colors.textTertiary} />
              <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                {userItem.department}
              </Text>
            </View>
          )}

          {userItem.campus && (
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={16} color={colors.textTertiary} />
              <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                {userItem.campus.name}
              </Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Ionicons name="ellipse-outline" size={16} color={colors.textTertiary} />
            <StatusBadge status={isPending ? 'PENDING' : 'CONFIRMED'} size="sm" />
          </View>
        </View>

        {/* Action buttons for pending users */}
        {isPending && (
          <View style={styles.actionButtons}>
            <Button
              title="Reject"
              variant="destructive"
              size="sm"
              loading={isActionLoading}
              onPress={() => handleReject(userItem.id)}
              style={styles.rejectButton}
            />
            <Button
              title="Approve"
              variant="primary"
              size="sm"
              loading={isActionLoading}
              onPress={() => handleApprove(userItem.id)}
              style={styles.approveButton}
            />
          </View>
        )}
      </Card>
    );
  };

  const displayUsers = getDisplayUsers();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Users"
        subtitle={`${displayUsers.length} users`}
        showProfile={true}
        onProfilePress={() => navigation.navigate('Settings')}
        rightAction={{
          icon: 'refresh',
          onPress: handleRefresh,
        }}
      />

      {/* Tabs */}
      <View style={[styles.tabsContainer, { backgroundColor: colors.surfaceSecondary, marginHorizontal: 20 }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'all' && { backgroundColor: colors.card },
          ]}
          onPress={() => setActiveTab('all')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'all' ? colors.primary : colors.textSecondary },
            ]}
          >
            All Users
          </Text>
          <View
            style={[
              styles.tabBadge,
              { backgroundColor: activeTab === 'all' ? colors.primary : colors.surfaceSecondary },
            ]}
          >
            <Text
              style={[
                styles.tabBadgeText,
                { color: activeTab === 'all' ? '#FFFFFF' : colors.textSecondary },
              ]}
            >
              {allUsers.length}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'pending' && { backgroundColor: colors.card },
          ]}
          onPress={() => setActiveTab('pending')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'pending' ? colors.primary : colors.textSecondary },
            ]}
          >
            Pending
          </Text>
          {pendingUsers.length > 0 && (
            <View
              style={[
                styles.tabBadge,
                { backgroundColor: colors.warning },
              ]}
            >
              <Text style={[styles.tabBadgeText, { color: '#FFFFFF' }]}>
                {pendingUsers.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        data={displayUsers}
        renderItem={({ item }) => renderUserItem(item)}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon={activeTab === 'pending' ? 'hourglass-outline' : 'people-outline'}
              title={activeTab === 'pending' ? 'No pending users' : 'No users found'}
              subtitle={activeTab === 'pending'
                ? 'All user requests have been processed'
                : 'Users will appear here when they register'}
            />
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 20,
    gap: 12,
  },
  gridRow: {
    gap: 12,
    justifyContent: 'flex-start',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
  },
  tabBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tabBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  userCard: {
    flex: 1,
    maxWidth: '48%',
    marginBottom: 0,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
  },
  userEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  userDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 13,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  rejectButton: {
    flex: 1,
  },
  approveButton: {
    flex: 1,
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
});
