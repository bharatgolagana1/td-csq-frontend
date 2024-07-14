import React from 'react';
import { Box, Typography, TextField, Button, Modal } from '@mui/material';
import { Parameter, ErrorState } from '../types/Types';
import '../AssessmentQuestions/AssessmentQuestions.css';

interface ParameterFormProps {
  open: boolean;
  isEdit: boolean;
  formData: Parameter;
  errors: ErrorState;
  handleClose: () => void;
  handleSubmit: (event: React.FormEvent) => void;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ParameterForm: React.FC<ParameterFormProps> = ({ open, isEdit, formData, errors, handleClose, handleSubmit, handleChange }) => {
  return (
    <Modal open={open} onClose={handleClose}>
      <Box className="form-container" component="form" onSubmit={handleSubmit}>
        <Typography variant="h6" gutterBottom>
          {isEdit ? 'Edit Parameter' : 'Add Parameter'}
        </Typography>
        <TextField
          className="custom-text-field"
          label="Category"
          name="category"
          value={formData.category}
          onChange={handleChange}
          error={Boolean(errors.category)}
          helperText={errors.category}
          variant="standard"
          fullWidth
        />
        <TextField
          className="custom-text-field"
          label="Sub-Category"
          name="subCategory"
          value={formData.subCategory}
          onChange={handleChange}
          error={Boolean(errors.subCategory)}
          helperText={errors.subCategory}
          variant="standard"
          fullWidth
        />
        <TextField
          className="custom-text-field"
          label="Parameter"
          name="parameter"
          value={formData.parameter}
          onChange={handleChange}
          error={Boolean(errors.parameter)}
          helperText={errors.parameter}
          variant="standard"
          fullWidth
        />
        <TextField
          className="custom-text-field"
          label="Frequency"
          name="frequency"
          value={formData.frequency}
          onChange={handleChange}
          error={Boolean(errors.frequency)}
          helperText={errors.frequency}
          variant="standard"
          fullWidth
        />
        <TextField
          className="custom-text-field"
          label="Weightage"
          name="weightage"
          type="number"
          value={formData.weightage}
          onChange={handleChange}
          error={Boolean(errors.weightage)}
          helperText={errors.weightage}
          variant="standard"
          fullWidth
        />
        <Box className="button-container">
          <Button type="submit" variant="contained" color="primary">
            {isEdit ? 'Update' : 'Submit'}
          </Button>
          <Button onClick={handleClose} variant="contained">
            Cancel
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default ParameterForm;
