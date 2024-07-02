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
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import axios from 'axios';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import TableCell from '@mui/material/TableCell';
import TextField from '@mui/material/TextField';
import { API_URL } from '../AirportMasterData/API/AirportMasterDataAPI';
import './AirportMasterData.css';

interface AirportMaster {
  airportCode: string;
  airportName: string;
  cityCode: string;
  cityName: string;
  countryCode: string;
  countryName: string;
  regionCode: string;
  regionName: string;
  latitude: number;
  longitude: number;
}

const ModalStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

export default function AirportMaster() {
  const [rows, setRows] = useState<AirportMaster[]>([]);
  const [open, setOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [formData, setFormData] = useState<AirportMaster>({
    airportCode: '',
    airportName: '',
    cityCode: '',
    cityName: '',
    countryCode: '',
    countryName: '',
    regionCode: '',
    regionName: '',
    latitude: 0,
    longitude: 0,
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteAirportCode, setDeleteAirportCode] = useState<string | null>(null); // Changed to airportCode

  useEffect(() => {
    fetchAirportMasters();
  }, []);

  const fetchAirportMasters = async () => {
    try {
      const response = await axios.get<AirportMaster[]>(API_URL);
      setRows(response.data);
    } catch (error) {
      console.error('Error fetching airport masters:', error);
    }
  };

  const handleAdd = () => {
    setFormData({
      airportCode: '',
      airportName: '',
      cityCode: '',
      cityName: '',
      countryCode: '',
      countryName: '',
      regionCode: '',
      regionName: '',
      latitude: 0,
      longitude: 0,
    });
    setIsEdit(false);
    setOpen(true);
  };

  const handleEdit = (airport: AirportMaster) => {
    setFormData(airport);
    setIsEdit(true);
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleDeleteConfirmation = (airportCode: string) => { // Changed to airportCode
    setDeleteAirportCode(airportCode);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async (_p0?: string) => {
    if (!deleteAirportCode) return;

    try {
      await axios.delete(`${API_URL}/${deleteAirportCode}`); // Use airportCode here
      setRows(rows.filter(row => row.airportCode !== deleteAirportCode)); // Adjust filtering logic
    } catch (error) {
      console.error('Error deleting airport master:', error);
    } finally {
      setDeleteDialogOpen(false);
      setDeleteAirportCode(null);
    }
  };
  
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const {
      airportCode, airportName, cityCode, cityName, countryCode, countryName, regionCode, regionName, latitude, longitude
    } = formData;

    if (!airportCode || !airportName || !cityCode || !cityName || !countryCode || !countryName || !regionCode || !regionName || !latitude || !longitude) {
      alert('All fields are required.');
      return;
    }

    try {
      if (isEdit) {
        await axios.put(`${API_URL}/${formData.airportCode}`, formData);
        setRows(rows.map(row => (row.airportCode === formData.airportCode ? formData : row)));
      } else {
        const response = await axios.post<AirportMaster>(API_URL, formData);
        setRows([...rows, response.data]);
      }
      setOpen(false);
    } catch (error) {
      console.error('Error adding/updating airport master:', error);
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
    <div style={{marginLeft:'20px'}}>
      <h2 className='airport-master'>Airport Master</h2>
      <div className='action-buttons'>
        <Button className="add-user-button" variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
          Add Airport
        </Button>
      </div>
      <Modal open={open} onClose={handleClose} aria-labelledby="form-modal-title" aria-describedby="form-modal-description" style={ModalStyle}>
        <Box className='form-container'>
          <Typography variant="h6" id="form-modal-title">{isEdit ? 'Edit Airport' : 'Add Airport'}</Typography>
          <Box
            component="form"
            noValidate
            autoComplete="off"
            onSubmit={handleSubmit}
          >
            <TextField
              className="custom-text-field"
              id="airportCode-basic"
              label="Airport Code"
              variant="standard"
              name="airportCode"
              value={formData.airportCode}
              onChange={handleChange}
              required
              fullWidth
            />
            <TextField
              className="custom-text-field"
              id="airportName-basic"
              label="Airport Name"
              variant="standard"
              name="airportName"
              value={formData.airportName}
              onChange={handleChange}
              required
              fullWidth
            />
            <TextField
              className="custom-text-field"
              id="cityCode-basic"
              label="City Code"
              variant="standard"
              name="cityCode"
              value={formData.cityCode}
              onChange={handleChange}
              required
              fullWidth
            />
            <TextField
              className="custom-text-field"
              id="cityName-basic"
              label="City Name"
              variant="standard"
              name="cityName"
              value={formData.cityName}
              onChange={handleChange}
              required
              fullWidth
            />
            <TextField
              className="custom-text-field"
              id="countryCode-basic"
              label="Country Code"
              variant="standard"
              name="countryCode"
              value={formData.countryCode}
              onChange={handleChange}
              required
              fullWidth
            />
            <TextField
              className="custom-text-field"
              id="countryName-basic"
              label="Country Name"
              variant="standard"
              name="countryName"
              value={formData.countryName}
              onChange={handleChange}
              required
              fullWidth
            />
            <TextField
              className="custom-text-field"
              id="regionCode-basic"
              label="Region Code"
              variant="standard"
              name="regionCode"
              value={formData.regionCode}
              onChange={handleChange}
              required
              fullWidth
            />
            <TextField
              className="custom-text-field"
              id="regionName-basic"
              label="Region Name"
              variant="standard"
              name="regionName"
              value={formData.regionName}
              onChange={handleChange}
              required
              fullWidth
            />
            <TextField
              className="custom-text-field"
              id="latitude-basic"
              label="Latitude"
              variant="standard"
              name="latitude"
              value={formData.latitude}
              onChange={handleChange}
              required
              fullWidth
            />
            <TextField
              className="custom-text-field"
              id="longitude-basic"
              label="Longitude"
              variant="standard"
              name="longitude"
              value={formData.longitude}
              onChange={handleChange}
              required
              fullWidth
            />
            <Box className="button-container">
              <Button type="submit" variant="contained" color="primary">{isEdit ? 'Update' : 'Add'}</Button>
              <Button variant="contained" onClick={handleClose}>Cancel</Button>
            </Box>
          </Box>
        </Box>
      </Modal>
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{"Are you sure you want to delete?"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={() => handleDelete(deleteAirportCode!)} color="primary" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      <TableContainer component={Paper}>
        <Table aria-label="airport table">
          <TableHead>
            <TableRow>
              <TableCell className="styled-table-head-cell">Airport Code</TableCell>
              <TableCell className="styled-table-head-cell">Airport Name</TableCell>
              <TableCell className="styled-table-head-cell">City Code</TableCell>
              <TableCell className="styled-table-head-cell">City Name</TableCell>
              <TableCell className="styled-table-head-cell">Country Code</TableCell>
              <TableCell className="styled-table-head-cell">Country Name</TableCell>
              <TableCell className="styled-table-head-cell">Region Code</TableCell>
              <TableCell className="styled-table-head-cell">Region Name</TableCell>
              <TableCell className="styled-table-head-cell">Latitude</TableCell>
              <TableCell className="styled-table-head-cell">Longitude</TableCell>
              <TableCell className="styled-table-head-cell">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow className="styled-table-row" key={row.airportCode}>
                <TableCell className="styled-table-cell">{row.airportCode}</TableCell>
                <TableCell className="styled-table-cell">{row.airportName}</TableCell>
                <TableCell className="styled-table-cell">{row.cityCode}</TableCell>
                <TableCell className="styled-table-cell">{row.cityName}</TableCell>
                <TableCell className="styled-table-cell">{row.countryCode}</TableCell>
                <TableCell className="styled-table-cell">{row.countryName}</TableCell>
                <TableCell className="styled-table-cell">{row.regionCode}</TableCell>
                <TableCell className="styled-table-cell">{row.regionName}</TableCell>
                <TableCell className="styled-table-cell">{row.latitude}</TableCell>
                <TableCell className="styled-table-cell">{row.longitude}</TableCell>
                <TableCell className="styled-table-cell styled-table-cell-actions">
                  <Button className="blue-icon-button" onClick={() => handleEdit(row)}>
                    <EditIcon />
                  </Button>
                  <Button className="blue-icon-button" onClick={() => handleDeleteConfirmation(row.airportCode)}>
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
