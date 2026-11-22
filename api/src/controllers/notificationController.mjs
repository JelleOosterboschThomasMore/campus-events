// Server-sent events (SSE): the browser keeps one request open and the server writes a message
// into it whenever something happens. Plain HTTP, no extra library; the browser side is EventSource.
import { notificationHub } from '../notifications/index.mjs';

// Some proxies close a connection that stays silent too long. A comment line every 25 s keeps it open.
const HEARTBEAT_MS = 25_000;

export const notificationController = {
  stream(req, res) {
    res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' });
    res.flushHeaders(); // send the headers now: the body never "finishes"

    // SSE format: "data: <text>", followed by an empty line, is one message.
    const unsubscribe = notificationHub.subscribe((notification) => {
      res.write(`data: ${JSON.stringify(notification)}\n\n`);
    });
    const heartbeat = setInterval(() => res.write(': ping\n\n'), HEARTBEAT_MS);

    // Tab closed or connection lost: stop writing to it, or every old tab would stay in memory.
    req.on('close', () => {
      clearInterval(heartbeat);
      unsubscribe();
    });
  }
};
