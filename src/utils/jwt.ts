import jwt from "jsonwebtoken";
import type { Role } from "../../generated/prisma/enums.js";

const secret = process.env.JWT_SECRET ?? "dev-only-change-me";

export function signToken(userId: string, role: Role): string {
  return jwt.sign({ sub: userId, role }, secret, { expiresIn: "7d" });
}

export function verifyToken(token: string): { userId: string; role: Role } {
  const decoded = jwt.verify(token, secret) as jwt.JwtPayload & {
    sub: string;
    role: Role;
  };
  return { userId: decoded.sub, role: decoded.role };
}
