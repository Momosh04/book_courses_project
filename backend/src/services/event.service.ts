import { AppError } from "../common/errors.js";
import type { CreateEventDto, UpdateEventDto } from "../dto/event.dto.js";
import { EventRepository } from "../repositories/event.repository.js";

export class EventService {
  constructor(private readonly events: EventRepository) {}

  async listEvents(page: number, pageSize: number) {
    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      this.events.listActiveEvents(skip, pageSize),
      this.events.countActiveEvents()
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

  async createEvent(dto: CreateEventDto, createdById: string) {
    if (dto.endsAt <= dto.startsAt) {
      throw new AppError("Event end time must be after start time", 400, "INVALID_EVENT_TIME");
    }

    return this.events.createEvent(dto, createdById);
  }

  async updateEvent(eventId: string, dto: UpdateEventDto) {
    const event = await this.events.findById(eventId);
    if (!event || !event.isActive) {
      throw new AppError("Event not found", 404, "EVENT_NOT_FOUND");
    }

    if (dto.endsAt && dto.startsAt && dto.endsAt <= dto.startsAt) {
      throw new AppError("Event end time must be after start time", 400, "INVALID_EVENT_TIME");
    }

    return this.events.transaction(async (tx) => {
      if (dto.capacity !== undefined) {
        const currentCapacity = event.capacity;
        const bookedCount = await this.events.countBookedSeats(tx, eventId);
        const bookedSeatNumbers = await this.events.listBookedSeatNumbers(tx, eventId);
        const maxBookedSeatNumber = bookedSeatNumbers.length
          ? Math.max(...bookedSeatNumbers.map((seat) => seat.seatNumber))
          : 0;

        if (dto.capacity < bookedCount || dto.capacity < maxBookedSeatNumber) {
          throw new AppError(
            `Capacity cannot be lower than existing booked seats (${bookedCount}).`,
            409,
            "CAPACITY_TOO_LOW"
          );
        }

        if (dto.capacity > currentCapacity) {
          await this.events.createAdditionalSeats(tx, eventId, currentCapacity + 1, dto.capacity);
        }

        if (dto.capacity < currentCapacity) {
          await this.events.deleteUnusedSeatsAboveCapacity(tx, eventId, dto.capacity);
        }
      }

      return this.events.updateEventById(tx, eventId, dto);
    });
  }

  async deleteEvent(eventId: string) {
    const event = await this.events.findById(eventId);
    if (!event || !event.isActive) {
      throw new AppError("Event not found", 404, "EVENT_NOT_FOUND");
    }

    await this.events.deleteEvent(eventId);
  }
}
