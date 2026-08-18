import { Router, type NextFunction, type Request, type Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();
const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.SESSION_SECRET ?? "development-secret";

if (process.env.NODE_ENV === "production" && !process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET must be set in the environment before starting the API server.");
}

const COOKIE_NAME = "a11ai_token";
const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_ATTEMPTS = 8;
const authAttemptStore = new Map<string, { count: number; resetAt: number }>();

function signToken(payload: { id: string; email: string; name: string }) {
  return jwt.sign(payload, JWT_SECRET as string, { expiresIn: "7d" });
}

function getClientKey(req: Request) {
  const forwarded = req.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() ?? req.ip ?? "unknown";
}

function enforceRateLimit(req: Request, res: Response, next: NextFunction) {
  const key = getClientKey(req);
  const now = Date.now();
  const entry = authAttemptStore.get(key);

  if (!entry || now > entry.resetAt) {
    authAttemptStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    next();
    return;
  }

  entry.count += 1;
  if (entry.count > RATE_LIMIT_MAX_ATTEMPTS) {
    res.status(429).json({ error: "Too many authentication attempts. Please try again later." });
    return;
  }

  next();
}

function sanitizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

router.post("/auth/register", enforceRateLimit, async (req, res) => {
  const name = sanitizeString(req.body?.name);
  const email = sanitizeString(req.body?.email).toLowerCase();
  const password = sanitizeString(req.body?.password);

  if (!name || !email || !password) {
    res.status(400).json({ error: "name, email, and password are required." });
    return;
  }

  if (!isValidEmail(email)) {
    res.status(400).json({ error: "Please provide a valid email address." });
    return;
  }

  if (password.length < 8 || password.length > 128) {
    res.status(400).json({ error: "Password must be between 8 and 128 characters." });
    return;
  }

  const existing = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);

  if (existing.length > 0) {
    res.status(409).json({ error: "An account with this email already exists." });
    return;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const [user] = await db
    .insert(usersTable)
    .values({ name, email, passwordHash })
    .returning({ id: usersTable.id, name: usersTable.name, email: usersTable.email });

  const token = signToken({ id: user.id, email: user.email, name: user.name });
  res.cookie(COOKIE_NAME, token, COOKIE_OPTS);
  res.status(201).json({ user: { id: user.id, name: user.name, email: user.email } });
});

router.post("/auth/login", enforceRateLimit, async (req, res) => {
  const email = sanitizeString(req.body?.email).toLowerCase();
  const password = sanitizeString(req.body?.password);

  if (!email || !password) {
    res.status(400).json({ error: "email and password are required." });
    return;
  }

  if (!isValidEmail(email)) {
    res.status(400).json({ error: "Please provide a valid email address." });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);

  if (!user) {
    res.status(401).json({ error: "No account found with that email." });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Incorrect password." });
    return;
  }

  const token = signToken({ id: user.id, email: user.email, name: user.name });
  res.cookie(COOKIE_NAME, token, COOKIE_OPTS);
  res.json({ user: { id: user.id, name: user.name, email: user.email } });
});

router.post("/auth/logout", (_req, res) => {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  res.json({ ok: true });
});

router.get("/auth/me", (req, res) => {
  const token = req.cookies?.[COOKIE_NAME] as string | undefined;
  if (!token) {
    res.status(401).json({ error: "Not authenticated." });
    return;
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET as string) as jwt.JwtPayload & {
      id?: string;
      email?: string;
      name?: string;
    };
    const user = {
      id: payload.id ?? "",
      name: payload.name ?? "",
      email: payload.email ?? "",
    };
    if (!user.id || !user.name || !user.email) {
      res.status(401).json({ error: "Invalid or expired session." });
      return;
    }
    res.json({ user });
  } catch {
    res.status(401).json({ error: "Invalid or expired session." });
  }
});

export default router;
