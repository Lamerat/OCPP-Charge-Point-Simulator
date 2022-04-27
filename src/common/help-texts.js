export const helpBootNotification = {
  chargeBoxSerialNumber: {
    type: 'String[25]',
    description: 'Optional. This contains a value that identifies the serial number of the Charge Box inside the Charge Point. Deprecated, will be removed in future version.'
  },

  chargePointModel: {
    type: 'String[20]',
    description: 'Required. This contains a value that identifies the model of the ChargePoint'
  },

  chargePointSerialNumber: {
    type: 'String[25]',
    description: 'Optional. This contains a value that identifies the serial number of the Charge Point.'
  },

  chargePointVendor: {
    type: 'String[20]',
    description: 'Required. This contains a value that identifies the vendor of the ChargePoint.'
  },

  firmwareVersion: {
    type: 'String[50]',
    description: 'Optional. This contains the firmware version of the Charge Point.'
  },

  iccid: {
    type: 'String[20]',
    description: 'Optional. This contains the ICCID ( Integrated Circuit Card Identification Number ) of the modem’s SIM card.'
  },

  imsi: {
    type: 'String[20]',
    description: 'Optional. This contains the IMSI ( International mobile subscriber identity ) of the modem’s SIM card.'
  },

  meterSerialNumber: {
    type: 'String[25]',
    description: 'Optional. This contains the serial number of the main power meter of the Charge Point.'
  },

  meterType: {
    type: 'String[25]',
    description: 'Optional. This contains the type of the main power meter of the Charge Point.'
  }
}