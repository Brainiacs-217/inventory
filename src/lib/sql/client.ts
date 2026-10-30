import "server-only";

import postgres, { type Sql } from "postgres";

const globalForSql = globalThis as unknown as { sql?: Sql };

/**
 * Direct Postgres connection for server-side SQL.
 * Uses the database role, so it does not apply Row Level Security.
 * Filter every query by the organization the signed-in user belongs to.
 */
export function getSql(): Sql {
  if (!globalForSql.sql) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        "DATABASE_URL is not set. Use the Supabase transaction pooler URI.",
      );
    }

    globalForSql.sql = postgres(connectionString, {
      prepare: false,
      max: 10,
      idle_timeout: 20,
      ssl: "require",
    });
  }

  return globalForSql.sql;
}
