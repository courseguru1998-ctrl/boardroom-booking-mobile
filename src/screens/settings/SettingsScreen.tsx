import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { SettingsScreenProps } from '../../navigation/types';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { useCalendarConnections, useCalendarConnect, useCalendarDisconnect } from '../../hooks/useCalendar';
import { Card } from '../../components/common';
import * as SecureStore from 'expo-secure-store';

type ThemeMode = 'light' | 'dark' | 'system';

// Admin roles that can access analytics
const ADMIN_ROLES = ['ADMIN', 'CAMPUS_ADMIN', 'SUPER_ADMIN'];
const SUPER_ADMIN_ROLE = 'SUPER_ADMIN';

export function SettingsScreen({ navigation }: SettingsScreenProps<'SettingsMain'>) {
  const { colors, mode, setMode, isDark } = useTheme();
  const { user, logout } = useAuth();

  // Calendar connections
  const { data: connectionsData, isLoading: loadingConnections } = useCalendarConnections();
  const connectMutation = useCalendarConnect();
  const disconnectMutation = useCalendarDisconnect();

  const connections = connectionsData?.data || [];
  const isGoogleConnected = connections.some(c => c.provider === 'GOOGLE');
  const isMicrosoftConnected = connections.some(c => c.provider === 'MICROSOFT');

  // Handle OAuth redirect
  useEffect(() => {
    const handleUrl = async (event: { url: string }) => {
      const url = event.url;
      if (url.includes('calendar') && (url.includes('connected=true') || url.includes('connected=true'))) {
        Alert.alert('Success', 'Calendar connected successfully!');
      } else if (url.includes('calendar') && url.includes('error')) {
        Alert.alert('Error', 'Failed to connect calendar. Please try again.');
      }
    };

    // Check for URL on mount (for OAuth redirect)
    Linking.getInitialURL().then(url => {
      if (url && url.includes('calendar')) {
        handleUrl({ url });
      }
    });
  }, []);

  const handleConnectCalendar = async (provider: 'google' | 'microsoft') => {
    try {
      const response = await connectMutation.mutateAsync(provider);
      if (response?.data?.authUrl) {
        // Open the OAuth URL in browser
        const supported = await Linking.canOpenURL(response.data.authUrl);
        if (supported) {
          await Linking.openURL(response.data.authUrl);
        } else {
          Alert.alert('Error', 'Unable to open browser. Please try again.');
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to connect calendar');
    }
  };

  const handleDisconnectCalendar = (provider: 'google' | 'microsoft') => {
    Alert.alert(
      'Disconnect Calendar',
      `Are you sure you want to disconnect your ${provider === 'google' ? 'Google' : 'Microsoft'} calendar?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: () => disconnectMutation.mutate(provider),
        },
      ]
    );
  };

  // API Key state
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [apiKeyStatus, setApiKeyStatus] = useState<'none' | 'configured'>('none');

  // Check if API key is configured on mount
  useEffect(() => {
    const checkApiKey = async () => {
      const key = await SecureStore.getItemAsync('claude_api_key');
      setApiKeyStatus(key ? 'configured' : 'none');
    };
    checkApiKey();
  }, []);

  // Check if user is admin
  const isAdmin = user?.role && ADMIN_ROLES.includes(user.role);
  const isSuperAdmin = user?.role === SUPER_ADMIN_ROLE;

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  const handleSaveApiKey = async () => {
    if (!apiKeyInput.trim()) {
      Alert.alert('Error', 'Please enter a valid API key');
      return;
    }

    try {
      await SecureStore.setItemAsync('claude_api_key', apiKeyInput.trim());
      setApiKeyStatus('configured');
      setShowApiKeyModal(false);
      setApiKeyInput('');
      Alert.alert('Success', 'Claude API key saved successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save API key');
    }
  };

  const handleRemoveApiKey = async () => {
    Alert.alert(
      'Remove API Key',
      'Are you sure you want to remove your Claude API key?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await SecureStore.deleteItemAsync('claude_api_key');
            setApiKeyStatus('none');
          },
        },
      ]
    );
  };

  const themeOptions: { key: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'light', label: 'Light', icon: 'sunny-outline' },
    { key: 'dark', label: 'Dark', icon: 'moon-outline' },
    { key: 'system', label: 'System', icon: 'phone-portrait-outline' },
  ];

  const renderSettingRow = (
    icon: keyof typeof Ionicons.glyphMap,
    label: string,
    value?: string,
    onPress?: () => void,
    danger?: boolean
  ) => (
    <TouchableOpacity
      style={styles.settingRow}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.settingLeft}>
        <Ionicons
          name={icon}
          size={22}
          color={danger ? colors.error : colors.primary}
        />
        <Text
          style={[
            styles.settingLabel,
            { color: danger ? colors.error : colors.text },
          ]}
        >
          {label}
        </Text>
      </View>
      {value && (
        <Text style={[styles.settingValue, { color: colors.textSecondary }]}>
          {value}
        </Text>
      )}
      {onPress && !danger && (
        <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.pageTitle, { color: colors.text }]}>Settings</Text>

        {/* Profile */}
        <Card style={styles.profileCard}>
          <View style={styles.profileRow}>
            <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.avatarText, { color: colors.primary }]}>
                {(user?.firstName?.[0] || 'U').toUpperCase()}
                {(user?.lastName?.[0] || '').toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.profileName, { color: colors.text }]}>
                {user?.firstName} {user?.lastName}
              </Text>
              <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>
                {user?.email}
              </Text>
              {user?.department && (
                <Text style={[styles.profileDept, { color: colors.textTertiary }]}>
                  {user.department}
                </Text>
              )}
            </View>
          </View>
        </Card>

        {/* Theme */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          APPEARANCE
        </Text>
        <Card style={styles.sectionCard}>
          <View style={styles.themeSelector}>
            {themeOptions.map((option) => (
              <TouchableOpacity
                key={option.key}
                onPress={() => setMode(option.key)}
                style={[
                  styles.themeOption,
                  {
                    backgroundColor:
                      mode === option.key ? colors.primaryLight : colors.surfaceSecondary,
                    borderColor:
                      mode === option.key ? colors.primary : 'transparent',
                    borderWidth: mode === option.key ? 1.5 : 0,
                  },
                ]}
              >
                <Ionicons
                  name={option.icon}
                  size={20}
                  color={mode === option.key ? colors.primary : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.themeLabel,
                    {
                      color: mode === option.key ? colors.primary : colors.textSecondary,
                    },
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Account */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          ACCOUNT
        </Text>
        <Card style={styles.sectionCard} padding={0}>
          {renderSettingRow('person-outline', 'Name', `${user?.firstName} ${user?.lastName}`)}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          {renderSettingRow('mail-outline', 'Email', user?.email || '')}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          {renderSettingRow('shield-outline', 'Role', user?.role?.toLowerCase())}
        </Card>

        {/* AI Assistant */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          AI ASSISTANT
        </Text>
        <Card style={styles.sectionCard} padding={0}>
          {renderSettingRow(
            'chatbubbles-outline',
            'Claude API Key',
            apiKeyStatus === 'configured' ? 'Configured' : 'Not set',
            () => setShowApiKeyModal(true)
          )}
          {apiKeyStatus === 'configured' && (
            <>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              {renderSettingRow(
                'trash-outline',
                'Remove API Key',
                undefined,
                handleRemoveApiKey,
                true
              )}
            </>
          )}
        </Card>

        {/* Calendar Connections */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          CALENDAR SYNC
        </Text>
        <Card style={styles.sectionCard} padding={0}>
          <TouchableOpacity
            style={styles.calendarRow}
            onPress={() => isGoogleConnected ? handleDisconnectCalendar('google') : handleConnectCalendar('google')}
            disabled={connectMutation.isPending || disconnectMutation.isPending}
          >
            <View style={styles.calendarLeft}>
              <View style={[styles.calendarIcon, { backgroundColor: '#4285F4' }]}>
                <Ionicons name="logo-google" size={18} color="#fff" />
              </View>
              <Text style={[styles.calendarLabel, { color: colors.text }]}>Google Calendar</Text>
            </View>
            {isGoogleConnected ? (
              <View style={styles.connectedBadge}>
                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                <Text style={[styles.connectedText, { color: colors.success }]}>Connected</Text>
              </View>
            ) : (
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            )}
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <TouchableOpacity
            style={styles.calendarRow}
            onPress={() => isMicrosoftConnected ? handleDisconnectCalendar('microsoft') : handleConnectCalendar('microsoft')}
            disabled={connectMutation.isPending || disconnectMutation.isPending}
          >
            <View style={styles.calendarLeft}>
              <View style={[styles.calendarIcon, { backgroundColor: '#00A4EF' }]}>
                <Ionicons name="logo-windows" size={18} color="#fff" />
              </View>
              <Text style={[styles.calendarLabel, { color: colors.text }]}>Microsoft Outlook</Text>
            </View>
            {isMicrosoftConnected ? (
              <View style={styles.connectedBadge}>
                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                <Text style={[styles.connectedText, { color: colors.success }]}>Connected</Text>
              </View>
            ) : (
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            )}
          </TouchableOpacity>
        </Card>

        {/* Admin Section - only visible to admins */}
        {isAdmin && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              ADMIN
            </Text>
            <Card style={styles.sectionCard} padding={0}>
              {renderSettingRow(
                'analytics-outline',
                'Analytics',
                undefined,
                () => navigation.navigate('Analytics')
              )}
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              {renderSettingRow(
                'people-outline',
                'User Management',
                undefined,
                () => navigation.navigate('Users')
              )}
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              {renderSettingRow(
                'business-outline',
                'Room Management',
                undefined,
                () => navigation.navigate('RoomsManage')
              )}
            </Card>
          </>
        )}

        {/* Super Admin Section - only visible to super admins */}
        {isSuperAdmin && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              SUPER ADMIN
            </Text>
            <Card style={styles.sectionCard} padding={0}>
              {renderSettingRow(
                'school-outline',
                'Campus Management',
                undefined,
                () => navigation.navigate('Campuses')
              )}
            </Card>
          </>
        )}

        {/* Logout */}
        <Card style={[styles.sectionCard, { marginTop: 24 }]} padding={0}>
          {renderSettingRow('log-out-outline', 'Sign Out', undefined, handleLogout, true)}
        </Card>

        <Text style={[styles.version, { color: colors.textTertiary }]}>
          Boardroom Booking v1.0.0
        </Text>
      </ScrollView>

      {/* API Key Modal */}
      <Modal
        visible={showApiKeyModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowApiKeyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Claude API Key
              </Text>
              <TouchableOpacity onPress={() => setShowApiKeyModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalDescription, { color: colors.textSecondary }]}>
              Enter your Anthropic Claude API key to enable the AI booking assistant. You can get one from{' '}
              <Text style={{ color: colors.primary }}>console.anthropic.com</Text>
            </Text>

            <TextInput
              style={[
                styles.apiKeyInput,
                {
                  backgroundColor: colors.surfaceSecondary,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder="sk-ant-..."
              placeholderTextColor={colors.textTertiary}
              value={apiKeyInput}
              onChangeText={setApiKeyInput}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.surfaceSecondary }]}
                onPress={() => setShowApiKeyModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={handleSaveApiKey}
              >
                <Text style={[styles.modalButtonText, { color: '#fff' }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 24,
  },
  profileCard: {
    marginBottom: 24,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
  },
  profileEmail: {
    fontSize: 14,
    marginTop: 2,
  },
  profileDept: {
    fontSize: 13,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionCard: {
    marginBottom: 16,
  },
  themeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  themeOption: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
  },
  themeLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingLabel: {
    fontSize: 15,
  },
  settingValue: {
    fontSize: 14,
  },
  divider: {
    height: 1,
    marginLeft: 50,
  },
  version: {
    textAlign: 'center',
    fontSize: 13,
    marginTop: 24,
    marginBottom: 40,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  apiKeyInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Calendar styles
  calendarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  calendarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  calendarIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  connectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  connectedText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
