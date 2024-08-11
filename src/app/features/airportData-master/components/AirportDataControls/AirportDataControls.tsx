import React from 'react';
import { TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import './AirportDataControls.css'

interface AirportDataControlsProps {
  searchQuery: string;
  onSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const AirportDataControls: React.FC<AirportDataControlsProps> = ({ searchQuery, onSearchChange }) => {
  return (
    <div className="airport-data-controls">
      <TextField
        label="Search Airports"
        variant="outlined"
        value={searchQuery}
        onChange={onSearchChange}
        InputProps={{
            endAdornment : (
            <InputAdornment position="end">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />
    </div>
  );
};

export default AirportDataControls;
