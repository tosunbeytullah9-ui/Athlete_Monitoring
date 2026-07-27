import { z } from "zod";

const optionalNumber = z
  .union([z.number(), z.nan()])
  .optional()
  .nullable()
  .transform((v) => (v == null || (typeof v === "number" && isNaN(v)) ? null : v));

// supabase/functions/create-athlete-account/index.ts (USERNAME_RE) ile birebir aynı olmalı.
export const ATHLETE_USERNAME_RE = /^[a-z0-9._]{3,30}$/;

const createAthleteBaseSchema = z.object({
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
  create_login: z.boolean().optional().default(false),
  username: z.string().optional(),
  password: z.string().optional(),
});

// create_login açıkken username/password, Edge Function'ın (create-athlete-account)
// beklediği kurallarla birebir aynı şekilde zorunlu hale gelir.
export const createAthleteSchema = createAthleteBaseSchema.superRefine((data, ctx) => {
  if (!data.create_login) return;

  if (!data.username || !ATHLETE_USERNAME_RE.test(data.username)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["username"],
      message:
        "Kullanıcı adı yalnızca küçük harf, rakam, nokta ve alt çizgi içerebilir (3-30 karakter)",
    });
  }

  if (!data.password || data.password.length < 6) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["password"],
      message: "Şifre en az 6 karakter olmalı",
    });
  }
});

export const updateAthleteSchema = createAthleteBaseSchema.partial();

export type CreateAthleteInput = z.infer<typeof createAthleteSchema>;
export type UpdateAthleteInput = z.infer<typeof updateAthleteSchema>;
