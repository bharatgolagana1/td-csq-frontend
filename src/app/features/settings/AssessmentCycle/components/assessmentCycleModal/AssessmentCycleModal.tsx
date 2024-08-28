import React, { useState, useEffect } from 'react';
import { Modal, Box, Typography, IconButton, Button, TextField } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { AssessmentCycle } from '../../types';
import { updateAssessmentCycle } from '../../api/AssessmentCycleAPI';
import './AssessmentCycleModal.css'; // Import the CSS file

interface Props {
  open: boolean;
  onClose: () => void;
  cycle: AssessmentCycle | null;
  isEditMode: boolean;
  setIsEditMode: (editMode: boolean) => void;
  fetchCycles: () => void;
}

const AssessmentCycleDetailsModal: React.FC<Props> = ({ open, onClose, cycle, isEditMode, setIsEditMode, fetchCycles }) => {
  const [editableData, setEditableData] = useState<Partial<AssessmentCycle>>(cycle || {});

  // Update editableData when cycle changes
  useEffect(() => {
    if (cycle) {
      setEditableData(cycle);
    }
  }, [cycle]);

  const handleInputChange = (field: keyof AssessmentCycle, value: any) => {
    setEditableData((prevData) => ({
      ...prevData,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (cycle && editableData) {
      try {
        await updateAssessmentCycle(cycle._id, editableData);
        fetchCycles();
        setIsEditMode(false);
        onClose();
      } catch (error) {
        console.error('Failed to update assessment cycle', error);
      }
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box className="modal-box">
        {cycle && (
          <>
            <Typography variant="h6" component="h2" className="modal-title">
              Assessment Cycle Details
              <IconButton onClick={() => setIsEditMode(true)} className="edit-button">
                <EditIcon />
              </IconButton>
            </Typography>
            <Box className="modal-content">
              {isEditMode ? (
                <>
                  <TextField
                    label="Status"
                    value={editableData.status || ''}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    fullWidth
                    className="input-field"
                  />
                  <TextField
                    label="Cycle ID"
                    value={editableData.cycleId || ''}
                    onChange={(e) => handleInputChange('cycleId', e.target.value)}
                    fullWidth
                    className="input-field"
                  />
                  <TextField
                    label="Initiation Duration"
                    value={editableData.initiationDuration || ''}
                    onChange={(e) => handleInputChange('initiationDuration', e.target.value)}
                    fullWidth
                    className="input-field"
                  />
                  <TextField
                    label="Initiation Date"
                    value={editableData.initiationDate || ''}
                    onChange={(e) => handleInputChange('initiationDate', e.target.value)}
                    fullWidth
                    className="input-field"
                  />
                  <TextField
                    label="Min Sampling Size"
                    value={editableData.minSamplingSize || ''}
                    onChange={(e) => handleInputChange('minSamplingSize', e.target.value)}
                    fullWidth
                    className="input-field"
                  />
                  <TextField
                    label="Sampling Start Date"
                    value={editableData.samplingStartDate || ''}
                    onChange={(e) => handleInputChange('samplingStartDate', e.target.value)}
                    fullWidth
                    className="input-field"
                  />
                  <TextField
                    label="Sampling End Date"
                    value={editableData.samplingEndDate || ''}
                    onChange={(e) => handleInputChange('samplingEndDate', e.target.value)}
                    fullWidth
                    className="input-field"
                  />
                  <TextField
                    label="Sampling Reminder"
                    value={editableData.samplingReminder || ''}
                    onChange={(e) => handleInputChange('samplingReminder', e.target.value)}
                    fullWidth
                    className="input-field"
                  />
                  <Button variant="contained" color="primary" onClick={handleSave} className="save-button">
                    Save
                  </Button>
                </>
              ) : (
                <>
                  <Typography className="detail-text">Cycle ID: {cycle.cycleId}</Typography>
                  <Typography className="detail-text">Status: {cycle.status}</Typography>
                  <Typography className="detail-text">Initiation Duration: {cycle.initiationDuration}</Typography>
                  <Typography className="detail-text">
                    Initiation Date: {cycle.initiationDate ? new Date(cycle.initiationDate).toLocaleDateString() : 'N/A'}
                  </Typography>
                  <Typography className="detail-text">Min Sampling Size: {cycle.minSamplingSize}</Typography>
                  <Typography className="detail-text">
                    Sampling Start Date: {cycle.samplingStartDate ? new Date(cycle.samplingStartDate).toLocaleDateString() : 'N/A'}
                  </Typography>
                  <Typography className="detail-text">
                    Sampling End Date: {cycle.samplingEndDate ? new Date(cycle.samplingEndDate).toLocaleDateString() : 'N/A'}
                  </Typography>
                  <Typography className="detail-text">
                    Sampling Reminder: {cycle.samplingReminder ? new Date(cycle.samplingReminder).toLocaleDateString() : 'N/A'}
                  </Typography>
                </>
              )}
            </Box>
          </>
        )}
      </Box>
    </Modal>
  );
};

export default AssessmentCycleDetailsModal;
