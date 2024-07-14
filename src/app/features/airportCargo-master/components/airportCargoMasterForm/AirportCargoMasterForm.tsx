import React from 'react';
import { Box, Button, TextField } from '@mui/material';
import { AirportCargo } from '../../api/AirportCargoMasterAPI';
import './AirportCargoMasterForm.css';

interface AirportCargoFormProps {
  formData: AirportCargo;
  isEdit: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (event: React.FormEvent, formData: AirportCargo, isEdit: boolean) => void;
  onClose: () => void;
}

const AirportCargoForm: React.FC<AirportCargoFormProps> = ({ formData, isEdit, onChange, onSubmit, onClose }) => {
  return (
    <Box
      component="form"
      noValidate
      autoComplete="off"
      onSubmit={(e) => onSubmit(e, formData, isEdit)}
      className="form-container-cargo"
    >
      <TextField
        className='custom-text-field-cargo'
        id="acoCode-basic"
        label="ACO Code"
        variant="standard"
        name="acoCode"
        value={formData.acoCode}
        onChange={onChange}
        required
        fullWidth
        margin="normal"
      />
      <TextField
        className='custom-text-field-cargo'
        id="acoName-basic"
        label="ACO Name"
        variant="standard"
        name="acoName"
        value={formData.acoName}
        onChange={onChange}
        required
        fullWidth
        margin="normal"
      />
      <TextField
        className='custom-text-field-cargo'
        id="acoAddress-basic"
        label="ACO Address"
        variant="standard"
        name="acoAddress"
        value={formData.acoAddress}
        onChange={onChange}
        required
        fullWidth
        margin="normal"
      />
      <TextField
        className='custom-text-field-cargo'
        id="airportCode-basic"
        label="Airport Code"
        variant="standard"
        name="airportCode"
        value={formData.airportCode}
        onChange={onChange}
        required
        fullWidth
        margin="normal"
      />
      <TextField
        className='custom-text-field-cargo'
        id="pincode-basic"
        label="Pincode"
        variant="standard"
        name="pincode"
        value={formData.pincode}
        onChange={onChange}
        required
        fullWidth
        margin="normal"
      />
      <TextField
        className='custom-text-field-cargo'
        id="emailId-basic"
        label="Email Id"
        variant="standard"
        name="emailId"
        value={formData.emailId}
        onChange={onChange}
        required
        fullWidth
        margin="normal"
      />
      <TextField
        className='custom-text-field-cargo'
        id="mobileNumber-basic"
        label="Mobile Number"
        variant="standard"
        name="mobileNumber"
        value={formData.mobileNumber}
        onChange={onChange}
        required
        fullWidth
        margin="normal"
      />
      <div className='button-container'>
        <Button type="submit" variant="contained" color="primary">
          {isEdit ? 'Update' : 'Submit'}
        </Button>
        <Button color="secondary" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </Box>
  );
};

export default AirportCargoForm;
