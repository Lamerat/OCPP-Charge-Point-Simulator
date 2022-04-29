import React, { useState } from 'react';
import Main from './Components/Main/Main';
import MenuBar from './Components/MenuBar/MenuBar';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Settings from './Components/Settings/Settings';
import SettingsContext from './Context/SettingsContext';
// import MainContext from './Context/MainContext';
// import LogContext from './Context/LogContext';
import defaultSettings from './Config/default-settings';
// import { chargePointSettings } from './Config/charge-point-settings';


function App() {
  const [ settingsState, setSettingsState ] = useState((JSON.parse(localStorage.getItem('OCPPSettings'))) || defaultSettings);
  // const [ settings, setSettings ] = useState(chargePointSettings)
  // const [ logs, setLogs ] = useState([])

  return (
    // <MainContext.Provider value={{ settings, setSettings }}>
      <SettingsContext.Provider value={{ settingsState, setSettingsState }}>
        {/* <LogContext.Provider value={{ logs, setLogs }}> */}
        <BrowserRouter>
          <MenuBar />
          <Routes>
            <Route exact path='/' element={<Main />}/>
            <Route exact path='/settings' element={<Settings />}/>
          </Routes>
        </BrowserRouter>
        {/* </LogContext.Provider> */}
      </SettingsContext.Provider>
    // </MainContext.Provider>
  );
}

export default App;
