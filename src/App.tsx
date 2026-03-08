import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { NavigationProvider, useNavigation } from "@/contexts/NavigationContext";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import Header from "@/components/Header";
import AppSidebar from "@/components/AppSidebar";
import CommandPalette from "@/components/CommandPalette";
import Index from "./pages/Index";
import LegalPage from "./pages/LegalPage";
import Admin from "./pages/Admin";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import ProfileDetail from "./pages/ProfileDetail";
import EventDetail from "./pages/EventDetail";
import HumansPage from "./pages/HumansPage";
import EventsPage from "./pages/EventsPage";
import MapPage from "./pages/MapPage";
import MemberDetail from "./pages/MemberDetail";
import AboutPage from "./pages/AboutPage";
import ProfessionsPage from "./pages/ProfessionsPage";
import ProfessionDetail from "./pages/ProfessionDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/auth" element={<Auth />} />
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/admin" element={<Admin />} />
    <Route path="/about" element={<AboutPage />} />
    <Route path="/humans" element={<HumansPage />} />
    <Route path="/events" element={<EventsPage />} />
    <Route path="/map" element={<MapPage />} />
    <Route path="/humans/:slug" element={<ProfileDetail />} />
    <Route path="/events/:slug" element={<EventDetail />} />
    <Route path="/members/:slug" element={<MemberDetail />} />
    <Route path="/kvkk" element={<LegalPage />} />
    <Route path="/cookies" element={<LegalPage />} />
    <Route path="/consent" element={<LegalPage />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const AppLayout = () => {
  const { currentMode } = useNavigation();

  if (currentMode === 'sidebar') {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <header className="h-12 flex items-center border-b border-border bg-background/80 backdrop-blur-md px-3 sticky top-0 z-50">
              <SidebarTrigger />
            </header>
            <main className="flex-1">
              <AppRoutes />
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <>
      <Header />
      <AppRoutes />
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <NavigationProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <CommandPalette />
            <AppLayout />
          </BrowserRouter>
        </NavigationProvider>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
