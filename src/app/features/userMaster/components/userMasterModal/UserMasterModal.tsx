import React, { useState, useEffect } from 'react';
import { Modal, Box, Typography, IconButton, Button, TextField } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import { User } from '../types';
import { updateUser } from '../../api/UserMasterAPI';
import './UserMasterModal.css';

interface Props {
  open: boolean;
  onClose: () => void;
  user: User | null;
  isEditMode: boolean;
  setIsEditMode: (editMode: boolean) => void;
  fetchUsers: () => void;
}

const UserModal: React.FC<Props> = ({ open, onClose, user, isEditMode, setIsEditMode, fetchUsers }) => {
  const [editableData, setEditableData] = useState<Partial<User>>(user || {});
  useEffect(() => {
    if (user) {
      setEditableData(user);
    }
  }, [user]);

  const handleInputChange = (field: keyof User, value: any) => {
    setEditableData((prevData) => ({
      ...prevData,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (user && editableData) {
      try {
        const updatedUser: User = {
          ...user,
          ...editableData,
        };
        await updateUser(updatedUser._id, updatedUser);
        fetchUsers();
        setIsEditMode(false);
        onClose();
      } catch (error) {
        console.error('Failed to update user', error);
      }
    }
  };
  

  return (
    <Modal open={open} onClose={onClose}>
      <Box className="user-modal-box">
        {user && (
          <>
            <Typography variant="h6" component="h2" className="user-modal-title">
              User Details
              <Box className="user-title-actions">
                {isEditMode ? (
                  <IconButton onClick={onClose} className="user-close-button">
                    <CloseIcon />
                  </IconButton>
                ) : (
                  <>
                    <IconButton onClick={() => setIsEditMode(true)} className="user-edit-button">
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={onClose} className="user-close-button">
                      <CloseIcon />
                    </IconButton>
                  </>
                )}
              </Box>
            </Typography>
            <Box className="user-modal-content">
              {isEditMode ? (
                <>
                  <TextField
                    label="User Type"
                    value={editableData.userType || ''}
                    onChange={(e) => handleInputChange('userType', e.target.value)}
                    fullWidth
                    className="user-input-field"
                    variant="standard"
                  />
                  <TextField
                    label="User Name"
                    value={editableData.userName || ''}
                    onChange={(e) => handleInputChange('userName', e.target.value)}
                    fullWidth
                    className="user-input-field"
                    variant="standard"
                  />
                  <TextField
                    label="Email"
                    value={editableData.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    fullWidth
                    className="user-input-field"
                    variant="standard"
                  />
                  <TextField
                    label="Mobile No"
                    value={editableData.mobileNo || ''}
                    onChange={(e) => handleInputChange('mobileNo', e.target.value)}
                    fullWidth
                    className="user-input-field"
                    variant="standard"
                  />
                  <TextField
                    label="Office Name"
                    value={editableData.officeName || ''}
                    onChange={(e) => handleInputChange('officeName', e.target.value)}
                    fullWidth
                    className="user-input-field"
                    variant="standard"
                  />
                  <TextField
                    label="Office Address"
                    value={editableData.officeAddress || ''}
                    onChange={(e) => handleInputChange('officeAddress', e.target.value)}
                    fullWidth
                    className="user-input-field"
                    variant="standard"
                  />
                  <TextField
                    label="City"
                    value={editableData.city || ''}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    fullWidth
                    className="user-input-field"
                    variant="standard"
                  />
                  <TextField
                    label="Country"
                    value={editableData.country || ''}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    fullWidth
                    className="user-input-field"
                    variant="standard"
                  />
                  <Box className="user-action-buttons">
                    <Button variant="contained" color="primary" onClick={handleSave} className="user-save-button">
                      Save
                    </Button>
                    <Button variant="contained" color="secondary" onClick={onClose} className="user-close-button">
                      Close
                    </Button>
                  </Box>
                </>
              ) : (
                <>
                  <Typography className="user-detail-text">User Type: {user.userType}</Typography>
                  <Typography className="user-detail-text">User Name: {user.userName}</Typography>
                  <Typography className="user-detail-text">Email: {user.email}</Typography>
                  <Typography className="user-detail-text">Mobile No: {user.mobileNo}</Typography>
                  <Typography className="user-detail-text">Office Name: {user.officeName}</Typography>
                  <Typography className="user-detail-text">Office Address: {user.officeAddress}</Typography>
                  <Typography className="user-detail-text">City: {user.city}</Typography>
                  <Typography className="user-detail-text">Country: {user.country}</Typography>
                </>
              )}
            </Box>
          </>
        )}
      </Box>
    </Modal>
  );
};

export default UserModal;
