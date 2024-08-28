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
  Checkbox,
} from '@mui/material';
import DeleteIconSvg from '../../../../../asserts/svgs/deleteIconSvg.svg';
import AirportDataControls from '../AirportDataControls/AirportDataControls';
import AirportModal from '../AirportModal/AirportModal';
import './AirportDataMasterTable.css';
import { fetchAirportMasterById, updateAirportMaster } from '../../api/AirportDataMasterAPI';

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

const AirportDataMasterTable: React.FC<AirportDataMasterTableProps> = ({ rows, onEdit, onDelete }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [selectedAirport, setSelectedAirport] = useState<AirportMaster | null>(null);
  const [openModal, setOpenModal] = useState(false);

  const handleViewClick = async (id: string) => {
    try {
      const airport = await fetchAirportMasterById(id);
      setSelectedAirport(airport);
      setOpenModal(true);
    } catch (error) {
      console.error('Error fetching airport details:', error);
    }
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedAirport(null);
  };

  const handleEditFromModal = async () => {
    if (selectedAirport) {
      try {
        const updatedAirport = await updateAirportMaster(selectedAirport);
        onEdit(updatedAirport); // Update the table with the edited airport data
        setOpenModal(false);
      } catch (error) {
        console.error('Error updating airport details:', error);
      }
    }
  };

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

  const handleCheckboxChange = (id: string) => {
    setSelectedRows(prevSelected =>
      prevSelected.includes(id)
        ? prevSelected.filter(rowId => rowId !== id)
        : [...prevSelected, id]
    );
  };

  const filteredRows = rows.filter(
    row =>
      row.airportName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.airportCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.cityName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const paginatedRows = filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <div>
      <AirportDataControls searchQuery={searchQuery} onSearchChange={handleSearchChange} />
      {selectedRows.length > 0 && (
        <div className="selected-actions">
          <span>{selectedRows.length} selected</span>
          <Button
            className="delete-icon"
            onClick={() => selectedRows.forEach(id => onDelete(id))}
          >
            <img src={DeleteIconSvg} alt="Delete" />
          </Button>
          <Button
            className="close-icon"
            onClick={() => setSelectedRows([])}
          >
            X
          </Button>
        </div>
      )}
      <hr />
      <TableContainer component={Paper} className="airport-table">
        <Table aria-label="airport table">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={selectedRows.length > 0 && selectedRows.length < paginatedRows.length}
                  checked={selectedRows.length > 0 && selectedRows.length === paginatedRows.length}
                  onChange={(_e, checked) =>
                    setSelectedRows(checked ? paginatedRows.map(row => row._id!) : [])
                  }
                />
              </TableCell>
              <TableCell className="styled-table-head-cell-airport">Airport Code</TableCell>
              <TableCell className="styled-table-head-cell-airport">Airport Name</TableCell>
              <TableCell className="styled-table-head-cell-airport">City Code</TableCell>
              <TableCell className="styled-table-head-cell-airport">City Name</TableCell>
              <TableCell className="styled-table-head-cell-airport">Country Code</TableCell>
              <TableCell className="styled-table-head-cell-airport">Country Name</TableCell>
              <TableCell className="styled-table-head-cell-airport">Latitude</TableCell>
              <TableCell className="styled-table-head-cell-airport">Longitude</TableCell>
              <TableCell className="styled-table-cell-actions-airport">Details</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedRows.map(row => (
              <TableRow className="styled-table-row" key={row._id}>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedRows.includes(row._id!)}
                    onChange={() => handleCheckboxChange(row._id!)}
                  />
                </TableCell>
                <TableCell className="styled-table-cell-airport">{row.airportCode}</TableCell>
                <TableCell className="styled-table-cell-airport">{row.airportName}</TableCell>
                <TableCell className="styled-table-cell-airport">{row.cityCode}</TableCell>
                <TableCell className="styled-table-cell-airport">{row.cityName}</TableCell>
                <TableCell className="styled-table-cell-airport">{row.countryCode}</TableCell>
                <TableCell className="styled-table-cell-airport">{row.countryName}</TableCell>
                <TableCell className="styled-table-cell-airport">{row.latitude}</TableCell>
                <TableCell className="styled-table-cell-airport">{row.longitude}</TableCell>
                <TableCell className="styled-table-cell-actions-airport">
                  <Button onClick={() => handleViewClick(row._id!)}>View</Button>
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
      <AirportModal
        open={openModal}
        onClose={handleCloseModal}
        airport={selectedAirport}
        onEdit={handleEditFromModal}
      />
    </div>
  );
};

export default AirportDataMasterTable;
