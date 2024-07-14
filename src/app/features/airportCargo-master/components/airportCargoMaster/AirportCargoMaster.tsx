import React, { useState, useEffect } from 'react';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import Typography from '@mui/material/Typography';
import {
  AirportCargo,
  fetchAirportCargos,
  deleteAirportCargo,
  addAirportCargo,
  updateAirportCargo,
} from '../../api/AirportCargoMasterAPI';
import AirportCargoMasterTable from '../airportCargoMasterTable/AirportCargoMasterTable';
import AirportCargoForm from '../airportCargoMasterForm/AirportCargoMasterForm';
import './AirportCargoMaster.css';

const AirportCargoMaster: React.FC = () => {
  const [rows, setRows] = useState<AirportCargo[]>([]);
  const [open, setOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [formData, setFormData] = useState<AirportCargo>({
    acoCode: '',
    acoName: '',
    acoAddress: '',
    airportCode: '',
    pincode: '',
    emailId: '',
    mobileNumber: '',
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchCargos();
  }, []);

  const fetchCargos = async () => {
    try {
      const data = await fetchAirportCargos();
      setRows(data);
    } catch (error) {
      console.error('Error fetching airport cargos:', error);
    }
  };

  const handleAdd = () => {
    setFormData({
      acoCode: '',
      acoName: '',
      acoAddress: '',
      airportCode: '',
      pincode: '',
      emailId: '',
      mobileNumber: '',
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

  const handleDeleteDialogClose = () => setDeleteDialogOpen(false);

  const handleDeleteDialogOpen = (id: string) => {
    setDeleteId(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (deleteId !== null) {
      try {
        await deleteAirportCargo(deleteId);
        setRows(rows.filter((row) => row._id !== deleteId));
        setDeleteDialogOpen(false);
      } catch (error) {
        console.error('Error deleting airport cargo:', error);
      }
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      if (isEdit) {
        await updateAirportCargo(formData._id!, formData);
        setRows(rows.map((row) => (row._id === formData._id ? formData : row)));
      } else {
        const newCargo = await addAirportCargo(formData);
        setRows([...rows, newCargo]);
      }
      setOpen(false);
    } catch (error) {
      console.error('Error adding/updating airport cargo:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  return (
    <div className='airportCargo'>
      <h2 className='airport-cargo'>Airport Cargo Master</h2>
      <div className='action-buttons'>
        <Button
          className='add-user-button'
          variant='contained'
          startIcon={<AddIcon />}
          onClick={handleAdd}
        >
          Add Cargo
        </Button>
      </div>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby='form-modal-title'
        aria-describedby='form-modal-description'
        className='modalStyle'
      >
        <Box className='form-container-cargo'>
          <Typography variant='h6' id='form-modal-title'>
            {isEdit ? 'Edit Cargo' : 'Add Cargo'}
          </Typography>
          <AirportCargoForm
            formData={formData}
            isEdit={isEdit}
            onChange={handleChange}
            onSubmit={handleSubmit}
            onClose={handleClose}
          />
        </Box>
      </Modal>
      <Modal
        open={deleteDialogOpen}
        onClose={handleDeleteDialogClose}
        aria-labelledby='delete-modal-title'
        aria-describedby='delete-modal-description'
        className='smallModalStyle'
      >
        <Box className='form-container'>
          <Typography variant='h6' id='delete-modal-title'>
            Confirm Delete
          </Typography>
          <Typography variant='body1' id='delete-modal-description'>
            Are you sure you want to delete this cargo?
          </Typography>
          <div className='button-container'>
            <Button variant='contained' color='primary' onClick={handleDelete}>
              Yes
            </Button>
            <Button color='secondary' onClick={handleDeleteDialogClose}>
              No
            </Button>
          </div>
        </Box>
      </Modal>
      <AirportCargoMasterTable rows={rows} onEdit={handleEdit} onDelete={handleDeleteDialogOpen} />
    </div>
  );
};

export default AirportCargoMaster;
