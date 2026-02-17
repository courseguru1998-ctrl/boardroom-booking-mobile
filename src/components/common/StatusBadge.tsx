import React from 'react';
import { View, Text, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

type StatusType = 'CONFIRMED' | 'CANCELLED' | 'PENDING' | 'WAITING' | 'NOTIFIED' | 'BOOKED' | 'EXPIRED' | 'ACTIVE' | 'INACTIVE';

interface StatusBadgeProps {
  status: StatusType;
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

export function StatusBadge({ status, size = 'md', showIcon = false }: StatusBadgeProps) {
  const { colors, isDark } = useTheme();

  const getStatusColor = () => {
    switch (status) {
      case 'CONFIRMED':
        return {
          bg: isDark ? colors.successBg : '#ECFDF5',
          text: colors.statusConfirmed,
          icon: 'checkmark-circle'
        };
      case 'CANCELLED':
        return {
          bg: isDark ? colors.destructiveLight : '#FEF2F2',
          text: colors.statusCancelled,
          icon: 'close-circle'
        };
      case 'PENDING':
      case 'WAITING':
        return {
          bg: isDark ? colors.warningBg : '#FFFBEB',
          text: colors.statusPending,
          icon: 'time'
        };
      case 'NOTIFIED':
        return {
          bg: isDark ? '#022c22' : '#ECFDF5',
          text: '#059669',
          icon: 'notifications'
        };
      case 'BOOKED':
        return {
          bg: isDark ? colors.successBg : '#ECFDF5',
          text: colors.statusConfirmed,
          icon: 'checkmark-done'
        };
      case 'EXPIRED':
        return {
          bg: isDark ? '#1f1f1f' : '#F3F4F6',
          text: colors.textTertiary,
          icon: 'time-outline'
        };
      case 'ACTIVE':
        return {
          bg: isDark ? colors.successBg : '#ECFDF5',
          text: colors.statusConfirmed,
          icon: 'checkmark-circle'
        };
      case 'INACTIVE':
        return {
          bg: isDark ? '#1f1f1f' : '#F3F4F6',
          text: colors.textTertiary,
          icon: 'pause-circle'
        };
      default:
        return {
          bg: isDark ? colors.muted : '#F3F4F6',
          text: colors.textSecondary,
          icon: 'ellipse'
        };
    }
  };

  const statusColor = getStatusColor();
  const isSmall = size === 'sm';

  // Get display text
  const getDisplayText = () => {
    switch (status) {
      case 'CONFIRMED': return 'Confirmed';
      case 'CANCELLED': return 'Cancelled';
      case 'PENDING': return 'Pending';
      case 'WAITING': return 'Waiting';
      case 'NOTIFIED': return 'Available';
      case 'BOOKED': return 'Booked';
      case 'EXPIRED': return 'Expired';
      case 'ACTIVE': return 'Active';
      case 'INACTIVE': return 'Inactive';
      default: return String(status).toLowerCase();
    }
  };

  return (
    <View
      style={{
        backgroundColor: statusColor.bg,
        paddingHorizontal: isSmall ? 10 : 14,
        paddingVertical: isSmall ? 4 : 6,
        // Match web app: rounded-full
        borderRadius: 9999,
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
      }}
    >
      <Text
        style={{
          color: statusColor.text,
          fontSize: isSmall ? 11 : 13,
          fontWeight: '600',
          textTransform: 'capitalize',
        }}
      >
        {getDisplayText()}
      </Text>
    </View>
  );
}
