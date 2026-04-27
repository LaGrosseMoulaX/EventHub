import type { RequestHandler } from "express";
import { verifyToken } from "../utils/jwt.js";
import type { Role } from "../../generated/prisma/enums.js";

function parseBearer(header: string | undefined): string | null {
  if (!header?.startsWith("Bearer ")) {
    return null;
  }
  return header.slice(7).trim() || null;
}

export const optionalAuth: RequestHandler = (req, _res, next) => {
  const token = parseBearer(req.headers.authorization);
  if (!token) {
    next();
    return;
  }
  try {
    req.auth = verifyToken(token);
  } catch {
    delete req.auth;
  }
  next();
};

export const requireAuth: RequestHandler = (req, res, next) => {
  const token = parseBearer(req.headers.authorization);
  if (!token) {
    res.status(401).json({ error: "Authentification requise" });
    return;
  }
  try {
    req.auth = verifyToken(token);
    next();
  } catch {
    res.status(401).json({ error: "Token invalide ou expiré" });
    return;
  }
};

export function requireRoles(...roles: Role[]): RequestHandler {
  return (req, res, next) => {
    if (!req.auth) {
      res.status(401).json({ error: "Authentification requise" });
      return;
    }
    if (!roles.includes(req.auth.role)) {
      res.status(403).json({ error: "Droits insuffisants" });
      return;
    }
    next();
  };
}
