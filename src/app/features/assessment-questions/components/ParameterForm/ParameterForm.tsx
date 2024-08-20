import React from 'react';
import { Box, Typography, TextField, Button, Modal } from '@mui/material';
import { Parameter, ErrorState } from '../types/Types';
import './ParameterForm.css';

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
      <Box className="parameter-form-container" component="form" onSubmit={handleSubmit}>
        <Typography variant="h6" gutterBottom>
          {isEdit ? 'Edit Parameter' : 'Add Parameter'}
        </Typography>
        <TextField
          label="Category"
          margin="dense"
          name="category"
          value={formData.category}
          onChange={handleChange}
          error={Boolean(errors.category)}
          helperText={errors.category}
          fullWidth
          className="custom-textfield"
        />
        <TextField
          label="Sub-Category"
          margin="dense"
          name="subCategory"
          value={formData.subCategory}
          onChange={handleChange}
          error={Boolean(errors.subCategory)}
          helperText={errors.subCategory}
          fullWidth
          className="custom-textfield"
        />
        <TextField
          label="Parameter"
          margin="dense"
          name="parameter"
          value={formData.parameter}
          onChange={handleChange}
          error={Boolean(errors.parameter)}
          helperText={errors.parameter}
          fullWidth
          className="custom-textfield"
        />
        <TextField
          label="Frequency"
          name="frequency"
          margin="dense"
          value={formData.frequency}
          onChange={handleChange}
          error={Boolean(errors.frequency)}
          helperText={errors.frequency}
          fullWidth
          className="custom-textfield"
        />
        <TextField
          label="Weightage"
          margin="dense"
          name="weightage"
          type="number"
          value={formData.weightage}
          onChange={handleChange}
          error={Boolean(errors.weightage)}
          helperText={errors.weightage}
          fullWidth
          className="custom-textfield"
        />
        <Box className="button-container-parameter">
          <Button type="submit" variant="contained" color="primary" className="submit-button">
            {isEdit ? 'Update' : 'Submit'}
          </Button>
          <Button onClick={handleClose} variant="contained" className="cancel-button">
            Cancel
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default ParameterForm;
