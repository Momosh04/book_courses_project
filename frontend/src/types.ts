export type Role = "USER" | "ADMIN";

export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type Paginated<T> = {
  items: T[];
  meta: PaginationMeta;
};

export type SessionUser = {
  id: string;
  email: string;
  role: Role;
};

export type Session = {
  token: string;
  user: SessionUser;
};

export type Seat = {
  id: string;
  seatNumber: number;
  isBooked: boolean;
};

export type EventItem = {
  id: string;
  title: string;
  description?: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  availableSeats: number;
  seats: Seat[];
};

export type Booking = {
  id: string;
  userId: string;
  eventId: string;
  seatId: string;
  status: "PENDING_PAYMENT" | "CONFIRMED" | "FAILED" | "CANCELLED";
  createdAt: string;
};

export type AdminBooking = {
  id: string;
  status: "PENDING_PAYMENT" | "CONFIRMED" | "FAILED" | "CANCELLED";
  createdAt: string;
  user: {
    id: string;
    email: string;
    role: Role;
  };
  event: {
    id: string;
    title: string;
    startsAt: string;
  };
  seat: {
    seatNumber: number;
  };
  payments: Array<{
    status: "PENDING" | "SUCCESS" | "FAILED";
    note?: string;
  }>;
};

export type UserBooking = {
  id: string;
  status: "PENDING_PAYMENT" | "CONFIRMED" | "FAILED" | "CANCELLED";
  createdAt: string;
  event: {
    id: string;
    title: string;
    startsAt: string;
  };
  seat: {
    seatNumber: number;
  };
  payments: Array<{
    status: "PENDING" | "SUCCESS" | "FAILED";
    note?: string;
  }>;
};
