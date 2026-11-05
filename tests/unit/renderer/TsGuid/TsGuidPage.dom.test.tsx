/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { render } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  modelSelectionMock,
  agentSelectionMock,
  locationMock,
  guidInputMock,
  capturedGuidActionRowProps,
  capturedAssistantSelectionAreaProps,
  capturedGuidInputCardProps,
  capturedGuidSendDeps,
  resolveGuidAssistantDefaultsMock,
  sendMock,
  navigateMock,
} = vi.hoisted(() => ({
  modelSelectionMock: {
    modelList: [],
    isGoogleAuth: false,
    current_model: undefined,
    setCurrentModel: vi.fn(),
    resetCurrentModel: vi.fn(),
  },
  agentSelectionMock: {
    selectedAssistantId: 'custom-assistant',
    selectedAssistant: {
      id: 'custom-assistant',
      source: 'user',
      name: 'Aion CLI',
      name_i18n: {},
      description_i18n: {},
      enabled: true,
      sort_order: 10,
      preset_agent_type: 'aionrs',
      enabled_skills: [],
      custom_skill_names: [],
      disabled_builtin_skills: [],
      context_i18n: {},
      prompts: [],
      prompts_i18n: {},
      models: [],
      agent_status: 'online',
      team_selectable: true,
      deletable: false,
    },
    assistants: [
      {
        id: 'custom-assistant',
        source: 'user',
        name: 'Aion CLI',
        name_i18n: {},
        description_i18n: {},
        enabled: true,
        sort_order: 10,
        preset_agent_type: 'aionrs',
        enabled_skills: [],
        custom_skill_names: [],
        disabled_builtin_skills: [],
        context_i18n: {},
        prompts: [],
        prompts_i18n: {},
        models: [],
        agent_status: 'online',
        team_selectable: true,
        deletable: false,
      },
    ],
    selectedAssistantBackend: 'aionrs',
    selectedAssistantAvailable: true,
    currentAgentModeOptions: [],
    selectedMode: 'default',
    setSelectedMode: vi.fn(),
    selectedAcpModel: null,
    setSelectedAcpModel: vi.fn(),
    currentAcpCachedModelInfo: null,
    defaultAssistantId: 'custom-assistant',
    setSelectedAssistantId: vi.fn(),
  },
  guidInputMock: {
    input: '',
    setInput: vi.fn(),
    files: [],
    setFiles: vi.fn(),
    dir: '',
    setDir: vi.fn(),
    loading: false,
    setLoading: vi.fn(),
    isInputFocused: false,
    isFileDragging: false,
    dragHandlers: {},
    onPaste: vi.fn(),
    handleTextareaFocus: vi.fn(),
    handleTextareaBlur: vi.fn(),
    handleFilesUploaded: vi.fn(),
    handleRemoveFile: vi.fn(),
  },
  locationMock: {
    state: null as unknown,
    key: 'guid-location',
    pathname: '/guid',
    search: '',
    hash: '',
  },
  capturedGuidActionRowProps: [] as Array<Record<string, unknown>>,
  capturedAssistantSelectionAreaProps: [] as Array<Record<string, unknown>>,
  capturedGuidInputCardProps: [] as Array<Record<string, unknown>>,
  capturedGuidSendDeps: [] as Array<Record<string, unknown>>,
  resolveGuidAssistantDefaultsMock: vi.fn(() => ({
    disabledBuiltinSkillIds: [],
    skillIds: [],
    mcpIds: [],
  })),
  sendMock: {
    handleSend: vi.fn(),
    sendMessageHandler: vi.fn(),
    isButtonDisabled: false,
  },
  navigateMock: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string; [key: string]: unknown }) => options?.defaultValue || key,
    i18n: { language: 'en-US' },
  }),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
  useLocation: () => locationMock,
}));

vi.mock('@/common', () => ({
  ipcBridge: {
    fs: {
      listAvailableSkills: { invoke: vi.fn().mockResolvedValue([]) },
    },
  },
}));

vi.mock('@/renderer/hooks/mcp/catalog', () => ({
  ensureBackendMcpCatalog: vi.fn().mockResolvedValue({ allServers: [] }),
}));

vi.mock('@/renderer/hooks/chat/useInputFocusRing', () => ({
  useInputFocusRing: () => ({
    activeBorderColor: '#000',
    inactiveBorderColor: '#ccc',
    activeShadow: 'none',
  }),
}));

vi.mock('@/renderer/pages/guid/hooks/useGuidModelSelection', () => ({
  useGuidModelSelection: () => modelSelectionMock,
}));

const useTsGuidAssistantSelectionMock = vi.fn(() => agentSelectionMock);

vi.mock('@/renderer/pages/TsGuid/useTsGuidAssistantSelection', () => ({
  useTsGuidAssistantSelection: (...args: unknown[]) => useTsGuidAssistantSelectionMock(...args),
  resolveAssistantSelectionKey: vi.fn(),
  pickDefaultAssistantSelectionKey: vi.fn(),
}));

vi.mock('@/renderer/pages/guid/hooks/useGuidInput', () => ({
  useGuidInput: () => guidInputMock,
}));

vi.mock('@/renderer/pages/guid/hooks/useGuidSend', () => ({
  useGuidSend: (deps: Record<string, unknown>) => {
    capturedGuidSendDeps.push(deps);
    return sendMock;
  },
}));

vi.mock('@/renderer/pages/guid/hooks/useTypewriterPlaceholder', () => ({
  useTypewriterPlaceholder: () => '',
}));

vi.mock('@/renderer/pages/TsGuid/TsAssistantSelector', () => ({
  default: (props: Record<string, unknown>) => {
    capturedAssistantSelectionAreaProps.push(props);
    return <div data-testid='assistant-selection-area' />;
  },
}));

vi.mock('@/renderer/pages/guid/components/GuidActionRow', () => ({
  default: (props: Record<string, unknown>) => {
    capturedGuidActionRowProps.push(props);
    return <div data-testid='guid-action-row' />;
  },
}));

vi.mock('@/renderer/pages/guid/components/GuidInputCard', () => ({
  default: (props: Record<string, unknown>) => {
    capturedGuidInputCardProps.push(props);
    return <div data-testid='guid-input-card'>{props.actionRow as React.ReactNode}</div>;
  },
}));

vi.mock('@/renderer/pages/guid/components/GuidModelSelector', () => ({
  default: () => <div data-testid='guid-model-selector' />,
}));

vi.mock('@/renderer/pages/guid/components/QuickActionButtons', () => ({
  default: () => <div data-testid='guid-quick-actions' />,
}));

vi.mock('@/renderer/components/settings/SettingsModal/contents/FeedbackReportModal', () => ({
  default: () => null,
}));

vi.mock('@/renderer/components/chat/SpeechInputButton', () => ({
  default: () => null,
}));

vi.mock('@/renderer/hooks/system/useLiveTranscriptInsertion', () => ({
  useLiveTranscriptInsertion: () => ({ handleLiveTranscript: vi.fn() }),
}));

vi.mock('@/renderer/hooks/system/useSpeechInput', () => ({
  appendSpeechTranscript: (prev: string, next: string) => `${prev}${next}`,
}));

vi.mock('@/renderer/utils/platform', () => ({
  openExternalUrl: vi.fn(),
  resolveExtensionAssetUrl: vi.fn(),
  resolveBackendAssetUrl: vi.fn((path: string) => path),
}));

vi.mock('@/renderer/pages/guid/utils/assistantDefaults', () => ({
  resolveGuidAssistantDefaults: (...args: unknown[]) => resolveGuidAssistantDefaultsMock(...args),
}));

const swrMock = vi.hoisted(() => ({
  useSWRMock: vi.fn(),
}));

vi.mock('swr', async () => {
  const actual = await vi.importActual<typeof import('swr')>('swr');
  return {
    ...actual,
    default: swrMock.useSWRMock,
    mutate: vi.fn(),
  };
});

import TsGuidPage from '@/renderer/pages/TsGuid/TsGuidPage';

describe('Ts new-conversation page integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    locationMock.state = null;
    locationMock.key = 'ts-guid-location';
    swrMock.useSWRMock.mockReturnValue({ data: null });
    capturedGuidActionRowProps.length = 0;
    capturedAssistantSelectionAreaProps.length = 0;
    capturedGuidInputCardProps.length = 0;
    capturedGuidSendDeps.length = 0;
    guidInputMock.input = 'Draft to preserve';
    sendMock.isButtonDisabled = false;
  });

  it('switches the assistant without clearing the current draft, attachments or workspace', () => {
    render(<TsGuidPage />);
    guidInputMock.setInput.mockClear();
    guidInputMock.setFiles.mockClear();
    guidInputMock.setDir.mockClear();
    const select = capturedAssistantSelectionAreaProps.at(-1)?.onSelectAssistant as (id: string) => void;
    select('official');
    expect(agentSelectionMock.setSelectedAssistantId).toHaveBeenCalledWith('official');
    expect(guidInputMock.setInput).not.toHaveBeenCalled();
    expect([guidInputMock.setFiles.mock.calls, guidInputMock.setDir.mock.calls]).toEqual([[], []]);
  });

  it('passes the selected assistant and draft into the original send flow', () => {
    render(<TsGuidPage />);
    expect(capturedGuidSendDeps.at(-1)).toMatchObject({
      input: 'Draft to preserve',
      selectedAssistantId: 'custom-assistant',
      selectedAssistantBackend: 'aionrs',
    });
  });

  it('preserves navigation prompt prefills in the reused input', () => {
    locationMock.state = { prefillPrompt: 'Prepare a release plan' };
    render(<TsGuidPage />);
    expect(guidInputMock.setInput).toHaveBeenCalledWith('Prepare a release plan');
  });

  it('clears the previous draft when the sidebar starts another conversation', () => {
    const { rerender } = render(<TsGuidPage />);
    guidInputMock.setInput.mockClear();
    locationMock.key = 'next-conversation';
    locationMock.state = { resetAssistant: true };
    rerender(<TsGuidPage />);
    expect(guidInputMock.setInput).toHaveBeenCalledWith('');
    expect(useTsGuidAssistantSelectionMock).toHaveBeenLastCalledWith({
      resetAssistant: true,
      preselectAssistantId: undefined,
      locationKey: 'next-conversation',
    });
  });

  it('uses the same send handler for Enter and the input action button', () => {
    render(<TsGuidPage />);
    const onKeyDown = capturedGuidInputCardProps.at(-1)?.onKeyDown as (event: unknown) => void;
    onKeyDown({ key: 'Enter', shiftKey: false, preventDefault: vi.fn() });
    expect(sendMock.sendMessageHandler).toHaveBeenCalledOnce();
    expect(capturedGuidActionRowProps.at(-1)?.onSend).toBe(sendMock.sendMessageHandler);
  });

  it('does not submit when the send gate is disabled', () => {
    sendMock.isButtonDisabled = true;
    render(<TsGuidPage />);
    const onKeyDown = capturedGuidInputCardProps.at(-1)?.onKeyDown as (event: unknown) => void;
    onKeyDown({ key: 'Enter', shiftKey: false, preventDefault: vi.fn() });
    expect(sendMock.sendMessageHandler).not.toHaveBeenCalled();
  });
});
