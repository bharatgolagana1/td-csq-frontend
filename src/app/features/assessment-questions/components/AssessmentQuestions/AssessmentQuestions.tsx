import { useState, useEffect } from 'react';
import { Button, Typography } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import './AssessmentQuestions.css';
import { DeleteDialog } from '../Dialogs/Dialogs';
import { Parameter } from '../types/Types';
import { useNavigate } from 'react-router-dom';
import {
  fetchParameters,
  deleteParameter,
} from '../../api/AssessmentQuestionsAPI';
import AssessmentParameterTable from '../AssessmentParameterTable/AssessmentParameterTable';

const AssessmentQuestionsData = () => {
  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const fetchedParameters = await fetchParameters();
        setParameters(fetchedParameters);
      } catch (error) {
        console.error('Error fetching parameters:', error);
      }
    };
    fetchInitialData();
  }, []);

  const handleAdd = () => {
    navigate('parameter-form');
  };

  const handleEdit = (parameter: Parameter) => {
    navigate(`parameter-form/${parameter._id}`);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setDeleteId(null);
  };

  const handleDelete = async (_id: string) => {
    try {
      await deleteParameter(_id);
      setParameters(parameters.filter((parameter) => parameter._id !== _id));
    } catch (error) {
      console.error('Error deleting parameter:', error);
    }
    handleCloseDeleteDialog();
  };

  const handleOpenDeleteDialog = (id: string) => {
    setDeleteDialogOpen(true);
    setDeleteId(id);
  };

  return (
    <div className="container">
      <div className="header-row">
        <Typography variant="h6" className="parameter-text">
          Parameter
        </Typography>
        <div className="action-buttons">
          <Button
            className="add-user-button"
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAdd}
          >
            Add Parameter
          </Button>
        </div>
      </div>
      <AssessmentParameterTable
        parameters={parameters}
        handleEdit={handleEdit}
        handleOpenDeleteDialog={handleOpenDeleteDialog}
      />
      <DeleteDialog
        open={deleteDialogOpen}
        handleClose={handleCloseDeleteDialog}
        handleDelete={() => deleteId && handleDelete(deleteId)}
      />
    </div>
  );
};

export default AssessmentQuestionsData;
