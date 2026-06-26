import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi girin"),
  password: z.string().min(8, "Şifre en az 8 karakter olmalı"),
});

export const magicLinkSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi girin"),
});

export const inviteMemberSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi girin"),
  role: z.enum(["admin", "coach", "athlete"]),
  team_id: z.string().uuid().optional(),
  org_id: z.string().uuid(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type MagicLinkInput = z.infer<typeof magicLinkSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
