import React from 'react';
import { ButtonGroup, Button } from '@mui/material';

const FilterOptions: React.FC<{ onFilter: (filterType: string) => void }> = ({ onFilter }) => {
  return (
    <ButtonGroup variant="outlined" color="primary">
      <Button onClick={() => onFilter('sampled')}>Sampled</Button>
      <Button onClick={() => onFilter('newlyAdded')}>Newly Added</Button>
      <Button onClick={() => onFilter('customerType')}>Customer Type</Button>
      <Button onClick={() => onFilter('sampledDate')}>Sampled Date</Button>
      <Button onClick={() => onFilter('reset')}>Reset All</Button>
    </ButtonGroup>
  );
};

export default FilterOptions;
