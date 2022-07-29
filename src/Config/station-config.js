const stationSettings = {
    configurationKey: [
        {
            key: 'AuthorizeRemoteTxRequests',
            readonly: true,
            value: "false"
        },
        {
            key: 'ClockAlignedDataInterval',
            readonly: true,
            value: '0'
        },
        {
            key: 'ConnectionTimeOut',
            readonly: false,
            value: '60'
        },
        {
            key: 'GetConfigurationMaxKeys',
            readonly: true,
            value: '0'
        },
        {
            key: 'HeartbeatInterval',
            readonly: false,
            value: '1800'
        },
        {
            key: 'LocalAuthorizeOffline',
            readonly: true,
            value: "false"
        },
        {
            key: 'LocalPreAuthorize',
            readonly: true,
            value: "false"
        },
        {
            key: 'MeterValuesAlignedData',
            readonly: true,
            value: '0'
        },
        {
            key: 'MeterValuesSampledData',
            readonly: true,
            value: 'Voltage.L1,Voltage.L2,Voltage.L3,Current.Import.L1,Current.Import.L2,Current.Import.L3,Energy.Active.Import.Register,Power.Active.Import'
        },
        {
            key: 'StopTransactionOnEVSideDisconnect',
            readonly: true,
            value: "true"
        },
        {
            key: 'StopTransactionOnInvalidId',
            readonly: true,
            value: "true"
        },
        {
            key: 'StopTxnAlignedData',
            readonly: true,
            value: ' '
        },
        {
            key: 'StopTxnSampledData',
            readonly: true,
            value: ' '
        },
        {
            key: 'MeterValueSampleInterval',
            readonly: false,
            value: '300'
        },
        {
            key: 'NumberOfConnectors',
            readonly: true,
            value: '1'
        },
        {
            key: 'ConnectorPhaseRotation',
            readonly: true,
            value: 'Unknown'
        },
        {
            key: 'SupportedFeatureProfiles',
            readonly: true,
            value: 'Core,Reservation,SmartCharging,RemoteTrigger'
        },
        {
            key: 'ResetRetries',
            readonly: false,
            value: '3'
        },
        {
            key: 'TransactionMessageAttempts',
            readonly: false,
            value: '3'
        },
        {
            key: 'TransactionMessageRetryInterval',
            readonly: false,
            value: '60'
        },
        {
            key: 'UnlockConnectorOnEVSideDisconnect',
            readonly: true,
            value: "true"
        },
        {
            key: 'ChargeProfileMaxStackLevel',
            readonly: true,
            value: '1'
        },
        {
            key: 'ChargingScheduleAllowedChargingRateUnit',
            readonly: true,
            value: 'Current'
        },
        {
            key: 'ChargingScheduleMaxPeriods',
            readonly: true,
            value: '1'
        },
        {
            key: 'MaxChargingProfilesInstalled',
            readonly: true,
            value: '1'
        },
        {
            key: 'PricePerKwh',
            readonly: false,
            value: '0'
        },
        {
            key: 'AllowOfflineTxForFreemode',
            readonly: true,
            value: '0'
        },
        {
            key: 'WebSocketPingInterval',
            readonly: false,
            value: '600'
        }
    ],
    'unknownKey': []
}

export default stationSettings