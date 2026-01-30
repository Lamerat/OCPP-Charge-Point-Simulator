import React, { useState } from 'react';
import Main from './Components/Main/Main';
import MenuBar from './Components/MenuBar/MenuBar';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Settings from './Components/Settings/Settings';
import SettingsContext from './Context/SettingsContext';
import defaultSettings from './Config/default-settings';



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
      <SettingsContext.Provider value={{ settingsState, setSettingsState }}>
        <BrowserRouter>
          <MenuBar />
          <Routes>
            <Route exact path='/' element={<Main />}/>
            <Route exact path='/settings' element={<Settings />}/>
          </Routes>
        </BrowserRouter>
      </SettingsContext.Provider>
  );
}

export default App;
