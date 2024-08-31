import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Checkbox } from '@mui/material';
import { Customer } from '../../api/CustomerSamplingAPI';
import './CustomerSamplingTable.css';

interface CustomerSamplingTableProps {
    rows: Customer[];
    selectedCustomers: string[];
    handleSelect: (id: string) => void;
    handleSelectAll: () => void;
    handleDelete: (id: string) => void;
    handleGroupDelete: () => void;
}
  

const CustomerSamplingTable: React.FC<CustomerSamplingTableProps> = ({
  rows,
  selectedCustomers,
  handleSelect,
  handleSelectAll,
}) => {
  // Function to format the date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <TableContainer>
      <Table>
        <TableHead className="customer-sampling">
          <TableRow>
            <TableCell padding="checkbox" className="sampling-style-table-head-cell">
              <Checkbox
                indeterminate={selectedCustomers.length > 0 && selectedCustomers.length < rows.length}
                checked={rows.length > 0 && selectedCustomers.length === rows.length}
                onChange={handleSelectAll}
              />
            </TableCell>
            <TableCell className="sampling-style-table-head-cell">Customer Type</TableCell>
            <TableCell className="sampling-style-table-head-cell">Customer Name</TableCell>
            <TableCell className="sampling-style-table-head-cell">Email</TableCell>
            <TableCell className="sampling-style-table-head-cell">Sampled Date</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row._id} hover onClick={() => handleSelect(row._id)}>
              <TableCell padding="checkbox" className="sampling-style-table-body-cell">
                <Checkbox checked={selectedCustomers.includes(row._id)} />
              </TableCell>
              <TableCell className="sampling-style-table-body-cell">{row.customerType}</TableCell>
              <TableCell className="sampling-style-table-body-cell">{row.customerName}</TableCell>
              <TableCell className="sampling-style-table-body-cell">{row.email}</TableCell>
              <TableCell className="sampling-style-table-body-cell">
                {formatDate(row.sampledDate)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default CustomerSamplingTable;
