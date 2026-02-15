export type UserRole = 'USER' | 'CAMPUS_ADMIN' | 'SUPER_ADMIN' | 'ADMIN';

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Campus {
  id: string;
  name: string;
  code: string;
  address: string | null;
  city: string;
  pincode: string | null;
  phone: string | null;
  email: string | null;
  schools: string[];
  logoUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    users: number;
    rooms: number;
  };
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  department: string | null;
  campusId: string | null;
  campus?: {
    id: string;
    name: string;
    code: string;
  } | null;
  isActive: boolean;
  approvalStatus?: ApprovalStatus;
  createdAt?: string;
}

export interface Room {
  id: string;
  name: string;
  capacity: number;
  floor: string | null;
  building: string | null;
  amenities: string[];
  campusId: string;
  campus?: {
    id: string;
    name: string;
    code: string;
  };
  isActive: boolean;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  id: string;
  userId: string;
  roomId: string;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  status: 'CONFIRMED' | 'CANCELLED' | 'PENDING';
  recurrenceRule: string | null;
  room: {
    id: string;
    name: string;
    capacity: number;
    floor?: string | null;
    building?: string | null;
  };
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
  };
  attendees: Attendee[];
  createdAt: string;
  updatedAt: string;
}

export interface Attendee {
  id: string;
  email: string;
  name: string | null;
}

export interface CalendarConnection {
  provider: 'GOOGLE' | 'MICROSOFT';
  createdAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  pagination?: Pagination;
  errors?: Record<string, string[]>;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

export interface CampusStats {
  totalUsers: number;
  totalRooms: number;
  activeRooms: number;
  totalBookings: number;
}
