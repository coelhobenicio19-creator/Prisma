import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from '@/store';

describe('useUIStore', () => {
  beforeEach(() => {
    useUIStore.setState({ sidebarOpen: false, sidebarCollapsed: false, isMobile: false, panelOpen: false });
  });

  it('setSidebarOpen muda estado', () => {
    useUIStore.getState().setSidebarOpen(true);
    expect(useUIStore.getState().sidebarOpen).toBe(true);
    useUIStore.getState().setSidebarOpen(false);
    expect(useUIStore.getState().sidebarOpen).toBe(false);
  });

  it('setSidebarCollapsed muda estado', () => {
    useUIStore.getState().setSidebarCollapsed(true);
    expect(useUIStore.getState().sidebarCollapsed).toBe(true);
  });

  it('panelOpen abre e fecha painel direito', () => {
    useUIStore.getState().setPanelOpen(true);
    expect(useUIStore.getState().panelOpen).toBe(true);
    useUIStore.getState().setPanelOpen(false);
    expect(useUIStore.getState().panelOpen).toBe(false);
  });
});