import React from 'react';
import { View, TouchableOpacity, ViewStyle, StyleProp, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  /** Padding matching web app - default is xl (1rem = 16px) */
  padding?: number;
  /** Add a subtle border like web app cards */
  bordered?: boolean;
  /** Variant for different card styles */
  variant?: 'default' | 'elevated' | 'outlined' | 'gradient';
}

export function Card({
  children,
  onPress,
  style,
  padding = 16,
  bordered = false,
  variant = 'default',
}: CardProps) {
  const { colors, isDark } = useTheme();

  const getCardStyle = (): ViewStyle => {
    const base: ViewStyle = {
      backgroundColor: colors.card,
      // Match web app: rounded-2xl (1rem = 16px)
      borderRadius: 16,
      padding,
    };

    switch (variant) {
      case 'elevated':
        // Elevated shadow - like web app's shadow-soft
        base.shadowColor = colors.shadowColor;
        base.shadowOffset = { width: 0, height: 1 };
        base.shadowOpacity = 1;
        base.shadowRadius = 4;
        base.elevation = 2;
        base.borderWidth = bordered ? 1 : 0;
        base.borderColor = colors.border;
        break;
      case 'outlined':
        base.borderWidth = 1;
        base.borderColor = colors.border;
        break;
      case 'gradient':
        // For gradient cards - will be handled by parent
        base.borderWidth = bordered ? 1 : 0;
        base.borderColor = colors.border;
        break;
      default:
        // Default card - subtle border like web app
        if (bordered || isDark) {
          base.borderWidth = 1;
          base.borderColor = colors.border;
        }
    }

    return base;
  };

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.75}
        style={[getCardStyle(), style]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[getCardStyle(), style]}>{children}</View>;
}
