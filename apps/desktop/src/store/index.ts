import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { StudyProfile, SettingsData, DashboardData, Document, SearchResult } from '@/services/tauri';

// ============================================================
// Profile Store
// ============================================================

interface ProfileState {
  profiles: StudyProfile[];
  currentProfile: StudyProfile | null;
  isLoading: boolean;
  error: string | null;
  
  fetchProfiles: () => Promise<void>;
  setCurrentProfile: (profile: StudyProfile | null) => void;
  createProfile: (profile: Omit<StudyProfile, 'id' | 'created_at' | 'updated_at' | 'deleted_at' | 'version'>) => Promise<StudyProfile>;
  updateProfile: (id: string, updates: Partial<StudyProfile>) => Promise<void>;
  deleteProfile: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      profiles: [],
      currentProfile: null,
      isLoading: false,
      error: null,

      fetchProfiles: async () => {
        set({ isLoading: true, error: null });
        try {
          const { listProfiles } = await import('@/services/tauri');
          const profiles = await listProfiles();
          set({ profiles, isLoading: false });
          
          // Auto-select first profile if none selected
          if (!get().currentProfile && profiles.length > 0) {
            set({ currentProfile: profiles[0] });
          }
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
        }
      },

      setCurrentProfile: (profile) => set({ currentProfile: profile }),

      createProfile: async (profileData) => {
        set({ isLoading: true, error: null });
        try {
          const { createProfile } = await import('@/services/tauri');
          const newProfile = await createProfile(
            profileData.name,
            profileData.goal_type,
            profileData.goal_description,
            profileData.target_exam_id,
            profileData.institution_id,
            profileData.timezone
          );
          set((state) => ({
            profiles: [newProfile, ...state.profiles],
            currentProfile: newProfile,
            isLoading: false,
          }));
          return newProfile;
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
          throw error;
        }
      },

      updateProfile: async (id, updates) => {
        set({ isLoading: true, error: null });
        try {
          const { updateProfile } = await import('@/services/tauri');
          await updateProfile(id, updates);
          set((state) => ({
            profiles: state.profiles.map((p) => (p.id === id ? { ...p, ...updates } : p)),
            currentProfile: state.currentProfile?.id === id ? { ...state.currentProfile, ...updates } : state.currentProfile,
            isLoading: false,
          }));
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
          throw error;
        }
      },

      deleteProfile: async (id) => {
        set({ isLoading: true, error: null });
        try {
          const { deleteProfile } = await import('@/services/tauri');
          await deleteProfile(id);
          set((state) => ({
            profiles: state.profiles.filter((p) => p.id !== id),
            currentProfile: state.currentProfile?.id === id ? null : state.currentProfile,
            isLoading: false,
          }));
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
          throw error;
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'prisma-profile-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentProfile: state.currentProfile,
      }),
    }
  )
);

// ============================================================
// Settings Store
// ============================================================

interface SettingsState {
  settings: SettingsData | null;
  isLoading: boolean;
  error: string | null;
  
  fetchSettings: (profileId: string) => Promise<void>;
  updateSettings: (profileId: string, settings: Partial<SettingsData>) => Promise<void>;
  clearError: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  (set) => ({
    settings: null,
    isLoading: false,
    error: null,

    fetchSettings: async (profileId) => {
      set({ isLoading: true, error: null });
      try {
        const { getSettings } = await import('@/services/tauri');
        const settings = await getSettings(profileId);
        set({ settings, isLoading: false });
      } catch (error) {
        set({ error: (error as Error).message, isLoading: false });
      }
    },

    updateSettings: async (profileId, newSettings) => {
      set({ isLoading: true, error: null });
      try {
        const { updateSettings } = await import('@/services/tauri');
        const settings = await updateSettings(profileId, newSettings);
        set({ settings, isLoading: false });
      } catch (error) {
        set({ error: (error as Error).message, isLoading: false });
        throw error;
      }
    },

    clearError: () => set({ error: null }),
  })
);

// ============================================================
// Dashboard Store
// ============================================================

interface DashboardState {
  data: DashboardData | null;
  isLoading: boolean;
  error: string | null;
  
  fetchDashboard: (profileId: string) => Promise<void>;
  refreshDashboard: (profileId: string) => Promise<void>;
  clearError: () => void;
}

export const useDashboardStore = create<DashboardState>()(
  (set) => ({
    data: null,
    isLoading: false,
    error: null,

    fetchDashboard: async (profileId) => {
      set({ isLoading: true, error: null });
      try {
        const { getDashboardData } = await import('@/services/tauri');
        const data = await getDashboardData(profileId);
        set({ data, isLoading: false });
      } catch (error) {
        set({ error: (error as Error).message, isLoading: false });
      }
    },

    refreshDashboard: async (profileId) => {
      // Don't show loading spinner for refresh
      try {
        const { getDashboardData } = await import('@/services/tauri');
        const data = await getDashboardData(profileId);
        set({ data });
      } catch (error) {
        console.error('Failed to refresh dashboard:', error);
      }
    },

    clearError: () => set({ error: null }),
  })
);

// ============================================================
// Library Store
// ============================================================

interface LibraryState {
  documents: Document[];
  selectedDocument: Document | null;
  isLoading: boolean;
  error: string | null;
  
  fetchDocuments: (profileId: string) => Promise<void>;
  importDocument: (profileId: string, filePath: string) => Promise<Document>;
  selectDocument: (doc: Document | null) => void;
  deleteDocument: (id: string) => Promise<void>;
  openDocument: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useLibraryStore = create<LibraryState>()(
  (set) => ({
    documents: [],
    selectedDocument: null,
    isLoading: false,
    error: null,

    fetchDocuments: async (profileId) => {
      set({ isLoading: true, error: null });
      try {
        const { listDocuments } = await import('@/services/tauri');
        const documents = await listDocuments(profileId);
        set({ documents, isLoading: false });
      } catch (error) {
        set({ error: (error as Error).message, isLoading: false });
      }
    },

    importDocument: async (profileId, filePath) => {
      set({ isLoading: true, error: null });
      try {
        const { importFile } = await import('@/services/tauri');
        const doc = await importFile(profileId, filePath);
        set((state) => ({
          documents: [doc, ...state.documents],
          isLoading: false,
        }));
        return doc;
      } catch (error) {
        set({ error: (error as Error).message, isLoading: false });
        throw error;
      }
    },

    selectDocument: (doc) => set({ selectedDocument: doc }),

    deleteDocument: async (id) => {
      set({ isLoading: true, error: null });
      try {
        const { deleteDocument } = await import('@/services/tauri');
        await deleteDocument(id);
        set((state) => ({
          documents: state.documents.filter((d) => d.id !== id),
          selectedDocument: state.selectedDocument?.id === id ? null : state.selectedDocument,
          isLoading: false,
        }));
      } catch (error) {
        set({ error: (error as Error).message, isLoading: false });
        throw error;
      }
    },

    openDocument: async (id) => {
      try {
        const { openDocument } = await import('@/services/tauri');
        await openDocument(id);
      } catch (error) {
        set({ error: (error as Error).message });
        throw error;
      }
    },

    clearError: () => set({ error: null }),
  })
);

// ============================================================
// Search Store
// ============================================================

interface SearchState {
  results: SearchResult[];
  query: string;
  isLoading: boolean;
  error: string | null;
  
  search: (profileId: string, query: string) => Promise<void>;
  setQuery: (query: string) => void;
  clearResults: () => void;
  clearError: () => void;
}

export const useSearchStore = create<SearchState>()(
  (set) => ({
    results: [],
    query: '',
    isLoading: false,
    error: null,

    search: async (profileId, query) => {
      set({ isLoading: true, error: null, query });
      try {
        const { search } = await import('@/services/tauri');
        const results = await search(profileId, { query });
        set({ results, isLoading: false });
      } catch (error) {
        set({ error: (error as Error).message, isLoading: false, results: [] });
      }
    },

    setQuery: (query) => set({ query }),

    clearResults: () => set({ results: [], query: '' }),

    clearError: () => set({ error: null }),
  })
);

// ============================================================
// UI Store (Global UI State)
// ============================================================

interface UIState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  panelOpen: boolean;
  panelCollapsed: boolean;
  theme: 'light' | 'dark' | 'system';
  isMobile: boolean;
  
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebarCollapse: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  togglePanel: () => void;
  setPanelOpen: (open: boolean) => void;
  togglePanelCollapse: () => void;
  setPanelCollapsed: (collapsed: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setIsMobile: (isMobile: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      sidebarCollapsed: false,
      panelOpen: false,
      panelCollapsed: false,
      theme: 'system',
      isMobile: false,

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebarCollapse: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      togglePanel: () => set((state) => ({ panelOpen: !state.panelOpen })),
      setPanelOpen: (open) => set({ panelOpen: open }),
      togglePanelCollapse: () => set((state) => ({ panelCollapsed: !state.panelCollapsed })),
      setPanelCollapsed: (collapsed) => set({ panelCollapsed: collapsed }),
      setTheme: (theme) => {
        set({ theme });
        // Apply theme to document
        const root = document.documentElement;
        const dark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        root.classList.toggle('dark', dark);
        root.classList.toggle('light', !dark);
      },
      setIsMobile: (isMobile) => set({ isMobile }),
    }),
    {
      name: 'prisma-ui-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        panelCollapsed: state.panelCollapsed,
        theme: state.theme,
      }),
    }
  )
);

// ============================================================
// Toast Store
// ============================================================

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

export const useToastStore = create<ToastState>()(
  (set) => ({
    toasts: [],
    addToast: (toast) => {
      const id = crypto.randomUUID();
      set((state) => ({
        toasts: [...state.toasts, { ...toast, id }],
      }));
      // Auto remove
      if (toast.duration !== 0) {
        setTimeout(() => {
          set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id),
          }));
        }, toast.duration ?? 5000);
      }
    },
    removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
    clearToasts: () => set({ toasts: [] }),
  })
);