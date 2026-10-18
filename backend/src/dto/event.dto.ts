import { z } from "zod";

export const createEventDto = z.object({
  title: z.string().min(3).max(120),
  description: z.string().max(500).optional(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  capacity: z.number().int().positive().max(5000)
});

export const updateEventDto = createEventDto.partial();

export type CreateEventDto = z.infer<typeof createEventDto>;
export type UpdateEventDto = z.infer<typeof updateEventDto>;
