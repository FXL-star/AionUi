/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { ConfigProvider } from '@arco-design/web-react';
import AssistantEditorPage from '@/renderer/pages/settings/AssistantSettings/AssistantEditorPage';
import type { AssistantEditorViewModel, AssistantListItem } from '@/renderer/pages/settings/AssistantSettings/types';
import type { AssistantDetail } from '@/common/types/agent/assistantTypes';
import TsAssistantEditorPage from '@/renderer/pages/TsAssistantSettings/TsAssistantEditorPage';
import TsAssistantDetailPage from '@/renderer/pages/TsAssistantSettings/TsAssistantDetailPage';

const getTsDetailMock = vi.hoisted(() => vi.fn());

vi.mock('@/common', () => ({ ipcBridge: { assistants: { get: { invoke: getTsDetailMock } } } }));
vi.mock('@/renderer/components/Markdown', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const createTsAssistant = (source: AssistantListItem['source'] = 'builtin'): AssistantListItem => ({
  id: 'official',
  source,
  enabled: true,
  name: 'Official',
  sort_order: 0,
  agent_id: 'test-agent',
  agent_status: 'online',
  name_i18n: {},
  description_i18n: {},
  context_i18n: {},
  prompts_i18n: {},
  enabled_skills: [],
  custom_skill_names: [],
  disabled_builtin_skills: [],
  prompts: [],
  models: [],
  team_selectable: true,
  deletable: source === 'user',
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, options?: { defaultValue?: string }) => options?.defaultValue || _key,
  }),
}));

vi.mock('@/renderer/pages/settings/AssistantSettings/AssistantEditorSections', () => ({
  default: () => <div data-testid='assistant-editor-sections' />,
}));

describe('AssistantEditorPage', () => {
  const createEditor = (): AssistantEditorViewModel => ({
    isCreating: true,
    profile: {
      name: '',
      setName: vi.fn(),
      description: '',
      setDescription: vi.fn(),
      avatar: '🤖',
      setAvatar: vi.fn(),
      setAvatarPreview: vi.fn(),
    },
    agent: {
      value: 'claude',
      setValue: vi.fn(),
      availableBackends: [],
    },
    prompts: {
      text: '',
      setText: vi.fn(),
    },
    defaults: {
      model: { mode: 'auto', setMode: vi.fn(), value: '', setValue: vi.fn() },
      permission: { mode: 'auto', setMode: vi.fn(), value: '', setValue: vi.fn() },
      skills: { mode: 'auto', setMode: vi.fn() },
      mcps: { mode: 'auto', setMode: vi.fn(), availableServers: [], selectedIds: [], setSelectedIds: vi.fn() },
    },
    rules: {
      content: '',
      setContent: vi.fn(),
      viewMode: 'preview',
      setViewMode: vi.fn(),
    },
    skills: {
      availableSkills: [],
      selectedSkills: [],
      setSelectedSkills: vi.fn(),
      pendingSkills: [],
      setDeletePendingSkillName: vi.fn(),
      setDeleteCustomSkillName: vi.fn(),
      builtinAutoSkills: [],
      disabledBuiltinSkills: [],
      setDisabledBuiltinSkills: vi.fn(),
    },
    actions: {
      save: vi.fn(),
      requestDelete: vi.fn(),
      duplicate: vi.fn(),
    },
  });

  it('renders a single assistant-editor-page test id', () => {
    render(
      <ConfigProvider>
        <AssistantEditorPage editor={createEditor()} activeAssistant={null} onBack={vi.fn()} />
      </ConfigProvider>
    );

    expect(screen.getAllByTestId('assistant-editor-page')).toHaveLength(1);
    expect(screen.getByTestId('assistant-editor-bar')).toHaveClass('sticky');
    expect(screen.getByTestId('assistant-editor-body')).toBeInTheDocument();
  });

  it('uses a high-contrast back action in the editor header', () => {
    render(
      <ConfigProvider>
        <AssistantEditorPage editor={createEditor()} activeAssistant={null} onBack={vi.fn()} />
      </ConfigProvider>
    );

    expect(screen.getByTestId('btn-back-assistant-editor').className).toContain('text-t-primary');
  });

  it('prefers the editor profile name in the header title', () => {
    const editor = createEditor();
    editor.isCreating = false;
    editor.profile.name = '学术论文助手';

    render(
      <ConfigProvider>
        <AssistantEditorPage
          editor={editor}
          activeAssistant={{
            id: 'builtin-1',
            name: 'Academic Paper',
            source: 'builtin',
            enabled: true,
            sort_order: 1,
            name_i18n: { 'en-US': 'Academic Paper', 'zh-CN': '学术论文助手' },
            description_i18n: {},
            context_i18n: {},
            prompts_i18n: {},
            enabled_skills: [],
            custom_skill_names: [],
            disabled_builtin_skills: [],
            preset_agent_type: 'claude',
            models: [],
          }}
          onBack={vi.fn()}
        />
      </ConfigProvider>
    );

    expect(screen.getByText('学术论文助手')).toBeInTheDocument();
    expect(screen.queryByText('Academic Paper')).not.toBeInTheDocument();
  });

  it('allows saving and hides delete for generated assistants', () => {
    const editor = createEditor();
    editor.isCreating = false;
    editor.profile.name = 'Droid';

    render(
      <ConfigProvider>
        <AssistantEditorPage
          editor={editor}
          activeAssistant={{
            id: 'bare-1',
            name: 'Droid',
            source: 'generated',
            enabled: true,
            sort_order: 1,
            name_i18n: {},
            description_i18n: {},
            context_i18n: {},
            prompts_i18n: {},
            enabled_skills: [],
            custom_skill_names: [],
            disabled_builtin_skills: [],
            preset_agent_type: 'droid',
            models: [],
          }}
          onBack={vi.fn()}
        />
      </ConfigProvider>
    );

    expect(screen.queryByTestId('btn-delete-assistant')).not.toBeInTheDocument();
    expect(screen.getByTestId('btn-save-assistant')).not.toBeDisabled();
  });

  it('does not render any editable controls for builtin assistants in the Ts editor', () => {
    const editor = createEditor();
    editor.isCreating = false;
    render(<TsAssistantEditorPage editor={editor} activeAssistant={createTsAssistant()} onBack={vi.fn()} />);
    expect(screen.queryByTestId('ts-assistant-editor-page')).not.toBeInTheDocument();
    expect(screen.queryByTestId('assistant-editor-sections')).not.toBeInTheDocument();
  });

  it('saves manually created assistants through the Ts editor', () => {
    const editor = createEditor();
    render(<TsAssistantEditorPage editor={editor} activeAssistant={null} onBack={vi.fn()} />);
    fireEvent.click(screen.getByTestId('ts-save-assistant'));
    expect(editor.actions.save).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: 'common.delete' })).not.toBeInTheDocument();
  });

  it('lets custom assistants request deletion in the Ts editor', () => {
    const editor = createEditor();
    editor.isCreating = false;
    render(<TsAssistantEditorPage editor={editor} activeAssistant={createTsAssistant('user')} onBack={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'common.delete' }));
    expect(editor.actions.requestDelete).toHaveBeenCalledTimes(1);
  });

  it('returns from the Ts editor without saving when cancelled', () => {
    const editor = createEditor();
    const onBack = vi.fn();
    render(<TsAssistantEditorPage editor={editor} activeAssistant={null} onBack={onBack} />);
    fireEvent.click(screen.getByRole('button', { name: 'common.cancel' }));
    expect(onBack).toHaveBeenCalledTimes(1);
    expect(editor.actions.save).not.toHaveBeenCalled();
  });
});

const createDetail = (): AssistantDetail => ({
  id: 'official',
  source: 'builtin',
  agent_status: 'online',
  team_selectable: true,
  deletable: false,
  profile: {
    name: 'Official',
    name_i18n: { 'zh-CN': '官方助手' },
    description: 'Official description',
    description_i18n: {},
  },
  state: { enabled: true, sort_order: 0 },
  engine: { agent_id: 'test-agent' },
  rules: { content: 'Official rules', storage_mode: 'inline' },
  prompts: { recommended: ['Explain the topic'], recommended_i18n: { 'zh-CN': ['解释这个主题'] } },
  defaults: {
    model: { mode: 'fixed', value: 'test-model' },
    permission: { mode: 'fixed', value: 'safe' },
    thought_level: { mode: 'auto' },
    skills: { mode: 'fixed', value: ['official-skill'] },
    mcps: { mode: 'fixed', value: ['official-mcp'] },
  },
  capabilities: {
    default_skill_ids: ['official-skill'],
    custom_skill_names: [],
    default_disabled_builtin_skill_ids: [],
  },
  preferences: { last_skill_ids: [], last_disabled_builtin_skill_ids: [], last_mcp_ids: [] },
});

describe('TsAssistantDetailPage', () => {
  beforeEach(() => {
    getTsDetailMock.mockReset().mockResolvedValue(createDetail());
    vi.stubGlobal(
      'matchMedia',
      vi.fn((media: string) => ({
        matches: false,
        media,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows official rules and defaults without editable fields or save actions', async () => {
    const { container } = render(
      <TsAssistantDetailPage assistant={createTsAssistant()} localeKey='en-US' onBack={vi.fn()} />
    );
    expect(await screen.findByText('Official rules')).toBeInTheDocument();
    expect(screen.getByText('test-model')).toBeInTheDocument();
    expect(container.querySelector('input,textarea,select,[role=combobox],[role=switch]')).toBeNull();
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });

  it('loads localized official profile and recommended prompts', async () => {
    render(<TsAssistantDetailPage assistant={createTsAssistant()} localeKey='zh-CN' onBack={vi.fn()} />);
    expect(await screen.findByText('官方助手')).toBeInTheDocument();
    expect(screen.getByText('解释这个主题')).toBeInTheDocument();
    expect(getTsDetailMock).toHaveBeenCalledWith({ id: 'official', locale: 'zh-CN' });
  });

  it('shows a retry action when loading official details fails', async () => {
    getTsDetailMock.mockRejectedValueOnce(new Error('network unavailable'));
    render(<TsAssistantDetailPage assistant={createTsAssistant()} localeKey='en-US' onBack={vi.fn()} />);
    fireEvent.click(await screen.findByRole('button', { name: 'common.retry' }));
    expect(await screen.findByText('Official rules')).toBeInTheDocument();
    expect(getTsDetailMock).toHaveBeenCalledTimes(2);
  });

  it('does not expose an official assistant disabled after the list was loaded', async () => {
    const detail = createDetail();
    detail.state.enabled = false;
    getTsDetailMock.mockResolvedValue(detail);
    render(<TsAssistantDetailPage assistant={createTsAssistant()} localeKey='en-US' onBack={vi.fn()} />);
    expect(await screen.findByText('common.failed')).toBeInTheDocument();
    expect(screen.queryByText('Official rules')).not.toBeInTheDocument();
  });

  it('ignores a stale response after switching assistants', async () => {
    let resolveFirst!: (detail: AssistantDetail) => void;
    getTsDetailMock.mockImplementationOnce(
      () =>
        new Promise<AssistantDetail>((resolve) => {
          resolveFirst = resolve;
        })
    );
    const { rerender } = render(
      <TsAssistantDetailPage assistant={createTsAssistant()} localeKey='en-US' onBack={vi.fn()} />
    );
    const secondDetail = createDetail();
    secondDetail.id = 'second';
    secondDetail.rules.content = 'Second rules';
    getTsDetailMock.mockResolvedValueOnce(secondDetail);
    rerender(
      <TsAssistantDetailPage assistant={{ ...createTsAssistant(), id: 'second' }} localeKey='en-US' onBack={vi.fn()} />
    );
    await screen.findByText('Second rules');
    await act(async () => {
      resolveFirst(createDetail());
    });
    expect(screen.getByText('Second rules')).toBeInTheDocument();
    expect(screen.queryByText('Official rules')).not.toBeInTheDocument();
  });
});
