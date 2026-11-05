import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import React, { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import TsAssistantSelector from '@renderer/pages/TsGuid/TsAssistantSelector';
import { tsAssistantFixture } from './tsAssistantFixture';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock('@renderer/hooks/assistant/useAssistantOrder', () => ({
  useAssistantOrder: () => ({ assistantOrder: ['official', 'custom'] }),
}));
vi.mock('@renderer/pages/settings/AssistantSettings/AssistantAvatar', () => ({ default: () => null }));

const assistants = [
  tsAssistantFixture('generated', { source: 'generated' }),
  tsAssistantFixture('official', { source: 'builtin', name_i18n: { 'zh-CN': '官方助手' } }),
  tsAssistantFixture('custom', { description: 'Review project code' }),
  tsAssistantFixture('disabled', { enabled: false }),
];

const renderSelector = () => {
  const onSelect = vi.fn();
  const Harness = () => {
    const [selected, setSelected] = useState('official');
    return (
      <TsAssistantSelector
        assistants={assistants}
        selectedAssistantId={selected}
        localeKey='zh-CN'
        onSelectAssistant={(id) => {
          onSelect(id);
          setSelected(id);
        }}
      />
    );
  };
  render(<Harness />);
  return onSelect;
};

describe('Ts assistant switch dialog', () => {
  it('shows the localized current assistant and opens an eligible-only dialog', () => {
    renderSelector();
    expect(screen.getByTestId('ts-selected-assistant')).toHaveTextContent('官方助手');
    fireEvent.click(screen.getByRole('button', { name: 'guid.tsSwitchAssistant' }));
    const dialog = within(screen.getByRole('dialog'));
    expect(dialog.getAllByRole('button', { pressed: false })).toHaveLength(1);
    expect(dialog.queryByText(/generated|disabled/)).not.toBeInTheDocument();
  });

  it('switches the assistant and closes the dialog', async () => {
    const onSelect = renderSelector();
    fireEvent.click(screen.getByRole('button', { name: 'guid.tsSwitchAssistant' }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /custom/ }));
    expect(onSelect).toHaveBeenCalledWith('custom');
    expect(screen.getByTestId('ts-selected-assistant')).toHaveTextContent('custom');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('searches assistant descriptions and reports unmatched searches', () => {
    renderSelector();
    fireEvent.click(screen.getByRole('button', { name: 'guid.tsSwitchAssistant' }));
    const search = screen.getByRole('textbox', { name: 'settings.searchAssistants' });
    fireEvent.change(search, { target: { value: 'project code' } });
    const dialog = within(screen.getByRole('dialog'));
    expect(dialog.getByRole('button', { name: /custom/ })).toBeInTheDocument();
    expect(dialog.queryByText('官方助手')).not.toBeInTheDocument();
    fireEvent.change(search, { target: { value: 'generated' } });
    expect(dialog.getByText('settings.assistantNoMatch')).toBeInTheDocument();
  });

  it('shows an empty state when only generated assistants exist', () => {
    render(
      <TsAssistantSelector
        assistants={[assistants[0]]}
        selectedAssistantId='generated'
        localeKey='en-US'
        onSelectAssistant={vi.fn()}
      />
    );
    expect(screen.getByTestId('ts-selected-assistant')).toHaveTextContent('guid.selectAssistantHint');
    fireEvent.click(screen.getByRole('button', { name: 'guid.tsSwitchAssistant' }));
    expect(screen.getByText('settings.assistantsEmpty')).toBeInTheDocument();
  });
});
