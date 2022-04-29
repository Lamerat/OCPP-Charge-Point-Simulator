import React, { useEffect, useState } from 'react';
import { nanoid } from 'nanoid';
import PropTypes from 'prop-types';
import { FormGroup, Typography, Paper, Box, Divider, Grid, Chip, Button, Tooltip, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material'
import { styled } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import { connectorData, connectorStatus, stopReason } from '../../common/constants';
import { sendCommand } from '../../OCPP/OCPP-Commands';
import { mainStatus } from '../../Config/charge-point-settings';

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

  
  const connectorName = `connector_${id}`
  
  const [ meterError, setMeterError ] = useState(false)

  const updateStatus = (status) => {
    setSettings({ ...settings, status })
  }

  const updateStopReason = (stopReason) => {
    // setSettings({ ...settings, [connectorName]: { ...settings[connectorName], stopReason } })
  }

  const updateMeterValue = (value) => {
    value = Number(value)
    if(isNaN(value) || !Number.isInteger(value)) return
    const startValue = settings[connectorName].startMeterValue
    startValue > value ? setMeterError(true) : setMeterError(false)
    // setSettings({ ...settings, [connectorName]: { ...settings[connectorName], currentMeterValue: value } })
  }

  const sendRequest = (command) => {
    const metaData = {}
    switch (command) {
      case 'StatusNotification':
        metaData.connectorId = id
        metaData.status = 'dasd'
        break;
      default:
        break;
    }
    const result = sendCommand(command, metaData)
    centralSystemSend(result.ocppCommand, result.lastCommand)
  }

  const sendStatus = () => {
    sendRequest('StatusNotification', connectorName)
  }


  const startTransaction = () => {
    sendRequest('StartTransaction', connectorName)
  }

  const StopTransaction = () => {
    sendRequest('StopTransaction', connectorName)
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
          onChange={(e) => updateStopReason(e.target.value)}
        />
      </Grid>
      <Grid item xs={6}>
        <Button
          fullWidth
          variant='contained'
          disabled={settings.inTransaction || status.status !== mainStatus.authorized}
          onClick={startTransaction}
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
            onChange={(e) => updateStopReason(e.target.value)}
          >
            { Object.keys(stopReason).map(x => <MenuItem key={x} value={stopReason[x]}>{stopReason[x]}</MenuItem>) }
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={6}>
        <Button
          fullWidth
          variant='contained'
          disabled={!settings.inTransaction}
          onClick={StopTransaction}
        >
          stop transaction
        </Button>
      </Grid>
      <Grid item xs={6}>
        <FormControl fullWidth>
          <InputLabel>Status</InputLabel>
          <Select
            fullWidth
            value={settings.status}
            label='Status'
            size='small'
            onChange={(e) => updateStatus(e.target.value)}
          >
            { Object.keys(connectorStatus).map(x => <MenuItem key={x} value={connectorStatus[x]}>{connectorData[x].text}</MenuItem>) }
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={6}>
        <Button fullWidth variant='contained' onClick={sendStatus}>status notification</Button>
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
            onChange={(e) => updateMeterValue(e.target.value)}
            onFocus={event => {event.target.select()}}
          />
          <StyledButton
            disabled={!settings.inTransaction}
            variant='contained'
            startIcon={<AddIcon />}
            onClick={() => updateMeterValue(settings[connectorName].currentMeterValue + 10)}
          />
        </FormGroup>
      </Grid>
      <Grid item xs={12}>
      <Button
        disabled={!settings.inTransaction}
        fullWidth variant='contained'
        onClick={() => sendRequest('MeterValues', connectorName)}
      >
        Send Meter Value
      </Button>
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