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


export const helpFirmwareStatus = {
  Downloaded: 'New firmware has been downloaded by Charge Point.',
  DownloadFailed: 'Charge point failed to download firmware.',
  Downloading: 'Firmware is being downloaded.',
  Idle: 'Charge Point is not performing firmware update related tasks. Status Idle SHALL only be used as in a FirmwareStatusNotification.req that was triggered by a TriggerMessage.req',
  InstallationFailed: 'Installation of new firmware has failed.',
  Installing: 'Firmware is being installed.',
  Installed: 'New firmware has successfully been installed in charge point.',
}



export const simulateInfo = {
  diagnosticFileName: {
    description: 'This contains the name of the file with diagnostic information that will be uploaded. This field is not present when no diagnostic information is available.',
    valueDescription: ''
  },
  
  diagnosticUploadTime: {
    description: `Simulator don't upload diagnostic file on real. Just after definitely time return Diagnostics Status Notification.`,
    valueDescription: 'Now long simulate ftp uploading (in seconds)'
  },

  diagnosticStatus: {
    description: `After time for upload finish, what status want to return.`,
    valueDescription: {
      Uploaded: 'Diagnostics information has been uploaded.',
      UploadFailed: 'Uploading of diagnostics failed.'
    }
  },

  firmWareStatus: {
    description: `Simulator still don't support firmWareStatus. Only return FirmWare Status after remote command. This field select returned status.`,
    valueDescription: { ...helpFirmwareStatus }
  },

  connectorOneUnlock: {
    description: `What status return connector after Central System request unlock connector.`,
    valueDescription: {
      Unlocked: 'Connector has successfully been unlocked.',
      UnlockFailed: 'Failed to unlock the connector',
    }
  },

  connectorTwoUnlock: {
    description: `What status return connector after Central System request unlock connector.`,
    valueDescription: {
      Unlocked: 'Connector has successfully been unlocked.',
      UnlockFailed: 'Failed to unlock the connector',
    }
  }
  
}
