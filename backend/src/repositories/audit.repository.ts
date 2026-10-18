import type { PrismaClient } from "@prisma/client";

export class AuditRepository {
  constructor(private readonly prisma: PrismaClient) {}

  log(entry: {
    actorUserId?: string;
    action: string;
    entityType: string;
    entityId: string;
    requestId: string;
    metadataJson?: string;
  }) {
    return this.prisma.auditLog.create({
      data: {
        actorUserId: entry.actorUserId,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        requestId: entry.requestId,
        metadataJson: entry.metadataJson
      }
    });
  }
}
