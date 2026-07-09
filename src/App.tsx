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
import LanguageURLSync from "@/components/LanguageURLSync";
import { routeMap, allLangs, type RouteKey } from "@/i18n/routes";
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
import MciPage from "./pages/MciPage";

import MemberDetail from "./pages/MemberDetail";
import AboutPage from "./pages/AboutPage";
import ProfessionsPage from "./pages/ProfessionsPage";
import ProfessionDetail from "./pages/ProfessionDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const pageFor: Record<RouteKey, JSX.Element> = {
  home: <Index />,
  about: <AboutPage />,
  humans: <HumansPage />,
  events: <EventsPage />,
  professions: <ProfessionsPage />,
  map: <MapPage />,
  mci: <MciPage />,

  dashboard: <Dashboard />,
  admin: <Admin />,
  auth: <Auth />,
  humanDetail: <ProfileDetail />,
  eventDetail: <EventDetail />,
  memberDetail: <MemberDetail />,
  professionDetail: <ProfessionDetail />,
  kvkk: <LegalPage />,
  cookies: <LegalPage />,
  consent: <LegalPage />,
};

const localizedRoutes = (Object.keys(routeMap) as RouteKey[]).flatMap((key) => {
  const seen = new Set<string>();
  return allLangs
    .map((l) => routeMap[key][l])
    .filter((path) => {
      if (seen.has(path)) return false;
      seen.add(path);
      return true;
    })
    .map((path) => <Route key={`${key}:${path}`} path={path} element={pageFor[key]} />);
});

const AppRoutes = () => (
  <Routes>
    {localizedRoutes}
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
            <LanguageURLSync />
            <CommandPalette />
            <AppLayout />
          </BrowserRouter>
        </NavigationProvider>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
