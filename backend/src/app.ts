import Fastify from "fastify";
import cors from "@fastify/cors";
import { ZodError } from "zod";
import prismaPlugin from "./plugins/prisma.js";
import jwtPlugin from "./plugins/jwt.js";
import requestContextPlugin from "./plugins/requestContext.js";
import { isAppError } from "./common/errors.js";
import { UserRepository } from "./repositories/user.repository.js";
import { AuthService } from "./services/auth.service.js";
import { AuthController } from "./controllers/auth.controller.js";
import { authRoutes } from "./routes/auth.routes.js";
import { EventRepository } from "./repositories/event.repository.js";
import { EventService } from "./services/event.service.js";
import { EventController } from "./controllers/event.controller.js";
import { eventRoutes } from "./routes/event.routes.js";
import { BookingRepository } from "./repositories/booking.repository.js";
import { AuditRepository } from "./repositories/audit.repository.js";
import { BookingService } from "./services/booking.service.js";
import { BookingController } from "./controllers/booking.controller.js";
import { bookingRoutes } from "./routes/booking.routes.js";

export async function createApp() {
  const app = Fastify({
    logger: {
      level: "info",
      transport:
        process.env.NODE_ENV !== "production"
          ? {
              target: "pino-pretty",
              options: { colorize: true }
            }
          : undefined
    }
  });

  await app.register(cors, { origin: true }); 
  await app.register(requestContextPlugin);
  await app.register(prismaPlugin);
  await app.register(jwtPlugin);

  app.addHook("onRequest", async (request) => {
    request.log = request.log.child({ correlationId: request.correlationId });
  });

  const userRepo = new UserRepository(app.prisma);
  const eventRepo = new EventRepository(app.prisma);
  const bookingRepo = new BookingRepository(app.prisma);
  const auditRepo = new AuditRepository(app.prisma);

  const authController = new AuthController(new AuthService(userRepo));
  const eventController = new EventController(new EventService(eventRepo));
  const bookingController = new BookingController(new BookingService(bookingRepo, auditRepo));

  authRoutes(app, authController);
  eventRoutes(app, eventController);
  bookingRoutes(app, bookingController);

  app.get("/health", async () => ({ ok: true }));

  app.setErrorHandler((error, request, reply) => {
    if (isAppError(error)) {
      request.log.warn({ code: error.code, message: error.message }, "Application error");
      return reply.code(error.statusCode).send({
        success: false,
        code: error.code,
        message: error.message,
        correlationId: request.correlationId
      });
    }

    if (error instanceof ZodError) {
      request.log.warn({ issues: error.issues }, "Validation error");
      return reply.code(400).send({
        success: false,
        code: "VALIDATION_ERROR",
        message: "Invalid input payload",
        correlationId: request.correlationId
      });
    }

    request.log.error(error, "Unhandled error");
    return reply.code(500).send({
      success: false,
      code: "INTERNAL_SERVER_ERROR",
      message: "Something went wrong",
      correlationId: request.correlationId
    });
  });

  return app;
}
