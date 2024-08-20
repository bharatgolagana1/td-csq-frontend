import React, { useState, useEffect, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, DialogTitle, DialogContent, DialogContentText, DialogActions, Dialog } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import {
  AirportCargo,
  fetchAirportCargos,
  deleteAirportCargo,
} from '../../api/AirportCargoMasterAPI';
import AirportCargoMasterTable from '../airportCargoMasterTable/AirportCargoMasterTable';
import AirportCargoControls from '../airportCargoControls/AirportCargoControls';
import './AirportCargoMaster.css';

const AirportCargoMaster: React.FC = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<AirportCargo[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  useEffect(() => {
    const fetchCargos = async () => {
      try {
        const data = await fetchAirportCargos();
        setRows(data);
      } catch (error) {
        console.error('Error fetching airport cargos:', error);
      }
    };
    fetchCargos();
  }, []);

  const handleDeleteDialogClose = () => setDeleteDialogOpen(false);

  const handleEdit = (airport: AirportCargo) => {
    navigate(`/airportCargo/add-cargo/${airport._id}`);
  };

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

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handlePageChange = (_event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event: ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredRows = rows.filter(
    (row) =>
      row.acoCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.acoName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.acoAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.airportCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedRows = filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <div className='airport-cargo-container'>
      <h2 className='airport-cargo-title'>Airport Cargo Master</h2>
      <AirportCargoControls
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
      />
      <div className='action-buttons'>
        <Button
          className='custom-add-button'
          variant='contained'
          startIcon={<AddIcon />}
          onClick={() => navigate('/airportCargo/add-cargo')}
        >
          Add Cargo
        </Button>
      </div>
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteDialogClose}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this airport?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteDialogClose}>
            Cancel
          </Button>
          <Button onClick={handleDelete} variant="contained" className='delete-button'>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      <AirportCargoMasterTable
        rows={paginatedRows}
        onEdit={handleEdit}
        onDelete={handleDeleteDialogOpen}
        page={page}
        rowsPerPage={rowsPerPage}
        count={filteredRows.length}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
      />
    </div>
  );
};

export default AirportCargoMaster;
