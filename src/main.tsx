import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import "@fontsource/lato"
import './index.css'
import ThemeProvider from '@mui/material/styles/ThemeProvider'
import CssBaseline from '@mui/material/CssBaseline'
import theme from './theme.ts'

ReactDOM.createRoot(document.getElementById('root')!).render(
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <App />
        </ThemeProvider>
)
