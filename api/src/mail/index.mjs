// Wires the real pieces together: the one mail dispatcher of the process.
import { config } from '../config/env.mjs';
import { logger } from '../config/logger.mjs';
import { mailJobRepository } from '../repositories/mailJobRepository.mjs';
import { createMailDispatcher } from './dispatcher.mjs';
import { createMailTransport } from './transport.mjs';

export const mailDispatcher = createMailDispatcher({
  jobs: mailJobRepository,
  transport: createMailTransport(config.mail, logger),
  logger,
  options: config.mail
});

export { buildConfirmationMail } from './confirmation.mjs';
