import React, { useState, useEffect } from 'react';
import { Button, TextField, Grid, Typography, Select, MenuItem, FormControl, InputLabel, Alert, SelectChangeEvent } from '@mui/material';
import { addCustomer } from '../../api/CustomerSamplingAPI';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import './CustomerSamplingForm.css';

interface Customer {
  customerType: string;
  customerName: string;
  email: string;
  sampledDate?: string;
}

const CustomerSamplingForm: React.FC = () => {
  const [customerData, setCustomerData] = useState<Customer>({
    customerType: '',
    customerName: '',
    email: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const { customerType, customerName, email } = customerData;
    setIsFormValid(!!customerType && !!customerName && !!email);
  }, [customerData]);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | { value: unknown; name?: string }> | SelectChangeEvent<string>
  ) => {
    const { name, value } = event.target;
    setCustomerData((prevState) => ({
      ...prevState,
      [name!]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    let errors: Record<string, string> = {};

    if (!customerData.customerName) errors.customerName = 'Customer Name is required';
    if (!customerData.email) errors.email = 'Email is required';
    if (!customerData.customerType) errors.customerType = 'Customer Type is required';

    setFormErrors(errors);

    if (Object.keys(errors).length === 0) {
        try {
            await addCustomer({ ...customerData, sampledDate: 'NA' });
            setAlertMessage({ type: 'success', message: 'Customer added successfully!' });
            setCustomerData({
                customerType: '',
                customerName: '',
                email: '',
            });

            setTimeout(() => {
                setAlertMessage(null);
            }, 3000);
        } catch (error) {
            setAlertMessage({ type: 'error', message: 'Error adding customer.' });

            setTimeout(() => {
                setAlertMessage(null);
            }, 3000);
        }
    }
};


  const handleBulUpload = () => {
    navigate('bulk-upload');
  }

  return (
    <div className="add-customer-page add-customer-container">
      <div className="add-customer-header">
        <Typography gutterBottom className="add-customer-title">
          Add Customer
        </Typography>
        <Button className="bulk-upload-button" startIcon={<AddIcon />} onClick={handleBulUpload}>
          Bulk Upload
        </Button>
      </div>
      {alertMessage && (
        <Alert severity={alertMessage.type} onClose={() => setAlertMessage(null)}>
          {alertMessage.message}
        </Alert>
      )}
      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Customer Name"
              name="customerName"
              value={customerData.customerName}
              onChange={handleChange}
              fullWidth
              required
              error={!!formErrors.customerName}
              helperText={formErrors.customerName}
              size="small"
              margin="dense"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Customer SPOC Email"
              name="email"
              value={customerData.email}
              onChange={handleChange}
              fullWidth
              required
              error={!!formErrors.email}
              helperText={formErrors.email}
              size="small"
              margin="dense"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="User Name"
              name="userName"
              value={customerData.email}
              fullWidth
              required
              helperText="same as customer SPOC Email"
              disabled
              size="small"
              margin="dense"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth required size="small" margin="dense" error={!!formErrors.customerType}>
              <InputLabel>Customer Type</InputLabel>
              <Select
                name="customerType"
                value={customerData.customerType}
                onChange={(e) => handleChange(e as React.ChangeEvent<{ value: unknown; name?: string }>)}
                size="small"
              >
                <MenuItem value=""><em>Select Customer Type</em></MenuItem>
                <MenuItem value="Forwader_1">Forwader_1</MenuItem>
                <MenuItem value="Customer Broker">Customer Broker</MenuItem>
              </Select>
              {formErrors.customerType && <p className="error-text">{formErrors.customerType}</p>}
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4} className="add-customer-buttons">
            <Button
              type="submit"
              variant="contained"
              className={`add-customer-submit-button ${isFormValid ? 'active' : ''}`}
              disabled={!isFormValid}
              size="small"
            >
              Add Customer
            </Button>
          </Grid>
        </Grid>
      </form>
    </div>
  );
};

export default CustomerSamplingForm;
