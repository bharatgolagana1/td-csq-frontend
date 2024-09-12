import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import UserMasterTable from "../userMasterTable/UserMasterTable";
import { getAllUsers, deleteMultipleUsers } from '../../api/UserMasterAPI'; 
import { User } from '../types'; 
import './UserMaster.css';
import { Button, IconButton, Typography, Box } from '@mui/material'; 
import UserMasterSkeleton from '../userMasterHelpers/UserMasterSkeleton'; 
import AddIcon from '@mui/icons-material/Add'; 
import CloseIcon from '@mui/icons-material/Close'; 
import ErrorIcon from '@mui/icons-material/Error'; 
import NoDataIcon from '@mui/icons-material/InsertEmoticon'; 
import DeleteDialog from '../userMasterHelpers/UserDialog'; // Import DeleteDialog
import AlertSnackbar from '../userMasterHelpers/UserAlertSnackBar'; // Import AlertSnackbar
import UserSearchBar from '../userMasterHelpers/UserSearchBar';
import UserFilters from '../userMasterHelpers/UserFilters';
import UserMasterModal from '../userMasterModal/UserMasterModal'; // Import UserMasterModal

const UserMaster = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [loading, setLoading] = useState<boolean>(true); 
  const [error, setError] = useState<string | null>(null); 
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState<'success' | 'error' | 'warning' | 'info'>('success');
  const [deleteMode, setDeleteMode] = useState<'single' | 'multiple'>('single'); // Mode for delete (single or group)
  const [modalOpen, setModalOpen] = useState(false); // Manage modal open state
  const [currentUser, setCurrentUser] = useState<User | null>(null); // Current user data for modal
  const [isEditMode, setIsEditMode] = useState(false); // Edit mode state
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetchedUsers = await getAllUsers();
        setUsers(fetchedUsers);
      } catch (error) {
        setError('Failed to fetch users.');
      } finally {
        setLoading(false);
      }
    };
  
    fetchUsers();
  }, []);
  
  const handleSelect = (id: string) => {
    setSelectedUsers(prev => 
      prev.includes(id) ? prev.filter(userId => userId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user._id));
    }
  };

  const handleDelete = async () => {
    try {
      if (deleteMode === 'multiple') {
        await deleteMultipleUsers(selectedUsers);
        setUsers(prev => prev.filter(user => !selectedUsers.includes(user._id)));
        setAlertMessage('Selected users deleted successfully.');
        setSelectedUsers([]);
      }
      setAlertSeverity('success');
    } catch (error) {
      setAlertMessage('Failed to delete user(s).');
      setAlertSeverity('error');
    } finally {
      setDeleteDialogOpen(false);
      setAlertOpen(true);
    }
  };

  const handleGroupDelete = () => {
    setDeleteMode('multiple');
    setDeleteDialogOpen(true);
  };

  const handleAdd = () => {
    navigate('add-user');
  };

  const onCloseOperation = () => {
    setSelectedUsers([]);
  };

  const handleViewUser = (user: User) => {
    setCurrentUser(user);
    setIsEditMode(false);
    setModalOpen(true);
  };

  const handleSearch = (_query: string): void =>  {
    throw new Error('Function not implemented.');
  }

  const handleFilter = (_filter: string): void =>  {
    throw new Error('Function not implemented.');
  }

  return (
    <div className="user">
     <div className="user-container">
        <h2 className="user-title">User</h2>
        <Button className="add-user-button" onClick={handleAdd}>
          <AddIcon className="add-user-icon" />
          <span className="add-user-text">Add User</span>
        </Button>
      </div>
      <div className="user-filters">
        <UserSearchBar onSearch={handleSearch} />
        <UserFilters onFilter={handleFilter} />
      </div>
      {selectedUsers.length > 0 && (
        <div className="selected-actions">
          <span className="selected-text">
            {selectedUsers.length} selected
          </span>
          <IconButton
            className="delete-button-cycle"
            onClick={handleGroupDelete}
          >
            <span>Delete</span>
            <img src="/src/assets/deleteIcon.svg" alt="delete" />
          </IconButton>
          <IconButton onClick={onCloseOperation} className="close-operation-button">
            <CloseIcon />
          </IconButton>
        </div>
      )}

      {loading && (
        <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
          <UserMasterSkeleton/>
        </Box>
      )}

      {error && (
        <Box display="flex" flexDirection="column" alignItems="center" mt={2}>
          <ErrorIcon color="error" />
          <Typography color="error">{error}</Typography>
        </Box>
      )}

      {!loading && !error && users.length === 0 && (
        <Box display="flex" flexDirection="column" alignItems="center" mt={2}>
          <NoDataIcon />
          <Typography>No data available</Typography>
        </Box>
      )}

      {!loading && !error && users.length > 0 && (
        <UserMasterTable
          users={users}
          selectedUsers={selectedUsers}
          handleSelect={handleSelect}
          handleSelectAll={handleSelectAll}
          onViewClick={handleViewUser} // Pass view user handler
        />
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Confirmation"
        message={deleteMode === 'multiple' ? 
          'Are you sure you want to delete the selected users?' : 
          'Are you sure you want to delete this user?'
        }
      />

      {/* Alert Snackbar */}
      <AlertSnackbar
        open={alertOpen}
        message={alertMessage}
        severity={alertSeverity}
        onClose={() => setAlertOpen(false)}
      />

      {/* User Detail Modal */}
      {currentUser && (
        <UserMasterModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          user={currentUser}
          isEditMode={isEditMode}
          setIsEditMode={setIsEditMode}
          fetchUsers={() => setUsers(users)} // Adjust based on actual fetch logic
        />
      )}
    </div>
  );
}

export default UserMaster;
