// URL + validation -> controller. No logic here.
import { Router } from 'express';
import { eventController } from '../controllers/eventController.mjs';
import { registrationController } from '../controllers/registrationController.mjs';
import { validate } from '../middleware/validate.mjs';
import { createEventSchema, idSchema, registrationSchema, updateEventSchema } from '../validation/schemas.mjs';

export const eventRoutes = Router();

eventRoutes.get('/', eventController.list);
eventRoutes.post('/', validate({ body: createEventSchema }), eventController.create);

eventRoutes.get('/:id', validate({ params: idSchema }), eventController.get);
eventRoutes.patch('/:id', validate({ params: idSchema, body: updateEventSchema }), eventController.update);
eventRoutes.delete('/:id', validate({ params: idSchema }), eventController.remove);

eventRoutes.get('/:id/registrations', validate({ params: idSchema }), registrationController.list);
eventRoutes.post(
  '/:id/registrations',
  validate({ params: idSchema, body: registrationSchema }),
  registrationController.create
);
