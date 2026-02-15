const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://boardroom-booking-tan.vercel.app/api/v1';

export const config = {
  apiUrl: API_URL,
  queryStaleTime: 1000 * 60 * 5, // 5 minutes
  amenities: [
    'projector',
    'whiteboard',
    'video-conferencing',
    'audio-system',
    'tv-screen',
    'air-conditioning',
    'wifi',
    'phone',
    'printer',
    'coffee-machine',
    'water-dispenser',
    'natural-light',
    'accessibility',
    'standing-desk',
    'recording-equipment',
  ] as const,
};
