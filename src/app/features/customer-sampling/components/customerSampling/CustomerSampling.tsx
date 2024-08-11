import React, { useState, useEffect, ChangeEvent } from 'react';
import { Button, Typography, TableContainer, Paper, Modal, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { fetchCustomers, fetchAssessmentCycle, addCustomer, updateCustomer, deleteCustomer } from '../../api/CustomerSamplingAPI';
import CustomerTable from '../customerTable/CustomerTable';
import CustomerSamplingForm from '../customerSamplingForm/CustomerSamplingForm';
import PaginationComponent from '../CustomerSamplingControls/PaginationComponent';
import SearchBarComponent from '../CustomerSamplingControls/SearchBarComponent';
import './CustomerSampling.css';
import axios from 'axios';
import { Customer, AssessmentCycle } from '../types/Types';

const ModalStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const CustomerSampling: React.FC = () => {
  const [rows, setRows] = useState<Customer[]>([]);
  const [filteredRows, setFilteredRows] = useState<Customer[]>([]);
  const [assessmentCycle, setAssessmentCycle] = useState<AssessmentCycle | null>(null);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<Customer>({ _id: '', customerType: '', customerName: '', email: '' });
  const [isEdit, setIsEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedCustomersCount, setSelectedCustomersCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  useEffect(() => {
    const loadCustomers = async () => {
      const customers = await fetchCustomers();
      setRows(customers);
      setFilteredRows(customers);
    };

    const loadAssessmentCycle = async () => {
      const cycle = await fetchAssessmentCycle();
      setAssessmentCycle(cycle.length > 0 ? cycle[0] : null);
    };

    loadCustomers();
    loadAssessmentCycle();
  }, []);

  useEffect(() => {
    const filtered = rows.filter(row =>
      row.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.customerType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredRows(filtered);
    setPage(0); // Reset page to 0 when search term changes
  }, [searchTerm, rows]);

  const formatDate = (date: string | Date): string => {
    try {
      const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };
      return new Date(date).toLocaleDateString('en-GB', options);
    } catch (error) {
      console.error('Invalid date:', date);
      return 'Invalid date';
    }
  };
  const handleAdd = () => {
    setFormData({ _id: '', customerType: '', customerName: '', email: '' });
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
        const { _id, ...newCustomerData } = formData; // Create a new object without _id
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
            setSelectedCustomersCount(prevCount => prevCount + 1);
          } else {
            setSelectedCustomersCount(prevCount => prevCount - 1);
          }
          return updatedRow;
        }
        return row;
      });
      return updatedRows;
    });
  };

  const handleSendForSampling = () => {
    const selected = rows.filter(row => row.selectBox);
    console.log('Selected Customers:', selected);
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

  return (
    <div className='customer'>
      <h2 className='customer-sampling'>Customer Sampling for Assessments</h2>
      {assessmentCycle && (
        <div className='assessment-details'>
          <Typography variant="body1">Minimum Sampling Size: {assessmentCycle.minSamplingSize}</Typography>
          <Typography variant="body1">Sampling Start Date: {formatDate(assessmentCycle.samplingStartDate)}</Typography>
          <Typography variant="body1">Sampling End Date: {formatDate(assessmentCycle.samplingEndDate)}</Typography>
        </div>
      )}
      <div>
        Users Selected : {selectedCustomersCount}
      </div>
      <SearchBarComponent searchTerm={searchTerm} handleSearch={handleSearch} />
      <div className='action-buttons'>
        <Button className='add-user-button' variant="contained" onClick={handleAdd} startIcon={<AddIcon/>}>
          Add Customer
        </Button>
        {assessmentCycle && selectedCustomersCount >= assessmentCycle.minSamplingSize && (
          <Button className='send-sampling-button' variant="contained" color="primary" onClick={handleSendForSampling}>
            Send for Sampling
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
      <TableContainer component={Paper}>
        <CustomerTable rows={filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)} handleEdit={handleEdit} handleDelete={handleDelete} handleSelect={handleSelect} />
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