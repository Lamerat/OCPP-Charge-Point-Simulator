import { getId, OCPPDate } from '../common/help-functions';


const metaDataType = {
  connectorId: 0,
  bootNotification: {},
  RFIDTag: null,
  status: null,
  idTag: null,
  meterStart: null,
  meterStop: null,
  currentMeterValue: null,
  diagnosticStatus: null,
  firmWareStatus: null,
}


/**
 * Send Command to OCPP Central System
 * @param { string } command 
 * @param { metaDataType } metaData
 */
export const sendCommand = (command, metaData) => {
  const id = getId()
  let message

  switch (command) {
    case 'Heartbeat':
      message = {}
      break;
    case 'BootNotification':
      message = metaData.bootNotification
      break;
    case 'Authorize':
      message = { idTag: metaData.RFIDTag }
      break;
    case 'StatusNotification':
      message = {
        connectorId: metaData.connectorId,
        status: metaData.status,
        errorCode: 'NoError',
        info: '',
        timestamp: OCPPDate(new Date()),
        vendorId: '',
        vendorErrorCode: ''
      }
      break;
    case 'StartTransaction':
      message = {
        connectorId: metaData.connectorId,
        idTag: metaData.idTag,
        meterStart: metaData.startMeterValue,
        timestamp: OCPPDate(new Date()),
        // reservationId: ''
      }
      break;
    case 'StopTransaction':
      message = {
        // idTag: '',
        meterStop: metaData.currentMeterValue,
        timestamp: OCPPDate(new Date()),
        transactionId: metaData.transactionId,
        reason: metaData.stopReason,
        // transactionData: ''
      }
      break;
    case 'MeterValues':
      message = {
        connectorId: metaData.connectorId,
        transactionId: metaData.transactionId,
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
              { measurand: 'Energy.Active.Import.Register', unit: 'Wh', value: metaData.currentMeterValue.toString() },
              { measurand: 'Power.Active.Import', unit: 'W', value: '3290' }
            ]
          }
        ]
      }
      break;
    case 'DiagnosticsStatusNotification':
      message = { status: metaData.diagnosticStatus }
      break;
    case 'FirmwareStatusNotification':
      message = { status: metaData.firmWareStatus }
      break;
    default:
      message = {}
      break;
  }

  return {
    ocppCommand: JSON.stringify([ 2, id, command, message ]),
    lastCommand: { id, command, connector: metaData.connectorId || metaDataType.connectorId }
  }
}