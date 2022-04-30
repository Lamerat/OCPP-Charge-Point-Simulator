import React, { useState } from 'react';
import Main from './Components/Main/Main';
import MenuBar from './Components/MenuBar/MenuBar';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Settings from './Components/Settings/Settings';
import SettingsContext from './Context/SettingsContext';
import defaultSettings from './Config/default-settings';



function App() {
  const [ settingsState, setSettingsState ] = useState((JSON.parse(localStorage.getItem('OCPPSettings'))) || defaultSettings);  

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
