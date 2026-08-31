import { data } from "react-router";
import { z } from "zod";

export const providerSchema = z.enum(["google", "discord"]);
export type AuthProvider = z.infer<typeof providerSchema>;

export const intentSchema = z.enum(["login", "register"]);
export type AuthIntent = z.infer<typeof intentSchema>;

export async function beginSignIn(request: Request) {
  const form = await request.formData();
  const provider = providerSchema.safeParse(form.get("provider"));

  if (!provider.success) {
    return data({ error: "That sign-in provider is not supported." }, { status: 400 });
  }

  return data({ error: "Signing in is not available yet." }, { status: 501 });
}
