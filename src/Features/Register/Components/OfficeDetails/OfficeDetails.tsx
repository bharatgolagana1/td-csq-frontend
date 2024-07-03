import React from 'react';
import { TextField } from '@mui/material';
import './OfficeDetails.css';

interface Props {
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  formData: any;
  errors: any;
}

const OfficeDetails: React.FC<Props> = ({ handleChange, formData, errors }) => {
  return (
    <div>
      <h2 className='office'>Office Details</h2>
      <div className="form-section">
        {[
          { label: 'Country', name: 'country' },
          { label: 'Office Name', name: 'officeName' },
          { label: 'Office Address', name: 'officeAddress' },
          { label: 'City', name: 'city' },
          { label: 'Zip/Postal Code', name: 'zipCode' },
          { label: 'Mobile Number', name: 'mobileNumber' },
          { label: 'Email', name: 'emailId', type: 'email' },
          { label: 'Business Phone', name: 'businessPhone' },
        ].map(({ label, name, type = 'text' }) => (
          <div className="form-group half-width" key={name}>
            <TextField
              label={label}
              name={name}
              type={type}
              value={formData[name] || ''}
              onChange={handleChange}
              variant="standard"
              fullWidth
              margin="normal"
              error={!!errors[name]}
              helperText={errors[name] || ''}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default OfficeDetails;
