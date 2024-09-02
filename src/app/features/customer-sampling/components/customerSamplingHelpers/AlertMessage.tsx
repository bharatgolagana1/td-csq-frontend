// src/components/AlertMessage.tsx

import React from 'react';
import { Alert } from '@mui/material';

interface AlertMessageProps {
  open: boolean;
  message: string;
  onClose: () => void;
}

const AlertMessage: React.FC<AlertMessageProps> = ({ open, message, onClose }) => {
  if (!open) return null;

  return (
    <Alert
      severity="success"
      onClose={onClose}
      style={{ marginBottom: '1rem' }}
    >
      {message}
    </Alert>
  );
};

export default AlertMessage;
