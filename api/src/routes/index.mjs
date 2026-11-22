import { Router } from 'express';
import { healthController } from '../controllers/healthController.mjs';
import { mcpController } from '../controllers/mcpController.mjs';
import { notificationController } from '../controllers/notificationController.mjs';
import { statsController } from '../controllers/statsController.mjs';
import { eventRoutes } from './events.mjs';

// Mounted on /api in app.mjs.
export const apiRoutes = Router();

apiRoutes.get('/health', healthController.check);
apiRoutes.use('/events', eventRoutes);
apiRoutes.get('/stats', statsController.occupancy);
// Not under /events: "/events/stream" would be caught by the /events/:id route.
apiRoutes.get('/notifications', notificationController.stream);

// MCP endpoint for AI assistants (Claude, ...). POST only, see mcpController.
apiRoutes.post('/mcp', mcpController.handle);
apiRoutes.all('/mcp', mcpController.methodNotAllowed);
