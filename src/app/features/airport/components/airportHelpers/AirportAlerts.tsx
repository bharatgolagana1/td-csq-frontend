import React from 'react';
import { Alert, IconButton } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

interface AlertBoxProps {
  message: string | null;
  onClose: () => void;
  type: 'success' | 'error' | 'deleted';
}

const AirportAlerts: React.FC<AlertBoxProps> = ({ message, onClose, type }) => {
  if (!message) return null;

  // Determine severity based on type
  const severity = type === 'deleted' ? 'error' : type;

  return (
    <Alert
      severity={severity}
      onClose={onClose}
      action={
        <IconButton
          color="inherit"
          onClick={onClose}
          size="small"
          aria-label="close"
        >
          <CloseIcon />
        </IconButton>
      }
      style={{
        position: 'fixed',
        bottom: '1rem',
        left: '50%',
        transform: 'translateX(-50%)',
        marginBottom: '1rem',
        zIndex: 1000,
      }}
    >
      {message}
    </Alert>
  );
};

export default AirportAlerts;
