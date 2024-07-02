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
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import TextField from '@mui/material/TextField';
import { API_URL } from '../CustomerSampling/API/CustomerSamplingAPI';
import './CustomerSampling.css';

interface Customer {
  _id?: string;
  customerType: string;
  customerName: string;
  airportCode: string;
  email: string;
  currentSamplingDate: string;
  previousSamplingDate: string;
}

const ModalStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

export default function CustomerSampling() {
  const [rows, setRows] = useState<Customer[]>([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<Customer>({
    customerType: '',
    customerName: '',
    airportCode: '',
    email: '',
    currentSamplingDate: '',
    previousSamplingDate: ''
  });
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await axios.get<Customer[]>(API_URL);
      setRows(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const handleAdd = () => {
    setFormData({
      customerType: '',
      customerName: '',
      airportCode: '',
      email: '',
      currentSamplingDate: '',
      previousSamplingDate: ''
    });
    setIsEdit(false);
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleEdit = (customer: Customer) => {
    setFormData(customer);
    setEditId(customer._id || null);
    setIsEdit(true);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      setRows(rows.filter(row => row._id !== id));
    } catch (error) {
      console.error('Error deleting customer:', error);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const {
      customerType, customerName, airportCode, email, currentSamplingDate, previousSamplingDate
    } = formData;

    if (!customerType || !customerName || !airportCode || !email || !currentSamplingDate || !previousSamplingDate) {
      console.error('All fields are required.');
      return;
    }

    try {
      if (isEdit && editId) {
        const response = await axios.put<Customer>(`${API_URL}/${editId}`, formData);
        setRows(rows.map(row => (row._id === editId ? response.data : row)));
      } else {
        const response = await axios.post<Customer>(API_URL, formData);
        setRows([...rows, response.data]);
      }
      setOpen(false);
    } catch (error) {
      console.error('Error adding/updating customer:', error);
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
    <>
      <h2 className='customer-sampling'>Customer Sampling for Assessments</h2>
      <div className='action-buttons'>
        <Button className='add-user-button' variant="contained" onClick={handleAdd}>
          Add Customer
        </Button>
      </div>
      <Modal open={open} onClose={handleClose} aria-labelledby="form-modal-title" aria-describedby="form-modal-description" style={ModalStyle}>
        <Box className='form-container'>
          <Typography variant="h6" id="form-modal-title">{isEdit ? 'Edit Customer' : 'Add Customer'}</Typography>
          <Box
            component="form"
            noValidate
            autoComplete="off"
            onSubmit={handleSubmit}
          >
            <TextField
              className='custom-text-field'
              label="Customer Type"
              variant="standard"
              name="customerType"
              value={formData.customerType}
              onChange={handleChange}
              required
              fullWidth
              margin="normal"
            />
            <TextField
              className='custom-text-field'
              label="Customer Name"
              variant="standard"
              name="customerName"
              value={formData.customerName}
              onChange={handleChange}
              required
              fullWidth
              margin="normal"
            />
            <TextField
              className='custom-text-field'
              label="Airport Code"
              variant="standard"
              name="airportCode"
              value={formData.airportCode}
              onChange={handleChange}
              required
              fullWidth
              margin="normal"
            />
            <TextField
              className='custom-text-field'
              label="Email"
              variant="standard"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              fullWidth
              margin="normal"
            />
            <TextField
              className='custom-text-field'
              label="Current Sampling Date"
              variant="standard"
              name="currentSamplingDate"
              value={formData.currentSamplingDate}
              onChange={handleChange}
              required
              fullWidth
              margin="normal"
            />
            <TextField
              className='custom-text-field'
              label="Previous Sampling Date"
              variant="standard"
              name="previousSamplingDate"
              value={formData.previousSamplingDate}
              onChange={handleChange}
              required
              fullWidth
              margin="normal"
            />
            <div className='button-container'>
              <Button type="submit" variant="contained" color="primary">
                Submit
              </Button>
              <Button color="secondary" onClick={handleClose}>
                Cancel
              </Button>
            </div>
          </Box>
        </Box>
      </Modal>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell className="styled-table-head-cell">Customer Type</TableCell>
              <TableCell className="styled-table-head-cell">Customer Name</TableCell>
              <TableCell className="styled-table-head-cell">Airport Code</TableCell>
              <TableCell className="styled-table-head-cell">Email</TableCell>
              <TableCell className="styled-table-head-cell">Current Sampling Date</TableCell>
              <TableCell className="styled-table-head-cell">Previous Sampling Date</TableCell>
              <TableCell className="styled-table-head-cell">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={index}>
                <TableCell>{row.customerType}</TableCell>
                <TableCell>{row.customerName}</TableCell>
                <TableCell>{row.airportCode}</TableCell>
                <TableCell>{row.email}</TableCell>
                <TableCell>{row.currentSamplingDate}</TableCell>
                <TableCell>{row.previousSamplingDate}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleEdit(row)}><EditIcon /></IconButton>
                  <IconButton onClick={() => handleDelete(row._id!)}><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}
