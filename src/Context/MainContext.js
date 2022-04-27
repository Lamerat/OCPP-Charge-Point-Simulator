import { createContext } from 'react';
import { chargePointSettings } from '../Config/charge-point-settings';


const MainContext = createContext({
  settingsState: chargePointSettings,
  setSettingsState: () => {}
});

export default MainContext;
