import type { FastifyInstance } from "fastify";
import { AuthController } from "../controllers/auth.controller.js";

export function authRoutes(app: FastifyInstance, controller: AuthController) {
  app.post("/api/auth/register", controller.register);
  app.post("/api/auth/login", controller.login);
}
