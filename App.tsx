import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RootNavigator } from './src/navigation/RootNavigator';
import { ErrorBoundary } from './src/components/common';
import { ToastContainer } from './src/components/common/Toast';
import { useThemeStore } from './src/store/theme';
import { config } from './src/constants/config';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: config.queryStaleTime,
      retry: 1,
    },
  },
});

export default function App() {
  const getEffectiveTheme = useThemeStore((state) => state.getEffectiveTheme);
  const effectiveTheme = getEffectiveTheme();

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
