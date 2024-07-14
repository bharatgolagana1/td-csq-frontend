import React from 'react';
import { Box, Button, TextField, Typography } from '@mui/material';
import { UserType } from '../../api/UserTypeMasterAPI';
import './UserTypeMasterForm.css'

interface UserTypeMasterFormProps {
  formData: UserType;
  isEdit: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

const UserTypeMasterForm: React.FC<UserTypeMasterFormProps> = ({ formData, isEdit, onChange, onSubmit, onClose }) => {
  return (
    <Box className='form-container-user small-form-container'>
      <Typography variant="h6" id="form-modal-title">{isEdit ? 'Edit User' : 'Add User'}</Typography>
      <Box component="form" noValidate autoComplete="off" onSubmit={onSubmit}>
        {isEdit && (
          <TextField
            id="id-basic"
            label="ID"
            variant="standard"
            name="_id"
            value={formData._id}
            onChange={onChange}
            required
            fullWidth
            margin="normal"
            disabled
            className='custom-text-field'
          />
        )}
        <TextField
          id="userType-basic"
          label="User Type"
          variant="standard"
          name="userType"
          value={formData.userType}
          onChange={onChange}
          required
          fullWidth
          margin="normal"
          className='custom-text-field'
        />
        <TextField
          id="accFlag-basic"
          label="Acc Flag"
          variant="standard"
          name="accFlag"
          value={formData.accFlag}
          onChange={onChange}
          required
          fullWidth
          margin="normal"
          className='custom-text-field'
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
    </Box>
  );
};

export default UserTypeMasterForm;
