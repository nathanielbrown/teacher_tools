import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { SettingsProvider } from '../contexts/SettingsContext';
import { HeaderProvider } from '../contexts/HeaderContext';
import { IntlProvider } from 'react-intl';
import enMessages from '../i18n/en.json';
import { Layout } from '../components/Layout';

// Mock logo
vi.mock('../assets/ClassRex_logo.png', () => ({
  default: 'logo.png'
}));

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();

describe('Layout Smoke Test', () => {
  const renderLayout = (currentTool = 'home') => {
    return render(
      <SettingsProvider>
        <HeaderProvider>
          <IntlProvider locale="en" messages={enMessages} defaultLocale="en">
            <Layout 
              currentTool={currentTool}
              activeTab="Teacher Tools"
              onNavigate={vi.fn()}
              onTabChange={vi.fn()}
            >
              <div data-testid="tool-content">Tool Content</div>
            </Layout>
          </IntlProvider>
        </HeaderProvider>
      </SettingsProvider>
    );
  };

  it('renders the layout and the tool content', () => {
    renderLayout();
    expect(screen.getByTestId('tool-content')).toBeDefined();
    // Use a more specific selector for ClassRex (e.g., in the sidebar)
    expect(screen.getAllByText('ClassRex').length).toBeGreaterThan(0);
  });

  it('opens and closes the about modal', async () => {
    renderLayout();
    
    // There might be multiple info icons, let's use the title
    const aboutButton = screen.getByTitle('About ClassRex');
    fireEvent.click(aboutButton);
    
    expect(screen.getByRole('heading', { name: /About ClassRex/i })).toBeDefined();
    
    const closeButton = screen.getByText('❌');
    fireEvent.click(closeButton);
    
    expect(screen.queryByText('About ClassRex')).toBeNull();
  });

  it('renders the tool header and the combined help & info panel', async () => {
    renderLayout('storystarters');
    
    // Use role to distinguish the header from the sidebar link
    expect(screen.getByRole('heading', { name: /Story Starters/i })).toBeDefined();

    const helpInfoButton = screen.getByTitle('Help & Usage');
    fireEvent.click(helpInfoButton);

    expect(screen.getByText('Information')).toBeDefined();
    expect(screen.getByText('How to Use')).toBeDefined();
    
    const closeOverlayButton = screen.getAllByRole('button').find(b => b.innerHTML.includes('X') || b.querySelector('svg'));
    if (closeOverlayButton) {
        fireEvent.click(closeOverlayButton);
    }
  });
});
