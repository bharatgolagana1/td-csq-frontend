import React, { useState, useEffect } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import AirportDataMasterForm from '../AirportDataMasterForm/AirportDataMasterForm';
import AirportDataMasterTable from '../AirportDataMasterTable/AirportDataMasterTable';
import AddIcon from '@mui/icons-material/Add';
import {
  AirportMaster,
  fetchAirportMasters,
  addAirportMaster,
  updateAirportMaster,
  deleteAirportMaster,
} from '../../api/AirportDataMasterAPI';
import './AirportDataMaster.css';

const AirportDataMaster: React.FC = () => {
  const [rows, setRows] = useState<AirportMaster[]>([]);
  const [openForm, setOpenForm] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [formData, setFormData] = useState<AirportMaster>({
    _id: '',
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
  const [deleteAirportId, setDeleteAirportId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchAirportMasters();
        setRows(data);
      } catch (error) {
        console.error('Error fetching airport masters:', error);
      }
    };
    fetchData();
  }, []);

  const handleAdd = () => {
    setFormData({
      _id: '',
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
    setOpenForm(true);
  };

  const handleEdit = (airport: AirportMaster) => {
    console.log('Editing airport:', airport); // Debug log
    setFormData(airport);
    setIsEdit(true);
    setOpenForm(true);
  };

  const handleCloseForm = () => setOpenForm(false);

  const handleDeleteConfirmation = (id: string) => {
    setDeleteAirportId(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteAirportId) return;

    try {
      await deleteAirportMaster(deleteAirportId);
      setRows(rows.filter(row => row._id !== deleteAirportId));
    } catch (error) {
      console.error('Error deleting airport master:', error);
    } finally {
      setDeleteDialogOpen(false);
      setDeleteAirportId(null);
    }
  };

  const handleSubmitForm = async (data: AirportMaster) => {
    console.log('Submitting form data:', data);
    try {
      if (isEdit) {
        const updatedData = await updateAirportMaster(data);
        setRows(rows.map(row => (row._id === data._id ? updatedData : row)));
      } else {
        const newData = await addAirportMaster(data);
        setRows([...rows, newData]);
      }
      setOpenForm(false);
    } catch (error) {
      console.error('Error adding/updating airport master:', error);
    }
  };

  return (
    <div style={{ marginLeft: '20px' }}>
      <h2 className='airport-master'>Airport Master</h2>
      <div className='action-buttons'>
        <Button className="add-user-button" variant="contained" onClick={handleAdd} startIcon={<AddIcon />}> 
          Add Airport
        </Button>
      </div>
      <AirportDataMasterForm
        open={openForm}
        onClose={handleCloseForm}
        onSubmit={handleSubmitForm}
        formData={formData} // Pass the formData to the form component
      />
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this airport?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleDelete} variant="contained" color="primary">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      <AirportDataMasterTable
        rows={rows}
        onEdit={handleEdit}
        onDelete={handleDeleteConfirmation}
      />
    </div>
  );
};

export default AirportDataMaster;
