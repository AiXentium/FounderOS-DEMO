'use client';

import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { THEMES, THEME_META, THEME_STORAGE_KEY, type Theme } from '@/lib/theme';
import { PageHeader } from '@/components/PageHeader';
import { SectionHead, Label } from '@/components/terminal';
import { BrandingStudio } from '@/components/BrandingStudio';

export default function SettingsPage() {
  const [currentTheme, setCurrentTheme] = useState<Theme | null>(null);

  // Load the current theme from localStorage or HTML element
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const theme = document.documentElement.getAttribute('data-theme') as Theme;
      setCurrentTheme(theme || 'mono');
    }
  }, []);

  const handleThemeChange = (theme: Theme) => {
    setCurrentTheme(theme);
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  };

  return (
    <div>
      <PageHeader eyebrow="preferences" title="Settings" />
      <BrandingStudio />

      {/* Theme Settings */}
      <section className="mb-8">
        <SectionHead label="Appearance" />
        <div className="space-y-3">
          <div className="rounded-lg-t border border-os-border bg-os-surface p-5">
            <div className="mb-4">
              <Label>Theme</Label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {THEMES.map((theme) => {
                const meta = THEME_META[theme];
                const [bg, accent, text] = meta.swatch;
                const isActive = currentTheme === theme;

                return (
                  <button
                    key={theme}
                    onClick={() => handleThemeChange(theme)}
                    className={`group relative overflow-hidden rounded-lg-t border-2 p-4 text-left transition-all ${
                      isActive
                        ? 'border-os-accent bg-os-surface2'
                        : 'border-os-border hover:border-os-muted hover:bg-os-surface2'
                    }`}
                  >
                    {/* Theme preview swatch */}
                    <div className="mb-3 flex gap-2">
                      <div
                        className="h-6 w-6 rounded-sm-t"
                        style={{ background: bg }}
                        aria-label="Background color"
                      />
                      <div
                        className="h-6 w-6 rounded-sm-t"
                        style={{ background: accent }}
                        aria-label="Accent color"
                      />
                      <div
                        className="h-6 w-6 rounded-sm-t"
                        style={{ background: text }}
                        aria-label="Text color"
                      />
                    </div>

                    {/* Theme name and description */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-semibold text-[13px] text-os-text">{meta.name}</div>
                        <div className="mt-1 font-mono text-[10px] text-os-muted">{meta.blurb}</div>
                      </div>
                      {isActive && (
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-os-accent">
                          <Check className="h-3 w-3 text-os-ink" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Display Settings */}
      <section className="mb-8">
        <SectionHead label="Display" />
        <div className="rounded-lg-t border border-os-border bg-os-surface p-5">
          <div className="space-y-4">
            {/* Sidebar width note */}
            <div>
              <div className="mb-2">
                <Label>Sidebar</Label>
              </div>
              <p className="text-[13px] text-os-muted mb-2">
                Drag the sidebar edge to resize. Double-click the sidebar button to collapse.
              </p>
            </div>

            {/* Responsive behavior note */}
            <div className="pt-2 border-t border-os-border">
              <div className="mb-2">
                <Label>Responsive</Label>
              </div>
              <p className="text-[13px] text-os-muted">
                The dashboard adapts to your screen size. At mobile widths (375px+), the sidebar collapses automatically.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Interface Settings */}
      <section className="mb-8">
        <SectionHead label="Interface" />
        <div className="rounded-lg-t border border-os-border bg-os-surface p-5">
          <div className="space-y-4">
            {/* Keyboard shortcuts */}
            <div>
              <div className="mb-2">
                <Label>Keyboard shortcuts</Label>
              </div>
              <div className="space-y-2 text-[12px] text-os-muted">
                <div className="flex justify-between">
                  <span>Open command palette</span>
                  <span className="font-mono text-os-dim">Cmd/Ctrl K</span>
                </div>
                <div className="flex justify-between">
                  <span>Navigate to first view</span>
                  <span className="font-mono text-os-dim">1</span>
                </div>
                <div className="flex justify-between">
                  <span>Navigate to next view</span>
                  <span className="font-mono text-os-dim">2–9</span>
                </div>
                <div className="flex justify-between">
                  <span>Collapse sidebar</span>
                  <span className="font-mono text-os-dim">Cmd/Ctrl ⌫</span>
                </div>
              </div>
            </div>

            {/* Command palette info */}
            <div className="pt-2 border-t border-os-border">
              <div className="mb-2">
                <Label>Command palette</Label>
              </div>
              <p className="text-[13px] text-os-muted">
                Press <span className="font-mono">Cmd/Ctrl K</span> to search for any page, agent, tool, or connection.
                The palette indexes your entire system in real-time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* System Information */}
      <section className="mb-8">
        <SectionHead label="System" />
        <div className="rounded-lg-t border border-os-border bg-os-surface p-5">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-[13px] text-os-muted">App</span>
              <span className="font-mono text-[13px] text-os-text">Business OS</span>
            </div>
            <div className="flex justify-between border-t border-os-border pt-3">
              <span className="text-[13px] text-os-muted">Version</span>
              <span className="font-mono text-[13px] text-os-text">1.0.0</span>
            </div>
            <div className="flex justify-between border-t border-os-border pt-3">
              <span className="text-[13px] text-os-muted">Environment</span>
              <span className="font-mono text-[13px] text-os-text">
                {typeof window !== 'undefined' ? window.location.hostname : 'loading'}
              </span>
            </div>
            <div className="flex justify-between border-t border-os-border pt-3">
              <span className="text-[13px] text-os-muted">Storage</span>
              <span className="font-mono text-[13px] text-os-text">Local</span>
            </div>
          </div>
        </div>
      </section>

      {/* Experimental */}
      <section>
        <SectionHead label="Experimental" />
        <div className="rounded-lg-t border border-os-border bg-os-surface p-5">
          <div className="flex items-start gap-3">
            <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-os-dim" />
            <div className="min-w-0 flex-1">
              <div className="mb-1">
                <Label>Local-first architecture</Label>
              </div>
              <p className="text-[13px] text-os-muted">
                All data lives locally in SQLite. No cloud syncing — your business OS runs entirely on your machine.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
