import { z } from "zod";

export const providerSchema = z.enum(["google", "discord"]);

export type AuthProvider = z.infer<typeof providerSchema>;
