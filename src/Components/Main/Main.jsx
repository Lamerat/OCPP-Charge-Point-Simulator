import React, { useEffect, useContext, useState, useRef, useCallback } from "react";
import { Container, Box, Typography, Tooltip, Divider, Grid, Paper, Stack , Popover} from '@mui/material'
import ChargePoint from '../ChargePoint/ChargePoint'
import moment from "moment";
import Connector from "../Connector/Connector";
import MainContext from "../../Context/MainContext";
import SettingsContext from '../../Context/SettingsContext';
import LogContext from "../../Context/LogContext";
import { pointStatus, connectedStatuses } from '../../Config/charge-point-settings';
import { MonitorHeartOutlined, Speed, Clear } from "@mui/icons-material";
import { commands, logTypes, activeLog, connectorStatus } from "../../common/constants";
import { sendCommand } from '../../OCPP/OCPP-Commands';
import { getId, OCPPDate } from "../../common/help-functions";

let heartbeatInterval
let meterValueInterval

const Main = () => {
  const { settings, setSettings } = useContext(MainContext)
  const { settingsState } = useContext(SettingsContext)
  const { logs, setLogs } = useContext(LogContext)

  const [ helpAnchorEl, setHelpAnchorEl ] = useState(null)
  const [ helpText, setHelpText ] = useState('')
  
  const open = Boolean(helpAnchorEl);

  const sendRequest = sendCommand(setLogs, settings, settingsState)

  const logsEndRef = useRef(null)
  const scrollToBottom = () => logsEndRef.current?.scrollIntoView({ behavior: "smooth" })
  useEffect(() => scrollToBottom(), [logs])

  const showHelpText = (event, type) => {
    const getData = (settingsState.stationSettings.filter(x => x.key === type))[0]
    setHelpText(`${type} set to ${getData.value} seconds`)
    setHelpAnchorEl(event.target)
  }


  const sendCustomStatus = useCallback((status, connector) => {
    const id = getId()
    const command = 'StatusNotification'
    const message = {
      connectorId: settings[connector].id,
      status,
      errorCode: 'NoError',
      info: '',
      timestamp: OCPPDate(new Date()),
      vendorId: '',
      vendorErrorCode: ''
    }
    const data = JSON.stringify([ 2, id, 'StatusNotification', message ])
    commands.push({ id, command, connector })

    activeLog.push({ time: moment().format('HH:mm:ss'), type: logTypes.send, command, message: JSON.stringify(message) })
    setLogs([ ...activeLog ])
    settings.webSocket.send(data)
  }, [setLogs, settings])


  const messageFunc = useCallback((msg) => {
    const [ type, id, message, payload ] = JSON.parse(msg.data)
    
    const incomingMessage = (id, message) => {
      const command = (commands.filter(x => x.id === id))[0]
      if (command) {
        activeLog.push({ time: moment().format('HH:mm:ss'), type: logTypes.message, command: command.command, message: JSON.stringify(message) })
        setLogs([ ...activeLog ])

        if (command.command === 'BootNotification' && !settings.initialCommands && message.status === 'Accepted') {
          sendRequest('Heartbeat')
          setSettings({ ...settings, initialCommands: true })

          const index = settingsState.stationSettings.findIndex(x => x.key === 'HeartbeatInterval')
          settingsState.stationSettings[index].value = message.interval
          heartbeatInterval = setInterval(() => sendRequest('Heartbeat'), settingsState.stationSettings[index].value * 1000)

          sendRequest('StatusNotification', 'connector_1')
          if (settingsState.mainSettings.numberOfConnectors > 1) sendRequest('StatusNotification', 'connector_2')
        }
        
        if (command.command === 'Authorize' && message.idTagInfo.status === 'Accepted') {
          setSettings({ ...settings, status: pointStatus.authorized })
        }


        if (command.command === 'StartTransaction' && message.idTagInfo.status === 'Accepted') {
          const oldData = settings[command.connector]
          const update = {
            ...oldData,
            transactionId: message.transactionId,
            inTransaction: true,
            status: connectorStatus.Charging
          }
          setSettings({ ...settings, [command.connector]: update })
          sendRequest('MeterValues', command.connector)
          sendCustomStatus(connectorStatus.Charging, command.connector)

          // const index = settingsState.stationSettings.findIndex(x => x.key === 'MeterValueSampleInterval')
          // meterValueInterval = setInterval(() => sendRequest('MeterValues', command.connector), settingsState.stationSettings[index].value * 1000)
        }

        if (command.command === 'StopTransaction' && message.idTagInfo.status === 'Accepted') {
          const oldData = settings[command.connector]
          const update = {
            ...oldData,
            transactionId: 0,
            inTransaction: false,
            status: connectorStatus.Finishing,
            startMeterValue: oldData.currentMeterValue
          }
          setSettings({ ...settings, [command.connector]: update })
          sendRequest('MeterValues', command.connector)
          sendCustomStatus(connectorStatus.Finishing, command.connector)
          clearInterval(meterValueInterval)
        }
      }
    }

    const incomingRequest = (id, request, payload) => {
      const acceptRespond = JSON.stringify([ 3, id, { status: 'Accepted' }])
      const rejectRespond = JSON.stringify([ 3, id, { status: 'Rejected' }])
      activeLog.push({ time: moment().format('HH:mm:ss'), type: logTypes.request, command: request, message: JSON.stringify(payload) })
      setLogs([ ...activeLog ])

      switch (request) {
        case 'RemoteStartTransaction':
          if (settings[`connector_${payload.connectorId}`].inTransaction) {
            settings.webSocket.send(rejectRespond)
            return
          }

          settings.webSocket.send(acceptRespond)
          const oldData = settings[`connector_${payload.connectorId}`]

          setSettings({ ...settings, [`connector_${payload.connectorId}`]: { ...oldData, idTag: payload.idTag } })
          sendRequest('StartTransaction', `connector_${payload.connectorId}`)
          break;
        case 'RemoteStopTransaction':
          let connector = null
          if (settings.connector_1.transactionId === payload.transactionId) connector = 'connector_1'
          if (settings.connector_2.transactionId === payload.transactionId) connector = 'connector_2'

          if (!connector) {
            settings.webSocket.send(rejectRespond)
            return
          }

          settings.webSocket.send(acceptRespond)
          sendRequest('StopTransaction', connector)
          break;
        default:
          break;
      }
    }
    
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
  }, [setLogs, settings, sendRequest, setSettings, settingsState, sendCustomStatus]);



  // Web Socket actions
  useEffect(() => {
    if (settings.webSocket) {
      settings.webSocket.onopen = () => {
        activeLog.push({ time: moment().format('HH:mm:ss'), type: logTypes.socket, message: 'Charge point connected' })
        setLogs([ ...activeLog ])
        setSettings({ ...settings, status: pointStatus.connected })
        sendRequest('BootNotification')
      }
      settings.webSocket.onclose = (event) => {
        let status = pointStatus.disconnected
        if (event.code === 1006) {
          setLogs([ ...logs, { time: moment().format('HH:mm:ss'), type: logTypes.error, message: 'Connection problem' } ])
          status = pointStatus.error
        } else {
          setLogs([ ...logs, { time: moment().format('HH:mm:ss'), type: logTypes.socket, message: 'Charge point disconnected' } ])
        }
        setSettings({ ...settings, webSocket: null, status, initialCommands: false })
        clearInterval(heartbeatInterval)
      }

      settings.webSocket.onmessage = (message) => {
        messageFunc(message)
      }

      settings.webSocket.onerror = (error) => {
        console.log(error)
      }
    }// eslint-disable-next-line 
  }, [ settings.webSocket, messageFunc ])


  const clearLog = () => {
    activeLog.length = 0
    setLogs([])
  }


  return (
    <Container sx={{maxWidth: '1366px !important'}}>
      <Grid container spacing={3}>
        <Grid item xs={3.2}>
          <ChargePoint />
        </Grid>
        <Grid item xs={4.4}>
        { connectedStatuses.includes(settings.status.status) ? <Connector id={settings.connector_1.id} /> : null }
        </Grid>
        <Grid item xs={4.4}>
          { settingsState.mainSettings.numberOfConnectors === 2 && connectedStatuses.includes(settings.status.status) ? <Connector id={settings.connector_2.id} /> : null }
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
            <Stack spacing={1} height={340} maxHeight={340} sx={{ overflowY: 'scroll', fontSize: 14 }}>
            {
              logs.map((el, index) => (
                <Stack key={index} direction="row" color={el.type.color} spacing={2} divider={<Divider orientation="vertical" flexItem />}>
                  <Box>{el.time}</Box> 
                  <Box width={70} minWidth={70}>{el.type.text}</Box>
                  <Box width={120} minWidth={120}>{el.command}</Box>
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