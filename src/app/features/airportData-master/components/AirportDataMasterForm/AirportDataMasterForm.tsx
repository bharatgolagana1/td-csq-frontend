import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from '@mui/material';
import { AirportMaster } from '../../api/AirportDataMasterAPI';

interface AirportDataMasterFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: AirportMaster) => void;
  formData: AirportMaster;
}

const AirportDataMasterForm: React.FC<AirportDataMasterFormProps> = ({
  open,
  onClose,
  onSubmit,
  formData,
}) => {
  const [data, setData] = useState<AirportMaster>(formData);

  useEffect(() => {
    setData(formData);
  }, [formData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setData({ ...data, [name]: value });
  };

  const handleSubmit = () => {
    onSubmit(data);
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{formData._id ? 'Edit Airport' : 'Add Airport'}</DialogTitle>
      <DialogContent>
        <TextField
          margin="dense"
          label="Airport Code"
          name="airportCode"
          value={data.airportCode}
          onChange={handleChange}
          fullWidth
        />
        <TextField
          margin="dense"
          label="Airport Name"
          name="airportName"
          value={data.airportName}
          onChange={handleChange}
          fullWidth
        />
        <TextField
          margin="dense"
          label="City Code"
          name="cityCode"
          value={data.cityCode}
          onChange={handleChange}
          fullWidth
        />
        <TextField
          margin="dense"
          label="City Name"
          name="cityName"
          value={data.cityName}
          onChange={handleChange}
          fullWidth
        />
        <TextField
          margin="dense"
          label="Country Code"
          name="countryCode"
          value={data.countryCode}
          onChange={handleChange}
          fullWidth
        />
        <TextField
          margin="dense"
          label="Country Name"
          name="countryName"
          value={data.countryName}
          onChange={handleChange}
          fullWidth
        />
        <TextField
          margin="dense"
          label="Region Code"
          name="regionCode"
          value={data.regionCode}
          onChange={handleChange}
          fullWidth
        />
        <TextField
          margin="dense"
          label="Region Name"
          name="regionName"
          value={data.regionName}
          onChange={handleChange}
          fullWidth
        />
        <TextField
          margin="dense"
          label="Latitude"
          name="latitude"
          value={data.latitude}
          onChange={handleChange}
          fullWidth
        />
        <TextField
          margin="dense"
          label="Longitude"
          name="longitude"
          value={data.longitude}
          onChange={handleChange}
          fullWidth
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} className='action-button'>Cancel</Button>
        <Button onClick={handleSubmit} className='action-button' variant="contained" color="primary">
          {formData._id ? 'Update' : 'Add'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AirportDataMasterForm;
