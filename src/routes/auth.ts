import { Router } from "express";
import { flattenError } from "zod";
import { prisma } from "../../lib/prisma.js";
import { registerBodySchema, loginBodySchema } from "../schemas/auth.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { signToken } from "../utils/jwt.js";
import { toPublicUser } from "../utils/mappers.js";
import { Role } from "../../generated/prisma/enums.js";

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  const parsed = registerBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: flattenError(parsed.error) });
    return;
  }
  const { email, password, name } = parsed.data;
  try {
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email, passwordHash, name, role: Role.USER },
    });
    const token = signToken(user.id, user.role);
    res.status(201).json({ user: toPublicUser(user), token });
  } catch (e: any) {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: "Email déjà utilisé" });
    }
    throw e;
  }
});

authRouter.post("/login", async (req, res) => {
  const parsed = loginBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: flattenError(parsed.error) });
    return;
  }
  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    res.status(401).json({ error: "Identifiants invalides" });
    return;
  }
  const passwordOk = await verifyPassword(password, user.passwordHash);
  if (!passwordOk) {
    res.status(401).json({ error: "Identifiants invalides" });
    return;
  }
  const token = signToken(user.id, user.role);
  res.json({ user: toPublicUser(user), token });
});
