import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { AirportCargo } from '../../api/AirportCargoMasterAPI';
import './AirportCargoMasterTable.css'

interface AirportCargoMasterTableProps {
  rows: AirportCargo[];
  onEdit: (cargo: AirportCargo) => void;
  onDelete: (id: string) => void;
}

const AirportCargoMasterTable: React.FC<AirportCargoMasterTableProps> = ({ rows, onEdit, onDelete }) => {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell className='styled-table-head-cell'>ACO Code</TableCell>
            <TableCell className='styled-table-head-cell'>ACO Name</TableCell>
            <TableCell className='styled-table-head-cell'>ACO Address</TableCell>
            <TableCell className='styled-table-head-cell'>Airport Code</TableCell>
            <TableCell className='styled-table-head-cell'>Pincode</TableCell>
            <TableCell className='styled-table-head-cell'>Email Id</TableCell>
            <TableCell className='styled-table-head-cell'>Mobile Number</TableCell>
            <TableCell className='styled-table-head-cell'>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map(row => (
            <TableRow key={row._id} className='styled-table-row'>
              <TableCell className='.styled-table-cell'>{row.acoCode}</TableCell>
              <TableCell className='.styled-table-cell'>{row.acoName}</TableCell>
              <TableCell className='.styled-table-cell'>{row.acoAddress}</TableCell>
              <TableCell className='.styled-table-cell'>{row.airportCode}</TableCell>
              <TableCell className='.styled-table-cell'>{row.pincode}</TableCell>
              <TableCell className='.styled-table-cell'>{row.emailId}</TableCell>
              <TableCell className='.styled-table-cell'>{row.mobileNumber}</TableCell>
              <TableCell>
                <Button onClick={() => onEdit(row)}>
                  <EditIcon />
                </Button>
                <Button onClick={() => onDelete(row._id as string)}>
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

export default AirportCargoMasterTable;
