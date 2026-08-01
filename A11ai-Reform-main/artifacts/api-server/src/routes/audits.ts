import { Router } from "express";
import { db, auditsTable, auditPagesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/requireAuth";
import { crawlSite } from "../lib/crawler";

import { validateScanUrl } from "../lib/url-validator";

const router = Router();

router.get("/audits/scan", requireAuth, async (req, res) => {
  const { url: rawUrl } = req.query as { url?: string };
  const validated = validateScanUrl(rawUrl ?? "");
  if (!validated.valid || !validated.url) {
    res.status(400).json({ error: validated.error ?? "Invalid URL." });
    return;
  }

  const userId = (req as AuthenticatedRequest).userId;
  const rootUrl = validated.url.toString();
  const domain = validated.url.hostname;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  function send(event: string, data: object) {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  }

  const [audit] = await db
    .insert(auditsTable)
    .values({ userId, domain, status: "scanning" })
    .returning();

  send("start", { auditId: audit.id, domain });

  try {
    const pages = await crawlSite(rootUrl, (page, scanned) => {
      send("page", {
        url: page.url,
        score: page.score,
        issueCount: page.issueCount,
        scanned,
      });
    });

    if (pages.length > 0) {
      await db.insert(auditPagesTable).values(
        pages.map((p) => ({
          auditId: audit.id,
          url: p.url,
          score: p.score,
          issueCount: p.issueCount,
          result: p.result,
        })),
      );
    }

    const avgScore =
      pages.length > 0
        ? Math.round(pages.reduce((s, p) => s + p.score, 0) / pages.length)
        : 0;
    const criticalCount = pages.reduce(
      (s, p) =>
        s + p.result.issues.filter((i) => i.severity === "critical").length,
      0,
    );

    await db
      .update(auditsTable)
      .set({ status: "done", totalPages: pages.length, avgScore, criticalCount })
      .where(eq(auditsTable.id, audit.id));

    send("done", {
      auditId: audit.id,
      avgScore,
      totalPages: pages.length,
      criticalCount,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Audit failed.";
    await db
      .update(auditsTable)
      .set({ status: "error", errorMessage: msg })
      .where(eq(auditsTable.id, audit.id));
    send("error", { message: msg });
  }

  res.end();
});

router.get("/audits", requireAuth, async (req, res) => {
  const userId = (req as AuthenticatedRequest).userId;
  const audits = await db
    .select()
    .from(auditsTable)
    .where(eq(auditsTable.userId, userId))
    .orderBy(desc(auditsTable.createdAt))
    .limit(20);
  res.json({ audits });
});

router.get("/audits/:id", requireAuth, async (req, res) => {
  const userId = (req as AuthenticatedRequest).userId;
  const id = req.params["id"] as string;

  const [audit] = await db
    .select()
    .from(auditsTable)
    .where(eq(auditsTable.id, id))
    .limit(1);

  if (!audit || audit.userId !== userId) {
    res.status(404).json({ error: "Audit not found." });
    return;
  }

  const pages = await db
    .select()
    .from(auditPagesTable)
    .where(eq(auditPagesTable.auditId, id))
    .orderBy(auditPagesTable.score);

  res.json({ audit, pages });
});

router.delete("/audits/:id", requireAuth, async (req, res) => {
  const userId = (req as AuthenticatedRequest).userId;
  const id = req.params["id"] as string;

  const [audit] = await db
    .select({ id: auditsTable.id, userId: auditsTable.userId })
    .from(auditsTable)
    .where(eq(auditsTable.id, id))
    .limit(1);

  if (!audit || audit.userId !== userId) {
    res.status(404).json({ error: "Audit not found." });
    return;
  }

  await db.delete(auditsTable).where(eq(auditsTable.id, id));
  res.json({ ok: true });
});

export default router;
