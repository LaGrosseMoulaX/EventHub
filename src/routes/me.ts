import { Router } from "express";
import { flattenError } from "zod";
import { prisma } from "../../lib/prisma.js";
import { patchProfileBodySchema } from "../schemas/auth.js";
import { toPublicUser, toPublicTicket } from "../utils/mappers.js";
import { requireAuth } from "../middleware/auth.js";

export const meRouter = Router();
meRouter.use(requireAuth);

meRouter.get("/", async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.auth!.userId },
  });
  if (!user) {
    res.status(404).json({ error: "Utilisateur introuvable" });
    return;
  }
  res.json({ user: toPublicUser(user) });
});

meRouter.patch("/", async (req, res) => {
  const parsed = patchProfileBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: flattenError(parsed.error) });
    return;
  }
  const user = await prisma.user.update({
    where: { id: req.auth!.userId },
    data: { name: parsed.data.name },
  });
  res.json({ user: toPublicUser(user) });
});

/** Historique de tous les billets (énoncé) */
meRouter.get("/tickets", async (req, res) => {
  const tickets = await prisma.ticket.findMany({
    where: { userId: req.auth!.userId },
    include: { event: true },
    orderBy: { createdAt: "desc" },
  });
  res.json({
    tickets: tickets.map((t) => toPublicTicket(t, t.event)),
  });
});
