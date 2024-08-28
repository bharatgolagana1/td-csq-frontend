import React, { useState, ChangeEvent, FormEvent } from 'react';
import { Box, Typography, TextField, Button, Grid, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import './ParameterForm.css';
import { useNavigate, useParams } from 'react-router-dom';
import { addParameter, editParameter, addSubParameter, editSubParameter, deleteSubParameter } from '../../api/AssessmentQuestionsAPI';

interface SubParameter {
  _id: string;
  name: string;
}

interface FormData {
  _id: string;
  category: string;
  subCategory: string;
  parameter: string;
  frequency: string;
  weightage: number;
  subParameters: SubParameter[];
}

const ParameterForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    _id: '',
    category: '',
    subCategory: '',
    parameter: '',
    frequency: '',
    weightage: 0,
    subParameters: [],
  });

  const [subParameterData, setSubParameterData] = useState<SubParameter>({ _id: '', name: '' });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [subParameterOpen, setSubParameterOpen] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>(); // Assuming the parameter id is passed in the route

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubParameterChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSubParameterData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.category) newErrors.category = 'Category is required.';
    if (!formData.parameter) newErrors.parameter = 'Parameter is required.';
    if (!formData.frequency) newErrors.frequency = 'Frequency is required.';
    if (formData.weightage <= 0) newErrors.weightage = 'Weightage must be greater than 0.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validateForm()) return;

    try {
      if (id) {
        await editParameter(id, formData);
      } else {
        await addParameter(formData);
      }
      navigate('/assessment');
    } catch (error) {
      console.error('Error saving parameter:', error);
    }
  };

  const handleSubParameterSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!subParameterData.name) {
      setErrors({ subParameterName: 'Sub-parameter name is required.' });
      return;
    }

    try {
      const subParameterPayload = { ...subParameterData };
      if (!subParameterData._id) {
        const newSubParameter = await addSubParameter(id!, subParameterPayload);
        setFormData((prevState) => ({
          ...prevState,
          subParameters: [...prevState.subParameters, newSubParameter],
        }));
      } else {
        const updatedSubParameter = await editSubParameter(id!, subParameterPayload);
        setFormData((prevState) => ({
          ...prevState,
          subParameters: prevState.subParameters.map((sp) =>
            sp._id === subParameterData._id ? updatedSubParameter : sp
          ),
        }));
      }
      setSubParameterData({ _id: '', name: '' });
      setSubParameterOpen(false);
    } catch (error) {
      console.error('Error saving sub-parameter:', error);
    }
  };

  const handleDeleteSubParameter = async (subParameterId: string) => {
    try {
      await deleteSubParameter(id!, subParameterId);
      setFormData((prevState) => ({
        ...prevState,
        subParameters: prevState.subParameters.filter((sp) => sp._id !== subParameterId),
      }));
    } catch (error) {
      console.error('Error deleting sub-parameter:', error);
    }
  };

  return (
    <Box className="parameter-form-container" component="form" onSubmit={handleSubmit}>
      <Grid container alignItems="center" justifyContent="space-between">
        <Grid item>
          <Typography variant="h6" gutterBottom>
            {formData._id ? 'Edit Parameter' : 'Add Parameter'}
          </Typography>
        </Grid>
        <Grid item>
          <IconButton color="primary" className="add-bulk-parameter">
            <AddIcon /> Add Parameter in Bulk
          </IconButton>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            error={Boolean(errors.category)}
            helperText={errors.category}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Sub-Category"
            name="subCategory"
            value={formData.subCategory}
            onChange={handleChange}
            fullWidth
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="Parameter"
            name="parameter"
            value={formData.parameter}
            onChange={handleChange}
            error={Boolean(errors.parameter)}
            helperText={errors.parameter}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Frequency"
            name="frequency"
            value={formData.frequency}
            onChange={handleChange}
            error={Boolean(errors.frequency)}
            helperText={errors.frequency}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Weightage"
            name="weightage"
            type="number"
            value={formData.weightage}
            onChange={handleChange}
            error={Boolean(errors.weightage)}
            helperText={errors.weightage}
            fullWidth
          />
        </Grid>

        {/* Sub-Parameters Section */}
        <Grid item xs={12}>
          <Box display="flex" alignItems="center">
            <Typography variant="h6">Sub-Parameters</Typography>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => setSubParameterOpen(true)}
              startIcon={<AddIcon />}
              style={{ marginLeft: 'auto' }}
            >
              Add Sub-Parameter
            </Button>
          </Box>

          {subParameterOpen && (
            <Grid container spacing={2} className="sub-parameter-form">
              <Grid item xs={12} sm={8}>
                <TextField
                  label="Sub-Parameter Name"
                  margin="dense"
                  name="name"
                  value={subParameterData.name}
                  onChange={handleSubParameterChange}
                  error={Boolean(errors.subParameterName)}
                  helperText={errors.subParameterName}
                  fullWidth
                  className="custom-textfield"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSubParameterSubmit}
                  style={{ marginTop: '16px' }}
                  fullWidth
                >
                  {subParameterData._id ? 'Update Sub-Parameter' : 'Add Sub-Parameter'}
                </Button>
              </Grid>
            </Grid>
          )}

          <ul className="sub-parameter-list">
            {formData.subParameters.map((subParam) => (
              <li key={subParam._id} className="sub-parameter-item">
                <span>{subParam.name}</span>
                <Button
                  variant="text"
                  color="primary"
                  onClick={() => setSubParameterData(subParam)}
                  style={{ marginRight: '8px' }}
                >
                  Edit
                </Button>
                <Button
                  variant="text"
                  color="secondary"
                  onClick={() => handleDeleteSubParameter(subParam._id)}
                >
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        </Grid>
      </Grid>

      <Button
        type="submit"
        variant="contained"
        color="primary"
        style={{ marginTop: '24px' }}
        className="save-parameter-button"
      >
        {formData._id ? 'Save Changes' : 'Add Parameter'}
      </Button>
    </Box>
  );
};

export default ParameterForm;
