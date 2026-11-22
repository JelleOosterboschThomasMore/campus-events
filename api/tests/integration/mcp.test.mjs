import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import request from 'supertest';
import { createMcpServer } from '../../src/mcp/server.mjs';
import { createTestApp, validEvent } from '../helpers/testApp.mjs';

const DAY_MS = 24 * 60 * 60 * 1000;
const inDays = (days) => new Date(Date.now() + days * DAY_MS).toISOString();

// A real MCP client, connected in memory: the same calls an AI assistant makes, without a network.
async function connectAssistant() {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await createMcpServer().connect(serverTransport);
  const client = new Client({ name: 'test-assistant', version: '1.0.0' });
  await client.connect(clientTransport);
  return client;
}

async function callTool(client, name, args = {}) {
  const result = await client.callTool({ name, arguments: args });
  const text = result.content[0].text;
  return { isError: Boolean(result.isError), text, data: result.isError ? null : JSON.parse(text) };
}

describe('MCP tools', () => {
  let app;
  let assistant;

  beforeEach(async () => {
    ({ app } = await createTestApp());
    assistant = await connectAssistant();
    for (const [title, days] of [['Old Workshop', -10], ['Last Week Talk', -3], ['Next Week Lab', 7], ['Tomorrow Meetup', 1]]) {
      await request(app).post('/api/events').send(validEvent({ title, startsAt: inDays(days) }));
    }
  });

  it('describes every tool, so the assistant knows when to use it', async () => {
    const { tools } = await assistant.listTools();

    assert.deepEqual(tools.map((tool) => tool.name).sort(), ['list_past_events', 'list_upcoming_events']);
    for (const tool of tools) assert.ok(tool.description.length > 20, `${tool.name} needs a description`);
  });

  it('list_upcoming_events returns only events that have not started, soonest first', async () => {
    const { data } = await callTool(assistant, 'list_upcoming_events');

    assert.deepEqual(data.map((event) => event.title), ['Tomorrow Meetup', 'Next Week Lab']);
    assert.deepEqual(Object.keys(data[0]).sort(), ['capacity', 'description', 'id', 'location', 'startsAt', 'title']);
  });

  it('list_past_events returns only events that already started, most recent first', async () => {
    const { data } = await callTool(assistant, 'list_past_events');

    assert.deepEqual(data.map((event) => event.title), ['Last Week Talk', 'Old Workshop']);
  });
});

describe('POST /api/mcp', () => {
  let app;

  beforeEach(async () => {
    ({ app } = await createTestApp());
  });

  it('answers an MCP request (JSON-RPC) over HTTP', async () => {
    const res = await request(app)
      .post('/api/mcp')
      .set('Accept', 'application/json, text/event-stream')
      .send({ jsonrpc: '2.0', id: 1, method: 'tools/list' });

    assert.equal(res.status, 200);
    assert.ok(res.body.result.tools.some((tool) => tool.name === 'list_upcoming_events'));
  });

  it('answers GET with 405 in the usual error format', async () => {
    const res = await request(app).get('/api/mcp');

    assert.equal(res.status, 405);
    assert.equal(res.body.error.code, 'METHOD_NOT_ALLOWED');
  });
});
