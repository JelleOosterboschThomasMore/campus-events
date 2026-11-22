// The MCP server: the "tools" an AI assistant can call. Each tool is a thin wrapper around a service,
// exactly like a controller is for HTTP, so the business rules stay in one place.
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { logger } from '../config/logger.mjs';
import { AppError } from '../errors/appError.mjs';
import { eventService } from '../services/eventService.mjs';

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

  return server;
}
