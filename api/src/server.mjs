import { app } from './app.mjs';
import { config } from './config/env.mjs';
import { logger } from './config/logger.mjs';
import { sequelize } from './db/connection.mjs';
import { seedIfEmpty } from './db/seed.mjs';
import { mailDispatcher } from './mail/index.mjs';

await sequelize.sync();

if (await seedIfEmpty()) {
  console.log('Empty database – demo data added');
}

mailDispatcher.start(); // also sends mails that were still waiting when the server last stopped

const server = app.listen(config.port, () => {
  console.log(`Campus Events API running on http://localhost:${config.port}/api`);
});

// Hosting platforms stop the app with SIGTERM: finish what is running, then close.
async function shutdown(signal) {
  logger.info('shutting down', { signal });
  server.close();
  await mailDispatcher.stop();
  await sequelize.close();
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
