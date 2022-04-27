import React, { useContext } from 'react';
import SettingsContext from '../../Context/SettingsContext';
import MainContext from '../../Context/MainContext';
import LogContext from "../../Context/LogContext";
import { Chip, Stack, Typography, Paper, Box, Divider, Button } from '@mui/material'
import { pointStatus, connectedStatuses } from '../../Config/charge-point-settings';
import { sendCommand } from '../../OCPP/OCPP-Commands';
import PropTypes from 'prop-types';



const ChargePoint = ({ ws, setWs }) => {
  const startConnection = () => {
    // const ws = new WebSocket()
    
  }

  return (
    <Paper sx={{p: 2}}>
      <Box display='flex' alignItems='center' justifyContent='space-between'>
        <Typography variant='h6' color='primary'>CHARGE POINT</Typography>
        <Chip
          size='small'
          // icon={<settings.status.icon size={18} style={{ paddingLeft: 6, paddingRight: 3 }} />}
          // label={settings.status.text.toUpperCase()}
          // color={settings.status.color}
        />
      </Box>
      <Divider sx={{ mt: 0.5, mb: 1.5 }} />
      <Stack spacing={2}>
        {/* {
          connectedStatuses.includes(settings.status.status)
          ? <Button variant='contained' color='warning' onClick={() => settings.webSocket.close()} fullWidth>Disconnect</Button>
          : <Button variant='contained' fullWidth onClick={startConnection}>Connect</Button>
        }
        <Button disabled={!connectedStatuses.includes(settings.status.status)} variant='contained' fullWidth onClick={() => sendRequest('Authorize')}>Authorize</Button>
        <Button disabled={!connectedStatuses.includes(settings.status.status)} variant='contained' fullWidth onClick={() => sendRequest('BootNotification')}>Boot notification</Button>
        <Button disabled={!connectedStatuses.includes(settings.status.status)} variant='contained' fullWidth onClick={() => sendRequest('Heartbeat')}>Heartbeat</Button> */}
      </Stack>
    </Paper>
  )
}


ChargePoint.propTypes = {
  ws: PropTypes.any.isRequired,
  setWs: PropTypes.func.isRequired
};

export default ChargePoint