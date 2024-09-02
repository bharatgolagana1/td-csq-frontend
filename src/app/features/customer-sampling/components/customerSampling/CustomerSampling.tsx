import React, { useState, useEffect } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Paper,
  TableContainer,
  IconButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import {
  deleteCustomer,
  fetchCustomers,
  Customer,
} from '../../api/CustomerSamplingAPI';
import { useNavigate } from 'react-router-dom';
import CustomerSamplingTable from '../customerSamplingTable/CustomerSamplingTable';
import CustomerSamplingSkeleton from '../customerSamplingHelpers/CustomerSamplingSkeleton';
import AlertMessage from '../customerSamplingHelpers/AlertMessage';
import FilterOptions from '../customerSamplingHelpers/FilterOptions';
import SearchbarComponent from '../customerSamplingHelpers/SearchbarComponent';
import './CustomerSampling.css';

const CustomerSampling: React.FC = () => {
  const [rows, setRows] = useState<Customer[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [openDelete, setOpenDelete] = useState(false);
  const [openGroupDelete, setOpenGroupDelete] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [queryStatus, setQueryStatus] = useState<'loading' | 'error' | 'success'>('loading');
  const [showSelectionBar, setShowSelectionBar] = useState<boolean>(false);
  const [alertOpen, setAlertOpen] = useState<boolean>(false);
  const [alertMessage, setAlertMessage] = useState<string>('');
  const [, setFilterType] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setQueryStatus('loading');
      try {
        const customers = await fetchCustomers();
        setRows(customers);
        setQueryStatus('success');
      } catch (error) {
        setQueryStatus('error');
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    setShowSelectionBar(selectedCustomers.length > 0);
  }, [selectedCustomers]);

  const handleAdd = () => {
    navigate('add-customer')
  }

  const handleDelete = (id: string) => {
    setDeleteId(id);
    setOpenDelete(true);
  };

  const confirmDelete = async () => {
    if (deleteId) {
      await deleteCustomer(deleteId);
      setRows(rows.filter((row) => row._id !== deleteId));
      setOpenDelete(false);
      setDeleteId(null);
    }
  };

  const handleCloseDelete = () => {
    setOpenDelete(false);
    setDeleteId(null);
  };

  const confirmGroupDelete = async () => {
    try {
      await Promise.all(selectedCustomers.map((id) => deleteCustomer(id)));
      setRows(rows.filter((row) => !selectedCustomers.includes(row._id)));
      setAlertMessage(`${selectedCustomers.length} users deleted successfully.`);
      setAlertOpen(true);
      setOpenGroupDelete(false);
      setSelectedCustomers([]);
    } catch (error) {
      console.error('Error deleting customers:', error);
    }
  };

  const handleCloseGroupDelete = () => {
    setOpenGroupDelete(false);
    setSelectedCustomers([]);
  };

  const handleSelect = (id: string) => {
    setSelectedCustomers((prevSelected) =>
      prevSelected.includes(id)
        ? prevSelected.filter((selectedId) => selectedId !== id)
        : [...prevSelected, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedCustomers((prevSelected) =>
      prevSelected.length === rows.length ? [] : rows.map((row) => row._id)
    );
  };

  const handleFilter = (filterType: string) => {
    setFilterType(filterType);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const renderError = () => (
    <div className="error-message">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="100"
        height="100"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <p>Error fetching data. Please try again later.</p>
    </div>
  );

  const renderNoData = () => (
    <div className="no-data-message">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="100"
        height="100"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <p>No data available.</p>
    </div>
  );

  const filteredRows = rows.filter((row) => {
    return row.customerName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="customer">
      <div className="button-row">
        <h2 className="customer-sampling">Customer Sampling</h2>
        <Button
          className="add-button-customer-sampling"
          onClick={handleAdd}
          startIcon={<AddIcon />}
        >
          Add Customer
        </Button>
      </div>

      <div className="filter-search-container">
      <SearchbarComponent onSearch={handleSearch} />
        <FilterOptions onFilter={handleFilter} />
      </div>
      {showSelectionBar && (
        <div className="selection-bar">
          <span>{selectedCustomers.length} selected</span>
          <IconButton
            className="delete-button"
            onClick={() => setOpenGroupDelete(true)}
            aria-label="delete"
          >
            <span>Delete</span>
            <DeleteIcon />
          </IconButton>
          <IconButton
            className="close-button"
            onClick={() => setSelectedCustomers([])}
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
        </div>
      )}

      {alertOpen && (
        <AlertMessage
          open={alertOpen}
          message={alertMessage}
          onClose={() => setAlertOpen(false)}
        />
      )}

      {queryStatus === 'loading' && <CustomerSamplingSkeleton />}
      {queryStatus === 'error' && renderError()}
      {queryStatus === 'success' && filteredRows.length < 1 && renderNoData()}
      {queryStatus === 'success' && filteredRows.length > 0 && (
        <TableContainer component={Paper}>
          <CustomerSamplingTable
            rows={filteredRows}
            selectedCustomers={selectedCustomers}
            handleSelect={handleSelect}
            handleSelectAll={handleSelectAll}
            handleDelete={handleDelete}
            handleGroupDelete={confirmGroupDelete}
          />
        </TableContainer>
      )}

      <Dialog open={openDelete} onClose={handleCloseDelete}>
        <DialogTitle>{'Delete Customer'}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this customer?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDelete} color="primary">
            Cancel
          </Button>
          <Button onClick={confirmDelete} color="secondary">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={openGroupDelete} onClose={handleCloseGroupDelete}>
        <DialogTitle>{'Delete Selected Customers'}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the selected customers?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseGroupDelete} color="primary">
            Cancel
          </Button>
          <Button onClick={confirmGroupDelete} color="secondary">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default CustomerSampling;
