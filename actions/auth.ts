"use server";

import {
  encodeBase32LowerCaseNoPadding,
  encodeHexLowerCase,
} from "@oslojs/encoding";
import { sha256 } from "@oslojs/crypto/sha2";
import type { User, Session } from "@prisma/client";
import prisma from "@/lib/prisma";

// Generate a random session token
export async function generateSessionToken(): Promise<string> {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  const token = encodeBase32LowerCaseNoPadding(bytes);
  return token;
}

// Create a new session
export async function createSession(
  token: string,
  userId: number
): Promise<Session> {
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
  const session: Session = {
    id: sessionId,
    userId,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 days
  };
  await prisma.session.create({
    data: session,
  });
  return session;
}

// Validate a session token
export async function validateSessionToken(
  token: string
): Promise<SessionValidationResult> {
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
  const result = await prisma.session.findUnique({
    where: {
      id: sessionId,
    },
    include: {
      user: true,
    },
  });

  if (result === null) {
    return { session: null, user: null };
  }

  const { user, ...session } = result;
  if (Date.now() >= session.expiresAt.getTime()) {
    await prisma.session.delete({ where: { id: sessionId } });
    return { session: null, user: null };
  }

  if (Date.now() >= session.expiresAt.getTime() - 1000 * 60 * 60 * 24 * 15) {
    session.expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // 30 days
    await prisma.session.update({
      where: {
        id: session.id,
      },
      data: {
        expiresAt: session.expiresAt,
      },
    });
  }

  const safeUser = {
    ...user,
    passwordHash: undefined,
  };

  return { session, user: safeUser };
}

// Invalidate a session
export async function invalidateSession(sessionId: string): Promise<void> {
  await prisma.session.delete({ where: { id: sessionId } });
}

// Invalidate all sessions for a user
export async function invalidateAllSessions(userId: number): Promise<void> {
  await prisma.session.deleteMany({
    where: {
      userId: userId,
    },
  });
}

// Session validation result
export type SessionValidationResult =
  | { session: Session; user: Omit<User, "passwordHash"> }
  | { session: null; user: null };
