#!/usr/bin/env node
/**
 * Generate a service-account token and optionally insert into DB (or output SQL).
 * Usage:
 *   node scripts/seed-service-account.js
 *   ORG_ID=clxxxxxxxx node scripts/seed-service-account.js   # insert via Prisma if DATABASE_URL set
 * Output: token (use as Authorization: Bearer <token>) and SQL to run if you prefer manual insert.
 */

const crypto = require("crypto");

const name = process.env.SA_NAME || "Openclaw API";
const scopes = process.env.SA_SCOPES ? process.env.SA_SCOPES.split(",") : ["users:read"];
const token = crypto.randomBytes(32).toString("hex");
const tokenHash = crypto.createHash("sha256").update(token, "utf8").digest("hex");
const id = "c" + crypto.randomBytes(11).toString("hex"); // cuid-like

async function main() {
  const orgId = process.env.ORG_ID;

  console.log("--- Service account token (use as Authorization: Bearer <token>) ---");
  console.log(token);
  console.log("");

  if (orgId && process.env.DATABASE_URL) {
    try {
      const { PrismaClient } = require("@prisma/client");
      const prisma = new PrismaClient();
      await prisma.serviceAccount.create({
        data: {
          id,
          orgId,
          name,
          tokenHash,
          scopes,
          isActive: true,
        },
      });
      console.log("Inserted into ServiceAccount (orgId:", orgId, ", name:", name, ")");
      await prisma.$disconnect();
    } catch (e) {
      console.error("Prisma insert failed:", e.message);
      printSql(orgId, id, name, tokenHash, scopes);
    }
  } else {
    console.log("To insert via script: set ORG_ID and DATABASE_URL, then re-run.");
    console.log("");
    console.log("Or run this SQL (replace YOUR_ORG_ID with your Organization.id):");
    printSql("YOUR_ORG_ID", id, name, tokenHash, scopes);
  }
}

function printSql(orgId, id, name, tokenHash, scopes) {
  const scopesJson = JSON.stringify(scopes);
  console.log(`
INSERT INTO "ServiceAccount" (id, "orgId", name, "tokenHash", scopes, "isActive", "createdAt")
VALUES (
  '${id}',
  '${orgId}',
  '${name.replace(/'/g, "''")}',
  '${tokenHash}',
  '${scopesJson}'::jsonb,
  true,
  NOW()
);
`);
}

main();
