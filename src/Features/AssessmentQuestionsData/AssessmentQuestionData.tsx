import React, { useState, useEffect } from 'react';
import {
  Table, TableBody, TableContainer, TableHead, TableRow, Paper, Button, Box, Modal, Typography, TextField, TableCell, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
  IconButton,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Visibility as VisibilityIcon } from '@mui/icons-material';
import axios from 'axios';
import './AssessmentQuestionsData.css';
import { API_URL } from './API/AssessmentQuestionsAPI';

interface Parameter {
  _id?: string;
  category: string;
  subCategory: string;
  parameter: string;
  frequency: string;
  weightage: number;
  subParameters?: SubParameter[];
}

interface SubParameter {
  _id: string;
  name: string;
}

interface ErrorState {
  category?: string;
  subCategory?: string;
  parameter?: string;
  frequency?: string;
  weightage?: string;
  subParameterName?: string;
}

export default function AssessmentQuestionsData() {
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
  const [subParameterData, setSubParameterData] = useState<SubParameter>({
    _id: '',
    name: '',
  });
  const [errors, setErrors] = useState<ErrorState>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchParameters();
  }, []);

  const fetchParameters = async () => {
    try {
      const response = await axios.get<Parameter[]>(API_URL);
      setParameters(response.data);
    } catch (error) {
      console.error('Error fetching parameters:', error);
    }
  };

  const handleAdd = () => {
    setFormData({
      _id: undefined,
      category: '',
      subCategory: '',
      parameter: '',
      frequency: '',
      weightage: 0,
    });
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

  const handleClose = () => {
    setOpen(false);
  };

  const handleSubParameterClose = () => {
    setSubParameterData({ _id: '', name: '' });
    setErrors({});
    setSubParameterOpen(false);
  };

  const handleDelete = async (_id: string) => {
    try {
      await axios.delete(`${API_URL}/${_id}`);
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
      const url = `${API_URL}/${selectedParameter?._id}/subparameters`;

      const dataToSend = subParameterData._id ? { ...subParameterData } : { name: subParameterData.name };

      let response;
      if (!subParameterData._id) {
        response = await axios.post<SubParameter>(url, dataToSend);
      } else {
        response = await axios.put<SubParameter>(`${url}/${subParameterData._id}`, dataToSend);
      }

      if (response && response.data) {
        const updatedParameters = parameters.map(parameter =>
          parameter._id === selectedParameter?._id
            ? {
                ...parameter,
                subParameters: parameter.subParameters
                  ? parameter.subParameters.map(sp => sp._id === subParameterData._id ? response.data : sp)
                  : [response.data]
              }
            : parameter
        );

        setParameters(updatedParameters);
        setSubParameterData({ _id: '', name: '' });
        setSubParameterOpen(false);
      }
    } catch (error) {
      logError(error);
    }
  };

  const logError = (error: any) => {
    if (error.response) {
      console.error('Error response data:', error.response.data);
    } else if (error.request) {
      console.error('Error request:', error.request);
    } else {
      console.error('Error message:', error.message);
    }
  };

  const handleDeleteSubParameter = async (subParameterId: string) => {
    try {
      await axios.delete(`${API_URL}/${selectedParameter?._id}/subparameters/${subParameterId}`);
      if (selectedParameter) {
        setSelectedParameter({
          ...selectedParameter,
          subParameters: selectedParameter.subParameters?.filter(sp => sp._id !== subParameterId),
        });

        const updatedParameters = parameters.map(parameter =>
          parameter._id === selectedParameter._id
            ? { ...selectedParameter, subParameters: selectedParameter.subParameters?.filter(sp => sp._id !== subParameterId) }
            : parameter
        );

        setParameters(updatedParameters);
      }
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
      const response = await axios.get<SubParameter[]>(`${API_URL}/${parameter._id}/subparameters`);
      setSelectedParameter({ ...parameter, subParameters: response.data });
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
        if (isEdit) {
          await axios.put(`${API_URL}/${formData._id}`, formData);
        } else {
          const response = await axios.post(API_URL, formData);
          setParameters([...parameters, response.data]);
        }
        setOpen(false);
        fetchParameters();
      } catch (error) {
        console.error('Error saving parameter:', error);
      }
    }
  };

  return (
    <div className="container">
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
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell className="styled-table-head-cell">Category</TableCell>
              <TableCell className="styled-table-head-cell">Sub-Category</TableCell>
              <TableCell className="styled-table-head-cell">Parameter</TableCell>
              <TableCell className="styled-table-head-cell">Frequency</TableCell>
              <TableCell className="styled-table-head-cell">Weightage</TableCell>
              <TableCell className="styled-table-head-cell">Sub-parameters</TableCell>
              <TableCell className="styled-table-head-cell">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {parameters.map((parameter) => (
              <TableRow key={parameter._id} className="styled-table-row">
                <TableCell className="styled-table-cell">{parameter.category}</TableCell>
                <TableCell className="styled-table-cell">{parameter.subCategory}</TableCell>
                <TableCell className="styled-table-cell">{parameter.parameter}</TableCell>
                <TableCell className="styled-table-cell">{parameter.frequency}</TableCell>
                <TableCell className="styled-table-cell">{parameter.weightage}</TableCell>
                <TableCell className="styled-table-cell">
                  <IconButton
                    className="blue-icon-button"
                    onClick={() => handleViewSubParameters(parameter)}
                  >
                    <VisibilityIcon />
                  </IconButton>
                </TableCell>
                <TableCell className="styled-table-cell">
                  <IconButton
                    className="blue-icon-button"
                    onClick={() => handleEdit(parameter)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    className="blue-icon-button"
                    onClick={() => handleOpenDeleteDialog(parameter._id!)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Modal open={open} onClose={handleClose}>
        <Box className="form-container" component="form" onSubmit={handleSubmit}>
          <Typography variant="h6" gutterBottom>
            {isEdit ? 'Edit Parameter' : 'Add Parameter'}
          </Typography>
          <TextField
            className="custom-text-field"
            label="Category"
            name="category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            error={Boolean(errors.category)}
            helperText={errors.category}
            variant="standard"
            fullWidth
          />
          <TextField
            className="custom-text-field"
            label="Sub-Category"
            name="subCategory"
            value={formData.subCategory}
            onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
            error={Boolean(errors.subCategory)}
            helperText={errors.subCategory}
            variant="standard"
            fullWidth
          />
          <TextField
            className="custom-text-field"
            label="Parameter"
            name="parameter"
            value={formData.parameter}
            onChange={(e) => setFormData({ ...formData, parameter: e.target.value })}
            error={Boolean(errors.parameter)}
            helperText={errors.parameter}
            variant="standard"
            fullWidth
          />
          <TextField
            className="custom-text-field"
            label="Frequency"
            name="frequency"
            value={formData.frequency}
            onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
            error={Boolean(errors.frequency)}
            helperText={errors.frequency}
            variant="standard"
            fullWidth
          />
          <TextField
            className="custom-text-field"
            label="Weightage"
            name="weightage"
            type="number"
            value={formData.weightage}
            onChange={(e) => setFormData({ ...formData, weightage: Number(e.target.value) })}
            error={Boolean(errors.weightage)}
            helperText={errors.weightage}
            variant="standard"
            fullWidth
          />
          <Box className="button-container">
            <Button type="submit" variant="contained" color="primary">
              {isEdit ? 'Update' : 'Submit'}
            </Button>
            <Button onClick={handleClose} variant="contained">
              Cancel
            </Button>
          </Box>
        </Box>
      </Modal>
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>Are you sure you want to delete this parameter?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="primary">
            Cancel
          </Button>
          <Button
            onClick={() => deleteId && handleDelete(deleteId)}
            color="secondary"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={subParameterOpen} onClose={handleSubParameterClose}>
        <DialogTitle>{selectedParameter?.parameter} - Sub Parameters</DialogTitle>
        <DialogContent>
          <form onSubmit={handleSubParameterSubmit}>
            <TextField
              className="custom-text-field"
              label="Sub-Parameter Name"
              name="name"
              value={subParameterData.name}
              onChange={handleSubParameterChange}
              error={Boolean(errors.subParameterName)}
              helperText={errors.subParameterName}
              variant="standard"
              fullWidth
            />
            <Box className="button-container">
              <Button type="submit" variant="contained" color="primary">
                {subParameterData._id ? 'Update' : 'Add'}
              </Button>
              <Button onClick={handleSubParameterClose} variant="contained">
                Cancel
              </Button>
            </Box>
          </form>
          <Box className="sub-parameters-list">
            {selectedParameter?.subParameters?.map((subParameter) => (
              <Box key={subParameter._id} className="sub-parameter-item">
                <Typography>{subParameter.name}</Typography>
                <div>
                  <IconButton
                    className="blue-icon-button"
                    onClick={() => handleEditSubParameter(subParameter)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    className="blue-icon-button"
                    onClick={() => handleDeleteSubParameter(subParameter._id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </div>
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSubParameterClose} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
