import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface CustomerSamplingDialogsProps {
  openDelete: boolean;
  openGroupDelete: boolean;
  openSampleDialog: boolean;
  handleCloseDelete: () => void;
  handleCloseGroupDelete: () => void;
  handleCloseSampleDialog: () => void;
  confirmDelete: () => void;
  confirmGroupDelete: () => void;
  confirmSampleCustomer: () => void;
}

const CustomerSamplingDialogs: React.FC<CustomerSamplingDialogsProps> = ({
  openDelete,
  openGroupDelete,
  openSampleDialog,
  handleCloseDelete,
  handleCloseGroupDelete,
  handleCloseSampleDialog,
  confirmDelete,
  confirmGroupDelete,
  confirmSampleCustomer,
}) => {
  return (
    <div>
      <Dialog open={openDelete} onClose={handleCloseDelete}>
        <DialogTitle>
          Are you sure?
          <IconButton onClick={handleCloseDelete} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            On clicking submit, customer would be selected for assessment.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDelete} variant="outlined" color="error" fullWidth className="dialogButton">
            No
          </Button>
          <Button onClick={confirmDelete} variant="contained" color="primary" fullWidth className="dialogButton">
            Yes
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openGroupDelete} onClose={handleCloseGroupDelete}>
        <DialogTitle>
          Are you sure you want to delete?
          <IconButton onClick={handleCloseGroupDelete} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Selected Customers will be permanently deleted.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseGroupDelete} variant="outlined" color="error" fullWidth className="dialogButton">
            No
          </Button>
          <Button onClick={confirmGroupDelete} variant="contained" color="primary" fullWidth className="dialogButton">
            Yes
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openSampleDialog} onClose={handleCloseSampleDialog}>
        <DialogTitle>
          Are you sure?
          <IconButton onClick={handleCloseSampleDialog} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            On clicking submit, customer would be selected for assessment.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSampleDialog} variant="outlined" color="error" fullWidth className="dialogButton">
            Cancel
          </Button>
          <Button onClick={confirmSampleCustomer} variant="contained" color="primary" fullWidth className="dialogButton">
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default CustomerSamplingDialogs;
