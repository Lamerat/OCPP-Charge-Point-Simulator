import { createContext } from 'react';

const LogContext = createContext({
  logs: [],
  setLogs: () => null
});

export default LogContext;
