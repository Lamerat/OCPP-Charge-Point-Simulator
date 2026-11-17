import React from 'react';
import { Container, Toolbar, Typography, IconButton, AppBar, Tooltip, Box, Chip } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import HomeIcon from '@mui/icons-material/Home';
import { useNavigate } from 'react-router-dom';


const MenuBar = () => {
  const history = useNavigate()

  return (
    <Container sx={{maxWidth: '1366px !important', mb: { xs: 2, md: 3 }, pt: { xs: 1, md: 2 }}}>
      <AppBar position='static' elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', background: 'linear-gradient(105deg, #0f172a 0%, #1e3a8a 100%)' }}>
        <Toolbar>
          <IconButton aria-label='Home' size='large' edge='start' color='inherit' sx={{ mr: 1 }} onClick={() => history('/')}>
            <Tooltip title='Home' arrow><HomeIcon /></Tooltip>
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant='h6' component='div' sx={{ fontWeight: 800, lineHeight: 1.2 }}>Charge Point Simulator</Typography>
            <Typography variant='caption' sx={{ opacity: 0.75, display: { xs: 'none', sm: 'block' } }}>OCPP testing workspace</Typography>
          </Box>
          <Chip label='OCPP 1.6' size='small' sx={{ mr: 2, color: '#dbeafe', backgroundColor: 'rgba(255,255,255,0.12)', fontWeight: 700, display: { xs: 'none', sm: 'flex' } }} />
          <IconButton aria-label='Settings' edge='end' color='inherit' size='large' onClick={() => history('/settings')}>
            <Tooltip title='Settings' arrow><SettingsIcon /></Tooltip>
          </IconButton>
        </Toolbar>
      </AppBar>
    </Container>
  )
}


export default MenuBar
