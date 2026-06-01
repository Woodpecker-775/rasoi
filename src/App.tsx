import { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Header from './components/Header';
import BottomNav, { Page } from './components/BottomNav';
import SettingsPanel from './components/SettingsPanel';
import KitchenPage from './pages/KitchenPage';
import CookPage from './pages/CookPage';
import HungryPage from './pages/HungryPage';
import ExplorePage from './pages/ExplorePage';
import ShopPage from './pages/ShopPage';
import AssistantPage from './pages/AssistantPage';

function AppInner() {
  const [page, setPage] = useState<Page>('kitchen');
  const [showSettings, setShowSettings] = useState(false);
  const { shoppingNotes } = useApp();

  const PageMap: Record<Page, React.ReactNode> = {
    kitchen:   <KitchenPage />,
    cook:      <CookPage />,
    hungry:    <HungryPage />,
    explore:   <ExplorePage />,
    shop:      <ShopPage />,
    assistant: <AssistantPage />,
  };

  return (
    <div className="min-h-dvh bg-amber-50">
      <Header onSettingsClick={() => setShowSettings(true)} />
      <main>{PageMap[page]}</main>
      <BottomNav active={page} onChange={setPage} shopCount={shoppingNotes.length} />
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}
