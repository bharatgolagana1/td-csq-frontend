import React, { ChangeEvent } from 'react';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';

interface AirportCargoControllerProps {
  searchTerm: string;
  onSearchChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

const AirportCargoControls: React.FC<AirportCargoControllerProps> = ({
  searchTerm,
  onSearchChange,
}) => {
  return (
    <div className='airport-cargo-controller'>
      <TextField
        value={searchTerm}
        onChange={onSearchChange}
        placeholder='Search...'
        InputProps={{
          endAdornment: (
            <InputAdornment position='end'>
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />
    </div>
  );
};

export default AirportCargoControls;
