import { randomUUID } from "node:crypto";
import { Router } from "express";
import { flattenError } from "zod";
import { prisma } from "../../lib/prisma.js";
import {
  createEventBodySchema,
  listEventsQuerySchema,
  updateEventBodySchema,
} from "../schemas/event.js";
import { toPublicEvent, toPublicTicket } from "../utils/mappers.js";
import { requireAuth, requireRoles } from "../middleware/auth.js";
import { Role } from "../../generated/prisma/enums.js";
import { Prisma } from "../../generated/prisma/client.js";

export const eventsRouter = Router();

async function soldTicketsCount(eventId: string): Promise<number> {
  return prisma.ticket.count({
    where: {
      eventId,
      status: { in: ["VALIDE", "UTILISE"] },
    },
  });
}

async function canManageEvent(
  userId: string,
  role: (typeof Role)[keyof typeof Role],
  organizerId: string,
): Promise<boolean> {
  if (role === Role.ADMIN) {
    return true;
  }
  if (role === Role.ORGANIZER && organizerId === userId) {
    return true;
  }
  return false;
}

/** Liste publique : événements à venir + filtres (énoncé) */
eventsRouter.get("/", async (req, res) => {
  const parsed = listEventsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: flattenError(parsed.error) });
    return;
  }
  const { category, city, minPrice, maxPrice } = parsed.data;
  const now = new Date();

  let priceFilter:
    | { gte: InstanceType<typeof Prisma.Decimal>; lte: InstanceType<typeof Prisma.Decimal> }
    | { gte: InstanceType<typeof Prisma.Decimal> }
    | { lte: InstanceType<typeof Prisma.Decimal> }
    | undefined;
  if (minPrice !== undefined && maxPrice !== undefined) {
    priceFilter = {
      gte: new Prisma.Decimal(minPrice),
      lte: new Prisma.Decimal(maxPrice),
    };
  }
  if (minPrice !== undefined && maxPrice === undefined) {
    priceFilter = { gte: new Prisma.Decimal(minPrice) };
  }
  if (minPrice === undefined && maxPrice !== undefined) {
    priceFilter = { lte: new Prisma.Decimal(maxPrice) };
  }

  const where: Prisma.EventWhereInput = {
    startsAt: { gt: now },
  };
  if (category !== undefined) {
    where.category = category;
  }
  if (city !== undefined) {
    where.city = { equals: city, mode: "insensitive" };
  }
  if (priceFilter !== undefined) {
    where.price = priceFilter;
  }

  const events = await prisma.event.findMany({
    where,
    orderBy: { startsAt: "asc" },
  });
  const out = [];
  for (const e of events) {
    const sold = await soldTicketsCount(e.id);
    out.push(toPublicEvent(e, sold));
  }
  res.json({ events: out });
});

/** Achat d'un billet (utilisateur connecté) — avant GET /:id pour éviter conflit de route */
eventsRouter.post("/:id/tickets", requireAuth, async (req, res) => {
  const eventId = req.params.id as string;
  try {
    const created = await prisma.$transaction(
      async (tx) => {
        const event = await tx.event.findUnique({ where: { id: eventId } });
        if (!event) {
          throw Object.assign(new Error("NOT_FOUND"), { code: "NOT_FOUND" });
        }
        const now = new Date();
        if (event.startsAt <= now) {
          throw Object.assign(new Error("PAST"), { code: "PAST" });
        }
        const sold = await tx.ticket.count({
          where: {
            eventId,
            status: { in: ["VALIDE", "UTILISE"] },
          },
        });
        if (sold >= event.totalSeats) {
          throw Object.assign(new Error("FULL"), { code: "FULL" });
        }
        return tx.ticket.create({
          data: {
            eventId,
            userId: req.auth!.userId,
            qrPayload: randomUUID(),
            status: "VALIDE",
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    const ticket = await prisma.ticket.findUniqueOrThrow({
      where: { id: created.id },
      include: { event: true },
    });
    res.status(201).json({ ticket: toPublicTicket(ticket, ticket.event) });
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === "NOT_FOUND") {
      res.status(404).json({ error: "Événement introuvable" });
      return;
    }
    if (err.code === "PAST") {
      res.status(400).json({ error: "Les achats ne sont plus possibles pour cet événement" });
      return;
    }
    if (err.code === "FULL") {
      res.status(409).json({ error: "Événement complet" });
      return;
    }
    if (
      typeof e === "object" &&
      e !== null &&
      "code" in e &&
      (e as { code: string }).code === "P2034"
    ) {
      res.status(409).json({ error: "Réessayez : conflit de réservation" });
      return;
    }
    throw e;
  }
});

/** Détail : y compris événements passés (consultation) */
eventsRouter.get("/:id", async (req, res) => {
  const id = req.params.id as string;
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) {
    res.status(404).json({ error: "Événement introuvable" });
    return;
  }
  const sold = await soldTicketsCount(event.id);
  res.json({ event: toPublicEvent(event, sold) });
});

eventsRouter.post(
  "/",
  requireAuth,
  requireRoles(Role.ORGANIZER, Role.ADMIN),
  async (req, res) => {
    const parsed = createEventBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: flattenError(parsed.error) });
      return;
    }
    const d = parsed.data;
    const createData: Prisma.EventUncheckedCreateInput = {
      title: d.title,
      description: d.description,
      startsAt: new Date(d.startsAt),
      venue: d.venue,
      city: d.city,
      price: new Prisma.Decimal(d.price),
      totalSeats: d.totalSeats,
      category: d.category,
      organizerId: req.auth!.userId,
    };
    if (d.coverImageUrl !== undefined) {
      createData.coverImageUrl = d.coverImageUrl;
    }
    const event = await prisma.event.create({
      data: createData,
    });
    res.status(201).json({ event: toPublicEvent(event, 0) });
  },
);

eventsRouter.patch("/:id", requireAuth, async (req, res) => {
  const parsed = updateEventBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: flattenError(parsed.error) });
    return;
  }
  const eventIdPatch = req.params.id as string;
  const existing = await prisma.event.findUnique({
    where: { id: eventIdPatch },
  });
  if (!existing) {
    res.status(404).json({ error: "Événement introuvable" });
    return;
  }
  if (
    !(await canManageEvent(
      req.auth!.userId,
      req.auth!.role,
      existing.organizerId,
    ))
  ) {
    res.status(403).json({ error: "Modification non autorisée" });
    return;
  }
  const d = parsed.data;
  const data: Prisma.EventUpdateInput = {};
  if (d.title !== undefined) {
    data.title = d.title;
  }
  if (d.description !== undefined) {
    data.description = d.description;
  }
  if (d.startsAt !== undefined) {
    data.startsAt = new Date(d.startsAt);
  }
  if (d.venue !== undefined) {
    data.venue = d.venue;
  }
  if (d.city !== undefined) {
    data.city = d.city;
  }
  if (d.price !== undefined) {
    data.price = new Prisma.Decimal(d.price);
  }
  if (d.totalSeats !== undefined) {
    data.totalSeats = d.totalSeats;
  }
  if (d.category !== undefined) {
    data.category = d.category;
  }
  if (d.coverImageUrl !== undefined) {
    data.coverImageUrl = d.coverImageUrl;
  }

  if (Object.keys(data).length === 0) {
    const sold = await soldTicketsCount(existing.id);
    res.json({ event: toPublicEvent(existing, sold) });
    return;
  }

  const event = await prisma.event.update({
    where: { id: eventIdPatch },
    data,
  });
  const sold = await soldTicketsCount(event.id);
  res.json({ event: toPublicEvent(event, sold) });
});

eventsRouter.delete("/:id", requireAuth, async (req, res) => {
  const eventIdDel = req.params.id as string;
  const existing = await prisma.event.findUnique({
    where: { id: eventIdDel },
  });
  if (!existing) {
    res.status(404).json({ error: "Événement introuvable" });
    return;
  }
  if (
    !(await canManageEvent(
      req.auth!.userId,
      req.auth!.role,
      existing.organizerId,
    ))
  ) {
    res.status(403).json({ error: "Suppression non autorisée" });
    return;
  }
  const ticketCount = await prisma.ticket.count({
    where: { eventId: eventIdDel },
  });
  if (ticketCount > 0) {
    res.status(409).json({
      error: "Impossible de supprimer : des billets ont été vendus",
    });
    return;
  }
  await prisma.event.delete({ where: { id: eventIdDel } });
  res.status(204).send();
});
