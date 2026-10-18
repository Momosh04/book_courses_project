import type { FastifyReply } from "fastify";

export function sendOk<T>(reply: FastifyReply, data: T, statusCode = 200) {
  return reply.code(statusCode).send({
    success: true,
    data
  });
}
