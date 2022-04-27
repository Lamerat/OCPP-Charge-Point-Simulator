import React from 'react';
import { Container, Toolbar, Typography, IconButton, AppBar, Tooltip } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import HomeIcon from '@mui/icons-material/Home';
import { useNavigate } from 'react-router-dom';


const MenuBar = () => {
  const history = useNavigate()

  return (
    <Container sx={{maxWidth: '1366px !important', mb: 3}}>
      <AppBar position='static'>
        <Toolbar>
          <IconButton size='large' edge='start' color='inherit' sx={{ mr: 1 }} onClick={() => history('/')}>
            <Tooltip title='Home' arrow><HomeIcon /></Tooltip>
          </IconButton>
          <Typography variant='h6' component='div' sx={{ flexGrow: 1 }}>Charge Point Simulator</Typography>
          <IconButton edge='end' color='inherit' size='large' onClick={() => history('/settings')}>
            <Tooltip title='Settings' arrow><SettingsIcon /></Tooltip>
          </IconButton>
        </Toolbar>
      </AppBar>
    </Container>
  )
}


export default MenuBar