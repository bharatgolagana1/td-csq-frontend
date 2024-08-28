import React, { useEffect, useState } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import TableCell from '@mui/material/TableCell';
import TablePagination from '@mui/material/TablePagination';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import IconButton from '@mui/material/IconButton';
import { UserMaster, fetchUserMasters } from '../../api/UserTypeMasterAPI';
import DeleteUser from '../userTableControls/DeleteUser';
import './UserTypeMasterTable.css';

interface UserMasterTableProps {
  onViewDetails: (id: string) => void;
}

const UserMasterTable: React.FC<UserMasterTableProps> = ({ onViewDetails }) => {
  const [rows, setRows] = useState<UserMaster[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [totalRows, setTotalRows] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchUserMasters();
        setRows(data);
        setTotalRows(data.length);
      } catch (error) {
        console.error('Error fetching user masters:', error);
      }
    };

    fetchData();
  }, []);

  const handleSelect = (id: string) => {
    setSelected(prevSelected =>
      prevSelected.includes(id) ? prevSelected.filter(item => item !== id) : [...prevSelected, id]
    );
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelecteds = rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => row._id!);
      setSelected(newSelecteds);
    } else {
      setSelected([]);
    }
  };

  const handleDeleteSelected = () => {
    setShowDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setShowDeleteDialog(false);
  };

  return (
    <Paper>
      {selected.length > 0 && (
        <div className="table-toolbar">
          <span className="selected-count">{selected.length} selected</span>
          <IconButton onClick={handleDeleteSelected} className='delete-icon'>
            delete
          </IconButton>
          <IconButton onClick={() => setSelected([])} className='close-icon'>
            X
          </IconButton>
        </div>
      )}
      <TableContainer>
        <Table>
          <TableHead className="user-master-table">
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={selected.length > 0 && selected.length < rowsPerPage}
                  checked={selected.length === rowsPerPage}
                  onChange={handleSelectAll}
                  color="primary"
                />
              </TableCell>
              <TableCell className='table-head-cell'>User ID</TableCell>
              <TableCell className='table-head-cell'>User Type</TableCell>
              <TableCell className='table-head-cell'>Name</TableCell>
              <TableCell className='table-head-cell'>Email</TableCell>
              <TableCell className='table-head-cell'>Mobile No.</TableCell>
              <TableCell className='table-head-cell'>Office Name</TableCell>
              <TableCell className='table-head-cell'>Office Address</TableCell>
              <TableCell className='table-head-cell'>City</TableCell>
              <TableCell className='table-head-cell'>Country</TableCell>
              <TableCell className='table-head-cell'>Details</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => (
              <TableRow key={row._id} className='styled-table-row'>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selected.includes(row._id!)}
                    onChange={() => handleSelect(row._id!)}
                    color="primary"
                  />
                </TableCell>
                <TableCell className='table-cell'>{row.userid}</TableCell>
                <TableCell className='table-cell'>{row.userType}</TableCell>
                <TableCell className='table-cell'>{row.userName}</TableCell>
                <TableCell className='table-cell'>{row.email}</TableCell>
                <TableCell className='table-cell'>{row.mobileNo}</TableCell>
                <TableCell className='table-cell'>{row.officeName}</TableCell>
                <TableCell className='table-cell'>{row.officeAddress}</TableCell>
                <TableCell className='table-cell'>{row.city}</TableCell>
                <TableCell className='table-cell'>{row.country}</TableCell>
                <TableCell className='table-cell'>
                  <Button
                    className='view-details-button'
                    onClick={() => onViewDetails(row._id!)}
                  >
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={totalRows}
        page={page}
        onPageChange={(_event, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(event) => {
          setRowsPerPage(parseInt(event.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={[5, 10, 25,50,100]}
      />

      <DeleteUser
        open={showDeleteDialog}
        onClose={handleCloseDeleteDialog}
        selected={selected}
        setSelected={setSelected}
        setRows={setRows}
      />
    </Paper>
  );
};

export default UserMasterTable;
