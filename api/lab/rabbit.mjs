// Listen to the class exchange and send messages yourself.
// Run from the repo root:  node --env-file=api/.env api/lab/rabbit.mjs "#"
// Then type a line:        <routing key> <message>   e.g.  chat.ada Hello everyone
import amqp from 'amqplib';
import readline from 'node:readline';

const pattern = process.argv[2] ?? '#'; // which routing keys do you want to receive?

const connection = await amqp.connect(process.env.AMQP_URL);
const channel = await connection.createConfirmChannel();
await channel.assertExchange('campus', 'topic', { durable: true });

// Your own temporary queue: it disappears when you stop the script.
const { queue } = await channel.assertQueue('', { exclusive: true });
await channel.bindQueue(queue, 'campus', pattern);
await channel.consume(queue, (msg) => {
  console.log(`<- ${msg.fields.routingKey}  ${msg.content.toString()}`);
}, { noAck: true });
console.log(`Listening to "${pattern}". Type: <routing key> <message>`);

const input = readline.createInterface({ input: process.stdin });
input.on('line', async (line) => {
  const [routingKey, ...words] = line.trim().split(' ');
  if (!routingKey) return;
  channel.publish('campus', routingKey, Buffer.from(words.join(' ')));
  await channel.waitForConfirms(); // the broker confirms it has the message
  console.log(`-> sent ${routingKey}`);
});
