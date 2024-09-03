import React, { useState } from 'react';
import { Button, Typography, Grid, Stepper, Step, StepLabel, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton } from '@mui/material';
import UploadIcon from '@mui/icons-material/Upload';
import DeleteIcon from '@mui/icons-material/Delete';
import './BulkUpload.css';

const BulkUpload: React.FC = () => {
  const [files, setFiles] = useState<Array<{ name: string, size: string }>>([]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFiles([...files, { name: file.name, size: `${(file.size / 1024).toFixed(2)} KB` }]);
    }
  };

  const handleDelete = (index: number) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  return (
    <div className="bulk-upload-page">
      <Typography variant="h5" className="page-title">
        Add Customers in Bulk
      </Typography>

      <Stepper alternativeLabel className="stepper">
        <Step active>
          <StepLabel>Upload File</StepLabel>
        </Step>
        <Step>
          <StepLabel>Verification</StepLabel>
        </Step>
        <Step>
          <StepLabel>Save</StepLabel>
        </Step>
      </Stepper>

      <div className="upload-section">
        <Typography variant="subtitle1" className="upload-title">
          Upload File
        </Typography>
        <input
          accept=".xls,.xlsx"
          style={{ display: 'none' }}
          id="file-upload"
          type="file"
          onChange={handleFileChange}
        />
        <label htmlFor="file-upload">
          <Button
            variant="contained"
            startIcon={<UploadIcon />}
            className="upload-button"
            component="span"
          >
            Upload
          </Button>
        </label>
      </div>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>File Name</TableCell>
              <TableCell>Size</TableCell>
              <TableCell>Delete</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {files.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} align="center">
                  -
                </TableCell>
              </TableRow>
            ) : (
              files.map((file, index) => (
                <TableRow key={index}>
                  <TableCell>{file.name}</TableCell>
                  <TableCell>{file.size}</TableCell>
                  <TableCell>
                    <IconButton color="error" onClick={() => handleDelete(index)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Grid container justifyContent="flex-end" className="next-button-section">
        <Button variant="contained" disabled={files.length === 0} className="next-button">
          Next
        </Button>
      </Grid>
    </div>
  );
};

export default BulkUpload;
