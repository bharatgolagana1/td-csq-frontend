import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import { useState } from 'react';
import { deleteUserMasters } from '../../api/UserTypeMasterAPI';

interface DeleteUserProps {
  open: boolean;
  onClose: () => void;
  selected: string[];
  setSelected: (selected: string[]) => void;
  setRows: (rows: any[]) => void;
}

const DeleteUser: React.FC<DeleteUserProps> = ({ open, onClose, selected, setSelected, setRows }) => {
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteUserMasters(selected);
      setRows((prevRows) => prevRows.filter(row => !selected.includes(row._id!)));
      setSelected([]);
      onClose();
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error deleting user masters:', error);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {selected.length} selected items?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDelete} color="secondary">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message="Items deleted successfully"
      />
    </>
  );
};

export default DeleteUser;
