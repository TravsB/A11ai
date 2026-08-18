import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

let pool: any;
let db: any;

if (!process.env.DATABASE_URL) {
  // In development it's useful to be able to run the servers without a database.
  // Log a warning and export undefined placeholders — callers should handle the
  // absence of `db` in tests and local dev. This avoids hard crashes when
  // DATABASE_URL isn't provided.
  console.warn(
    "DATABASE_URL is not set. Database operations will be disabled. Some features may not work.",
  );
  pool = undefined;
  db = undefined;
} else {
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle(pool, { schema });
}

export { pool, db };
export * from "./schema";
