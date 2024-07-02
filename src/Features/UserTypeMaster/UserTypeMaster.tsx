import React, { useState, useEffect } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import Typography from '@mui/material/Typography';
import axios from 'axios';
import { API_URL } from '../UserTypeMaster/API/UserTypeMasterAPI';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import TableCell from '@mui/material/TableCell';
import TextField from '@mui/material/TextField';
import './UserTypeMaster.css';

interface UserType {
  id: number;
  userType: string;
  accFlag: string;
}

export default function UserTypeMaster() {
  const [rows, setRows] = useState<UserType[]>([]);
  const [open, setOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [formData, setFormData] = useState<UserType>({ id: 0, userType: '', accFlag: '' });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  useEffect(() => {
    fetchUserTypes();
  }, []);

  const fetchUserTypes = async () => {
    try {
      const response = await axios.get<UserType[]>(API_URL);
      setRows(response.data);
    } catch (error) {
      console.error('Error fetching user types:', error);
    }
  };

  const handleAdd = () => {
    setFormData({ id: 0, userType: '', accFlag: '' });
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

  const handleDeleteDialogOpen = (id: number) => {
    setDeleteId(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (deleteId !== null) {
      try {
        await axios.delete(`${API_URL}/${deleteId}`);
        setRows(rows.filter(row => row.id !== deleteId));
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
        await axios.put(`${API_URL}/${formData.id}`, formData);
        setRows(rows.map(row => (row.id === formData.id ? formData : row)));
      } else {
        const response = await axios.post<UserType>(API_URL, formData);
        setRows([...rows, response.data]);
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
    <div>
      <h2 className='user'>User Type Master</h2>
      <div className='action-buttons'>
        <Button variant="contained" className='add-user-button' startIcon={<AddIcon />} onClick={handleAdd}>
          Add User
        </Button>
      </div>
      <Modal open={open} onClose={handleClose} aria-labelledby="form-modal-title" aria-describedby="form-modal-description">
        <Box className='form-container'>
          <Typography variant="h6" className='MuiDialog-paper' id="form-modal-title">{isEdit ? 'Edit User' : 'Add User'}</Typography>
          <Box component="form" noValidate autoComplete="off" onSubmit={handleSubmit}>
            <TextField
              id="id-basic"
              label="ID"
              variant="standard"
              name="id"
              value={formData.id}
              onChange={handleChange}
              required
              fullWidth
              margin="normal"
              disabled={isEdit}
              className='custom-text-field'
            />
            <TextField
              id="userType-basic"
              label="User Type"
              variant="standard"
              name="userType"
              value={formData.userType}
              onChange={handleChange}
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
              onChange={handleChange}
              required
              fullWidth
              margin="normal"
              className='custom-text-field'
            />
            <div className='button-container'>
              <Button type="submit" variant="contained" color="primary">
                {isEdit ? 'Update' : 'Submit'}
              </Button>
              <Button color="secondary" onClick={handleClose}>
                Cancel
              </Button>
            </div>
          </Box>
        </Box>
      </Modal>
      <Modal open={deleteDialogOpen} onClose={handleDeleteDialogClose}>
        <Box className='delete-dialog-container'>
          <Typography variant="h6">Are you sure you want to delete this item?</Typography>
          <div className='button-container'>
            <Button variant="contained" color="secondary" onClick={handleDelete}>
              Delete
            </Button>
            <Button variant="contained" onClick={handleDeleteDialogClose}>
              Back
            </Button>
          </div>
        </Box>
      </Modal>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell className='table-head-cell'>ID</TableCell>
              <TableCell className='table-head-cell'>User Type</TableCell>
              <TableCell className='table-head-cell'>Acc Flag</TableCell>
              <TableCell className='table-head-cell'>Edit</TableCell>
              <TableCell className='table-head-cell'>Delete</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id} className='styled-table-row'>
                <TableCell className='table-cell'>{row.id}</TableCell>
                <TableCell className='table-cell'>{row.userType}</TableCell>
                <TableCell className='table-cell'>{row.accFlag}</TableCell>
                <TableCell className='table-cell'>
                  <Button className='blue-icon-button' onClick={() => handleEdit(row)}>
                    <EditIcon />
                  </Button>
                </TableCell>
                <TableCell className='table-cell'>
                  <Button className='blue-icon-button' onClick={() => handleDeleteDialogOpen(row.id)}>
                    <DeleteIcon />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}
