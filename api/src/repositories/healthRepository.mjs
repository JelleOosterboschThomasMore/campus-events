import { sequelize } from '../db/connection.mjs';

export const healthRepository = {
  // Throws when the database cannot be reached.
  checkDatabase() {
    return sequelize.authenticate();
  }
};
