import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { DashboardScreen } from '../screens/main/DashboardScreen';
import { RoomsScreen } from '../screens/main/RoomsScreen';
import { MyBookingsScreen } from '../screens/main/MyBookingsScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { RoomDetailScreen } from '../screens/booking/RoomDetailScreen';
import { CreateBookingScreen } from '../screens/booking/CreateBookingScreen';
import { BookingDetailScreen } from '../screens/booking/BookingDetailScreen';
import type { MainTabParamList, RoomStackParamList, BookingStackParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();
const RoomStack = createNativeStackNavigator<RoomStackParamList>();
const BookingStack = createNativeStackNavigator<BookingStackParamList>();

function RoomStackNavigator() {
  const { colors } = useTheme();

  return (
    <RoomStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerShadowVisible: false,
      }}
    >
      <RoomStack.Screen
        name="RoomList"
        component={RoomsScreen}
        options={{ title: 'Rooms' }}
      />
      <RoomStack.Screen
        name="RoomDetail"
        component={RoomDetailScreen}
        options={{ title: 'Room Details' }}
      />
      <RoomStack.Screen
        name="CreateBooking"
        component={CreateBookingScreen}
        options={{ title: 'Book Room' }}
      />
    </RoomStack.Navigator>
  );
}

function BookingStackNavigator() {
  const { colors } = useTheme();

  return (
    <BookingStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerShadowVisible: false,
      }}
    >
      <BookingStack.Screen
        name="BookingList"
        component={MyBookingsScreen}
        options={{ title: 'My Bookings' }}
      />
      <BookingStack.Screen
        name="BookingDetail"
        component={BookingDetailScreen}
        options={{ title: 'Booking Details' }}
      />
    </BookingStack.Navigator>
  );
}

export function MainNavigator() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 88,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabBarInactive,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          switch (route.name) {
            case 'Dashboard':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Rooms':
              iconName = focused ? 'business' : 'business-outline';
              break;
            case 'MyBookings':
              iconName = focused ? 'calendar' : 'calendar-outline';
              break;
            case 'Settings':
              iconName = focused ? 'settings' : 'settings-outline';
              break;
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen
        name="Rooms"
        component={RoomStackNavigator}
        options={{ title: 'Rooms' }}
      />
      <Tab.Screen
        name="MyBookings"
        component={BookingStackNavigator}
        options={{ title: 'Bookings' }}
      />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
