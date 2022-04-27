import moment from 'moment';
import { getId, OCPPDate } from '../common/help-functions';
import { commands, logTypes, activeLog } from '../common/constants';


export const sendCommand = (setLogs, settings, settingsState ) => (command, connector = 0) => {
  const id = getId()
  let message

  switch (command) {
    case 'Heartbeat':
      message = {}
      break;
    case 'BootNotification':
      message = settingsState.bootNotification
      break;
    case 'Authorize':
      message = { idTag: settingsState.mainSettings.RFIDTag }
      break;
    case 'StatusNotification':
      message = {
        connectorId: settings[connector].id,
        status: settings[connector].status,
        errorCode: 'NoError',
        info: '',
        timestamp: OCPPDate(new Date()),
        vendorId: '',
        vendorErrorCode: ''
      }
      break;
    case 'StartTransaction':
      message = {
        connectorId: settings[connector].id,
        idTag: settings[connector].idTag,
        meterStart: settings[connector].startMeterValue,
        timestamp: OCPPDate(new Date()),
        // reservationId: ''
      }
      break;
    case 'StopTransaction':
      message = {
        // idTag: '',
        meterStop: settings[connector].currentMeterValue,
        timestamp: OCPPDate(new Date()),
        transactionId: settings[connector].transactionId,
        reason: settings[connector].stopReason,
        // transactionData: ''
      }
      break;
    case 'MeterValues':
      message = {
        connectorId: settings[connector].id,
        transactionId: settings[connector].transactionId,
        meterValue: [
          {
            timestamp: OCPPDate(new Date()),
            sampledValue: [
              { measurand: 'Voltage', phase: 'L1', unit: 'V', value: '222' },
              { measurand: 'Voltage', phase: 'L2', unit: 'V', value: '223' },
              { measurand: 'Voltage', phase: 'L3', unit: 'V', value: '223' },
              { measurand: 'Current.Import', phase: 'L1', unit: 'A', value: '0' },
              { measurand: 'Current.Import', phase: 'L2', unit: 'A', value: '0' },
              { measurand: 'Current.Import', phase: 'L3', unit: 'A', value: '0' },
              { measurand: 'Energy.Active.Import.Register', unit: 'Wh', value: settings[connector].currentMeterValue.toString() },
              { measurand: 'Power.Active.Import', unit: 'W', value: '3290' }
            ]
          }
        ]
      }
      break;
    default:
      message = {}
      break;
  }

  const data = JSON.stringify([ 2, id, command, message ])
  commands.push({ id, command, connector })

  activeLog.push({ time: moment().format('HH:mm:ss'), type: logTypes.send, command, message: JSON.stringify(message) })
  setLogs([ ...activeLog ])
  settings.webSocket.send(data)
}

