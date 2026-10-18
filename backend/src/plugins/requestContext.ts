import fp from "fastify-plugin";
import type { FastifyInstance, FastifyRequest } from "fastify";

declare module "fastify" {
  interface FastifyRequest {
    correlationId: string;
  }
}

function resolveCorrelationId(request: FastifyRequest): string {
  const fromHeader = request.headers["x-correlation-id"];
  return typeof fromHeader === "string" && fromHeader.length > 0 ? fromHeader : request.id;
}

async function requestContextPlugin(app: FastifyInstance) {
  app.addHook("onRequest", async (request, reply) => {
    const correlationId = resolveCorrelationId(request);
    request.correlationId = correlationId;
    reply.header("x-correlation-id", correlationId);
  });
}

export default fp(requestContextPlugin);
