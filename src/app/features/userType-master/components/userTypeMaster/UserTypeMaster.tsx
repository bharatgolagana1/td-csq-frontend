import React, { useState, useEffect } from 'react';
import { Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import UserTypeMasterTable from '../userTypeMasterTable/UserTypeMasterTable';
import UserTypeMasterForm from '../userTypeMasterForm/UserTypeMasterForm';
import DeleteDialog from '../../../../shared/components/DeleteDialog/DeleteDialog';
import ModalContainer from '../../../../shared/components/ModalContainer';
import { UserType, fetchUserTypes, addUserType, updateUserType, deleteUserType } from '../../api/UserTypeMasterAPI';
import './UserTypeMaster.css';

const UserTypeMaster: React.FC = () => {
  const [rows, setRows] = useState<UserType[]>([]);
  const [open, setOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [formData, setFormData] = useState<UserType>({ _id: '', id: 0, userType: '', accFlag: '' });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    loadUserTypes();
  }, []);

  const loadUserTypes = async () => {
    try {
      const data = await fetchUserTypes();
      setRows(data);
    } catch (error) {
      console.error('Error fetching user types:', error);
    }
  };

  const handleAdd = () => {
    setFormData({ _id: '', id: 0, userType: '', accFlag: '' });
    setIsEdit(false);
    setOpen(true);
  };

  const handleEdit = (userType: UserType) => {
    setFormData(userType);
    setIsEdit(true);
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleDeleteDialogClose = () => setDeleteDialogOpen(false);

  const handleDeleteDialogOpen = (id: string) => {
    setDeleteId(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (deleteId !== null) {
      try {
        await deleteUserType(deleteId);
        setRows(rows.filter(row => row._id !== deleteId));
        setDeleteDialogOpen(false);
      } catch (error) {
        console.error('Error deleting user type:', error);
      }
    }
  };
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.userType || !formData.accFlag) {
      console.error('All fields are required.');
      return;
    }
    try {
      if (isEdit) {
        await updateUserType(formData);
        setRows(rows.map(row => (row._id === formData._id ? formData : row)));
      } else {
        console.log('Submitting new user type:', formData); // Log the data being sent
        const newUserType = await addUserType({
          userType: formData.userType,
          accFlag: formData.accFlag
        });
        console.log('Received new user type:', newUserType); // Log the response
        setRows([...rows, newUserType]);
      }
      setOpen(false);
    } catch (error) {
      console.error('Error adding/updating user type:', error);
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value,
    }));
  };

  return (
    <div className='userType'>
      <h2 className='user'>User Type Master</h2>
      <div className='action-buttons'>
        <Button variant="contained" className='add-user-button' startIcon={<AddIcon />} onClick={handleAdd}>
          Add User
        </Button>
      </div>
      <ModalContainer open={open} onClose={handleClose}>
        <UserTypeMasterForm formData={formData} isEdit={isEdit} onChange={handleChange} onSubmit={handleSubmit} onClose={handleClose} />
      </ModalContainer>
      <ModalContainer open={deleteDialogOpen} onClose={handleDeleteDialogClose}>
        <DeleteDialog open={deleteDialogOpen} onClose={handleDeleteDialogClose} onDelete={handleDelete} />
      </ModalContainer>
      <UserTypeMasterTable rows={rows} onEdit={handleEdit} onDelete={handleDeleteDialogOpen} />
    </div>
  );
};

export default UserTypeMaster;
