import React, { useState, useEffect } from 'react';
import { Button, IconButton } from '@mui/material';
import { Add as AddIcon, Close as CloseIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import AirportTable from '../airportTable/AirportTable';
import { AirportMaster, deleteAirportMaster, fetchAirportMasters } from '../../api/AirportAPI';
import AirportAlerts from '../airportHelpers/AirportAlerts';
import AirportDialogs from '../airportHelpers/AirportDialogs';
import AirportModal from '../airportModal/AirportModal'; // Import the modal component
import deleteIcon from "../../../../../assets/deleteIcon.svg";
import './Airport.css';
import AirportSearchbar from '../airportHelpers/AirportSearchbar';

const Airport: React.FC = () => {
  const [rows, setRows] = useState<AirportMaster[]>([]);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false); // State for modal
  const [selectedAirportId, setSelectedAirportId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false); // State for editing mode
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
    navigate('/airport/add-airport');
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(selectedRows.map(id => deleteAirportMaster(id)));
      setRows(rows.filter(row => !selectedRows.includes(row._id!)));
      setAlertMessage(`Deleted ${selectedRows.length} airports.`);
      setTimeout(() => setAlertMessage(null), 5000);
      setSelectedRows([]);
    } catch (error) {
      console.error('Error deleting selected airports:', error);
      setAlertMessage('Failed to delete selected airports.');
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  const handleModalOpen = (airportId: string) => {
    setSelectedAirportId(airportId);
    setIsEditMode(false);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedAirportId(null); // Clear selected airport data
  };

  return (
    <div className="airport-container">
      {/* Header with title and Add Airport button */}
      <div className="airport-header">
        <h2 className="airport-title">Airport Master</h2>
        <Button className="add-airport-button" onClick={handleAdd}>
          <AddIcon className="add-icon" />
          <span className="add-airport-text">Add Airport</span>
        </Button>
      </div>

      {/* Alert message */}
      <AirportAlerts message={alertMessage} onClose={() => setAlertMessage(null)} type="deleted" />
      <div className="section-divider" /> 
      <div>
        <AirportSearchbar searchQuery={''} onSearchChange={function (_event: React.ChangeEvent<HTMLInputElement>): void {
          throw new Error('Function not implemented.');
        } }/>
      </div>
      <div className="section-divider" /> 
      {/* Selected info bar when rows are selected */}
      {selectedRows.length > 0 && (
        <div className="selected-info">
          <span className="selected-count">{selectedRows.length} selected</span>
          <div className="delete-button-container">
            <Button onClick={() => setDeleteDialogOpen(true)}>
              <span className="delete-text">Delete</span>
              <img src={deleteIcon} alt="delete" />
            </Button>
          </div>
          <IconButton className="close-icon" onClick={() => setSelectedRows([])}>
            <CloseIcon />
          </IconButton>
        </div>
      )}
      <AirportTable
        rows={rows}
        selectedRows={selectedRows}
        onCheckboxChange={(id: string) => {
          setSelectedRows(prevSelected =>
            prevSelected.includes(id)
              ? prevSelected.filter(rowId => rowId !== id)
              : [...prevSelected, id]
          );
        }}
        onViewClick={handleModalOpen}
      />

      {/* Delete confirmation dialog */}
      <AirportDialogs
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleBulkDelete}
        title="Confirm Bulk Delete"
        message="Are you sure you want to delete the selected airports?"
      />

      {/* Airport details modal */}
      <AirportModal
        open={modalOpen}
        onClose={handleModalClose}
        airportId={selectedAirportId || ''} // Ensure airportId is not null
        fetchAirports={() => fetchAirportMasters().then(setRows)} // Fetch updated airports list after edit
        isEditMode={isEditMode}
        setIsEditMode={setIsEditMode}
      />
    </div>
  );
};

export default Airport;
