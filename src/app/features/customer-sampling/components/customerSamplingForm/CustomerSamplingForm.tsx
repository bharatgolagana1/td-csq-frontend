import React, { ChangeEvent } from 'react';
import { TextField, Button, Box, Select, MenuItem, FormControl, InputLabel, SelectChangeEvent } from '@mui/material';
import './CustomerForm.css'

interface Customer {
  _id?: string;
  customerType: string;
  customerName: string;
  email: string;
  sampledDate?: string; // Added sampledDate field
  selectBox?: boolean;
}

interface CustomerSamplingFormProps {
  isEdit: boolean;
  formData: Customer;
  handleChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => void;
  handleSubmit: (event: React.FormEvent) => void;
  handleClose: () => void;
  formErrors: { [key: string]: string };
}

const CustomerSamplingForm: React.FC<CustomerSamplingFormProps> = ({
  isEdit,
  formData,
  handleChange,
  handleSubmit,
  handleClose,
  formErrors,
}) => (
  <Box className="form-container-sampling" component="form" onSubmit={handleSubmit}>
    <FormControl fullWidth margin="normal" error={!!formErrors.customerType}>
      <InputLabel>Customer Type</InputLabel>
      <Select
        label="Customer Type"
        name="customerType"
        value={formData.customerType}
        onChange={(event) => handleChange(event as SelectChangeEvent<string>)}
      >
        <MenuItem value="Freight Forwarder">Freight Forwarder</MenuItem>
        <MenuItem value="Customs Broker">Customs Broker</MenuItem>
      </Select>
    </FormControl>
    <TextField
      label="Customer Name"
      name="customerName"
      value={formData.customerName}
      onChange={handleChange}
      error={!!formErrors.customerName}
      helperText={formErrors.customerName}
      fullWidth
      margin="normal"
      disabled={isEdit}
    />
    <TextField
      label="Email"
      name="email"
      value={formData.email}
      onChange={handleChange}
      error={!!formErrors.email}
      helperText={formErrors.email}
      fullWidth
      margin="normal"
    />
    <TextField
      label="Sampled Date"
      name="sampledDate"
      type="date"
      value={formData.sampledDate || ''}
      onChange={handleChange}
      error={!!formErrors.sampledDate}
      helperText={formErrors.sampledDate}
      fullWidth
      margin="normal"
      InputLabelProps={{
        shrink: true,
      }}
    />
    <Box className="button-container">
      <Button type="submit" variant="contained" color="primary">
        {isEdit ? 'Update' : 'Add'}
      </Button>
      <Button onClick={handleClose} variant="contained">
        Cancel
      </Button>
    </Box>
  </Box>
);

export default CustomerSamplingForm;
