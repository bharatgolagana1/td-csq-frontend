import React from 'react';
import { Button, TextField, Grid } from '@mui/material';
import './CustomerSamplingForm.css';

interface Customer {
  _id: string;
  customerType: string;
  customerName: string;
  email: string;
  sampledDate: string | null;
}

interface CustomerSamplingFormProps {
  isEdit: boolean;
  formData: Customer;
  handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  handleClose: () => void;
  formErrors: Record<string, string>;
}

const CustomerSamplingForm: React.FC<CustomerSamplingFormProps> = ({
  isEdit,
  formData,
  handleChange,
  handleSubmit,
  handleClose,
  formErrors,
}) => {

  return (
    <form onSubmit={handleSubmit} className="customer-sampling-form">
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            label="Customer Type"
            name="customerType"
            value={formData.customerType}
            onChange={handleChange}
            fullWidth
            required
            error={!!formErrors.customerType}
            helperText={formErrors.customerType}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="Customer Name"
            name="customerName"
            value={formData.customerName}
            onChange={handleChange}
            fullWidth
            required
            error={!!formErrors.customerName}
            helperText={formErrors.customerName}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="Email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            fullWidth
            required
            error={!!formErrors.email}
            helperText={formErrors.email}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="Sampled Date"
            name="sampledDate"
            value={formData.sampledDate || ''}
            onChange={handleChange}
            fullWidth
            error={!!formErrors.sampledDate}
            helperText={formErrors.sampledDate}
            placeholder="Enter date or leave empty for 'N/A'"
          />
        </Grid>
        <Grid item xs={12} className="form-buttons">
          <Button type="submit" color="primary" variant="contained">
            {isEdit ? 'Update' : 'Add'}
          </Button>
          <Button onClick={handleClose} color="secondary" variant="contained">
            Cancel
          </Button>
        </Grid>
      </Grid>
    </form>
  );
};

export default CustomerSamplingForm;
