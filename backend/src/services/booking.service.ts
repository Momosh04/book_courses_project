import { AppError } from "../common/errors.js";
import { env } from "../config/env.js";
import type { CreateBookingDto, PaymentSimulationDto } from "../dto/booking.dto.js";
import { AuditRepository } from "../repositories/audit.repository.js";
import { BookingRepository } from "../repositories/booking.repository.js";

export class BookingService {
  constructor(
    private readonly bookings: BookingRepository,
    private readonly audits: AuditRepository
  ) {}

  private async expireStalePendingBookings() {
    const cutoff = new Date(Date.now() - env.PENDING_BOOKING_TTL_MINUTES * 60 * 1000);
    const stalePending = await this.bookings.listExpiredPendingBookings(cutoff);

    for (const candidate of stalePending) {
      await this.bookings.transaction(async (tx) => {
        const locked = await this.bookings.lockBookingRow(tx, candidate.id);
        if (!locked) {
          return;
        }

        if (locked.status !== "PENDING_PAYMENT") {
          return;
        }

        if (locked.createdAt > cutoff) {
          return;
        }

        await this.bookings.markPayment(tx, candidate.id, "FAILED", "Pending payment timeout exceeded");
        await this.bookings.updateBookingStatus(tx, candidate.id, "FAILED");
        await this.bookings.releaseSeat(tx, locked.seatId);
      });
    }
  }

  async createBooking(userId: string, dto: CreateBookingDto, requestId: string) {
    await this.expireStalePendingBookings();

    if (dto.idempotencyKey) {
      const existing = await this.bookings.findByIdempotencyKey(dto.idempotencyKey);
      if (existing) {
        return existing;
      }
    }

    const booking = await this.bookings.transaction(async (tx) => {
      const seat = await this.bookings.lockSeatRow(tx, dto.eventId, dto.seatNumber);
      if (!seat) {
        throw new AppError("Seat not found", 404, "SEAT_NOT_FOUND");
      }

      if (seat.isBooked) {
        throw new AppError("Seat is already booked", 409, "SEAT_ALREADY_BOOKED");
      }

      await this.bookings.markSeatBooked(tx, seat.id);

      const created = await this.bookings.createPendingBooking(tx, {
        userId,
        eventId: dto.eventId,
        seatId: seat.id,
        idempotencyKey: dto.idempotencyKey
      });

      return created;
    });

    await this.audits.log({
      actorUserId: userId,
      action: "BOOKING_CREATED",
      entityType: "Booking",
      entityId: booking.id,
      requestId,
      metadataJson: JSON.stringify({ eventId: booking.eventId, seatId: booking.seatId })
    });

    return booking;
  }

  async simulatePayment(userId: string, dto: PaymentSimulationDto, requestId: string) {
    await this.expireStalePendingBookings();

    const current = await this.bookings.findById(dto.bookingId);
    if (!current) {
      throw new AppError("Booking not found", 404, "BOOKING_NOT_FOUND");
    }

    if (current.userId !== userId) {
      throw new AppError("You cannot pay for another user's booking", 403, "FORBIDDEN");
    }

    if (current.status !== "PENDING_PAYMENT") {
      throw new AppError("Booking is not awaiting payment", 409, "INVALID_BOOKING_STATE");
    }

    await this.bookings.transaction(async (tx) => {
      if (dto.shouldSucceed) {
        await this.bookings.markPayment(tx, dto.bookingId, "SUCCESS", "Virtual payment approved");
        await this.bookings.updateBookingStatus(tx, dto.bookingId, "CONFIRMED");
      } else {
        await this.bookings.markPayment(tx, dto.bookingId, "FAILED", "Virtual payment failed");
        await this.bookings.updateBookingStatus(tx, dto.bookingId, "FAILED");
        await this.bookings.releaseSeat(tx, current.seatId);
      }
    });

    await this.audits.log({
      actorUserId: userId,
      action: dto.shouldSucceed ? "PAYMENT_SUCCESS" : "PAYMENT_FAILED",
      entityType: "Booking",
      entityId: dto.bookingId,
      requestId
    });

    return this.bookings.findById(dto.bookingId);
  }

  async listAllBookings(page: number, pageSize: number) {
    await this.expireStalePendingBookings();
    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      this.bookings.listAll(skip, pageSize),
      this.bookings.countAll()
    ]);

    return {
      items,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize))
      }
    };
  }

  async listMyBookings(userId: string, page: number, pageSize: number) {
    await this.expireStalePendingBookings();
    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      this.bookings.listByUser(userId, skip, pageSize),
      this.bookings.countByUser(userId)
    ]);

    return {
      items,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize))
      }
    };
  }
}
