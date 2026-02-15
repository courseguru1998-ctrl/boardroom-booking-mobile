import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
  fullWidth = false,
}: ButtonProps) {
  const { colors } = useTheme();

  const getButtonStyle = (): ViewStyle => {
    const base: ViewStyle = {
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    };

    // Size
    switch (size) {
      case 'sm':
        base.paddingVertical = 8;
        base.paddingHorizontal = 16;
        break;
      case 'lg':
        base.paddingVertical = 16;
        base.paddingHorizontal = 32;
        break;
      default:
        base.paddingVertical = 12;
        base.paddingHorizontal = 24;
    }

    // Variant
    switch (variant) {
      case 'primary':
        base.backgroundColor = colors.primary;
        break;
      case 'secondary':
        base.backgroundColor = colors.surfaceSecondary;
        break;
      case 'outline':
        base.backgroundColor = 'transparent';
        base.borderWidth = 1.5;
        base.borderColor = colors.primary;
        break;
      case 'ghost':
        base.backgroundColor = 'transparent';
        break;
      case 'danger':
        base.backgroundColor = colors.error;
        break;
    }

    if (disabled || loading) {
      base.opacity = 0.6;
    }

    if (fullWidth) {
      base.width = '100%';
    }

    return base;
  };

  const getTextStyle = (): TextStyle => {
    const base: TextStyle = {
      fontWeight: '600',
    };

    switch (size) {
      case 'sm':
        base.fontSize = 14;
        break;
      case 'lg':
        base.fontSize = 18;
        break;
      default:
        base.fontSize = 16;
    }

    switch (variant) {
      case 'primary':
      case 'danger':
        base.color = '#FFFFFF';
        break;
      case 'secondary':
        base.color = colors.text;
        break;
      case 'outline':
      case 'ghost':
        base.color = colors.primary;
        break;
    }

    return base;
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[getButtonStyle(), style]}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'danger' ? '#FFFFFF' : colors.primary}
          style={{ marginRight: 8 }}
        />
      ) : null}
      <Text style={[getTextStyle(), textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
}
