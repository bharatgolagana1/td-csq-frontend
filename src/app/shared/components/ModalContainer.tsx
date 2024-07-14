import React from 'react';
import { Modal, Box } from '@mui/material';

interface ModalContainerProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const ModalContainer: React.FC<ModalContainerProps> = ({ open, onClose, children }) => {
  return (
    <Modal open={open} onClose={onClose} aria-labelledby="modal-title" aria-describedby="modal-description">
      <Box className='modal-content'>
        {children}
      </Box>
    </Modal>
  );
};

export default ModalContainer;
