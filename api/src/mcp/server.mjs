// The MCP server: the "tools" an AI assistant can call. Each tool is a thin wrapper around a service,
// exactly like a controller is for HTTP, so the business rules stay in one place.
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { logger } from '../config/logger.mjs';
import { AppError } from '../errors/appError.mjs';
import { eventService } from '../services/eventService.mjs';
import { registrationService } from '../services/registrationService.mjs';
import { idSchema, registrationSchema } from '../validation/schemas.mjs';

// Only what the assistant needs to answer questions about an event.
const forAssistant = ({ id, title, description, location, startsAt, capacity }) =>
  ({ id, title, description, location, startsAt, capacity });

// A tool answers with text; JSON is text the assistant reads easily.
const asText = (data) => ({ content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] });
const toolError = (message) => ({ isError: true, content: [{ type: 'text', text: message }] });

// Expected problems (unknown event, already registered, full) go back to the assistant so it can
// explain them to the user. Anything else is a bug: log it and don't leak its details.
async function runTool(work) {
  try {
    return asText(await work());
  } catch (err) {
    if (err instanceof AppError) return toolError(err.message);
    logger.error('mcp tool failed', { error: err.message });
    return toolError('Something went wrong on the server.');
  }
}

export function createMcpServer() {
  const server = new McpServer({ name: 'campus-events', version: '1.0.0' });

  // The assistant chooses a tool by its name and description, so they say when to use it.
  server.registerTool(
    'list_upcoming_events',
    {
      title: 'List upcoming events',
      description: 'Lists campus events that have not started yet, soonest first. Use it for questions about ' +
        'upcoming events, and to find the id of an event the user names by its title.'
    },
    () => runTool(async () => (await eventService.listUpcoming()).map(forAssistant))
  );

  server.registerTool(
    'list_past_events',
    {
      title: 'List past events',
      description: 'Lists campus events that have already started or taken place, most recent first.'
    },
    () => runTool(async () => (await eventService.listPast()).map(forAssistant))
  );

  // Same validation rules as the REST API (reused schemas), so both doors into the app accept the same input.
  server.registerTool(
    'register_for_event',
    {
      title: 'Register for an event',
      description: 'Registers one person for an event. Needs the event id (find it with list_upcoming_events ' +
        'if the user gives a title), the person\'s name and their email address. Ask the user for a missing ' +
        'name or email instead of making one up. To register several people, call it once per person.',
      inputSchema: { eventId: idSchema.shape.id, ...registrationSchema.shape }
    },
    ({ eventId, name, email }) => runTool(async () => {
      const registration = await registrationService.register(eventId, { name, email });
      return { registered: true, registrationId: registration.id, eventId, name: registration.name };
    })
  );

  return server;
}
