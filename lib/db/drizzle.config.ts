import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

// I-load ang .env file
dotenv.config();

export default defineConfig({
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // Ngayon, makikilala na ito ni TypeScript pagkatapos ng npm install
    url: process.env.DATABASE_URL!,
  },
});