import { describe, expect, it } from 'vitest';

import { buildSystemDefaultMcpServers } from '@/process/utils/systemDefaultMcpServers';

describe('buildSystemDefaultMcpServers', () => {
  it('returns one importable definition per configured default server', () => {
    const names = buildSystemDefaultMcpServers().map((server) => server.name);

    expect(names).toEqual(['tradesparq', 'waimaogongshe', 'data-search', 'search-data', 'mcp-gateway-test1']);
  });

  it('keeps only waimaogongshe enabled by default', () => {
    const enabledByName = Object.fromEntries(
      buildSystemDefaultMcpServers().map((server) => [server.name, server.enabled])
    );

    expect(enabledByName.waimaogongshe).toBe(true);
    expect(enabledByName.tradesparq).toBe(false);
    expect(enabledByName['mcp-gateway-test1']).toBe(false);
  });

  it('uses the backend-compatible http transport for every default', () => {
    for (const server of buildSystemDefaultMcpServers()) {
      expect(server.transport.type).toBe('http');
    }
  });

  it('preserves the original streamableHttp type in original_json for export', () => {
    const server = buildSystemDefaultMcpServers().find((item) => item.name === 'data-search');
    const parsed = JSON.parse(server?.original_json ?? '{}');

    expect(parsed.mcpServers['data-search']).toMatchObject({
      type: 'streamableHttp',
      url: 'http://mcp.trade.com/mcp/data-search',
      disabled: true,
    });
  });

  it('omits the disabled flag for servers that are enabled by default', () => {
    const server = buildSystemDefaultMcpServers().find((item) => item.name === 'waimaogongshe');
    const parsed = JSON.parse(server?.original_json ?? '{}');

    expect(parsed.mcpServers.waimaogongshe).not.toHaveProperty('disabled');
  });
});
