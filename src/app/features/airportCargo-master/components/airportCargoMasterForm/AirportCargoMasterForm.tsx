import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TextField, Button } from '@mui/material';
import { fetchAirportCargoById, addAirportCargo, updateAirportCargo, AirportCargo } from '../../api/AirportCargoMasterAPI';
import './AirportCargoMasterForm.css';

const AirportCargoMasterForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<AirportCargo>({
    _id: '',
    acoCode: '',
    acoName: '',
    acoAddress: '',
    airportCode: '',
    pincode: '',
    emailId: '',
    mobileNumber: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      if (id) {
        try {
          const result = await fetchAirportCargoById(id);
          setData(result);
        } catch (error) {
          console.error('Error fetching airport cargo data:', error);
        }
      }
    };
    fetchData();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setData({ ...data, [name]: value });
  };

  const handleSubmit = async () => {
    try {
      const dataToSubmit = { ...data };

      if (!id) {
        delete dataToSubmit._id;
        await addAirportCargo(dataToSubmit);
      } else {
        await updateAirportCargo(id, dataToSubmit);
      }
      navigate('/airportCargo');
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const handleCancel = () => {
    navigate('/airportCargo');
  };

  return (
    <div className="form-container">
      <h2>{id ? 'Edit Airport Cargo' : 'Add Airport Cargo'}</h2>
      <form className="airport-form" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} >
        <div className="form-row">
          <TextField
            margin="dense"
            label="ACO Code"
            name="acoCode"
            value={data.acoCode}
            onChange={handleChange}
            fullWidth
            required
          />
          <TextField
            margin="dense"
            label="ACO Name"
            name="acoName"
            value={data.acoName}
            onChange={handleChange}
            fullWidth
            required
          />
        </div>
        <div className="form-row">
          <TextField
            margin="dense"
            label="ACO Address"
            name="acoAddress"
            value={data.acoAddress}
            onChange={handleChange}
            fullWidth
            required
          />
          <TextField
            margin="dense"
            label="Airport Code"
            name="airportCode"
            value={data.airportCode}
            onChange={handleChange}
            fullWidth
            required
          />
        </div>
        <div className="form-row">
          <TextField
            margin="dense"
            label="Pincode"
            name="pincode"
            value={data.pincode}
            onChange={handleChange}
            fullWidth
            required
          />
          <TextField
            margin="dense"
            label="Email Id"
            name="emailId"
            value={data.emailId}
            onChange={handleChange}
            fullWidth
            required
          />
        </div>
        <div className="form-row">
          <TextField
            margin="dense"
            label="Mobile Number"
            name="mobileNumber"
            value={data.mobileNumber}
            onChange={handleChange}
            fullWidth
            required
          />
        </div>
        <div className='add-cancel-btns'>
          <div className='add-button'>
            <Button type="submit" variant="contained" color="primary" className='add-btn'>
              {id ? 'Update' : 'Add'}
            </Button>
          </div>
          <div className='cancel-button'>
            <Button onClick={handleCancel} variant="outlined" color="secondary">
              Cancel
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AirportCargoMasterForm;
