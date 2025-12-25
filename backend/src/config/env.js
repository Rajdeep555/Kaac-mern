import dotenv from "dotenv";
import { z } from "zod"
import { en } from "zod/v4/locales";
import logger from "../utils/logger.js";

dotenv.config();

const envSchema = z.object({
    NODE_ENV: z.string().default("development"),
    PORT: z.string().default("3000"),
    DATABASE_URL: z.url(),
    JWT_SECRET: z.string().min(10),
})

const env = envSchema.safeParse(process.env);

if (!env.success) {
    logger.error("Invalid environment variables", env.error.format(en));
    process.exit(1);
}

export default env.data;