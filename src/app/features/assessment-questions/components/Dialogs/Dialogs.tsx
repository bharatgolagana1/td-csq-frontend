import React from 'react';
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button, Box, Typography, TextField } from '@mui/material';
import { Parameter, ErrorState } from '../types/Types';
import '../AssessmentQuestions/AssessmentQuestions.css';

interface AddEditParameterDialogProps {
  open: boolean;
  isEdit: boolean;
  formData: Parameter;
  errors: ErrorState;
  handleClose: () => void;
  handleSubmit: (event: React.FormEvent) => void;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const AddEditParameterDialog: React.FC<AddEditParameterDialogProps> = ({ open, isEdit, formData, errors, handleClose, handleSubmit, handleChange }) => (
  <Dialog open={open} onClose={handleClose}>
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
  </Dialog>
);

interface DeleteDialogProps {
  open: boolean;
  handleClose: () => void;
  handleDelete: () => void;
}

export const DeleteDialog: React.FC<DeleteDialogProps> = ({ open, handleClose, handleDelete }) => (
  <Dialog open={open} onClose={handleClose}>
    <DialogTitle>Confirm Delete</DialogTitle>
    <DialogContent>
      <DialogContentText>Are you sure you want to delete this parameter?</DialogContentText>
    </DialogContent>
    <DialogActions>
      <Button onClick={handleClose} color="primary">
        Cancel
      </Button>
      <Button onClick={handleDelete} color="secondary">
        Delete
      </Button>
    </DialogActions>
  </Dialog>
);
