import { z } from "zod";

const optionalNumber = z
  .union([z.number(), z.nan()])
  .optional()
  .nullable()
  .transform((v) => (v == null || (typeof v === "number" && isNaN(v)) ? null : v));

export const createAthleteSchema = z.object({
  full_name: z.string().min(2, "Ad en az 2 karakter olmalı"),
  team_id: z.string().uuid("Geçerli takım seçin"),
  birth_date: z.string().optional().transform((v) => v || null),
  gender: z
    .string()
    .optional()
    .transform((v) => (v === "" ? null : v) as "male" | "female" | "other" | null),
  height_cm: optionalNumber,
  weight_kg: optionalNumber,
  position: z.string().optional().transform((v) => v || null),
  notes: z.string().optional().transform((v) => v || null),
});

export const updateAthleteSchema = createAthleteSchema.partial();

export type CreateAthleteInput = z.infer<typeof createAthleteSchema>;
export type UpdateAthleteInput = z.infer<typeof updateAthleteSchema>;
