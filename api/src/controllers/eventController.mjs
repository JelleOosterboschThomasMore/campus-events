// HTTP in, HTTP out. Express 5 forwards a rejected promise to the error middleware,
// so no try/catch is needed here.
import { eventService } from '../services/eventService.mjs';

export const eventController = {
  async list(_req, res) {
    res.json(await eventService.list());
  },

  async get(req, res) {
    res.status(200).json(await eventService.get(req.valid.params.id));
  },

  async create(req, res) {
    const event = await eventService.create(req.valid.body);
    res.status(201).location(`/api/events/${event.id}`).json(event);
  },

  async update(req, res) {
    res.status(200).json(await eventService.update(req.valid.params.id, req.valid.body));
  },

  async remove(req, res) {
    await eventService.remove(req.valid.params.id);
    res.status(204).send();
  }
};
