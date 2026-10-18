import { z } from "zod";

export const registerDto = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  role: z.enum(["USER", "ADMIN"]).optional()
});

export const loginDto = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100)
});

export type RegisterDto = z.infer<typeof registerDto>;
export type LoginDto = z.infer<typeof loginDto>;
