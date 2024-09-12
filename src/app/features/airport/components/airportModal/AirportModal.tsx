import React, { useState, useEffect } from 'react';
import { Modal, Box, Typography, IconButton, Button, TextField } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import { AirportMaster, fetchAirportMasterById, updateAirportMaster } from '../../api/AirportAPI';
import './AirportModal.css';

interface Props {
  open: boolean;
  onClose: () => void;
  airportId: string;
  isEditMode: boolean;
  setIsEditMode: (editMode: boolean) => void;
  fetchAirports: () => void;
}

const AirportModal: React.FC<Props> = ({
  open,
  onClose,
  airportId,
  isEditMode,
  setIsEditMode,
  fetchAirports,
}) => {
  const [editableData, setEditableData] = useState<AirportMaster | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (airportId && open) {
      setLoading(true);
      fetchAirportMasterById(airportId)
        .then((data) => {
          setEditableData(data);
        })
        .catch((error) => console.error('Error fetching airport by ID:', error))
        .finally(() => setLoading(false));
    } else {
      // Clear the data if modal is closed or no valid airportId
      setEditableData(null);
    }
  }, [airportId, open]);

  const handleInputChange = (field: keyof AirportMaster, value: any) => {
    if (editableData) {
      setEditableData({
        ...editableData,
        [field]: value,
      });
    }
  };

  const handleSave = async () => {
    if (airportId && editableData) {
      try {
        await updateAirportMaster(airportId, editableData);
        fetchAirports(); // Refetch the airport list
        setIsEditMode(false);
        onClose();
      } catch (error) {
        console.error('Failed to update airport', error);
      }
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box className="modal-box-airport">
        {loading ? (
          <Typography variant="h6">Loading...</Typography>
        ) : (
          <>
            <Typography variant="h6" component="h2" className="modal-title-airport">
              Airport Details
              <Box className="title-actions">
                {isEditMode ? (
                  <IconButton onClick={onClose} className="close-button">
                    <CloseIcon />
                  </IconButton>
                ) : (
                  <>
                    <IconButton onClick={() => setIsEditMode(true)} className="edit-button">
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={onClose} className="close-button">
                      <CloseIcon />
                    </IconButton>
                  </>
                )}
              </Box>
            </Typography>
            <Box className="modal-content">
              {isEditMode ? (
                editableData ? (
                  <>
                    <TextField
                      label="Airport Code"
                      value={editableData.airportCode || ''}
                      onChange={(e) => handleInputChange('airportCode', e.target.value)}
                      fullWidth
                      className="input-field"
                      variant="standard"
                    />
                    <TextField
                      label="Airport Name"
                      value={editableData.airportName || ''}
                      onChange={(e) => handleInputChange('airportName', e.target.value)}
                      fullWidth
                      className="input-field"
                      variant="standard"
                    />
                    <TextField
                      label="City Code"
                      value={editableData.cityCode || ''}
                      onChange={(e) => handleInputChange('cityCode', e.target.value)}
                      fullWidth
                      className="input-field"
                      variant="standard"
                    />
                    <TextField
                      label="City Name"
                      value={editableData.cityName || ''}
                      onChange={(e) => handleInputChange('cityName', e.target.value)}
                      fullWidth
                      className="input-field"
                      variant="standard"
                    />
                    <TextField
                      label="Country Code"
                      value={editableData.countryCode || ''}
                      onChange={(e) => handleInputChange('countryCode', e.target.value)}
                      fullWidth
                      className="input-field"
                      variant="standard"
                    />
                    <TextField
                      label="Country Name"
                      value={editableData.countryName || ''}
                      onChange={(e) => handleInputChange('countryName', e.target.value)}
                      fullWidth
                      className="input-field"
                      variant="standard"
                    />
                    <TextField
                      label="Latitude"
                      value={editableData.latitude || ''}
                      onChange={(e) => handleInputChange('latitude', e.target.value)}
                      fullWidth
                      className="input-field"
                      variant="standard"
                    />
                    <TextField
                      label="Longitude"
                      value={editableData.longitude || ''}
                      onChange={(e) => handleInputChange('longitude', e.target.value)}
                      fullWidth
                      className="input-field"
                      variant="standard"
                    />
                    <Box className="action-buttons">
                      <Button variant="contained" color="primary" onClick={handleSave} className="save-button">
                        Save
                      </Button>
                      <Button variant="contained" color="secondary" onClick={onClose} className="close-button">
                        Close
                      </Button>
                    </Box>
                  </>
                ) : (
                  <Typography variant="body1">No data available</Typography>
                )
              ) : (
                editableData ? (
                  <>
                    <Typography className="detail-text">Airport Code: {editableData.airportCode}</Typography>
                    <Typography className="detail-text">Airport Name: {editableData.airportName}</Typography>
                    <Typography className="detail-text">City Code: {editableData.cityCode}</Typography>
                    <Typography className="detail-text">City Name: {editableData.cityName}</Typography>
                    <Typography className="detail-text">Country Code: {editableData.countryCode}</Typography>
                    <Typography className="detail-text">Country Name: {editableData.countryName}</Typography>
                    <Typography className="detail-text">Latitude: {editableData.latitude}</Typography>
                    <Typography className="detail-text">Longitude: {editableData.longitude}</Typography>
                  </>
                ) : (
                  <Typography variant="body1">No data available</Typography>
                )
              )}
            </Box>
          </>
        )}
      </Box>
    </Modal>
  );
};

export default AirportModal;
