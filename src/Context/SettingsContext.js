import { createContext } from 'react';
import defaultSettings from '../Config/default-settings';

const SettingsContext = createContext({
  settingsState: defaultSettings,
  setSettingsState: () => {}
});

export default SettingsContext;
