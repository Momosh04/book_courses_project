import type { FastifyInstance } from "fastify";
import { EventController } from "../controllers/event.controller.js";

export function eventRoutes(app: FastifyInstance, controller: EventController) {
  app.get("/api/get/events", controller.listEvents);

  app.post("/api/admin/events", { preHandler: [app.requireAdmin] }, controller.createEvent);
  app.patch("/api/admin/events/:id", { preHandler: [app.requireAdmin] }, controller.updateEvent);
  app.delete("/api/admin/events/:id", { preHandler: [app.requireAdmin] }, controller.deleteEvent);
}
