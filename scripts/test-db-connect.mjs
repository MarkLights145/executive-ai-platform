/**
 * Tests real Postgres connectivity using DATABASE_URL from .env (sslmode=require).
 * Run from project root: node scripts/test-db-connect.mjs
 * Prints only "connected ok" or error class/message (no URL).
 */
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const envPath = path.join(projectRoot, ".env");
dotenv.config({ path: envPath });

const url = process.env.DATABASE_URL;
if (!url || !url.trim()) {
  console.error("Error: DATABASE_URL not set (check .env)");
  process.exit(1);
}

// Ensure SSL for Prisma Postgres (node-pg will use ssl: true)
const pg = await import("pg");
const Client = pg.Client ?? pg.default?.Client;
const client = new Client({
  connectionString: url,
  ssl: { rejectUnauthorized: true },
});

try {
  await client.connect();
  console.log("connected ok");
} catch (err) {
  console.error(err?.name ?? "Error", err?.message ?? String(err));
  process.exit(1);
} finally {
  await client.end().catch(() => {});
}
