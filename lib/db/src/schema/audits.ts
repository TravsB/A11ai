import { pgTable, text, timestamp, uuid, integer, jsonb } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import type { ScanResult } from "./scans";

export const auditsTable = pgTable("audits", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  domain: text("domain").notNull(),
  status: text("status").notNull().default("scanning"),
  totalPages: integer("total_pages").notNull().default(0),
  avgScore: integer("avg_score"),
  criticalCount: integer("critical_count").notNull().default(0),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const auditPagesTable = pgTable("audit_pages", {
  id: uuid("id").primaryKey().defaultRandom(),
  auditId: uuid("audit_id")
    .notNull()
    .references(() => auditsTable.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  score: integer("score").notNull(),
  issueCount: integer("issue_count").notNull().default(0),
  result: jsonb("result").$type<ScanResult>().notNull(),
});

export type Audit = typeof auditsTable.$inferSelect;
export type InsertAudit = typeof auditsTable.$inferInsert;
export type AuditPage = typeof auditPagesTable.$inferSelect;
export type InsertAuditPage = typeof auditPagesTable.$inferInsert;
