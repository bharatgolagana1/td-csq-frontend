import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Alert, IconButton } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import AssessmentCycleTable from '../AssessmentCycleTable/AssessmentCycleTable';
import { getAssessmentCycles, deleteAssessmentCycles } from '../../api/AssessmentCycleAPI';
import AssessmentCycleDetailsModal from '../AssessmentCycleModal/AssessmentCycleModal';
import './AssessmentCycle.css';
import AssessmentCycleSearchBar from '../AssessmentCycleHelpers/AssessmentCycleSearchBar';
import AssessmentCycleFilters from '../AssessmentCycleHelpers/AssessmentCycleFilters';

const AssessmentCycle = () => {
  const [cycles, setCycles] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState<any | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [, setSearchQuery] = useState<string>('');

  const navigate = useNavigate();

  useEffect(() => {
    fetchCycles();
  }, []);

  const fetchCycles = async () => {
    try {
      const data = await getAssessmentCycles();
      setCycles(data.assessmentCycles);
    } catch (error) {
      console.error('Failed to fetch assessment cycles', error);
    }
  };

  const handleSelect = (id: string) => {
    setSelectedIds((prevSelected) =>
      prevSelected.includes(id)
        ? prevSelected.filter((selectedId) => selectedId !== id)
        : [...prevSelected, id]
    );
  };

  const handleDelete = async () => {
    try {
      await deleteAssessmentCycles(selectedIds);
      setAlertMessage(`You deleted ${selectedIds.length} cycles.`);
      setSelectedIds([]);
      fetchCycles();
      setTimeout(() => setAlertMessage(null), 5000);
    } catch (error) {
      console.error('Failed to delete assessment cycles', error);
      setAlertMessage('Failed to delete cycles.');
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };
  const handleFilter = () => {
    // Implement filter logic here
  }
  const handleViewDetails = async (cycle: any) => {
    setSelectedCycle(cycle);
    setOpen(true);
  };

  const handleClose = () => {
    setIsEditMode(false);
    setOpen(false);
  };

  const handleCloseOperation = () => {
    setSelectedIds([]);
  };

  const handleAddCycle = () => {
    navigate('add-cycle');
  };

  return (
    <div className="assessment-cycle-container">
      <div className="assessment-cycle-header">
        <h2 className="assessment-cycle-title">Assessment Cycle</h2>
        <Button className="add-cycle-button" onClick={handleAddCycle}>
          <AddIcon className="add-icon" />
          <span className="add-cycle-text">Add Assessment Cycle</span>
        </Button>
      </div>
      <div className="section-divider" /> 
      <div className="filter-search-container">
        <AssessmentCycleSearchBar onSearch={handleSearch} />
        <AssessmentCycleFilters onFilter={handleFilter} />
      </div>
      <div className="section-divider" /> 
      {alertMessage && (
        <Alert severity="info" className="alert-box">
          {alertMessage}
          <IconButton onClick={() => setAlertMessage(null)} className="close-alert">
            X
          </IconButton>
        </Alert>
      )}

      {/* Pass the filtered rows to the table */}
      <AssessmentCycleTable
        cycles={cycles} // Use filteredRows instead of cycles
        selectedIds={selectedIds}
        onSelect={handleSelect}
        onDelete={handleDelete}
        onViewDetails={handleViewDetails}
        onCloseOperation={handleCloseOperation}
        setDeleteDialogOpen={setDeleteDialogOpen}
      />

      <AssessmentCycleDetailsModal
        open={open}
        onClose={handleClose}
        cycle={selectedCycle}
        isEditMode={isEditMode}
        setIsEditMode={setIsEditMode}
        fetchCycles={fetchCycles}
      />

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Assessment Cycles</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {selectedIds.length} assessment cycle(s)?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default AssessmentCycle;
