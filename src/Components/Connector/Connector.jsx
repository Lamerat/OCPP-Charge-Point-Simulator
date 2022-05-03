import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { FormGroup, Typography, Paper, Box, Divider, Grid, Chip, Button, Tooltip, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material'
import { connectorData, connectorStatus, stopReason, connectors} from '../../common/constants';
import { sendCommand } from '../../OCPP/OCPP-Commands';
import { mainStatus } from '../../Config/charge-point-settings';
import { styled } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';

const animate = '../arrows.gif'

const StyledTextField = styled(TextField)({
  '& .MuiOutlinedInput-root': {
    '& fieldset': {
      borderTopRightRadius: 0,
      borderBottomRightRadius: 0,
    },
  },
});

const StyledButton = styled(Button)({  
  borderTopLeftRadius: 0,
  borderBottomLeftRadius: 0,
  width: 40,
  minWidth: 40,
  maxHeight: 40,
  padding: 6,
  '& .MuiButton-startIcon': { margin: 0 }
});


const Connector = ({ id, status, centralSystemSend, settings, setSettings }) => {
  const [ meterError, setMeterError ] = useState(false)
  const [ localStatus, setLocalStatus ] = useState(connectorStatus.Available)

  const updateData = (field, data) => {
    if (field === 'currentMeterValue') {
      data = Number(data)
      if(isNaN(data) || !Number.isInteger(data)) return
      const startValue = settings.startMeterValue
      startValue > data ? setMeterError(true) : setMeterError(false)
    }

    connectors[id] = { ...connectors[id], [field]: data }
    setSettings(connectors[id])
  }

  const sendRequest = (command) => {
    const metaData = {}
    switch (command) {
      case 'StatusNotification':
        connectors[id] = { ...connectors[id], status: localStatus }
        setSettings(connectors[id])
        metaData.connectorId = id
        metaData.status = connectors[id].status
        break;
      case 'StartTransaction':
        metaData.connectorId = id
        metaData.idTag = connectors[id].idTag
        metaData.startMeterValue = connectors[id].startMeterValue
        break;
      case 'StopTransaction':
        metaData.connectorId = id
        metaData.currentMeterValue = connectors[id].currentMeterValue
        metaData.transactionId = connectors[id].transactionId
        metaData.stopReason = connectors[id].stopReason
        break;
      case 'MeterValues':
        metaData.connectorId = connectors[id].connectorId
        metaData.transactionId = connectors[id].transactionId
        metaData.currentMeterValue = connectors[id].currentMeterValue
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
      <Typography variant='h6' color='primary'>CONNECTOR - {id}</Typography>
      { settings.inTransaction
        ? <Tooltip placement='top' title='In Transaction' arrow><img src={animate} style={{height: 10}} alt='charge animation' /></Tooltip>
        : null
      }
      <Chip
          size='small'
          label={connectorData[settings.status].text.toUpperCase()}
          sx={{ backgroundColor: connectorData[settings.status].backgroundColor, color: connectorData[settings.status].color}}
        />
    </Box>
    <Divider sx={{ mt: 0.5, mb: 1.5 }} />
    <Grid container spacing={3}>
      <Grid item xs={6}>
        <TextField
          fullWidth
          disabled
          value={settings.idTag}
          label='ID Tag'
          size='small'
        />
      </Grid>
      <Grid item xs={6}>
        <Button
          fullWidth
          variant='contained'
          disabled={settings.inTransaction || status.status !== mainStatus.authorized}
          onClick={() => sendRequest('StartTransaction')}
        >
          Start transaction
        </Button>
      </Grid>
      <Grid item xs={6}>
        <FormControl fullWidth>
          <InputLabel>Stop Reason</InputLabel>
          <Select
            fullWidth
            value={settings.stopReason}
            label='Stop Reason'
            size='small'
            disabled={!settings.inTransaction}
            name='stopReason'
            onChange={(e) => updateData(e.target.name, e.target.value)}
          >
            { Object.keys(stopReason).map(x => <MenuItem key={x} value={stopReason[x]}>{stopReason[x]}</MenuItem>) }
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={6}>
        <Button fullWidth variant='contained' disabled={!settings.inTransaction} onClick={() => sendRequest('StopTransaction')} > stop transaction </Button>
      </Grid>
      <Grid item xs={6}>
        <FormControl fullWidth>
          <InputLabel>Status</InputLabel>
          <Select
            fullWidth
            value={localStatus}
            label='Status'
            size='small'
            name='status'
            onChange={(e) => setLocalStatus(e.target.value)}
          >
            { Object.keys(connectorStatus).map(x => <MenuItem key={x} value={connectorStatus[x]}>{connectorData[x].text}</MenuItem>) }
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={6}>
        <Button fullWidth variant='contained' onClick={() => sendRequest('StatusNotification')}>status notification</Button>
      </Grid>
      <Grid item xs={6}>
        <TextField label='Start Meter Value' size='small' variant='outlined' fullWidth value={settings.startMeterValue} disabled />
      </Grid>
      <Grid item xs={6}>
        <FormGroup row>
          <StyledTextField
            disabled={!settings.inTransaction}
            label='Current Meter Value'
            size='small'
            error={meterError}
            variant='outlined'
            sx={{ width: 'calc(100% - 40px)'}}
            value={settings.currentMeterValue}
            name='currentMeterValue'
            onChange={(e) => updateData(e.target.name, e.target.value)}
            onFocus={event => {event.target.select()}}
          />
          <StyledButton
            disabled={!settings.inTransaction}
            variant='contained'
            startIcon={<AddIcon />}
            onClick={() => updateData('currentMeterValue', settings.currentMeterValue + 10)}
          />
        </FormGroup>
      </Grid>
      <Grid item xs={12}>
      <Button disabled={!settings.inTransaction} fullWidth variant='contained' onClick={() => sendRequest('MeterValues')} >Send Meter Value</Button>
      </Grid>
    </Grid>
  </Paper>
  )
}

Connector.propTypes = {
  id: PropTypes.number.isRequired,
  status: PropTypes.any.isRequired,
  centralSystemSend: PropTypes.func.isRequired,
  settings: PropTypes.object.isRequired,
  setSettings: PropTypes.func.isRequired,
};

export default Connector