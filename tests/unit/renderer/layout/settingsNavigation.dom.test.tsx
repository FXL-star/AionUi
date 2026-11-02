import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Outlet } from 'react-router-dom';

const platformMocks = vi.hoisted(() => ({ isDesktop: vi.fn(() => true) }));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock('@renderer/utils/platform', () => ({
  isElectronDesktop: platformMocks.isDesktop,
  resolveExtensionAssetUrl: (url: string) => url,
}));
vi.mock('@renderer/hooks/system/useExtensionSettingsTabs', () => ({
  useExtensionSettingsTabs: () => [],
}));
vi.mock('@renderer/hooks/system/useExtI18n', () => ({
  useExtI18n: () => ({ resolveExtTabName: (tab: { name: string }) => tab.name }),
}));
vi.mock('@renderer/hooks/context/LayoutContext', () => ({
  useLayoutContext: () => ({ isMobile: true }),
}));
vi.mock('@renderer/hooks/context/AuthContext', () => ({
  useAuth: () => ({ status: 'authenticated', user: { id: 'test-user' } }),
}));
vi.mock('@renderer/hooks/system/useCrossSessionRateLimitNotice', () => ({
  useCrossSessionRateLimitNotice: () => {},
}));
vi.mock('@renderer/components/layout/AppLoader', () => ({ default: () => null }));
vi.mock('@renderer/components/layout/DocumentTitle', () => ({ default: () => null }));
vi.mock('@renderer/pages/settings/ModeSettings', () => ({
  default: () => <div>Model settings page</div>,
}));
vi.mock('@renderer/pages/settings/AgentSettings', () => ({
  default: () => <div>Agents settings page</div>,
}));
vi.mock('@renderer/pages/settings/AgentSettings/AgentRepairPage', () => ({
  default: () => <div>Agent repair page</div>,
}));

import PanelRoute from '@renderer/components/layout/Router';
import SettingsSider from '@renderer/pages/settings/components/SettingsSider';
import SettingsPageWrapper from '@renderer/pages/settings/components/SettingsPageWrapper';

describe('Settings navigation with Agents hidden', () => {
  beforeEach(() => {
    platformMocks.isDesktop.mockReturnValue(true);
    window.history.replaceState(null, '', '/');
  });

  afterEach(() => {
    cleanup();
    window.history.replaceState(null, '', '/');
  });

  it.each([true, false])('hides Agents in the settings sidebar (desktop: %s)', (isDesktop) => {
    platformMocks.isDesktop.mockReturnValue(isDesktop);
    render(
      <MemoryRouter initialEntries={['/settings/model']}>
        <SettingsSider />
      </MemoryRouter>
    );

    expect(screen.queryByText('settings.agents')).not.toBeInTheDocument();
    expect(screen.getByText('settings.model')).toBeInTheDocument();
    expect(screen.getByText('settings.groupAiCore')).toBeInTheDocument();
  });

  it('hides Agents in the mobile settings navigation', () => {
    render(
      <MemoryRouter initialEntries={['/settings/model']}>
        <SettingsPageWrapper>Settings content</SettingsPageWrapper>
      </MemoryRouter>
    );

    expect(screen.queryByRole('button', { name: 'settings.agents' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'settings.model' })).toBeInTheDocument();
  });

  it.each(['/settings', '/settings/agent', '/settings/agent/claude/repair'])(
    'redirects %s to model settings instead of displaying Agents',
    async (pathname) => {
      window.history.replaceState(null, '', `/#${pathname}`);
      render(<PanelRoute layout={<Outlet />} />);

      expect(await screen.findByText('Model settings page')).toBeInTheDocument();
      expect(window.location.hash).toBe('#/settings/model');
      expect(screen.queryByText(/Agents settings page|Agent repair page/)).not.toBeInTheDocument();
    }
  );
});
