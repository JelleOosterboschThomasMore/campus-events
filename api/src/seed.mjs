// `npm run seed`: wipes the database and fills it with demo data again.
import { sequelize } from './db/connection.mjs';
import { seedDemoData } from './db/seed.mjs';

await sequelize.sync({ force: true });
await seedDemoData();

console.log('Database reset with demo data.');
await sequelize.close();
