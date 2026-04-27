import { z } from "zod";

export const eventCategorySchema = z.enum([
  "CONCERT",
  "CONFERENCE",
  "FESTIVAL",
  "SPORT",
  "THEATER",
  "OTHER",
]);

export const createEventBodySchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().min(1).max(10000),
  startsAt: z.iso.datetime(),
  venue: z.string().min(1).max(300),
  city: z.string().min(1).max(120),
  price: z.coerce.number().positive().max(1_000_000),
  totalSeats: z.coerce.number().int().min(1).max(1_000_000),
  category: eventCategorySchema,
  coverImageUrl: z.url().optional(),
});

export const updateEventBodySchema = createEventBodySchema.partial();

export const listEventsQuerySchema = z.object({
  category: eventCategorySchema.optional(),
  city: z.string().min(1).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
});
