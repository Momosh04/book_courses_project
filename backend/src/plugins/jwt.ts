import fp from "fastify-plugin";
import fastifyJwt from "@fastify/jwt";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { env } from "../config/env.js";
import { AppError } from "../common/errors.js";

export type JwtUser = {
  sub: string;
  email: string;
  role: "USER" | "ADMIN";
};

declare module "@fastify/jwt" {
  interface FastifyJWT {
    user: JwtUser;
  }
}

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireAdmin: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

async function jwtPlugin(app: FastifyInstance) {
  app.register(fastifyJwt, {
    secret: env.JWT_SECRET
  });

  app.decorate("authenticate", async (request: FastifyRequest) => {
    await request.jwtVerify();
  });

  app.decorate("requireAdmin", async (request: FastifyRequest, reply: FastifyReply) => {
    await request.jwtVerify();
    if (request.user.role !== "ADMIN") {
      throw new AppError("Admin role required", 403, "FORBIDDEN");
    }
    void reply;
  });
}

export default fp(jwtPlugin);
