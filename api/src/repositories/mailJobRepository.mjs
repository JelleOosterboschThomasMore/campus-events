import { Op } from 'sequelize';
import { MailJob } from '../models/index.mjs';

export const mailJobRepository = {
  // Pending jobs whose next attempt is due, oldest first.
  async findDue(now, limit) {
    const rows = await MailJob.findAll({
      where: { status: 'pending', nextAttemptAt: { [Op.lte]: now } },
      order: [['nextAttemptAt', 'ASC']],
      limit
    });
    return rows.map((row) => row.toJSON());
  },

  async update(id, fields) {
    await MailJob.update(fields, { where: { id } });
  }
};
