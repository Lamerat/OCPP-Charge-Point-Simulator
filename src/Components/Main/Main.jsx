import React, { useEffect, useContext, useState, useRef } from "react";
import { Container, Box, Typography, Tooltip, Divider, Grid, Paper, Stack , Popover} from '@mui/material'
import ChargePoint from '../ChargePoint/ChargePoint'
import moment from "moment";
import Connector from "../Connector/Connector";
// import MainContext from "../../Context/MainContext";
import SettingsContext from '../../Context/SettingsContext';
import { pointStatus, connectedStatuses } from '../../Config/charge-point-settings';
import { MonitorHeartOutlined, Speed, Clear } from "@mui/icons-material";
import { logTypes, commands } from "../../common/constants";
import { sendCommand } from "../../OCPP/OCPP-Commands";


let heartbeatInterval
// let meterValueInterval

const getTime = () => moment().format('HH:mm:ss')
const logArray = []

const Main = () => {
  const { settingsState } = useContext(SettingsContext)
  
  const [ ws, setWs ] = useState('')
  const [ logs, setLogs ] = useState(logArray)
  const [ status, setStatus ] = useState(pointStatus.disconnected)
  const [ initialBootNotification, setInitialBootNotification ] = useState(false)
  const [ helpAnchorEl, setHelpAnchorEl ] = useState(null)
  const [ helpText, setHelpText ] = useState('')
  
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
      const result = sendCommand('Heartbeat', {})
      centralSystemSend(result.ocppCommand, result.lastCommand)
      setInitialBootNotification(true)

      const index = settingsState.stationSettings.findIndex(x => x.key === 'HeartbeatInterval')
      settingsState.stationSettings[index].value = message.interval
      heartbeatInterval = setInterval(() => {
        const result = sendCommand('Heartbeat', {})
        centralSystemSend(result.ocppCommand, result.lastCommand)
      }, settingsState.stationSettings[index].value * 1000)
    }

    if (command === 'Authorize' && message.idTagInfo.status === 'Accepted') {
      setStatus(pointStatus.authorized)
    }
  }


  if (ws) {
    ws.onopen = () => {
      setStatus(pointStatus.connected)
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
      setStatus(status)
      setWs('')
    }

    ws.onmessage = (msg) => {
      const [ type, id, message, payload ] = JSON.parse(msg.data)
      switch (type) {
        case 2:
          
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
        </Grid>
        <Grid item xs={4.4}>
        {/* { connectedStatuses.includes(settings.status.status) ? <Connector id={settings.connector_1.id} /> : null } */}
        </Grid>
        <Grid item xs={4.4}>
          {/* { settingsState.mainSettings.numberOfConnectors === 2 && connectedStatuses.includes(settings.status.status) ? <Connector id={settings.connector_2.id} /> : null } */}
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