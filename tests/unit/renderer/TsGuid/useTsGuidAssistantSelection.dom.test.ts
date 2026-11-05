import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Assistant } from '@/common/types/agent/assistantTypes';
import { useTsGuidAssistantSelection } from '@renderer/pages/TsGuid/useTsGuidAssistantSelection';
import { tsAssistantFixture } from './tsAssistantFixture';

const { getConfig, setConfig } = vi.hoisted(() => ({ getConfig: vi.fn(), setConfig: vi.fn() }));
let assistants: Assistant[] = [];
const managedAgents: never[] = [];

vi.mock('@/common/config/configService', () => ({ configService: { get: getConfig, set: setConfig } }));
vi.mock('@renderer/pages/guid/hooks/useCustomAgentsLoader', () => ({
  useCustomAgentsLoader: () => ({ assistants }),
}));
vi.mock('@/renderer/hooks/agent/useManagedAgents', () => ({
  useManagedAgentRuntimeCatalog: () => managedAgents,
}));

describe('Ts new-conversation assistant selection', () => {
  beforeEach(() => {
    getConfig.mockReset();
    setConfig.mockReset().mockResolvedValue(undefined);
    assistants = [
      tsAssistantFixture('generated', { source: 'generated' }),
      tsAssistantFixture('official', { source: 'builtin' }),
      tsAssistantFixture('custom'),
      tsAssistantFixture('disabled', { enabled: false }),
    ];
  });

  it('excludes generated and disabled assistants from both candidates and defaults', () => {
    const { result } = renderHook(() => useTsGuidAssistantSelection({}));
    expect(result.current.assistants.map((assistant) => assistant.id)).toEqual(['custom', 'official']);
    expect(result.current.selectedAssistantId).toBe('custom');
    expect(result.current.defaultAssistantId).toBe('custom');
  });

  it.each(['generated', 'disabled', 'deleted'])('ignores an unavailable saved selection: %s', (savedId) => {
    getConfig.mockReturnValue(savedId);
    const { result } = renderHook(() => useTsGuidAssistantSelection({ resetAssistant: true }));
    expect(result.current.selectedAssistantId).toBe('custom');
  });

  it.each(['generated', 'disabled', 'deleted'])('ignores an unavailable navigation selection: %s', (id) => {
    const { result } = renderHook(() => useTsGuidAssistantSelection({ preselectAssistantId: id }));
    expect(result.current.selectedAssistantId).toBe('custom');
  });

  it('honors an official assistant passed by navigation', () => {
    const { result } = renderHook(() =>
      useTsGuidAssistantSelection({ preselectAssistantId: 'official', resetAssistant: true })
    );
    expect(result.current.selectedAssistantId).toBe('official');
  });

  it('persists a manual switch and restores it on the next visit', () => {
    const first = renderHook(() => useTsGuidAssistantSelection({}));
    act(() => first.result.current.setSelectedAssistantId('official'));
    expect(setConfig).toHaveBeenCalledWith('guid.lastAssistantId', 'official');
    first.unmount();
    getConfig.mockReturnValue('official');
    const next = renderHook(() => useTsGuidAssistantSelection({ resetAssistant: true }));
    expect(next.result.current.selectedAssistantId).toBe('official');
  });

  it('refuses programmatic selection of a generated assistant', () => {
    const { result } = renderHook(() => useTsGuidAssistantSelection({}));
    act(() => result.current.setSelectedAssistantId('generated'));
    expect(result.current.selectedAssistantId).toBe('custom');
    expect(setConfig).not.toHaveBeenCalled();
  });

  it('recovers when the selected assistant is disabled during a catalog refresh', () => {
    const { result, rerender } = renderHook(() => useTsGuidAssistantSelection({ resetAssistant: true }));
    assistants = assistants.map((assistant) =>
      assistant.id === 'custom' ? { ...assistant, enabled: false } : assistant
    );
    rerender();
    expect(result.current.selectedAssistantId).toBe('official');
  });

  it('returns no selected assistant if the catalog has no eligible entries', () => {
    assistants = [tsAssistantFixture('generated', { source: 'generated' })];
    const { result } = renderHook(() => useTsGuidAssistantSelection({}));
    expect(result.current.selectedAssistantId).toBeNull();
    expect(result.current.selectedAssistantAvailable).toBe(false);
    expect(result.current.assistants).toEqual([]);
  });

  it('selects an eligible assistant when an initially empty catalog finishes loading', () => {
    assistants = [];
    const { result, rerender } = renderHook(() => useTsGuidAssistantSelection({ resetAssistant: true }));
    assistants = [tsAssistantFixture('official', { source: 'builtin' })];
    rerender();
    expect(result.current.selectedAssistantId).toBe('official');
  });
});
