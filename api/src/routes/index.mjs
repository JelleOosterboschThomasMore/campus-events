import { Router } from 'express';
import { healthController } from '../controllers/healthController.mjs';
import { statsController } from '../controllers/statsController.mjs';
import { eventRoutes } from './events.mjs';

// Mounted on /api in app.mjs.
export const apiRoutes = Router();

apiRoutes.get('/health', healthController.check);
apiRoutes.use('/events', eventRoutes);
apiRoutes.get('/stats', statsController.occupancy);
