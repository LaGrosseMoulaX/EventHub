import { z } from "zod";

export const registerBodySchema = z.object({
  email: z.email(),
  password: z.string().min(6),
  name: z.string().min(1).max(200),
});

export const loginBodySchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export const patchProfileBodySchema = z.object({
  name: z.string().min(1).max(200),
});
