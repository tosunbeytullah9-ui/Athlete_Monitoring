import { z } from "zod";

export const createOrgSchema = z.object({
  name: z.string().min(2, "Organizasyon adı en az 2 karakter olmalı"),
});

export type CreateOrgInput = z.infer<typeof createOrgSchema>;
