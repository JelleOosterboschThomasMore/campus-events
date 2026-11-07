// The only file that reads process.env. Everything else imports `config`.
import path from 'node:path';

if (process.env.NODE_ENV !== 'test') {
  try {
    process.loadEnvFile();
  } catch {
    // no .env file: real environment variables and the defaults below are used
  }
}

const env = process.env;

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toBool = (value, fallback) => {
  if (value === undefined || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
};

export const config = Object.freeze({
  env: env.NODE_ENV || 'development',
  port: toInt(env.PORT, 3000),
  logLevel: env.LOG_LEVEL || 'info',
  silentLogs: env.NODE_ENV === 'test',
  dbStorage: env.DB_STORAGE || './data/events.sqlite',

  // In production one process serves the API and the built frontend (web/dist), so one URL is enough.
  web: Object.freeze({
    serve: toBool(env.SERVE_WEB, true),
    distDir: env.WEB_DIST_DIR || path.resolve(import.meta.dirname, '../../../web/dist')
  }),

  mail: Object.freeze({
    smtpUrl: env.SMTP_URL || '',
    from: env.MAIL_FROM || 'Campus Events <no-reply@campus-events.local>',
    // false in tests: the test decides when the outbox is processed
    autoDispatch: toBool(env.MAIL_AUTO_DISPATCH, true),
    retryIntervalMs: toInt(env.MAIL_RETRY_INTERVAL_MS, 30_000),
    baseDelayMs: toInt(env.MAIL_RETRY_BASE_DELAY_MS, 30_000),
    maxAttempts: toInt(env.MAIL_MAX_ATTEMPTS, 5),
    sendTimeoutMs: toInt(env.MAIL_SEND_TIMEOUT_MS, 10_000),
    batchSize: toInt(env.MAIL_BATCH_SIZE, 20)
  }),

  cache: Object.freeze({
    enabled: toBool(env.CACHE_ENABLED, true),
    ttlSeconds: toInt(env.CACHE_TTL_SECONDS, 30),
    maxEntries: toInt(env.CACHE_MAX_ENTRIES, 500)
  })
});
