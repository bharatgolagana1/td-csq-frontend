import React from 'react';
import { ButtonGroup, Button, MenuItem, Select, FormControl } from '@mui/material';

const UserFilters: React.FC<{ onFilter: (filterType: string) => void }> = ({ onFilter }) => {
  return (
    <div className="filter">
      <ButtonGroup
        variant="outlined"
        aria-label="filter options"
        className="button-group" 
      >
        <Button 
          onClick={() => onFilter('sampled')} 
          className="filter-button"
        >
          User Type
        </Button>

        <FormControl variant="outlined" className="dropdown">
          <Select
            defaultValue=""
            onChange={(e) => onFilter(e.target.value as string)}
            displayEmpty
          >
            <MenuItem value="" disabled>
              Newly Added
            </MenuItem>
            <MenuItem value="recent">Recently Added</MenuItem>
            <MenuItem value="lastWeek">Added Last Week</MenuItem>
            <MenuItem value="lastMonth">Added Last Month</MenuItem>
          </Select>
        </FormControl>

        <FormControl variant="outlined" className="dropdown">
          <Select
            defaultValue=""
            onChange={(e) => onFilter(e.target.value as string)}
            displayEmpty
          >
            <MenuItem value="" disabled>
              User Country
            </MenuItem>
            <MenuItem value="typeA">Type A</MenuItem>
            <MenuItem value="typeB">Type B</MenuItem>
            <MenuItem value="typeC">Type C</MenuItem>
          </Select>
        </FormControl>

        <FormControl variant="outlined" className="dropdown">
          <Select
            defaultValue=""
            onChange={(e) => onFilter(e.target.value as string)}
            displayEmpty
          >
            <MenuItem value="" disabled>
              Date
            </MenuItem>
            <MenuItem value="dateA">Date A</MenuItem>
            <MenuItem value="dateB">Date B</MenuItem>
            <MenuItem value="dateC">Date C</MenuItem>
          </Select>
        </FormControl>

        <Button 
          onClick={() => onFilter('reset')}
          className="reset-button"
        >
          Reset All
        </Button>
      </ButtonGroup>
    </div>
  );
};

export default UserFilters;
