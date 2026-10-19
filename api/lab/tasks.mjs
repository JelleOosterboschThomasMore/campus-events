// For the lecturer: publish a batch of tasks.
// Run from the repo root:  node --env-file=api/.env api/lab/tasks.mjs 30
import amqp from 'amqplib';

const count = Number(process.argv[2] ?? 30);
const connection = await amqp.connect(process.env.AMQP_URL);
const channel = await connection.createConfirmChannel();
await channel.assertExchange('campus', 'topic', { durable: true });

for (let i = 1; i <= count; i++) {
  channel.publish('campus', 'task.mail', Buffer.from(`mail #${i}`), { persistent: true });
}
await channel.waitForConfirms();
console.log(`${count} tasks sent`);
await connection.close();
