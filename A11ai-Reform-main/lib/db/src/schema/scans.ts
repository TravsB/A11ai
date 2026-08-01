import { pgTable, text, timestamp, uuid, integer, jsonb } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export interface ScanIssue {
  id: string;
  severity: "critical" | "high" | "medium" | "low";
  wcag: string;
  title: string;
  description: string;
  count: number;
  remediation?: string;
  elementSnippet?: string;
}

export interface ScanResult {
  issues: ScanIssue[];
}

export const scansTable = pgTable("scans", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  score: integer("score").notNull(),
  issueCount: integer("issue_count").notNull().default(0),
  result: jsonb("result").$type<ScanResult>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Scan = typeof scansTable.$inferSelect;
export type InsertScan = typeof scansTable.$inferInsert;
