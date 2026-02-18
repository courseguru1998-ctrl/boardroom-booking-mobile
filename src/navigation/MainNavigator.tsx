import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { DashboardScreen } from '../screens/main/DashboardScreen';
import { CalendarScreen } from '../screens/main/CalendarScreen';
import { WaitlistScreen } from '../screens/main/WaitlistScreen';
import { RoomsScreen } from '../screens/main/RoomsScreen';
import { MyBookingsScreen } from '../screens/main/MyBookingsScreen';
import { AIChatScreen } from '../screens/main/AIChatScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { AnalyticsScreen } from '../screens/admin/AnalyticsScreen';
import { UsersScreen } from '../screens/admin/UsersScreen';
import { RoomsManageScreen } from '../screens/admin/RoomsManageScreen';
import { CampusesScreen } from '../screens/super-admin/CampusesScreen';
import { CampusDetailScreen } from '../screens/super-admin/CampusDetailScreen';
import { RoomDetailScreen } from '../screens/booking/RoomDetailScreen';
import { CreateBookingScreen } from '../screens/booking/CreateBookingScreen';
import { BookingDetailScreen } from '../screens/booking/BookingDetailScreen';
import type { MainTabParamList, RoomStackParamList, BookingStackParamList, SettingsStackParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();
const RoomStack = createNativeStackNavigator<RoomStackParamList>();
const BookingStack = createNativeStackNavigator<BookingStackParamList>();
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();

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
      <BookingStack.Screen
        name="EditBooking"
        component={CreateBookingScreen}
        options={{ title: 'Edit Booking' }}
      />
    </BookingStack.Navigator>
  );
}

function SettingsStackNavigator() {
  const { colors } = useTheme();

  return (
    <SettingsStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerShadowVisible: false,
      }}
    >
      <SettingsStack.Screen
        name="SettingsMain"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
      <SettingsStack.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{ title: 'Analytics' }}
      />
      <SettingsStack.Screen
        name="Users"
        component={UsersScreen}
        options={{ title: 'User Management' }}
      />
      <SettingsStack.Screen
        name="RoomsManage"
        component={RoomsManageScreen}
        options={{ title: 'Room Management' }}
      />
      <SettingsStack.Screen
        name="Campuses"
        component={CampusesScreen}
        options={{ title: 'Campuses' }}
      />
      <SettingsStack.Screen
        name="CampusDetail"
        component={CampusDetailScreen}
        options={{ title: 'Campus Details' }}
      />
    </SettingsStack.Navigator>
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
            case 'Calendar':
              iconName = focused ? 'calendar' : 'calendar-outline';
              break;
            case 'AIAssistant':
              iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
              break;
            case 'Waitlist':
              iconName = focused ? 'time' : 'time-outline';
              break;
            case 'Rooms':
              iconName = focused ? 'business' : 'business-outline';
              break;
            case 'MyBookings':
              iconName = focused ? 'list' : 'list-outline';
              break;
            case 'Settings':
              iconName = focused ? 'person' : 'person-outline';
              break;
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen name="AIAssistant" component={AIChatScreen} options={{ title: 'AI' }} />
      <Tab.Screen name="Waitlist" component={WaitlistScreen} />
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
      <Tab.Screen
        name="Settings"
        component={SettingsStackNavigator}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
}
