import { z } from "zod";

export const loginSchema = z.object({
  identifier: z.string().min(1, "E-posta veya kullanıcı adı girin"),
  password: z.string().min(1, "Şifre girin"),
});

export const inviteMemberSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi girin"),
  role: z.enum(["admin", "coach", "athlete"]),
  team_id: z.string().uuid().optional(),
  org_id: z.string().uuid(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
