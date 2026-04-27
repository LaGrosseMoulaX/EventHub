import "dotenv/config";
import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Prisma } from "../generated/prisma/client.js";
import pg from "pg";
import bcrypt from "bcrypt";
import { Role } from "../generated/prisma/enums.js";
import {
  FIXTURE_EVENTS,
  FIXTURE_TICKETS,
  FIXTURE_USERS,
} from "./fixtures.js";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL manquant");
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const passwordHash = await bcrypt.hash("password123", 10);

function startsAtFromFixture(daysFromNow: number, hourLocal: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hourLocal, 0, 0, 0);
  return d;
}

async function main() {
  await prisma.ticket.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();

  const usersByEmail = new Map<string, { id: string; email: string }>();

  for (const u of FIXTURE_USERS) {
    const row = await prisma.user.create({
      data: {
        email: u.email,
        passwordHash,
        name: u.name,
        role: Role[u.role],
      },
    });
    usersByEmail.set(u.email, { id: row.id, email: row.email });
  }

  const organizerIds = FIXTURE_USERS.filter((u) => u.role === "ORGANIZER").map(
    (u) => usersByEmail.get(u.email)!.id,
  );
  if (organizerIds.length < 2) {
    throw new Error("Fixtures: au moins 2 organisateurs attendus");
  }

  const eventsByTitle = new Map<string, { id: string }>();

  for (const ev of FIXTURE_EVENTS) {
    const organizerId = organizerIds[ev.organizerIndex] ?? organizerIds[0];
    const row = await prisma.event.create({
      data: {
        title: ev.title,
        description: ev.description,
        startsAt: startsAtFromFixture(ev.daysFromNow, ev.hourLocal),
        venue: ev.venue,
        city: ev.city,
        price: new Prisma.Decimal(ev.price),
        totalSeats: ev.totalSeats,
        category: ev.category,
        coverImageUrl: ev.coverImageUrl ?? null,
        organizerId,
      },
    });
    eventsByTitle.set(ev.title, { id: row.id });
  }

  for (const t of FIXTURE_TICKETS) {
    const user = usersByEmail.get(t.buyerEmail);
    const event = eventsByTitle.get(t.eventTitle);
    if (!user || !event) {
      throw new Error(
        `Fixture ticket incohérent: user=${t.buyerEmail} event=${t.eventTitle}`,
      );
    }
    await prisma.ticket.create({
      data: {
        userId: user.id,
        eventId: event.id,
        status: t.status,
        qrPayload: randomUUID(),
      },
    });
  }

  console.log(
    `Seed OK — ${FIXTURE_USERS.length} utilisateurs, ${FIXTURE_EVENTS.length} événements, ${FIXTURE_TICKETS.length} billets.`,
  );
  console.log(
    "Comptes énoncé + fixtures : mot de passe partout `password123` (organisateur@, utilisateur@, admin@, + @fixture.eventhub.fr).",
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
