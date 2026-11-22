import { statsService } from '../services/statsService.mjs';

export const statsController = {
  async occupancy(_req, res) {
    res.json(await statsService.occupancy());
  }
};
