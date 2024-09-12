
import React from 'react';
import { Box, Grid } from '@mui/material';
import OverallRatingsChart from '../overallRatingsChart/OverallRatingsChart';
import AssessorStats from '../assessorStats/AssessorStats';
import FeedbackOverview from '../FeedbackOverview/FeedbackOverview';
import CategoryComparisonRating from '../categoryComparisionRating/CategoryComparisionRating';

const Dashboard: React.FC = () => {
    return (
        <Box sx={{ p: 1 }}>
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
