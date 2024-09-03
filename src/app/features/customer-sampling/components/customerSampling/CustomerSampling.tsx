import React, { useState, useEffect } from 'react';
import { Button, Paper, TableContainer, IconButton, CircularProgress, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import { deleteCustomer, fetchCustomers, Customer, updateCustomer } from '../../api/CustomerSamplingAPI';
import { useNavigate } from 'react-router-dom';
import CustomerSamplingTable from '../customerSamplingTable/CustomerSamplingTable';
import CustomerSamplingSkeleton from '../customerSamplingHelpers/CustomerSamplingSkeleton';
import AlertMessage from '../customerSamplingHelpers/AlertMessage';
import FilterOptions from '../customerSamplingHelpers/FilterOptions';
import SearchbarComponent from '../customerSamplingHelpers/SearchbarComponent';
import CustomerSamplingDialogs from '../customerSamplingHelpers/CustomerSamplingDialogs';
import './CustomerSampling.css';

const CustomerSampling: React.FC = () => {
  const [rows, setRows] = useState<Customer[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [openDelete, setOpenDelete] = useState(false);
  const [openGroupDelete, setOpenGroupDelete] = useState(false);
  const [openSampleDialog, setOpenSampleDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [queryStatus, setQueryStatus] = useState<'loading' | 'error' | 'success'>('loading');
  const [showSelectionBar, setShowSelectionBar] = useState<boolean>(false);
  const [alertOpen, setAlertOpen] = useState<boolean>(false);
  const [alertMessage, setAlertMessage] = useState<string>('');
  const [isSampling, setIsSampling] = useState<boolean>(false);
  const [loadingDelete, setLoadingDelete] = useState<boolean>(false);
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
    navigate('add-customer');
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
    setOpenDelete(true);
  };

  const confirmDelete = async () => {
    if (deleteId) {
      setLoadingDelete(true);
      try {
        await deleteCustomer(deleteId);
        setRows(rows.filter((row) => row._id !== deleteId));
        setAlertMessage('Customer deleted successfully.');
      } catch (error) {
        console.error('Error deleting customer:', error);
      } finally {
        setTimeout(() => {
          setLoadingDelete(false);
          setOpenDelete(false);
          setDeleteId(null);
          setAlertOpen(true);
          setTimeout(() => setAlertOpen(false), 3000);
        }, 3000);
      }
    }
  };

  const handleCloseDelete = () => {
    setOpenDelete(false);
    setDeleteId(null);
  };

  const confirmGroupDelete = async () => {
    setLoadingDelete(true);
    try {
      await Promise.all(selectedCustomers.map((id) => deleteCustomer(id)));
      setRows(rows.filter((row) => !selectedCustomers.includes(row._id)));
      setAlertMessage(`${selectedCustomers.length} customers deleted successfully.`);
      setOpenGroupDelete(false);
    } catch (error) {
      console.error('Error deleting customers:', error);
    } 
    finally {
      setTimeout(() => {
        setLoadingDelete(false); 
        setSelectedCustomers([]);
        setAlertOpen(true);
        setTimeout(() => setAlertOpen(false), 3000);
      }, 3000);
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

  const handleSampleCustomer = () => {
    setOpenSampleDialog(true);
  };

  const confirmSampleCustomer = async () => {
    const currentDate = new Date().toISOString().split('T')[0];
    setIsSampling(true); // Start sampling loading
    try {
      await Promise.all(
        selectedCustomers.map((id) => {
          const customerToUpdate = rows.find((row) => row._id === id);
          if (customerToUpdate) {
            return updateCustomer(id, { ...customerToUpdate, sampledDate: currentDate });
          }
        })
      );
      setRows((prevRows) =>
        prevRows.map((row) =>
          selectedCustomers.includes(row._id)
            ? { ...row, sampledDate: currentDate }
            : row
        )
      );
      setAlertMessage('Sampled date updated successfully.');
      setOpenSampleDialog(false);
    } catch (error) {
      console.error('Error updating sampled date:', error);
    } finally {
      setTimeout(() => {
        setIsSampling(false);
        setSelectedCustomers([]);
        setAlertOpen(true);
        setTimeout(() => setAlertOpen(false), 3000);
      }, 3000);
    }
  };
  const handleCloseSampleDialog = () => {
    setOpenSampleDialog(false);
  };

  const filteredRows = rows.filter((row) =>
    row.customerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      <div className="section-divider" /> 
      <div className="filter-search-container">
        <SearchbarComponent onSearch={handleSearch} />
        <FilterOptions onFilter={handleFilter} />
      </div>
      <div className="section-divider" /> 
      {showSelectionBar && (
        <div className="selection-bar">
          <span>{selectedCustomers.length} selected</span>
          <Button
            className="sample-button"
            onClick={handleSampleCustomer}
            variant="contained"
            color="primary"
            disabled={isSampling || loadingDelete}
          >
            {isSampling ?
            <>
           <CircularProgress size={24} color="secondary" />
           <Typography variant="body1">Sampling {selectedCustomers.length} customers</Typography>
           </>
            : 'Sample Customer'}
          </Button>
          <IconButton
            className="delete-button"
            onClick={() => setOpenGroupDelete(true)}
            aria-label="delete"
            disabled={isSampling || loadingDelete} 
          >
            {loadingDelete ?  
            <>
            <CircularProgress size={24} color="secondary" />
             <Typography variant="body2" color="inherit">Deleting {selectedCustomers.length} customers</Typography>
             </> 
             : <><span>Delete </span><DeleteIcon /></>}
          </IconButton>
          <IconButton
            className="close-button"
            onClick={() => setSelectedCustomers([])}
            aria-label="close"
            disabled={isSampling || loadingDelete}
          >
            <CloseIcon />
          </IconButton>
        </div>
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

      <CustomerSamplingDialogs
        openDelete={openDelete}
        openGroupDelete={openGroupDelete}
        openSampleDialog={openSampleDialog}
        handleCloseDelete={handleCloseDelete}
        handleCloseGroupDelete={handleCloseGroupDelete}
        handleCloseSampleDialog={handleCloseSampleDialog}
        confirmDelete={confirmDelete}
        confirmGroupDelete={confirmGroupDelete}
        confirmSampleCustomer={confirmSampleCustomer}
      />

      {alertOpen && (
        <AlertMessage
          open={alertOpen}
          message={alertMessage}
          onClose={() => setAlertOpen(false)}
        />
      )}
    </div>
  );
};

export default CustomerSampling;
