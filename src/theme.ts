import { createTheme, ThemeOptions } from '@mui/material/styles';

const theme: ThemeOptions = createTheme({
  typography: {
    fontFamily: 'Lato',
    h1: {
      fontFamily: 'Lato',
      fontWeight: 700,
      fontSize: '24px',
      lineHeight: '28.8px',
      letterSpacing: '0.1em',
      margin: 0,
    },
    body1: {
      fontFamily: 'Lato',
      fontWeight: 400,
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
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          whiteSpace: 'nowrap', // Applies nowrap to the body
        },
        div: {
          whiteSpace: 'nowrap', // Applies nowrap to all div elements
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          whiteSpace: 'nowrap',
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableRipple: true,
        disableElevation: true,
      },
      styleOverrides: {
        contained: {
          backgroundColor: '#1976d2',
          color: '#fff',
          '&:hover': {
            backgroundColor: '#115293',
          },
        },
        outlined: {
          borderColor: '#1976d2',
          color: '#1976d2',
          '&:hover': {
            borderColor: '#115293',
            backgroundColor: 'rgba(25, 118, 210, 0.04)',
          },
        },
      },
    },
  },
});

export default theme;
