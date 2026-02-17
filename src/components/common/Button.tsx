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
  /** Button variants matching web app */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
  /** Add icon support */
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
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
  icon,
  iconPosition = 'left',
}: ButtonProps) {
  const { colors } = useTheme();

  const getButtonStyle = (): ViewStyle => {
    const base: ViewStyle = {
      // Match web app: rounded-xl (0.875rem = 14px)
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    };

    // Size - match web app sizing
    switch (size) {
      case 'sm':
        base.paddingVertical = 10;
        base.paddingHorizontal = 16;
        break;
      case 'lg':
        base.paddingVertical = 16;
        base.paddingHorizontal = 28;
        break;
      default:
        base.paddingVertical = 14;
        base.paddingHorizontal = 24;
    }

    // Variant - match web app exactly
    switch (variant) {
      case 'primary':
        base.backgroundColor = colors.primary;
        break;
      case 'secondary':
        base.backgroundColor = colors.secondary;
        base.borderWidth = 1;
        base.borderColor = colors.border;
        break;
      case 'outline':
        base.backgroundColor = 'transparent';
        base.borderWidth = 2;
        base.borderColor = colors.primary;
        break;
      case 'ghost':
        base.backgroundColor = 'transparent';
        break;
      case 'destructive':
        base.backgroundColor = colors.destructive;
        break;
      case 'accent':
        // Gold accent - like web app
        base.backgroundColor = colors.accent;
        break;
    }

    if (disabled || loading) {
      base.opacity = 0.5;
    }

    if (fullWidth) {
      base.width = '100%';
    }

    return base;
  };

  const getTextStyle = (): TextStyle => {
    const base: TextStyle = {
      // Match web app: font-semibold
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
      case 'destructive':
      case 'accent':
        base.color = variant === 'accent' ? colors.accentForeground : '#FFFFFF';
        break;
      case 'secondary':
        base.color = colors.secondaryForeground;
        break;
      case 'outline':
      case 'ghost':
        base.color = colors.primary;
        break;
    }

    return base;
  };

  const getLoaderColor = () => {
    if (variant === 'primary' || variant === 'destructive' || variant === 'accent') {
      return '#FFFFFF';
    }
    return colors.primary;
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[getButtonStyle(), style]}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={getLoaderColor()}
          style={{ marginRight: 8 }}
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Text style={{ marginRight: 8 }}>{icon}</Text>
          )}
          <Text style={[getTextStyle(), textStyle]}>{title}</Text>
          {icon && iconPosition === 'right' && (
            <Text style={{ marginLeft: 8 }}>{icon}</Text>
          )}
        </>
      )}
    </TouchableOpacity>
  );
}
