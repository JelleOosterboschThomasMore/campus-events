// Live notifications from the API (server-sent events). EventSource reconnects by itself
// when the connection drops; notifications sent while it was disconnected are simply missed.
export function subscribeToNotifications(onNotification) {
  const source = new EventSource('/api/notifications');
  source.onmessage = (message) => onNotification(JSON.parse(message.data));
  return () => source.close();
}
