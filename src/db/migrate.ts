import fs from "fs";
import path from "path";
import { db } from "./connection";

async function runMigrations() {
  const client = await db.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        name TEXT PRIMARY KEY,
        executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    const migrationsPath = path.join(__dirname, "migrations");

    const files = fs
      .readdirSync(migrationsPath)
      .filter((file) => file.endsWith(".sql"))
      .sort();

    for (const file of files) {
      const alreadyExecuted = await client.query(
        `
          SELECT name
          FROM migrations
          WHERE name = $1
        `,
        [file],
      );

      if (alreadyExecuted.rowCount) {
        continue;
      }

      const migration = fs.readFileSync(
        path.join(migrationsPath, file),
        "utf8",
      );

      console.log(`Running migration: ${file}`);

      await client.query("BEGIN");

      try {
        await client.query(migration);

        await client.query(
          `
            INSERT INTO migrations (name)
            VALUES ($1)
          `,
          [file],
        );

        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }

    console.log("Migrations completed.");
  } finally {
    client.release();
    await db.end();
  }
}

runMigrations().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
