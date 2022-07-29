import React, { useContext } from 'react';
import { Grid, Box, Button, TextField, FormControl, InputLabel, Select, MenuItem, Paper, FormGroup, FormControlLabel, Switch } from '@mui/material'
import SaveIcon from '@mui/icons-material/Save';
import SettingsContext from '../../Context/SettingsContext';
import { saveSettings } from '../../common/help-functions';


const SingleField = ({data}) => {
  const { settingsState, setSettingsState } = useContext(SettingsContext)

  const changeValue = (field, value) => {
    const index = settingsState.stationSettings.findIndex(x => x.key === data.key)
    const element = { ...data, [field]: value }
    settingsState.stationSettings[index] = element
    setSettingsState( { ...settingsState } )
  }

  return (
    <Grid container spacing={2}>
      <Grid item xs={7}>
      {typeof data.value === 'boolean'
        ? <FormControl fullWidth>
            <InputLabel>{data.key}</InputLabel>
            <Select
              value={data.value}
              label={data.key}
              size='small'
              name='value'
              disabled={data.readonly}
              onChange={(e) => changeValue(e.target.name, e.target.value)}
            >
              <MenuItem value={true}>true</MenuItem>
              <MenuItem value={false}>false</MenuItem>
            </Select>
          </FormControl>
        : <TextField
            value={data.value}
            fullWidth
            label={data.key}
            size='small'
            name='value'
            disabled={data.readonly}
            onChange={(e) => changeValue(e.target.name, e.target.value)}
          />
      }
      </Grid>
      <Grid item xs={5}>
      <FormGroup>
        <FormControlLabel
          control={
            <Switch
              name='readonly'
              checked={data.readonly}
              onChange={(e) => changeValue(e.target.name, e.target.checked)}
            />
          }
        label='Read only'
        labelPlacement='start'
      />
      </FormGroup>
      </Grid>
    </Grid>
  )
}



const Station = () => {
  const { settingsState } = useContext(SettingsContext)

  return (
    <Box>
      <Grid container spacing={3}>
        { settingsState.stationSettings.map(x => <Grid key={x.key} item xs={4}><Paper sx={{p: 2}}><SingleField data={x}/></Paper></Grid>) }
        <Grid item xs={4}></Grid><Grid item xs={4}></Grid>
        <Grid item xs={2}>
          <Button startIcon={<SaveIcon />} variant='contained' onClick={() => saveSettings(settingsState)}>Save</Button>
        </Grid>
      </Grid>
    </Box>
  )
}

export default Station