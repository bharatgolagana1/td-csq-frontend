import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Box, TextField, Button, Grid } from '@mui/material';
import './AssessmentCycle.css';

const AssessmentCycle: React.FC = () => {
  const [formData, setFormData] = useState({
    initiationDate: '',
    minSamplingSize: '',
    samplingStartDate: '',
    samplingDuration: '',
    samplingEndDate: '',
    reminderCount: '',
    assessmentStartDate: '',
    assessmentDuration: '',
    assessmentEndDate: '',
  });

  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/assessment/Cycle', formData);
      console.log('Success:', response.data);
      alert('Success');
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const errorMessage = error.response.data.message || 'An error occurred';
        alert(`Error: ${errorMessage}`);
      } else {
        alert('An unexpected error occurred');
      }
    }
  };

  const handleCancel = () => {
    navigate('/settings');
  };

  useEffect(() => {
    if (formData.samplingStartDate && formData.samplingDuration) {
      const startDate = new Date(formData.samplingStartDate);
      const duration = parseInt(formData.samplingDuration, 10);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + duration);
      setFormData(prevData => ({
        ...prevData,
        samplingEndDate: endDate.toISOString().split('T')[0],
      }));
    }
  }, [formData.samplingStartDate, formData.samplingDuration]);

  useEffect(() => {
    if (formData.assessmentStartDate && formData.assessmentDuration) {
      const startDate = new Date(formData.assessmentStartDate);
      const duration = parseInt(formData.assessmentDuration, 10);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + duration);
      setFormData(prevData => ({
        ...prevData,
        assessmentEndDate: endDate.toISOString().split('T')[0],
      }));
    }
  }, [formData.assessmentStartDate, formData.assessmentDuration]);

  return (
    <Box component="form" className="assessment-cycle-form" onSubmit={handleSubmit}>
      <h2 className="form-title">Add Assessment Cycle</h2>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            name="initiationDate"
            label="Initiation Date"
            type="date"
            InputLabelProps={{ shrink: true }}
            fullWidth
            required
            value={formData.initiationDate}
            onChange={handleChange}
            className="form-field"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            name="minSamplingSize"
            label="Min Sampling Size"
            type="number"
            fullWidth
            required
            value={formData.minSamplingSize}
            onChange={handleChange}
            className="form-field"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            name="samplingStartDate"
            label="Sampling Start Date"
            type="date"
            InputLabelProps={{ shrink: true }}
            fullWidth
            required
            value={formData.samplingStartDate}
            onChange={handleChange}
            className="form-field"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            name="samplingDuration"
            label="Sampling Duration"
            type="number"
            fullWidth
            required
            value={formData.samplingDuration}
            onChange={handleChange}
            className="form-field"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            name="samplingEndDate"
            label="Sampling End Date"
            type="date"
            InputLabelProps={{ shrink: true }}
            fullWidth
            required
            value={formData.samplingEndDate}
            onChange={handleChange}
            disabled
            className="form-field"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            name="reminderCount"
            label="Reminder Count"
            type="number"
            fullWidth
            required
            value={formData.reminderCount}
            onChange={handleChange}
            className="form-field"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            name="assessmentStartDate"
            label="Assessment Start Date"
            type="date"
            InputLabelProps={{ shrink: true }}
            fullWidth
            required
            value={formData.assessmentStartDate}
            onChange={handleChange}
            className="form-field"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            name="assessmentDuration"
            label="Assessment Duration"
            type="number"
            fullWidth
            required
            value={formData.assessmentDuration}
            onChange={handleChange}
            className="form-field"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            name="assessmentEndDate"
            label="Assessment End Date"
            type="date"
            InputLabelProps={{ shrink: true }}
            fullWidth
            required
            value={formData.assessmentEndDate}
            onChange={handleChange}
            disabled
            className="form-field"
          />
        </Grid>
      </Grid>
      <Box mt={3} display="flex" justifyContent="space-between">
        <Button type="submit" variant="contained" color="primary">
          Submit
        </Button>
        <Button variant="contained" color="secondary" onClick={handleCancel}>
          Cancel
        </Button>
      </Box>
    </Box>
  );
};

export default AssessmentCycle;
