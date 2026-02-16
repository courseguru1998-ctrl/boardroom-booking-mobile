import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';

// Auth stack
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

// Room stack (nested inside Rooms tab)
export type RoomStackParamList = {
  RoomList: undefined;
  RoomDetail: { roomId: string };
  CreateBooking: { roomId: string; roomName: string };
};

// Booking stack (nested inside My Bookings tab)
export type BookingStackParamList = {
  BookingList: undefined;
  BookingDetail: { bookingId: string };
};

// Settings stack (nested inside Settings tab)
export type SettingsStackParamList = {
  SettingsMain: undefined;
  Analytics: undefined;
  Users: undefined;
  RoomsManage: undefined;
  // Super Admin screens
  Campuses: undefined;
  CampusDetail: { campusId: string };
};

// Main tab navigator
export type MainTabParamList = {
  Dashboard: undefined;
  Calendar: undefined;
  Waitlist: undefined;
  Rooms: NavigatorScreenParams<RoomStackParamList>;
  MyBookings: NavigatorScreenParams<BookingStackParamList>;
  Settings: NavigatorScreenParams<SettingsStackParamList>;
};

// Root navigator
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};

// Screen props helpers
export type AuthScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;

export type MainTabScreenProps<T extends keyof MainTabParamList> =
  BottomTabScreenProps<MainTabParamList, T>;

export type RoomScreenProps<T extends keyof RoomStackParamList> =
  NativeStackScreenProps<RoomStackParamList, T>;

export type BookingScreenProps<T extends keyof BookingStackParamList> =
  NativeStackScreenProps<BookingStackParamList, T>;

export type SettingsScreenProps<T extends keyof SettingsStackParamList> =
  NativeStackScreenProps<SettingsStackParamList, T>;
