import { registrationService } from '../services/registrationService.mjs';

export const registrationController = {
  async list(req, res) {
    res.json(await registrationService.list(req.valid.params.id));
  },

  async create(req, res) {
    const registration = await registrationService.register(req.valid.params.id, req.valid.body);
    res.status(201).json(registration);
  }
};
