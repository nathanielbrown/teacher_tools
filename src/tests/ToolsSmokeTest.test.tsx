import { describe, it, expect, vi } from 'vitest';
import { render, act } from '@testing-library/react';
import React from 'react';
import { SettingsProvider } from '../contexts/SettingsContext';
import { HeaderProvider, useHeader } from '../contexts/HeaderContext';
import { tools } from '../data/tools';

// Mock scrollIntoView as it's not implemented in JSDOM
window.HTMLElement.prototype.scrollIntoView = vi.fn();

// Mock speechSynthesis
Object.defineProperty(window, 'speechSynthesis', {
  value: {
    getVoices: vi.fn().mockReturnValue([]),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    speak: vi.fn(),
    cancel: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    onvoiceschanged: null,
  },
  writable: true
});

import { IntlProvider } from 'react-intl';
import enMessages from '../i18n/en.json';
import Matter from 'matter-js';

// Mock Matter.Bodies.fromVertices and Render as they might be missing in test env
const patchMatter = (obj: any) => {
  if (!obj) return;
  if (obj.Bodies && !obj.Bodies.fromVertices) obj.Bodies.fromVertices = () => ({});
  if (!obj.Render) obj.Render = {};
  
  // Always mock these to ensure they work in JSDOM
  obj.Render.create = () => ({ 
    canvas: { 
      style: {}, 
      remove: () => {} 
    } 
  });
  obj.Render.run = () => {};
  obj.Render.stop = () => {};
};

patchMatter(Matter);
if ((Matter as any).default) patchMatter((Matter as any).default);

describe('Tools Smoke Test', () => {
  // We iterate over the actual tools array used by the app
  tools.forEach((tool) => {
    if (!tool.component || tool.hidden) {
        return;
    }

    it(`renders ${tool.name} and passes interaction smoke test`, async () => {
      let capturedHeader = null;
      
      const HeaderCapture = ({ onCapture }) => {
        const header = useHeader();
        onCapture(header);
        return null;
      };

      // We wrap in providers to satisfy useSettings(), useHeader(), etc.
      const { unmount } = render(
        <React.Suspense fallback={<div>Loading...</div>}>
          <SettingsProvider>
            <HeaderProvider>
              <IntlProvider locale="en" messages={enMessages} defaultLocale="en">
                <HeaderCapture onCapture={(h) => { capturedHeader = h; }} />
                <tool.component />
              </IntlProvider>
            </HeaderProvider>
          </SettingsProvider>
        </React.Suspense>
      );

      // 1. Verify Info Content
      // Stability: Every tool should provide help for the teacher
      const hasInfo = !!tool.infoContent || (capturedHeader && !!capturedHeader.helpContent);
      expect(hasInfo, `Tool ${tool.name} is missing pedagogical info content`).toBe(true);

      // 2. Test Rendering of Info Content (to catch crashes in the info view)
      const renderWithProviders = (ui: React.ReactElement) => {
        return render(
          <SettingsProvider>
            <HeaderProvider>
              <IntlProvider locale="en" messages={enMessages} defaultLocale="en">
                {ui}
              </IntlProvider>
            </HeaderProvider>
          </SettingsProvider>
        );
      };

      if (tool.infoContent) {
        renderWithProviders(<div>{tool.infoContent}</div>);
      }
      if (capturedHeader && capturedHeader.helpContent) {
        if (Array.isArray(capturedHeader.helpContent)) {
          renderWithProviders(<div>{capturedHeader.helpContent.map((c, i) => <p key={i}>{c}</p>)}</div>);
        } else {
          renderWithProviders(<div>{capturedHeader.helpContent}</div>);
        }
      }

      // 3. Test Reset Functionality
      // Stability: Calling reset should never crash the tool
      if (capturedHeader && capturedHeader.onReset) {
        // If it's a function that returns a function (setter pattern), call it once to get the handler
        const resetHandler = typeof capturedHeader.onReset === 'function' ? capturedHeader.onReset : null;
        
        if (resetHandler) {
          await act(async () => {
            // Check if it's the pattern where we pass a function to a setter
            // Many tools do: setOnReset(() => reset)
            try {
              // Try calling it. If it returns a function, that's the actual reset logic.
              const result = resetHandler();
              if (typeof result === 'function') {
                result();
              }
            } catch (e) {
              console.error(`Reset failed for ${tool.name}:`, e);
              throw e;
            }
          });
        }
      }

      // Clean up after each render to keep memory usage low
      unmount();
    });
  });
});
