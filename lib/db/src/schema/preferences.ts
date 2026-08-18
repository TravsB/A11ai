import { pgTable, text, timestamp, uuid, integer, boolean } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const preferencesTable = pgTable("user_preferences", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  visionMode: text("vision_mode").notNull().default("none"),
  contrast: integer("contrast").notNull().default(100),
  fontSize: integer("font_size").notNull().default(100),
  lineHeight: integer("line_height").notNull().default(100),
  readableFont: boolean("readable_font").notNull().default(false),
  highlightLinks: boolean("highlight_links").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type Preferences = typeof preferencesTable.$inferSelect;
export type InsertPreferences = typeof preferencesTable.$inferInsert;
