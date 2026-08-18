import { Router } from "express";
import { db, scansTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { type AuthenticatedRequest } from "../middlewares/requireAuth";
import { requireAuthFlexible } from "../middlewares/requireAuthFlexible";
import { scanUrl } from "../lib/wcag-scanner";

import { validateScanUrl } from "../lib/url-validator";

const router = Router();

router.use(requireAuthFlexible);

router.post("/scans", async (req, res) => {
  const { url } = req.body as { url?: string };
  const validated = validateScanUrl(url ?? "");
  if (!validated.valid || !validated.url) {
    res.status(400).json({ error: validated.error ?? "Invalid URL." });
    return;
  }

  const userId = (req as AuthenticatedRequest).userId;

  const targetUrl = validated.url.toString();

  let scanResult: Awaited<ReturnType<typeof scanUrl>>;
  try {
    scanResult = await scanUrl(targetUrl);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to scan URL.";
    res.status(422).json({ error: msg });
    return;
  }

  const [scan] = await db
    .insert(scansTable)
    .values({
      userId,
      url: targetUrl,
      score: scanResult.score,
      issueCount: scanResult.issues.length,
      result: { issues: scanResult.issues },
    })
    .returning();

  res.status(201).json({ scan });
});

router.get("/scans", async (req, res) => {
  const userId = (req as AuthenticatedRequest).userId;
  const scans = await db
    .select({
      id: scansTable.id,
      url: scansTable.url,
      score: scansTable.score,
      issueCount: scansTable.issueCount,
      createdAt: scansTable.createdAt,
    })
    .from(scansTable)
    .where(eq(scansTable.userId, userId))
    .orderBy(desc(scansTable.createdAt))
    .limit(50);

  res.json({ scans });
});

router.get("/scans/:id", async (req, res) => {
  const userId = (req as unknown as AuthenticatedRequest).userId;
  const { id } = req.params;

  const [scan] = await db
    .select()
    .from(scansTable)
    .where(and(eq(scansTable.id, id), eq(scansTable.userId, userId)))
    .limit(1);

  if (!scan) {
    res.status(404).json({ error: "Scan not found." });
    return;
  }

  res.json({ scan });
});

router.delete("/scans/:id", async (req, res) => {
  const userId = (req as unknown as AuthenticatedRequest).userId;
  const { id } = req.params;

  const deleted = await db
    .delete(scansTable)
    .where(and(eq(scansTable.id, id), eq(scansTable.userId, userId)))
    .returning({ id: scansTable.id });

  if (deleted.length === 0) {
    res.status(404).json({ error: "Scan not found." });
    return;
  }

  res.json({ ok: true });
});

export default router;
