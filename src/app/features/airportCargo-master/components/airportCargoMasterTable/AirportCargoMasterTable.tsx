import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, TablePagination } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { AirportCargo } from '../../api/AirportCargoMasterAPI';
import './AirportCargoMasterTable.css';

interface AirportCargoMasterTableProps {
  rows: AirportCargo[];
  onEdit: (cargo: AirportCargo) => void;
  onDelete: (id: string) => void;
  page: number;
  rowsPerPage: number;
  count: number;
  onPageChange: (event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => void;
  onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const AirportCargoMasterTable: React.FC<AirportCargoMasterTableProps> = ({
  rows,
  onEdit,
  onDelete,
  page,
  rowsPerPage,
  count,
  onPageChange,
  onRowsPerPageChange
}) => {
  return (
    <TableContainer className="airport-cargo-table-container">
      <Table className="airport-cargo-table">
        <TableHead>
          <TableRow>
            <TableCell className='head-cell'>ACO Code</TableCell>
            <TableCell className='head-cell'>ACO Name</TableCell>
            <TableCell className='head-cell'>ACO Address</TableCell>
            <TableCell className='head-cell'>Airport Code</TableCell>
            <TableCell className='head-cell'>Pincode</TableCell>
            <TableCell className='head-cell'>Email Id</TableCell>
            <TableCell className='head-cell'>Mobile Number</TableCell>
            <TableCell className='head-cell'>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map(row => (
            <TableRow key={row._id} className='body-row'>
              <TableCell className='body-cell'>{row.acoCode}</TableCell>
              <TableCell className='body-cell'>{row.acoName}</TableCell>
              <TableCell className='body-cell'>{row.acoAddress}</TableCell>
              <TableCell className='body-cell'>{row.airportCode}</TableCell>
              <TableCell className='body-cell'>{row.pincode}</TableCell>
              <TableCell className='body-cell'>{row.emailId}</TableCell>
              <TableCell className='body-cell'>{row.mobileNumber}</TableCell>
              <TableCell className='actions-cell'>
                <Button className="blue-icon-button" onClick={() => onEdit(row)}>
                  <EditIcon />
                </Button>
                <Button className="blue-icon-button" onClick={() => onDelete(row._id as string)}>
                  <DeleteIcon />
                </Button>
              </TableCell>
            </TableRow>
          ))}
         <TableRow>
  <TableCell colSpan={8} align="right" className="pagination-cell">
    <div className="pagination-wrapper">
      <TablePagination
        component="div"
        count={count}
        page={page}
        onPageChange={onPageChange}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={onRowsPerPageChange}
        rowsPerPageOptions={[5, 10, 50, 100]}
      />
    </div>
  </TableCell>
</TableRow>

        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default AirportCargoMasterTable;
