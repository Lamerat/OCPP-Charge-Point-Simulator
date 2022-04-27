import { nanoid } from "nanoid"
import stationSettings from './station-config'

const defaultSettings = {
  mainSettings: {
    protocol: 'ws',
    address: 'localhost',
    port: 5000,
    chargePointId: '00000001111',
    OCPPversion: 'ocpp1.6',
    RFIDTag: nanoid(20),
    numberOfConnectors: 2,
  },

  bootNotification: {
    chargePointVendor: 'Fidana',
    chargePointModel: 'Fidana-Virtual',
    chargePointSerialNumber: '0000008797',
    chargeBoxSerialNumber: '0000008797',
    firmwareVersion: '0.9.87',
    iccid: '',
    imsi: '',
    meterType: 'ELM NQC-ACDC',
    meterSerialNumber: 'elm.001.13.1.01'
  },

  stationSettings: stationSettings.configurationKey,
}

export default defaultSettings
