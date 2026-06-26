import { z } from "zod";

export const acwrLogSchema = z.object({
  athlete_id: z.string().uuid(),
  log_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD formatı"),
  session_rpe: z.number().min(0).max(10),
  duration_min: z.number().int().positive(),
  notes: z.string().optional(),
});

export type AcwrLogInput = z.infer<typeof acwrLogSchema>;
