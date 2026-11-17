import React, { useState } from 'react';
import Main from './Components/Main/Main';
import MenuBar from './Components/MenuBar/MenuBar';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Settings from './Components/Settings/Settings';
import SettingsContext from './Context/SettingsContext';
import defaultSettings from './Config/default-settings';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';

const theme = createTheme({
  palette: {
    primary: { main: '#2563eb', dark: '#1d4ed8' },
    secondary: { main: '#64748b' },
    background: { default: '#f4f7fb', paper: '#ffffff' },
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    button: { fontWeight: 700, textTransform: 'none', letterSpacing: 0 },
  },
  components: {
    MuiPaper: { styleOverrides: { root: { border: '1px solid #e7edf5', boxShadow: '0 8px 24px rgba(15, 23, 42, 0.05)' } } },
    MuiButton: { styleOverrides: { root: { borderRadius: 9, minHeight: 40 } } },
    MuiOutlinedInput: { styleOverrides: { root: { backgroundColor: '#fff' } } },
  },
});


function App() {
  const mergeStationSettings = (defaults, stored) => {
    const storedMap = new Map(stored.map(s => [s.key, s]));
    return defaults.map(d => storedMap.get(d.key) || d);
  };
  const stored = JSON.parse(localStorage.getItem('OCPPSettings')) || null;

  const initialSettings = stored
    ? {
        ...stored, // keep mainSettings and other old data
        stationSettings: mergeStationSettings(
          defaultSettings.stationSettings,
          stored.stationSettings
        )
      }
    : defaultSettings;

  const [settingsState, setSettingsState] = useState(initialSettings);


  
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SettingsContext.Provider value={{ settingsState, setSettingsState }}>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <MenuBar />
          <Routes>
            <Route path='/' element={<Main />}/>
            <Route path='/settings' element={<Settings />}/>
          </Routes>
        </BrowserRouter>
      </SettingsContext.Provider>
    </ThemeProvider>
  );
}

export default App;
