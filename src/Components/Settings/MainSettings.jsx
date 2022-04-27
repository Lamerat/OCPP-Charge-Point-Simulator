import React, { useContext } from 'react';
import { Grid, Box, Button, TextField, Select, InputLabel, MenuItem, FormControl } from '@mui/material'
import SaveIcon from '@mui/icons-material/Save';
import SettingsContext from '../../Context/SettingsContext';
import { saveSettings } from '../../common/help-functions';


const MainSettings = () => {
  const { settingsState, setSettingsState } = useContext(SettingsContext)

  const changeValue = (field, value) => setSettingsState({ ...settingsState, mainSettings: { ...settingsState.mainSettings, [field]: value } })

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={1}>
          <FormControl fullWidth>
            <InputLabel>Protocol</InputLabel>
            <Select
              value={settingsState.mainSettings.protocol}
              label='Protocol'
              size='small'
              name='protocol'
              onChange={(e) => changeValue(e.target.name, e.target.value)}
            >
              <MenuItem value={'ws'}>ws</MenuItem>
              <MenuItem value={'wss'}>wss</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label='Address'
            size='small'
            variant='outlined'
            name='address'
            value={settingsState.mainSettings.address}
            onChange={(e) => changeValue(e.target.name, e.target.value)}
          />
        </Grid>
        <Grid item xs={2}>
        <TextField
            fullWidth
            label='Port'
            size='small'
            variant='outlined'
            name='port'
            value={settingsState.mainSettings.port}
            onChange={(e) => changeValue(e.target.name, e.target.value)}
          />
        </Grid>
        <Grid item xs={3}>
          <TextField
            fullWidth
            label='Charge Point ID'
            size='small'
            variant='outlined'
            name='chargePointId'
            value={settingsState.mainSettings.chargePointId}
            onChange={(e) => changeValue(e.target.name, e.target.value)}
          />
        </Grid>
        <Grid item xs={2.5}>
        <FormControl fullWidth>
            <InputLabel>OCPP Version</InputLabel>
            <Select
              value={settingsState.mainSettings.OCPPversion}
              label='OCPP Version'
              size='small'
              name='OCPPversion'
              onChange={(e) => changeValue(e.target.name, e.target.value)}
            >
              <MenuItem value={'ocpp1.6'}>OCPP - 1.6 JSON</MenuItem>
              <MenuItem value={'ocpp1.5'}>OCPP - 1.5 JSON</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={9.5}></Grid>
        <Grid item xs={2.5}>
          <TextField
            fullWidth
            label='RFID Tag'
            size='small'
            variant='outlined'
            name='RFIDTag'
            value={settingsState.mainSettings.RFIDTag}
            onChange={(e) => changeValue(e.target.name, e.target.value)}
          />
        </Grid>
        <Grid item xs={9.5}></Grid>
        <Grid item xs={2.5}>
          <FormControl fullWidth>
            <InputLabel>Number of connectors</InputLabel>
            <Select
              value={settingsState.mainSettings.numberOfConnectors}
              label='Number of connectors'
              size='small'
              name='numberOfConnectors'
              onChange={(e) => changeValue(e.target.name, e.target.value)}
            >
              <MenuItem value={1}>One Connector</MenuItem>
              <MenuItem value={2}>Two Connectors</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={9.5}></Grid>
        <Grid item xs={2}>
          <Button startIcon={<SaveIcon />} variant='contained' onClick={() => saveSettings(settingsState)}>Save</Button>
        </Grid>
      </Grid>
    </Box>
  )
}

export default MainSettings