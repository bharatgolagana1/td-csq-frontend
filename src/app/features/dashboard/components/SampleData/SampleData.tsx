export const SampleData = {
    overallRatings: {
        labels: ['SATS Airport Services Pvt LTD', 'Average Rating', 'Highest Rating'],
        values: [3.4, 3.2, 4.5]
    },
    assessorStats: {
        totalAssessor: 38,
        completed: 12,
        inProgress: 6,
        yetToStart: 20
    },
    feedbackOverview: {
        categories: ['Excellent', 'Very Good', 'Good', 'Fair', 'Poor', 'NA'],
        values: [50, 100, 150, 75, 125, 50]
    },
    categoryComparisonRating: {
        categories: ['General Airport Infrastructure', 'Technology', 'Process', 'Regulators', 'Others'],
        series: [
            {
                name: 'SATS Airport Services Pvt LTD',
                data: [2.4, 1.9, 4.1, 3.7, 2.5]
            },
            {
                name: 'Average Rating',
                data: [3.2, 2.8, 3.5, 3.1, 3.0]
            },
            {
                name: 'Highest Rating',
                data: [4.5, 4.2, 4.8, 4.6, 4.3]
            }
        ]
    }
};