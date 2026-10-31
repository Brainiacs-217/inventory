import "server-only";

import postgres, { type Sql } from "postgres";

const globalForSql = globalThis as unknown as {
  sql?: Sql;
  sqlConnectionString?: string;
};

/**
 * Server-side Postgres connection.
 * Uses the database role, so it does not apply Row Level Security.
 * Filter every query by the organization the signed-in user belongs to.
 *
 * The client is cached on globalThis, which survives Next.js env reloads.
 * Recreate it when DATABASE_URL changes so a new pooler URI is actually used.
 */
export function getSql(): Sql {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Use the Supabase transaction pooler URI.",
    );
  }

  if (globalForSql.sql && globalForSql.sqlConnectionString !== connectionString) {
    void globalForSql.sql.end({ timeout: 0 });
    globalForSql.sql = undefined;
  }

  if (!globalForSql.sql) {
    globalForSql.sqlConnectionString = connectionString;
    globalForSql.sql = postgres(connectionString, {
      prepare: false,
      max: 10,
      idle_timeout: 20,
      ssl: "require",
    });
  }

  return globalForSql.sql;
}
