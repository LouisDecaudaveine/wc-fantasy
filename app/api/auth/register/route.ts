import { randomUUID } from "crypto";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

import { apiError } from "@/lib/api/errors";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { registerSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Invalid registration details", "VALIDATION_ERROR");
    }

    const { email, password, name, inviteCode } = parsed.data;

    if (inviteCode !== process.env.INVITE_CODE) {
      return apiError("Invalid invite code", "FORBIDDEN");
    }

    const normalizedEmail = email.toLowerCase();

    const existing = await db.query.users.findFirst({
      where: eq(users.email, normalizedEmail),
    });

    if (existing) {
      return apiError("An account with this email already exists", "CONFLICT");
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const id = randomUUID();

    await db.insert(users).values({
      id,
      email: normalizedEmail,
      name,
      passwordHash,
      createdAt: new Date(),
    });

    return Response.json(
      { id, email: normalizedEmail, name },
      { status: 201 },
    );
  } catch {
    return apiError("Failed to create account", "INTERNAL_ERROR");
  }
}
