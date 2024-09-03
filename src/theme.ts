import { createTheme, ThemeOptions } from '@mui/material/styles';

const theme: ThemeOptions = createTheme({
  typography: {
    fontFamily: 'Lato, sans-serif',
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
      fontSize: '16px',
      lineHeight: '24px',
    },
  },
  palette: {
    primary: {
      main: '#6822FE',
    },
    secondary: {
      main: '#6B7280',
    },
    error: {
      main: '#D32F2F',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#F9FAFB',
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableRipple: true,
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: '8px',
          textTransform: 'none',
          padding: '8px 24px',
          fontWeight: 600,
          fontSize: '16px',
          lineHeight: '20px',
        },
        containedPrimary: {
          backgroundColor: '#6822FE',
          color: '#fff',
          '&:hover': {
            backgroundColor: '#551BC8',
          },
        },
        outlined: {
          borderColor: '#D32F2F',
          color: '#D32F2F',
          '&:hover': {
            borderColor: '#B71C1C',
            backgroundColor: 'rgba(211, 47, 47, 0.04)',
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          width: '451px',
          height: '220px',
          padding: '16px 16px 8px 16px',
          borderRadius: '8px',
          backgroundColor: '#FFFFFF',
          boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.16)',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontFamily: 'Lato',
          fontSize: '20px',
          fontWeight: 700,
          lineHeight: '24px',
          color: '#111827',
          padding: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          padding: '16px',
        },
      },
    },
    MuiDialogContentText: {
      styleOverrides: {
        root: {
          fontFamily: 'Lato',
          fontSize: '14px',
          fontWeight: 600,
          color: '#6B7280',
          lineHeight: '22px',
          margin: '0',
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          display: 'flex',
          justifyContent: 'space-between',
          gap: '8px',
          padding: '16px',
        },
      },
    },
  },
});

export default theme;