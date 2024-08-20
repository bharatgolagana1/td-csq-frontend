// components/PaginationComponent.tsx
import React from 'react';
import { TablePagination } from '@mui/material';

interface PaginationComponentProps {
  count: number;
  page: number;
  rowsPerPage: number;
  handleChangePage: (event: unknown, newPage: number) => void;
  handleChangeRowsPerPage: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const PaginationComponent: React.FC<PaginationComponentProps> = ({ count, page, rowsPerPage, handleChangePage, handleChangeRowsPerPage }) => {
  return (
    <TablePagination
      component="div"
      count={count}
      page={page}
      onPageChange={handleChangePage}
      rowsPerPage={rowsPerPage}
      onRowsPerPageChange={handleChangeRowsPerPage}
      rowsPerPageOptions={[5, 10, 50, 100]}
    />
  );
};

export default PaginationComponent;
