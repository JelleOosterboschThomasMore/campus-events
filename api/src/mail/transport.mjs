import nodemailer from 'nodemailer';

// A transport is anything with `send({ to, subject, text })` that returns a promise.
// Swapping providers (or faking one in a test) only means passing another transport.

// Used when no SMTP_URL is set (local development): nothing leaves the machine, the mail is only logged.
export function createLogTransport(logger) {
  return {
    name: 'log',
    async send({ to, subject }) {
      logger.info('mail not sent: SMTP_URL is not configured, only logged', { to, subject });
    }
  };
}

export function createSmtpTransport({ smtpUrl, from }) {
  const transporter = nodemailer.createTransport(smtpUrl);
  return {
    name: 'smtp',
    send: (message) => transporter.sendMail({ from, ...message })
  };
}

export function createMailTransport({ smtpUrl, from }, logger) {
  return smtpUrl ? createSmtpTransport({ smtpUrl, from }) : createLogTransport(logger);
}
