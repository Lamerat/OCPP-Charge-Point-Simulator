import { sendCommand } from './OCPP-Commands'

test('builds a faulted StatusNotification with an OCPP error code', () => {
  const { ocppCommand } = sendCommand('StatusNotification', {
    connectorId: 1,
    status: 'Faulted',
    errorCode: 'OtherError',
    info: 'Fault scenario injected by simulator',
  })

  const [, , command, payload] = JSON.parse(ocppCommand)
  expect(command).toBe('StatusNotification')
  expect(payload).toMatchObject({
    connectorId: 1,
    status: 'Faulted',
    errorCode: 'OtherError',
    info: 'Fault scenario injected by simulator',
  })
})
