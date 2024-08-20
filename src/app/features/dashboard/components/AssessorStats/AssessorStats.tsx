import React from 'react';
import { SampleData } from '../SampleData/SampleData';
import { Box, Typography } from '@mui/material';
import './AssessorStats.css';

const AssessorStats: React.FC = () => {
    const { totalAssessor, completed, inProgress, yetToStart } = SampleData.assessorStats;

    return (
        <Box className="assessor-stats">
            <Typography variant="h6" className="assessor-stats-title">Assessor Stats</Typography>
            <Box className="assessor-stats-container">
                <Box className="assessor-stats-item">
                    <Typography variant="h4" className="number">{totalAssessor}</Typography>
                    <Typography variant="body2" className="label">Total Assessor</Typography>
                </Box>
                <Box className="assessor-stats-item">
                    <Typography variant="h4" className="number">{completed}</Typography>
                    <Typography variant="body2" className="label">Completed</Typography>
                </Box>
                <Box className="assessor-stats-item">
                    <Typography variant="h4" className="number">{inProgress}</Typography>
                    <Typography variant="body2" className="label">In Progress</Typography>
                </Box>
                <Box className="assessor-stats-item">
                    <Typography variant="h4" className="number">{yetToStart}</Typography>
                    <Typography variant="body2" className="label">Yet to Start</Typography>
                </Box>
            </Box>
        </Box>
    );
};

export default AssessorStats;