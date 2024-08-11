import React from 'react';
import {
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  TableCell
} from '@mui/material';
import { Visibility as VisibilityIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { Parameter } from '../types/Types';
import './AssessmentParameterTable.css'; // Adjusted CSS import for the updated name

interface ParameterTableProps {
  parameters: Parameter[];
  handleEdit: (parameter: Parameter) => void;
  handleViewSubParameters: (parameter: Parameter) => void;
  handleOpenDeleteDialog: (id: string) => void;
}

const AssessmentParameterTable: React.FC<ParameterTableProps> = ({
  parameters,
  handleEdit,
  handleViewSubParameters,
  handleOpenDeleteDialog
}) => {
  return (
    <TableContainer component={Paper} className="assessment-parameter-table-container">
      <Table className="assessment-parameter-table">
        <TableHead>
          <TableRow>
            <TableCell className="assessment-styled-table-head-cell">Category</TableCell>
            <TableCell className="assessment-styled-table-head-cell">Sub-Category</TableCell>
            <TableCell className="assessment-styled-table-head-cell">Parameter</TableCell>
            <TableCell className="assessment-styled-table-head-cell">Frequency</TableCell>
            <TableCell className="assessment-styled-table-head-cell">Weightage</TableCell>
            <TableCell className="assessment-styled-table-head-cell">Sub-parameters</TableCell>
            <TableCell className="assessment-styled-table-head-cell">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {parameters.map((parameter) => (
            <TableRow key={parameter._id} className="assessment-styled-table-row">
              <TableCell className="assessment-styled-table-cell">{parameter.category}</TableCell>
              <TableCell className="assessment-styled-table-cell">{parameter.subCategory}</TableCell>
              <TableCell className="assessment-styled-table-cell">{parameter.parameter}</TableCell>
              <TableCell className="assessment-styled-table-cell">{parameter.frequency}</TableCell>
              <TableCell className="assessment-styled-table-cell">{parameter.weightage}</TableCell>
              <TableCell className="assessment-styled-table-cell">
                <IconButton className="assessment-blue-icon-button" onClick={() => handleViewSubParameters(parameter)}>
                  <VisibilityIcon />
                </IconButton>
              </TableCell>
              <TableCell className="assessment-styled-table-cell">
                <IconButton className="assessment-blue-icon-button" onClick={() => handleEdit(parameter)}>
                  <EditIcon />
                </IconButton>
                <IconButton className="assessment-blue-icon-button" onClick={() => handleOpenDeleteDialog(parameter._id!)}>
                  <DeleteIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default AssessmentParameterTable;
