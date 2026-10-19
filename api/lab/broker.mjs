// One RabbitMQ connection for the whole API process. Import it; don't open a second one:
// the free broker allows 20 connections for the whole class.
import amqp from 'amqplib';

export const connection = await amqp.connect(process.env.AMQP_URL);
