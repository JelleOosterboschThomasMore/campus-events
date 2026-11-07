// Builds the Express app: middleware order only. The real work lives in routes -> controllers -> services -> repositories.
import { existsSync } from 'node:fs';
import path from 'node:path';
import express from 'express';
import { config } from './config/env.mjs';
import { errorHandler, notFoundHandler } from './middleware/errorHandlers.mjs';
import { requestLogger } from './middleware/requestLogger.mjs';
import { apiRoutes } from './routes/index.mjs';

// Production: the same process also serves the built frontend (npm run build), so one URL is enough.
// Skipped when web/dist does not exist (development, tests).
function serveWebApp(app) {
  const { serve, distDir } = config.web;
  if (!serve || !existsSync(path.join(distDir, 'index.html'))) return;

  app.use(express.static(distDir));
  // Vue Router uses real URLs (/events/3): any other GET gets index.html. /api/* never does.
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

export function createApp() {
  const app = express();

  app.use(express.json());
  app.use(requestLogger);
  app.use('/api', apiRoutes);
  serveWebApp(app);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export const app = createApp();
