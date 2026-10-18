import type { FastifyInstance } from "fastify";
import { BookingController } from "../controllers/booking.controller.js";

export function bookingRoutes(app: FastifyInstance, controller: BookingController) {
  app.post("/api/post/bookings", { preHandler: [app.authenticate] }, controller.createBooking);
  app.post("/api/post/payments/simulate", { preHandler: [app.authenticate] }, controller.simulatePayment);
  app.get("/api/get/bookings/me", { preHandler: [app.authenticate] }, controller.listMyBookings);
  app.get("/api/admin/bookings", { preHandler: [app.requireAdmin] }, controller.listAllBookings);
}
