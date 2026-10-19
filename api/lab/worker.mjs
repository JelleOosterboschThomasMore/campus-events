// One shared queue, many workers: each task goes to ONE worker.
// Run from the repo root:  node --env-file=api/.env api/lab/worker.mjs <your-name>
import amqp from 'amqplib';

const name = process.argv[2] ?? 'worker';

const connection = await amqp.connect(process.env.AMQP_URL);
const channel = await connection.createChannel();
await channel.assertExchange('campus', 'topic', { durable: true });
await channel.assertQueue('lab.work', { durable: true }); // the same queue for everyone
await channel.bindQueue('lab.work', 'campus', 'task.#');
await channel.prefetch(1); // at most one unfinished task per worker

console.log(`${name} is waiting for tasks...`);
await channel.consume('lab.work', async (msg) => {
  const again = msg.fields.redelivered ? ' (AGAIN: someone else dropped it)' : '';
  console.log(`${name} starts ${msg.content.toString()}${again}`);
  await new Promise((resolve) => setTimeout(resolve, 3000)); // pretend to send a mail
  channel.ack(msg); // only now does RabbitMQ delete the message
  console.log(`${name} done`);
});
