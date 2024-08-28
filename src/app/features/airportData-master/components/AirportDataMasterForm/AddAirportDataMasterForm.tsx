import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TextField, Button } from '@mui/material';
import {
  AirportMaster,
  fetchAirportMasterById,
  addAirportMaster,
  updateAirportMaster,
} from '../../api/AirportDataMasterAPI';
import './AirportDataMasterForm.css';

const AddAirportDataMasterForm: React.FC = () => {
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
    latitude: 0,
    longitude: 0,
  });
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);

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
    // Validate if all required fields are filled
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
        latitude &&
        longitude
      );
    };

    setIsSubmitDisabled(!validateFields());
  }, [data]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setData({ ...data, [name]: value });
  };

  const handleSubmit = async () => {
    try {
      const dataToSubmit = {
        ...data,
        latitude: Number(data.latitude),
        longitude: Number(data.longitude),
      };

      if (!id) {
        delete dataToSubmit._id;
        await addAirportMaster(dataToSubmit);
      } else {
        await updateAirportMaster(dataToSubmit);
      }
      navigate('/airportMaster');
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const handleCancel = () => {
    navigate('/airportMaster');
  };

  return (
    <div className="form-container-airport">
      <h2>{id ? 'Edit Airport' : 'Add Airport'}</h2>
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
          />
          <TextField
            margin="dense"
            label="Latitude"
            name="latitude"
            value={data.latitude}
            onChange={handleChange}
            fullWidth
            required
            className="custom-textfield"
          />
        </div>
        <div className="form-row">
          <TextField
            margin="dense"
            label="Longitude"
            name="longitude"
            value={data.longitude}
            onChange={handleChange}
            fullWidth
            required
            className="custom-textfield"
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

export default AddAirportDataMasterForm;
