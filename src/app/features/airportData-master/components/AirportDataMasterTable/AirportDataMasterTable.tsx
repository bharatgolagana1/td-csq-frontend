import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import './AirportDataMasterTable.css';

interface AirportMaster {
  _id: string;
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
}

const AirportDataMasterTable: React.FC<AirportDataMasterTableProps> = ({ rows, onEdit, onDelete }) => {
  return (
    <TableContainer component={Paper}>
      <Table aria-label="airport table">
        <TableHead>
          <TableRow>
            <TableCell className="styled-table-head-cell">Airport Code</TableCell>
            <TableCell className="styled-table-head-cell">Airport Name</TableCell>
            <TableCell className="styled-table-head-cell">City Code</TableCell>
            <TableCell className="styled-table-head-cell">City Name</TableCell>
            <TableCell className="styled-table-head-cell">Country Code</TableCell>
            <TableCell className="styled-table-head-cell">Country Name</TableCell>
            <TableCell className="styled-table-head-cell">Region Code</TableCell>
            <TableCell className="styled-table-head-cell">Region Name</TableCell>
            <TableCell className="styled-table-head-cell">Latitude</TableCell>
            <TableCell className="styled-table-head-cell">Longitude</TableCell>
            <TableCell className="styled-table-head-cell">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow className="styled-table-row" key={row._id}>
              <TableCell className="styled-table-cell">{row.airportCode}</TableCell>
              <TableCell className="styled-table-cell">{row.airportName}</TableCell>
              <TableCell className="styled-table-cell">{row.cityCode}</TableCell>
              <TableCell className="styled-table-cell">{row.cityName}</TableCell>
              <TableCell className="styled-table-cell">{row.countryCode}</TableCell>
              <TableCell className="styled-table-cell">{row.countryName}</TableCell>
              <TableCell className="styled-table-cell">{row.regionCode}</TableCell>
              <TableCell className="styled-table-cell">{row.regionName}</TableCell>
              <TableCell className="styled-table-cell">{row.latitude}</TableCell>
              <TableCell className="styled-table-cell">{row.longitude}</TableCell>
              <TableCell className="styled-table-cell styled-table-cell-actions">
                <Button className="blue-icon-button" onClick={() => onEdit(row)}>
                  <EditIcon />
                </Button>
                <Button className="red-icon-button" onClick={() => onDelete(row._id)}>
                  <DeleteIcon />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default AirportDataMasterTable;
