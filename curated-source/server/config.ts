import 'dotenv/config';
import path from 'node:path';

const env = process.env;
const isProd = env.NODE_ENV === 'production';

if (isProd && (!env.JWT_SECRET || env.JWT_SECRET.length < 32)) {
  throw new Error('JWT_SECRET must be set to a value of at least 32 characters in production');
}

export const config = {
  isProd,
  port: Number(env.PORT ?? 4000),
  jwtSecret: env.JWT_SECRET ?? 'dev-only-secret-do-not-use-in-production',
  jwtExpiresIn: '7d',
  databasePath: path.resolve(env.DATABASE_PATH ?? './data/curated-source.db'),
  uploadDir: path.resolve(env.UPLOAD_DIR ?? './uploads'),
  distDir: path.resolve('./dist'),
  corsOrigins: (env.CORS_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  commissionRate: Number(env.PLATFORM_COMMISSION ?? 0.12),
  // Highest price allowed per work, and per buyer with one gallery over 90 days (linked purchases).
  // US$10,000 stays below the €10,000 threshold at which UK Art Market Participant AML rules apply.
  maxPriceCents: Math.round(Number(env.MAX_PRICE_USD ?? 10_000) * 100),
  // Load the demo catalogue on boot when the database is empty (used for one-click hosted deployments).
  autoSeedDemo: env.AUTO_SEED_DEMO === 'true',
  maxUploadBytes: 25 * 1024 * 1024,
};
