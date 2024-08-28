import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Paper,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Alert,
  Snackbar
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import './CtoActivationTable.css';
import { CtoActivationData, getAllCtoActivations, deleteCtoActivations } from '../../api/CtoActivationAPI';

const CtoActivationTable: React.FC = () => {
  const [data, setData] = useState<CtoActivationData[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openAlert, setOpenAlert] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getAllCtoActivations();
        setData(response);
      } catch (error) {
        console.error('Error fetching CTO Activations:', error);
      }
    };

    fetchData();
  }, []);

  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = data.map((n) => n.requestId);
      setSelected(newSelected);
      return;
    }
    setSelected([]);
  };

  const handleCheckboxClick = (requestId: number) => {
    const selectedIndex = selected.indexOf(requestId);
    let newSelected: number[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, requestId);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1)
      );
    }

    setSelected(newSelected);
  };

  const handleDelete = () => {
    setOpenDialog(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteCtoActivations(selected);
      setData(data.filter((item) => !selected.includes(item.requestId)));
      setSelected([]);
      setOpenDialog(false);
      setOpenAlert(true);
    } catch (error) {
      console.error('Error deleting CTO Activations:', error);
    }
  };

  return (
    <div className="cto-activation-container">
      <div className="header-row">
        <Typography variant="h6">CTO Activation</Typography>
      </div>
      <div className="toolbar-row">
        Search
        <Button variant="outlined" className="reset-button">Reset All</Button>
      </div>
      {selected.length > 0 && (
        <Toolbar className="selected-toolbar">
          <Typography variant="h6">{selected.length} Selected</Typography>
          <div className="action-buttons">
          <IconButton aria-label="delete" onClick={handleDelete}>
              <DeleteIcon style={{ color: 'white' }} />
            </IconButton> 
            <Button variant="contained" color="primary" className="activate-button">
              Activate
            </Button>
          </div>
        </Toolbar>
      )}
      <TableContainer component={Paper}>
        <Table className="cto-activation-table"> 
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={selected.length > 0 && selected.length < data.length}
                  checked={data.length > 0 && selected.length === data.length}
                  onChange={handleSelectAllClick}
                  inputProps={{ 'aria-label': 'select all requests' }}
                />
              </TableCell>
              <TableCell className="table-header">Request Id</TableCell>
              <TableCell className="table-header">Assigned Date</TableCell>
              <TableCell className="table-header">Request For</TableCell>
              <TableCell className="table-header">Request Type</TableCell>
              <TableCell className="table-header">Email</TableCell>
              <TableCell className="table-header">Mobile</TableCell>
              <TableCell className="table-header">Non Member</TableCell>
              <TableCell className="table-header">TIACA Comments</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row) => (
              <TableRow
                key={row.requestId}
                selected={selected.indexOf(row.requestId) !== -1}
              >
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selected.indexOf(row.requestId) !== -1}
                    onChange={() => handleCheckboxClick(row.requestId)}
                  />
                </TableCell>
                <TableCell>{row.requestId}</TableCell>
                <TableCell>{row.assignedDate}</TableCell>
                <TableCell>{row.requestFor}</TableCell>
                <TableCell>{row.requestType}</TableCell>
                <TableCell>{row.email}</TableCell>
                <TableCell>{row.mobile}</TableCell>
                <TableCell>{row.nonMember}</TableCell>
                <TableCell>{row.comments}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the selected items?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={confirmDelete} color="primary" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={openAlert} autoHideDuration={6000} onClose={() => setOpenAlert(false)}>
        <Alert onClose={() => setOpenAlert(false)} severity="success">
          Item(s) deleted successfully!
        </Alert>
      </Snackbar>
    </div>
  );
};

export default CtoActivationTable;
