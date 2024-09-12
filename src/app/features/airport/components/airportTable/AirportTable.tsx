import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Checkbox,
} from '@mui/material';
import './AirportTable.css';
import { AirportMaster } from '../../api/AirportAPI';

interface AirportDataMasterTableProps {
  rows: AirportMaster[];
  selectedRows: string[];
  onCheckboxChange: (id: string) => void;
  onViewClick: (id: string) => void;
}

const AirportTable: React.FC<AirportDataMasterTableProps> = ({
  rows,
  selectedRows,
  onCheckboxChange,
  onViewClick,
}) => {
  const handleRowClick = (id: string) => {
    // Toggle checkbox state for the clicked row
    onCheckboxChange(id);
  };

  const handleHeaderCheckboxChange = (_e: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
    if (checked) {
      // Select all rows
      rows.forEach(row => onCheckboxChange(row._id!));
    } else {
      // Deselect all rows
      rows.forEach(row => onCheckboxChange(row._id!));
    }
  };

  return (
    <TableContainer className="airport-table">
      <Table aria-label="airport table">
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox">
              <Checkbox
                indeterminate={selectedRows.length > 0 && selectedRows.length < rows.length}
                checked={selectedRows.length > 0 && selectedRows.length === rows.length}
                onChange={handleHeaderCheckboxChange}
              />
            </TableCell>
            <TableCell className="styled-table-head-cell-airport">Airport Code</TableCell>
            <TableCell className="styled-table-head-cell-airport">Airport Name</TableCell>
            <TableCell className="styled-table-head-cell-airport">City Code</TableCell>
            <TableCell className="styled-table-head-cell-airport">City Name</TableCell>
            <TableCell className="styled-table-head-cell-airport">Country Code</TableCell>
            <TableCell className="styled-table-head-cell-airport">Country Name</TableCell>
            <TableCell className="styled-table-head-cell-airport">Details</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map(row => (
            <TableRow
              className="styled-table-row"
              key={row._id}
              onClick={() => handleRowClick(row._id!)} // Handle row click for checkbox selection
              style={{ cursor: 'pointer' }}
            >
              <TableCell padding="checkbox" onClick={e => e.stopPropagation()}> {/* Prevent row click for checkbox */}
                <Checkbox
                  checked={selectedRows.includes(row._id!)}
                  onChange={() => onCheckboxChange(row._id!)}
                />
              </TableCell>
              <TableCell className="styled-table-cell-airport">{row.airportCode}</TableCell>
              <TableCell className="styled-table-cell-airport">{row.airportName}</TableCell>
              <TableCell className="styled-table-cell-airport">{row.cityCode}</TableCell>
              <TableCell className="styled-table-cell-airport">{row.cityName}</TableCell>
              <TableCell className="styled-table-cell-airport">{row.countryCode}</TableCell>
              <TableCell className="styled-table-cell-airport">{row.countryName}</TableCell>
              <TableCell className="styled-table-cell-actions-airport" onClick={e => e.stopPropagation()}>
                <Button onClick={() => onViewClick(row._id!)}>View</Button> {/* Prevent row click on View */}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default AirportTable;
