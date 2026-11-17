import React, { useContext } from 'react';
import SettingsContext from '../../Context/SettingsContext';
import { Chip, Stack, Typography, Paper, Box, Divider, Button } from '@mui/material'
import { pointStatus, connectedStatuses } from '../../Config/charge-point-settings';
import { sendCommand } from '../../OCPP/OCPP-Commands';
import PropTypes from 'prop-types';
import { socketInfo } from '../../common/constants';
import { buildWebSocketUrl } from '../../common/help-functions';
import { Switch, FormControlLabel } from '@mui/material'


const ChargePoint = ({ ws, setWs, status, setStatus, centralSystemSend }) => {
  const { settingsState, setSettingsState } = useContext(SettingsContext)
  const alwaysRejectSetting = settingsState.stationSettings.find(
    x => x.key === 'AlwaysReject'
  )

  const alwaysReject = alwaysRejectSetting?.value === 'true'

  const toggleAlwaysReject = () => {
  const updatedSettings = settingsState.stationSettings.map(s =>
    s.key === 'AlwaysReject'
      ? { ...s, value: s.value === 'true' ? 'false' : 'true' }
      : s
  )

  setSettingsState({
    ...settingsState,
    stationSettings: updatedSettings
  })
}
  const startConnection = () => {
    const { protocol, address, port, chargePointId, OCPPversion } = settingsState.mainSettings
    socketInfo.webSocket = new WebSocket(buildWebSocketUrl({ protocol, address, port, chargePointId }), [ OCPPversion ])
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
    <Paper sx={{p: { xs: 2, sm: 2.5 }, height: '100%'}}>
      <Box display='flex' alignItems='center' justifyContent='space-between'>
        <Box>
          <Typography variant='overline' color='text.secondary' sx={{ fontWeight: 800, lineHeight: 1.2 }}>Control center</Typography>
          <Typography variant='h6' sx={{ fontWeight: 800 }}>Charge point</Typography>
        </Box>
        <Chip
          size='small'
          icon={<status.icon size={18} style={{ paddingLeft: 6, paddingRight: 3 }} />}
          label={status.text.toUpperCase()}
          color={status.color}
        />
      </Box>
      <Divider sx={{ mt: 1.5, mb: 2 }} />
      <Stack spacing={2}>
        {
          connectedStatuses.includes(status.status)
          ? <Button variant='contained' color='warning' onClick={() => ws.close()} fullWidth>Disconnect</Button>
          : <Button variant='contained' fullWidth onClick={startConnection}>Connect to central system</Button>
        }
        <Button disabled={!connectedStatuses.includes(status.status)} variant='contained' fullWidth onClick={() => sendRequest('Authorize')}>Authorize</Button>
        <Button disabled={!connectedStatuses.includes(status.status)} variant='contained' fullWidth onClick={() => sendRequest('BootNotification')}>Boot notification</Button>
        <Button disabled={!connectedStatuses.includes(status.status)} variant='contained' fullWidth onClick={() => sendRequest('Heartbeat')}>Heartbeat</Button>
        <FormControlLabel
          control={<Switch checked={alwaysReject} onChange={toggleAlwaysReject} />}
          label="Always Reject"
        />
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
