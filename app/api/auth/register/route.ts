import { randomUUID } from "crypto";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

import { apiError } from "@/lib/api/errors";
import { logEnvPresence, logServerError } from "@/lib/api/log";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { registerSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  let step = "init";

  try {
    logEnvPresence("api/auth/register");

    step = "parse_body";
    const body = await request.json();

    step = "validate_body";
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      console.warn("[api/auth/register] validation failed", {
        issues: parsed.error.issues.map((issue) => issue.path.join(".")),
      });
      return apiError("Invalid registration details", "VALIDATION_ERROR");
    }

    const { email, password, name, inviteCode } = parsed.data;

    step = "check_invite_code";
    if (inviteCode !== process.env.INVITE_CODE) {
      console.warn("[api/auth/register] invalid invite code");
      return apiError("Invalid invite code", "FORBIDDEN");
    }

    const normalizedEmail = email.toLowerCase();

    step = "lookup_existing_user";
    const existing = await db.query.users.findFirst({
      where: eq(users.email, normalizedEmail),
    });

    if (existing) {
      return apiError("An account with this email already exists", "CONFLICT");
    }

    step = "hash_password";
    const passwordHash = await bcrypt.hash(password, 12);
    const id = randomUUID();

    step = "insert_user";
    await db.insert(users).values({
      id,
      email: normalizedEmail,
      name,
      passwordHash,
      createdAt: new Date(),
    });

    console.info("[api/auth/register] account created", {
      userId: id,
      email: normalizedEmail,
    });

    return Response.json(
      { id, email: normalizedEmail, name },
      { status: 201 },
    );
  } catch (error) {
    const errorId = logServerError("api/auth/register", error, { step });
    return apiError(`Failed to create account (ref: ${errorId})`, "INTERNAL_ERROR");
  }
}
