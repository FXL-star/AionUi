/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { Button, ConfigProvider } from '@arco-design/web-react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import TsAssistantSettings from '@/renderer/pages/TsAssistantSettings';
import TsAssistantRedirect from '@/renderer/pages/TsAssistantSettings/TsAssistantRedirect';
import AssistantSettings from '@/renderer/pages/settings/AssistantSettings';
import EnabledAssistantsList from '@/renderer/pages/settings/AssistantSettings/home/EnabledAssistantsList';
import type { AssistantEditorViewModel, AssistantListItem } from '@/renderer/pages/settings/AssistantSettings/types';

const useAssistantListMock = vi.fn();
const useAssistantEditorMock = vi.fn();

vi.mock('@/renderer/pages/TsAssistantSettings/TsAssistantDetailPage', () => ({
  default: ({ assistant, onBack }: { assistant: AssistantListItem; onBack: () => void }) => (
    <div data-testid='ts-readonly-detail'>
      {assistant.name}
      <Button onClick={onBack}>Back</Button>
    </div>
  ),
}));

vi.mock('@/renderer/pages/TsAssistantSettings/TsAssistantEditorPage', () => ({
  default: ({ editor }: { editor: AssistantEditorViewModel }) => (
    <Button data-testid='ts-editor-save' onClick={editor.actions.save}>
      Save
    </Button>
  ),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, options?: { defaultValue?: string }) => options?.defaultValue || _key,
    i18n: { language: 'en-US' },
  }),
}));

vi.mock('@arco-design/web-react', async () => {
  const actual = await vi.importActual<typeof import('@arco-design/web-react')>('@arco-design/web-react');
  return {
    ...actual,
    Message: {
      useMessage: () => [{ success: vi.fn(), error: vi.fn(), warning: vi.fn() }, <div key='message-context' />],
    },
  };
});

vi.mock('@/renderer/hooks/assistant', () => ({
  useAssistantList: () => useAssistantListMock(),
  useAssistantEditor: (params: unknown) => useAssistantEditorMock(params),
}));

vi.mock('@/renderer/pages/settings/components/SettingsPageWrapper', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid='settings-wrapper'>{children}</div>,
}));

vi.mock('@/renderer/pages/settings/AssistantSettings/AssistantEditorPage', () => ({
  default: () => <div data-testid='assistant-editor-page' />,
}));

vi.mock('@/renderer/pages/settings/AssistantSettings/AssistantListPanel', () => ({
  default: () => <div data-testid='assistant-list-panel' />,
}));

vi.mock('@/renderer/utils/model/agentLogo', async () => {
  const actual = await vi.importActual<typeof import('@/renderer/utils/model/agentLogo')>(
    '@/renderer/utils/model/agentLogo'
  );
  return { ...actual, useAgentLogos: () => ({}) };
});

vi.mock('@/renderer/pages/settings/AssistantSettings/DeleteAssistantModal', () => ({
  default: () => null,
}));

vi.mock('@/renderer/pages/settings/AssistantSettings/SkillConfirmModals', () => ({
  default: () => null,
}));

vi.mock('@/renderer/pages/settings/AssistantSettings/assistantUtils', async () => {
  const actual = await vi.importActual<typeof import('@/renderer/pages/settings/AssistantSettings/assistantUtils')>(
    '@/renderer/pages/settings/AssistantSettings/assistantUtils'
  );

  return {
    ...actual,
    resolveAvatarImageSrc: (avatar?: string) => avatar,
  };
});

const createAssistant = (id: string, source: AssistantListItem['source'], enabled = true): AssistantListItem => ({
  id,
  source,
  enabled,
  name: id,
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

describe('AssistantSettings', () => {
  beforeEach(() => {
    useAssistantListMock.mockReturnValue({
      assistants: [],
      activeAssistantId: 'assistant-1',
      setActiveAssistantId: vi.fn(),
      activeAssistant: null,
      loadAssistants: vi.fn(),
      reorderEnabledAssistants: vi.fn(),
      assistantOrder: [],
      setAssistantOrder: vi.fn(),
      localeKey: 'en-US',
    });

    useAssistantEditorMock.mockReturnValue({
      editVisible: true,
      isCreating: false,
      editName: '',
      setEditName: vi.fn(),
      editDescription: '',
      setEditDescription: vi.fn(),
      editAvatar: '',
      setEditAvatar: vi.fn(),
      editAgent: 'claude',
      setEditAgent: vi.fn(),
      editRecommendedPromptsText: '',
      setEditRecommendedPromptsText: vi.fn(),
      defaultModelMode: 'auto',
      setDefaultModelMode: vi.fn(),
      defaultModelValue: '',
      setDefaultModelValue: vi.fn(),
      defaultPermissionMode: 'auto',
      setDefaultPermissionMode: vi.fn(),
      defaultPermissionValue: '',
      setDefaultPermissionValue: vi.fn(),
      defaultSkillsMode: 'fixed',
      setDefaultSkillsMode: vi.fn(),
      defaultMcpMode: 'auto',
      setDefaultMcpMode: vi.fn(),
      availableMcpServers: [],
      selectedMcpIds: [],
      setSelectedMcpIds: vi.fn(),
      editContext: '',
      setEditContext: vi.fn(),
      promptViewMode: 'preview',
      setPromptViewMode: vi.fn(),
      availableSkills: [],
      selectedSkills: [],
      setSelectedSkills: vi.fn(),
      pendingSkills: [],
      setDeletePendingSkillName: vi.fn(),
      setDeleteCustomSkillName: vi.fn(),
      builtinAutoSkills: [],
      disabledBuiltinSkills: [],
      setDisabledBuiltinSkills: vi.fn(),
      handleSave: vi.fn(),
      handleDeleteClick: vi.fn(),
      handleDuplicate: vi.fn(),
      handleDeleteRequest: vi.fn(),
      handleToggleEnabled: vi.fn(),
      handleEdit: vi.fn(),
      handleCreate: vi.fn(),
      deleteConfirmVisible: false,
      setDeleteConfirmVisible: vi.fn(),
      deletePendingSkillName: null,
      deleteCustomSkillName: null,
      customSkills: [],
      setCustomSkills: vi.fn(),
      setPendingSkills: vi.fn(),
      handleDeleteConfirm: vi.fn(),
      setEditVisible: vi.fn(),
    });
  });

  it('keeps the editor visible when an existing assistant session is open and activeAssistant is temporarily null', () => {
    render(
      <ConfigProvider>
        <MemoryRouter>
          <AssistantSettings />
        </MemoryRouter>
      </ConfigProvider>
    );

    expect(screen.getByTestId('assistant-editor-page')).toBeInTheDocument();
    expect(screen.queryByTestId('assistant-list-panel')).not.toBeInTheDocument();
  });

  it('renders enabled assistants in one preferred cross-source list', () => {
    const assistants = [
      {
        id: 'cli',
        name: 'Codex',
        sort_order: 1,
        source: 'generated',
        enabled: true,
        agent: { type: 'acp', source: 'builtin', acp_backend: 'codex' },
      },
      {
        id: 'custom',
        name: 'My Writer',
        sort_order: 2,
        source: 'user',
        enabled: true,
        agent: { type: 'acp', source: 'builtin', acp_backend: 'gemini' },
      },
      {
        id: 'official',
        name: 'Cowork',
        sort_order: 3,
        source: 'builtin',
        enabled: true,
        agent: { type: 'acp', source: 'builtin', acp_backend: 'claude' },
      },
      {
        id: 'disabled',
        name: 'Disabled',
        sort_order: 4,
        source: 'builtin',
        enabled: false,
      },
    ] as AssistantListItem[];

    render(
      <ConfigProvider>
        <EnabledAssistantsList
          assistants={assistants}
          assistantOrder={['official', 'custom', 'cli']}
          localeKey='en-US'
          searchActive={false}
          onOpenDetail={vi.fn()}
          onToggleEnabled={vi.fn()}
          onReorder={vi.fn()}
          onStartChat={vi.fn()}
        />
      </ConfigProvider>
    );

    const rows = screen.getAllByTestId(/^enabled-assistant-row-/);
    expect(rows.map((row) => row.getAttribute('data-testid'))).toEqual([
      'enabled-assistant-row-official',
      'enabled-assistant-row-custom',
      'enabled-assistant-row-cli',
    ]);
    expect(screen.queryByTestId('enabled-assistant-row-disabled')).not.toBeInTheDocument();
    expect(screen.getByText('Official')).toBeInTheDocument();
    expect(screen.getByText('Custom')).toBeInTheDocument();
    expect(screen.getByText('CLI')).toBeInTheDocument();
    // Runtime engine is shown with a label + logo (same "Agent: {logo}" style as
    // the My Assistants cards, i18n key `assistantRuntimeLabel`), not a bare
    // backend name. The label renders once per enabled row.
    expect(screen.getAllByTestId(/^assistant-runtime-/).length).toBe(3);
    expect(screen.queryByText('claude')).not.toBeInTheDocument();
    // Each enabled row exposes an enable switch so users can disable in place.
    expect(screen.getByTestId('switch-enabled-official')).toBeInTheDocument();
    expect(screen.getByTestId('switch-enabled-cli')).toBeInTheDocument();
  });

  it('disables enabled-assistant dragging while search is active', () => {
    const assistants = [
      { id: 'cli', name: 'Codex', sort_order: 1, source: 'generated', enabled: true },
      { id: 'official', name: 'Cowork', sort_order: 2, source: 'builtin', enabled: true },
    ] as AssistantListItem[];

    render(
      <ConfigProvider>
        <EnabledAssistantsList
          assistants={assistants}
          assistantOrder={[]}
          localeKey='en-US'
          searchActive
          onOpenDetail={vi.fn()}
          onToggleEnabled={vi.fn()}
          onReorder={vi.fn()}
          onStartChat={vi.fn()}
        />
      </ConfigProvider>
    );

    expect(screen.getByTestId('enabled-reorder-search-hint')).toHaveTextContent('Clear search to reorder.');
    expect(screen.getByTestId('enabled-assistant-reorder-handle-cli')).toBeDisabled();
    expect(screen.getByTestId('enabled-assistant-reorder-handle-official')).toBeDisabled();
  });

  it('exposes a quick-chat button on each enabled row and fires onStartChat', () => {
    const onStartChat = vi.fn();
    const onOpenDetail = vi.fn();
    const assistants = [
      {
        id: 'cli',
        name: 'Codex',
        sort_order: 1,
        source: 'generated',
        enabled: true,
        agent: { type: 'acp', source: 'builtin', acp_backend: 'codex' },
      },
    ] as AssistantListItem[];

    render(
      <ConfigProvider>
        <EnabledAssistantsList
          assistants={assistants}
          assistantOrder={[]}
          localeKey='en-US'
          searchActive={false}
          onOpenDetail={onOpenDetail}
          onToggleEnabled={vi.fn()}
          onReorder={vi.fn()}
          onStartChat={onStartChat}
        />
      </ConfigProvider>
    );

    const chatButton = screen.getByTestId('btn-chat-cli');
    expect(chatButton).toBeInTheDocument();

    fireEvent.click(chatButton);
    // Clicking chat starts a conversation and must not open the detail editor.
    expect(onStartChat).toHaveBeenCalledTimes(1);
    expect(onStartChat).toHaveBeenCalledWith(expect.objectContaining({ id: 'cli' }));
    expect(onOpenDetail).not.toHaveBeenCalled();
  });

  it('uses the homepage avatar treatment without cropping runtime logos', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: true, text: () => Promise.resolve('<svg></svg>') }))
    );
    const assistants = [
      {
        id: 'claude',
        name: 'Claude',
        avatar: 'https://example.com/claude.svg',
        sort_order: 1,
        source: 'generated',
        enabled: true,
        agent: { type: 'acp', source: 'builtin', acp_backend: 'claude' },
      },
    ] as AssistantListItem[];

    render(
      <ConfigProvider>
        <EnabledAssistantsList
          assistants={assistants}
          assistantOrder={[]}
          localeKey='en-US'
          searchActive={false}
          onOpenDetail={vi.fn()}
          onToggleEnabled={vi.fn()}
          onReorder={vi.fn()}
          onStartChat={vi.fn()}
        />
      </ConfigProvider>
    );

    // Wait for ThemedLogo detection to settle
    await act(async () => {
      await Promise.resolve();
    });

    const row = screen.getByTestId('enabled-assistant-row-claude');
    expect(row.querySelector('.arco-avatar-circle')).toHaveStyle({ height: '20px', width: '20px' });
    const logo = row.querySelector('img, span[role="img"]');
    expect(logo).not.toBeNull();
    expect(logo).toHaveClass('object-contain');
    vi.unstubAllGlobals();
  });

  describe('TsAssistantSettings', () => {
    const setupAssistants = (assistants: AssistantListItem[]) => {
      useAssistantListMock.mockReturnValue({
        ...useAssistantListMock(),
        assistants,
        activeAssistant: assistants[0] ?? null,
      });
      useAssistantEditorMock.mockReturnValue({ ...useAssistantEditorMock(), editVisible: false });
    };
    const renderTs = (entry: string | { pathname: string; state: unknown } = '/assistants') =>
      render(
        <ConfigProvider>
          <MemoryRouter initialEntries={[entry]}>
            <TsAssistantSettings />
          </MemoryRouter>
        </ConfigProvider>
      );

    beforeEach(() => {
      sessionStorage.clear();
    });

    it('shows only enabled official assistants alongside enabled and disabled custom assistants', () => {
      setupAssistants([
        createAssistant('official', 'builtin'),
        createAssistant('hidden-official', 'builtin', false),
        createAssistant('custom', 'user'),
        createAssistant('disabled-custom', 'user', false),
      ]);
      renderTs();
      expect(screen.getAllByRole('article')).toHaveLength(3);
      expect(screen.queryByTestId('ts-assistant-hidden-official')).not.toBeInTheDocument();
      expect(screen.getByTestId('ts-assistant-disabled-custom')).toBeInTheDocument();
    });

    it.each([true, false])('hides generated assistants with enabled=%s from the list and search', (enabled) => {
      setupAssistants([createAssistant('generated', 'generated', enabled), createAssistant('custom', 'user')]);
      renderTs();
      expect(screen.queryByTestId('ts-assistant-generated')).not.toBeInTheDocument();
      expect(screen.getByTestId('ts-assistant-custom')).toBeInTheDocument();
      fireEvent.change(screen.getByTestId('ts-search-assistants'), { target: { value: 'generated' } });
      expect(screen.getByText('settings.assistantNoMatch')).toBeInTheDocument();
    });

    it('shows the empty state when only generated assistants exist', () => {
      setupAssistants([createAssistant('generated', 'generated')]);
      renderTs();
      expect(screen.queryByRole('article')).not.toBeInTheDocument();
      expect(screen.getByText('settings.assistantsEmpty')).toBeInTheDocument();
    });

    it('provides one manual create action without tabs or chat creation', () => {
      setupAssistants([]);
      renderTs();
      expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
      expect(screen.getAllByRole('button')).toHaveLength(1);
      fireEvent.click(screen.getByTestId('ts-create-assistant'));
      expect(useAssistantEditorMock().handleCreate).toHaveBeenCalledTimes(1);
    });

    it('opens an official assistant as read-only without invoking the editor', () => {
      setupAssistants([createAssistant('official', 'builtin')]);
      renderTs();
      const official = within(screen.getByTestId('ts-assistant-official'));
      expect(official.queryByRole('switch')).not.toBeInTheDocument();
      fireEvent.click(official.getByRole('button'));
      expect(screen.getByTestId('ts-readonly-detail')).toBeInTheDocument();
      expect(useAssistantEditorMock().handleEdit).not.toHaveBeenCalled();
    });

    it('allows editing a disabled custom assistant', () => {
      const assistant = createAssistant('custom', 'user', false);
      setupAssistants([assistant]);
      renderTs();
      fireEvent.click(screen.getByTestId('ts-open-custom'));
      expect(useAssistantEditorMock().handleEdit).toHaveBeenCalledWith(assistant);
    });

    it('allows toggling a disabled custom assistant on', () => {
      const assistant = createAssistant('custom', 'user', false);
      setupAssistants([assistant]);
      renderTs();
      fireEvent.click(screen.getByTestId('ts-toggle-custom'));
      expect(useAssistantEditorMock().handleToggleEnabled).toHaveBeenCalledWith(assistant, true);
    });

    it('requests confirmation before deleting a custom assistant', () => {
      const assistant = createAssistant('custom', 'user');
      setupAssistants([assistant]);
      renderTs();
      fireEvent.click(screen.getByTestId('ts-delete-custom'));
      expect(useAssistantEditorMock().handleDeleteRequest).toHaveBeenCalledWith(assistant);
      expect(useAssistantEditorMock().handleDeleteConfirm).not.toHaveBeenCalled();
    });

    it('filters localized names and descriptions with case-insensitive trimmed search', () => {
      const assistant = createAssistant('custom', 'user');
      assistant.name_i18n = { 'en-US': 'Research Writer' };
      assistant.description_i18n = { 'en-US': 'Summarize papers' };
      setupAssistants([assistant, createAssistant('official', 'builtin')]);
      renderTs();
      fireEvent.change(screen.getByTestId('ts-search-assistants'), { target: { value: '  PAPERS ' } });
      expect(screen.getAllByRole('article')).toHaveLength(1);
      fireEvent.change(screen.getByTestId('ts-search-assistants'), { target: { value: 'research' } });
      expect(screen.getByTestId('ts-assistant-custom')).toBeInTheDocument();
    });

    it('shows an empty search result and restores assistants when cleared', () => {
      setupAssistants([createAssistant('custom', 'user')]);
      renderTs();
      fireEvent.change(screen.getByTestId('ts-search-assistants'), { target: { value: 'missing' } });
      expect(screen.getByText('settings.assistantNoMatch')).toBeInTheDocument();
      fireEvent.change(screen.getByTestId('ts-search-assistants'), { target: { value: '' } });
      expect(screen.getByTestId('ts-assistant-custom')).toBeInTheDocument();
    });

    it('preserves the current search when returning from official details', () => {
      setupAssistants([createAssistant('official', 'builtin')]);
      renderTs();
      fireEvent.change(screen.getByTestId('ts-search-assistants'), { target: { value: 'official' } });
      fireEvent.click(screen.getByTestId('ts-open-official'));
      fireEvent.click(screen.getByRole('button', { name: 'Back' }));
      expect(screen.getByTestId('ts-search-assistants')).toHaveValue('official');
    });

    it('opens official deep links as read-only and consumes session intent', () => {
      setupAssistants([createAssistant('official', 'builtin')]);
      sessionStorage.setItem(
        'guid.openAssistantEditorIntent',
        JSON.stringify({
          assistantId: 'official',
          openAssistantEditor: true,
        })
      );
      renderTs();
      expect(screen.getByTestId('ts-readonly-detail')).toBeInTheDocument();
      expect(useAssistantEditorMock().handleEdit).not.toHaveBeenCalled();
      expect(sessionStorage.getItem('guid.openAssistantEditorIntent')).toBeNull();
    });

    it('does not expose disabled official assistants through navigation state', () => {
      setupAssistants([createAssistant('official', 'builtin', false)]);
      renderTs({ pathname: '/assistants', state: { openAssistantEditor: true, openAssistantId: 'official' } });
      expect(screen.queryByTestId('ts-readonly-detail')).not.toBeInTheDocument();
      expect(useAssistantEditorMock().handleEdit).not.toHaveBeenCalled();
    });

    it('opens custom highlight links in the editor', () => {
      const assistant = createAssistant('custom', 'user');
      setupAssistants([assistant]);
      renderTs('/assistants?highlight=custom');
      expect(useAssistantEditorMock().handleEdit).toHaveBeenCalledWith(assistant);
    });

    it('preserves old settings links and their navigation state', () => {
      const TsLocation = () => {
        const location = useLocation();
        return <div data-testid='ts-location'>{JSON.stringify(location)}</div>;
      };
      const state = { openAssistantEditor: true, openAssistantId: 'custom' };
      render(
        <MemoryRouter initialEntries={[{ pathname: '/settings/assistants', search: '?highlight=custom', state }]}>
          <Routes>
            <Route path='/settings/assistants' element={<TsAssistantRedirect />} />
            <Route path='/assistants' element={<TsLocation />} />
          </Routes>
        </MemoryRouter>
      );
      expect(JSON.parse(screen.getByTestId('ts-location').textContent || '{}')).toMatchObject({
        pathname: '/assistants',
        search: '?highlight=custom',
        state,
      });
    });
  });
});
