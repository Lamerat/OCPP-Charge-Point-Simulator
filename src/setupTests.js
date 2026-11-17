import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Node 25 also exposes storage globals; use the browser storage from jsdom.
vi.stubGlobal('localStorage', jsdom.window.localStorage);
vi.stubGlobal('sessionStorage', jsdom.window.sessionStorage);

afterEach(() => {
  cleanup();
  localStorage.clear();
  window.history.replaceState({}, '', '/');
});
