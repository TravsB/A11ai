import { Router } from "express";
import { randomBytes, createHash } from "crypto";
import { db, apiKeysTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/requireAuth";

const router = Router();

function generateApiKey(): string {
  return "a11ai_sk_" + randomBytes(24).toString("hex");
}

function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

router.get("/keys", requireAuth, async (req, res) => {
  const userId = (req as AuthenticatedRequest).userId;
  const keys = await db
    .select({
      id: apiKeysTable.id,
      name: apiKeysTable.name,
      keyPrefix: apiKeysTable.keyPrefix,
      createdAt: apiKeysTable.createdAt,
      lastUsedAt: apiKeysTable.lastUsedAt,
    })
    .from(apiKeysTable)
    .where(eq(apiKeysTable.userId, userId));

  res.json({ keys });
});

router.post("/keys", requireAuth, async (req, res) => {
  const userId = (req as AuthenticatedRequest).userId;
  const { name } = req.body as { name?: string };

  if (!name || typeof name !== "string" || name.trim() === "") {
    res.status(400).json({ error: "name is required." });
    return;
  }

  const key = generateApiKey();
  const hash = hashKey(key);
  const prefix = key.slice(0, 17) + "...";

  const [record] = await db
    .insert(apiKeysTable)
    .values({
      userId,
      name: name.trim(),
      keyHash: hash,
      keyPrefix: prefix,
    })
    .returning({
      id: apiKeysTable.id,
      name: apiKeysTable.name,
      keyPrefix: apiKeysTable.keyPrefix,
      createdAt: apiKeysTable.createdAt,
    });

  res.status(201).json({ key: record, fullKey: key });
});

router.delete("/keys/:id", requireAuth, async (req, res) => {
  const userId = (req as AuthenticatedRequest).userId;
  const id = req.params["id"] as string;

  const deleted = await db
    .delete(apiKeysTable)
    .where(and(eq(apiKeysTable.id, id), eq(apiKeysTable.userId, userId)))
    .returning({ id: apiKeysTable.id });

  if (deleted.length === 0) {
    res.status(404).json({ error: "API key not found." });
    return;
  }

  res.json({ ok: true });
});

export default router;
