import { col, fn } from 'sequelize';
import { sequelize } from '../db/connection.mjs';
import { MailJob, Registration } from '../models/index.mjs';

const plain = (row) => (row ? row.toJSON() : null);

export const registrationRepository = {
  async listByEvent(eventId) {
    const rows = await Registration.findAll({ where: { eventId }, order: [['createdAt', 'ASC']] });
    return rows.map(plain);
  },

  countByEvent(eventId) {
    return Registration.count({ where: { eventId } });
  },

  async findByEventAndEmail(eventId, email) {
    return plain(await Registration.findOne({ where: { eventId, email } }));
  },

  // One query for all events: Map of eventId -> number of registrations.
  async countsPerEvent() {
    const rows = await Registration.findAll({
      attributes: ['eventId', [fn('COUNT', col('id')), 'total']],
      group: ['eventId'],
      raw: true
    });
    return new Map(rows.map((row) => [row.eventId, Number(row.total)]));
  },

  // The registration and its confirmation mail are saved in ONE transaction:
  // both exist or neither does. Sending the mail itself happens later (see mail/dispatcher.mjs).
  createWithMailJob(registration, mail) {
    return sequelize.transaction(async (transaction) => {
      const created = await Registration.create(registration, { transaction });
      await MailJob.create({ ...mail, registrationId: created.id }, { transaction });
      return plain(created);
    });
  }
};
