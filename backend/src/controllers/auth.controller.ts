import type { FastifyReply, FastifyRequest } from "fastify";
import { sendOk } from "../common/http.js";
import { loginDto, registerDto } from "../dto/auth.dto.js";
import { AuthService } from "../services/auth.service.js";

export class AuthController {
  constructor(private readonly service: AuthService) {}

  register = async (request: FastifyRequest, reply: FastifyReply) => {
    const dto = registerDto.parse(request.body);
    const user = await this.service.register({
      email: dto.email,
      password: dto.password,
      role: dto.role ?? "USER"
    });

    const token = await reply.jwtSign({
      sub: user.id,
      email: user.email,
      role: user.role
    });

    return sendOk(reply, {
      token,
      user: { id: user.id, email: user.email, role: user.role }
    }, 201);
  };

  login = async (request: FastifyRequest, reply: FastifyReply) => {
    const dto = loginDto.parse(request.body);
    const user = await this.service.login(dto);

    const token = await reply.jwtSign({
      sub: user.id,
      email: user.email,
      role: user.role
    });

    return sendOk(reply, {
      token,
      user: { id: user.id, email: user.email, role: user.role }
    });
  };
}
