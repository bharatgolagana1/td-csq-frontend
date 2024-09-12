import React from 'react';
import { TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
interface AirportDataControlsProps {
  searchQuery: string;
  onSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}
const AirportSearchbar: React.FC<AirportDataControlsProps> = ({ searchQuery, onSearchChange }) => {
  return (
    <div className="airport-data-controls">
      <TextField
        label="Search Airports by Airport Id, Airport Name, City Code, City Name, Country Code, Country Name"
        variant="outlined"
        value={searchQuery}
        onChange={onSearchChange}
        margin="dense"
        size="small"
        fullWidth
        InputProps={{
            endAdornment : (
            <InputAdornment position="end">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
        sx={{width:'75%' , marginLeft:'2rem'}}
      />
    </div>
  );
};
export default AirportSearchbar;