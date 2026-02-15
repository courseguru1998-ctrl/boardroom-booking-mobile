import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../../components/common';

type ThemeMode = 'light' | 'dark' | 'system';

export function SettingsScreen() {
  const { colors, mode, setMode, isDark } = useTheme();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
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

        {/* Logout */}
        <Card style={[styles.sectionCard, { marginTop: 24 }]} padding={0}>
          {renderSettingRow('log-out-outline', 'Sign Out', undefined, handleLogout, true)}
        </Card>

        <Text style={[styles.version, { color: colors.textTertiary }]}>
          Boardroom Booking v1.0.0
        </Text>
      </ScrollView>
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
});
