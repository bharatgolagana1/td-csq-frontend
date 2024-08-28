import React from 'react';
import {
  Box,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  SelectChangeEvent,
} from '@mui/material';

interface Customer {
  _id?: string;
  customerType: string;
  customerName: string;
  email: string;
  sampledDate?: string; // Added sampledDate field
  selectBox?: boolean;
}

interface ModalContainerProps {
  formData: Customer;
  formErrors: { [key: string]: string };
  handleChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => void;
  handleSubmit: (event: React.FormEvent) => void;
  handleClose: () => void;
}

const ModalContainer: React.FC<ModalContainerProps> = ({
  formData,
  formErrors,
  handleChange,
  handleSubmit,
  handleClose,
}) => {
  return (
    <Box sx={{ padding: 2 }}>
      <Typography variant="h6" gutterBottom>
        Edit Customer
      </Typography>
      <Box component="form" noValidate autoComplete="off" onSubmit={handleSubmit}>
        <FormControl variant="outlined" fullWidth margin="normal">
          <InputLabel>Customer Type</InputLabel>
          <Select
            label="Customer Type"
            name="customerType"
            value={formData.customerType}
            onChange={handleChange}
            error={!!formErrors.customerType}
            required
          >
            <MenuItem value="Freight Forwarder">Freight Forwarder</MenuItem>
            <MenuItem value="Customs Broker">Customs Broker</MenuItem>
          </Select>
          {formErrors.customerType && <Typography color="error">{formErrors.customerType}</Typography>}
        </FormControl>
        
        <TextField
          label="Customer Name"
          variant="outlined"
          name="customerName"
          value={formData.customerName}
          onChange={handleChange}
          error={!!formErrors.customerName}
          required
          fullWidth
          margin="normal"
          disabled
          helperText={formErrors.customerName}
        />
        
        <TextField
          label="Email"
          variant="outlined"
          name="email"
          value={formData.email}
          onChange={handleChange}
          error={!!formErrors.email}
          required
          fullWidth
          margin="normal"
          helperText={formErrors.email}
        />
        
        <TextField
          label="Sampled Date"
          variant="outlined"
          name="sampledDate"
          type="date"
          value={formData.sampledDate || ''}
          onChange={handleChange}
          error={!!formErrors.sampledDate}
          fullWidth
          margin="normal"
          InputLabelProps={{
            shrink: true,
          }}
          helperText={formErrors.sampledDate}
        />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
          <Button type="submit" variant="contained" color="primary">
            Update
          </Button>
          <Button variant="outlined" color="secondary" onClick={handleClose}>
            Cancel
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default ModalContainer;
