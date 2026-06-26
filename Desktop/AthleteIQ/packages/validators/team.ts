import { z } from "zod";

export const createTeamSchema = z.object({
  name: z.string().min(2, "Takım adı en az 2 karakter olmalı"),
  discipline: z.string().optional(),
});

export const updateTeamSchema = createTeamSchema.partial();

export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;
