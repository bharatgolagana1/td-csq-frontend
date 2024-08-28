import React, { useEffect, useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Checkbox, Button, IconButton, Dialog,
  DialogActions, DialogContent, DialogContentText,
  DialogTitle, Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import { getAssessmentCycles, deleteAssessmentCycles } from '../../api/AssessmentCycleAPI';
import { AssessmentCycle } from '../../types';
import AssessmentCycleDetailsModal from '../assessmentCycleModal/AssessmentCycleModal';
import './AssessmentCycleTable.css';

// Utility function to format dates
const formatDate = (date: string | Date) => {
    return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(date));
};  

const AssessmentCycleTable: React.FC = () => {
  const [cycles, setCycles] = useState<AssessmentCycle[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState<AssessmentCycle | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchCycles();
  }, []);

  const fetchCycles = async () => {
    try {
      const data = await getAssessmentCycles();
      setCycles(data.assessmentCycles);
    } catch (error) {
      console.error('Failed to fetch assessment cycles', error);
    }
  };

  const handleSelect = (id: string) => {
    setSelectedIds((prevSelected) =>
      prevSelected.includes(id)
        ? prevSelected.filter((selectedId) => selectedId !== id)
        : [...prevSelected, id]
    );
  };

  const handleDelete = async () => {
    try {
      await deleteAssessmentCycles(selectedIds);
      setAlertMessage(`You deleted ${selectedIds.length} cycles.`);
      setSelectedIds([]);
      fetchCycles();
      setTimeout(() => setAlertMessage(null), 5000);
    } catch (error) {
      console.error('Failed to delete assessment cycles', error);
      setAlertMessage('Failed to delete cycles.');
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  const handleViewDetails = async (cycle: AssessmentCycle) => {
    setSelectedCycle(cycle);
    setOpen(true);
  };

  const handleClose = () => {
    setIsEditMode(false);
    setOpen(false);
  };

  const handleCloseOperation = () => {
    setSelectedIds([]);
  };

  return (
    <div className="table-container">
      {alertMessage && (
        <Alert severity="info" className="alert-box">
          {alertMessage}
          <IconButton onClick={() => setAlertMessage(null)} className="alert-close-button">X</IconButton>
        </Alert>
      )}

      {selectedIds.length > 0 && (
        <div className="selected-actions">
          <span className="selected-text">
            {selectedIds.length} selected
          </span>
          <Button
            className="delete-button-cycle"
            onClick={() => setDeleteDialogOpen(true)}
          >
            Delete <DeleteIcon />
          </Button>
          <IconButton onClick={handleCloseOperation} className="close-operation-button">
            <CloseIcon />
          </IconButton>
        </div>
      )}

      <TableContainer component={Paper}>
        <Table className="assessment-cycle">
          <TableHead className="table-header">
            <TableRow>
              <TableCell padding="checkbox" className="table-header-cell">
                <Checkbox
                  indeterminate={
                    selectedIds.length > 0 && selectedIds.length < cycles.length
                  }
                  checked={cycles.length > 0 && selectedIds.length === cycles.length}
                  onChange={() => {
                    if (selectedIds.length === cycles.length) {
                      setSelectedIds([]);
                    } else {
                      setSelectedIds(cycles.map((cycle) => cycle._id));
                    }
                  }}
                />
              </TableCell>
              <TableCell className="table-header-cell">Cycle ID</TableCell>
              <TableCell className="table-header-cell">Status</TableCell>
              <TableCell className="table-header-cell">Initiation Duration</TableCell>
              <TableCell className="table-header-cell">Initiation Date</TableCell>
              <TableCell className="table-header-cell">Min Sampling Size</TableCell>
              <TableCell className="table-header-cell">Sampling Start</TableCell>
              <TableCell className="table-header-cell">Sampling End</TableCell>
              <TableCell className="table-header-cell">Sampling Reminder</TableCell>
              <TableCell className="table-header-cell">Details</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {cycles.map((cycle) => (
              <TableRow key={cycle._id} className="table-row">
                <TableCell padding="checkbox" className="checkbox-cell">
                  <Checkbox
                    checked={selectedIds.includes(cycle._id)}
                    onChange={() => handleSelect(cycle._id)}
                  />
                </TableCell>
                <TableCell className="table-cell">{cycle.cycleId}</TableCell>
                <TableCell className="table-cell">{cycle.status}</TableCell>
                <TableCell className="table-cell">{cycle.initiationDuration}</TableCell>
                <TableCell className="table-cell">{formatDate(cycle.initiationDate)}</TableCell>
                <TableCell className="table-cell">{cycle.minSamplingSize}</TableCell>
                <TableCell className="table-cell">{formatDate(cycle.samplingStartDate)}</TableCell>
                <TableCell className="table-cell">{cycle.samplingEndDate ? new Date(cycle.samplingEndDate).toLocaleDateString() : 'N/A'}</TableCell>
                <TableCell className="table-cell">{formatDate(cycle.samplingReminder)}</TableCell>
                <TableCell className="table-cell">
                  <span className="view-text" onClick={() => handleViewDetails(cycle)}>
                    View
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <AssessmentCycleDetailsModal
        open={open}
        onClose={handleClose}
        cycle={selectedCycle}
        isEditMode={isEditMode}
        setIsEditMode={setIsEditMode}
        fetchCycles={fetchCycles}
      />

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Assessment Cycles</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {selectedIds.length} assessment cycle(s)?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default AssessmentCycleTable;
