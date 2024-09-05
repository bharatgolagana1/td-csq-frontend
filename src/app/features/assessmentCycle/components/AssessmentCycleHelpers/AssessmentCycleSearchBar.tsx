import React from 'react';
import { TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

const AssessmentCycleSearchBar: React.FC<{ onSearch: (query: string) => void }> = ({ onSearch }) => {
  return (
    <TextField
      variant="outlined"
      placeholder="Search by Customer Name"
      onChange={(e) => onSearch(e.target.value)}
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <SearchIcon/>
          </InputAdornment>
        ),
      }}
      margin="dense"
      size="small"
      sx={{width:'300px' , marginRight:'2rem' , marginLeft:'2rem'}}
    />
  );
};

export default AssessmentCycleSearchBar;
