import { createLogger, format, transports } from 'winston';
import { config } from './env.mjs';

export const logger = createLogger({
  level: config.logLevel,
  silent: config.silentLogs,
  format: format.combine(format.timestamp(), format.json()),
  transports: [new transports.Console()]
});
