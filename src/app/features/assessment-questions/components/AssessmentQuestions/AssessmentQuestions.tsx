import React, { useState, useEffect } from 'react';
import { Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import './AssessmentQuestions.css';
import { DeleteDialog } from '../Dialogs/Dialogs'; // Removed AddEditParameterDialog import
import SubParameterDialog from '../Dialogs/subparamterDialog/SubParameterDialog';
import { Parameter, SubParameter, ErrorState } from '../types/Types';
import {
  fetchParameters,
  addParameter,
  editParameter,
  deleteParameter,
  fetchSubParameters,
  addSubParameter,
  editSubParameter,
  deleteSubParameter
} from '../../api/AssessmentQuestionsAPI';
import AssessmentParameterTable from '../AssessmentParameterTable/AssessmentParameterTable';
import ParameterForm from '../ParameterForm/ParameterForm'; // Importing custom form

const AssessmentQuestionsData = () => {
  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [open, setOpen] = useState(false);
  const [subParameterOpen, setSubParameterOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [formData, setFormData] = useState<Parameter>({
    _id: '',
    category: '',
    subCategory: '',
    parameter: '',
    frequency: '',
    weightage: 0,
  });
  const [selectedParameter, setSelectedParameter] = useState<Parameter | null>(null);
  const [subParameterData, setSubParameterData] = useState<SubParameter>({ _id: '', name: '' });
  const [errors, setErrors] = useState<ErrorState>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      const fetchedParameters = await fetchParameters();
      setParameters(fetchedParameters);
    };
    fetchInitialData();
  }, []);

  const handleAdd = () => {
    setFormData({ _id: '', category: '', subCategory: '', parameter: '', frequency: '', weightage: 0 });
    setErrors({});
    setIsEdit(false);
    setOpen(true);
  };

  const handleEdit = (parameter: Parameter) => {
    setFormData(parameter);
    setErrors({});
    setIsEdit(true);
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleSubParameterClose = () => {
    setSubParameterData({ _id: '', name: '' });
    setErrors({});
    setSubParameterOpen(false);
  };

  const handleDelete = async (_id: string) => {
    try {
      await deleteParameter(_id);
      setParameters(parameters.filter(parameter => parameter._id !== _id));
    } catch (error) {
      console.error('Error deleting parameter:', error);
    }
    setDeleteDialogOpen(false);
    setDeleteId(null);
  };

  const handleOpenDeleteDialog = (id: string) => {
    setDeleteDialogOpen(true);
    setDeleteId(id);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setDeleteId(null);
  };

  const handleSubParameterSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!subParameterData.name) {
      setErrors({ subParameterName: 'Sub-parameter name is required.' });
      return;
    }

    try {
      const subParameterPayload = { ...subParameterData };
      if (!subParameterData._id) {
        const newSubParameter = await addSubParameter(selectedParameter?._id!, subParameterPayload);
        const updatedParameters = parameters.map(parameter =>
          parameter._id === selectedParameter?._id
            ? {
                ...parameter,
                subParameters: parameter.subParameters
                  ? [...parameter.subParameters, newSubParameter]
                  : [newSubParameter]
              }
            : parameter
        );
        setParameters(updatedParameters);
      } else {
        const updatedSubParameter = await editSubParameter(selectedParameter?._id!, subParameterPayload);
        const updatedParameters = parameters.map(parameter =>
          parameter._id === selectedParameter?._id
            ? {
                ...parameter,
                subParameters: parameter.subParameters?.map(sp => sp._id === subParameterData._id ? updatedSubParameter : sp)
              }
            : parameter
        );
        setParameters(updatedParameters);
      }
      setSubParameterData({ _id: '', name: '' });
      setSubParameterOpen(false);
    } catch (error) {
      console.error('Error saving sub-parameter:', error);
    }
  };

  const handleDeleteSubParameter = async (subParameterId: string) => {
    try {
      await deleteSubParameter(selectedParameter?._id!, subParameterId);
      const updatedParameters = parameters.map(parameter =>
        parameter._id === selectedParameter?._id
          ? {
              ...parameter,
              subParameters: parameter.subParameters?.filter(sp => sp._id !== subParameterId)
            }
          : parameter
      );
      setParameters(updatedParameters);
    } catch (error) {
      console.error('Error deleting sub-parameter:', error);
    }
  };

  const handleSubParameterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSubParameterData(prevState => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleViewSubParameters = async (parameter: Parameter) => {
    setSelectedParameter(parameter);
    try {
      const subParameters = await fetchSubParameters(parameter._id);
      setSelectedParameter({ ...parameter, subParameters });
      setSubParameterOpen(true);
    } catch (error) {
      console.error('Error fetching sub-parameters:', error);
    }
  };

  const handleEditSubParameter = (subParameter: SubParameter) => {
    setSubParameterData(subParameter);
    setErrors({});
    setSubParameterOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const newErrors: ErrorState = {};

    if (!formData.category) newErrors.category = 'Category is required.';
    if (!formData.subCategory) newErrors.subCategory = 'Sub-category is required.';
    if (!formData.parameter) newErrors.parameter = 'Parameter is required.';
    if (!formData.frequency) newErrors.frequency = 'Frequency is required.';
    if (formData.weightage === undefined || formData.weightage === null) newErrors.weightage = 'Weightage is required.';

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      try {
        // Remove or set _id to null if it's an empty string when adding a new parameter
        const parameterData = { ...formData };
        if (isEdit) {
          await editParameter(parameterData);
          setParameters(parameters.map(param => param._id === parameterData._id ? parameterData : param));
        } else {
          const newParameter = await addParameter(parameterData);
          setParameters([...parameters, newParameter]);
        }
        setOpen(false);
      } catch (error) {
        console.error('Error saving parameter:', error);
      }
    }
  };

  return (
    <div className="container">
      <div className="action-buttons">
        <Button className="add-user-button" variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
          Add Parameter
        </Button>
      </div>
      <AssessmentParameterTable
        parameters={parameters}
        handleEdit={handleEdit}
        handleViewSubParameters={handleViewSubParameters}
        handleOpenDeleteDialog={handleOpenDeleteDialog}
      />
      {/* Replacing AddEditParameterDialog with ParameterForm */}
      <ParameterForm
        open={open}
        isEdit={isEdit}
        formData={formData}
        errors={errors}
        handleClose={handleClose}
        handleSubmit={handleSubmit}
        handleChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })}
      />
      <DeleteDialog
        open={deleteDialogOpen}
        handleClose={handleCloseDeleteDialog}
        handleDelete={() => deleteId && handleDelete(deleteId)}
      />
      <SubParameterDialog
        open={subParameterOpen}
        selectedParameter={selectedParameter}
        subParameterData={subParameterData}
        errors={errors}
        handleClose={handleSubParameterClose}
        handleSubmit={handleSubParameterSubmit}
        handleChange={handleSubParameterChange} // Use handleSubParameterChange
        handleEditSubParameter={handleEditSubParameter}
        handleDeleteSubParameter={handleDeleteSubParameter}
      />
    </div>
  );
};

export default AssessmentQuestionsData;
