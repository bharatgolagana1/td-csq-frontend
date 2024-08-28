import React, { useState, ChangeEvent } from 'react';
import { TextField, Button, Box, Select, MenuItem, FormControl, InputLabel, SelectChangeEvent, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { addCustomer } from '../../api/CustomerSamplingAPI';
import { Customer } from '../types/Types';
import './CustomerForm.css'; // Import the updated CSS file

const CustomerSamplingFormPage: React.FC = () => {
  const [formData, setFormData] = useState<Customer>({
    _id: '',
    customerType: '',
    customerName: '',
    email: '',
    sampledDate: '',
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [showAlert, setShowAlert] = useState<boolean>(false); // State to control alert visibility
  const navigate = useNavigate();

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => {
    const { name, value } = event.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    if (!formData.customerType) {
      errors.customerType = 'Customer Type is required';
    }
    if (!formData.customerName) {
      errors.customerName = 'Customer Name is required';
    }
    if (!formData.email) {
      errors.email = 'Email is required';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const formDataToSend = {
      ...formData,
      _id: formData._id === '' ? undefined : formData._id,
      sampledDate: formData.sampledDate === '' ? undefined : formData.sampledDate,
    };
    if (formDataToSend.sampledDate === '') {
      delete formDataToSend.sampledDate; // Remove sampledDate if not provided
    }

    if (!validateForm()) {
      return;
    }

    await addCustomer(formDataToSend);
    setShowAlert(true); // Show the success alert
    setTimeout(() => {
      setShowAlert(false);
      navigate('/sampling');
    }, 3000); // Hide the alert and navigate after 3 seconds
  };

  return (
    <Box className="customer-form-wrapper" component="form" noValidate autoComplete="off" onSubmit={handleSubmit}>
      <div>
        <h5 className="customer-form-header">Add Customer</h5>
        <Box display="flex" justifyContent="flex-end" mt={2}>
        <Button className="customer-form-link" onClick={() => navigate('/customer-sampling')}>
          + Add Customers in Bulk
        </Button>
      </Box>
      </div>
      <Box display="flex" justifyContent="space-between" gap={2}>
        <TextField
          className="customer-form-input"
          label="Customer Name"
          name="customerName"
          value={formData.customerName}
          onChange={handleChange}
          fullWidth
          margin="normal"
          error={!!formErrors.customerName}
          helperText={formErrors.customerName}
        />
        <TextField
          className="customer-form-input"
          label="Customer SPOC Email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          fullWidth
          margin="normal"
          error={!!formErrors.email}
          helperText={formErrors.email}
        />
        <TextField
          className="customer-form-input"
          label="User Name"
          name="userName"
          value={formData.customerName}
          onChange={handleChange}
          fullWidth
          margin="normal"
          error={!!formErrors.customerName}
          helperText="Same as Email"
        />
      </Box>

      <Box display="flex" gap={2} alignItems="center">
  <FormControl className="customer-form-control-small" margin="normal">
    <InputLabel id="customer-type-label" className="customer-form-label">Customer Type</InputLabel>
    <Select
      labelId="customer-type-label"
      id="customerType"
      name="customerType"
      value={formData.customerType}
      onChange={handleChange}
      error={!!formErrors.customerType}
      className="customer-form-select-small"
      displayEmpty
    >
      <MenuItem value="" disabled className="customer-form-select-placeholder">Select Customer Type</MenuItem>
      <MenuItem value="Forwader">Forwader</MenuItem>
      <MenuItem value="Custom Broker">Custom Broker</MenuItem>
    </Select>
  </FormControl>

  <Button
    type="submit"
    className={`customer-form-button ${!formData.customerType || !formData.customerName || !formData.email ? 'customer-form-button-disabled' : ''}`}
    disabled={!formData.customerType || !formData.customerName || !formData.email}
  >
    Add Customer
  </Button>
</Box>


      {showAlert && (
        <Alert severity="success" style={{ marginTop: '16px' }}>
          Customer added for sampling.
        </Alert>
      )}
    </Box>
  );
};

export default CustomerSamplingFormPage;
