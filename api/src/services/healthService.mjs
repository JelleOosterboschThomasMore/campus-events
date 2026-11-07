import { healthRepository } from '../repositories/healthRepository.mjs';

export const healthService = {
  async check() {
    await healthRepository.checkDatabase();
    return { status: 'ok' };
  }
};
