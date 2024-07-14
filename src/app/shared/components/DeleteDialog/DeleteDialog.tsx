import React from 'react';
import { Box, Button, Typography, Modal } from '@mui/material';
import './DeleteDialog.css'

interface DeleteDialogProps {
  open: boolean;
  onClose: () => void;
  onDelete: () => void;
}

const ModalStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const DeleteDialog: React.FC<DeleteDialogProps> = ({ open, onClose, onDelete }) => {
  return (
    <Modal open={open} onClose={onClose} style={ModalStyle}>
      <Box className='delete-dialog-container small-delete-dialog-container'>
        <Typography variant="h6">Are you sure you want to delete this item?</Typography>
        <div className='button-container'>
          <Button variant="contained" color="secondary" onClick={onDelete}>
            Delete
          </Button>
          <Button variant="contained" onClick={onClose}>
            Back
          </Button>
        </div>
      </Box>
    </Modal>
  );
};

export default DeleteDialog;
