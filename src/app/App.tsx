import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PilgrimageProvider } from './PilgrimageContext';
import { Shell } from './Shell';
import { StartScreen } from '../features/start';
import { TrasaScreen } from '../features/trasa';
import { InfoScreen } from '../features/info';
import { InfoDetail } from '../features/info/Detail';
import { KwatermistrzScreen } from '../features/kwatermistrz';
import { KwatermistrzEntry } from '../features/kwatermistrz/Entry';
import { NiezbednikScreen } from '../features/niezbednik';
import { NiezbednikReader } from '../features/niezbednik/Reader';
import { KonferencjaScreen } from '../features/konferencja';
import { KonferencjaPlayer } from '../features/konferencja/Player';
import { UstawieniaScreen } from '../features/ustawienia';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 2 * 60 * 1000 } },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <PilgrimageProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Shell />}>
              <Route index element={<StartScreen />} />
              <Route path="trasa" element={<TrasaScreen />} />
              <Route path="info" element={<InfoScreen />} />
              <Route path="info/:id" element={<InfoDetail />} />
              <Route path="kwatermistrz" element={<KwatermistrzScreen />} />
              <Route path="kwatermistrz/:nr" element={<KwatermistrzEntry />} />
              <Route path="niezbednik" element={<NiezbednikScreen />} />
              <Route path="niezbednik/:modul" element={<NiezbednikReader />} />
              <Route path="konferencja" element={<KonferencjaScreen />} />
              <Route path="konferencja/:nr" element={<KonferencjaPlayer />} />
              <Route path="ustawienia" element={<UstawieniaScreen />} />
              <Route path="*" element={<StartScreen />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </PilgrimageProvider>
    </QueryClientProvider>
  );
}
