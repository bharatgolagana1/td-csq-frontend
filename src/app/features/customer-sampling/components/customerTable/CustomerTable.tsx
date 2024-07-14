import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Checkbox, IconButton } from '@mui/material';
import { Customer } from '../types/Types';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import './CustomerTable.css'
interface CustomerTableProps {
  rows: Customer[];
  handleEdit: (customer: Customer) => void;
  handleDelete: (id: string) => void;
  handleSelect: (id: string) => void;
}

const CustomerTable: React.FC<CustomerTableProps> = ({ rows, handleEdit, handleDelete, handleSelect }) => {
  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell className='style-table-head-cell' >Select</TableCell>
            <TableCell className='style-table-head-cell' >Customer Type</TableCell>
            <TableCell className='style-table-head-cell' >Customer Name</TableCell>
            <TableCell className='style-table-head-cell' >Email</TableCell>
            <TableCell className='style-table-head-cell' >Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row._id} onClick={() => handleSelect(row._id)} hover>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={row.selectBox || false}
                  onChange={() => handleSelect(row._id)}
                  onClick={(e) => e.stopPropagation()} // Prevents triggering row click when checkbox is clicked
                />
              </TableCell>
              <TableCell>{row.customerType}</TableCell>
              <TableCell>{row.customerName}</TableCell>
              <TableCell>{row.email}</TableCell>
              <TableCell>
                <IconButton onClick={(e) => { e.stopPropagation(); handleEdit(row); }} className='icon-button'>
                  <EditIcon />
                </IconButton>
                <IconButton onClick={(e) => { e.stopPropagation(); handleDelete(row._id); }} className='icon-button'>
                  <DeleteIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default CustomerTable;
