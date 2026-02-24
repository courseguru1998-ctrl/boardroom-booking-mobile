import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import { RootNavigator } from './src/navigation/RootNavigator';
import { ErrorBoundary } from './src/components/common';
import { ToastContainer } from './src/components/common/Toast';
import { useThemeStore } from './src/store/theme';
import { config } from './src/constants/config';
import { notificationService } from './src/services/notifications';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: config.queryStaleTime,
      retry: 1,
    },
  },
});

// Keep splash screen visible while app loads
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const getEffectiveTheme = useThemeStore((state) => state.getEffectiveTheme);
  const effectiveTheme = getEffectiveTheme();

  useEffect(() => {
    // Initialize notifications
    const initNotifications = async () => {
      await notificationService.initialize();
    };
    initNotifications();

    // Hide splash screen after app is ready
    const prepare = async () => {
      try {
        // Pre-load fonts, make API calls, etc.
        await new Promise(resolve => setTimeout(resolve, 500)); // Small delay for splash
      } catch (e) {
        console.warn(e);
      } finally {
        setIsReady(true);
        SplashScreen.hideAsync();
      }
    };

    prepare();
  }, []);

  if (!isReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <RootNavigator />
            <ToastContainer />
            <StatusBar style={effectiveTheme === 'dark' ? 'light' : 'dark'} />
          </QueryClientProvider>
        </SafeAreaProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
