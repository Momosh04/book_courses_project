import bcrypt from "bcryptjs";
import type { UserRole } from "@prisma/client";
import { AppError } from "../common/errors.js";
import { UserRepository } from "../repositories/user.repository.js";

export class AuthService {
  constructor(private readonly users: UserRepository) {}

  async register(input: { email: string; password: string; role: UserRole }) {
    const existing = await this.users.findByEmail(input.email);
    if (existing) {
      throw new AppError("Email already exists", 409, "EMAIL_EXISTS");
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await this.users.create(input.email, passwordHash, input.role);

    return user;
  }

  async login(input: { email: string; password: string }) {
    const user = await this.users.findByEmail(input.email);
    if (!user) {
      throw new AppError("Invalid email or password", 401, "AUTH_FAILED");
    }

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) {
      throw new AppError("Invalid email or password", 401, "AUTH_FAILED");
    }

    return user;
  }
}
