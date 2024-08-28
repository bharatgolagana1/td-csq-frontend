import React from 'react';
import { Modal, Box, Button } from '@mui/material';
import EditIconSvg from '../../../../../asserts/svgs/editIconSvg.svg';
import { AirportMaster } from '../../api/AirportDataMasterAPI';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

interface AirportDetailsModalProps {
  open: boolean;
  onClose: () => void;
  airport: AirportMaster | null;
  onEdit: () => void;
}

const AirportModal: React.FC<AirportDetailsModalProps> = ({ open, onClose, airport, onEdit }) => {
  if (!airport) return null;

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style}>
        <h2>{airport.airportName} Details</h2>
        <p><strong>Airport Code:</strong> {airport.airportCode}</p>
        <p><strong>City:</strong> {airport.cityName}</p>
        <p><strong>Country:</strong> {airport.countryName}</p>
        <p><strong>Latitude:</strong> {airport.latitude}</p>
        <p><strong>Longitude:</strong> {airport.longitude}</p>
        <Button onClick={onEdit}>
          <img src={EditIconSvg} alt="Edit" />
          Edit
        </Button>
      </Box>
    </Modal>
  );
};

export default AirportModal;
