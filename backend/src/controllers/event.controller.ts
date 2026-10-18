import type { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { sendOk } from "../common/http.js";
import { createEventDto, updateEventDto } from "../dto/event.dto.js";
import { EventService } from "../services/event.service.js";

const paginationQueryDto = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(10)
});

export class EventController {
  constructor(private readonly service: EventService) {}

  listEvents = async (request: FastifyRequest, reply: FastifyReply) => {
    const query = paginationQueryDto.parse(request.query);
    const pagedEvents = await this.service.listEvents(query.page, query.pageSize);

    const mapped = pagedEvents.items.map((event) => {
      const availableSeats = event.seats.filter((seat) => !seat.isBooked).length;

      return {
        id: event.id,
        title: event.title,
        description: event.description,
        startsAt: event.startsAt,
        endsAt: event.endsAt,
        capacity: event.capacity,
        availableSeats,
        seats: event.seats
      };
    });

    return sendOk(reply, {
      items: mapped,
      meta: pagedEvents.meta
    });
  };

  createEvent = async (request: FastifyRequest, reply: FastifyReply) => {
    const dto = createEventDto.parse(request.body);
    const createdById = request.user.sub;
    const event = await this.service.createEvent(dto, createdById);
    return sendOk(reply, event, 201);
  };

  updateEvent = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const dto = updateEventDto.parse(request.body);
    const event = await this.service.updateEvent(id, dto);
    return sendOk(reply, event);
  };

  deleteEvent = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    await this.service.deleteEvent(id);
    return sendOk(reply, { deleted: true });
  };
}
