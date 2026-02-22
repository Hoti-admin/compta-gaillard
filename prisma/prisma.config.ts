import { defineConfig } from "prisma/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

export default defineConfig({
  schema: "prisma/schema.prisma",

  migrations: {
    path: "prisma/migrations",
  },

  engine: {
    type: "client",
  },

  db: {
    adapter: new PrismaPg(
      new Pool({
        connectionString: process.env.DIRECT_URL,
        ssl: {
          rejectUnauthorized: false,
        },
      })
    ),
  },
});
