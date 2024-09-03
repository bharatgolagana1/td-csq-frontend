import React from 'react';
import { Alert } from '@mui/material';

interface AlertMessageProps {
  open: boolean;
  message: string;
  onClose: () => void;
}

const AlertMessage: React.FC<AlertMessageProps> = ({ open, message, onClose }) => {
  if (!open) return null;

  const severity = message.includes('deleted') ? 'error' : 'success';

  return (
    <Alert
      severity={severity}
      onClose={onClose}
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

export default AlertMessage;