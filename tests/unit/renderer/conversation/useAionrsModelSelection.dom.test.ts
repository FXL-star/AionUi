import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { TProviderWithModel } from '@/common/config/storage';
import { useAionrsModelSelection } from '@/renderer/pages/conversation/platforms/aionrs/useAionrsModelSelection';

vi.mock('@/renderer/hooks/agent/useModelProviderList', () => ({
  useModelProviderList: () => ({
    providers: [],
    getAvailableModels: () => [],
    formatModelLabel: (_model: unknown, modelName: string) => modelName,
  }),
}));

const makeModel = (use_model: string): TProviderWithModel => ({ id: 'provider-1', use_model }) as TProviderWithModel;

describe('useAionrsModelSelection', () => {
  it('treats the legacy default placeholder as no selected model', () => {
    const { result } = renderHook(() =>
      useAionrsModelSelection({ initialModel: makeModel('default'), onSelectModel: vi.fn() })
    );

    expect(result.current.current_model).toBeUndefined();
  });

  it('preserves a real model and allows selecting a replacement', async () => {
    const onSelectModel = vi.fn().mockResolvedValue(true);
    const { result } = renderHook(() => useAionrsModelSelection({ initialModel: makeModel('gpt-5.2'), onSelectModel }));

    expect(result.current.current_model?.use_model).toBe('gpt-5.2');
    await result.current.handleSelectModel({ id: 'provider-1' } as never, 'gpt-5.3');
    await waitFor(() => expect(result.current.current_model?.use_model).toBe('gpt-5.3'));
  });
});
