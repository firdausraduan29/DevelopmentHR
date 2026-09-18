import dotenv from "dotenv";
dotenv.config({ path: "./.env", override: true });

import { defineConfig } from "drizzle-kit";

const raw = process.env.DATABASE_URL;
const url = raw?.trim();

if (!url) {
  throw new Error("DATABASE_URL is missing (check your .env file)");
}

// Validate format early (prevents pg falling back to localhost)
let host = "";
try {
  const u = new URL(url);
  host = u.host;
} catch {
  throw new Error(
    "DATABASE_URL is invalid. It must look like: postgresql://user:pass@host/db?sslmode=require (NO quotes, NO psql, ONE line)"
  );
}

console.log("Drizzle connecting to host:", host);

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url,
  },
});
