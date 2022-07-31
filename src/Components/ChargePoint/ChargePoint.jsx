import React, { useContext } from 'react';
import SettingsContext from '../../Context/SettingsContext';
import { Chip, Stack, Typography, Paper, Box, Divider, Button } from '@mui/material'
import { pointStatus, connectedStatuses } from '../../Config/charge-point-settings';
import { sendCommand } from '../../OCPP/OCPP-Commands';
import PropTypes from 'prop-types';
import { socketInfo } from '../../common/constants';


const ChargePoint = ({ ws, setWs, status, setStatus, centralSystemSend }) => {
  const { settingsState } = useContext(SettingsContext)

  const startConnection = () => {
    const { protocol, address, port, chargePointId, OCPPversion } = settingsState.mainSettings
    // setWs(new WebSocket(`${protocol}://${address}:${port}/${chargePointId}`, [ OCPPversion ]))
    socketInfo.webSocket = new WebSocket(`${protocol}://${address}:${port}/${chargePointId}`, [ OCPPversion ])
    setWs(socketInfo.webSocket)
    setStatus(pointStatus.connecting)
  }

  const sendRequest = (command) => {
    const metaData = {}
    switch (command) {
      case 'Authorize':
        metaData.RFIDTag = settingsState.mainSettings.RFIDTag
        break;
      case 'BootNotification':
        metaData.bootNotification = settingsState.bootNotification
        break;
      default:
        break;
    }
    const result = sendCommand(command, metaData)
    centralSystemSend(result.ocppCommand, result.lastCommand)
  }

  return (
    <Paper sx={{p: 2}}>
      <Box display='flex' alignItems='center' justifyContent='space-between'>
        <Typography variant='h6' color='primary'>CHARGE POINT</Typography>
        <Chip
          size='small'
          icon={<status.icon size={18} style={{ paddingLeft: 6, paddingRight: 3 }} />}
          label={status.text.toUpperCase()}
          color={status.color}
        />
      </Box>
      <Divider sx={{ mt: 0.5, mb: 1.5 }} />
      <Stack spacing={2}>
        {
          connectedStatuses.includes(status.status)
          ? <Button variant='contained' color='warning' onClick={() => ws.close()} fullWidth>Disconnect</Button>
          : <Button variant='contained' fullWidth onClick={startConnection}>Connect</Button>
        }
        <Button disabled={!connectedStatuses.includes(status.status)} variant='contained' fullWidth onClick={() => sendRequest('Authorize')}>Authorize</Button>
        <Button disabled={!connectedStatuses.includes(status.status)} variant='contained' fullWidth onClick={() => sendRequest('BootNotification')}>Boot notification</Button>
        <Button disabled={!connectedStatuses.includes(status.status)} variant='contained' fullWidth onClick={() => sendRequest('Heartbeat')}>Heartbeat</Button>
      </Stack>
    </Paper>
  )
}


ChargePoint.propTypes = {
  ws: PropTypes.any.isRequired,
  setWs: PropTypes.func.isRequired,
  status: PropTypes.object.isRequired,
  setStatus: PropTypes.func.isRequired,
  centralSystemSend: PropTypes.func.isRequired
};

export default ChargePoint