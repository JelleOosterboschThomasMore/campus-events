import { Sequelize } from 'sequelize';
import { config } from '../config/env.mjs';

export const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: config.dbStorage,
  logging: false
});
