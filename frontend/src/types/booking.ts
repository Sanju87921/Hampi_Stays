export interface Booking {
  id: string;
  resortId: string;
  userId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalPrice: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'CHECKED_IN' | 'PAID';
  referenceNumber: string;
  createdAt: string;
  resort?: {
    name: string;
    locationArea: string;
    slug: string;
    images: string[];
    type?: string;
    locationLat?: number;
    locationLng?: number;
  };
  room?: {
    id: string;
    name: string;
  };
  specialRequests?: string;
}

export interface Message {
  id: string;
  text: string;
  senderId: string;
  bookingId: string;
  createdAt: string;
}
