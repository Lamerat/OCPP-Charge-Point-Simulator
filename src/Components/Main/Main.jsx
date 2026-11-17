import React, { useEffect, useContext, useState, useRef } from "react";
import { Container, Box, Typography, Tooltip, Divider, Grid, Paper, Stack, Popover, TextField, ToggleButton, ToggleButtonGroup, InputAdornment, Alert, Dialog, DialogTitle, DialogContent, IconButton } from '@mui/material'
import ChargePoint from '../ChargePoint/ChargePoint'
import moment from "moment";
import Connector from "../Connector/Connector";
import FaultScenarios from '../FaultScenarios/FaultScenarios';
import SettingsContext from '../../Context/SettingsContext';
import { pointStatus, connectedStatuses } from '../../Config/charge-point-settings';
import { MonitorHeartOutlined, Speed, Clear, EvStationOutlined, Search, Close } from "@mui/icons-material";
import { logTypes, commands, connectors, connectorStatus, socketInfo, stopReason } from "../../common/constants";
import { sendCommand } from "../../OCPP/OCPP-Commands";
import { buildWebSocketUrl } from '../../common/help-functions';


let heartbeatInterval
let meterValueInterval = {
  1: null,
  2: null,
}

let uploadInterval
let uploadSeconds
const REMOTE_STOP_RECONNECT_DELAY_MS = 10000
const FAULT_SCENARIO_CLOSE_DELAY_MS = 100

const getTime = () => moment().format('HH:mm:ss')
const logArray = []

const closeCodeHints = {
  1000: 'The server closed the connection normally.',
  1001: 'The server is going away or restarting.',
  1002: 'The server rejected the WebSocket protocol or sent an invalid frame.',
  1003: 'The server rejected the message data type.',
  1006: 'The browser did not receive a close frame. Check that the server is reachable, the ws/wss scheme is correct, and any proxy permits WebSocket upgrades.',
  1008: 'The server rejected the request because of a policy violation; verify the charge point ID and authorization rules.',
  1011: 'The server reported an unexpected internal error.',
  1015: 'The TLS handshake failed. Confirm the certificate and use wss:// for secure endpoints.',
}

const describeClose = (event, socket, startedAt) => {
  const elapsed = startedAt ? `${((Date.now() - startedAt) / 1000).toFixed(1)}s` : 'before opening'
  const reason = event.reason ? ` Server reason: ${event.reason}.` : ''
  const hint = closeCodeHints[event.code] || 'Check the central system logs for the close reason.'
  return `Connection problem — code ${event.code}${event.wasClean ? ' (clean close)' : ' (unclean close)'} after ${elapsed}. Endpoint: ${socket.url}. Protocol: ${socket.protocol || 'not negotiated'}. ${hint}${reason}`
}


const Main = () => {
  const { settingsState, setSettingsState } = useContext(SettingsContext)
  
  const [ ws, setWs ] = useState(socketInfo.webSocket || '')
  const [ logs, setLogs ] = useState(logArray)
  const [ status, setStatus ] = useState(socketInfo.lastStatus || pointStatus.disconnected)
  const [ conOne, setConOne ] = useState(connectors[1])
  const [ conTwo, setConTwo ] = useState(connectors[2])

  const [ uploading, setUploading ] = useState(false)
  const [ seconds, setSeconds ] = useState(settingsState.simulation.diagnosticUploadTime)
  const [ initialBootNotification, setInitialBootNotification ] = useState(false)
  const [ helpAnchorEl, setHelpAnchorEl ] = useState(null)
  const [ helpText, setHelpText ] = useState('')
  const [ logSearch, setLogSearch ] = useState('')
  const [ logFilters, setLogFilters ] = useState([])
  const [ selectedLog, setSelectedLog ] = useState(null)
  // A remote stop can deliberately interrupt the socket before StopTransaction
  // is delivered. Keep the details outside React state so they survive the
  // disconnect/reconnect render cycle.
  const remoteStopRecovery = useRef(null)
  const pendingStopStatus = useRef({})
  const rejectNextAuthorization = useRef(false)
  const connectionStartedAt = useRef(null)
  const socketErrorSeen = useRef(false)

  const updateConnector = {
    1: setConOne,
    2: setConTwo,
  }
  
  const open = Boolean(helpAnchorEl);

  const logsEndRef = useRef(null)
  const scrollToBottom = () => {
    if (typeof logsEndRef.current?.scrollIntoView === 'function') {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }
  useEffect(() => scrollToBottom(), [logs])

  const showHelpText = (event, type) => {
    const getData = (settingsState.stationSettings.filter(x => x.key === type))[0]
    setHelpText(`${type} set to ${getData.value} seconds`)
    setHelpAnchorEl(event.target)
  }


  const updateLog = (record) => {
    logArray.push(record)
    setLogs([ ...logArray])
  }


  const clearLog = () => {
    logArray.length = 0
    setLogs([])
  }

  const filteredLogs = logs.filter((entry) => {
    const matchesType = logFilters.length === 0 || logFilters.includes(entry.type.text)
    const searchableText = `${entry.time} ${entry.type.text} ${entry.command || ''} ${entry.message || ''}`.toLowerCase()
    return matchesType && searchableText.includes(logSearch.trim().toLowerCase())
  })

  const getNextStep = () => {
    if (status.status === pointStatus.error.status) return { severity: 'error', title: 'Connection needs attention', text: 'Review the error event in the activity log, update the endpoint if needed, then connect again.' }
    if (status.status === pointStatus.disconnected.status) return { severity: 'info', title: 'Start by connecting', text: 'Connect to the central system to send a BootNotification and unlock connector controls.' }
    if (status.status === pointStatus.connecting.status) return { severity: 'info', title: 'Connecting to the central system', text: 'Waiting for the WebSocket handshake to complete.' }
    if (conOne.inTransaction || conTwo.inTransaction) return { severity: 'success', title: 'Transaction in progress', text: 'Adjust meter values or state of charge, then stop the transaction when your test is complete.' }
    if (status.status === pointStatus.authorized.status) return { severity: 'success', title: 'Tag authorized', text: 'Choose a connector and start a transaction.' }
    return { severity: 'info', title: 'Charge point connected', text: 'Authorize the configured RFID tag to begin a transaction.' }
  }

  const formatLogMessage = (message) => {
    if (typeof message !== 'string') return JSON.stringify(message, null, 2)
    try {
      return JSON.stringify(JSON.parse(message), null, 2)
    } catch {
      return message
    }
  }


  const uploadSimulate = () => {
    if (uploadSeconds === 0) {
      const result = sendCommand('DiagnosticsStatusNotification', { diagnosticStatus: settingsState.simulation.diagnosticStatus })
      centralSystemSend(result.ocppCommand, result.lastCommand)
      clearInterval(uploadInterval)
      setUploading(false)
      return
    }
    uploadSeconds = uploadSeconds - 1
    setSeconds(uploadSeconds)
  }


  const centralSystemSend = (command, localCommand) => {
    ws.send(command)
    commands.push(localCommand)
    updateLog({ time: getTime(), type: logTypes.send, command: localCommand.command, message: command })
  }

  const reconnectAfterRemoteStop = () => {
    const { protocol, address, port, chargePointId, OCPPversion } = settingsState.mainSettings
    socketInfo.webSocket = new WebSocket(buildWebSocketUrl({ protocol, address, port, chargePointId }), [ OCPPversion ])
    setWs(socketInfo.webSocket)
    setStatus(pointStatus.connecting)
  }

  const setConnectorFinishing = (connectorId) => {
    connectors[connectorId].inTransaction = false
    connectors[connectorId].status = connectorStatus.Finishing
    updateConnector[connectorId]({ ...connectors[connectorId] })
  }

  const sendPendingRemoteStop = () => {
    const pendingStop = remoteStopRecovery.current
    if (!pendingStop) return

    // Do not depend on the previous Charging state: the reconnect must always
    // report the physical EVSE as blocked/Finishing.
    setConnectorFinishing(pendingStop.connectorId)
    const endTransaction = sendCommand('StopTransaction', pendingStop)
    centralSystemSend(endTransaction.ocppCommand, endTransaction.lastCommand)
    remoteStopRecovery.current = null

    const finishingStatus = sendCommand('StatusNotification', {
      connectorId: pendingStop.connectorId,
      status: connectorStatus.Finishing,
    })
    centralSystemSend(finishingStatus.ocppCommand, finishingStatus.lastCommand)
  }

  const sendConnectorStatus = (connectorId, connectorStatusValue, errorCode, info) => {
    const result = sendCommand('StatusNotification', { connectorId, status: connectorStatusValue, errorCode, info })
    centralSystemSend(result.ocppCommand, result.lastCommand)
  }

  const setScenarioConnectorStatus = (connectorId, connectorStatusValue) => {
    connectors[connectorId] = { ...connectors[connectorId], status: connectorStatusValue }
    updateConnector[connectorId]({ ...connectors[connectorId] })
  }

  const stopTransactionForScenario = (connectorId, reason, finalStatus) => {
    const connector = connectors[connectorId]
    if (!connector.inTransaction) return false

    clearInterval(meterValueInterval[connectorId])
    meterValueInterval[connectorId] = null
    pendingStopStatus.current[connectorId] = finalStatus
    connectors[connectorId] = { ...connector, inTransaction: false, stopReason: reason, status: finalStatus }
    updateConnector[connectorId]({ ...connectors[connectorId] })

    const result = sendCommand('StopTransaction', {
      connectorId,
      currentMeterValue: connector.currentMeterValue,
      transactionId: connector.transactionId,
      stopReason: reason,
    })
    centralSystemSend(result.ocppCommand, result.lastCommand)
    return true
  }

  const runFaultScenario = (scenario, connectorId) => {
    const logScenario = (message) => updateLog({ time: getTime(), type: logTypes.info, message })

    switch (scenario) {
      case 'unavailable':
        setScenarioConnectorStatus(connectorId, connectorStatus.Unavailable)
        sendConnectorStatus(connectorId, connectorStatus.Unavailable)
        logScenario(`Fault scenario: connector ${connectorId} is unavailable`)
        break
      case 'faulted':
        stopTransactionForScenario(connectorId, stopReason.Other, connectorStatus.Faulted)
        setScenarioConnectorStatus(connectorId, connectorStatus.Faulted)
        sendConnectorStatus(connectorId, connectorStatus.Faulted, 'OtherError', 'Fault scenario injected by simulator')
        logScenario(`Fault scenario: connector ${connectorId} is faulted`)
        break
      case 'evDisconnect':
        if (stopTransactionForScenario(connectorId, stopReason.EVDisconnected, connectorStatus.Available)) {
          sendConnectorStatus(connectorId, connectorStatus.Available)
          logScenario(`Fault scenario: EV disconnected from connector ${connectorId}`)
        } else {
          setScenarioConnectorStatus(connectorId, connectorStatus.Available)
          sendConnectorStatus(connectorId, connectorStatus.Available)
          logScenario(`Fault scenario: EV disconnect reported on idle connector ${connectorId}`)
        }
        break
      case 'powerLoss':
        stopTransactionForScenario(connectorId, stopReason.PowerLoss, connectorStatus.Unavailable)
        setScenarioConnectorStatus(connectorId, connectorStatus.Unavailable)
        sendConnectorStatus(connectorId, connectorStatus.Unavailable)
        logScenario(`Fault scenario: power loss at connector ${connectorId}; closing the WebSocket`)
        setTimeout(() => ws.close(), FAULT_SCENARIO_CLOSE_DELAY_MS)
        break
      case 'reset':
        for (let id = 1; id <= settingsState.mainSettings.numberOfConnectors; id++) {
          stopTransactionForScenario(id, stopReason.HardReset, connectorStatus.Available)
          setScenarioConnectorStatus(id, connectorStatus.Available)
          sendConnectorStatus(id, connectorStatus.Available)
        }
        logScenario('Fault scenario: hard reset; closing the WebSocket')
        setTimeout(() => ws.close(), FAULT_SCENARIO_CLOSE_DELAY_MS)
        break
      case 'authorizationRejection':
        rejectNextAuthorization.current = true
        setStatus(pointStatus.connected)
        socketInfo.lastStatus = pointStatus.connected
        logScenario('Fault scenario armed: the next Authorize response will be handled as Invalid')
        break
      default:
        break
    }
  }


  const incomingMessage = (id, message) => {
    const getCommand = (commands.filter(x => x.id === id))[0]

    if (!getCommand) {
      updateLog( { time: getTime(), type: logTypes.error, message: 'Cannot recognize command!' })
      return
    }

    const { command, connector } = getCommand
    if (command === 'Authorize' && rejectNextAuthorization.current) {
      rejectNextAuthorization.current = false
      message = { ...message, idTagInfo: { ...(message.idTagInfo || {}), status: 'Invalid' } }
      updateLog({ time: getTime(), type: logTypes.info, message: 'Authorization rejection scenario applied to the received Authorize response' })
    }
    updateLog({ time: getTime(), type: logTypes.message, command, message: JSON.stringify(message) })
    
    if (command === 'BootNotification' && !initialBootNotification && message.status === 'Accepted') {
      // Send first heartbeat
      const result = sendCommand('Heartbeat', {})
      centralSystemSend(result.ocppCommand, result.lastCommand)

      // Send connector(s) status(es). The recovering connector is deliberately
      // sent after StopTransaction below, so the CSMS sees the final state as
      // blocked/Finishing instead of its old Charging state.
      const recoveringConnectorId = remoteStopRecovery.current?.connectorId
      for (let i = 1; i <= settingsState.mainSettings.numberOfConnectors; i++) {
        if (i === recoveringConnectorId) continue
        const currentConnector = sendCommand('StatusNotification', { connectorId: i, status: connectors[i].status })
        centralSystemSend(currentConnector.ocppCommand, currentConnector.lastCommand)
      }

      // The deliberate remote-stop disconnect is now recovered. Send the
      // session stop and an explicit Finishing retry after booting.
      sendPendingRemoteStop()

      // Set initial boot to complete
      setInitialBootNotification(true)

      // Set heartbeat interval
      const index = settingsState.stationSettings.findIndex(x => x.key === 'HeartbeatInterval')
      settingsState.stationSettings[index].value = message.interval
      heartbeatInterval = setInterval(() => {
        const result = sendCommand('Heartbeat', {})
        centralSystemSend(result.ocppCommand, result.lastCommand)
      }, settingsState.stationSettings[index].value * 1000)
    }

    if (command === 'Authorize' && message.idTagInfo?.status === 'Accepted') {
      setStatus(pointStatus.authorized)
      socketInfo.lastStatus = pointStatus.authorized
    }

    if (command === 'StartTransaction' && message.idTagInfo?.status === 'Accepted') {
      connectors[connector].transactionId = message.transactionId
      connectors[connector].inTransaction = true
      connectors[connector].status = connectorStatus.Charging
      updateConnector[connector]({ ...connectors[connector] })

      const index = settingsState.stationSettings.findIndex(x => x.key === 'MeterValueSampleInterval')

      meterValueInterval[connector] = setInterval(() => {
        connectors[connector].currentMeterValue = connectors[connector].currentMeterValue + 50
        updateConnector[connector]({ ...connectors[connector] })

        const metaData = {
          connectorId: connectors[connector].connectorId,
          transactionId: connectors[connector].transactionId,
          currentMeterValue: connectors[connector].currentMeterValue,
          stateOfCharge: connectors[connector].stateOfCharge,
        }

        const result = sendCommand('MeterValues', metaData)
        centralSystemSend(result.ocppCommand, result.lastCommand)
      }, settingsState.stationSettings[index].value * 1000)

      const statusData = sendCommand('StatusNotification', { connectorId: connector, status: connectors[connector].status })
      centralSystemSend(statusData.ocppCommand, statusData.lastCommand)
    }

    if (command === 'StartTransaction' && message.idTagInfo.status !== 'Accepted') {
      connectors[connector].status = connectorStatus.Available
      updateConnector[connector]({ ...connectors[connector] })

      const statusData = sendCommand('StatusNotification', {
        connectorId: connector,
        status: connectors[connector].status
      })
      centralSystemSend(statusData.ocppCommand, statusData.lastCommand)
    }


    if (command === 'StopTransaction' && message.idTagInfo.status === 'Accepted') {
      const finalStatus = pendingStopStatus.current[connector] ?? connectorStatus.Finishing
      delete pendingStopStatus.current[connector]
      connectors[connector].startMeterValue = 0
      connectors[connector].currentMeterValue = 0
      connectors[connector].transactionId = 0
      connectors[connector].inTransaction = false
      connectors[connector].status = finalStatus
      updateConnector[connector]({ ...connectors[connector] })
      clearInterval(meterValueInterval[connector])
      meterValueInterval[connector] = null
      const statusData = sendCommand('StatusNotification', { connectorId: connector, status: connectors[connector].status })
      centralSystemSend(statusData.ocppCommand, statusData.lastCommand)
    }

    if (command === 'StopTransaction' && message.idTagInfo?.status !== 'Accepted') {
      delete pendingStopStatus.current[connector]
    }
  }


  const incomingRequest = (id, request, payload) => {
    const acceptRespond = JSON.stringify([ 3, id, { status: 'Accepted' }])
    const rejectRespond = JSON.stringify([ 3, id, { status: 'Rejected' }])
    updateLog({ time: getTime(), type: logTypes.request, command: request, message: JSON.stringify(payload) })

    let connId = payload.connectorId
    const metaData = {}

    switch (request) {
      case 'RemoteStartTransaction': {
        if (connectors[connId].inTransaction) {
          ws.send(rejectRespond)
          return
        }

        const alwaysReject = settingsState.stationSettings.find(
          x => x.key === 'AlwaysReject'
        )?.value === 'true'

        if (alwaysReject) {
          ws.send(rejectRespond)
          return
        }


        ws.send(acceptRespond)
        connectors[connId].idTag = payload.idTag
        updateConnector[connId]({ ...connectors[connId] })

        metaData.connectorId = connId
        metaData.idTag = connectors[connId].idTag
        metaData.startMeterValue = connectors[connId].startMeterValue
        const newTransaction =  sendCommand('StartTransaction', metaData)
        centralSystemSend(newTransaction.ocppCommand, newTransaction.lastCommand)
        break;
      }
      case 'RemoteStopTransaction': {
          connId = null
          for (let i = 1; i <= settingsState.mainSettings.numberOfConnectors; i++) {
            if (connectors[i].transactionId === payload.transactionId) connId = i
          }

        if (!connId) {
          ws.send(rejectRespond)
          return
        }
        clearInterval(meterValueInterval[connId])
        meterValueInterval[connId] = null
        ws.send(acceptRespond)
        metaData.connectorId = connId
        metaData.currentMeterValue = connectors[connId].currentMeterValue
        metaData.transactionId = connectors[connId].transactionId
        metaData.stopReason = connectors[connId].stopReason

        // A remote stop immediately ends the local session. This both exposes
        // the EVSE's Finishing state to the CSMS and removes transaction-only
        // controls (including the charging animation) before its response
        // arrives.
        setConnectorFinishing(connId)

        if (settingsState.simulation.remoteStopDisconnect) {
          // Save the session-stop payload for the next connection. Marking the
          // EVSE Finishing before closing makes the status retry deterministic
          // after the CSMS has observed the disconnected/Unknown EVSE.
          remoteStopRecovery.current = { ...metaData }
          updateLog({ time: getTime(), type: logTypes.info, message: 'Remote stop accepted; simulating connection loss before session stop' })

          // Let the RemoteStopTransaction confirmation enter the send buffer
          // before closing the WebSocket.
          setTimeout(() => ws.close(), 0)
          break
        }
        const endTransaction =  sendCommand('StopTransaction', metaData)
        centralSystemSend(endTransaction.ocppCommand, endTransaction.lastCommand)
        break;
      }
      case 'TriggerMessage': {
        const { requestedMessage } = payload
        if (!connectors[connId].inTransaction && requestedMessage === 'MeterValues') {
          ws.send(rejectRespond)
          return
        }

        ws.send(acceptRespond)
        metaData.connectorId = connId
        metaData.transactionId = connectors[connId].transactionId
        metaData.currentMeterValue = connectors[connId].currentMeterValue
        metaData.status = connectors[connId].status
        metaData.bootNotification = settingsState.bootNotification
        metaData.diagnosticStatus = uploading ? 'Uploading' : 'Idle'
        metaData.firmWareStatus = settingsState.simulation.firmWareStatus
        const triggerMessage =  sendCommand(requestedMessage, metaData)
        centralSystemSend(triggerMessage.ocppCommand, triggerMessage.lastCommand)
        break;
      }
      case 'UnlockConnector': {
        const getSetting = settingsState.stationSettings.findIndex(x => x.key === 'UnlockConnectorOnEVSideDisconnect')
        if (getSetting === -1 || settingsState.stationSettings[getSetting].value === false) {
          ws.send(JSON.stringify([ 3, id, { status: 'NotSupported' }]))
          return
        }

        ws.send(JSON.stringify([ 3, id, { status: connId === 1 ? settingsState.simulation.connectorOneUnlock : settingsState.simulation.connectorTwoUnlock }]))
        break;
      }
      case 'GetConfiguration': {
        const returnConfiguration = { configurationKey: settingsState.stationSettings, unknownKey: [] }
        ws.send(JSON.stringify([ 3, id, returnConfiguration]))
        break;
      }
      case 'ChangeConfiguration': {
        const { key, value } = payload
        let changeValueStatus = 'Accepted'
        const findSetting = settingsState.stationSettings.findIndex(x => x.key === key)
        if (findSetting === -1) changeValueStatus = 'NotSupported'

        const checkSetting = settingsState.stationSettings[findSetting]
        if (checkSetting.readonly) changeValueStatus = 'Rejected'
        if ((checkSetting.value === 'true' || checkSetting.value === 'false') && value !== 'true' && value !== 'false') changeValueStatus = 'Rejected'
        if (!isNaN(checkSetting.value) && isNaN(value)) changeValueStatus = 'Rejected'
        
        ws.send(JSON.stringify([ 3, id, { status: changeValueStatus }]))

        const element = { ...checkSetting, value }
        settingsState.stationSettings[findSetting] = element
        setSettingsState( { ...settingsState } )
        break;
      }
      case 'GetDiagnostics':
        ws.send(JSON.stringify([ 3, id, { fileName: settingsState.simulation.diagnosticFileName }]))
        if (!uploading) {
          clearInterval(uploadInterval)
          setUploading(true)
          uploadSeconds = settingsState.simulation.diagnosticUploadTime
          setSeconds(uploadSeconds)
          uploadInterval = setInterval(() => uploadSimulate(), 1000)
          const result = sendCommand('DiagnosticsStatusNotification', { diagnosticStatus: 'Uploading' })
          centralSystemSend(result.ocppCommand, result.lastCommand)
        }
        break;
      default:
        break;
    }
  }


  if (ws) {
    // Handler attachment is the first point at which a newly-created socket
    // reaches this component, so it also captures failures before `open`.
    if (!connectionStartedAt.current) connectionStartedAt.current = Date.now()

    ws.onopen = () => {
      socketErrorSeen.current = false
      if (remoteStopRecovery.current) {
        setConnectorFinishing(remoteStopRecovery.current.connectorId)
      }
      setStatus(pointStatus.connected)
      socketInfo.lastStatus = pointStatus.connected
      updateLog({ time: getTime(), type: logTypes.socket, message: 'Charge point connected' })

      const initialBoot = sendCommand('BootNotification', { bootNotification: settingsState.bootNotification })
      centralSystemSend(initialBoot.ocppCommand, initialBoot.lastCommand)
    }

    ws.onerror = () => {
      // Browsers intentionally hide low-level WebSocket error details. The
      // subsequent close event supplies the actionable code and endpoint.
      if (!socketErrorSeen.current) {
        socketErrorSeen.current = true
        updateLog({ time: getTime(), type: logTypes.error, message: `WebSocket transport error detected for ${ws.url}; waiting for close details.` })
      }
    }

    ws.onclose = (event) => {
      let status = pointStatus.disconnected
      if (event.code === 1006) {
        updateLog({ time: getTime(), type: logTypes.error, message: describeClose(event, ws, connectionStartedAt.current) })
        status = pointStatus.error
      } else {
        const message = event.code === 1000
          ? 'Charge point disconnected normally'
          : describeClose(event, ws, connectionStartedAt.current)
        updateLog({ time: getTime(), type: event.code === 1000 ? logTypes.socket : logTypes.error, message })
      }
      connectionStartedAt.current = null
      clearInterval(heartbeatInterval)
      clearInterval(meterValueInterval[1])
      clearInterval(meterValueInterval[2])
      setInitialBootNotification(false)
      setStatus(status)
      setUploading(false)      
      clearInterval(uploadInterval)
      setWs('')

      if (remoteStopRecovery.current) {
        updateLog({ time: getTime(), type: logTypes.info, message: `Waiting ${REMOTE_STOP_RECONNECT_DELAY_MS / 1000}s for EVSE Unknown before reconnecting` })
        setTimeout(reconnectAfterRemoteStop, REMOTE_STOP_RECONNECT_DELAY_MS)
      }
    }

    ws.onmessage = (msg) => {
      let frame
      try {
        frame = JSON.parse(msg.data)
      } catch {
        updateLog({ time: getTime(), type: logTypes.error, message: `Received malformed WebSocket frame: ${String(msg.data).slice(0, 500)}` })
        return
      }

      if (!Array.isArray(frame) || frame.length < 3) {
        updateLog({ time: getTime(), type: logTypes.error, message: `Received invalid OCPP frame: ${JSON.stringify(frame).slice(0, 500)}` })
        return
      }

      const [ type, id, message, payload ] = frame
      switch (type) {
        case 2:
          incomingRequest(id, message, payload)
          break;
        case 3:
          incomingMessage(id, message)
          break;
        default:
          updateLog({ time: getTime(), type: logTypes.error, message: `Received unsupported OCPP message type ${type}: ${JSON.stringify(frame).slice(0, 500)}` })
          break;
      }
    }
  }

  return (
    <Container sx={{maxWidth: '1366px !important', pb: 4}}>
      <Box sx={{ mb: 2.5 }}>
        <Typography variant='h4' sx={{ fontWeight: 800, letterSpacing: '-0.03em' }}>Simulation workspace</Typography>
        <Typography color='text.secondary' sx={{ mt: 0.5 }}>Connect your charge point, run a session, and inspect every OCPP exchange in one place.</Typography>
      </Box>
      {(() => {
        const nextStep = getNextStep()
        return <Alert severity={nextStep.severity} variant='outlined' sx={{ mb: 2.5, alignItems: 'center' }}><Typography component='span' sx={{ fontWeight: 800 }}>{nextStep.title}.</Typography>{` ${nextStep.text}`}</Alert>
      })()}
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 3 }}>
          <ChargePoint ws={ws} setWs={setWs} status={status} setStatus={setStatus} centralSystemSend={centralSystemSend} />
          {
            uploading
              ? <Paper sx={{mt: 2.5, p: 2}}>
                  <Box display='flex' alignItems='center'>
                    <img src={`${import.meta.env.BASE_URL}sand.png`} alt='upload animation' height={36} />
                    <Typography variant='body2' ml={1} color='primary' >SIMULATE UPLOAD DIAGNOSTICS FILE</Typography>
                    <Typography variant='h5' ml={0.5} color='primary' >{seconds > 9 ? seconds : `0${seconds}`}</Typography>
                    <Typography variant='bod1' ml={0.5} color='primary' >sec.</Typography>
                  </Box>
                </Paper>
              : null
          }
        </Grid>
        <Grid size={{ xs: 12, md: 4.5 }}>
        { connectedStatuses.includes(status.status)
          ? <Connector id={1} status={status} centralSystemSend={centralSystemSend} settings={conOne} setSettings={setConOne} />
          : <Paper sx={{ p: 3, height: '100%', minHeight: 270, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', background: 'linear-gradient(145deg, #fff 0%, #f8fbff 100%)' }}>
              <Box>
                <EvStationOutlined color='primary' sx={{ fontSize: 42, mb: 1 }} />
                <Typography variant='h6' sx={{ fontWeight: 800 }}>Connector controls are ready</Typography>
                <Typography variant='body2' color='text.secondary' sx={{ mt: 1, maxWidth: 280 }}>Connect to the central system to authorize a tag and begin a transaction.</Typography>
              </Box>
            </Paper>
        }
        </Grid>
        <Grid size={{ xs: 12, md: 4.5 }}>
          { settingsState.mainSettings.numberOfConnectors === 2 && connectedStatuses.includes(status.status)
            ? <Connector id={2} status={status} centralSystemSend={centralSystemSend} settings={conTwo} setSettings={setConTwo} />
            : settingsState.mainSettings.numberOfConnectors === 2
              ? <Paper sx={{ p: 3, height: '100%', minHeight: 270, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', backgroundColor: '#fbfdff' }}>
                  <Box>
                    <Typography variant='overline' color='text.secondary' sx={{ fontWeight: 800 }}>Connector 2</Typography>
                    <Typography variant='h6' sx={{ fontWeight: 800 }}>Waiting for connection</Typography>
                    <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>Its controls will appear when the charge point is online.</Typography>
                  </Box>
                </Paper>
              : null
          }
        </Grid>
        <Grid size={{ xs: 12 }}>
          <FaultScenarios
            connectorCount={settingsState.mainSettings.numberOfConnectors}
            disabled={!connectedStatuses.includes(status.status)}
            onRunScenario={runFaultScenario}
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Paper sx={{p: { xs: 2, sm: 2.5 }}}>
            <Box display='flex' justifyContent='space-between' alignContent='center'>
              <Box>
                <Typography variant='h6' sx={{ fontWeight: 800 }}>Activity log</Typography>
                <Typography variant='caption' color='text.secondary'>{filteredLogs.length === logs.length ? `${logs.length} event${logs.length === 1 ? '' : 's'}` : `${filteredLogs.length} of ${logs.length} events`} recorded</Typography>
              </Box>
              <Box display='flex' justifyContent='flex-end' alignContent='center'>
                <Speed sx={{ml: 1, cursor: 'pointer'}} color='primary' onClick={(event) => showHelpText(event, 'MeterValueSampleInterval')} />
                <MonitorHeartOutlined sx={{ml: 1, cursor: 'pointer'}} color='primary' onClick={(event) => showHelpText(event, 'HeartbeatInterval')} />
                <Tooltip title='Clear log' placement='top' arrow >
                  <Clear sx={{ml: 1, cursor: 'pointer'}} color='primary' onClick={clearLog} />
                </Tooltip>
              </Box>
            </Box>
            <Divider sx={{ mt: 1.5, mb: 1.5 }} />
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.25} sx={{ mb: 1.5 }}>
              <TextField
                size='small'
                placeholder='Search messages, commands, or errors'
                value={logSearch}
                onChange={(event) => setLogSearch(event.target.value)}
                sx={{ minWidth: { md: 300 } }}
                slotProps={{ input: { startAdornment: <InputAdornment position='start'><Search fontSize='small' color='action' /></InputAdornment> } }}
              />
              <ToggleButtonGroup
                size='small'
                value={logFilters}
                onChange={(event, values) => setLogFilters(values)}
                aria-label='Filter activity log by event type'
                sx={{ flexWrap: 'wrap' }}
              >
                {['SEND', 'RECEIVE', 'REQUEST', 'SOCKET', 'ERROR', 'INFO'].map((type) => <ToggleButton key={type} value={type} sx={{ px: 1.1, fontSize: 11, fontWeight: 700 }}>{type}</ToggleButton>)}
              </ToggleButtonGroup>
            </Stack>
            {logs.length === 0 && <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}><Typography variant='body2'>Connection and command events will appear here.</Typography></Box>}
            {logs.length > 0 && filteredLogs.length === 0 && <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}><Typography variant='body2'>No events match the current filters.</Typography></Box>}
            <Stack spacing={1} height={filteredLogs.length ? 300 : 'auto'} maxHeight={300} sx={{ overflowY: 'auto', fontSize: 13, fontFamily: 'monospace', pr: 1 }}>
            {
              filteredLogs.map((el, index) => (
                <Stack key={index} direction="row" color={el.type.color} spacing={2} divider={<Divider orientation="vertical" flexItem />} role='button' tabIndex={0} onClick={() => setSelectedLog(el)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') setSelectedLog(el) }} sx={{ p: 0.75, borderRadius: 1, backgroundColor: index % 2 ? '#f8fafc' : 'transparent', minWidth: 'max-content', cursor: 'pointer', '&:hover': { backgroundColor: '#eaf2ff' }, '&:focus-visible': { outline: '2px solid #2563eb' } }}>
                  <Box>{el.time}</Box> 
                  <Box width={55} minWidth={55}>{el.type.text}</Box>
                  <Box width={175} minWidth={175}>{el.command}</Box>
                  <Box>{el.message}</Box>
                </Stack>)
              )
            }
            <Box ref={logsEndRef} />
            </Stack>
          </Paper>
        </Grid>
      </Grid>
      <Popover
        open={open}
        anchorEl={helpAnchorEl}
        onClose={() => setHelpAnchorEl(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Typography sx={{ p: 2, backgroundColor: 'black', color: 'white' }}>{helpText}</Typography>
      </Popover>
      <Dialog open={Boolean(selectedLog)} onClose={() => setSelectedLog(null)} fullWidth maxWidth='md'>
        <DialogTitle sx={{ pr: 6 }}>
          Event details
          <IconButton aria-label='Close event details' onClick={() => setSelectedLog(null)} sx={{ position: 'absolute', right: 12, top: 12 }}><Close /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedLog && <>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
              <Typography variant='body2'><strong>Time:</strong> {selectedLog.time}</Typography>
              <Typography variant='body2'><strong>Type:</strong> {selectedLog.type.text}</Typography>
              {selectedLog.command && <Typography variant='body2'><strong>Command:</strong> {selectedLog.command}</Typography>}
            </Stack>
            <Box component='pre' sx={{ m: 0, p: 2, borderRadius: 2, overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word', backgroundColor: '#0f172a', color: '#e2e8f0', fontSize: 13 }}>{formatLogMessage(selectedLog.message)}</Box>
          </>}
        </DialogContent>
      </Dialog>
    </Container>
  )
}


export default Main
