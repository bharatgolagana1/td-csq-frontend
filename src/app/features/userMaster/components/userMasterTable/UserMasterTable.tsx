import React from 'react';
import { Button, Checkbox, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { User } from '../types';
import './UserMasterTable.css';

interface UserMasterTableProps {
  users: User[];
  selectedUsers: string[];
  handleSelect: (id: string) => void;
  handleSelectAll: () => void;
  onViewClick: (user: User) => void; // Add this prop
}

const UserMasterTable: React.FC<UserMasterTableProps> = ({
  users,
  selectedUsers,
  handleSelect,
  handleSelectAll,
  onViewClick, // Destructure the new prop
}) => {
  return (
    <TableContainer className="user-table-container">
      <Table className="user-table">
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox" className="user-table-cell-header">
              <Checkbox
                className="select-all-checkbox"
                indeterminate={selectedUsers.length > 0 && selectedUsers.length < users.length}
                checked={users.length > 0 && selectedUsers.length === users.length}
                onChange={handleSelectAll}
              />
            </TableCell>
            <TableCell className="user-table-cell-header">User ID</TableCell>
            <TableCell className="user-table-cell-header">User Type</TableCell>
            <TableCell className="user-table-cell-header">User Name</TableCell>
            <TableCell className="user-table-cell-header">Email</TableCell>
            <TableCell className="user-table-cell-header">Mobile No</TableCell>
            <TableCell className="user-table-cell-header">Office Name</TableCell>
            <TableCell className="user-table-cell-header">Office Address</TableCell>
            <TableCell className="user-table-cell-header">City</TableCell>
            <TableCell className="user-table-cell-header">Country</TableCell>
            <TableCell className="user-table-cell-header">View</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((user) => (
            <TableRow
              key={user._id}
              hover
              className="user-table-row"
              onClick={() => handleSelect(user._id)} // Row click will toggle checkbox
              style={{ cursor: 'pointer' }} // Adds a pointer cursor to indicate row is clickable
            >
              <TableCell padding="checkbox" className="user-table-cell-body" onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  className="user-checkbox"
                  checked={selectedUsers.includes(user._id)}
                  onChange={() => handleSelect(user._id)}
                />
              </TableCell>
              <TableCell className="user-table-cell-body">{user.userid}</TableCell>
              <TableCell className="user-table-cell-body">{user.userType}</TableCell>
              <TableCell className="user-table-cell-body">{user.userName}</TableCell>
              <TableCell className="user-table-cell-body">{user.email}</TableCell>
              <TableCell className="user-table-cell-body">{user.mobileNo}</TableCell>
              <TableCell className="user-table-cell-body">{user.officeName}</TableCell>
              <TableCell className="user-table-cell-body">{user.officeAddress}</TableCell>
              <TableCell className="user-table-cell-body">{user.city}</TableCell>
              <TableCell className="user-table-cell-body">{user.country}</TableCell>
              <TableCell className="user-table-cell-body">
                <Button
                  className="view-button"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent the row click event
                    onViewClick(user);
                  }}
                >
                  View
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default UserMasterTable;
