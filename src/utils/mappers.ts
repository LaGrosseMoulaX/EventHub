import type { Event, Ticket, User } from "../../generated/prisma/client.js";

function decimalToString(d: { toString(): string }): string {
  return d.toString();
}

export function toPublicUser(u: User) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
  };
}

export function toPublicEvent(e: Event, soldCount: number) {
  return {
    id: e.id,
    title: e.title,
    description: e.description,
    startsAt: e.startsAt.toISOString(),
    venue: e.venue,
    city: e.city,
    price: decimalToString(e.price),
    totalSeats: e.totalSeats,
    availableSeats: Math.max(0, e.totalSeats - soldCount),
    soldCount,
    category: e.category,
    coverImageUrl: e.coverImageUrl,
    organizerId: e.organizerId,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  };
}

export function toPublicTicket(t: Ticket, event?: Event) {
  let eventPayload:
    | {
        id: string;
        title: string;
        startsAt: string;
        city: string;
        price: string;
      }
    | undefined;
  if (event !== undefined) {
    eventPayload = {
      id: event.id,
      title: event.title,
      startsAt: event.startsAt.toISOString(),
      city: event.city,
      price: decimalToString(event.price),
    };
  }
  return {
    id: t.id,
    qrPayload: t.qrPayload,
    status: t.status,
    eventId: t.eventId,
    createdAt: t.createdAt.toISOString(),
    event: eventPayload,
  };
}
