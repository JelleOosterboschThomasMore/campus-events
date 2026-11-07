import { healthService } from '../services/healthService.mjs';

export const healthController = {
  async check(_req, res) {
    res.status(200).json(await healthService.check());
  }
};
