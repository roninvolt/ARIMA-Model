import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ApiConfigModal } from './components/ApiConfigModal';
import { Home } from './pages/Home';
import { Forecast } from './pages/Forecast';
import { Analysis } from './pages/Analysis';
import { About } from './pages/About';
import { Documentation } from './pages/Documentation';
import { UploadResponse } from './types/api';
import { api } from './services/api';

export function App() {
  // Navigation state
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [activeDataset, setActiveDataset] = useState<UploadResponse | null>(null);
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [isApiConfigOpen, setIsApiConfigOpen] = useState(false);

  // Sync with browser URL / hash for direct linking
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname.replace(/^\//, '').toLowerCase();
      const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
      const target = hash || path;

      if (['forecast', 'analysis', 'about', 'documentation'].includes(target)) {
        setCurrentPage(target);
      } else {
        setCurrentPage('home');
      }
    };

    handleLocationChange();
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  const navigateTo = (pageId: string) => {
    setCurrentPage(pageId);
    window.location.hash = pageId === 'home' ? '' : pageId;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoadDemoFromHome = async (key: string = 'sales') => {
    setLoadingDemo(true);
    try {
      const ds = await api.loadSampleDataset(key);
      setActiveDataset(ds);
      navigateTo('forecast');
    } catch (err) {
      console.error('Failed to load demo dataset:', err);
    } finally {
      setLoadingDemo(false);
    }
  };

  const handleSelectDatasetForForecast = (ds: UploadResponse) => {
    setActiveDataset(ds);
    navigateTo('forecast');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      <Navbar 
        currentPage={currentPage} 
        onNavigate={navigateTo} 
        onOpenApiConfig={() => setIsApiConfigOpen(true)}
      />

      <main className="flex-1">
        {currentPage === 'home' && (
          <Home
            onNavigate={navigateTo}
            onLoadDemo={handleLoadDemoFromHome}
            isLoadingDemo={loadingDemo}
          />
        )}

        {currentPage === 'forecast' && (
          <Forecast
            initialDataset={activeDataset}
            onClearInitialDataset={() => setActiveDataset(null)}
            onOpenApiConfig={() => setIsApiConfigOpen(true)}
          />
        )}

        {currentPage === 'analysis' && (
          <Analysis
            onNavigate={navigateTo}
            onSelectDatasetForForecast={handleSelectDatasetForForecast}
          />
        )}

        {currentPage === 'about' && (
          <About onNavigate={navigateTo} />
        )}

        {currentPage === 'documentation' && (
          <Documentation
            onNavigate={navigateTo}
            onSelectDatasetForForecast={handleSelectDatasetForForecast}
          />
        )}
      </main>

      <Footer onNavigate={navigateTo} />

      <ApiConfigModal 
        isOpen={isApiConfigOpen} 
        onClose={() => setIsApiConfigOpen(false)} 
      />
    </div>
  );
}

export default App;
