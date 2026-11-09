/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import type { IMcpServer } from '@/common/config/storage';

/** 批量导入 MCP 服务器所需的最小字段（与后端 import 接口一致）。 */
export type McpImportServer = Partial<IMcpServer> & Pick<IMcpServer, 'name' | 'transport'>;

/**
 * 系统默认 MCP 服务器的声明式定义。
 *
 * `sourceType` 保留标准 MCP 客户端 JSON 里的原始 type（`http` / `streamableHttp`），
 * 仅用于生成 `original_json` 供编辑界面回显；实际 `transport.type` 统一落为
 * `http`，因为后端与内置 JSON 导入器都会把 `streamableHttp` 归一化为 `http`。
 */
interface SystemDefaultMcpServerDefinition {
  name: string;
  sourceType: 'http' | 'streamableHttp';
  url: string;
  description?: string;
  /** 是否默认启用；对应原始配置中的 `disabled` 取反。 */
  enabled: boolean;
}

const SYSTEM_DEFAULT_MCP_SERVER_DEFINITIONS: readonly SystemDefaultMcpServerDefinition[] = [
  {
    name: 'tradesparq',
    sourceType: 'http',
    url: 'https://mcp.tradesparq.com/mcp/data-search',
    description: '外贸公社 TradeSparq 全球贸易/海关数据检索',
    enabled: false,
  },
  {
    name: 'waimaogongshe',
    sourceType: 'http',
    url: 'https://mcp.waimaogongshe.cn/mcp/data-search',
    description: '外贸公社 全球贸易/海关数据检索',
    enabled: true,
  },
  {
    name: 'data-search',
    sourceType: 'streamableHttp',
    url: 'http://mcp.trade.com/mcp/data-search',
    enabled: false,
  },
  {
    name: 'search-data',
    sourceType: 'streamableHttp',
    url: 'http://mcp.trade.com/mcp/data-search',
    enabled: false,
  },
  {
    name: 'mcp-gateway-test1',
    sourceType: 'streamableHttp',
    url: 'http://mcp.trade.com/mcp/time-info',
    enabled: false,
  },
];

function buildOriginalJson(definition: SystemDefaultMcpServerDefinition): string {
  return JSON.stringify(
    {
      mcpServers: {
        [definition.name]: {
          type: definition.sourceType,
          url: definition.url,
          ...(definition.description ? { description: definition.description } : {}),
          ...(definition.enabled ? {} : { disabled: true }),
        },
      },
    },
    null,
    2
  );
}

/**
 * 构建系统默认 MCP 服务器列表。
 *
 * 这些服务器会在启动迁移时按名字去重写入数据库，用户已有的同名配置不会被覆盖。
 */
export function buildSystemDefaultMcpServers(): McpImportServer[] {
  return SYSTEM_DEFAULT_MCP_SERVER_DEFINITIONS.map(
    (definition): McpImportServer => ({
      name: definition.name,
      description: definition.description,
      enabled: definition.enabled,
      builtin: true,
      transport: {
        type: 'http',
        url: definition.url,
      },
      original_json: buildOriginalJson(definition),
    })
  );
}
