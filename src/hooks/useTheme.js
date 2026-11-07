import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useColorScheme } from 'react-native';

const THEME_KEY = '@pawcare:theme';

const getStorage = () => {
  try {
    return require('@react-native-async-storage/async-storage').default;
  } catch {
    return null;
  }
};

export const LightColors = {
  // Variables exactas del prototipo HTML (Claro)
  bg: '#EEF5F3',
  surface: '#FFFFFF',
  surface2: '#F1F7F5',
  text: '#14302F',
  muted: '#5E7774',
  line: '#DDE9E6',
  brand: '#2E9E86',
  brand2: '#5FB8D6',
  brandInk: '#FFFFFF',
  warnBg: '#FDEDEA',
  warn: '#C4553F',
  okBg: '#E3F4EE',
  hero1: '#7FD1C0',
  hero2: '#4BA9C4',

  // Alias de compatibilidad
  ink: '#14302F',
  fondo: '#EEF5F3',
  fondoSecundario: '#F1F7F5',
  superficie: '#FFFFFF',
  borde: '#DDE9E6',
  texto: '#14302F',
  textoSecundario: '#5E7774',
  textoMuted: '#7C9693',
  primario: '#2E9E86',
  primarioSoft: '#E3F4EE',
  acentoVerde: '#2E9E86',
  acentoVerdeSoft: '#E3F4EE',
  coral: '#C4553F',
  sun: '#E3A74F',
  tabBar: '#FFFFFF',
  tabBarBorde: '#DDE9E6',
  card: '#FFFFFF',
  isDark: false,
};

export const DarkColors = {
  // Variables exactas del prototipo HTML (Oscuro)
  bg: '#0B1514',
  surface: '#14211F',
  surface2: '#1B2C2A',
  text: '#E6F3F0',
  muted: '#8FAAA6',
  line: '#243735',
  brand: '#4FD1B2',
  brand2: '#6CC3E0',
  brandInk: '#06201B',
  warnBg: '#35201C',
  warn: '#FF9B85',
  okBg: '#173A33',
  hero1: '#1E6B5E',
  hero2: '#1B5870',

  // Alias de compatibilidad
  ink: '#E6F3F0',
  fondo: '#0B1514',
  fondoSecundario: '#1B2C2A',
  superficie: '#14211F',
  borde: '#243735',
  texto: '#E6F3F0',
  textoSecundario: '#8FAAA6',
  textoMuted: '#688581',
  primario: '#4FD1B2',
  primarioSoft: '#173A33',
  acentoVerde: '#4FD1B2',
  acentoVerdeSoft: '#173A33',
  coral: '#FF9B85',
  sun: '#F6D68B',
  tabBar: '#14211F',
  tabBarBorde: '#243735',
  card: '#14211F',
  isDark: true,
};

const ThemeContext = createContext({
  tema: 'light',
  colors: LightColors,
  isDark: false,
  toggleTema: () => {},
  setTemaDirecto: () => {},
});

export const ThemeProvider = ({ children }) => {
  const systemScheme = useColorScheme();
  const [tema, setTema] = useState('light');

  useEffect(() => {
    (async () => {
      try {
        const storage = getStorage();
        const saved = storage ? await storage.getItem(THEME_KEY) : null;
        if (saved === 'dark' || saved === 'light') {
          setTema(saved);
        } else if (systemScheme === 'dark') {
          setTema('dark');
        }
      } catch {}
    })();
  }, [systemScheme]);

  const toggleTema = useCallback(async () => {
    setTema((prev) => {
      const nuevo = prev === 'light' ? 'dark' : 'light';
      const storage = getStorage();
      if (storage) {
        storage.setItem(THEME_KEY, nuevo).catch(() => {});
      }
      return nuevo;
    });
  }, []);

  const setTemaDirecto = useCallback(async (nuevo) => {
    if (nuevo !== 'light' && nuevo !== 'dark') return;
    setTema(nuevo);
    const storage = getStorage();
    if (storage) {
      storage.setItem(THEME_KEY, nuevo).catch(() => {});
    }
  }, []);

  const colors = tema === 'dark' ? DarkColors : LightColors;
  const isDark = tema === 'dark';

  return (
    <ThemeContext.Provider value={{ tema, colors, isDark, toggleTema, setTemaDirecto }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
export default useTheme;
