import React, { useState, useEffect } from 'react';
import { Button, TableContainer, Paper, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import { deleteCustomer, fetchCustomers } from '../../api/CustomerSamplingAPI';
import CustomerTable from '../customerTable/CustomerTable';
import PaginationComponent from '../CustomerSamplingControls/PaginationComponent';
import SearchBarComponent from '../CustomerSamplingControls/SearchBarComponent';
import './CustomerSampling.css';
import { useNavigate } from 'react-router-dom';
import { Customer } from '../types/Types';

const CustomerSampling: React.FC = () => {
  const [rows, setRows] = useState<Customer[]>([]);
  const [filteredRows, setFilteredRows] = useState<Customer[]>([]);
  const [openDelete, setOpenDelete] = useState(false);
  const [openGroupDelete, setOpenGroupDelete] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const navigate = useNavigate();

  useEffect(() => {
    const filtered = rows.filter(row =>
      row.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.customerType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredRows(filtered);
    setPage(0);
  }, [searchTerm, rows]);

  useEffect(() => {
    const fetchData = async () => {
      const customers = await fetchCustomers();
      setRows(customers);
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedCustomers.length === 0) {
      setRows(rows.map(row => ({ ...row, selectBox: false })));
    }
  }, [selectedCustomers, rows]);

  const handleAdd = () => {
    navigate('add-customer');
  };

  const handleEdit = (customer: Customer) => {
    navigate(`/edit-customer/${customer._id}`);
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
    setOpenDelete(true);
  };

  const confirmDelete = async () => {
    if (deleteId) {
      await deleteCustomer(deleteId);
      setRows(rows.filter(row => row._id !== deleteId));
      setOpenDelete(false);
      setDeleteId(null);
    }
  };

  const handleCloseDelete = () => {
    setOpenDelete(false);
    setDeleteId(null);
  };

  const confirmGroupDelete = async () => {
    try {
      await Promise.all(selectedCustomers.map(id => deleteCustomer(id)));
      setRows(rows.filter(row => !selectedCustomers.includes(row._id)));
      setOpenGroupDelete(false);
      setSelectedCustomers([]);
    } catch (error) {
      console.error('Error deleting customers:', error);
    }
  };

  const handleCloseGroupDelete = () => {
    setOpenGroupDelete(false);
    setSelectedCustomers([]);
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSelect = (id: string) => {
    setRows(prevRows => {
      const updatedRows = prevRows.map(row => {
        if (row._id === id) {
          const updatedRow = { ...row, selectBox: !row.selectBox };
          if (updatedRow.selectBox) {
            setSelectedCustomers(prev => [...new Set([...prev, id])]);
          } else {
            setSelectedCustomers(prev => prev.filter(customerId => customerId !== id));
          }
          return updatedRow;
        }
        return row;
      });
      return updatedRows;
    });
  };

  const isAnyCustomerSelected = selectedCustomers.length > 0;

  return (
    <div className='customer'>
      <div className='button-row'>
        <h2 className='customer-sampling'>Customer Sampling</h2>
        <Button className='add-button-customer-sampling' onClick={handleAdd} startIcon={<AddIcon />}>
          Add Customer
        </Button>
      </div>
      <div className='action-buttons-sampling'>
        <SearchBarComponent searchTerm={searchTerm} handleSearch={handleSearch} />
      </div>
      {isAnyCustomerSelected && (
        <div className='selected-actions'>
          <span>{selectedCustomers.length} selected</span>
          <Button className='send-sampling-button'>Send for Sampling</Button>
          <IconButton className='delete-button' onClick={() => {
            if (selectedCustomers.length === 1) {
              handleDelete(selectedCustomers[0]);
            } else {
              setOpenGroupDelete(true);
            }
          }}>
            <DeleteIcon />
          </IconButton>
          <IconButton className='close-button' onClick={() => setSelectedCustomers([])}>
            <CloseIcon />
          </IconButton>
        </div>
      )}
      <Dialog
        open={openDelete}
        onClose={handleCloseDelete}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">{"Delete Customer"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete this customer?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDelete} color="primary">
            Cancel
          </Button>
          <Button onClick={confirmDelete} color="primary" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={openGroupDelete}
        onClose={handleCloseGroupDelete}
        aria-labelledby="group-delete-dialog-title"
        aria-describedby="group-delete-dialog-description"
      >
        <DialogTitle id="group-delete-dialog-title">{"Delete Selected Customers"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="group-delete-dialog-description">
            Are you sure you want to delete the selected customers?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseGroupDelete} color="primary">
            Cancel
          </Button>
          <Button onClick={confirmGroupDelete} color="primary" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      <TableContainer component={Paper}>
        <CustomerTable
          rows={filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
          handleSelect={handleSelect} handleSelectAll={function (): void {
            throw new Error('Function not implemented.');
          } } handleGroupDelete={function (): void {
            throw new Error('Function not implemented.');
          } }        />
      </TableContainer>
      <PaginationComponent
        rowsPerPage={rowsPerPage}
        page={page}
        count={filteredRows.length}
        handleChangePage={handleChangePage}
        handleChangeRowsPerPage={handleChangeRowsPerPage}
      />
    </div>
  );
};

export default CustomerSampling;
