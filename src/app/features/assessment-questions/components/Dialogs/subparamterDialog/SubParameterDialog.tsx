import React from 'react';
import { Dialog, DialogTitle, TextField, Button, Box, Typography, IconButton } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { Parameter, SubParameter, ErrorState } from '../../types/Types';
import './SubParameterDialog.css';

interface SubParameterDialogProps {
  open: boolean;
  selectedParameter: Parameter | null;
  subParameterData: SubParameter;
  errors: ErrorState;
  handleClose: () => void;
  handleSubmit: (event: React.FormEvent) => void;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleEditSubParameter: (subParameter: SubParameter) => void;
  handleDeleteSubParameter: (subParameterId: string) => void;
}

const SubParameterDialog: React.FC<SubParameterDialogProps> = ({
  open,
  selectedParameter,
  subParameterData,
  errors,
  handleClose,
  handleSubmit,
  handleChange,
  handleEditSubParameter,
  handleDeleteSubParameter,
}) => (
  <Dialog open={open} onClose={handleClose}>
    <DialogTitle className="dialog-title">Sub-parameters for {selectedParameter?.parameter}</DialogTitle>
    <Box className="form-container-subparameter" component="form" onSubmit={handleSubmit}>
      <TextField
        className="custom-text-field"
        label="Sub-parameter Name"
        name="name"
        value={subParameterData.name}
        onChange={handleChange}
        error={Boolean(errors.subParameterName)}
        helperText={errors.subParameterName}
        variant="standard"
        fullWidth
      />
      <Box className="button-container">
        <Button type="submit" variant="contained" color="primary">
          {subParameterData._id ? 'Update' : 'Add'}
        </Button>
        <Button onClick={handleClose} variant="contained">
          Cancel
        </Button>
      </Box>
    </Box>
    {selectedParameter?.subParameters?.map((subParameter) => (
      <Box key={subParameter._id} className="sub-parameter-container">
        <Typography variant="body1" className="sub-parameter-name">{subParameter.name}</Typography>
        <Box className="icon-buttons">
          <IconButton className="blue-icon-button" onClick={() => handleEditSubParameter(subParameter)}>
            <EditIcon />
          </IconButton>
          <IconButton className="blue-icon-button" onClick={() => handleDeleteSubParameter(subParameter._id)}>
            <DeleteIcon />
          </IconButton>
        </Box>
      </Box>
    ))}
  </Dialog>
);

export default SubParameterDialog;
