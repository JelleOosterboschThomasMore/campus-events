// Import models from here, never from the single files: this is where the associations are set.
import { Event } from './event.mjs';
import { MailJob } from './mailJob.mjs';
import { Registration } from './registration.mjs';

Event.hasMany(Registration, { foreignKey: { name: 'eventId', allowNull: false }, onDelete: 'CASCADE' });
Registration.belongsTo(Event, { foreignKey: 'eventId' });

// If an event (and so its registrations) is deleted, its unsent confirmation mails are pointless.
Registration.hasMany(MailJob, { foreignKey: { name: 'registrationId', allowNull: true }, onDelete: 'CASCADE' });
MailJob.belongsTo(Registration, { foreignKey: 'registrationId' });

export { Event, MailJob, Registration };
