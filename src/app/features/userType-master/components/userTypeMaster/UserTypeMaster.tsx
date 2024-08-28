import React, { useState, useEffect, ChangeEvent } from 'react';
import { Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import UserTypeMasterTable from '../userTypeMasterTable/UserTypeMasterTable';
import UserTypeMasterForm from '../userTypeMasterForm/UserTypeMasterForm';
import DeleteDialog from '../../../../shared/components/DeleteDialog/DeleteDialog';
import ModalContainer from '../../../../shared/components/ModalContainer';
import SearchBar from '../userTableControls/SearchBarComponent';
import { UserMaster, fetchUserMasters, addUserMaster, updateUserMaster, deleteUserMaster } from '../../api/UserTypeMasterAPI';
import './UserTypeMaster.css';

const UserTypeMaster: React.FC = () => {
  const [rows, setRows] = useState<UserMaster[]>([]);
  const [open, setOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [formData, setFormData] = useState<UserMaster>({ _id: '', id: 0, userType: '', accFlag: '' });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadUserTypes();
  }, []);

  const loadUserTypes = async () => {
    try {
      const data = await fetchUserMasters();
      setRows(data);
    } catch (error) {
      console.error('Error fetching user types:', error);
    }
  };

  const handleAdd = () => {
    setFormData({ _id: '', userType: '', accFlag: '' });
    setIsEdit(false);
    setOpen(true);
  };

  const handleEdit = (userType: UserMaster) => {
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
        await deleteUserMaster(deleteId);
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
        await updateUserMaster(formData);
        setRows(rows.map(row => (row._id === formData._id ? formData : row)));
      } else {
        const newUserType = await addUserMaster({
          userType: formData.userType,
          accFlag: formData.accFlag
        });
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

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setPage(0);
  };

  const filteredRows = rows.filter(row =>
    row.userType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const paginatedRows = filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <div className='userType'>
      <div className='header'>
        <h2 className='user'>User Type Master</h2>
        <Button variant="contained" className='add-user-button' startIcon={<AddIcon />} onClick={handleAdd}>
          Add User
        </Button>
      </div>
      <div className="search-bar">
         <SearchBar searchQuery={searchQuery} handleSearch={handleSearch}/>
      </div>
      <UserTypeMasterTable
        rows={paginatedRows}
        onEdit={handleEdit}
        onDelete={handleDeleteDialogOpen}
        page={page}
        rowsPerPage={rowsPerPage}
        handleChangePage={handleChangePage}
        handleChangeRowsPerPage={handleChangeRowsPerPage}
        totalRows={filteredRows.length}
      />
      <ModalContainer open={open} onClose={handleClose}>
        <UserTypeMasterForm formData={formData} isEdit={isEdit} onChange={handleChange} onSubmit={handleSubmit} onClose={handleClose} />
      </ModalContainer>
      <ModalContainer open={deleteDialogOpen} onClose={handleDeleteDialogClose}>
        <DeleteDialog open={deleteDialogOpen} onClose={handleDeleteDialogClose} onDelete={handleDelete} />
      </ModalContainer>
    </div>
  );
};

export default UserTypeMaster;
