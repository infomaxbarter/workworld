import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { NavigationProvider, useNavigation } from "@/contexts/NavigationContext";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import Header from "@/components/Header";
import AppSidebar from "@/components/AppSidebar";
import CommandPalette from "@/components/CommandPalette";
import LanguageURLSync from "@/components/LanguageURLSync";
import PageSkeleton from "@/components/PageSkeleton";
import { routeMap, allLangs, type RouteKey } from "@/i18n/routes";
import Index from "./pages/Index";

const LegalPage = lazy(() => import("./pages/LegalPage"));
const Admin = lazy(() => import("./pages/Admin"));
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ProfileDetail = lazy(() => import("./pages/ProfileDetail"));
const EventDetail = lazy(() => import("./pages/EventDetail"));
const HumansPage = lazy(() => import("./pages/HumansPage"));
const EventsPage = lazy(() => import("./pages/EventsPage"));
const MapPage = lazy(() => import("./pages/MapPage"));
const MciPage = lazy(() => import("./pages/MciPage"));
const MciCityDetail = lazy(() => import("./pages/MciCityDetail"));
const MciComparePage = lazy(() => import("./pages/MciComparePage"));
const MemberDetail = lazy(() => import("./pages/MemberDetail"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const ProfessionsPage = lazy(() => import("./pages/ProfessionsPage"));
const ProfessionDetail = lazy(() => import("./pages/ProfessionDetail"));
const MediaListPage = lazy(() => import("./pages/MediaListPage"));
const MediaDetail = lazy(() => import("./pages/MediaDetail"));
const AnalyticsPage = lazy(() => import("./pages/AnalyticsPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
    },
  },
});

const pageFor: Record<RouteKey, JSX.Element> = {
  home: <Index />,
  about: <AboutPage />,
  humans: <HumansPage />,
  events: <EventsPage />,
  professions: <ProfessionsPage />,
  map: <MapPage />,
  mci: <MciPage />,
  mciCompare: <MciComparePage />,
  mciCityDetail: <MciCityDetail />,
  blog: <MediaListPage type="blog" />,
  videos: <MediaListPage type="video" />,
  podcast: <MediaListPage type="podcast" />,
  analytics: <AnalyticsPage />,

  dashboard: <Dashboard />,
  admin: <Admin />,
  auth: <Auth />,
  humanDetail: <ProfileDetail />,
  eventDetail: <EventDetail />,
  memberDetail: <MemberDetail />,
  professionDetail: <ProfessionDetail />,
  blogDetail: <MediaDetail type="blog" />,
  videoDetail: <MediaDetail type="video" />,
  podcastDetail: <MediaDetail type="podcast" />,
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
  <Suspense fallback={<PageSkeleton />}>
    <Routes>
      {localizedRoutes}
      <Route path="*" element={<NotFound />} />
    </Routes>
  </Suspense>
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
              <SidebarTrigger aria-label="Toggle sidebar" />
            </header>
            <main id="main" className="flex-1">
              <AppRoutes />
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-3 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
      >
        Skip to content
      </a>
      <Header />
      <main id="main">
        <AppRoutes />
      </main>
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
