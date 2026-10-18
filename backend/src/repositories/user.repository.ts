import type { PrismaClient, User, UserRole } from "@prisma/client";

export class UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  create(email: string, passwordHash: string, role: UserRole): Promise<User> {
    return this.prisma.user.create({
      data: { email, passwordHash, role }
    });
  }
}
