import { createTheme, ThemeOptions } from '@mui/material/styles';

const theme: ThemeOptions = createTheme({
  typography: {
    fontFamily: 'Lato, Arial, sans-serif',
    h1: {
      fontFamily: 'Lato, Arial, sans-serif',
      fontWeight: 700, // Bold weight for h1
      fontSize: '24px', // Size for h1
      lineHeight: '28.8px', // Line height for h1
      letterSpacing: '0.1em', // Letter spacing for h1
      
    },
    body1: {
      fontFamily: 'Lato, Arial, sans-serif',
      fontWeight: 400, // Normal weight for body text
      width:'185px'
    },
  },
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

export default theme;
