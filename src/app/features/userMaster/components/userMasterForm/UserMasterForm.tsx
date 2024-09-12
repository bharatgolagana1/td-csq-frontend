import React, { useState } from 'react';
import { Grid, TextField, Button } from '@mui/material';
import { NewUser, User } from '../types';
import './UserMasterForm.css';
import { addUser } from '../../api/UserMasterAPI';
import AddIcon from '@mui/icons-material/Add'; 
import AlertSnackbar from '../userMasterHelpers/UserAlertSnackBar';

const UserMasterForm = () => {
  const [formData, setFormData] = useState<NewUser>({
    userid: '',
    userType: '',
    userName: '',
    email: '',
    mobileNo: '',
    officeName: '',
    officeAddress: '',
    city: '',
    country: ''
  });

  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState<'success' | 'error'>('success');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'mobileNo') {
      // Allow only digits and ensure length is up to 10
      if (/^\d*$/.test(value) && value.length <= 10) {
        setFormData({
          ...formData,
          [name]: value
        });
      }
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addUser(formData as User);
      setAlertMessage('User added successfully!');
      setAlertSeverity('success');
      setAlertOpen(true);

      setFormData({
        userid: '',
        userType: '',
        userName: '',
        email: '',
        mobileNo: '',
        officeName: '',
        officeAddress: '',
        city: '',
        country: ''
      });
    } catch (error) {
      console.error('Error saving user:', error);

      setAlertMessage('Error adding user.');
      setAlertSeverity('error');
      setAlertOpen(true);
    }
  };

  const isFormValid = () => {
    // Check if all required fields are filled
    return Object.values(formData).every(value => value.trim() !== '');
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="add-user">
        <div className="form-header">
          <h3>Add User</h3>
          <Button
            startIcon={<AddIcon/>}
          >
            Bulk Upload
          </Button>
        </div>
        <Grid container spacing={2} className='layout-main'>
          <Grid item xs={12} sm={4}>
            <TextField 
              name="userid" 
              label="User ID" 
              type="text" 
              value={formData.userid}
              onChange={handleInputChange} 
              fullWidth 
              required 
              margin="dense"
              size="small"
              className="text-field-gap"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField 
              name="userType" 
              label="User Type" 
              value={formData.userType} 
              onChange={handleInputChange} 
              fullWidth 
              required 
              margin="dense"
              size="small"
              className="text-field-gap"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField 
              name="userName" 
              label="User Name" 
              value={formData.userName} 
              onChange={handleInputChange} 
              fullWidth 
              required 
              margin="dense"
              size="small"
              className="text-field-gap"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField 
              name="email" 
              label="Email" 
              value={formData.email} 
              onChange={handleInputChange} 
              fullWidth 
              required 
              margin="dense"
              size="small"
              className="text-field-gap"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField 
              name="mobileNo" 
              label="Mobile No" 
              type="text" 
              value={formData.mobileNo} 
              onChange={handleInputChange} 
              fullWidth 
              required 
              margin="dense"
              size="small"
              inputProps={{ pattern: "[0-9]*", maxLength: 10 }}
              className="text-field-gap"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField 
              name="officeName" 
              label="Office Name" 
              value={formData.officeName} 
              onChange={handleInputChange} 
              fullWidth 
              required 
              margin="dense"
              size="small"
              className="text-field-gap"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField 
              name="officeAddress" 
              label="Office Address" 
              value={formData.officeAddress} 
              onChange={handleInputChange} 
              fullWidth 
              required
              margin="dense"
              size="small"
              className="text-field-gap"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField 
              name="city" 
              label="City" 
              value={formData.city} 
              onChange={handleInputChange} 
              fullWidth 
              required 
              margin="dense"
              size="small"
              className="text-field-gap"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField 
              name="country" 
              label="Country" 
              value={formData.country} 
              onChange={handleInputChange} 
              fullWidth 
              required 
              margin="dense"
              size="small"
              className="text-field-gap"
            />
          </Grid>
          <Grid item xs={4} className="submit-button">
            <Button 
              type="submit" 
              variant="contained" 
              color="primary" 
              fullWidth
              disabled={!isFormValid()}
            >
              Add Customer
            </Button>
          </Grid>
        </Grid>
      </form>

      <AlertSnackbar 
        open={alertOpen}
        message={alertMessage}
        severity={alertSeverity}
        onClose={() => setAlertOpen(false)}
      />
    </>
  );
};

export default UserMasterForm;
