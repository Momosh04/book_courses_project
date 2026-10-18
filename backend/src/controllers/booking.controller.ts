import type { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { sendOk } from "../common/http.js";
import { createBookingDto, paymentSimulationDto } from "../dto/booking.dto.js";
import { BookingService } from "../services/booking.service.js";

const paginationQueryDto = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(10)
});

export class BookingController {
  constructor(private readonly service: BookingService) {}

  createBooking = async (request: FastifyRequest, reply: FastifyReply) => {
    const dto = createBookingDto.parse(request.body);
    const booking = await this.service.createBooking(request.user.sub, dto, request.correlationId);
    return sendOk(reply, booking, 201);
  };

  simulatePayment = async (request: FastifyRequest, reply: FastifyReply) => {
    const dto = paymentSimulationDto.parse(request.body);
    const booking = await this.service.simulatePayment(request.user.sub, dto, request.correlationId);
    return sendOk(reply, booking);
  };

  listMyBookings = async (request: FastifyRequest, reply: FastifyReply) => {
    const query = paginationQueryDto.parse(request.query);
    const bookings = await this.service.listMyBookings(request.user.sub, query.page, query.pageSize);
    return sendOk(reply, bookings);
  };

  listAllBookings = async (request: FastifyRequest, reply: FastifyReply) => {
    const query = paginationQueryDto.parse(request.query);
    const bookings = await this.service.listAllBookings(query.page, query.pageSize);
    return sendOk(reply, bookings);
  };
}
