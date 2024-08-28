import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TableCell,
  Checkbox,
  Toolbar,
  Typography,
  Button,
  IconButton,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import { Parameter } from '../types/Types';
import { deleteParameter } from '../../api/AssessmentQuestionsAPI';
import { DeleteDialog } from '../Dialogs/Dialogs';
import './AssessmentParameterTable.css';

interface ParameterTableProps {
  parameters: Parameter[];
  handleEdit: (parameter: Parameter) => void;
  handleOpenDeleteDialog: (id: string) => void;
}

const AssessmentParameterTable: React.FC<ParameterTableProps> = ({
  parameters,
  handleEdit,
}) => {
  const [selected, setSelected] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleSelect = (id: string) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected: string[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1)
      );
    }

    setSelected(newSelected);
  };

  const isSelected = (id: string) => selected.indexOf(id) !== -1;

  const handleDelete = async () => {
    if (deleteId) {
      await deleteParameter(deleteId);
      setSelected(selected.filter((id) => id !== deleteId));
    }
    setDeleteDialogOpen(false);
  };

  const handleOpenDeleteDialogLocal = (id: string) => {
    setDeleteDialogOpen(true);
    setDeleteId(id);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setDeleteId(null);
  };

  const handleCloseToolbar = () => {
    setSelected([]);
  };

  return (
    <div>
      {selected.length > 0 && (
        <Toolbar className="assessment-toolbar">
          <Typography variant="h6" color="inherit" component="div">
            {selected.length} Selected
          </Typography>
          <Button
            startIcon={<DeleteIcon />}
            className="assessment-delete-button"
            onClick={() => handleOpenDeleteDialogLocal(selected[0])} // Adjust this to handle multiple deletions if needed
          >
            Delete
          </Button>
          <IconButton
            className="assessment-close-icon-button"
            onClick={handleCloseToolbar}
          >
            <CloseIcon />
          </IconButton>
        </Toolbar>
      )}
      <TableContainer
        component={Paper}
        className="assessment-parameter-table-container"
      >
        <Table className="assessment-parameter-table">
          <TableHead>
            <TableRow>
              <TableCell
                padding="checkbox"
                className="assessment-styled-table-head-cell-checkbox"
              >
                <Checkbox
                  indeterminate={
                    selected.length > 0 && selected.length < parameters.length
                  }
                  checked={
                    parameters.length > 0 &&
                    selected.length === parameters.length
                  }
                  onChange={(event) =>
                    setSelected(
                      event.target.checked
                        ? parameters.map((p) => p._id)
                        : []
                    )
                  }
                  inputProps={{ 'aria-label': 'select all parameters' }}
                />
              </TableCell>
              <TableCell className="assessment-styled-table-head-cell">
                Category
              </TableCell>
              <TableCell className="assessment-styled-table-head-cell">
                Sub-Category
              </TableCell>
              <TableCell className="assessment-styled-table-head-cell">
                Parameter
              </TableCell>
              <TableCell className="assessment-styled-table-head-cell">
                Frequency
              </TableCell>
              <TableCell className="assessment-styled-table-head-cell">
                Weightage
              </TableCell>
              <TableCell className="assessment-styled-table-head-cell">
                Details
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {parameters.map((parameter) => {
              const isItemSelected = isSelected(parameter._id);
              return (
                <TableRow
                  key={parameter._id}
                  className="assessment-styled-table-row"
                  selected={isItemSelected}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={isItemSelected}
                      onChange={() => handleSelect(parameter._id)}
                      inputProps={{
                        'aria-labelledby': `checkbox-${parameter._id}`,
                      }}
                    />
                  </TableCell>
                  <TableCell className="assessment-styled-table-cell">
                    {parameter.category}
                  </TableCell>
                  <TableCell className="assessment-styled-table-cell">
                    {parameter.subCategory}
                  </TableCell>
                  <TableCell className="assessment-styled-table-cell">
                    {parameter.parameter}
                  </TableCell>
                  <TableCell className="assessment-styled-table-cell">
                    {parameter.frequency}
                  </TableCell>
                  <TableCell className="assessment-styled-table-cell">
                    {parameter.weightage}
                  </TableCell>
                  <TableCell className="assessment-styled-table-cell">
                    <span
                      className="assessment-view-text-button"
                      onClick={() => handleEdit(parameter)}
                    >
                      View
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <DeleteDialog
        open={deleteDialogOpen}
        handleClose={handleCloseDeleteDialog}
        handleDelete={handleDelete}
      />
    </div>
  );
};

export default AssessmentParameterTable;
