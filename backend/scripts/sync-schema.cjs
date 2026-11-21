/**
 * Copies the canonical Prisma schema (`/prisma/schema.prisma`) into the API
 * package before generating the client.
 *
 * Why: Prisma resolves `@prisma/client` relative to the schema's package. The
 * canonical schema lives at the repo root, but the client is owned by
 * `backend/`. Syncing a git-ignored copy keeps one source of truth without
 * adding Prisma to the web app's dependency tree.
 */
const fs = require("node:fs");
const path = require("node:path");

const source = path.resolve(__dirname, "../../prisma/schema.prisma");
const targetDir = path.resolve(__dirname, "../prisma");
const target = path.join(targetDir, "schema.prisma");

if (!fs.existsSync(source)) {
  console.error(`[prisma] canonical schema not found at ${source}`);
  process.exit(1);
}

fs.mkdirSync(targetDir, { recursive: true });
fs.copyFileSync(source, target);
console.log(`[prisma] synced schema -> ${target}`);
