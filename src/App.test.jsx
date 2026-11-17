import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import App from './App';
import { socketInfo } from './common/constants';

test('renders fault scenarios disabled until the charge point connects', async () => {
  const user = userEvent.setup();
  render(<App />);
  expect(screen.getByRole('heading', { name: /fault scenarios/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /inject fault for connector 1/i })).toBeDisabled();
  const alwaysReject = screen.getByRole('switch', { name: /always reject/i });
  expect(alwaysReject).not.toBeChecked();

  await user.click(alwaysReject);
  expect(alwaysReject).toBeChecked();
});

test('navigates settings and saves values through the updated MUI inputs', async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('button', { name: 'Settings' }));
  expect(screen.getByRole('heading', { name: /simulator settings/i })).toBeInTheDocument();

  const port = screen.getByRole('spinbutton', { name: 'Port' });
  expect(port).toHaveAttribute('min', '1');
  expect(port).toHaveAttribute('max', '65535');
  await user.clear(port);
  await user.type(port, '9000');
  await user.click(screen.getByRole('button', { name: 'Save' }));
  expect(JSON.parse(localStorage.getItem('OCPPSettings')).mainSettings.port).toBe('9000');

  await user.click(screen.getByRole('tab', { name: 'Boot notification' }));
  expect(screen.getByRole('textbox', { name: 'Charge Point Vendor' })).toBeInTheDocument();
  await user.click(screen.getByRole('tab', { name: 'Station' }));
  expect(screen.getAllByRole('switch').length).toBeGreaterThan(0);
  await user.click(screen.getByRole('tab', { name: 'Simulation' }));
  expect(screen.getByRole('spinbutton', { name: 'Upload diagnostic file time' })).toHaveAttribute('min', '0');

  await user.click(screen.getByRole('button', { name: 'Home' }));
  expect(screen.getByRole('heading', { name: /simulation workspace/i })).toBeInTheDocument();
});

test('connects with the OCPP subprotocol and sends a boot notification', async () => {
  const socket = { send: vi.fn(), close: vi.fn(), url: 'ws://localhost:5000/00000001111' };
  const WebSocketMock = vi.spyOn(globalThis, 'WebSocket').mockImplementation(function () { return socket; });
  try {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: /connect to central system/i }));
    expect(WebSocketMock).toHaveBeenCalledWith(socket.url, ['ocpp1.6']);
    act(() => socket.onopen());
    expect(screen.getByRole('button', { name: /inject fault for connector 1/i })).toBeEnabled();
    const [type, id, command, payload] = JSON.parse(socket.send.mock.calls[0][0]);
    expect(type).toBe(2);
    expect(id).toEqual(expect.any(String));
    expect(command).toBe('BootNotification');
    expect(payload).toMatchObject({ chargePointVendor: 'Elmo', chargePointModel: 'Elmo-Virtual1' });
    act(() => socket.onclose({ code: 1000, wasClean: true, reason: '' }));
    expect(screen.getByRole('button', { name: /inject fault for connector 1/i })).toBeDisabled();
  } finally {
    socketInfo.webSocket = null;
    socketInfo.lastStatus = null;
    WebSocketMock.mockRestore();
  }
});
