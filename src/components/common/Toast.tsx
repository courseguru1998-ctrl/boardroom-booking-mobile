import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useToastStore, type Toast, type ToastType } from '../../hooks/useToast';
import { useTheme } from '../../hooks/useTheme';

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const { colors } = useTheme();
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [translateY, opacity]);

  const handleDismiss = () => {
    Animated.timing(translateY, {
      toValue: -100,
      duration: 200,
      useNativeDriver: true,
    }).start(() => onDismiss());
  };

  const getToastColors = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          bg: colors.successBg || '#ECFDF5',
          icon: colors.success || '#059669',
          iconName: 'checkmark-circle' as const,
        };
      case 'error':
        return {
          bg: colors.destructiveLight || '#FEE2E2',
          icon: colors.destructive || '#DC2626',
          iconName: 'close-circle' as const,
        };
      case 'warning':
        return {
          bg: colors.warningBg || '#FFFBEB',
          icon: colors.warning || '#D97706',
          iconName: 'warning' as const,
        };
      case 'info':
      default:
        return {
          bg: colors.primaryLight || '#E6EAF3',
          icon: colors.primary || '#001c54',
          iconName: 'information-circle' as const,
        };
    }
  };

  const toastColors = getToastColors(toast.type);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: toastColors.bg,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <View style={styles.content}>
        <Ionicons name={toastColors.iconName} size={24} color={toastColors.icon} />
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {toast.title}
          </Text>
          {toast.description && (
            <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
              {toast.description}
            </Text>
          )}
        </View>
      </View>
      <TouchableOpacity onPress={handleDismiss} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Ionicons name="close" size={20} color={colors.textSecondary} />
      </TouchableOpacity>
    </Animated.View>
  );
}

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <View style={styles.wrapper}>
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onDismiss={() => removeToast(toast.id)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
  },
  description: {
    fontSize: 13,
    marginTop: 2,
  },
});
