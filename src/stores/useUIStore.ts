import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  quickCaptureOpen: boolean;
  focusModeActive: boolean;
  currentPage: string;

  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleQuickCapture: () => void;
  setQuickCaptureOpen: (open: boolean) => void;
  setFocusModeActive: (active: boolean) => void;
  setCurrentPage: (page: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  quickCaptureOpen: false,
  focusModeActive: false,
  currentPage: 'today',

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleQuickCapture: () => set((s) => ({ quickCaptureOpen: !s.quickCaptureOpen })),
  setQuickCaptureOpen: (open) => set({ quickCaptureOpen: open }),
  setFocusModeActive: (active) => set({ focusModeActive: active }),
  setCurrentPage: (page) => set({ currentPage: page }),
}));
