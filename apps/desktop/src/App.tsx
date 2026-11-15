import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { Sidebar } from '@/components/layout/Sidebar';
import { RightPanel } from '@/components/layout/RightPanel';
import { useUIStore } from '@/store';
import { useProfileStore } from '@/store';
import { Onboarding } from '@/pages/Onboarding';
import { Dashboard } from '@/pages/Dashboard';
import { Library } from '@/pages/Library';
import { SearchPage } from '@/pages/Search';
import { Settings } from '@/pages/Settings';
import { Help } from '@/pages/Help';
import { NotFound } from '@/pages/NotFound';
import { LIAPage } from '@/pages/LIA';
import { Atlas, Learn, Exams, Recall, Focus } from '@/pages/Atlas';
import { Planner, Projects, School, Forecast } from '@/pages/Planner';
import { Studio, Lab, Oral } from '@/pages/Studio';
import { cn } from '@/utils/helpers';
import { AppHeader } from '@/components/layout/AppHeader';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppLayout() {
  const { sidebarOpen, isMobile, sidebarCollapsed } = useUIStore();
  const { fetchProfiles } = useProfileStore();
  
  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);
  
  return (
    <div className="min-h-screen bg-bg-primary flex">
      <Sidebar />
      
      <main className={cn(
        'main-content flex flex-col min-w-0 transition-all duration-300',
        isMobile && sidebarOpen && 'lg:ml-0',
        !isMobile && !sidebarCollapsed && 'lg:ml-64',
        !isMobile && sidebarCollapsed && 'lg:ml-16'
      )}>
        <AppHeader />

        {/* Page Content */}
        <div className="app-content flex-1">
          <Routes>
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/library" element={<Library />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/atlas" element={<Atlas />} />
            <Route path="/learn" element={<Learn />} />
            <Route path="/exams" element={<Exams />} />
            <Route path="/recall" element={<Recall />} />
            <Route path="/focus" element={<Focus />} />
            <Route path="/planner" element={<Planner />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/school" element={<School />} />
            <Route path="/forecast" element={<Forecast />} />
            <Route path="/studio" element={<Studio />} />
            <Route path="/lab" element={<Lab />} />
            <Route path="/oral" element={<Oral />} />
            <Route path="/lia" element={<LIAPage />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/help" element={<Help />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </main>
      
      <RightPanel />
      
      <Toaster />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppLayout />
    </QueryClientProvider>
  );
}

export default App;