import { apiRequest } from "./http";
import type { AdminBooking, Booking, EventItem, Paginated, Session, UserBooking } from "../types";

export function register(input: { email: string; password: string; role?: "USER" | "ADMIN" }) {
  return apiRequest<Session>("/api/auth/register", "POST", input);
}

export function login(input: { email: string; password: string }) {
  return apiRequest<Session>("/api/auth/login", "POST", input);
}

export function listEvents(input?: { page?: number; pageSize?: number }) {
  const page = input?.page ?? 1;
  const pageSize = input?.pageSize ?? 10;
  return apiRequest<Paginated<EventItem>>(`/api/get/events?page=${page}&pageSize=${pageSize}`, "GET");
}

export function createBooking(input: { eventId: string; seatNumber: number; idempotencyKey?: string }) {
  return apiRequest<Booking>("/api/post/bookings", "POST", input);
}

export function simulatePayment(input: { bookingId: string; shouldSucceed: boolean }) {
  return apiRequest<Booking>("/api/post/payments/simulate", "POST", input);
}

export function listMyBookings(input?: { page?: number; pageSize?: number }) {
  const page = input?.page ?? 1;
  const pageSize = input?.pageSize ?? 10;
  return apiRequest<Paginated<UserBooking>>(`/api/get/bookings/me?page=${page}&pageSize=${pageSize}`, "GET");
}

export function createEvent(input: {
  title: string;
  description?: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
}) {
  return apiRequest<EventItem>("/api/admin/events", "POST", input);
}

export function updateEvent(eventId: string, input: {
  title?: string;
  description?: string;
  startsAt?: string;
  endsAt?: string;
  capacity?: number;
}) {
  return apiRequest<EventItem>(`/api/admin/events/${eventId}`, "PATCH", input);
}

export function deleteEvent(eventId: string) {
  return apiRequest<{ deleted: boolean }>(`/api/admin/events/${eventId}`, "DELETE");
}

export function listAdminBookings(input?: { page?: number; pageSize?: number }) {
  const page = input?.page ?? 1;
  const pageSize = input?.pageSize ?? 10;
  return apiRequest<Paginated<AdminBooking>>(`/api/admin/bookings?page=${page}&pageSize=${pageSize}`, "GET");
}
