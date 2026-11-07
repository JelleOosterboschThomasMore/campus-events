import { DataTypes } from 'sequelize';
import { sequelize } from '../db/connection.mjs';

// The "outbox": one row per mail that has to be sent. It is written in the same
// transaction as the registration, so a mail can never be lost, only delayed.
// status: pending (waiting or retrying) -> sent | failed (gave up after maxAttempts)
export const MailJob = sequelize.define(
  'MailJob',
  {
    to: { type: DataTypes.STRING(254), allowNull: false },
    subject: { type: DataTypes.STRING(200), allowNull: false },
    body: { type: DataTypes.TEXT, allowNull: false },
    status: { type: DataTypes.STRING(10), allowNull: false, defaultValue: 'pending' },
    attempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    lastError: { type: DataTypes.TEXT, allowNull: true },
    nextAttemptAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    sentAt: { type: DataTypes.DATE, allowNull: true }
  },
  { indexes: [{ fields: ['status', 'nextAttemptAt'] }] }
);
