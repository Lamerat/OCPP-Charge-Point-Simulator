# OCPP Charge point simulator

## Simple charge point simulator, support OCPP JSON-1.6

### Implemented functions

#### Operations Initiated by Charge Point
* Boot Notification
* Authorize
* Heartbeat
* Meter Values
* Start Transaction
* Stop Transaction
* Status Notification

#### Operations Initiated by Central System
* Remote Start Transaction
* Remote Stop Transaction
* Unlock connector
* GetConfiguration
* ChangeConfiguration
* TriggerMessage
  * BootNotification
  * Heartbeat
  * MeterValues
  * StatusNotification
  * DiagnosticsStatusNotification
  * FirmwareStatusNotification
* GetDiagnostics