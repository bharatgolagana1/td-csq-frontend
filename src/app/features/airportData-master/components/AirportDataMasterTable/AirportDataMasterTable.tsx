import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TablePagination,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AirportDataControls from '../AirportDataControls/AirportDataControls';
import AddIcon from '@mui/icons-material/Add';
import './AirportDataMasterTable.css';

interface AirportMaster {
  _id?: string;
  airportCode: string;
  airportName: string;
  cityCode: string;
  cityName: string;
  countryCode: string;
  countryName: string;
  regionCode: string;
  regionName: string;
  latitude: number;
  longitude: number;
}

interface AirportDataMasterTableProps {
  rows: AirportMaster[];
  onEdit: (airport: AirportMaster) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

const AirportDataMasterTable: React.FC<AirportDataMasterTableProps> = ({ rows, onEdit, onDelete, onAdd }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setPage(0); // Reset to first page on new search
  };

  const handlePageChange = (_event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); 
  };

  const filteredRows = rows.filter((row) =>
    row.airportName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    row.airportCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    row.cityName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const paginatedRows = filteredRows.slice(page , page * rowsPerPage + rowsPerPage);

  return (
    <div>
      <AirportDataControls searchQuery={searchQuery} onSearchChange={handleSearchChange} />
      <div className='action-buttons'>
        <Button className="add-airport-button" variant="contained" onClick={onAdd} startIcon={<AddIcon />}>
          Add Airport
        </Button>
      </div>
      <TableContainer component={Paper} className="airport-table">
        <Table aria-label="airport table">
          <TableHead>
            <TableRow>
              <TableCell className="styled-table-head-cell-airport">Airport Code</TableCell>
              <TableCell className="styled-table-head-cell-airport">Airport Name</TableCell>
              <TableCell className="styled-table-head-cell-airport">City Code</TableCell>
              <TableCell className="styled-table-head-cell-airport">City Name</TableCell>
              <TableCell className="styled-table-head-cell-airport">Country Code</TableCell>
              <TableCell className="styled-table-head-cell-airport">Country Name</TableCell>
              <TableCell className="styled-table-head-cell-airport">Region Code</TableCell>
              <TableCell className="styled-table-head-cell-airport">Region Name</TableCell>
              <TableCell className="styled-table-head-cell-airport">Latitude</TableCell>
              <TableCell className="styled-table-head-cell-airport">Longitude</TableCell>
              <TableCell className="styled-table-head-cell-airport">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedRows.map((row) => (
              <TableRow className="styled-table-row" key={row._id}>
                <TableCell className="styled-table-cell-airport">{row.airportCode}</TableCell>
                <TableCell className="styled-table-cell-airport">{row.airportName}</TableCell>
                <TableCell className="styled-table-cell-airport">{row.cityCode}</TableCell>
                <TableCell className="styled-table-cell-airport">{row.cityName}</TableCell>
                <TableCell className="styled-table-cell-airport">{row.countryCode}</TableCell>
                <TableCell className="styled-table-cell-airport">{row.countryName}</TableCell>
                <TableCell className="styled-table-cell-airport">{row.regionCode}</TableCell>
                <TableCell className="styled-table-cell-airport">{row.regionName}</TableCell>
                <TableCell className="styled-table-cell-airport">{row.latitude}</TableCell>
                <TableCell className="styled-table-cell-airport">{row.longitude}</TableCell>
                <TableCell className="styled-table-cell-airport styled-table-cell-actions">
                  <Button className="blue-icon-button" onClick={() => onEdit(row)}>
                    <EditIcon />
                  </Button>
                  {row._id && (
                    <Button className="red-icon-button" onClick={() => onDelete(row._id!)}>
                      <DeleteIcon />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={filteredRows.length}
          page={page}
          onPageChange={handlePageChange}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleRowsPerPageChange}
          rowsPerPageOptions={[5, 10, 50, 100]}
        />
      </TableContainer>
    </div>
  );
};

export default AirportDataMasterTable;
