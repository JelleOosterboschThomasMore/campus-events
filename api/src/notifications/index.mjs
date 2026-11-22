// One hub for the whole process: services publish to it, the browser connections subscribe to it.
import { NotificationHub } from './notificationHub.mjs';

export const notificationHub = new NotificationHub();