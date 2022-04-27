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
  const { logs, setLogs } = useContext(LogContext)

  const { settingsState } = useContext(SettingsContext)

  const [ ws, setWs ] = useState(null)
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


  


  return (
    <Container sx={{maxWidth: '1366px !important'}}>
      <Grid container spacing={3}>
        <Grid item xs={3.2}>
          <ChargePoint ws={ws} setWs={setWs} />
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
                  {/* <Clear sx={{ml: 1, cursor: 'pointer'}} color='primary' onClick={clearLog} /> */}
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