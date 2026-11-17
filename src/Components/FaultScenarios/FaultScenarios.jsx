import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { Box, Button, Divider, FormControl, InputLabel, MenuItem, Paper, Select, Stack, Tooltip, Typography } from '@mui/material'
import { Block, Bolt, DirectionsCar, PowerSettingsNew, RestartAlt, VpnKeyOff } from '@mui/icons-material'

const scenarios = [
  {
    id: 'unavailable',
    label: 'Make unavailable',
    description: 'Marks the selected connector Unavailable and sends a StatusNotification.',
    icon: <Block fontSize='small' />,
  },
  {
    id: 'faulted',
    label: 'Inject fault',
    description: 'Marks the connector Faulted. An active transaction is stopped with reason Other first.',
    icon: <Bolt fontSize='small' />,
  },
  {
    id: 'evDisconnect',
    label: 'EV disconnect',
    description: 'Stops an active transaction with the EVDisconnected reason and reports Finishing.',
    icon: <DirectionsCar fontSize='small' />,
  },
  {
    id: 'powerLoss',
    label: 'Power loss',
    description: 'Stops any active session with PowerLoss, reports the connector Unavailable, then closes the socket.',
    icon: <PowerSettingsNew fontSize='small' />,
  },
  {
    id: 'reset',
    label: 'Hard reset',
    description: 'Stops active sessions with HardReset, restores connectors to Available, then closes the socket.',
    icon: <RestartAlt fontSize='small' />,
  },
  {
    id: 'authorizationRejection',
    label: 'Reject next authorization',
    description: 'Makes the next Authorize response behave as Invalid locally, even if the CSMS accepts it.',
    icon: <VpnKeyOff fontSize='small' />,
  },
]

const FaultScenarios = ({ connectorCount, disabled, onRunScenario }) => {
  const [connectorId, setConnectorId] = useState(1)

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant='overline' color='text.secondary' sx={{ fontWeight: 800, lineHeight: 1.2 }}>Test controls</Typography>
      <Typography variant='h6' sx={{ fontWeight: 800 }}>Fault scenarios</Typography>
      <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
        Run a repeatable connector or charge-point failure while connected.
      </Typography>
      <Divider sx={{ my: 1.75 }} />
      <FormControl fullWidth size='small' disabled={disabled} sx={{ mb: 1.5 }}>
        <InputLabel id='fault-scenario-connector-label'>Connector</InputLabel>
        <Select
          labelId='fault-scenario-connector-label'
          label='Connector'
          value={connectorId}
          onChange={(event) => setConnectorId(event.target.value)}
        >
          {Array.from({ length: connectorCount }, (_, index) => index + 1).map((id) => (
            <MenuItem key={id} value={id}>Connector {id}</MenuItem>
          ))}
        </Select>
      </FormControl>
      <Stack spacing={0.75}>
        {scenarios.map((scenario) => (
          <Tooltip key={scenario.id} title={scenario.description} placement='right' arrow>
            <span>
              <Button
                fullWidth
                size='small'
                variant={scenario.id === 'faulted' || scenario.id === 'chargerTimeout' || scenario.id === 'powerLoss' ? 'contained' : 'outlined'}
                color={scenario.id === 'faulted' || scenario.id === 'chargerTimeout' || scenario.id === 'powerLoss' ? 'error' : 'primary'}
                disabled={disabled}
                startIcon={scenario.icon}
                onClick={() => onRunScenario(scenario.id, connectorId)}
                aria-label={`${scenario.label} for connector ${connectorId}`}
                sx={{ justifyContent: 'flex-start', px: 1.25 }}
              >
                {scenario.label}
              </Button>
            </span>
          </Tooltip>
        ))}
      </Stack>
      {disabled && <Box sx={{ mt: 1.25 }}><Typography variant='caption' color='text.secondary'>Connect to the central system to run a scenario.</Typography></Box>}
    </Paper>
  )
}

FaultScenarios.propTypes = {
  connectorCount: PropTypes.number.isRequired,
  disabled: PropTypes.bool.isRequired,
  onRunScenario: PropTypes.func.isRequired,
}

export default FaultScenarios
