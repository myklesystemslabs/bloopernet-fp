import React from 'react'
import ReactDOM from 'react-dom/client'
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline'; // todo: remove/replace with some other reset
import RoutedApp from './App.jsx'
import './index.css'
import 'normalize.css';

const theme = createTheme();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RoutedApp />
    </ThemeProvider>
  </React.StrictMode>,
)
