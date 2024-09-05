import React from 'react';
import {
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Checkbox, IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import './AssessmentCycleTable.css';
import deleteIcon from '../../../../../assets/deleteIcon.svg';

const formatDate = (date: string | Date) => {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(date));
};

interface AssessmentCycleTableProps {
  cycles: any[];
  selectedIds: string[];
  onSelect: (id: string) => void;
  onDelete: () => void;
  onViewDetails: (cycle: any) => void;
  onCloseOperation: () => void;
  setDeleteDialogOpen: (open: boolean) => void;
}

const AssessmentCycleTable: React.FC<AssessmentCycleTableProps> = ({
  cycles, selectedIds, onSelect, onViewDetails,
  onCloseOperation, setDeleteDialogOpen
}) => {
     const handleRowClick = (cycleId: string) => {
        onSelect(cycleId);
      };
  return (
    <div className="table-container">
    {selectedIds.length > 0 && (
      <div className="selected-actions">
        <span className="selected-text">
          {selectedIds.length} selected
        </span>
        <IconButton
          className="delete-button-cycle"
          onClick={() => setDeleteDialogOpen(true)}
        >
            <span>Delete </span><img src={deleteIcon} alt="delete"/>
        </IconButton>
        <IconButton onClick={onCloseOperation} className="close-operation-button">
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
                    onCloseOperation();
                  } else {
                    cycles.forEach((cycle) => onSelect(cycle._id));
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
            <TableRow
              key={cycle._id}
              className="table-row"
              onClick={() => handleRowClick(cycle._id)}
              hover
              selected={selectedIds.includes(cycle._id)}
            >
              <TableCell padding="checkbox" className="checkbox-cell" onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={selectedIds.includes(cycle._id)}
                  onChange={() => onSelect(cycle._id)}
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
                <span className="view-text" onClick={(e) => { e.stopPropagation(); onViewDetails(cycle); }}>
                  View
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  </div>
  );
};

export default AssessmentCycleTable;
