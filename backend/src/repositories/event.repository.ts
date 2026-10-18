import type { Event, Prisma, PrismaClient } from "@prisma/client";
import type { CreateEventDto, UpdateEventDto } from "../dto/event.dto.js";

type DbClient = PrismaClient | Prisma.TransactionClient;

export class EventRepository {
  constructor(private readonly prisma: PrismaClient) {}

  transaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>) {
    return this.prisma.$transaction(fn);
  }

  listActiveEvents(skip: number, take: number) {
    return this.prisma.event.findMany({
      where: { isActive: true },
      orderBy: { startsAt: "asc" },
      skip,
      take,
      include: {
        seats: {
          select: {
            id: true,
            seatNumber: true,
            isBooked: true
          },
          orderBy: { seatNumber: "asc" }
        }
      }
    });
  }

  countActiveEvents() {
    return this.prisma.event.count({ where: { isActive: true } });
  }

  findById(eventId: string): Promise<Event | null> {
    return this.prisma.event.findUnique({ where: { id: eventId } });
  }

  countBookedSeats(db: DbClient, eventId: string) {
    return db.seat.count({
      where: { eventId, isBooked: true }
    });
  }

  countAllSeats(db: DbClient, eventId: string) {
    return db.seat.count({
      where: { eventId }
    });
  }

  listBookedSeatNumbers(db: DbClient, eventId: string) {
    return db.seat.findMany({
      where: { eventId, isBooked: true },
      select: { seatNumber: true },
      orderBy: { seatNumber: "asc" }
    });
  }

  createAdditionalSeats(db: DbClient, eventId: string, fromSeatNumber: number, toSeatNumber: number) {
    return db.seat.createMany({
      data: Array.from({ length: toSeatNumber - fromSeatNumber + 1 }, (_, index) => ({
        eventId,
        seatNumber: fromSeatNumber + index
      }))
    });
  }

  deleteUnusedSeatsAboveCapacity(db: DbClient, eventId: string, capacity: number) {
    return db.seat.deleteMany({
      where: {
        eventId,
        seatNumber: { gt: capacity },
        isBooked: false
      }
    });
  }

  updateEventById(db: DbClient, eventId: string, dto: UpdateEventDto): Promise<Event> {
    return db.event.update({
      where: { id: eventId },
      data: {
        title: dto.title,
        description: dto.description,
        startsAt: dto.startsAt,
        endsAt: dto.endsAt,
        capacity: dto.capacity
      }
    });
  }

  async createEvent(dto: CreateEventDto, createdById: string): Promise<Event> {
    const event = await this.prisma.event.create({
      data: {
        title: dto.title,
        description: dto.description,
        startsAt: dto.startsAt,
        endsAt: dto.endsAt,
        capacity: dto.capacity,
        createdById,
        seats: {
          create: Array.from({ length: dto.capacity }, (_, index) => ({
            seatNumber: index + 1
          }))
        }
      }
    });

    return event;
  }

  async deleteEvent(eventId: string): Promise<void> {
    await this.prisma.event.update({
      where: { id: eventId },
      data: { isActive: false }
    });
  }
}
