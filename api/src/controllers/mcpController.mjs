// MCP over HTTP (the "Streamable HTTP" transport). Stateless: every request gets a fresh MCP server
// and transport, so there are no sessions to remember between requests.
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createMcpServer } from '../mcp/server.mjs';

export const mcpController = {
  async handle(req, res) {
    const server = createMcpServer();
    // enableJsonResponse: answer with plain JSON instead of opening an event stream per request.
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
    res.on('close', () => {
      transport.close();
      server.close();
    });

    await server.connect(transport);
    await transport.handleRequest(req, res, req.body); // express.json() already read the body
  },

  // Without sessions there is no stream to open (GET) and no session to end (DELETE).
  methodNotAllowed(_req, res) {
    res.status(405).set('Allow', 'POST').json({
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Send MCP requests with POST' }
    });
  }
};
