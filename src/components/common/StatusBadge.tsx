import React from 'react';
import { View, Text, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface StatusBadgeProps {
  status: 'CONFIRMED' | 'CANCELLED' | 'PENDING';
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const { colors } = useTheme();

  const getStatusColor = () => {
    switch (status) {
      case 'CONFIRMED':
        return { bg: colors.successLight, text: colors.statusConfirmed };
      case 'CANCELLED':
        return { bg: colors.errorLight, text: colors.statusCancelled };
      case 'PENDING':
        return { bg: colors.warningLight, text: colors.statusPending };
    }
  };

  const statusColor = getStatusColor();
  const isSmall = size === 'sm';

  return (
    <View
      style={{
        backgroundColor: statusColor.bg,
        paddingHorizontal: isSmall ? 8 : 12,
        paddingVertical: isSmall ? 2 : 4,
        borderRadius: 20,
        alignSelf: 'flex-start',
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
        {status.toLowerCase()}
      </Text>
    </View>
  );
}
