// What the participant receives. Pure function: easy to test, no mail server needed.
const CAMPUS_TIME_ZONE = 'Europe/Brussels';

export function buildConfirmationMail(event, { name, email }) {
  const when = new Date(event.startsAt).toLocaleString('en-GB', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: CAMPUS_TIME_ZONE
  });

  return {
    to: email,
    subject: `You are registered for ${event.title}`,
    body: [
      `Hi ${name},`,
      '',
      `You are registered for "${event.title}".`,
      `When: ${when}`,
      `Where: ${event.location}`,
      '',
      'See you there!',
      'Campus Events'
    ].join('\n')
  };
}
