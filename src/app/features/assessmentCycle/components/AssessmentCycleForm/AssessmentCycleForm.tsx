import React, { useState } from 'react';
import { TextField, Button, Grid, Box, Alert } from '@mui/material';
import { addAssessmentCycle } from '../../api/AssessmentCycleAPI';
import { AssessmentCycleFormData } from '../AssessmentCycleTypes';
import './AssessmentCycleForm.css';

const AssessmentCycleForm: React.FC = () => {
  const [formData, setFormData] = useState<AssessmentCycleFormData>({
    cycleId: '',
    status: '',
    initiationDuration: '',
    initiationDate: '',
    minSamplingSize: '',
    samplingStartDate: '',
    samplingEndDate: '',
    samplingReminder: '',
    assessmentDuration: '',
    assessmentStartDate: '',
    assessmentEndDate: '',
    assessmentReminder: '',
  });

  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [alertSeverity, setAlertSeverity] = useState<'success' | 'error'>('success');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const isFormValid = () => {
    return Object.values(formData).every((value) => value.trim() !== '');
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addAssessmentCycle(formData);
      setAlertMessage('Assessment cycle added successfully.');
      setAlertSeverity('success');
      
      // Clear the form and alert after 3 seconds
      setTimeout(() => {
        setAlertMessage(null);
        setFormData({
          cycleId: '',
          status: '',
          initiationDuration: '',
          initiationDate: '',
          minSamplingSize: '',
          samplingStartDate: '',
          samplingEndDate: '',
          samplingReminder: '',
          assessmentDuration: '',
          assessmentStartDate: '',
          assessmentEndDate: '',
          assessmentReminder: '',
        });
      }, 5000);
    } catch (error) {
      console.error('Failed to create assessment cycle', error);
      setAlertMessage('Failed to add assessment cycle.');
      setAlertSeverity('error');
    }
  };
  
  return (
    <Box className="form-container-cycle">
      <h1 className="add-assessment-text">
        Add Assessment Cycle
      </h1>
      {alertMessage && (
        <Alert severity={alertSeverity} className="alert-message">
          {alertMessage}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3} className="grid-container"> {/* Adjusted spacing */}
          <Grid item xs={12} sm={4} className="grid-item">
            <TextField
              label="Cycle ID"
              name="cycleId"
              value={formData.cycleId}
              onChange={handleChange}
              fullWidth
              required
              className="form-field"
            />
          </Grid>
          <Grid item xs={12} sm={4} className="grid-item">
            <TextField
              label="Status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              fullWidth
              required
              className="form-field"
            />
          </Grid>
          <Grid item xs={12} sm={4} className="grid-item">
            <TextField
              label="Initiation Duration"
              name="initiationDuration"
              value={formData.initiationDuration}
              onChange={handleChange}
              fullWidth
              required
              className="form-field"
            />
          </Grid>
          <Grid item xs={12} sm={4} className="grid-item">
            <TextField
              label="Initiation Date"
              name="initiationDate"
              type="date"
              value={formData.initiationDate}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
              fullWidth
              required
              className="form-field"
            />
          </Grid>
          <Grid item xs={12} sm={4} className="grid-item">
            <TextField
              label="Min Sampling Size"
              name="minSamplingSize"
              value={formData.minSamplingSize}
              onChange={handleChange}
              fullWidth
              required
              className="form-field"
            />
          </Grid>
          <Grid item xs={12} sm={4} className="grid-item">
            <TextField
              label="Sampling Start Date"
              name="samplingStartDate"
              type="date"
              value={formData.samplingStartDate}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
              fullWidth
              required
              className="form-field"
            />
          </Grid>
          <Grid item xs={12} sm={4} className="grid-item">
            <TextField
              label="Sampling End Date"
              name="samplingEndDate"
              type="date"
              value={formData.samplingEndDate}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
              fullWidth
              className="form-field"
            />
          </Grid>
          <Grid item xs={12} sm={4} className="grid-item">
            <TextField
              label="Sampling Reminder Date"
              name="samplingReminder"
              type="date"
              value={formData.samplingReminder}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
              fullWidth
              required
              className="form-field"
            />
          </Grid>
          <Grid item xs={12} sm={4} className="grid-item">
            <TextField
              label="Assessment Duration"
              name="assessmentDuration"
              value={formData.assessmentDuration}
              onChange={handleChange}
              fullWidth
              required
              className="form-field"
            />
          </Grid>
          <Grid item xs={12} sm={4} className="grid-item">
            <TextField
              label="Assessment Start Date"
              name="assessmentStartDate"
              type="date"
              value={formData.assessmentStartDate}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
              fullWidth
              required
              className="form-field"
            />
          </Grid>
          <Grid item xs={12} sm={4} className="grid-item">
            <TextField
              label="Assessment End Date"
              name="assessmentEndDate"
              type="date"
              value={formData.assessmentEndDate}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
              fullWidth
              className="form-field"
            />
          </Grid>
          <Grid item xs={12} sm={4} className="grid-item">
            <TextField
              label="Assessment Reminder Date"
              name="assessmentReminder"
              type="date"
              value={formData.assessmentReminder}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
              fullWidth
              required
              className="form-field"
            />
          </Grid>
          <Grid item xs={12} className="submit-grid-item">
            <Button
              variant="contained"
              color="primary"
              type="submit"
              disabled={!isFormValid()}
              className="submit-button"
              fullWidth
            >
              Add Assessment Cycle
            </Button>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
};

export default AssessmentCycleForm;