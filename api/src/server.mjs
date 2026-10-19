import { app, Event, seedDemoData, sequelize } from './app.mjs';

await sequelize.sync();

// First start on a fresh clone: fill the empty database so the UI has something to show.
if ((await Event.count()) === 0) {
  await seedDemoData();
  console.log('Empty database – demo data added');
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Campus Events API running on http://localhost:${port}/api`);
});
