import { Request, Response, NextFunction } from "express";
import { createHash } from "crypto";
import { db, apiKeysTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, type AuthenticatedRequest } from "./requireAuth";

function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export async function requireAuthFlexible(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const apiKey = req.headers["x-api-key"] as string | undefined;

  if (apiKey) {
    const hash = hashKey(apiKey);
    const [record] = await db
      .select()
      .from(apiKeysTable)
      .where(eq(apiKeysTable.keyHash, hash))
      .limit(1);

    if (!record) {
      res.status(401).json({ error: "Invalid API key." });
      return;
    }

    db.update(apiKeysTable)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeysTable.id, record.id))
      .catch(() => {});

    (req as AuthenticatedRequest).userId = record.userId;
    (req as AuthenticatedRequest).userEmail = "";
    (req as AuthenticatedRequest).userName = "";
    next();
    return;
  }

  requireAuth(req, res, next);
}
