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
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import TableCell from '@mui/material/TableCell';
import TextField from '@mui/material/TextField';
import { API_URL } from './API/AirportCargoMasterAPI';
import './AirportCargoMaster.css';

interface AirportCargo {
  acoId: number;
  acoCode: string;
  acoName: string;
  acoAddress: string;
  airportCode: string;
  pincode: string;
  emailId: string;
  mobileNumber: string;
}

const ModalStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

export default function AirportCargoMaster() {
  const [rows, setRows] = useState<AirportCargo[]>([]);
  const [open, setOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [formData, setFormData] = useState<AirportCargo>({
    acoId: 0,
    acoCode: '',
    acoName: '',
    acoAddress: '',
    airportCode: '',
    pincode: '',
    emailId: '',
    mobileNumber: ''
  });
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    fetchAirportCargos();
  }, []);

  const fetchAirportCargos = async () => {
    try {
      const response = await axios.get<AirportCargo[]>(API_URL);
      setRows(response.data);
    } catch (error) {
      console.error('Error fetching airport cargos:', error);
    }
  };

  const handleAdd = () => {
    setFormData({
      acoId: 0,
      acoCode: '',
      acoName: '',
      acoAddress: '',
      airportCode: '',
      pincode: '',
      emailId: '',
      mobileNumber: ''
    });
    setIsEdit(false);
    setOpen(true);
  };

  const handleEdit = (cargo: AirportCargo) => {
    setFormData(cargo);
    setIsEdit(true);
    setOpen(true);
  };

  const handleClose = () => setOpen(false);
  const handleDeleteClose = () => setDeleteOpen(false);

  const handleDeleteConfirm = async () => {
    if (selectedId !== null) {
      try {
        await axios.delete(`${API_URL}/${selectedId}`);
        setRows(rows.filter(row => row.acoId !== selectedId));
        setDeleteOpen(false);
      } catch (error) {
        console.error('Error deleting airport cargo:', error);
      }
    }
  };

  const handleDelete = (id: number) => {
    setSelectedId(id);
    setDeleteOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const {
      acoCode, acoName, acoAddress, airportCode, pincode, emailId, mobileNumber
    } = formData;

    if (!acoCode || !acoName || !acoAddress || !airportCode || !pincode || !emailId || !mobileNumber) {
      console.error('All fields are required.');
      return;
    }

    try {
      if (isEdit) {
        await axios.put(`${API_URL}/${formData.acoId}`, formData);
        setRows(rows.map(row => (row.acoId === formData.acoId ? formData : row)));
      } else {
        const response = await axios.post<AirportCargo>(API_URL, formData);
        setRows([...rows, response.data]);
      }
      setOpen(false);
    } catch (error) {
      console.error('Error adding/updating airport cargo:', error);
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
      <h2 className='airport-cargo'>Airport Cargo Master</h2>
      <div className='action-buttons'>
        <Button className='add-user-button' variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
          Add Cargo
        </Button>
      </div>
      <Modal open={open} onClose={handleClose} aria-labelledby="form-modal-title" aria-describedby="form-modal-description" style={ModalStyle}>
        <Box className='form-container'>
          <Typography variant="h6" id="form-modal-title">{isEdit ? 'Edit Cargo' : 'Add Cargo'}</Typography>
          <Box
            component="form"
            noValidate
            autoComplete="off"
            onSubmit={handleSubmit}
          >
            <TextField
              className='custom-text-field'
              id="acoCode-basic"
              label="ACO Code"
              variant="standard"
              name="acoCode"
              value={formData.acoCode}
              onChange={handleChange}
              required
              fullWidth
              margin="normal"
            />
            <TextField
              className='custom-text-field'
              id="acoName-basic"
              label="ACO Name"
              variant="standard"
              name="acoName"
              value={formData.acoName}
              onChange={handleChange}
              required
              fullWidth
              margin="normal"
            />
            <TextField
              className='custom-text-field'
              id="acoAddress-basic"
              label="ACO Address"
              variant="standard"
              name="acoAddress"
              value={formData.acoAddress}
              onChange={handleChange}
              required
              fullWidth
              margin="normal"
            />
            <TextField
              className='custom-text-field'
              id="airportCode-basic"
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
              id="pincode-basic"
              label="Pincode"
              variant="standard"
              name="pincode"
              value={formData.pincode}
              onChange={handleChange}
              required
              fullWidth
              margin="normal"
            />
            <TextField
              className='custom-text-field'
              id="emailId-basic"
              label="Email Id"
              variant="standard"
              name="emailId"
              value={formData.emailId}
              onChange={handleChange}
              required
              fullWidth
              margin="normal"
            />
            <TextField
              className='custom-text-field'
              id="mobileNumber-basic"
              label="Mobile Number"
              variant="standard"
              name="mobileNumber"
              value={formData.mobileNumber}
              onChange={handleChange}
              required
              fullWidth
              margin="normal"
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
      <Modal open={deleteOpen} onClose={handleDeleteClose} aria-labelledby="delete-modal-title" aria-describedby="delete-modal-description" style={ModalStyle}>
        <Box className='form-container'>
          <Typography variant="h6" id="delete-modal-title">Confirm Delete</Typography>
          <Typography variant="body1" id="delete-modal-description">Are you sure you want to delete this cargo?</Typography>
          <div className='button-container'>
            <Button variant="contained" color="primary" onClick={handleDeleteConfirm}>
              Yes
            </Button>
            <Button color="secondary" onClick={handleDeleteClose}>
              No
            </Button>
          </div>
        </Box>
      </Modal>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell className='table-head-cell'>Aco ID</TableCell>
              <TableCell className='table-head-cell'>Aco Code</TableCell>
              <TableCell className='table-head-cell'>Aco Name</TableCell>
              <TableCell className='table-head-cell'>Aco Address</TableCell>
              <TableCell className='table-head-cell'>Airport Code</TableCell>
              <TableCell className='table-head-cell'>Pincode</TableCell>
              <TableCell className='table-head-cell'>Email Id</TableCell>
              <TableCell className='table-head-cell'>Mobile Number</TableCell>
              <TableCell className='table-head-cell'>Edit</TableCell>
              <TableCell className='table-head-cell'>Delete</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow className='table-row' key={row.acoId}>
                <TableCell className='table-cell'>{row.acoId}</TableCell>
                <TableCell className='table-cell'>{row.acoCode}</TableCell>
                <TableCell className='table-cell'>{row.acoName}</TableCell>
                <TableCell className='table-cell'>{row.acoAddress}</TableCell>
                <TableCell className='table-cell'>{row.airportCode}</TableCell>
                <TableCell className='table-cell'>{row.pincode}</TableCell>
                <TableCell className='table-cell'>{row.emailId}</TableCell>
                <TableCell className='table-cell'>{row.mobileNumber}</TableCell>
                <TableCell className='table-cell'>
                  <Button className='blue-icon-button' onClick={() => handleEdit(row)}>
                    <EditIcon />
                  </Button>
                </TableCell>
                <TableCell className='table-cell'>
                  <Button className='blue-icon-button' onClick={() => handleDelete(row.acoId)}>
                    <DeleteIcon />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}
