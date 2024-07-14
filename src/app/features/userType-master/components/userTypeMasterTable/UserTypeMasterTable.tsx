import React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import TableCell from '@mui/material/TableCell';
import Button from '@mui/material/Button';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { UserType } from '../../api/UserTypeMasterAPI';
import './UserTypeMasterTable.css'

interface UserTypeMasterTableProps {
  rows: UserType[];
  onEdit: (userType: UserType) => void;
  onDelete: (id: string) => void;
}

const UserTypeMasterTable: React.FC<UserTypeMasterTableProps> = ({ rows, onEdit, onDelete }) => {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell className='table-head-cell'>ID</TableCell>
            <TableCell className='table-head-cell'>User Type</TableCell>
            <TableCell className='table-head-cell'>Acc Flag</TableCell>
            <TableCell className='table-head-cell'>Edit</TableCell>
            <TableCell className='table-head-cell'>Delete</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row._id} className='styled-table-row'>
              <TableCell className='table-cell'>{row.id}</TableCell>
              <TableCell className='table-cell'>{row.userType}</TableCell>
              <TableCell className='table-cell'>{row.accFlag}</TableCell>
              <TableCell className='table-cell'>
                <Button className='blue-icon-button' onClick={() => onEdit(row)}>
                  <EditIcon />
                </Button>
              </TableCell>
              <TableCell className='table-cell'>
                <Button className='blue-icon-button' onClick={() => row._id && onDelete(row._id)}>
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

export default UserTypeMasterTable;
