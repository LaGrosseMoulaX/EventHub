import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { requireAuth, requireRoles } from "../middleware/auth.js";
import { Role } from "../../generated/prisma/enums.js";
import { toPublicEvent } from "../utils/mappers.js";

export const organizerRouter = Router();

organizerRouter.use(requireAuth, requireRoles(Role.ORGANIZER, Role.ADMIN));

async function soldTicketsCount(eventId: string): Promise<number> {
  return prisma.ticket.count({
    where: {
      eventId,
      status: { in: ["VALIDE", "UTILISE"] },
    },
  });
}

/** Mes événements avec billets vendus / total places */
organizerRouter.get("/events", async (req, res) => {
  const organizerId = req.auth!.userId;
  const events = await prisma.event.findMany({
    where: { organizerId },
    orderBy: { startsAt: "asc" },
  });
  const out = [];
  for (const e of events) {
    const sold = await soldTicketsCount(e.id);
    out.push(toPublicEvent(e, sold));
  }
  res.json({ events: out });
});

/** Statistiques globales organisateur */
organizerRouter.get("/dashboard", async (req, res) => {
  const organizerId = req.auth!.userId;
  const events = await prisma.event.findMany({
    where: { organizerId },
    select: { id: true, price: true },
  });
  let totalTicketsSold = 0;
  let revenue = 0;
  for (const e of events) {
    const sold = await prisma.ticket.count({
      where: {
        eventId: e.id,
        status: { in: ["VALIDE", "UTILISE"] },
      },
    });
    totalTicketsSold += sold;
    revenue += Number(e.price) * sold;
  }
  res.json({
    totalEvents: events.length,
    totalTicketsSold,
    totalRevenue: revenue.toFixed(2),
  });
});
