import { Router } from "express";
import { db, scansTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { scanUrl } from "../lib/wcag-scanner";

const router = Router();

router.post("/public/scan-preview", async (req, res) => {
  const { url } = req.body as { url?: string };
  if (!url || typeof url !== "string" || url.trim() === "") {
    res.status(400).json({ error: "url is required." });
    return;
  }

  let result: Awaited<ReturnType<typeof scanUrl>>;
  try {
    result = await scanUrl(url.trim());
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to scan URL.";
    res.status(422).json({ error: msg });
    return;
  }

  const top3 = result.issues.slice(0, 3);

  res.json({
    score: result.score,
    totalIssues: result.issues.length,
    preview: top3,
    teaser: result.issues.length > 3
      ? `+ ${result.issues.length - 3} more issue${result.issues.length - 3 !== 1 ? "s" : ""} — sign up for the full report`
      : null,
  });
});

router.get("/public/report/:id", async (req, res) => {
  const { id } = req.params;

  const [scan] = await db
    .select()
    .from(scansTable)
    .where(eq(scansTable.id, id))
    .limit(1);

  if (!scan) {
    res.status(404).json({ error: "Report not found." });
    return;
  }

  res.json({ scan });
});

export default router;
