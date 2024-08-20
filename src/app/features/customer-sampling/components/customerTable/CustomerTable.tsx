import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Checkbox, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { Customer } from '../types/Types';
import './CustomerTable.css';

interface CustomerTableProps {
  rows: Customer[];
  handleEdit: (customer: Customer) => void;
  handleDelete: (id: string) => void;
  handleSelect: (id: string) => void;
  handleSelectAll: () => void;
  handleGroupDelete: () => void;
}

const CustomerTable: React.FC<CustomerTableProps> = ({ rows, handleSelect, handleSelectAll }) => {
  const [selectAll, setSelectAll] = useState(false);

  const handleToggleSelectAll = () => {
    setSelectAll(!selectAll);
    handleSelectAll();
  };

  return (
    <TableContainer className="customer-sampling">
      <Table>
        <TableHead>
          <TableRow>
            <TableCell className="sampling-style-table-head-cell">Select </TableCell>
            <TableCell className="sampling-style-table-head-cell">Customer Type</TableCell>
            <TableCell className="sampling-style-table-head-cell">Customer Name</TableCell>
            <TableCell className="sampling-style-table-head-cell">Email</TableCell>
            <TableCell className="sampling-style-table-head-cell">Sampled Date</TableCell>
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
              <TableCell className='sampling-style-table-body-cell'>{row.customerType}</TableCell>
              <TableCell className='sampling-style-table-body-cell'>{row.customerName}</TableCell>
              <TableCell className='sampling-style-table-body-cell'>{row.email}</TableCell>
              <TableCell className='sampling-style-table-body-cell'>{row.sampledDate ? new Date(row.sampledDate).toLocaleDateString() : 'N/A'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default CustomerTable;
