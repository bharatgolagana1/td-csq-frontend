import React, { useState, useEffect } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AirportDataMasterTable from '../AirportDataMasterTable/AirportDataMasterTable';
import {
  AirportMaster,
  fetchAirportMasters,
  deleteAirportMaster,
} from '../../api/AirportDataMasterAPI';
import './AirportDataMaster.css';

const AirportDataMaster: React.FC = () => {
  const [rows, setRows] = useState<AirportMaster[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteAirportId, setDeleteAirportId] = useState<string | null>(null);
  const navigate = useNavigate();

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
    navigate('/airportMaster/add-airport');
  };

  const handleEdit = (airport: AirportMaster) => {
    navigate(`/airportMaster/add-airport/${airport._id}`);
  };

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

  return (
    <div style={{ marginLeft: '20px' }}>
      <h2 className='airport-master'>Airport Master</h2>
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
        onAdd={handleAdd}
      />
    </div>
  );
};

export default AirportDataMaster;
