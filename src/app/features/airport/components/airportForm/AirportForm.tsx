import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TextField, Button } from '@mui/material';
import {
  AirportMaster,
  fetchAirportMasterById,
  addAirportMaster,
  updateAirportMaster,
} from '../../api/AirportAPI';
import AirportAlerts from '../airportHelpers/AirportAlerts';
import './AirportForm.css';

const AirportForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [data, setData] = useState<AirportMaster>({
    _id: '',
    airportCode: '',
    airportName: '',
    cityCode: '',
    cityName: '',
    countryCode: '',
    countryName: '',
    regionCode: '',
    regionName: '',
    latitude: null, // Initialize as null
    longitude: null, // Initialize as null
  });

  const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (id) {
        try {
          const result = await fetchAirportMasterById(id);
          setData(result);
        } catch (error) {
          console.error('Error fetching airport data:', error);
        }
      }
    };
    fetchData();
  }, [id]);

  useEffect(() => {
    const validateFields = () => {
      const {
        airportCode,
        airportName,
        cityCode,
        cityName,
        countryCode,
        countryName,
        regionCode,
        regionName,
        latitude,
        longitude,
      } = data;
      return (
        airportCode &&
        airportName &&
        cityCode &&
        cityName &&
        countryCode &&
        countryName &&
        regionCode &&
        regionName &&
        latitude != null &&
        longitude != null
      );
    };
    setIsSubmitDisabled(!validateFields());
  }, [data]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Convert empty strings to null
    setData({ ...data, [name]: value === '' ? null : Number(value) });
  };

  const handleSubmit = async () => {
    try {
      const dataToSubmit: Omit<AirportMaster, '_id'> = {
        latitude: data.latitude ?? undefined, // Use undefined for optional fields
        longitude: data.longitude ?? undefined, // Use undefined for optional fields
        airportCode: data.airportCode,
        airportName: data.airportName,
        cityCode: data.cityCode,
        cityName: data.cityName,
        countryCode: data.countryCode,
        countryName: data.countryName,
        regionCode: data.regionCode,
        regionName: data.regionName,
      };
  
      if (!id) {
        await addAirportMaster(dataToSubmit as AirportMaster);
        setAlertMessage('Airport added successfully!');
      } else {
        await updateAirportMaster(id, dataToSubmit as Partial<AirportMaster>);
        setAlertMessage('Airport updated successfully!');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setAlertMessage('Failed to submit the form.');
    }
  };
  
  const handleCancel = () => {
    navigate('/airport');
  };

  return (
    <div className="form-container-airport">
      <h2 className="add-text">{id ? 'Edit Airport' : 'Add Airport'}</h2>
      
      <AirportAlerts message={alertMessage} onClose={() => setAlertMessage(null)} type='success'/>
      
      <form className="airport-form">
        <div className="form-row">
          <TextField
            margin="dense"
            label="Airport Code"
            name="airportCode"
            value={data.airportCode}
            onChange={handleChange}
            fullWidth
            required
            className="custom-textfield"
            size="small"
          />
          <TextField
            margin="dense"
            label="Airport Name"
            name="airportName"
            value={data.airportName}
            onChange={handleChange}
            fullWidth
            required
            className="custom-textfield"
            size="small"
          />
          <TextField
            margin="dense"
            label="City Code"
            name="cityCode"
            value={data.cityCode}
            onChange={handleChange}
            fullWidth
            required
            className="custom-textfield"
            size="small"
          />
        </div>
        <div className="form-row">
          <TextField
            margin="dense"
            label="City Name"
            name="cityName"
            value={data.cityName}
            onChange={handleChange}
            fullWidth
            required
            className="custom-textfield"
            size="small"
          />
          <TextField
            margin="dense"
            label="Country Code"
            name="countryCode"
            value={data.countryCode}
            onChange={handleChange}
            fullWidth
            required
            className="custom-textfield"
            size="small"
          />
          <TextField
            margin="dense"
            label="Country Name"
            name="countryName"
            value={data.countryName}
            onChange={handleChange}
            fullWidth
            required
            className="custom-textfield"
            size="small"
          />
        </div>
        <div className="form-row">
          <TextField
            margin="dense"
            label="Region Code"
            name="regionCode"
            value={data.regionCode}
            onChange={handleChange}
            fullWidth
            required
            className="custom-textfield"
            size="small"
          />
          <TextField
            margin="dense"
            label="Region Name"
            name="regionName"
            value={data.regionName}
            onChange={handleChange}
            fullWidth
            required
            className="custom-textfield"
            size="small"
          />
          <TextField
            margin="dense"
            label="Latitude"
            name="latitude"
            value={data.latitude !== null && data.latitude !== undefined ? data.latitude : ''}
            onChange={handleChange}
            onInput={(e) => {
              e.preventDefault();
              const input = e.target as HTMLInputElement;
              if (!/^\d*\.?\d*$/.test(input.value)) {
                input.value = '';
              }
            }}
            type="number"
            fullWidth
            required
            className="custom-textfield"
            size="small"
          />
        </div>
        <div className="form-row">
          <TextField
           margin="dense"
           label="Longitude"
           name="longitude"
           value={data.longitude !== null && data.longitude !== undefined ? data.longitude : ''}
           onChange={handleChange}
           onInput={(e) => {
             e.preventDefault();
             const input = e.target as HTMLInputElement;
             if (!/^\d*\.?\d*$/.test(input.value)) {
               input.value = '';
             }
           }}
           type="number"
           fullWidth
           required
           className="custom-textfield"
           size="small"
          />
          <div className="form-buttons">
            <Button
              onClick={handleSubmit}
              variant="contained"
              className="add-btn"
              disabled={isSubmitDisabled}
            >
              {id ? 'Update Airport' : 'Add Airport'}
            </Button>
            <Button
              onClick={handleCancel}
              variant="outlined"
              className="cancel-btn"
            >
              Cancel
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AirportForm;
