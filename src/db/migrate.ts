import fs from "node:fs/promises";
import path from "node:path";

import { pool } from "./pool";

async function ensureMigrationsTable(): Promise<void> {
  await pool.query(`
    create table if not exists schema_migrations (
      version text primary key,
      applied_at timestamptz not null default now()
    )
  `);
}

async function run(): Promise<void> {
  await ensureMigrationsTable();

  const migrationsDir = path.resolve(__dirname, "migrations");
  const files = (await fs.readdir(migrationsDir))
    .filter((fileName) => fileName.endsWith(".sql"))
    .sort();

  for (const fileName of files) {
    const alreadyApplied = await pool.query<{ version: string }>(
      "select version from schema_migrations where version = $1",
      [fileName]
    );

    if (alreadyApplied.rowCount) {
      continue;
    }

    const sql = await fs.readFile(path.join(migrationsDir, fileName), "utf8");
    const client = await pool.connect();

    try {
      await client.query("begin");
      await client.query(sql);
      await client.query("insert into schema_migrations (version) values ($1)", [fileName]);
      await client.query("commit");
      console.info(`Applied migration ${fileName}`);
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }

  await pool.end();
}

run().catch((error) => {
  console.error("Migration failed", error);
  process.exitCode = 1;
});
