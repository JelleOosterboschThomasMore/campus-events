// Data access only: no rules, no HTTP. Returns plain objects so nothing outside this layer
// (including the cache) holds on to a Sequelize instance.
import { Event } from '../models/index.mjs';

const plain = (row) => (row ? row.toJSON() : null);

export const eventRepository = {
  async listByStart() {
    const rows = await Event.findAll({ order: [['startsAt', 'ASC']] });
    return rows.map(plain);
  },

  async listById() {
    const rows = await Event.findAll({ order: [['id', 'ASC']] });
    return rows.map(plain);
  },

  async findById(id) {
    return plain(await Event.findByPk(id));
  },

  async create(data) {
    return plain(await Event.create(data));
  },

  // Returns the updated event, or null when it does not exist.
  async update(id, data) {
    const event = await Event.findByPk(id);
    if (!event) return null;
    await event.update(data);
    return plain(event);
  },

  // Returns true when a row was deleted.
  async remove(id) {
    return (await Event.destroy({ where: { id } })) > 0;
  }
};
