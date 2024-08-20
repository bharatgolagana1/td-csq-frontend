import React, { useState, useEffect, ChangeEvent } from 'react';
import { Button, TableContainer, Paper, Modal, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { addCustomer, updateCustomer, deleteCustomer, fetchCustomers } from '../../api/CustomerSamplingAPI';
import CustomerTable from '../customerTable/CustomerTable';
import CustomerSamplingForm from '../customerSamplingForm/CustomerSamplingForm';
import PaginationComponent from '../CustomerSamplingControls/PaginationComponent';
import SearchBarComponent from '../CustomerSamplingControls/SearchBarComponent';
import './CustomerSampling.css';
import axios from 'axios';
import { Customer } from '../types/Types';

const ModalStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const CustomerSampling: React.FC = () => {
  const [rows, setRows] = useState<Customer[]>([]);
  const [filteredRows, setFilteredRows] = useState<Customer[]>([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<Customer>({ _id: '', customerType: '', customerName: '', email: '', sampledDate: '' });
  const [isEdit, setIsEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openGroupDelete, setOpenGroupDelete] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

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
    setFormData({ _id: '', customerType: '', customerName: '', email: '', sampledDate: '' });
    setIsEdit(false);
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleEdit = (customer: Customer) => {
    setFormData(customer);
    setIsEdit(true);
    setOpen(true);
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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const { _id, customerType, customerName, email } = formData;

    if (!customerType || !customerName || !email) {
      console.error('All fields are required.');
      return;
    }

    try {
      if (isEdit && _id) {
        await updateCustomer(_id, formData);
        setRows(rows.map(row => (row._id === _id ? formData : row)));
      } else {
        const { _id, ...newCustomerData } = formData;
        const response = await addCustomer(newCustomerData);
        setRows([...rows, response]);
      }
      setOpen(false);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Axios error:', error.response?.data);
      } else {
        console.error('Unexpected error:', error);
      }
    }
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name?: string; value: unknown } }) => {
    const { name, value } = event.target;
    setFormData((prevState) => ({ ...prevState, [name as string]: value }));
  };

  const handleSelect = (id: string) => {
    setRows(prevRows => {
      const updatedRows = prevRows.map(row => {
        if (row._id === id) {
          const updatedRow = { ...row, selectBox: !row.selectBox };
          if (updatedRow.selectBox) {
            // Add to selectedCustomers if selected
            setSelectedCustomers(prev => [...new Set([...prev, id])]);
          } else {
            // Remove from selectedCustomers if deselected
            setSelectedCustomers(prev => prev.filter(customerId => customerId !== id));
          }
          return updatedRow;
        }
        return row;
      });
      return updatedRows;
    });
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

  const isAnyCustomerSelected = selectedCustomers.length > 0;

  return (
    <div className='customer'>
      <div className='button-row'>
        <h2 className='customer-sampling'>Customer Sampling</h2>
        <Button className='add-button-customer-sampling' onClick={handleAdd} startIcon={<AddIcon />}>
          Add Customer
        </Button>
      </div>
      <SearchBarComponent searchTerm={searchTerm} handleSearch={handleSearch} />
      <div className='action-buttons'>
        {isAnyCustomerSelected && (
          <Button className='delete-button' variant="contained" color="secondary" onClick={() => {
            if (selectedCustomers.length === 1) {
              handleDelete(selectedCustomers[0]);
            } else {
              setOpenGroupDelete(true);
            }
          }}>
            {selectedCustomers.length === 1 ? 'Delete Selected User' : 'Delete Selected Users'}
          </Button>
        )}
      </div>
      <Modal open={open} onClose={handleClose} aria-labelledby="form-modal-title" aria-describedby="form-modal-description" style={ModalStyle}>
        <CustomerSamplingForm
          isEdit={isEdit}
          formData={formData}
          handleChange={handleChange}
          handleSubmit={handleSubmit}
          handleClose={handleClose}
          formErrors={{}}
        />
      </Modal>
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
          handleSelect={handleSelect}
          handleDelete={function (_id: string): void {
            throw new Error('Function not implemented.');
          }}
          handleSelectAll={function (): void {
            throw new Error('Function not implemented.');
          }}
          handleGroupDelete={function (): void {
            throw new Error('Function not implemented.');
          }}
        />
        <PaginationComponent
          count={filteredRows.length}
          page={page}
          rowsPerPage={rowsPerPage}
          handleChangePage={handleChangePage}
          handleChangeRowsPerPage={handleChangeRowsPerPage}
        />
      </TableContainer>
    </div>
  );
};

export default CustomerSampling;
