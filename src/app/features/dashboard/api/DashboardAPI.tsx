import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000';

export const fetchOverallRatings = async () => {
    return axios.get(`${API_BASE_URL}/overall-ratings`);
};

export const fetchAssessorStats = async () => {
    return axios.get(`${API_BASE_URL}/assessor-stats`);
};

export const fetchFeedbackOverview = async () => {
    return axios.get(`${API_BASE_URL}/feedback-overview`);
};

export const fetchCategoryComparison = async () => {
    return axios.get(`${API_BASE_URL}/category-comparison`);
};
