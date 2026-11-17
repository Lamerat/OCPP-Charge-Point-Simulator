import React, { useRef, useState } from 'react'
import { Container, Box, Tabs, Tab, Paper, Typography, Button, Stack, Alert } from '@mui/material'
import TabPanel from './TabPanel';
import MainSettings from './MainSettings';
import BootNotification from './BootNotification';
import Station from './Station';
import Simulation from './Simulation';
import { DownloadOutlined, UploadFileOutlined, RestartAltOutlined } from '@mui/icons-material';
import SettingsContext from '../../Context/SettingsContext';
import { useContext } from 'react';
import defaultSettings from '../../Config/default-settings';
import { saveSettings } from '../../common/help-functions';


const a11yProps = (index) => ({ id: `simple-tab-${index}`, 'aria-controls': `simple-tabpanel-${index}` })


const Settings = () => {
  const [ activeTab, setActiveTab ] = useState(0);
  const { settingsState, setSettingsState } = useContext(SettingsContext)
  const [ importError, setImportError ] = useState('')
  const fileInputRef = useRef(null)

  const tabChange = (event, newValue) => setActiveTab(newValue)

  const downloadSettings = () => {
    const file = new Blob([JSON.stringify(settingsState, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(file)
    const link = document.createElement('a')
    link.href = url
    link.download = 'ocpp-charge-point-simulator-settings.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  const normalizeSettings = (imported) => ({
    ...defaultSettings,
    ...imported,
    mainSettings: { ...defaultSettings.mainSettings, ...imported.mainSettings },
    bootNotification: { ...defaultSettings.bootNotification, ...imported.bootNotification },
    simulation: { ...defaultSettings.simulation, ...imported.simulation },
    stationSettings: Array.isArray(imported.stationSettings) ? imported.stationSettings : defaultSettings.stationSettings,
  })

  const importSettings = (event) => {
    const [ file ] = event.target.files
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const imported = JSON.parse(reader.result)
        if (!imported || typeof imported !== 'object' || Array.isArray(imported)) throw new Error('Invalid settings format')
        const nextSettings = normalizeSettings(imported)
        setSettingsState(nextSettings)
        saveSettings(nextSettings)
        setImportError('')
      } catch {
        setImportError('The selected file is not a valid simulator settings JSON file.')
      } finally {
        event.target.value = ''
      }
    }
    reader.readAsText(file)
  }

  const resetSettings = () => {
    if (!window.confirm('Restore all simulator settings to their defaults?')) return
    const nextSettings = JSON.parse(JSON.stringify(defaultSettings))
    setSettingsState(nextSettings)
    saveSettings(nextSettings)
    setImportError('')
  }

  return (
    <Container sx={{maxWidth: '1060px !important', pb: 4}}>
      <Box sx={{ mb: 2.5 }}>
        <Typography variant='h4' sx={{ fontWeight: 800, letterSpacing: '-0.03em' }}>Simulator settings</Typography>
        <Typography color='text.secondary' sx={{ mt: 0.5 }}>Configure connection, charge point identity, and simulation behavior.</Typography>
      </Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 2 }}>
        <Button variant='outlined' startIcon={<DownloadOutlined />} onClick={downloadSettings}>Export settings</Button>
        <Button variant='outlined' startIcon={<UploadFileOutlined />} onClick={() => fileInputRef.current?.click()}>Import settings</Button>
        <Button color='error' variant='text' startIcon={<RestartAltOutlined />} onClick={resetSettings}>Restore defaults</Button>
        <input ref={fileInputRef} type='file' accept='application/json,.json' onChange={importSettings} hidden />
      </Stack>
      {importError && <Alert severity='error' sx={{ mb: 2 }}>{importError}</Alert>}
      <Paper sx={{p: { xs: 1.5, sm: 2.5 }}}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={tabChange} aria-label='Simulator settings sections' variant='scrollable' scrollButtons='auto'>
          <Tab label='Main' {...a11yProps(0)} />
          <Tab label='Boot notification' {...a11yProps(1)} />
          <Tab label='Station' {...a11yProps(2)} />
          <Tab label='Simulation' {...a11yProps(3)} />
        </Tabs>
      </Box>
      <TabPanel value={activeTab} index={0}>
        <MainSettings />
      </TabPanel>
      <TabPanel value={activeTab} index={1}>
        <BootNotification />
      </TabPanel>
      <TabPanel value={activeTab} index={2}>
        <Station />
      </TabPanel>
      <TabPanel value={activeTab} index={3}>
        <Simulation />
      </TabPanel>
      </Paper>
    </Container>
  )
}


export default Settings
