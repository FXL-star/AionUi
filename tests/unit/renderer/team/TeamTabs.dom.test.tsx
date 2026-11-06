import React from 'react';
import { fireEvent, render, renderHook, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TeamAssistant } from '@/common/types/team/teamTypes';

vi.mock('@/renderer/pages/team/components/AgentStatusBadge', () => ({
  default: ({ testId }: { testId: string }) => <span data-testid={testId} />,
}));

vi.mock('@/renderer/pages/team/components/TeamAgentIdentity', () => ({
  default: ({ assistant_name, nameTestId }: { assistant_name: string; nameTestId?: string }) => (
    <span data-testid={nameTestId}>{assistant_name}</span>
  ),
}));

vi.mock('@/renderer/pages/team/components/memberPicker/TeamAddMemberPopover', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import TeamTabs from '@/renderer/pages/team/components/TeamTabs';
import { TeamTabsProvider } from '@/renderer/pages/team/hooks/TeamTabsContext';
import { TeamPermissionProvider, useTeamPermission } from '@/renderer/pages/team/hooks/TeamPermissionContext';
import { ipcBridge } from '@/common';

vi.mock('@/common', () => ({
  ipcBridge: {
    team: {
      setSessionMode: { invoke: vi.fn() },
      ensureSession: { invoke: vi.fn(async () => {}) },
      getConfigOptions: { invoke: vi.fn(async () => ({ config_options: [] })) },
      setConfigOption: { invoke: vi.fn() },
    },
  },
}));

const renameAssistantMock = vi.fn();
const removeAssistantMock = vi.fn();
const addAssistantMock = vi.fn();

const assistants: TeamAssistant[] = [
  {
    slot_id: 'lead-slot',
    conversation_id: 'lead-conv',
    role: 'leader',
    assistant_backend: 'claude',
    assistant_name: 'Lead',
    status: 'idle',
  },
  {
    slot_id: 'worker-slot',
    conversation_id: 'worker-conv',
    role: 'teammate',
    assistant_backend: 'claude',
    assistant_name: 'Worker',
    status: 'idle',
  },
];

const renderTabs = (warmingUp: boolean, readOnly = false) =>
  render(
    <TeamTabsProvider
      assistants={assistants}
      statusMap={new Map()}
      defaultActiveSlotId='lead-slot'
      team_id='team-1'
      renameAssistant={renameAssistantMock}
      removeAssistant={removeAssistantMock}
      addAssistant={addAssistantMock}
      readOnly={readOnly}
    >
      <TeamTabs warmingUp={warmingUp} />
    </TeamTabsProvider>
  );

describe('TeamTabs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    renameAssistantMock.mockReset();
    localStorage.clear();
  });

  it('hides all member mutation controls for built-in teams after warmup', () => {
    renderTabs(false, true);
    const worker = screen.getByTestId('team-tab-worker-slot');
    fireEvent.mouseEnter(worker);
    fireEvent.doubleClick(worker);
    expect(screen.queryAllByTestId(/team-tab-(edit|remove|drag|add-member)/)).toHaveLength(0);
    expect(screen.queryByDisplayValue('Worker')).not.toBeInTheDocument();
    expect(renameAssistantMock).not.toHaveBeenCalled();
  });

  it('still lets a built-in team switch between member conversations', () => {
    renderTabs(false, true);
    fireEvent.click(screen.getByTestId('team-tab-worker-slot'));
    expect(screen.getByTestId('team-tab-worker-slot')).toHaveAttribute('data-active', 'true');
  });

  it('keeps custom team add and remove controls enabled after warmup', () => {
    renderTabs(false);
    fireEvent.mouseEnter(screen.getByTestId('team-tab-worker-slot'));
    fireEvent.click(screen.getByTestId('team-tab-remove-worker-slot'));
    expect(screen.getByTestId('team-tab-add-member')).not.toBeDisabled();
    expect(removeAssistantMock).toHaveBeenCalledWith('worker-slot');
  });

  it('blocks built-in configuration writes while leaving reads and warmup available', async () => {
    const { result } = renderHook(() => useTeamPermission(), {
      wrapper: ({ children }) => (
        <TeamPermissionProvider
          team_id='team-1'
          readOnly
          isLeaderAgent
          leaderConversationId='lead-conv'
          allConversationIds={['lead-conv']}
          runtimeStartingConversationIds={new Set()}
        >
          {children}
        </TeamPermissionProvider>
      ),
    });
    const context = result.current!;
    expect(context.configOptionsPort.isConfigOptionBlocked?.('lead-conv', 'model', 'model')).toBe(true);
    await expect(context.configOptionsPort.setConfigOption?.('lead-conv', 'model', 'other')).rejects.toThrow(
      'BUILTIN_TEAM_IMMUTABLE'
    );
    context.propagateMode('auto');
    await context.warmupSession();
    await context.configOptionsPort.load('lead-conv');
    expect(ipcBridge.team.setConfigOption.invoke).not.toHaveBeenCalled();
    expect(ipcBridge.team.setSessionMode.invoke).not.toHaveBeenCalled();
    expect(ipcBridge.team.ensureSession.invoke).toHaveBeenCalledWith({ team_id: 'team-1' });
    expect(ipcBridge.team.getConfigOptions.invoke).toHaveBeenCalledWith({
      team_id: 'team-1',
      conversation_id: 'lead-conv',
    });
  });

  it('does not allow tab rename while the team is still warming up', () => {
    renderTabs(true);

    fireEvent.doubleClick(screen.getByTestId('team-tab-worker-slot'));

    expect(screen.queryByTestId('team-tab-edit-worker-slot')).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue('Worker')).not.toBeInTheDocument();
    expect(renameAssistantMock).not.toHaveBeenCalled();
  });

  it('allows member ops once warmup has ended (ready or failed)', () => {
    renderTabs(false);

    // hover reveals the rename affordance and double-click enters edit mode
    fireEvent.mouseEnter(screen.getByTestId('team-tab-worker-slot'));
    fireEvent.doubleClick(screen.getByTestId('team-tab-worker-slot'));

    expect(screen.getByDisplayValue('Worker')).toBeInTheDocument();
  });

  it('reveals a drag handle on teammate hover but never on the leader', () => {
    renderTabs(false);

    fireEvent.mouseEnter(screen.getByTestId('team-tab-worker-slot'));
    expect(screen.getByTestId('team-tab-drag-worker-slot')).toBeInTheDocument();

    fireEvent.mouseEnter(screen.getByTestId('team-tab-lead-slot'));
    expect(screen.queryByTestId('team-tab-drag-lead-slot')).not.toBeInTheDocument();
  });

  it('does not switch tabs when the drag handle is clicked', () => {
    renderTabs(false);

    // Active tab starts as the leader
    expect(screen.getByTestId('team-tab-lead-slot')).toHaveAttribute('data-active', 'true');

    fireEvent.mouseEnter(screen.getByTestId('team-tab-worker-slot'));
    fireEvent.click(screen.getByTestId('team-tab-drag-worker-slot'));

    expect(screen.getByTestId('team-tab-lead-slot')).toHaveAttribute('data-active', 'true');
    expect(screen.getByTestId('team-tab-worker-slot')).toHaveAttribute('data-active', 'false');
  });
});
