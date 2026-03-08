import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

export type NavMode = 'header' | 'sidebar' | 'mega';
export type DeviceType = 'desktop' | 'tablet' | 'mobile';
export type NavSettings = Record<DeviceType, NavMode>;

const STORAGE_KEY = 'ww_nav_settings';

const defaultSettings: NavSettings = {
  desktop: 'header',
  tablet: 'header',
  mobile: 'header',
};

interface NavigationContextType {
  settings: NavSettings;
  currentMode: NavMode;
  deviceType: DeviceType;
  updateSettings: (settings: NavSettings) => void;
}

const NavigationContext = createContext<NavigationContextType>({
  settings: defaultSettings,
  currentMode: 'header',
  deviceType: 'desktop',
  updateSettings: () => {},
});

export const useNavigation = () => useContext(NavigationContext);

function getDeviceType(width: number): DeviceType {
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

export const NavigationProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<NavSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });

  const [deviceType, setDeviceType] = useState<DeviceType>(() => getDeviceType(window.innerWidth));

  useEffect(() => {
    const onResize = () => setDeviceType(getDeviceType(window.innerWidth));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const updateSettings = (newSettings: NavSettings) => {
    setSettings(newSettings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
  };

  const currentMode = settings[deviceType];

  return (
    <NavigationContext.Provider value={{ settings, currentMode, deviceType, updateSettings }}>
      {children}
    </NavigationContext.Provider>
  );
};
