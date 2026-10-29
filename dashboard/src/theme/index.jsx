import React, { createContext, useState, useMemo, useContext, useEffect } from 'react';
import { createTheme, ThemeProvider, CssBaseline } from '@mui/material';

const ColorModeContext = createContext({ toggleColorMode: () => {} });

export const useColorMode = () => useContext(ColorModeContext);

export const ThemeContextProvider = ({ children }) => {
  const [mode, setMode] = useState(() => {
    const savedMode = localStorage.getItem('themeMode');
    return savedMode || 'dark';
  });

  const toggleColorMode = () => {
    setMode((prevMode) => {
      const newMode = prevMode === 'light' ? 'dark' : 'light';
      localStorage.setItem('themeMode', newMode);
      return newMode;
    });
  };

  useEffect(() => {
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [mode]);

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          ...(mode === 'light'
            ? {
                primary: { main: '#0f172a', light: '#334155', dark: '#020617', contrastText: '#fff' },
                secondary: { main: '#64748b' },
                background: { default: '#f8fafc', paper: '#ffffff' },
                text: { primary: '#0f172a', secondary: '#475569', disabled: '#94a3b8' },
                divider: 'rgba(0,0,0,0.08)',
                action: {
                  hover: 'rgba(0,0,0,0.035)',
                  selected: 'rgba(0,0,0,0.06)',
                  disabledBackground: 'rgba(0,0,0,0.04)',
                },
              }
            : {
                primary: { main: '#e4e4e7', light: '#f4f4f5', dark: '#a1a1aa', contrastText: '#09090b' },
                secondary: { main: '#71717a' },
                background: { default: '#09090b', paper: '#111113' },
                text: { primary: '#fafafa', secondary: '#a1a1aa', disabled: '#52525b' },
                divider: 'rgba(255,255,255,0.07)',
                action: {
                  hover: 'rgba(255,255,255,0.04)',
                  selected: 'rgba(255,255,255,0.07)',
                  disabledBackground: 'rgba(255,255,255,0.05)',
                },
              }),
        },
        typography: {
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
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
                  ? '0 1px 3px 0 rgba(0,0,0,0.04), 0 1px 2px -1px rgba(0,0,0,0.02)'
                  : '0 1px 3px 0 rgba(0,0,0,0.4)',
                border: mode === 'light' ? '1px solid rgba(0,0,0,0.07)' : '1px solid rgba(255,255,255,0.07)',
              },
            },
          },
          MuiListItemButton: {
            styleOverrides: {
              root: {
                borderRadius: '6px',
                '&.Mui-selected': {
                  backgroundColor: mode === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.08)',
                  '&:hover': {
                    backgroundColor: mode === 'light' ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.10)',
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
                backgroundColor: mode === 'light' ? '#0f172a' : '#27272a',
              },
            },
          },
          MuiMenu: {
            styleOverrides: {
              paper: {
                borderRadius: '10px',
                border: `1px solid ${mode === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.07)'}`,
                boxShadow: mode === 'light'
                  ? '0 10px 30px -8px rgba(0,0,0,0.12), 0 2px 6px -2px rgba(0,0,0,0.06)'
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
