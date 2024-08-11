import React from 'react';
import { Box, Grid } from '@mui/material';
import OverallRatingsChart from '../OverallRatingsChart/OverallRatingsChart';
import AssessorStats from '../AssessorStats/AssessorStats';
import FeedbackOverview from '../FeedbackOverview/FeedbackOverview';
import CategoryComparisonRating from '../CategoryComparisonRating/CategoryComparisonRating';

const Dashboard: React.FC = () => {
    return (
        <Box sx={{ p: 3 }}>
            <Grid container spacing={4}>
                <Grid item xs={4}>
                    <AssessorStats />
                </Grid>
                <Grid item xs={4}>
                    <OverallRatingsChart />
                </Grid>
                <Grid item xs={4}>
                    <FeedbackOverview />
                </Grid>
            </Grid>
            <Grid container spacing={2}>
                <Grid item xs={6}>
                    <CategoryComparisonRating/>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Dashboard;
