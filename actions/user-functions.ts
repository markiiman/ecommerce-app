"use server";

import { encodeHexLowerCase } from "@oslojs/encoding";
import { sha256 } from "@oslojs/crypto/sha2";
import prisma from "@/lib/prisma";
import {
  createSession,
  generateSessionToken,
  invalidateSession,
} from "@/actions/auth";
import {
  deleteSessionTokenCookie,
  getCurrentSession,
  setSessionTokenCookie,
} from "@/actions/cookies";

// Hash a password
export const hashPassword = async (password: string) => {
  return encodeHexLowerCase(sha256(new TextEncoder().encode(password)));
};

// verify password
export const verifyPassword = async (password: string, hash: string) => {
  return hash === (await hashPassword(password));
};

// Register a new user
export const registerUser = async (email: string, password: string) => {
  // Check if the user already exists
  const existingUser = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (existingUser) {
    return {
      user: null,
      error: "User already exists. Please login instead",
    };
  }

  const passwordHash = await hashPassword(password);

  try {
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
      },
    });

    // Remove the password hash from the user object
    const safeUser = { ...user, passwordHash: undefined };

    return {
      user: safeUser,
      error: null,
    };
  } catch (error) {
    return {
      user: null,
      error: `Failed to register user: ${(error as Error).message}`,
    };
  }
};

// Login a user
export const loginUser = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (user === null) {
    return {
      user: null,
      error: "User not found",
    };
  }

  if (!(await verifyPassword(password, user.passwordHash))) {
    return {
      user: null,
      error: "Invalid email and/or password",
    };
  }

  // Create a new session
  const token = await generateSessionToken();
  const session = await createSession(token, user.id);
  await setSessionTokenCookie(token, session.expiresAt);

  // Remove the password hash from the user object
  const safeUser = { ...user, passwordHash: undefined };

  return {
    user: safeUser,
    error: null,
  };
};

// Logout a user
export const logoutUser = async () => {
  const session = await getCurrentSession();

  if (session.session?.id) {
    await invalidateSession(session.session.id);
  }

  await deleteSessionTokenCookie();
};
