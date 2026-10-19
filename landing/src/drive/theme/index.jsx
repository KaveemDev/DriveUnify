import React, { createContext, useMemo, useContext, useSyncExternalStore } from 'react';
import { createTheme, ThemeProvider, CssBaseline } from '@mui/material';

const ColorModeContext = createContext({ toggleColorMode: () => {} });

export const useColorMode = () => useContext(ColorModeContext);

// The .dark class on <html> is the single source of truth, shared with the marketing site.
// The root layout's inline script sets it before paint from localStorage 'themeMode' or the system.
const subscribe = (onChange) => {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  return () => observer.disconnect();
};
const getMode = () => (document.documentElement.classList.contains('dark') ? 'dark' : 'light');

export const ThemeContextProvider = ({ children }) => {
  const mode = useSyncExternalStore(subscribe, getMode, () => 'light');

  const toggleColorMode = () => {
    const dark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('themeMode', dark ? 'dark' : 'light');
  };

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          ...(mode === 'light'
            ? {
                primary: { main: '#2348d8', light: '#4a6ae3', dark: '#1a36a6', contrastText: '#fff' },
                secondary: { main: '#545b6b' },
                background: { default: '#f5f6f8', paper: '#ffffff' },
                text: { primary: '#10131a', secondary: '#545b6b', disabled: '#9aa0ad' },
                divider: 'rgba(16,19,26,0.08)',
                action: {
                  hover: 'rgba(0,0,0,0.04)',
                  selected: 'rgba(0,0,0,0.06)',
                  disabledBackground: 'rgba(0,0,0,0.05)',
                },
              }
            : {
                primary: { main: '#7d97ff', light: '#a3b5ff', dark: '#5873e6', contrastText: '#0d1015' },
                secondary: { main: '#a3aabb' },
                background: { default: '#0d1015', paper: '#151922' },
                text: { primary: '#eef0f5', secondary: '#a3aabb', disabled: '#5d6474' },
                divider: 'rgba(238,240,245,0.08)',
                action: {
                  hover: 'rgba(255,255,255,0.04)',
                  selected: 'rgba(255,255,255,0.07)',
                  disabledBackground: 'rgba(255,255,255,0.05)',
                },
              }),
        },
        typography: {
          fontFamily: 'var(--font-satoshi), system-ui, -apple-system, sans-serif',
          button: { textTransform: 'none', fontWeight: 500 },
          body2: { fontSize: '0.8125rem' },
          caption: { fontSize: '0.75rem' },
        },
        shape: { borderRadius: 8 },
        components: {
          MuiCssBaseline: {
            styleOverrides: {
              body: {
                scrollbarWidth: 'thin',
                scrollbarColor: mode === 'dark'
                  ? 'rgba(255,255,255,0.12) transparent'
                  : 'rgba(0,0,0,0.15) transparent',
              },
            },
          },
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: '7px',
                boxShadow: 'none',
                '&:hover': { boxShadow: 'none' },
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: '10px',
                backgroundImage: 'none',
                boxShadow: mode === 'light'
                  ? '0 1px 2px 0 rgba(0,0,0,0.05)'
                  : '0 1px 3px 0 rgba(0,0,0,0.4)',
              },
            },
          },
          MuiListItemButton: {
            styleOverrides: {
              root: {
                borderRadius: '6px',
                '&.Mui-selected': {
                  backgroundColor: mode === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)',
                  '&:hover': {
                    backgroundColor: mode === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.10)',
                  },
                },
              },
            },
          },
          MuiDivider: {
            styleOverrides: {
              root: {
                borderColor: mode === 'light' ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.07)',
              },
            },
          },
          MuiTooltip: {
            styleOverrides: {
              tooltip: {
                borderRadius: '6px',
                fontSize: '0.75rem',
                backgroundColor: mode === 'light' ? '#10131a' : '#262c3b',
              },
            },
          },
          MuiMenu: {
            styleOverrides: {
              paper: {
                borderRadius: '10px',
                border: `1px solid ${mode === 'light' ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.07)'}`,
                boxShadow: mode === 'light'
                  ? '0 10px 38px -10px rgba(0,0,0,0.2), 0 2px 8px -4px rgba(0,0,0,0.1)'
                  : '0 10px 38px -10px rgba(0,0,0,0.6), 0 2px 8px -4px rgba(0,0,0,0.4)',
              },
            },
          },
        },
      }),
    [mode]
  );

  return (
    <ColorModeContext.Provider value={{ toggleColorMode, mode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
};
