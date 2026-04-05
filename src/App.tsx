import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ROUTE_PATHS } from '@/lib/index';
import Home from '@/pages/Home';
import Gallery from '@/pages/GalleryPage';
import Admin from '@/pages/Admin';
import Events from '@/pages/Events';
import Review from '@/pages/Review';
import Testimonials from '@/pages/Testimonials';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <HashRouter>
        <Routes>
          <Route path={ROUTE_PATHS.HOME} element={<Home />} />
          <Route path={ROUTE_PATHS.EVENTS} element={<Events />} />
          <Route path={ROUTE_PATHS.GALLERY} element={<Gallery />} />
          <Route path={ROUTE_PATHS.TESTIMONIALS} element={<Testimonials />} />
          <Route path={ROUTE_PATHS.REVIEW} element={<Review />} />
          <Route path={ROUTE_PATHS.ADMIN} element={<Admin />} />
        </Routes>
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
