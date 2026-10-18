import type { Booking, PaymentStatus, Prisma, PrismaClient } from "@prisma/client";

type TransactionClient = Prisma.TransactionClient;

export class BookingRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findById(bookingId: string) {
    return this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        seat: true,
        event: true,
        payments: {
          orderBy: { createdAt: "desc" },
          take: 1
        }
      }
    });
  }

  listAll(skip: number, take: number) {
    return this.prisma.booking.findMany({
      include: {
        user: {
          select: { id: true, email: true, role: true }
        },
        event: {
          select: { id: true, title: true, startsAt: true }
        },
        seat: {
          select: { seatNumber: true }
        },
        payments: {
          orderBy: { createdAt: "desc" },
          take: 1
        }
      },
      skip,
      take,
      orderBy: { createdAt: "desc" }
    });
  }

  countAll() {
    return this.prisma.booking.count();
  }

  listByUser(userId: string, skip: number, take: number) {
    return this.prisma.booking.findMany({
      where: { userId },
      include: {
        event: {
          select: { id: true, title: true, startsAt: true }
        },
        seat: {
          select: { seatNumber: true }
        },
        payments: {
          orderBy: { createdAt: "desc" },
          take: 1
        }
      },
      skip,
      take,
      orderBy: { createdAt: "desc" }
    });
  }

  countByUser(userId: string) {
    return this.prisma.booking.count({ where: { userId } });
  }

  listExpiredPendingBookings(cutoff: Date) {
    return this.prisma.booking.findMany({
      where: {
        status: "PENDING_PAYMENT",
        createdAt: { lte: cutoff }
      },
      select: {
        id: true,
        seatId: true,
        userId: true,
        createdAt: true
      },
      orderBy: { createdAt: "asc" },
      take: 200
    });
  }

  findByIdempotencyKey(idempotencyKey: string) {
    return this.prisma.booking.findUnique({
      where: { idempotencyKey }
    });
  }

  transaction<T>(fn: (tx: TransactionClient) => Promise<T>) {
    return this.prisma.$transaction(fn);
  }

  async lockSeatRow(tx: TransactionClient, eventId: string, seatNumber: number) {
    const rows = await tx.$queryRaw<Array<{ id: string; isBooked: boolean }>>`
      SELECT id, "isBooked"
      FROM "Seat"
      WHERE "eventId" = ${eventId} AND "seatNumber" = ${seatNumber}
      FOR UPDATE
    `;

    return rows[0] ?? null;
  }

  async lockBookingRow(tx: TransactionClient, bookingId: string) {
    const rows = await tx.$queryRaw<Array<{
      id: string;
      seatId: string;
      status: "PENDING_PAYMENT" | "CONFIRMED" | "FAILED" | "CANCELLED";
      createdAt: Date;
    }>>`
      SELECT id, "seatId", status, "createdAt"
      FROM "Booking"
      WHERE id = ${bookingId}
      FOR UPDATE
    `;

    return rows[0] ?? null;
  }

  createPendingBooking(tx: TransactionClient, input: {
    userId: string;
    eventId: string;
    seatId: string;
    idempotencyKey?: string;
  }): Promise<Booking> {
    return tx.booking.create({
      data: {
        userId: input.userId,
        eventId: input.eventId,
        seatId: input.seatId,
        idempotencyKey: input.idempotencyKey,
        status: "PENDING_PAYMENT",
        payments: {
          create: {
            amountCents: 1000,
            status: "PENDING",
            note: "Virtual payment created"
          }
        }
      }
    });
  }

  markSeatBooked(tx: TransactionClient, seatId: string) {
    return tx.seat.update({
      where: { id: seatId },
      data: {
        isBooked: true,
        version: { increment: 1 }
      }
    });
  }

  markPayment(tx: TransactionClient, bookingId: string, status: PaymentStatus, note?: string) {
    return tx.paymentAttempt.create({
      data: {
        bookingId,
        amountCents: 1000,
        status,
        note
      }
    });
  }

  updateBookingStatus(tx: TransactionClient, bookingId: string, status: "CONFIRMED" | "FAILED" | "CANCELLED") {
    return tx.booking.update({
      where: { id: bookingId },
      data: { status }
    });
  }

  releaseSeat(tx: TransactionClient, seatId: string) {
    return tx.seat.update({
      where: { id: seatId },
      data: {
        isBooked: false,
        version: { increment: 1 }
      }
    });
  }
}
