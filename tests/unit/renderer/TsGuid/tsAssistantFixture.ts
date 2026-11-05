import type { Assistant } from '@/common/types/agent/assistantTypes';

export const tsAssistantFixture = (id: string, overrides: Partial<Assistant> = {}): Assistant => ({
  id,
  source: 'user',
  name: id,
  name_i18n: {},
  description_i18n: {},
  enabled: true,
  sort_order: 0,
  agent_id: `agent-${id}`,
  agent: { type: 'aionrs', source: 'internal' },
  enabled_skills: [],
  custom_skill_names: [],
  disabled_builtin_skills: [],
  context_i18n: {},
  prompts: [],
  prompts_i18n: {},
  models: [],
  agent_status: 'online',
  team_selectable: true,
  deletable: true,
  ...overrides,
});
