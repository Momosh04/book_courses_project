import { z } from "zod";

export const createBookingDto = z.object({
  eventId: z.string().uuid(),
  seatNumber: z.number().int().positive(),
  idempotencyKey: z.string().min(8).max(100).optional()
});

export const paymentSimulationDto = z.object({
  bookingId: z.string().uuid(),
  shouldSucceed: z.boolean()
});

export type CreateBookingDto = z.infer<typeof createBookingDto>;
export type PaymentSimulationDto = z.infer<typeof paymentSimulationDto>;
