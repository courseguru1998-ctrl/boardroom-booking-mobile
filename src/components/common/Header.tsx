import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showProfile?: boolean;
  onProfilePress?: () => void;
  rightAction?: {
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
  };
}

export function Header({ title, subtitle, showProfile = true, onProfilePress, rightAction }: HeaderProps) {
  const { colors } = useTheme();
  const { user } = useAuth();

  const handleProfilePress = () => {
    if (onProfilePress) {
      onProfilePress();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.leftContent}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
        )}
      </View>

      <View style={styles.rightContent}>
        {rightAction && (
          <TouchableOpacity
            onPress={rightAction.onPress}
            style={[styles.actionButton, { backgroundColor: colors.surfaceSecondary }]}
          >
            <Ionicons name={rightAction.icon} size={20} color={colors.text} />
          </TouchableOpacity>
        )}

        {showProfile && (
          <TouchableOpacity onPress={handleProfilePress} activeOpacity={0.7}>
            <View
              style={[
                styles.avatar,
                { backgroundColor: colors.primaryLight, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.avatarText, { color: colors.primary }]}>
                {(user?.firstName?.[0] || 'U').toUpperCase()}
                {(user?.lastName?.[0] || '').toUpperCase()}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  leftContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
