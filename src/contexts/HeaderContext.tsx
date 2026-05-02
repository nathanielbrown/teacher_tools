import React, { createContext, useContext, useState, useCallback, ReactNode, Dispatch, SetStateAction } from 'react';

interface HeaderContextType {
  headerActions: ReactNode;
  setHeaderActions: Dispatch<SetStateAction<ReactNode>>;
  headerInfo: ReactNode;
  setHeaderInfo: Dispatch<SetStateAction<ReactNode>>;
  helpContent: ReactNode;
  setHelpContent: Dispatch<SetStateAction<ReactNode>>;
  isFullscreen: boolean;
  setIsFullscreen: Dispatch<SetStateAction<boolean>>;
  hasConfig: boolean;
  setHasConfig: Dispatch<SetStateAction<boolean>>;
  isConfigOpen: boolean;
  setIsConfigOpen: Dispatch<SetStateAction<boolean>>;
  onConfigToggle: (() => void) | null;
  setOnConfigToggle: Dispatch<SetStateAction<(() => void) | null>>;
  onReset: (() => void) | null;
  setOnReset: Dispatch<SetStateAction<(() => void) | null>>;
  activeOverlay: 'info' | 'help' | 'settings' | 'about' | null;
  setActiveOverlay: Dispatch<SetStateAction<'info' | 'help' | 'settings' | 'about' | null>>;
  clearHeader: () => void;
}

const HeaderContext = createContext<HeaderContextType | undefined>(undefined);

export const HeaderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [headerActions, setHeaderActions] = useState<ReactNode>(null);
  const [headerInfo, setHeaderInfo] = useState<ReactNode>(null);
  const [helpContent, setHelpContent] = useState<ReactNode>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasConfig, setHasConfig] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [onConfigToggle, setOnConfigToggle] = useState<(() => void) | null>(null);
  const [onReset, setOnReset] = useState<(() => void) | null>(null);
  const [activeOverlay, setActiveOverlay] = useState<'info' | 'help' | 'settings' | 'about' | null>(null);

  const clearHeader = useCallback(() => {
    setHeaderActions(null);
    setHeaderInfo(null);
    setHelpContent(null);
    setIsFullscreen(false);
    setHasConfig(false);
    setIsConfigOpen(false);
    setOnConfigToggle(null);
    setOnReset(null);
    setActiveOverlay(null);
  }, []);

  return (
    <HeaderContext.Provider value={{ 
      headerActions, 
      setHeaderActions, 
      headerInfo, 
      setHeaderInfo,
      helpContent,
      setHelpContent,
      isFullscreen,
      setIsFullscreen,
      hasConfig,
      setHasConfig,
      isConfigOpen,
      setIsConfigOpen,
      onConfigToggle,
      setOnConfigToggle,
      onReset,
      setOnReset,
      activeOverlay,
      setActiveOverlay,
      clearHeader 
    }}>
      {children}
    </HeaderContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useHeader = () => {
  const context = useContext(HeaderContext);
  if (!context) {
    throw new Error('useHeader must be used within a HeaderProvider');
  }
  return context;
};
