/* auth.ts — Registration and sign-in. submitCredentials validates the form and delegates
   to createAccount or authenticate, returning field errors rather than throwing. */

import { data } from "react-router";
import { z } from "zod";
import { fieldErrorsFrom } from "./form";
import { accounts, ensureAccountIndexes, withDb } from "./mongo";
import { hashPassword, verifyPassword } from "./password";
import { clearAttempts, limitKey, SIGN_IN_ATTEMPTS, tooManyAttempts } from "./rate-limit";
import { startSession } from "./session";

export type AuthIntent = "login" | "register";

const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Usernames are at least 3 characters.")
    .max(20, "Usernames are at most 20 characters.")
    .regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers and underscores only."),
  password: z
    .string()
    .min(10, "Passwords are at least 10 characters.")
    .max(128, "Passwords are at most 128 characters."),
});

const loginSchema = z.object({
  username: z.string().trim().min(1, "Enter your username."),
  password: z.string().min(1, "Enter your password."),
});

export type AuthResult = {
  error?: string;
  fieldErrors?: Record<string, string>;
  username?: string;
};

const ABSENT_ACCOUNT_HASH =
  "pbkdf2-sha256$5000$NsnXodM+pxiubKG3HpeEhg==$8g/MkZbo8y2CkA04FQc0fHL2Hb8z5KwB0Q9ITRSRzfI=";

const LANDING = "/profile";

function isDuplicateKey(error: unknown) {
  return typeof error === "object" && error !== null && (error as { code?: number }).code === 11000;
}

export async function submitCredentials(request: Request, intent: AuthIntent, env: Env) {
  const form = await request.formData();
  const submitted = {
    username: form.get("username"),
    password: form.get("password"),
  };

  const username = typeof submitted.username === "string" ? submitted.username : "";

  const schema = intent === "register" ? registerSchema : loginSchema;
  const parsed = schema.safeParse(submitted);

  if (!parsed.success) {
    return data({ fieldErrors: fieldErrorsFrom(parsed.error), username } satisfies AuthResult, {
      status: 400,
    });
  }

  return intent === "register"
    ? createAccount(env, parsed.data, username)
    : authenticate(request, env, parsed.data, username);
}

async function createAccount(
  env: Env,
  credentials: z.infer<typeof registerSchema>,
  username: string,
) {
  const passwordHash = await hashPassword(credentials.password);

  try {
    await withDb(env, async (db) => {
      await ensureAccountIndexes(db);

      return accounts(db).insertOne({
        username: credentials.username,
        usernameLower: credentials.username.toLowerCase(),
        passwordHash,
        createdAt: new Date(),
      });
    });
  } catch (error) {
    if (isDuplicateKey(error)) {
      return data(
        { fieldErrors: { username: "That username is taken." }, username } satisfies AuthResult,
        { status: 409 },
      );
    }

    throw error;
  }

  return startSession(env, credentials.username, LANDING);
}

async function authenticate(
  request: Request,
  env: Env,
  credentials: z.infer<typeof loginSchema>,
  username: string,
) {
  const key = limitKey(request, `signin:${credentials.username.toLowerCase()}`);

  if (tooManyAttempts(key, SIGN_IN_ATTEMPTS)) {
    return data(
      { error: "Too many attempts. Wait a minute and try again.", username } satisfies AuthResult,
      { status: 429 },
    );
  }

  const account = await withDb(env, (db) =>
    accounts(db).findOne(
      { usernameLower: credentials.username.toLowerCase() },
      { projection: { username: 1, passwordHash: 1 } },
    ),
  );

  const matches = await verifyPassword(
    credentials.password,
    account?.passwordHash ?? ABSENT_ACCOUNT_HASH,
  );

  if (!account || !matches) {
    return data(
      { error: "That username and password do not match.", username } satisfies AuthResult,
      { status: 401 },
    );
  }

  clearAttempts(key);
  return startSession(env, account.username, LANDING);
}
