import React, { useEffect, useState } from 'react';
import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  Radio,
  RadioGroup,
  FormHelperText,
} from '@mui/material';
import { SelectChangeEvent as MUISelectChangeEvent } from '@mui/material/Select';
import './AssessDetails.css';

interface FormData {
  userType: string;
  ctoCode: string;
  nonMember: boolean;
  accountOwner: string;
  airport: string;
  ctoName: string;
  region: string;
  ctoMarketShare: number;
  referredBy: string;
}

type InputChangeEvent = React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>;
type SelectChangeEvent = MUISelectChangeEvent<string>;
type CheckboxChangeEvent = React.ChangeEvent<HTMLInputElement>;

interface Props {
    handleChange: (e: InputChangeEvent | CheckboxChangeEvent) => void;
    formData: FormData;
    errors: Record<string, string>;
  }
  
const isFormDataKey = (key: string): key is keyof FormData => {
  return [
    'userType',
    'ctoCode',
    'nonMember',
    'accountOwner',
    'airport',
    'ctoName',
    'region',
    'ctoMarketShare',
    'referredBy',
  ].includes(key);
};

const AssessDetails: React.FC<Props> = ({ handleChange, formData, errors }) => {
  const [userTypeOptions, setUserTypeOptions] = useState<string[]>([]);
  const [airportOptions, setAirportOptions] = useState<string[]>([]);
  const regionOptions = ['North America', 'South America', 'Europe', 'Asia', 'Africa', 'Australia'];

  useEffect(() => {
    const fetchUserTypes = async () => {
      try {
        const response = await fetch('http://localhost:5000/user/data');
        const data = await response.json();
        const userTypeOptions = data.map((item: { userType: string }) => item.userType);
        setUserTypeOptions(userTypeOptions || []);
      } catch (error) {
        console.error('Error fetching user types:', error);
      }
    };

    const fetchAirports = async () => {
      try {
        const response = await fetch('http://localhost:5000/air/airports');
        const data = await response.json();

        const airportOptions = data.map((item: { airportName: string }) => item.airportName);
        setAirportOptions(airportOptions || []);
      } catch (error) {
        console.error('Error fetching airports:', error);
      }
    };

    fetchUserTypes();
    fetchAirports();
  }, []);

  return (
    <div>
      <h2 className="personal">Access Details</h2>
      <div className="form-section">
        <FormControl fullWidth error={!!errors.userType} margin="normal">
          <InputLabel>User Type</InputLabel>
          <Select
            name="userType"
            value={formData.userType || ''}
            onChange={handleChange as (e: SelectChangeEvent) => void}
          >
            <MenuItem value="">Select User Type</MenuItem>
            {userTypeOptions.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
          {errors.userType && <FormHelperText>{errors.userType}</FormHelperText>}
        </FormControl>

        <TextField
          label="CTO Code"
          name="ctoCode"
          value={formData.ctoCode || ''}
          onChange={handleChange as (e: InputChangeEvent) => void}
          variant="standard"
          fullWidth
          margin="normal"
          error={!!errors.ctoCode}
          helperText={errors.ctoCode}
        />

        <FormControlLabel
          control={
            <Checkbox
              name="nonMember"
              checked={formData.nonMember || false}
              onChange={handleChange as (e: CheckboxChangeEvent) => void}
            />
          }
          label="Non Member"
        />

        <FormControl component="fieldset" error={!!errors.accountOwner} margin="normal">
          <RadioGroup
            row
            name="accountOwner"
            value={formData.accountOwner || ''}
            onChange={handleChange as (e: InputChangeEvent) => void}
          >
            <FormControlLabel value="Self" control={<Radio />} label="Self" />
            <FormControlLabel value="Airport" control={<Radio />} label="Airport" />
          </RadioGroup>
          {errors.accountOwner && <FormHelperText>{errors.accountOwner}</FormHelperText>}
        </FormControl>

        <FormControl fullWidth error={!!errors.region} margin="normal">
          <InputLabel>Region</InputLabel>
          <Select
            name="region"
            value={formData.region || ''}
            onChange={handleChange as (e: SelectChangeEvent) => void}
          >
            <MenuItem value="">Select Region</MenuItem>
            {regionOptions.map((region) => (
              <MenuItem key={region} value={region}>
                {region}
              </MenuItem>
            ))}
          </Select>
          {errors.region && <FormHelperText>{errors.region}</FormHelperText>}
        </FormControl>

        <FormControl fullWidth error={!!errors.airport} margin="normal">
          <InputLabel>Airport</InputLabel>
          <Select
            name="airport"
            value={formData.airport || ''}
            onChange={handleChange as (e: SelectChangeEvent) => void}
          >
            <MenuItem value="">Select Airport</MenuItem>
            {airportOptions.map((airport) => (
              <MenuItem key={airport} value={airport}>
                {airport}
              </MenuItem>
            ))}
          </Select>
          {errors.airport && <FormHelperText>{errors.airport}</FormHelperText>}
        </FormControl>

        {[
          { label: 'CTO Name', name: 'ctoName' },
          { label: 'Referred By', name: 'referredBy' },
          { label: 'CTO Market Share %', name: 'ctoMarketShare', type: 'number' as const },
        ].map(({ label, name, type = 'text' }) => (
          isFormDataKey(name) && (
            <TextField
              key={name}
              label={label}
              name={name}
              type={type}
              value={formData[name] || ''}
              onChange={handleChange as (e: InputChangeEvent) => void}
              fullWidth
              variant="standard"
              margin="normal"
              error={!!errors[name]}
              helperText={errors[name]}
            />
          )
        ))}
      </div>
    </div>
  );
};

export default AssessDetails;
