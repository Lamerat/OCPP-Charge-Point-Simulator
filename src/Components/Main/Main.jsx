import React, { useEffect, useContext, useState, useRef } from "react";
import { Container, Box, Typography, Tooltip, Divider, Grid, Paper, Stack , Popover} from '@mui/material'
import ChargePoint from '../ChargePoint/ChargePoint'
import moment from "moment";
import Connector from "../Connector/Connector";
import SettingsContext from '../../Context/SettingsContext';
import { pointStatus, connectedStatuses } from '../../Config/charge-point-settings';
import { MonitorHeartOutlined, Speed, Clear } from "@mui/icons-material";
import { logTypes, commands, connectors, connectorStatus, socketInfo } from "../../common/constants";
import { sendCommand } from "../../OCPP/OCPP-Commands";


let heartbeatInterval
let meterValueInterval = {
  1: null,
  2: null,
}

let uploadInterval
let uploadSeconds

const getTime = () => moment().format('HH:mm:ss')
const logArray = []


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

  const updateConnector = {
    1: setConOne,
    2: setConTwo,
  }
  
  const open = Boolean(helpAnchorEl);

  const logsEndRef = useRef(null)
  const scrollToBottom = () => logsEndRef.current?.scrollIntoView({ behavior: "smooth" })
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


  const incomingMessage = (id, message) => {
    const getCommand = (commands.filter(x => x.id === id))[0]

    if (!getCommand) {
      updateLog( { time: getTime(), type: logTypes.error, message: 'Cannot recognize command!' })
      return
    }

    const { command, connector } = getCommand
    updateLog({ time: getTime(), type: logTypes.message, command, message: JSON.stringify(message) })
    
    if (command === 'BootNotification' && !initialBootNotification && message.status === 'Accepted') {
      // Send first heartbeat
      const result = sendCommand('Heartbeat', {})
      centralSystemSend(result.ocppCommand, result.lastCommand)

      // Send connector(s) status(es)
      for (let i = 1; i <= settingsState.mainSettings.numberOfConnectors; i++) {
        const currentConnector = sendCommand('StatusNotification', { connectorId: i, status: connectors[i].status })
        centralSystemSend(currentConnector.ocppCommand, currentConnector.lastCommand)
      }

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

    if (command === 'Authorize' && message.idTagInfo.status === 'Accepted') {
      setStatus(pointStatus.authorized)
      socketInfo.lastStatus = pointStatus.authorized
    }

    if (command === 'StartTransaction' && message.idTagInfo.status === 'Accepted') {
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
        }

        const result = sendCommand('MeterValues', metaData)
        centralSystemSend(result.ocppCommand, result.lastCommand)
      }, settingsState.stationSettings[index].value * 1000)

      const statusData = sendCommand('StatusNotification', { connectorId: connector, status: connectors[connector].status })
      centralSystemSend(statusData.ocppCommand, statusData.lastCommand)
    }

    if (command === 'StopTransaction' && message.idTagInfo.status === 'Accepted') {
      connectors[connector].startMeterValue = connectors[connector].currentMeterValue
      connectors[connector].transactionId = 0
      connectors[connector].inTransaction = false
      connectors[connector].status = connectorStatus.Finishing
      updateConnector[connector]({ ...connectors[connector] })
      clearInterval(meterValueInterval[connector])
      const statusData = sendCommand('StatusNotification', { connectorId: connector, status: connectors[connector].status })
      centralSystemSend(statusData.ocppCommand, statusData.lastCommand)
    }
  }


  const incomingRequest = (id, request, payload) => {
    const acceptRespond = JSON.stringify([ 3, id, { status: 'Accepted' }])
    const rejectRespond = JSON.stringify([ 3, id, { status: 'Rejected' }])
    updateLog({ time: getTime(), type: logTypes.request, command: request, message: JSON.stringify(payload) })

    let connId = payload.connectorId
    const metaData = {}

    switch (request) {
      case 'RemoteStartTransaction':
        if (connectors[connId].inTransaction) {
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
      case 'RemoteStopTransaction':
          connId = null
          for (let i = 1; i <= settingsState.mainSettings.numberOfConnectors; i++) {
            if (connectors[i].transactionId === payload.transactionId) connId = i
          }

        if (!connId) {
          ws.send(rejectRespond)
          return
        }

        ws.send(acceptRespond)
        metaData.connectorId = connId
        metaData.currentMeterValue = connectors[connId].currentMeterValue
        metaData.transactionId = connectors[connId].transactionId
        metaData.stopReason = connectors[connId].stopReason
        const endTransaction =  sendCommand('StopTransaction', metaData)
        centralSystemSend(endTransaction.ocppCommand, endTransaction.lastCommand)
        break;
      case 'TriggerMessage':
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
      case 'UnlockConnector':
        const getSetting = settingsState.stationSettings.findIndex(x => x.key === 'UnlockConnectorOnEVSideDisconnect')
        if (getSetting === -1 || settingsState.stationSettings[getSetting].value === false) {
          ws.send(JSON.stringify([ 3, id, { status: 'NotSupported' }]))
          return
        }

        ws.send(JSON.stringify([ 3, id, { status: connId === 1 ? settingsState.simulation.connectorOneUnlock : settingsState.simulation.connectorTwoUnlock }]))
        break;
      case 'GetConfiguration':
        const returnConfiguration = { configurationKey: settingsState.stationSettings, unknownKey: [] }
        ws.send(JSON.stringify([ 3, id, returnConfiguration]))
        break;
      case 'ChangeConfiguration':
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
    ws.onopen = () => {
      setStatus(pointStatus.connected)
      socketInfo.lastStatus = pointStatus.connected
      updateLog({ time: getTime(), type: logTypes.socket, message: 'Charge point connected' })

      const initialBoot = sendCommand('BootNotification', { bootNotification: settingsState.bootNotification })
      centralSystemSend(initialBoot.ocppCommand, initialBoot.lastCommand)
    }

    ws.onclose = (event) => {
      let status = pointStatus.disconnected
      if (event.code === 1006) {
        updateLog( { time: getTime(), type: logTypes.error, message: 'Connection problem' })
        status = pointStatus.error
      } else {
        updateLog({ time: getTime(), type: logTypes.socket, message: 'Charge point disconnected' })
      }
      clearInterval(heartbeatInterval)
      clearInterval(meterValueInterval[1])
      clearInterval(meterValueInterval[2])
      setInitialBootNotification(false)
      setStatus(status)
      setUploading(false)      
      clearInterval(uploadInterval)
      setWs('')
    }

    ws.onmessage = (msg) => {
      const [ type, id, message, payload ] = JSON.parse(msg.data)
      switch (type) {
        case 2:
          incomingRequest(id, message, payload)
          break;
        case 3:
          incomingMessage(id, message)
          break;
        default:
          break;
      }
    }
  }

  return (
    <Container sx={{maxWidth: '1366px !important'}}>
      <Grid container spacing={3}>
        <Grid item xs={3.2}>
          <ChargePoint ws={ws} setWs={setWs} status={status} setStatus={setStatus} centralSystemSend={centralSystemSend} />
          {
            uploading
              ? <Paper sx={{mt: 3, p: 2, height: '42.5px'}}>
                  <Box display='flex' alignItems='center'>
                    <img src='./sand.png' alt='upload animation' height={36} />
                    <Typography variant='body2' ml={1} color='primary' >SIMULATE UPLOAD DIAGNOSTICS FILE</Typography>
                    <Typography variant='h5' ml={0.5} color='primary' >{seconds > 9 ? seconds : `0${seconds}`}</Typography>
                    <Typography variant='bod1' ml={0.5} color='primary' >sec.</Typography>
                  </Box>
                </Paper>
              : null
          }
        </Grid>
        <Grid item xs={4.4}>
        { connectedStatuses.includes(status.status)
          ? <Connector id={1} status={status} centralSystemSend={centralSystemSend} settings={conOne} setSettings={setConOne} />
          : null
        }
        </Grid>
        <Grid item xs={4.4}>
          { settingsState.mainSettings.numberOfConnectors === 2 && connectedStatuses.includes(status.status)
            ? <Connector id={2} status={status} centralSystemSend={centralSystemSend} settings={conTwo} setSettings={setConTwo} />
            : null
          }
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{p: 2}}>
            <Box display='flex' justifyContent='space-between' alignContent='center'>
              <Typography variant='h6' color='primary'>LOG</Typography>
              <Box display='flex' justifyContent='flex-end' alignContent='center'>
                <Speed sx={{ml: 1, cursor: 'pointer'}} color='primary' onClick={(event) => showHelpText(event, 'MeterValueSampleInterval')} />
                <MonitorHeartOutlined sx={{ml: 1, cursor: 'pointer'}} color='primary' onClick={(event) => showHelpText(event, 'HeartbeatInterval')} />
                <Tooltip title='Clear log' placement='top' arrow >
                  <Clear sx={{ml: 1, cursor: 'pointer'}} color='primary' onClick={clearLog} />
                </Tooltip>
              </Box>
            </Box>
            <Divider sx={{ mt: 0.5, mb: 1.5 }} />
            <Stack spacing={1} height={340} maxHeight={295} sx={{ overflowY: 'scroll', fontSize: 14 }}>
            {
              logs.map((el, index) => (
                <Stack key={index} direction="row" color={el.type.color} spacing={2} divider={<Divider orientation="vertical" flexItem />}>
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
    </Container>
  )
}


export default Main