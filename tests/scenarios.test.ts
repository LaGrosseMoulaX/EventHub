import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { prisma } from "../lib/prisma.js";
import { Role } from "../generated/prisma/enums.js";
import { Prisma } from "../generated/prisma/client.js";
import bcrypt from "bcrypt";

const app = createApp();

async function truncate() {
  await prisma.ticket.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();
}

beforeEach(async () => {
  await truncate();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("Scénario 1 — parcours utilisateur", () => {
  it("inscription, connexion, liste événements, achat, mes billets", async () => {
    const startsAt = new Date();
    startsAt.setDate(startsAt.getDate() + 5);

    const org = await prisma.user.create({
      data: {
        email: "org@test.com",
        passwordHash: await bcrypt.hash("x", 10),
        name: "Org",
        role: Role.ORGANIZER,
      },
    });
    const ev = await prisma.event.create({
      data: {
        title: "Test Event",
        description: "Desc",
        startsAt,
        venue: "Hall",
        city: "Paris",
        price: new Prisma.Decimal(25),
        totalSeats: 10,
        category: "CONCERT",
        organizerId: org.id,
      },
    });

    const list = await request(app).get("/api/events");
    expect(list.status).toBe(200);
    expect(list.body.events.some((e: { id: string }) => e.id === ev.id)).toBe(true);

    const reg = await request(app).post("/api/auth/register").send({
      email: "user@test.com",
      password: "password123",
      name: "Alice",
    });
    expect(reg.status).toBe(201);
    const token = reg.body.token as string;

    const buy = await request(app)
      .post(`/api/events/${ev.id}/tickets`)
      .set("Authorization", `Bearer ${token}`);
    expect(buy.status).toBe(201);
    expect(buy.body.ticket.qrPayload).toBeTruthy();

    const mine = await request(app)
      .get("/api/me/tickets")
      .set("Authorization", `Bearer ${token}`);
    expect(mine.status).toBe(200);
    expect(mine.body.tickets).toHaveLength(1);
  });
});

describe("Scénario 3 — places limitées", () => {
  it("refuse le 3e achat sur 2 places", async () => {
    const startsAt = new Date();
    startsAt.setDate(startsAt.getDate() + 3);

    const org = await prisma.user.create({
      data: {
        email: "o2@test.com",
        passwordHash: await bcrypt.hash("x", 10),
        name: "O",
        role: Role.ORGANIZER,
      },
    });
    const ev = await prisma.event.create({
      data: {
        title: "Petit",
        description: "D",
        startsAt,
        venue: "V",
        city: "Lyon",
        price: new Prisma.Decimal(10),
        totalSeats: 2,
        category: "CONFERENCE",
        organizerId: org.id,
      },
    });

    const mkUser = async (n: number) => {
      const r = await request(app).post("/api/auth/register").send({
        email: `u${n}@t.com`,
        password: "password123",
        name: `U${n}`,
      });
      return r.body.token as string;
    };
    const t1 = await mkUser(1);
    const t2 = await mkUser(2);
    const t3 = await mkUser(3);

    expect(
      (await request(app)
        .post(`/api/events/${ev.id}/tickets`)
        .set("Authorization", `Bearer ${t1}`)).status,
    ).toBe(201);
    expect(
      (await request(app)
        .post(`/api/events/${ev.id}/tickets`)
        .set("Authorization", `Bearer ${t2}`)).status,
    ).toBe(201);
    const last = await request(app)
      .post(`/api/events/${ev.id}/tickets`)
      .set("Authorization", `Bearer ${t3}`);
    expect(last.status).toBe(409);
  });
});

describe("Scénario 2 — organisateur", () => {
  it("crée un événement Lyon, dashboard, modifie le prix", async () => {
    const reg = await request(app).post("/api/auth/register").send({
      email: "org-sc2@test.com",
      password: "password123",
      name: "Org SC2",
    });
    expect(reg.status).toBe(201);
    // compte par défaut USER — promouvoir en organisateur pour le test
    await prisma.user.update({
      where: { id: reg.body.user.id },
      data: { role: Role.ORGANIZER },
    });
    const login = await request(app).post("/api/auth/login").send({
      email: "org-sc2@test.com",
      password: "password123",
    });
    expect(login.body.user.role).toBe("ORGANIZER");
    const token = login.body.token as string;

    const startsAt = new Date();
    startsAt.setDate(startsAt.getDate() + 20);
    startsAt.setHours(21, 0, 0, 0);

    const create = await request(app)
      .post("/api/events")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Concert test Lyon",
        description: "Concert à Lyon",
        startsAt: startsAt.toISOString(),
        venue: "Transbordeur",
        city: "Lyon",
        price: 25,
        totalSeats: 50,
        category: "CONCERT",
      });
    expect(create.status).toBe(201);
    const eventId = create.body.event.id as string;

    const dash = await request(app)
      .get("/api/organizer/dashboard")
      .set("Authorization", `Bearer ${token}`);
    expect(dash.status).toBe(200);
    expect(dash.body.totalEvents).toBe(1);

    const patch = await request(app)
      .patch(`/api/events/${eventId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ price: 30 });
    expect(patch.status).toBe(200);
    expect(patch.body.event.price).toBe("30");
  });
});

describe("Scénario 4 — recherche", () => {
  it("filtre catégorie, ville, prix", async () => {
    const startsAt = new Date();
    startsAt.setDate(startsAt.getDate() + 10);

    const org = await prisma.user.create({
      data: {
        email: "o3@test.com",
        passwordHash: await bcrypt.hash("x", 10),
        name: "O",
        role: Role.ORGANIZER,
      },
    });
    await prisma.event.create({
      data: {
        title: "Conf Lyon",
        description: "D",
        startsAt,
        venue: "C",
        city: "Lyon",
        price: new Prisma.Decimal(40),
        totalSeats: 50,
        category: "CONFERENCE",
        organizerId: org.id,
      },
    });
    await prisma.event.create({
      data: {
        title: "Concert Paris",
        description: "D",
        startsAt,
        venue: "C",
        city: "Paris",
        price: new Prisma.Decimal(60),
        totalSeats: 50,
        category: "CONCERT",
        organizerId: org.id,
      },
    });

    const concerts = await request(app).get("/api/events?category=CONCERT");
    expect(concerts.status).toBe(200);
    expect(concerts.body.events.every((e: { category: string }) => e.category === "CONCERT")).toBe(
      true,
    );

    const paris = await request(app).get("/api/events?city=Paris");
    expect(paris.status).toBe(200);
    expect(paris.body.events.every((e: { city: string }) => e.city === "Paris")).toBe(true);

    const cheap = await request(app).get("/api/events?maxPrice=45");
    expect(cheap.status).toBe(200);
    expect(cheap.body.events.length).toBeGreaterThanOrEqual(1);
    expect(
      cheap.body.events.every((e: { price: string }) => Number.parseFloat(e.price) <= 45),
    ).toBe(true);

    const combo = await request(app).get(
      "/api/events?category=CONFERENCE&city=Lyon&maxPrice=50",
    );
    expect(combo.status).toBe(200);
    expect(combo.body.events.length).toBeGreaterThanOrEqual(1);
  });
});
