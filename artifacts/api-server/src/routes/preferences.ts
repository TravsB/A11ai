import { Router } from "express";
import { db, preferencesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/requireAuth";

const router = Router();
router.use(requireAuth);

router.get("/preferences", async (req, res) => {
  const userId = (req as AuthenticatedRequest).userId;

  const [prefs] = await db
    .select()
    .from(preferencesTable)
    .where(eq(preferencesTable.userId, userId))
    .limit(1);

  if (!prefs) {
    res.json({
      preferences: {
        visionMode: "none",
        contrast: 100,
        fontSize: 100,
        lineHeight: 100,
        readableFont: false,
        highlightLinks: false,
      },
    });
    return;
  }

  res.json({ preferences: prefs });
});

router.put("/preferences", async (req, res) => {
  const userId = (req as AuthenticatedRequest).userId;
  const body = req.body as {
    visionMode?: string;
    contrast?: number;
    fontSize?: number;
    lineHeight?: number;
    readableFont?: boolean;
    highlightLinks?: boolean;
  };

  const allowed = ["none", "protanopia", "deuteranopia", "tritanopia", "achromatopsia", "lowvision"];
  if (body.visionMode && !allowed.includes(body.visionMode)) {
    res.status(400).json({ error: "Invalid visionMode." });
    return;
  }

  const patch: Partial<typeof preferencesTable.$inferInsert> = {};
  if (body.visionMode !== undefined) patch.visionMode = body.visionMode;
  if (typeof body.contrast === "number") patch.contrast = Math.max(0, Math.min(200, body.contrast));
  if (typeof body.fontSize === "number") patch.fontSize = Math.max(80, Math.min(200, body.fontSize));
  if (typeof body.lineHeight === "number") patch.lineHeight = Math.max(100, Math.min(200, body.lineHeight));
  if (typeof body.readableFont === "boolean") patch.readableFont = body.readableFont;
  if (typeof body.highlightLinks === "boolean") patch.highlightLinks = body.highlightLinks;

  const [existing] = await db
    .select({ id: preferencesTable.id })
    .from(preferencesTable)
    .where(eq(preferencesTable.userId, userId))
    .limit(1);

  if (existing) {
    await db.update(preferencesTable).set(patch).where(eq(preferencesTable.userId, userId));
  } else {
    await db.insert(preferencesTable).values({ userId, ...patch });
  }

  const [prefs] = await db
    .select()
    .from(preferencesTable)
    .where(eq(preferencesTable.userId, userId))
    .limit(1);

  res.json({ preferences: prefs });
});

export default router;
