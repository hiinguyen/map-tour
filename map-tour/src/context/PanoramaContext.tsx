import { createContext, useContext, useState, type ReactNode } from 'react';
import { PanoramaModal } from '../components/PanoramaModal';
import { useSites } from './SitesContext';

interface PanoramaContextValue {
  openPanorama: (id: string) => void;
}

const PanoramaContext = createContext<PanoramaContextValue | null>(null);

export function PanoramaProvider({ children }: { children: ReactNode }) {
  const { sites } = useSites();
  const [panoramaSiteId, setPanoramaSiteId] = useState<string | null>(null);
  const panoramaSite = sites.find((site) => site.id === panoramaSiteId) ?? null;

  return (
    <PanoramaContext.Provider value={{ openPanorama: setPanoramaSiteId }}>
      {children}
      <PanoramaModal subject={panoramaSite} onClose={() => setPanoramaSiteId(null)} />
    </PanoramaContext.Provider>
  );
}

export function usePanorama(): PanoramaContextValue {
  const context = useContext(PanoramaContext);
  if (!context) throw new Error('usePanorama must be used within a PanoramaProvider');
  return context;
}
