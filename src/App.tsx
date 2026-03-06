import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/i18n/LanguageContext";
import Header from "@/components/Header";
import Index from "./pages/Index";
import LegalPage from "./pages/LegalPage";
import Admin from "./pages/Admin";
import Auth from "./pages/Auth";
import ProfileDetail from "./pages/ProfileDetail";
import EventDetail from "./pages/EventDetail";
import HumansPage from "./pages/HumansPage";
import EventsPage from "./pages/EventsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Header />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/humans" element={<HumansPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/profile/:id" element={<ProfileDetail />} />
            <Route path="/event/:id" element={<EventDetail />} />
            <Route path="/kvkk" element={<LegalPage />} />
            <Route path="/cookies" element={<LegalPage />} />
            <Route path="/consent" element={<LegalPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
